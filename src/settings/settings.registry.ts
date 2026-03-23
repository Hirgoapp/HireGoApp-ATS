export type SettingValueType = 'string' | 'number' | 'boolean' | 'json';

export interface SettingDefinition {
    key: string;
    label: string;
    description?: string;
    group: 'general' | 'localization' | 'email' | 'notifications';
    type: SettingValueType;
    sensitive?: boolean;
    defaultValue: any;
}

export const SETTINGS_REGISTRY: SettingDefinition[] = [
    {
        key: 'company_profile',
        label: 'Company Profile',
        description: 'Company branding and profile information.',
        group: 'general',
        type: 'json',
        defaultValue: {},
    },
    {
        key: 'timezone',
        label: 'Timezone',
        description: 'Default timezone for dates and times.',
        group: 'localization',
        type: 'string',
        defaultValue: 'UTC',
    },
    {
        key: 'currency',
        label: 'Currency',
        description: 'Default currency code used in offers and reports.',
        group: 'localization',
        type: 'string',
        defaultValue: 'USD',
    },
    {
        key: 'email_settings',
        label: 'Email Settings',
        description: 'Email configuration (sender, SMTP, templates).',
        group: 'email',
        type: 'json',
        sensitive: true,
        defaultValue: {},
    },
    {
        key: 'email_routing_rules',
        label: 'Email Routing Rules',
        description:
            'Choose which connected mailbox sends alerts/notifications/invites and whether recruiter emails are sent from the logged-in user.',
        group: 'email',
        type: 'json',
        defaultValue: {
            alerts_sender: null,
            notifications_sender: null,
            invites_sender: null,
            recruiter_to_candidate_mode: 'user', // 'user' | 'shared'
            recruiter_fallback_sender: null,
        },
    },
    {
        key: 'notification_preferences',
        label: 'Notification Preferences',
        description: 'Notification preferences (channels, digests).',
        group: 'notifications',
        type: 'json',
        defaultValue: {},
    },
];

export const SETTINGS_KEYS = new Set(SETTINGS_REGISTRY.map((d) => d.key));

