import { Controller, Get, Query, Req, Res, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { IntegrationService } from '../services/integration.service';
import { IntegrationCryptoService } from '../services/integration-crypto.service';
import { IntegrationAccountRepository } from '../repositories/integration-account.repository';

type OAuthState = {
    companyId: string;
    userId: string;
    integrationType: 'google_drive' | 'onedrive';
    desiredEmail?: string;
};

@ApiTags('Integrations OAuth')
@Controller('api/v1/integrations/oauth')
export class IntegrationOAuthController {
    constructor(
        private readonly integrationService: IntegrationService,
        private readonly crypto: IntegrationCryptoService,
        private readonly accountsRepo: IntegrationAccountRepository,
    ) {}

    private getFrontendUrl(): string {
        return process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    private getIntegrationsRedirectBase(): string {
        // Business UI integrations live under /app/admin/settings/integrations in this project.
        // Keep it configurable via FRONTEND_INTEGRATIONS_PATH if needed later.
        const base = this.getFrontendUrl().replace(/\/+$/, '');
        const path = (process.env.FRONTEND_INTEGRATIONS_PATH || '/app/admin/settings/integrations').replace(/^\/?/, '/');
        return `${base}${path}`;
    }

    private signState(state: OAuthState): string {
        const secret = process.env.INTEGRATIONS_OAUTH_STATE_SECRET;
        if (!secret) throw new Error('INTEGRATIONS_OAUTH_STATE_SECRET not configured');
        return jwt.sign(state, secret, { expiresIn: '10m' });
    }

    private verifyState(token: string): OAuthState {
        const secret = process.env.INTEGRATIONS_OAUTH_STATE_SECRET;
        if (!secret) throw new Error('INTEGRATIONS_OAUTH_STATE_SECRET not configured');
        return jwt.verify(token, secret) as OAuthState;
    }

    // ========================= Google Workspace (Gmail/Drive) =========================

    private buildGoogleAuthorizeUrl(companyId: string, userId: string, email?: string): string {
        const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
        const redirectUri = process.env.GOOGLE_WORKSPACE_REDIRECT_URI;
        if (!clientId || !redirectUri) {
            throw new BadRequestException('Google OAuth is not configured (missing client id / redirect uri)');
        }

        const scopes = [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/drive.file',
            'openid',
            'email',
            'profile',
        ];

        const desiredEmail = email ? String(email).trim().toLowerCase() : undefined;
        const state = this.signState({ companyId, userId, integrationType: 'google_drive', desiredEmail });
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scopes.join(' '));
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('prompt', 'consent');
        url.searchParams.set('state', state);
        if (desiredEmail) url.searchParams.set('login_hint', desiredEmail);
        return url.toString();
    }

    @Get('google/authorize-url')
    @ApiOperation({ summary: 'Get Google OAuth authorize URL (authenticated)' })
    async googleAuthorizeUrl(@Req() req: any, @Query('email') email?: string) {
        const companyId = req.tenant?.companyId as string;
        const userId = req.tenant?.userId as string;
        if (!companyId || !userId) throw new BadRequestException('Missing tenant context');
        return {
            success: true,
            data: { url: this.buildGoogleAuthorizeUrl(companyId, userId, email) },
        };
    }

    @Get('google/authorize')
    @ApiOperation({ summary: 'Start Google OAuth for a company (Drive/Gmail)' })
    async googleAuthorize(
        @Req() req: any,
        @Res() res: Response,
        @Query('email') email?: string,
    ) {
        // Requires JWT (tenant middleware) because this endpoint is NOT excluded
        const companyId = req.tenant?.companyId as string;
        const userId = req.tenant?.userId as string;
        if (!companyId || !userId) throw new BadRequestException('Missing tenant context');

        return res.redirect(this.buildGoogleAuthorizeUrl(companyId, userId, email));
    }

    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback (public)' })
    async googleCallback(
        @Query('code') code: string | undefined,
        @Query('state') state: string | undefined,
        @Query('error') error: string | undefined,
        @Res() res: Response,
    ) {
        const frontend = this.getIntegrationsRedirectBase();
        if (error) {
            return res.redirect(`${frontend}?provider=google&status=error&reason=${encodeURIComponent(error)}`);
        }
        if (!code || !state) {
            return res.redirect(`${frontend}?provider=google&status=error&reason=missing_code_or_state`);
        }

        let decoded: OAuthState;
        try {
            decoded = this.verifyState(state);
        } catch {
            return res.redirect(`${frontend}?provider=google&status=error&reason=invalid_state`);
        }

        const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_WORKSPACE_REDIRECT_URI;
        if (!clientId || !clientSecret || !redirectUri) {
            return res.redirect(`${frontend}?provider=google&status=error&reason=server_not_configured`);
        }

        try {
            const tokenRes = await axios.post(
                'https://oauth2.googleapis.com/token',
                new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }).toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
            );

            const tokens = tokenRes.data as any;
            const accessToken = String(tokens.access_token || '');
            const refreshToken = tokens.refresh_token ? String(tokens.refresh_token) : '';
            const expiresInSec = Number(tokens.expires_in || 0);
            const expiresAt = expiresInSec ? new Date(Date.now() + expiresInSec * 1000).toISOString() : null;

            // Determine which mailbox actually authorized.
            let authedEmail: string | null = null;
            if (tokens.id_token) {
                try {
                    const parts = String(tokens.id_token).split('.');
                    if (parts.length >= 2) {
                        const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
                        const idp = JSON.parse(json);
                        authedEmail = idp?.email ? String(idp.email).toLowerCase() : null;
                    }
                } catch {
                    authedEmail = null;
                }
            }

            const desired = decoded.desiredEmail ? decoded.desiredEmail.toLowerCase() : null;
            if (desired && authedEmail && desired !== authedEmail) {
                return res.redirect(
                    `${frontend}?provider=google&status=error&reason=${encodeURIComponent(
                        `connected_email_mismatch:${authedEmail}`,
                    )}`,
                );
            }

            const config: Record<string, unknown> = {
                provider: 'google',
                connected_at: new Date().toISOString(),
                connected_by_user_id: decoded.userId,
                connected_email: authedEmail,
                scopes: tokens.scope ? String(tokens.scope).split(' ') : undefined,
                expires_at: expiresAt,
                token_type: tokens.token_type,
            };

            if (this.crypto.isEnabled()) {
                config.access_token_enc = this.crypto.encrypt(accessToken);
                if (refreshToken) config.refresh_token_enc = this.crypto.encrypt(refreshToken);
            } else {
                // fallback (dev only). Strongly recommended to configure encryption key.
                config.access_token = accessToken;
                if (refreshToken) config.refresh_token = refreshToken;
            }

            // Save/update mailbox connection record (used for per-sender routing).
            if (authedEmail) {
                await this.accountsRepo.upsert(decoded.companyId, 'google', authedEmail, {
                    is_active: true,
                    is_verified: true,
                    config,
                });
            }

            // Keep existing integration row as "connected" marker for UI.
            await this.integrationService.connect(decoded.companyId, decoded.integrationType, config);
            return res.redirect(`${frontend}?provider=google&status=connected`);
        } catch (e: any) {
            const reason = e?.response?.data?.error_description || e?.response?.data?.error || e?.message || 'token_exchange_failed';
            return res.redirect(`${frontend}?provider=google&status=error&reason=${encodeURIComponent(String(reason))}`);
        }
    }

    // ========================= Microsoft 365 (Outlook/OneDrive) =========================

    @Get('microsoft/authorize')
    @ApiOperation({ summary: 'Start Microsoft OAuth for a company (OneDrive/Outlook)' })
    async microsoftAuthorize(@Req() req: any, @Res() res: Response) {
        const companyId = req.tenant?.companyId as string;
        const userId = req.tenant?.userId as string;
        if (!companyId || !userId) throw new BadRequestException('Missing tenant context');

        const clientId = process.env.MICROSOFT_CLIENT_ID;
        const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
        if (!clientId || !redirectUri) {
            throw new BadRequestException('Microsoft OAuth is not configured (missing client id / redirect uri)');
        }

        const scopes = [
            'offline_access',
            'openid',
            'email',
            'profile',
            'https://graph.microsoft.com/Mail.Send',
            'https://graph.microsoft.com/Files.ReadWrite',
        ];

        const state = this.signState({ companyId, userId, integrationType: 'onedrive' });
        const authorize = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
        authorize.searchParams.set('client_id', clientId);
        authorize.searchParams.set('response_type', 'code');
        authorize.searchParams.set('redirect_uri', redirectUri);
        authorize.searchParams.set('response_mode', 'query');
        authorize.searchParams.set('scope', scopes.join(' '));
        authorize.searchParams.set('state', state);

        return res.redirect(authorize.toString());
    }

    @Get('microsoft/callback')
    @ApiOperation({ summary: 'Microsoft OAuth callback (public)' })
    async microsoftCallback(
        @Query('code') code: string | undefined,
        @Query('state') state: string | undefined,
        @Query('error') error: string | undefined,
        @Query('error_description') errorDescription: string | undefined,
        @Res() res: Response,
    ) {
        const frontend = this.getIntegrationsRedirectBase();
        if (error) {
            const reason = errorDescription || error;
            return res.redirect(`${frontend}?provider=microsoft&status=error&reason=${encodeURIComponent(reason)}`);
        }
        if (!code || !state) {
            return res.redirect(`${frontend}?provider=microsoft&status=error&reason=missing_code_or_state`);
        }

        let decoded: OAuthState;
        try {
            decoded = this.verifyState(state);
        } catch {
            return res.redirect(`${frontend}?provider=microsoft&status=error&reason=invalid_state`);
        }

        const clientId = process.env.MICROSOFT_CLIENT_ID;
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
        const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
        if (!clientId || !clientSecret || !redirectUri) {
            return res.redirect(`${frontend}?provider=microsoft&status=error&reason=server_not_configured`);
        }

        try {
            const tokenRes = await axios.post(
                'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    code,
                    grant_type: 'authorization_code',
                }).toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
            );
            const tokens = tokenRes.data as any;
            const accessToken = String(tokens.access_token || '');
            const refreshToken = tokens.refresh_token ? String(tokens.refresh_token) : '';
            const expiresInSec = Number(tokens.expires_in || 0);
            const expiresAt = expiresInSec ? new Date(Date.now() + expiresInSec * 1000).toISOString() : null;

            // Decode id_token (if present) to capture tenant id & username without needing extra Graph calls
            let account: any = null;
            if (tokens.id_token) {
                try {
                    const parts = String(tokens.id_token).split('.');
                    if (parts.length >= 2) {
                        const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
                        account = JSON.parse(json);
                    }
                } catch {
                    account = null;
                }
            }

            const config: Record<string, unknown> = {
                provider: 'microsoft',
                connected_at: new Date().toISOString(),
                connected_by_user_id: decoded.userId,
                scopes: tokens.scope ? String(tokens.scope).split(' ') : undefined,
                expires_at: expiresAt,
                token_type: tokens.token_type,
                microsoft_tenant_id: account?.tid,
                microsoft_upn: account?.preferred_username,
            };

            if (this.crypto.isEnabled()) {
                config.access_token_enc = this.crypto.encrypt(accessToken);
                if (refreshToken) config.refresh_token_enc = this.crypto.encrypt(refreshToken);
            } else {
                config.access_token = accessToken;
                if (refreshToken) config.refresh_token = refreshToken;
            }

            await this.integrationService.connect(decoded.companyId, decoded.integrationType, config);
            return res.redirect(`${frontend}?provider=microsoft&status=connected`);
        } catch (e: any) {
            const reason = e?.response?.data?.error_description || e?.response?.data?.error || e?.message || 'token_exchange_failed';
            return res.redirect(`${frontend}?provider=microsoft&status=error&reason=${encodeURIComponent(String(reason))}`);
        }
    }
}

