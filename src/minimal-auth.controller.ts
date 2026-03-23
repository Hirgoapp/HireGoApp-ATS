import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('api/v1/auth')
export class MinimalAuthController {
    constructor(private jwtService: JwtService) { }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        // Simple hardcoded admin user for now
        if (body.email === 'admin@example.com' && body.password === 'Admin123!') {
            const token = this.jwtService.sign({
                id: '00000000-0000-0000-0000-000000000001',
                email: 'admin@example.com',
                role: 'admin',
                company_id: '00000000-0000-0000-0000-000000000001',
            });

            return {
                success: true,
                data: {
                    token,
                    refreshToken: token,
                    user: {
                        id: '00000000-0000-0000-0000-000000000001',
                        email: 'admin@example.com',
                        firstName: 'Admin',
                        role: 'admin',
                        company: {
                            id: '00000000-0000-0000-0000-000000000001',
                            name: 'Default Company',
                        },
                    },
                },
            };
        }

        return {
            success: false,
            message: 'Invalid credentials',
        };
    }

    @Post('refresh')
    async refresh(@Body() body: { refreshToken: string }) {
        const payload = this.jwtService.decode(body.refreshToken);
        if (!payload) {
            return { success: false };
        }

        const token = this.jwtService.sign(payload);
        return { success: true, data: { token, refreshToken: token } };
    }
}
