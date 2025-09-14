import { kv } from '@vercel/kv';
import { logger } from './logger';
import { cache } from './cache';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental';
  dataTypes: string[];
  size: number;
  checksum: string;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: string;
  dataTypes: string[];
  size: number;
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  backupId: string;
  timestamp: string;
  dataTypes: string[];
  error?: string;
}

class BackupManager {
  private readonly BACKUP_PREFIX = 'backup:';
  private readonly BACKUP_METADATA_PREFIX = 'backup_meta:';
  private readonly MAX_BACKUPS = 10;
  private readonly BACKUP_DIR = path.join(process.cwd(), 'backups');

  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error({ err: error }, 'Failed to create backup directory');
    }
  }

  private get backupDir(): string {
    return this.BACKUP_DIR;
  }

  /**
   * Creates a full backup of all cached data
   */
  async createFullBackup(): Promise<BackupResult> {
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      logger.info({ backupId }, 'Starting full backup');

      // Get all cache data
      const cacheStats = await cache.getCacheStats();
      const allData = await this.collectAllCacheData();

      // Create backup data structure
      const backupData = {
        metadata: {
          id: backupId,
          timestamp,
          type: 'full' as const,
          dataTypes: Object.keys(allData),
          size: JSON.stringify(allData).length,
          checksum: this.generateChecksum(allData)
        },
        data: allData
      };

      // Store backup in Redis
      await kv.set(`${this.BACKUP_PREFIX}${backupId}`, backupData, { ex: 30 * 24 * 60 * 60 }); // 30 days

      // Store metadata separately for listing
      await kv.set(`${this.BACKUP_METADATA_PREFIX}${backupId}`, backupData.metadata, { ex: 30 * 24 * 60 * 60 });

      // Clean up old backups
      await this.cleanupOldBackups();

      logger.info({
        backupId,
        dataTypes: backupData.metadata.dataTypes,
        size: backupData.metadata.size
      }, 'Full backup completed successfully');

      return {
        success: true,
        backupId,
        timestamp,
        dataTypes: backupData.metadata.dataTypes,
        size: backupData.metadata.size
      };

    } catch (error) {
      logger.error({ err: error, backupId }, 'Full backup failed');

      return {
        success: false,
        backupId,
        timestamp,
        dataTypes: [],
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Creates an incremental backup of recently changed data
   */
  async createIncrementalBackup(): Promise<BackupResult> {
    const backupId = `incremental_${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      logger.info({ backupId }, 'Starting incremental backup');

      // Get data changed since last backup
      const lastBackup = await this.getLastBackup();
      const changedData = await this.collectChangedData(lastBackup?.timestamp);

      if (Object.keys(changedData).length === 0) {
        logger.info({ backupId }, 'No changes detected, skipping incremental backup');
        return {
          success: true,
          backupId,
          timestamp,
          dataTypes: [],
          size: 0
        };
      }

      // Create backup data structure
      const backupData = {
        metadata: {
          id: backupId,
          timestamp,
          type: 'incremental' as const,
          dataTypes: Object.keys(changedData),
          size: JSON.stringify(changedData).length,
          checksum: this.generateChecksum(changedData)
        },
        data: changedData
      };

      // Store backup in Redis
      await kv.set(`${this.BACKUP_PREFIX}${backupId}`, backupData, { ex: 7 * 24 * 60 * 60 }); // 7 days

      // Store metadata
      await kv.set(`${this.BACKUP_METADATA_PREFIX}${backupId}`, backupData.metadata, { ex: 7 * 24 * 60 * 60 });

      // Clean up old incremental backups
      await this.cleanupOldIncrementalBackups();

      logger.info({
        backupId,
        dataTypes: backupData.metadata.dataTypes,
        size: backupData.metadata.size
      }, 'Incremental backup completed successfully');

      return {
        success: true,
        backupId,
        timestamp,
        dataTypes: backupData.metadata.dataTypes,
        size: backupData.metadata.size
      };

    } catch (error) {
      logger.error({ err: error, backupId }, 'Incremental backup failed');

      return {
        success: false,
        backupId,
        timestamp,
        dataTypes: [],
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Rolls back to a specific backup
   */
  async rollbackToBackup(backupId: string): Promise<RollbackResult> {
    try {
      logger.info({ backupId }, 'Starting rollback');

      // Get backup data
      const backupData = await kv.get(`${this.BACKUP_PREFIX}${backupId}`) as any;

      if (!backupData) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Validate backup integrity
      const calculatedChecksum = this.generateChecksum(backupData.data);
      if (calculatedChecksum !== backupData.metadata.checksum) {
        throw new Error(`Backup ${backupId} integrity check failed`);
      }

      // Clear current cache
      await cache.clearAllCache();

      // Restore data
      await this.restoreCacheData(backupData.data);

      logger.info({
        backupId,
        dataTypes: backupData.metadata.dataTypes
      }, 'Rollback completed successfully');

      return {
        success: true,
        backupId,
        timestamp: backupData.metadata.timestamp,
        dataTypes: backupData.metadata.dataTypes
      };

    } catch (error) {
      logger.error({ err: error, backupId }, 'Rollback failed');

      return {
        success: false,
        backupId,
        timestamp: new Date().toISOString(),
        dataTypes: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Lists all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const keys = await this.collectKeys(`${this.BACKUP_METADATA_PREFIX}*`);
      const backups: BackupMetadata[] = [];

      for (const key of keys) {
        const metadata = await kv.get(key) as BackupMetadata;
        if (metadata) {
          backups.push(metadata);
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      logger.error({ err: error }, 'Failed to list backups');
      return [];
    }
  }

  /**
   * Deletes a specific backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      await Promise.all([
        kv.del(`${this.BACKUP_PREFIX}${backupId}`),
        kv.del(`${this.BACKUP_METADATA_PREFIX}${backupId}`)
      ]);

      logger.info({ backupId }, 'Backup deleted successfully');
      return true;

    } catch (error) {
      logger.error({ err: error, backupId }, 'Failed to delete backup');
      return false;
    }
  }

  /**
   * Exports backup to file system
   */
  async exportBackup(backupId: string, filePath?: string): Promise<string> {
    try {
      const backupData = await kv.get(`${this.BACKUP_PREFIX}${backupId}`) as any;

      if (!backupData) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const exportPath = filePath || path.join(this.backupDir, `${backupId}.json`);
      await fs.writeFile(exportPath, JSON.stringify(backupData, null, 2), 'utf-8');

      logger.info({ backupId, exportPath }, 'Backup exported successfully');
      return exportPath;

    } catch (error) {
      logger.error({ err: error, backupId }, 'Failed to export backup');
      throw error;
    }
  }

  /**
   * Imports backup from file system
   */
  async importBackup(filePath: string): Promise<BackupResult> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const backupData = JSON.parse(fileContent);

      // Validate backup structure
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Invalid backup file structure');
      }

      const backupId = `imported_${Date.now()}`;

      // Store imported backup
      await kv.set(`${this.BACKUP_PREFIX}${backupId}`, backupData, { ex: 30 * 24 * 60 * 60 });
      await kv.set(`${this.BACKUP_METADATA_PREFIX}${backupId}`, backupData.metadata, { ex: 30 * 24 * 60 * 60 });

      logger.info({ backupId, filePath }, 'Backup imported successfully');

      return {
        success: true,
        backupId,
        timestamp: backupData.metadata.timestamp,
        dataTypes: backupData.metadata.dataTypes,
        size: backupData.metadata.size
      };

    } catch (error) {
      logger.error({ err: error, filePath }, 'Failed to import backup');

      return {
        success: false,
        backupId: '',
        timestamp: new Date().toISOString(),
        dataTypes: [],
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private async collectAllCacheData(): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    // Collect all cache keys
    const patterns = ['products:*', 'questions:*', 'user:*', 'categories:*', 'sync:*'];

    for (const pattern of patterns) {
      const keys = await this.collectKeys(pattern);
      for (const key of keys) {
        const value = await kv.get(key);
        if (value !== null) {
          data[key] = value;
        }
      }
    }

    return data;
  }

  private async collectChangedData(since?: string): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    // For incremental backups, we need to track changes
    // This is a simplified implementation - in production you'd want change tracking
    const patterns = ['products:*', 'questions:*', 'user:*'];

    for (const pattern of patterns) {
      const keys = await this.collectKeys(pattern);
      for (const key of keys) {
        const value = await kv.get(key);
        if (value !== null) {
          // Check if this is newer than the since timestamp
          if (since && this.isNewerThan(value, since)) {
            data[key] = value;
          } else if (!since) {
            data[key] = value;
          }
        }
      }
    }

    return data;
  }

  private isNewerThan(data: any, timestamp: string): boolean {
    // Check various timestamp fields that might exist in cached data
    const possibleFields = ['cached_at', 'timestamp', 'updated_at', 'created_at'];

    for (const field of possibleFields) {
      if (data[field] && new Date(data[field]) > new Date(timestamp)) {
        return true;
      }
    }

    return false;
  }

  private async restoreCacheData(data: Record<string, any>): Promise<void> {
    const promises: Promise<any>[] = [];

    for (const [key, value] of Object.entries(data)) {
      promises.push(kv.set(key, value));
    }

    await Promise.all(promises);
  }

  private async collectKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    for await (const key of kv.scanIterator({ match: pattern })) {
      keys.push(key);
    }
    return keys;
  }

  private generateChecksum(data: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  private async getLastBackup(): Promise<BackupMetadata | null> {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    const fullBackups = backups.filter(b => b.type === 'full');

    if (fullBackups.length > this.MAX_BACKUPS) {
      const toDelete = fullBackups.slice(this.MAX_BACKUPS);
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    }
  }

  private async cleanupOldIncrementalBackups(): Promise<void> {
    const backups = await this.listBackups();
    const incrementalBackups = backups.filter(b => b.type === 'incremental');

    // Keep only last 5 incremental backups
    if (incrementalBackups.length > 5) {
      const toDelete = incrementalBackups.slice(5);
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    }
  }
}

// Export singleton instance
export const backupManager = new BackupManager();

// Helper functions for common operations
export async function createFullBackup(): Promise<BackupResult> {
  return await backupManager.createFullBackup();
}

export async function createIncrementalBackup(): Promise<BackupResult> {
  return await backupManager.createIncrementalBackup();
}

export async function rollbackToBackup(backupId: string): Promise<RollbackResult> {
  return await backupManager.rollbackToBackup(backupId);
}

export async function listBackups(): Promise<BackupMetadata[]> {
  return await backupManager.listBackups();
}

export async function exportBackup(backupId: string, filePath?: string): Promise<string> {
  return await backupManager.exportBackup(backupId, filePath);
}

export async function importBackup(filePath: string): Promise<BackupResult> {
  return await backupManager.importBackup(filePath);
}