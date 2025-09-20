/**
 * Migration Strategy - Peepers Enterprise v2.0.0
 * Data migration for multi-tenant architecture transition
 */

import { kv } from '@vercel/kv';
import { TenantService } from './tenant-service';
import { PeepersPlanId } from '../config/pricing';

// Migration status tracking
export interface MigrationStatus {
  id: string;
  phase: MigrationPhase;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  progress: {
    total_items: number;
    processed_items: number;
    failed_items: number;
  };
}

export type MigrationPhase =
  | 'assessment'
  | 'backup'
  | 'tenant_creation'
  | 'user_migration'
  | 'data_migration'
  | 'permission_migration'
  | 'validation'
  | 'cleanup';

export class MigrationManager {
  private static readonly MIGRATION_STATUS_KEY = 'migration:status';
  private static readonly BACKUP_PREFIX = 'backup:migration:';

  /**
   * Start the complete migration process
   */
  static async startMigration(): Promise<void> {
    console.log('🚀 Starting Peepers Multi-Tenant Migration...');

    const phases: MigrationPhase[] = [
      'assessment',
      'backup',
      'tenant_creation',
      'user_migration',
      'data_migration',
      'permission_migration',
      'validation',
      'cleanup'
    ];

    for (const phase of phases) {
      await this.executePhase(phase);
    }

    console.log('✅ Migration completed successfully!');
  }

  /**
   * Execute a specific migration phase
   */
  private static async executePhase(phase: MigrationPhase): Promise<void> {
    console.log(`📋 Executing phase: ${phase}`);

    const status = await this.getMigrationStatus(phase);
    if (status?.status === 'completed') {
      console.log(`⏭️  Phase ${phase} already completed, skipping...`);
      return;
    }

    await this.updateMigrationStatus(phase, 'in_progress');

    try {
      switch (phase) {
        case 'assessment':
          await this.assessCurrentData();
          break;
        case 'backup':
          await this.createBackup();
          break;
        case 'tenant_creation':
          await this.createDefaultTenant();
          break;
        case 'user_migration':
          await this.migrateUsers();
          break;
        case 'data_migration':
          await this.migrateData();
          break;
        case 'permission_migration':
          await this.migratePermissions();
          break;
        case 'validation':
          await this.validateMigration();
          break;
        case 'cleanup':
          await this.cleanupMigration();
          break;
      }

      await this.updateMigrationStatus(phase, 'completed');
      console.log(`✅ Phase ${phase} completed successfully`);

    } catch (error) {
      console.error(`❌ Phase ${phase} failed:`, error);
      await this.updateMigrationStatus(phase, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Phase 1: Assess current data structure
   */
  private static async assessCurrentData(): Promise<void> {
    console.log('🔍 Assessing current data structure...');

    // Check for existing users, products, orders, etc.
    const existingKeys = await kv.keys('*');
    const dataAssessment = {
      total_keys: existingKeys.length,
      user_keys: existingKeys.filter(k => k.includes('user')).length,
      product_keys: existingKeys.filter(k => k.includes('product')).length,
      order_keys: existingKeys.filter(k => k.includes('order')).length,
      cache_keys: existingKeys.filter(k => k.includes('cache')).length,
      other_keys: existingKeys.filter(k => !k.includes('user') && !k.includes('product') && !k.includes('order') && !k.includes('cache')).length
    };

    console.log('📊 Data assessment:', dataAssessment);

    // Store assessment results
    await kv.set(`${this.BACKUP_PREFIX}assessment`, JSON.stringify({
      timestamp: new Date().toISOString(),
      assessment: dataAssessment
    }));
  }

  /**
   * Phase 2: Create backup of all data
   */
  private static async createBackup(): Promise<void> {
    console.log('💾 Creating data backup...');

    const allKeys = await kv.keys('*');
    const backup: Record<string, unknown> = {};

    for (const key of allKeys) {
      // Skip migration-related keys
      if (key.startsWith('migration:') || key.startsWith('backup:migration:')) {
        continue;
      }

      try {
        const value = await kv.get(key);
        if (value !== null) {
          backup[key] = value;
        }
      } catch (error) {
        console.warn(`Failed to backup key ${key}:`, error);
      }
    }

    // Store backup
    await kv.set(`${this.BACKUP_PREFIX}data`, JSON.stringify({
      timestamp: new Date().toISOString(),
      data: backup
    }));

    console.log(`💾 Backup created with ${Object.keys(backup).length} keys`);
  }

  /**
   * Phase 3: Create default tenant for existing data
   */
  private static async createDefaultTenant(): Promise<void> {
    console.log('🏢 Creating default tenant...');

    // Create a default tenant for existing users
    const defaultTenant = await TenantService.createTenant({
      name: 'Peepers Default',
      slug: 'default',
      plan_id: 'starter' as PeepersPlanId
    }, 'system');

    console.log(`🏢 Created default tenant: ${defaultTenant.id}`);

    // Store default tenant ID for migration reference
    await kv.set('migration:default_tenant_id', defaultTenant.id);
  }

  /**
   * Phase 4: Migrate existing users to tenant
   */
  private static async migrateUsers(): Promise<void> {
    console.log('👥 Migrating users to tenant...');

    const defaultTenantId = await kv.get<string>('migration:default_tenant_id');
    if (!defaultTenantId) {
      throw new Error('Default tenant not found');
    }

    // Find existing user keys
    const userKeys = await kv.keys('user:*');
    let migratedCount = 0;

    for (const userKey of userKeys) {
      try {
        const userData = await kv.get<string>(userKey);
        if (!userData) continue;

        const user = JSON.parse(userData);

        // Create tenant user
        await TenantService.createTenantUser(defaultTenantId, user.id, 'owner');

        // Update user data to include tenant_id
        const updatedUser = { ...user, tenant_id: defaultTenantId };
        await kv.set(userKey, JSON.stringify(updatedUser));

        migratedCount++;
      } catch (error) {
        console.warn(`Failed to migrate user ${userKey}:`, error);
      }
    }

    console.log(`👥 Migrated ${migratedCount} users to tenant`);
  }

  /**
   * Phase 5: Migrate data to tenant-scoped structure
   */
  private static async migrateData(): Promise<void> {
    console.log('📦 Migrating data to tenant-scoped structure...');

    const defaultTenantId = await kv.get<string>('migration:default_tenant_id');
    if (!defaultTenantId) {
      throw new Error('Default tenant not found');
    }

    // Migrate products
    await this.migrateProducts(defaultTenantId);

    // Migrate orders
    await this.migrateOrders(defaultTenantId);

    // Migrate analytics
    await this.migrateAnalytics(defaultTenantId);

    console.log('📦 Data migration completed');
  }

  /**
   * Phase 6: Migrate permissions and entitlements
   */
  private static async migratePermissions(): Promise<void> {
    console.log('🔐 Migrating permissions and entitlements...');

    const defaultTenantId = await kv.get<string>('migration:default_tenant_id');
    if (!defaultTenantId) {
      throw new Error('Default tenant not found');
    }

    // Update tenant usage based on migrated data
    const tenant = await TenantService.getTenant(defaultTenantId);
    if (tenant) {
      // This would be populated based on actual migrated data counts
      await TenantService.updateTenantUsage(defaultTenantId, {
        products_count: 0, // Would be calculated from migrated products
        api_calls_today: 0
      });
    }

    console.log('🔐 Permission migration completed');
  }

  /**
   * Phase 7: Validate migration results
   */
  private static async validateMigration(): Promise<void> {
    console.log('✅ Validating migration results...');

    const defaultTenantId = await kv.get<string>('migration:default_tenant_id');
    if (!defaultTenantId) {
      throw new Error('Default tenant not found');
    }

    // Validate tenant exists
    const tenant = await TenantService.getTenant(defaultTenantId);
    if (!tenant) {
      throw new Error('Default tenant validation failed');
    }

    // Validate users were migrated
    const tenantUsers = await TenantService.getTenantUsers(defaultTenantId);
    if (tenantUsers.length === 0) {
      throw new Error('No users found in default tenant');
    }

    console.log(`✅ Validation passed: ${tenantUsers.length} users in tenant`);
  }

  /**
   * Phase 8: Cleanup migration artifacts
   */
  private static async cleanupMigration(): Promise<void> {
    console.log('🧹 Cleaning up migration artifacts...');

    // Remove migration status keys
    const migrationKeys = await kv.keys('migration:*');
    for (const key of migrationKeys) {
      await kv.del(key);
    }

    // Keep backup for 30 days, then it can be manually cleaned up
    console.log('🧹 Migration cleanup completed');
  }

  // Helper methods
  private static async migrateProducts(tenantId: string): Promise<void> {
    const productKeys = await kv.keys('product:*');
    let migratedCount = 0;

    for (const productKey of productKeys) {
      try {
        const productData = await kv.get<string>(productKey);
        if (!productData) continue;

        const product = JSON.parse(productData);

        // Create tenant-scoped product key
        const tenantProductKey = `tenant_products:${tenantId}:${product.id}`;
        const tenantProduct = {
          ...product,
          tenant_id: tenantId
        };

        await kv.set(tenantProductKey, JSON.stringify(tenantProduct));
        migratedCount++;
      } catch (error) {
        console.warn(`Failed to migrate product ${productKey}:`, error);
      }
    }

    console.log(`📦 Migrated ${migratedCount} products`);
  }

  private static async migrateOrders(tenantId: string): Promise<void> {
    const orderKeys = await kv.keys('order:*');
    let migratedCount = 0;

    for (const orderKey of orderKeys) {
      try {
        const orderData = await kv.get<string>(orderKey);
        if (!orderData) continue;

        const order = JSON.parse(orderData);

        // Create tenant-scoped order key
        const tenantOrderKey = `tenant_orders:${tenantId}:${order.id}`;
        const tenantOrder = {
          ...order,
          tenant_id: tenantId
        };

        await kv.set(tenantOrderKey, JSON.stringify(tenantOrder));
        migratedCount++;
      } catch (error) {
        console.warn(`Failed to migrate order ${orderKey}:`, error);
      }
    }

    console.log(`📦 Migrated ${migratedCount} orders`);
  }

  private static async migrateAnalytics(tenantId: string): Promise<void> {
    const analyticsKeys = await kv.keys('analytics:*');
    let migratedCount = 0;

    for (const analyticsKey of analyticsKeys) {
      try {
        const analyticsData = await kv.get<string>(analyticsKey);
        if (!analyticsData) continue;

        const analytics = JSON.parse(analyticsData);

        // Create tenant-scoped analytics key
        const tenantAnalyticsKey = `tenant_analytics:${tenantId}:${analytics.id || Date.now()}`;
        const tenantAnalytics = {
          ...analytics,
          tenant_id: tenantId
        };

        await kv.set(tenantAnalyticsKey, JSON.stringify(tenantAnalytics));
        migratedCount++;
      } catch (error) {
        console.warn(`Failed to migrate analytics ${analyticsKey}:`, error);
      }
    }

    console.log(`📦 Migrated ${migratedCount} analytics records`);
  }

  private static async getMigrationStatus(phase: MigrationPhase): Promise<MigrationStatus | null> {
    const status = await kv.get<string>(`${this.MIGRATION_STATUS_KEY}:${phase}`);
    return status ? JSON.parse(status) : null;
  }

  private static async updateMigrationStatus(
    phase: MigrationPhase,
    status: MigrationStatus['status'],
    errorMessage?: string
  ): Promise<void> {
    const migrationStatus: MigrationStatus = {
      id: `migration_${phase}`,
      phase,
      status,
      started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      error_message: errorMessage,
      progress: {
        total_items: 0,
        processed_items: 0,
        failed_items: 0
      }
    };

    await kv.set(`${this.MIGRATION_STATUS_KEY}:${phase}`, JSON.stringify(migrationStatus));
  }

  /**
   * Rollback migration in case of failure
   */
  static async rollbackMigration(): Promise<void> {
    console.log('🔄 Rolling back migration...');

    // Restore from backup
    const backupData = await kv.get<string>(`${this.BACKUP_PREFIX}data`);
    if (backupData) {
      const { data } = JSON.parse(backupData);

      for (const [key, value] of Object.entries(data)) {
        await kv.set(key, value);
      }
    }

    // Clean up migration artifacts
    const migrationKeys = await kv.keys('migration:*');
    for (const key of migrationKeys) {
      await kv.del(key);
    }

    console.log('🔄 Migration rollback completed');
  }

  /**
   * Get migration progress
   */
  static async getMigrationProgress(): Promise<Record<MigrationPhase, MigrationStatus | null>> {
    const phases: MigrationPhase[] = [
      'assessment',
      'backup',
      'tenant_creation',
      'user_migration',
      'data_migration',
      'permission_migration',
      'validation',
      'cleanup'
    ];

    const progress: Record<MigrationPhase, MigrationStatus | null> = {} as Record<MigrationPhase, MigrationStatus | null>;

    for (const phase of phases) {
      progress[phase] = await this.getMigrationStatus(phase);
    }

    return progress;
  }
}