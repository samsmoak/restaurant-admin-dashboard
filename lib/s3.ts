import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type UploadPrefix = 'logos' | 'menu-images';

export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_S3_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_new_rotated_access_key'
  );
}

let cached: S3Client | null = null;

export function getS3Client(): S3Client {
  if (cached) return cached;
  cached = new S3Client({
    region: process.env.AWS_S3_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  return cached;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function buildObjectKey(
  prefix: UploadPrefix,
  filename: string
): string {
  const dot = filename.lastIndexOf('.');
  const ext =
    dot >= 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : 'bin';
  const safeExt = ext.length > 0 && ext.length <= 5 ? ext : 'bin';
  return `${prefix}/${Date.now()}-${randomSuffix()}.${safeExt}`;
}

export function publicUrlFor(key: string): string {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (base) return `${base}/${key}`;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_S3_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function makePresignedPutUrl(
  key: string,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 60 });
}

export async function putObject(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}
