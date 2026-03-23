import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as SamlStrategy, Profile, VerifyWithoutRequest } from '@node-saml/passport-saml';
import { ConfigService } from '@nestjs/config';
import { SsoService } from '../services/sso.service';

@Injectable()
export class SamlStrategyFactory extends PassportStrategy(SamlStrategy, 'saml') {
    constructor(
        private configService: ConfigService,
        private ssoService: SsoService,
    ) {
        super({
            // Dynamic configuration - can be overridden per company
            entryPoint: configService.get<string>('SAML_ENTRY_POINT'),
            issuer: configService.get<string>('SAML_ISSUER') || 'ats-saas-app',
            callbackUrl: configService.get<string>('SAML_CALLBACK_URL') || 'http://localhost:3001/api/v1/auth/sso/saml/callback',
            cert: configService.get<string>('SAML_CERT'), // IdP certificate
            acceptedClockSkewMs: 5000,
            identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            wantAssertionsSigned: true,
            passReqToCallback: false,
        });
    }

    async validate(profile: Profile, done: VerifyWithoutRequest): Promise<any> {
        // Extract attributes from SAML assertion
        const email = profile.email || profile.nameID;
        const firstName = profile.firstName || profile.givenName;
        const lastName = profile.lastName || profile.surname;
        const groups = profile.groups || [];

        const user = {
            provider: 'saml',
            providerId: profile.nameID,
            email,
            firstName,
            lastName,
            groups,
            attributes: profile,
        };

        done(null, user as any);
    }
}
