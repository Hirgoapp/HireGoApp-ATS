import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DashboardService } from './dashboard.service';

@Injectable()
@WebSocketGateway({ namespace: '/ws/dashboard', cors: true })
export class DashboardGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(DashboardGateway.name);
    private readonly roomSubscribers = new Map<string, number>();
    private readonly roomTimers = new Map<string, NodeJS.Timeout>();

    constructor(private readonly dashboardService: DashboardService) { }

    @SubscribeMessage('dashboard:subscribe')
    async handleSubscribe(
        @ConnectedSocket() socket: Socket,
        @MessageBody() body: { companyId?: string },
    ) {
        const companyId = String(body?.companyId || '').trim();
        if (!companyId) {
            socket.emit('dashboard:error', { message: 'Missing companyId for dashboard subscription' });
            return;
        }

        const room = this.roomName(companyId);
        await socket.join(room);
        this.incrementRoom(room);

        // Emit immediate snapshot for a responsive first paint.
        try {
            const data = await this.dashboardService.getOverview(companyId);
            socket.emit('dashboard:overview', { companyId, data });
        } catch (error: any) {
            socket.emit('dashboard:error', { message: error?.message || 'Unable to load dashboard overview' });
        }

        this.ensureRoomTimer(room, companyId);
    }

    @SubscribeMessage('dashboard:unsubscribe')
    async handleUnsubscribe(
        @ConnectedSocket() socket: Socket,
        @MessageBody() body: { companyId?: string },
    ) {
        const companyId = String(body?.companyId || '').trim();
        if (!companyId) return;

        const room = this.roomName(companyId);
        await socket.leave(room);
        this.decrementRoom(room);
    }

    async handleDisconnect(socket: Socket) {
        for (const room of socket.rooms) {
            if (room !== socket.id && room.startsWith('dashboard:company:')) {
                this.decrementRoom(room);
            }
        }
    }

    private roomName(companyId: string) {
        return `dashboard:company:${companyId}`;
    }

    private incrementRoom(room: string) {
        const count = this.roomSubscribers.get(room) || 0;
        this.roomSubscribers.set(room, count + 1);
    }

    private decrementRoom(room: string) {
        const count = this.roomSubscribers.get(room) || 0;
        const next = Math.max(0, count - 1);
        if (next === 0) {
            this.roomSubscribers.delete(room);
            const timer = this.roomTimers.get(room);
            if (timer) {
                clearInterval(timer);
                this.roomTimers.delete(room);
            }
            return;
        }
        this.roomSubscribers.set(room, next);
    }

    private ensureRoomTimer(room: string, companyId: string) {
        if (this.roomTimers.has(room)) return;

        const timer = setInterval(async () => {
            const subscribers = this.roomSubscribers.get(room) || 0;
            if (subscribers <= 0) {
                clearInterval(timer);
                this.roomTimers.delete(room);
                return;
            }

            try {
                const data = await this.dashboardService.getOverview(companyId);
                this.server.to(room).emit('dashboard:overview', { companyId, data });
            } catch (error: any) {
                this.logger.warn(`Realtime dashboard publish failed for ${companyId}: ${error?.message || error}`);
            }
        }, 15000);

        this.roomTimers.set(room, timer);
    }
}
