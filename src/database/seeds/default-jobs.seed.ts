import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

const companyId = '00000000-0000-0000-0000-000000000001'; // Default company ID
const userId = '00000000-0000-0000-0000-000000000001'; // Default user ID

export async function seedJobs(dataSource: DataSource): Promise<void> {
    const connection = dataSource.getRepository('Job');

    // Sample jobs for testing
    const jobs = [
        {
            id: uuidv4(),
            company_id: companyId,
            title: 'Senior Software Engineer',
            description: 'We are looking for an experienced Senior Software Engineer to join our core platform team.',
            department: 'Engineering',
            level: 'senior',
            job_type: 'full-time',
            years_required: 5,
            salary_min: 140000,
            salary_max: 180000,
            currency: 'USD',
            location: 'San Francisco, CA',
            is_remote: false,
            is_hybrid: true,
            status: 'open',
            priority: 5,
            target_hire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            openings: 2,
            required_skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker'],
            preferred_skills: ['Kubernetes', 'AWS', 'Redis'],
            tags: ['urgent', 'backend'],
            internal_notes: 'High priority position, immediate start preferred',
            source: 'internal',
            created_by_id: userId,
            updated_by_id: null,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
        },
        {
            id: uuidv4(),
            company_id: companyId,
            title: 'Product Manager',
            description: 'Lead the product strategy and roadmap for our ATS platform.',
            department: 'Product',
            level: 'mid',
            job_type: 'full-time',
            years_required: 3,
            salary_min: 120000,
            salary_max: 150000,
            currency: 'USD',
            location: 'New York, NY',
            is_remote: true,
            is_hybrid: false,
            status: 'open',
            priority: 4,
            target_hire_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            openings: 1,
            required_skills: ['Product Strategy', 'Data Analysis', 'Stakeholder Management'],
            preferred_skills: ['HR Tech', 'SaaS', 'Agile'],
            tags: ['remote', 'product'],
            internal_notes: 'Looking for someone with ATS/HR tech experience',
            source: 'linkedin',
            created_by_id: userId,
            updated_by_id: null,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
        },
        {
            id: uuidv4(),
            company_id: companyId,
            title: 'UX/UI Designer',
            description: 'Design intuitive and beautiful interfaces for our next-generation ATS.',
            department: 'Design',
            level: 'mid',
            job_type: 'full-time',
            years_required: 2,
            salary_min: 100000,
            salary_max: 130000,
            currency: 'USD',
            location: 'Austin, TX',
            is_remote: true,
            is_hybrid: true,
            status: 'interviewing',
            priority: 3,
            target_hire_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            openings: 1,
            required_skills: ['Figma', 'User Research', 'Prototyping'],
            preferred_skills: ['Design Systems', 'Accessibility', 'Animation'],
            tags: ['design', 'ux'],
            internal_notes: 'Candidate John Doe in final interviews',
            source: 'job_board',
            created_by_id: userId,
            updated_by_id: userId,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            updated_at: new Date(),
            deleted_at: null,
        },
        {
            id: uuidv4(),
            company_id: companyId,
            title: 'Data Scientist',
            description: 'Help us build predictive models and analytics for recruitment insights.',
            department: 'Data',
            level: 'senior',
            job_type: 'full-time',
            years_required: 4,
            salary_min: 130000,
            salary_max: 160000,
            currency: 'USD',
            location: 'Seattle, WA',
            is_remote: false,
            is_hybrid: true,
            status: 'on_hold',
            priority: 2,
            target_hire_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            openings: 1,
            required_skills: ['Python', 'Machine Learning', 'SQL'],
            preferred_skills: ['TensorFlow', 'BigQuery', 'Tableau'],
            tags: ['data', 'ml'],
            internal_notes: 'On hold - waiting for budget approval',
            source: 'recruiter',
            created_by_id: userId,
            updated_by_id: userId,
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            deleted_at: null,
        },
        {
            id: uuidv4(),
            company_id: companyId,
            title: 'DevOps Engineer',
            description: 'Infrastructure and deployment engineer to manage our cloud infrastructure.',
            department: 'Engineering',
            level: 'mid',
            job_type: 'full-time',
            years_required: 3,
            salary_min: 110000,
            salary_max: 140000,
            currency: 'USD',
            location: 'Remote',
            is_remote: true,
            is_hybrid: false,
            status: 'closed',
            priority: 1,
            target_hire_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            openings: 1,
            required_skills: ['Kubernetes', 'AWS', 'Terraform'],
            preferred_skills: ['Prometheus', 'ArgoCD', 'Go'],
            tags: ['closed', 'devops'],
            internal_notes: 'Position filled - onboarding Sarah Chen',
            source: 'internal_referral',
            created_by_id: userId,
            updated_by_id: userId,
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            deleted_at: null,
        },
        {
            id: uuidv4(),
            company_id: companyId,
            title: 'QA Automation Engineer',
            description: 'Build and maintain automated testing infrastructure for our platform.',
            department: 'Quality Assurance',
            level: 'junior',
            job_type: 'full-time',
            years_required: 1,
            salary_min: 70000,
            salary_max: 90000,
            currency: 'USD',
            location: 'Boston, MA',
            is_remote: false,
            is_hybrid: true,
            status: 'open',
            priority: 2,
            target_hire_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            openings: 2,
            required_skills: ['Selenium', 'Python', 'CI/CD'],
            preferred_skills: ['Playwright', 'JavaScript', 'AWS'],
            tags: ['qa', 'entry-level'],
            internal_notes: 'Great opportunity for junior developers to grow',
            source: 'job_board',
            created_by_id: userId,
            updated_by_id: null,
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            deleted_at: null,
        },
    ];

    // Insert jobs
    for (const job of jobs) {
        await connection
            .createQueryBuilder()
            .insert()
            .into('jobs')
            .values([job])
            .orIgnore()
            .execute();
    }

    console.log(`✓ Seeded ${jobs.length} jobs`);
}

export async function cleanupJobs(dataSource: DataSource): Promise<void> {
    const connection = dataSource.getRepository('Job');

    // Delete all seeded jobs
    await connection
        .createQueryBuilder()
        .delete()
        .from('jobs')
        .where('company_id = :companyId', { companyId })
        .execute();

    console.log('✓ Cleaned up jobs');
}
