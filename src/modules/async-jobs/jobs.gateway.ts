import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
@WebSocketGateway({ namespace: '/ws/jobs', cors: true })
export class JobsGateway {
    @WebSocketServer()
    server: Server;

    emit(queue: string, event: 'active' | 'progress' | 'completed' | 'failed', payload: any) {
        const channel = `jobs:${queue}:${event}`;
        try {
            this.server?.emit(channel, payload);
        } catch {
            // ignore if server not ready
        }
    }
}
