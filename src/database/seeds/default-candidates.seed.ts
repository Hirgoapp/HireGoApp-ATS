import { DataSource } from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity';

/**
 * Seed sample candidates for testing (canonical SaaS `candidates` table / UUID entity).
 */
export async function seedCandidates(dataSource: DataSource): Promise<void> {
    const candidateRepository = dataSource.getRepository(Candidate);

    const companyId = '00000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000099';

    const existingCount = await candidateRepository.count({
        where: { company_id: companyId },
    });

    if (existingCount > 0) {
        console.log('Candidates already seeded, skipping...');
        return;
    }

    const candidates: Partial<Candidate>[] = [
        {
            company_id: companyId,
            candidate_name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '+15550101',
            current_company: 'Tech Corp',
            total_experience: 8,
            skill_set: 'Node.js, React, AWS, full-stack',
            job_location: 'San Francisco, USA',
            candidate_status: 'Active',
            source: 'linkedin',
            linkedin_url: 'https://linkedin.com/in/johnsmith',
            notes: 'Strong candidate, good technical skills',
            extra_fields: { title: 'Senior Software Engineer', tags: ['backend', 'nodejs', 'aws'] },
            created_by: userId,
        },
        {
            company_id: companyId,
            candidate_name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            phone: '+15550102',
            current_company: 'StartUp Inc',
            total_experience: 6,
            skill_set: 'Product management, B2B SaaS',
            job_location: 'New York, USA',
            candidate_status: 'Active',
            source: 'job_board',
            linkedin_url: 'https://linkedin.com/in/sarahjohnson',
            notes: 'Good PM background',
            extra_fields: { title: 'Product Manager', tags: ['product', 'saas', 'b2b'] },
            created_by: userId,
        },
        {
            company_id: companyId,
            candidate_name: 'Michael Chen',
            email: 'michael.chen@example.com',
            phone: '+15550103',
            current_company: 'Cloud Systems',
            total_experience: 5,
            skill_set: 'Kubernetes, CI/CD, DevOps',
            job_location: 'Seattle, USA',
            candidate_status: 'Active',
            source: 'referral',
            linkedin_url: 'https://linkedin.com/in/michaelchen',
            notes: 'Excellent DevOps knowledge',
            extra_fields: { title: 'DevOps Engineer', tags: ['devops', 'kubernetes', 'ci-cd'] },
            created_by: userId,
        },
        {
            company_id: companyId,
            candidate_name: 'Emily Davis',
            email: 'emily.davis@example.com',
            phone: '+15550104',
            current_company: 'Design Studio',
            total_experience: 4,
            skill_set: 'UX, UI, accessibility',
            job_location: 'Austin, USA',
            candidate_status: 'Active',
            source: 'website',
            linkedin_url: 'https://linkedin.com/in/emilydavis',
            notes: 'Good design sense',
            extra_fields: { title: 'UX/UI Designer', portfolio_url: 'https://emilydavis.design', tags: ['design', 'ui', 'ux'] },
            created_by: userId,
        },
        {
            company_id: companyId,
            candidate_name: 'David Wilson',
            email: 'david.wilson@example.com',
            phone: '+15550105',
            current_company: 'Analytics Corp',
            total_experience: 7,
            skill_set: 'Python, ML, big data',
            job_location: 'Boston, USA',
            candidate_status: 'Inactive',
            source: 'recruiter',
            linkedin_url: 'https://linkedin.com/in/davidwilson',
            notes: 'Accepted offer elsewhere',
            extra_fields: { title: 'Data Scientist', tags: ['data-science', 'ml', 'python'] },
            created_by: userId,
        },
        {
            company_id: companyId,
            candidate_name: 'Jessica Martinez',
            email: 'jessica.martinez@example.com',
            phone: '+15550106',
            current_company: 'QA Solutions',
            total_experience: 3,
            skill_set: 'Test automation, QA',
            job_location: 'Miami, USA',
            candidate_status: 'Inactive',
            source: 'linkedin',
            notes: 'Rejected - insufficient automation depth',
            extra_fields: { title: 'QA Engineer', tags: ['qa', 'testing'] },
            created_by: userId,
        },
    ];

    const candidateEntities = candidateRepository.create(candidates);
    await candidateRepository.save(candidateEntities);

    console.log(`✓ Seeded ${candidates.length} candidates`);
}

export async function cleanupCandidates(dataSource: DataSource): Promise<void> {
    const candidateRepository = dataSource.getRepository(Candidate);
    const companyId = '00000000-0000-0000-0000-000000000001';

    await candidateRepository.delete({
        company_id: companyId,
    });

    console.log('✓ Cleaned up candidates');
}
