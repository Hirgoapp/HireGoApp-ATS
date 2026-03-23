import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum SsoProvider {
    GOOGLE = 'google',
    MICROSOFT = 'microsoft',
    GITHUB = 'github',
    SAML = 'saml',
    LDAP = 'ldap',
}

export interface SamlConfiguration {
    entryPoint: string;
    issuer: string;
    cert: string;
    callbackUrl: string;
    identifierFormat?: string;
    signatureAlgorithm?: string;
    digestAlgorithm?: string;
}

export interface OAuthConfiguration {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    scope?: string[];
    authorizationUrl?: string;
    tokenUrl?: string;
}

export interface LdapConfiguration {
    url: string;
    bindDn: string;
    bindCredentials: string;
    searchBase: string;
    searchFilter: string;
}

export interface AttributeMapping {
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    groups?: string;
}

export interface RoleMapping {
    sourceAttribute: string; // e.g., 'groups' or 'roles'
    mappings: { [key: string]: string }; // e.g., { 'Admin': 'admin', 'HR': 'recruiter' }
    defaultRole?: string;
}

@Entity('sso_configurations')
@Index(['company_id', 'provider'])
export class SsoConfiguration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    company_id: string;

    @Column({
        type: 'enum',
        enum: SsoProvider,
    })
    provider: SsoProvider;

    @Column({ type: 'jsonb' })
    configuration: SamlConfiguration | OAuthConfiguration | LdapConfiguration;

    @Column({ type: 'jsonb', nullable: true })
    attribute_mapping: AttributeMapping;

    @Column({ type: 'jsonb', nullable: true })
    role_mapping: RoleMapping;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    enable_jit_provisioning: boolean; // Just-In-Time user creation

    @Column({ nullable: true })
    domain: string; // Email domain to auto-enable SSO (e.g., '@acme.com')

    @Column({ type: 'text', nullable: true })
    metadata_xml: string; // For SAML IdP metadata

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string;
}
