import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || 'your-test-token-here';

// Custom metrics
const candidateCreateCount = new Counter('candidates_created');
const searchDuration = new Trend('search_duration');
const errorRate = new Rate('errors');

// Stress test: Gradually ramp up to breaking point
export const options = {
    stages: [
        { duration: '30s', target: 50 },    // Ramp-up: 0 to 50 users
        { duration: '1m', target: 100 },    // Ramp to 100 users
        { duration: '1m', target: 200 },    // Ramp to 200 users
        { duration: '1m', target: 500 },    // Ramp to 500 users (heavy load)
        { duration: '30s', target: 0 },     // Ramp-down
    ],
    thresholds: {
        'http_req_duration{staticAsset:no}': ['p(95)<2000', 'p(99)<3000'],
        'http_req_failed': ['rate<0.05'],   // Accept 5% errors under stress
        'errors': ['rate<0.1'],
    },
};

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
};

export default function () {
    group('Candidate Search - Heavy Load', () => {
        // Stress test: Heavy search load
        const queries = ['typescript', 'senior', 'engineer', 'python', 'react', 'nodejs'];
        const query = queries[Math.floor(Math.random() * queries.length)];

        const res = http.post(
            `${BASE_URL}/api/v1/candidates/search/advanced`,
            JSON.stringify({
                q: query,
                limit: 50,
            }),
            { headers }
        );

        searchDuration.add(res.timings.duration);

        const success = check(res, {
            'search successful': (r) => r.status === 200,
            'search responds within 2s': (r) => r.timings.duration < 2000,
        });

        if (!success) errorRate.add(1);
    });

    group('Candidate Creation - Heavy Load', () => {
        const res = http.post(
            `${BASE_URL}/api/v1/candidates`,
            JSON.stringify({
                candidate_name: `Stress Test ${Date.now()}`,
                email: `stress-${Date.now()}-${Math.random()}@test.com`,
                phone: '+1234567890',
                candidate_status: 'Active',
                source: 'API',
                skill_set: 'TypeScript, React',
            }),
            { headers }
        );

        const success = check(res, {
            'create successful': (r) => r.status === 201 || r.status === 200,
            'create responds within 2s': (r) => r.timings.duration < 2000,
        });

        if (success) candidateCreateCount.add(1);
        else errorRate.add(1);
    });

    group('Application List - Heavy Load', () => {
        const page = Math.floor(Math.random() * 10) + 1;
        const res = http.get(
            `${BASE_URL}/api/v1/applications?page=${page}&limit=50`,
            { headers }
        );

        check(res, {
            'list successful': (r) => r.status === 200,
            'list responds within 2s': (r) => r.timings.duration < 2000,
        });
    });

    sleep(Math.random() * 2);
}
