import { NextRequest, NextResponse } from 'next/server';
import {
  createFullBackup,
  createIncrementalBackup,
  rollbackToBackup,
  listBackups,
  exportBackup,
  importBackup,
  type BackupResult,
  type RollbackResult,
  type BackupMetadata
} from '@/lib/backup';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'list': {
        const backups = await listBackups();
        return NextResponse.json({
          success: true,
          data: backups
        });
      }

      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use ?action=list'
        }, { status: 400 });
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Backup API GET error');
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, backupId, filePath } = body;

    switch (action) {
      case 'full': {
        const result: BackupResult = await createFullBackup();
        return NextResponse.json({
          success: result.success,
          data: result
        });
      }

      case 'incremental': {
        const result: BackupResult = await createIncrementalBackup();
        return NextResponse.json({
          success: result.success,
          data: result
        });
      }

      case 'rollback': {
        if (!backupId) {
          return NextResponse.json({
            success: false,
            error: 'backupId is required for rollback'
          }, { status: 400 });
        }

        const result: RollbackResult = await rollbackToBackup(backupId);
        return NextResponse.json({
          success: result.success,
          data: result
        });
      }

      case 'export': {
        if (!backupId) {
          return NextResponse.json({
            success: false,
            error: 'backupId is required for export'
          }, { status: 400 });
        }

        const exportPath = await exportBackup(backupId, filePath);
        return NextResponse.json({
          success: true,
          data: { exportPath }
        });
      }

      case 'import': {
        if (!filePath) {
          return NextResponse.json({
            success: false,
            error: 'filePath is required for import'
          }, { status: 400 });
        }

        const result: BackupResult = await importBackup(filePath);
        return NextResponse.json({
          success: result.success,
          data: result
        });
      }

      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use full, incremental, rollback, export, or import'
        }, { status: 400 });
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Backup API POST error');
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('backupId');

    if (!backupId) {
      return NextResponse.json({
        success: false,
        error: 'backupId parameter is required'
      }, { status: 400 });
    }

    // Import the delete function
    const { backupManager } = await import('@/lib/backup');
    const success = await backupManager.deleteBackup(backupId);

    return NextResponse.json({
      success,
      data: { backupId }
    });
  } catch (error) {
    logger.error({ err: error }, 'Backup API DELETE error');
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}