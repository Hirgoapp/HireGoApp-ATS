import { Injectable } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
    private baseUploadPath = path.join(process.cwd(), 'uploads');

    async upload(file: Express.Multer.File, relativePath: string): Promise<string> {
        const targetDir = path.join(this.baseUploadPath, relativePath);
        await fs.promises.mkdir(targetDir, { recursive: true });

        const filePath = path.join(targetDir, file.originalname);
        await fs.promises.writeFile(filePath, file.buffer);

        // Return URL-style path relative to server root
        const urlPath = path.join('/uploads', relativePath, file.originalname).replace(/\\/g, '/');
        return urlPath;
    }

    async delete(fileUrl: string): Promise<void> {
        if (!fileUrl) return;
        const sanitized = fileUrl.startsWith('/uploads')
            ? fileUrl.substring('/uploads'.length)
            : fileUrl;
        const absolutePath = path.join(this.baseUploadPath, sanitized);
        try {
            await fs.promises.unlink(absolutePath);
        } catch {
            // Ignore if file does not exist
        }
    }
}

