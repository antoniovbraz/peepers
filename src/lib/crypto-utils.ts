import crypto from 'crypto';

// Server-side crypto utilities (Node)
export function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function randomBytes(size: number): Buffer {
  return crypto.randomBytes(size);
}

export function sha256(data: string | Buffer): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}
