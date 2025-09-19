import { getKVClient } from '@/lib/cache';
import { logger } from '@/lib/logger';

export type JobType = 'ml:webhook:orders' | 'ml:webhook:items' | 'ml:webhook:generic';

export interface Job<T = unknown> {
  id: string;
  type: JobType;
  payload: T;
  createdAt: string;
  attempts: number;
}

const QUEUE_KEY = 'jobs:ml:webhooks';

export async function enqueueJob<T>(type: JobType, payload: T): Promise<string> {
  try {
    const kv = getKVClient();
    const job: Job<T> = {
      id: `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    await kv.lpush(QUEUE_KEY, JSON.stringify(job));
    // Keep queue bounded to 10k entries
    await kv.ltrim(QUEUE_KEY, 0, 9999);
    return job.id;
  } catch (error) {
    logger.error({ error, type }, 'Failed to enqueue job');
    throw error;
  }
}

export async function dequeueJob<T>(): Promise<Job<T> | null> {
  try {
    const kv = getKVClient();
    const raw = await kv.rpop(QUEUE_KEY);
    if (!raw) return null;
    return JSON.parse(raw as string) as Job<T>;
  } catch (error) {
    logger.error({ error }, 'Failed to dequeue job');
    return null;
  }
}

export async function queueSize(): Promise<number> {
  try {
    const kv = getKVClient();
    return (await kv.llen(QUEUE_KEY)) as number;
  } catch {
    return 0;
  }
}

export async function processOneJob<T = unknown>(handlers: Partial<Record<JobType, (job: Job<T>) => Promise<void>>>): Promise<boolean> {
  const job = await dequeueJob<T>();
  if (!job) return false;
  const handler = handlers[job.type];
  if (!handler) return true; // drop unknown types quietly
  try {
    await handler(job);
  } catch (error) {
    // Simple retry: requeue with limited attempts
    if (job.attempts < 3) {
      job.attempts += 1;
      await enqueueJob(job.type, job.payload);
    } else {
      logger.error({ jobId: job.id, error }, 'Job failed after max attempts');
    }
  }
  return true;
}
