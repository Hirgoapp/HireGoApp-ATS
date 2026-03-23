import { Express } from 'express';

export interface StorageProvider {
    /**
     * Upload a file to the underlying storage and return a URL or path.
     * @param file - Multer file object
     * @param path - logical path (e.g. tenants/{companyId}/...)
     */
    upload(file: Express.Multer.File, path: string): Promise<string>;

    /**
     * Delete a file by its URL or path.
     */
    delete(fileUrl: string): Promise<void>;
}

