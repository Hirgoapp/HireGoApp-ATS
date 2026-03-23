import { DataSource } from 'typeorm';
import { CustomField, CustomFieldType, CustomFieldEntity } from '../../custom-fields/entities/custom-field.entity';

/**
 * Seed default custom fields for sample companies
 * 
 * This creates realistic custom field configurations for:
 * - Candidates: years of experience, certifications, availability
 * - Jobs: required languages, budget, remote options
 * - Applications: interview feedback, candidate notes
 */
export async function seedCustomFields(dataSource: DataSource): Promise<void> {
    const customFieldRepository = dataSource.getRepository(CustomField);

    // Sample company IDs (these should match your seed companies)
    const companyId = '00000000-0000-0000-0000-000000000001'; // Sample company 1
    const userId = '00000000-0000-0000-0000-000000000099'; // System user

    // Check if already seeded
    const existingFields = await customFieldRepository.count({
        where: { company_id: companyId }
    });

    if (existingFields > 0) {
        console.log('Custom fields already seeded, skipping...');
        return;
    }

    const fieldsToCreate = [
        // ============ CANDIDATE FIELDS ============
        {
            company_id: companyId,
            name: 'Years of Experience',
            slug: 'years_of_experience',
            description: 'Total years of professional experience',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.NUMBER,
            is_required: true,
            is_unique: false,
            validation_rules: {
                min: 0,
                max: 70
            },
            display_order: 1,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Certifications',
            slug: 'certifications',
            description: 'Professional certifications and credentials',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.MULTISELECT,
            is_required: false,
            is_unique: false,
            validation_rules: {
                allowCustomOptions: true
            },
            display_order: 2,
            visibility_settings: {},
            options: [
                { id: 'aws', label: 'AWS Solutions Architect', color: '#FF9900' },
                { id: 'k8s', label: 'Kubernetes Administrator', color: '#326CE5' },
                { id: 'azure', label: 'Azure Administrator', color: '#0078D4' },
                { id: 'gcp', label: 'Google Cloud Associate', color: '#4285F4' },
                { id: 'cissp', label: 'CISSP', color: '#003A70' },
                { id: 'scrum', label: 'Scrum Master', color: '#6B5B95' }
            ],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Availability Date',
            slug: 'availability_date',
            description: 'When the candidate can start',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.DATE,
            is_required: false,
            is_unique: false,
            validation_rules: {
                disablePastDates: true
            },
            display_order: 3,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'LinkedIn Profile',
            slug: 'linkedin_profile',
            description: 'LinkedIn profile URL',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.URL,
            is_required: false,
            is_unique: false,
            validation_rules: {
                pattern: '^https:\\/\\/linkedin\\.com\\/in\\/',
                customErrorMessage: 'Must be a valid LinkedIn profile URL'
            },
            display_order: 4,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'GitHub Profile',
            slug: 'github_profile',
            description: 'GitHub profile URL or username',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.URL,
            is_required: false,
            is_unique: false,
            validation_rules: {
                pattern: '^https:\\/\\/github\\.com\\/'
            },
            display_order: 5,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Expected Salary (USD)',
            slug: 'expected_salary_usd',
            description: 'Candidate salary expectations',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.CURRENCY,
            is_required: false,
            is_unique: false,
            validation_rules: {
                min: 0,
                max: 500000,
                decimalPlaces: 0
            },
            display_order: 6,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Willing to Relocate',
            slug: 'willing_to_relocate',
            description: 'Is the candidate open to relocation?',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.BOOLEAN,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 7,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Visa Sponsorship Required',
            slug: 'visa_sponsorship_required',
            description: 'Does the candidate require visa sponsorship?',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.BOOLEAN,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 8,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Phone Number',
            slug: 'phone_number',
            description: 'Candidate phone number',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.PHONE,
            is_required: false,
            is_unique: true,
            validation_rules: {
                pattern: '^\\+?1?\\d{9,15}$'
            },
            display_order: 9,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Professional Summary',
            slug: 'professional_summary',
            description: 'Candidate professional background',
            entity_type: CustomFieldEntity.CANDIDATE,
            field_type: CustomFieldType.RICH_TEXT,
            is_required: false,
            is_unique: false,
            validation_rules: {
                minLength: 10,
                maxLength: 2000
            },
            display_order: 10,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: false,
            created_by_id: userId
        },

        // ============ JOB FIELDS ============
        {
            company_id: companyId,
            name: 'Required Languages',
            slug: 'required_languages',
            description: 'Languages required for this position',
            entity_type: CustomFieldEntity.JOB,
            field_type: CustomFieldType.MULTISELECT,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 1,
            visibility_settings: {},
            options: [
                { id: 'en', label: 'English' },
                { id: 'es', label: 'Spanish' },
                { id: 'fr', label: 'French' },
                { id: 'de', label: 'German' },
                { id: 'zh', label: 'Mandarin Chinese' },
                { id: 'ja', label: 'Japanese' }
            ],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Budget (USD)',
            slug: 'budget_usd',
            description: 'Job budget in USD',
            entity_type: CustomFieldEntity.JOB,
            field_type: CustomFieldType.CURRENCY,
            is_required: true,
            is_unique: false,
            validation_rules: {
                min: 0,
                max: 500000,
                decimalPlaces: 2
            },
            display_order: 2,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Remote Work Option',
            slug: 'remote_work_option',
            description: 'Remote work availability for this position',
            entity_type: CustomFieldEntity.JOB,
            field_type: CustomFieldType.SELECT,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 3,
            visibility_settings: {},
            options: [
                { id: 'onsite', label: 'On-site only' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'remote', label: 'Fully remote' }
            ],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Required Certifications',
            slug: 'required_certifications',
            description: 'Required professional certifications',
            entity_type: CustomFieldEntity.JOB,
            field_type: CustomFieldType.MULTISELECT,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 4,
            visibility_settings: {},
            options: [
                { id: 'aws', label: 'AWS Solutions Architect' },
                { id: 'k8s', label: 'Kubernetes Administrator' },
                { id: 'cissp', label: 'CISSP' },
                { id: 'pmp', label: 'PMP' }
            ],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Minimum Years Required',
            slug: 'min_years_required',
            description: 'Minimum years of experience required',
            entity_type: CustomFieldEntity.JOB,
            field_type: CustomFieldType.NUMBER,
            is_required: false,
            is_unique: false,
            validation_rules: {
                min: 0,
                max: 50
            },
            display_order: 5,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Team Size',
            slug: 'team_size',
            description: 'Size of the team candidate will join',
            entity_type: CustomFieldEntity.JOB,
            field_type: CustomFieldType.NUMBER,
            is_required: false,
            is_unique: false,
            validation_rules: {
                min: 1,
                max: 1000
            },
            display_order: 6,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },

        // ============ APPLICATION FIELDS ============
        {
            company_id: companyId,
            name: 'Interview Feedback Score',
            slug: 'interview_feedback_score',
            description: 'Interview quality rating',
            entity_type: CustomFieldEntity.APPLICATION,
            field_type: CustomFieldType.RATING,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 1,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Interview Notes',
            slug: 'interview_notes',
            description: 'Detailed notes from the interview',
            entity_type: CustomFieldEntity.APPLICATION,
            field_type: CustomFieldType.RICH_TEXT,
            is_required: false,
            is_unique: false,
            validation_rules: {
                maxLength: 5000
            },
            display_order: 2,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: false,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Rejection Reason',
            slug: 'rejection_reason',
            description: 'Reason for rejection if applicable',
            entity_type: CustomFieldEntity.APPLICATION,
            field_type: CustomFieldType.SELECT,
            is_required: false,
            is_unique: false,
            validation_rules: {
                allowCustomOptions: true
            },
            display_order: 3,
            visibility_settings: {},
            options: [
                { id: 'experience', label: 'Insufficient experience' },
                { id: 'skills', label: 'Lacks required skills' },
                { id: 'culture', label: 'Culture fit concerns' },
                { id: 'salary', label: 'Salary expectations too high' },
                { id: 'availability', label: 'Availability mismatch' }
            ],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Application Status',
            slug: 'application_status',
            description: 'Current status of application',
            entity_type: CustomFieldEntity.APPLICATION,
            field_type: CustomFieldType.SELECT,
            is_required: true,
            is_unique: false,
            validation_rules: {},
            display_order: 4,
            visibility_settings: {},
            options: [
                { id: 'new', label: 'New' },
                { id: 'screened', label: 'Screened' },
                { id: 'interview', label: 'Interviewing' },
                { id: 'offer', label: 'Offer Extended' },
                { id: 'accepted', label: 'Accepted' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'withdrawn', label: 'Withdrawn' }
            ],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Offer Extended Date',
            slug: 'offer_extended_date',
            description: 'Date when offer was extended',
            entity_type: CustomFieldEntity.APPLICATION,
            field_type: CustomFieldType.DATE,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 5,
            visibility_settings: {},
            options: [],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        },
        {
            company_id: companyId,
            name: 'Background Check Status',
            slug: 'background_check_status',
            description: 'Status of background verification',
            entity_type: CustomFieldEntity.APPLICATION,
            field_type: CustomFieldType.SELECT,
            is_required: false,
            is_unique: false,
            validation_rules: {},
            display_order: 6,
            visibility_settings: {},
            options: [
                { id: 'pending', label: 'Pending' },
                { id: 'passed', label: 'Passed' },
                { id: 'failed', label: 'Failed' },
                { id: 'waived', label: 'Waived' }
            ],
            is_active: true,
            is_searchable: true,
            created_by_id: userId
        }
    ];

    // Create all fields
    const fields = customFieldRepository.create(fieldsToCreate);
    await customFieldRepository.save(fields);

    console.log(`✓ Seeded ${fieldsToCreate.length} custom fields`);
}

/**
 * Cleanup function to remove seeded custom fields
 */
export async function cleanupCustomFields(dataSource: DataSource): Promise<void> {
    const customFieldRepository = dataSource.getRepository(CustomField);
    const companyId = '00000000-0000-0000-0000-000000000001';

    await customFieldRepository.delete({
        company_id: companyId,
        is_active: true
    });

    console.log('✓ Cleaned up custom fields');
}
