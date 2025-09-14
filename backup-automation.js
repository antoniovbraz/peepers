#!/usr/bin/env node

/**
 * Backup Automation Script for PEEPERS
 *
 * This script provides automated backup functionality for the PEEPERS application.
 * It can be run manually or scheduled via cron jobs.
 *
 * Usage:
 *   node backup-automation.js [command]
 *
 * Commands:
 *   full        - Create a full backup
 *   incremental - Create an incremental backup
 *   cleanup     - Clean up old backups
 *   list        - List all available backups
 *   schedule    - Set up automated backup schedule (requires cron)
 *
 * Environment Variables:
 *   VERCEL_URL - The Vercel deployment URL (default: https://peepers.vercel.app)
 */

const https = require('https');
const { exec } = require('child_process');
const path = require('path');

const VERCEL_URL = process.env.VERCEL_URL || 'https://peepers.vercel.app';
const BACKUP_API_URL = `${VERCEL_URL}/api/backup`;

class BackupAutomation {
  constructor() {
    this.baseUrl = BACKUP_API_URL;
  }

  /**
   * Make HTTP request to backup API
   */
  async makeRequest(method, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PEEPERS-Backup-Automation/1.0'
        }
      };

      const req = https.request(this.baseUrl, options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Create a full backup
   */
  async createFullBackup() {
    console.log('🚀 Creating full backup...');

    try {
      const response = await this.makeRequest('POST', { action: 'full' });

      if (response.success) {
        console.log('✅ Full backup created successfully!');
        console.log(`📦 Backup ID: ${response.data.backupId}`);
        console.log(`📅 Timestamp: ${new Date(response.data.timestamp).toLocaleString()}`);
        console.log(`📊 Data Types: ${response.data.dataTypes.join(', ')}`);
        console.log(`💾 Size: ${this.formatBytes(response.data.size)}`);
      } else {
        console.error('❌ Full backup failed:', response.data.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error creating full backup:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create an incremental backup
   */
  async createIncrementalBackup() {
    console.log('🔄 Creating incremental backup...');

    try {
      const response = await this.makeRequest('POST', { action: 'incremental' });

      if (response.success) {
        if (response.data.dataTypes.length === 0) {
          console.log('ℹ️  No changes detected, incremental backup skipped.');
        } else {
          console.log('✅ Incremental backup created successfully!');
          console.log(`📦 Backup ID: ${response.data.backupId}`);
          console.log(`📅 Timestamp: ${new Date(response.data.timestamp).toLocaleString()}`);
          console.log(`📊 Data Types: ${response.data.dataTypes.join(', ')}`);
          console.log(`💾 Size: ${this.formatBytes(response.data.size)}`);
        }
      } else {
        console.error('❌ Incremental backup failed:', response.data.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error creating incremental backup:', error.message);
      process.exit(1);
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    console.log('📋 Listing all backups...');

    try {
      const url = `${this.baseUrl}?action=list`;
      const response = await this.makeRequestToUrl(url, 'GET');

      if (response.success) {
        const backups = response.data;

        if (backups.length === 0) {
          console.log('ℹ️  No backups found.');
          return;
        }

        console.log(`📦 Found ${backups.length} backup(s):\n`);

        backups.forEach((backup, index) => {
          console.log(`${index + 1}. ${backup.id}`);
          console.log(`   Type: ${backup.type.toUpperCase()}`);
          console.log(`   Created: ${new Date(backup.timestamp).toLocaleString()}`);
          console.log(`   Size: ${this.formatBytes(backup.size)}`);
          console.log(`   Data Types: ${backup.dataTypes.join(', ')}`);
          console.log(`   Checksum: ${backup.checksum.substring(0, 16)}...`);
          console.log('');
        });
      } else {
        console.error('❌ Failed to list backups');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error listing backups:', error.message);
      process.exit(1);
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupBackups() {
    console.log('🧹 Cleaning up old backups...');

    try {
      // List all backups first
      const listUrl = `${this.baseUrl}?action=list`;
      const listResponse = await this.makeRequestToUrl(listUrl, 'GET');

      if (!listResponse.success) {
        console.error('❌ Failed to list backups for cleanup');
        process.exit(1);
      }

      const backups = listResponse.data;
      const fullBackups = backups.filter(b => b.type === 'full');
      const incrementalBackups = backups.filter(b => b.type === 'incremental');

      console.log(`📊 Current backups: ${fullBackups.length} full, ${incrementalBackups.length} incremental`);

      // Keep only last 5 full backups
      if (fullBackups.length > 5) {
        const toDelete = fullBackups.slice(5);
        console.log(`🗑️  Deleting ${toDelete.length} old full backup(s)...`);

        for (const backup of toDelete) {
          const deleteUrl = `${this.baseUrl}?backupId=${backup.id}`;
          await this.makeRequestToUrl(deleteUrl, 'DELETE');
          console.log(`   Deleted: ${backup.id}`);
        }
      }

      // Keep only last 3 incremental backups
      if (incrementalBackups.length > 3) {
        const toDelete = incrementalBackups.slice(3);
        console.log(`🗑️  Deleting ${toDelete.length} old incremental backup(s)...`);

        for (const backup of toDelete) {
          const deleteUrl = `${this.baseUrl}?backupId=${backup.id}`;
          await this.makeRequestToUrl(deleteUrl, 'DELETE');
          console.log(`   Deleted: ${backup.id}`);
        }
      }

      console.log('✅ Cleanup completed successfully!');
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
      process.exit(1);
    }
  }

  /**
   * Set up automated backup schedule using cron
   */
  setupSchedule() {
    console.log('⏰ Setting up automated backup schedule...');
    console.log('');
    console.log('To set up automated backups, add these lines to your crontab:');
    console.log('(Run `crontab -e` to edit your crontab)');
    console.log('');

    const scriptPath = path.resolve(__filename);

    console.log('# PEEPERS Automated Backups');
    console.log('# Full backup every day at 2 AM');
    console.log(`0 2 * * * cd ${path.dirname(scriptPath)} && node ${scriptPath} full`);
    console.log('');
    console.log('# Incremental backup every 6 hours');
    console.log(`0 */6 * * * cd ${path.dirname(scriptPath)} && node ${scriptPath} incremental`);
    console.log('');
    console.log('# Cleanup old backups weekly (Sundays at 3 AM)');
    console.log(`0 3 * * 0 cd ${path.dirname(scriptPath)} && node ${scriptPath} cleanup`);
    console.log('');
    console.log('Note: Make sure the script has execute permissions and required environment variables are set.');
  }

  /**
   * Make request to specific URL
   */
  async makeRequestToUrl(url, method, data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PEEPERS-Backup-Automation/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('🚀 PEEPERS Backup Automation Script');
    console.log('');
    console.log('Usage:');
    console.log('  node backup-automation.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  full        - Create a full backup');
    console.log('  incremental - Create an incremental backup');
    console.log('  cleanup     - Clean up old backups');
    console.log('  list        - List all available backups');
    console.log('  schedule    - Show cron schedule setup instructions');
    console.log('  help        - Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  VERCEL_URL  - The Vercel deployment URL (default: https://peepers.vercel.app)');
    console.log('');
    console.log('Examples:');
    console.log('  node backup-automation.js full');
    console.log('  node backup-automation.js list');
    console.log('  VERCEL_URL=https://my-app.vercel.app node backup-automation.js incremental');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const automation = new BackupAutomation();

  switch (command) {
    case 'full':
      await automation.createFullBackup();
      break;

    case 'incremental':
      await automation.createIncrementalBackup();
      break;

    case 'cleanup':
      await automation.cleanupBackups();
      break;

    case 'list':
      await automation.listBackups();
      break;

    case 'schedule':
      automation.setupSchedule();
      break;

    case 'help':
    default:
      automation.showHelp();
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = BackupAutomation;