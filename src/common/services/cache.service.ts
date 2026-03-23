import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
    async get<T = any>(key: string): Promise<T | null> {
        return null;
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        // stub
    }

    async delete(key: string): Promise<void> {
        // stub
    }

    async del(key: string): Promise<void> {
        // Alias for delete
        return this.delete(key);
    }

    async clear(): Promise<void> {
        // stub
    }
}
