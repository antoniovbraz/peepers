'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface BackupMetadata {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental';
  dataTypes: string[];
  size: number;
  checksum: string;
}

interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: string;
  dataTypes: string[];
  size: number;
  error?: string;
}

interface RollbackResult {
  success: boolean;
  backupId: string;
  timestamp: string;
  dataTypes: string[];
  error?: string;
}

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<string>('');
  const [lastResult, setLastResult] = useState<BackupResult | RollbackResult | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/backup?action=list');
      const result = await response.json();

      if (result.success) {
        setBackups(result.data);
      } else {
        logger.error({ error: result.error }, 'Failed to load backups');
      }
    } catch (error) {
      logger.error({ err: error }, 'Error loading backups');
    }
  };

  const createBackup = async (type: 'full' | 'incremental') => {
    setLoading(true);
    setOperation(`Creating ${type} backup...`);

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: type })
      });

      const result = await response.json();
      setLastResult(result.data);

      if (result.success) {
        await loadBackups(); // Refresh the list
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} backup created successfully!`);
      } else {
        alert(`Backup failed: ${result.data.error}`);
      }
    } catch (error) {
      logger.error({ err: error }, 'Error creating backup');
      alert('Error creating backup');
    } finally {
      setLoading(false);
      setOperation('');
    }
  };

  const rollbackToBackup = async (backupId: string) => {
    if (!confirm(`Are you sure you want to rollback to backup ${backupId}? This will replace all current data.`)) {
      return;
    }

    setLoading(true);
    setOperation('Rolling back...');

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', backupId })
      });

      const result = await response.json();
      setLastResult(result.data);

      if (result.success) {
        alert('Rollback completed successfully!');
        await loadBackups(); // Refresh the list
      } else {
        alert(`Rollback failed: ${result.data.error}`);
      }
    } catch (error) {
      logger.error({ err: error }, 'Error during rollback');
      alert('Error during rollback');
    } finally {
      setLoading(false);
      setOperation('');
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm(`Are you sure you want to delete backup ${backupId}?`)) {
      return;
    }

    setLoading(true);
    setOperation('Deleting backup...');

    try {
      const response = await fetch(`/api/backup?backupId=${backupId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadBackups(); // Refresh the list
        alert('Backup deleted successfully!');
      } else {
        alert('Failed to delete backup');
      }
    } catch (error) {
      logger.error({ err: error }, 'Error deleting backup');
      alert('Error deleting backup');
    } finally {
      setLoading(false);
      setOperation('');
    }
  };

  const exportBackup = async (backupId: string) => {
    setLoading(true);
    setOperation('Exporting backup...');

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', backupId })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Backup exported to: ${result.data.exportPath}`);
      } else {
        alert('Failed to export backup');
      }
    } catch (error) {
      logger.error({ err: error }, 'Error exporting backup');
      alert('Error exporting backup');
    } finally {
      setLoading(false);
      setOperation('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Backup & Rollback Manager</h2>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => createBackup('full')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Full Backup
        </button>

        <button
          onClick={() => createBackup('incremental')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Incremental Backup
        </button>

        <button
          onClick={loadBackups}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Refresh List
        </button>
      </div>

      {/* Loading/Operation Status */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">{operation}</p>
        </div>
      )}

      {/* Last Operation Result */}
      {lastResult && (
        <div className={`mb-4 p-4 border rounded ${
          lastResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">
            {lastResult.success ? '✓ Operation Successful' : '✗ Operation Failed'}
          </h3>
          <div className="text-sm space-y-1">
            <p><strong>Backup ID:</strong> {lastResult.backupId}</p>
            <p><strong>Timestamp:</strong> {formatDate(lastResult.timestamp)}</p>
            {lastResult.dataTypes && lastResult.dataTypes.length > 0 && (
              <p><strong>Data Types:</strong> {lastResult.dataTypes.join(', ')}</p>
            )}
            {'size' in lastResult && <p><strong>Size:</strong> {formatSize(lastResult.size)}</p>}
            {lastResult.error && <p className="text-red-600"><strong>Error:</strong> {lastResult.error}</p>}
          </div>
        </div>
      )}

      {/* Backups List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Available Backups ({backups.length})</h3>
        </div>

        {backups.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No backups found. Create your first backup to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {backups.map((backup) => (
              <div key={backup.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-800">{backup.id}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        backup.type === 'full'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Created:</span>
                        <br />
                        {formatDate(backup.timestamp)}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span>
                        <br />
                        {formatSize(backup.size)}
                      </div>
                      <div>
                        <span className="font-medium">Data Types:</span>
                        <br />
                        {backup.dataTypes.length} types
                      </div>
                      <div>
                        <span className="font-medium">Checksum:</span>
                        <br />
                        {backup.checksum.substring(0, 8)}...
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Data Types:</strong> {backup.dataTypes.join(', ')}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => rollbackToBackup(backup.id)}
                      disabled={loading}
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Rollback to this backup"
                    >
                      Rollback
                    </button>

                    <button
                      onClick={() => exportBackup(backup.id)}
                      disabled={loading}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export backup to file"
                    >
                      Export
                    </button>

                    <button
                      onClick={() => deleteBackup(backup.id)}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete this backup"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">Backup Information</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Full Backups:</strong> Complete snapshot of all cached data</li>
          <li>• <strong>Incremental Backups:</strong> Only data changed since last backup</li>
          <li>• <strong>Rollback:</strong> Restores system to the selected backup state</li>
          <li>• <strong>Retention:</strong> Full backups kept for 30 days, incremental for 7 days</li>
          <li>• <strong>Automatic Cleanup:</strong> Old backups are automatically removed</li>
        </ul>
      </div>
    </div>
  );
}