import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    PutBucketVersioningCommand,
    PutBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface UploadResult {
    location: string; // absolute file path or s3://bucket/key
    key: string; // local filename or S3 object key
    url?: string; // optional public URL
    storage: 'local' | 's3';
}

@Injectable()
export class StorageService {
    private readonly provider: 'local' | 's3';
    private readonly uploadDir: string;
    private s3?: S3Client;
    private s3Bucket?: string;
    private s3PublicBase?: string;
    private s3Prefix?: string;
    private s3SSE?: 'AES256' | 'aws:kms';
    private s3KMSKeyId?: string;

    constructor() {
        this.provider = (process.env.STORAGE_PROVIDER as any) === 's3' ? 's3' : 'local';
        this.uploadDir = path.join(process.cwd(), 'uploads');

        if (this.provider === 'local') {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        } else {
            const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1';
            this.s3Bucket = process.env.AWS_S3_BUCKET;
            this.s3PublicBase = process.env.AWS_S3_PUBLIC_URL_BASE;
            this.s3Prefix = process.env.AWS_S3_PREFIX || '';
            this.s3SSE = ((process.env.AWS_S3_SSE || 'AES256') as any);
            this.s3KMSKeyId = process.env.AWS_S3_KMS_KEY_ID;
            const forcePathStyle = (process.env.AWS_S3_FORCE_PATH_STYLE || 'false').toLowerCase() === 'true';
            this.s3 = new S3Client({
                region,
                forcePathStyle,
                endpoint: process.env.AWS_S3_ENDPOINT || undefined,
            });
            if (!this.s3Bucket) {
                throw new Error('AWS_S3_BUCKET is required when STORAGE_PROVIDER=s3');
            }
        }
    }


    private s3Key(key: string) {
        const prefix = (this.s3Prefix || '').replace(/^\/+|\/+$|/g, '');
        return prefix ? `${prefix}/${key}` : key;
    }

    async upload(buffer: Buffer, key: string, mimeType: string, isPublic = false): Promise<UploadResult> {
        if (this.provider === 'local') {
            const filename = key;
            const filePath = path.join(this.uploadDir, filename);
            await fs.promises.writeFile(filePath, buffer);
            return { location: filePath, key: filename, storage: 'local' };
        }

        const bucket = this.s3Bucket!;
        const s3Key = this.s3Key(key);
        const putCommand: any = {
            Bucket: bucket,
            Key: s3Key,
            Body: buffer,
            ContentType: mimeType,
            ACL: isPublic ? 'public-read' : undefined,
            ServerSideEncryption: this.s3SSE,
        };
        if (this.s3SSE === 'aws:kms' && this.s3KMSKeyId) {
            putCommand.SSEKMSKeyId = this.s3KMSKeyId;
        }
        await this.s3!.send(new PutObjectCommand(putCommand));

        const location = `s3://${bucket}/${s3Key}`;
        const url = this.s3PublicBase
            ? `${this.s3PublicBase.replace(/\/$/, '')}/${s3Key}`
            : `https://${bucket}.s3.${process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

        return { location, key: s3Key, url, storage: 's3' };
    }

    async getBuffer(keyOrPath: string): Promise<Buffer> {
        if (this.provider === 'local') {
            return await fs.promises.readFile(keyOrPath);
        }
        // keyOrPath may be s3://bucket/key or just key
        const match = keyOrPath.startsWith('s3://') ? keyOrPath.replace('s3://', '').split('/') : null;
        const bucket = match ? match.shift()! : this.s3Bucket!;
        const key = match ? match.join('/') : keyOrPath;
        const out = await this.s3!.send(
            new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        const stream = out.Body as Readable;
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }

    async getPresignedUrl(keyOrPath: string, expiresInSeconds = 300, contentDisposition?: string): Promise<string | null> {
        if (this.provider === 'local') {
            return null;
        }
        const match = keyOrPath.startsWith('s3://') ? keyOrPath.replace('s3://', '').split('/') : null;
        const bucket = match ? match.shift()! : this.s3Bucket!;
        const key = match ? match.join('/') : keyOrPath;
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: contentDisposition,
        });
        const url = await getSignedUrl(this.s3!, command, { expiresIn: expiresInSeconds });
        return url;
    }

    async delete(keyOrPath: string): Promise<void> {
        if (this.provider === 'local') {
            try {
                await fs.promises.unlink(keyOrPath);
            } catch {
                // ignore
            }
            return;
        }
        const match = keyOrPath.startsWith('s3://') ? keyOrPath.replace('s3://', '').split('/') : null;
        const bucket = match ? match.shift()! : this.s3Bucket!;
        const key = match ? match.join('/') : keyOrPath;
        await this.s3!.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }

    async setupBucketPolicies(): Promise<void> {
        if (this.provider !== 's3' || !this.s3) return;

        const bucket = this.s3Bucket!;
        const enableVersioning = (process.env.AWS_S3_VERSIONING || 'false').toLowerCase() === 'true';
        const lifecycleEnabled = (process.env.AWS_S3_LIFECYCLE || 'false').toLowerCase() === 'true';
        const lifecycleExpiryDays = parseInt(process.env.AWS_S3_LIFECYCLE_EXPIRY_DAYS || '365', 10);
        const archiveAfterDays = parseInt(process.env.AWS_S3_ARCHIVE_AFTER_DAYS || '90', 10);

        // Enable versioning
        if (enableVersioning) {
            try {
                await this.s3.send(
                    new PutBucketVersioningCommand({
                        Bucket: bucket,
                        VersioningConfiguration: { Status: 'Enabled' },
                    }),
                );
                console.log(`✓ Versioning enabled for bucket ${bucket}`);
            } catch (error) {
                console.error(`Failed to enable versioning: ${error}`);
            }
        }

        // Configure lifecycle policy
        if (lifecycleEnabled) {
            try {
                await this.s3.send(
                    new PutBucketLifecycleConfigurationCommand({
                        Bucket: bucket,
                        LifecycleConfiguration: {
                            Rules: [
                                {
                                    ID: 'archive-old-versions',
                                    Status: 'Enabled',
                                    NoncurrentVersionTransitions: [
                                        {
                                            NoncurrentDays: archiveAfterDays,
                                            StorageClass: 'GLACIER',
                                        },
                                    ],
                                    NoncurrentVersionExpiration: {
                                        NoncurrentDays: lifecycleExpiryDays,
                                    },
                                },
                                {
                                    ID: 'expire-current-versions',
                                    Status: 'Enabled',
                                    Prefix: `${this.s3Prefix || ''}`,
                                    Expiration: { Days: lifecycleExpiryDays * 2 },
                                },
                            ],
                        },
                    }),
                );
                console.log(`✓ Lifecycle policy configured for bucket ${bucket}`);
            } catch (error) {
                console.error(`Failed to configure lifecycle: ${error}`);
            }
        }
    }
}
