import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || 'your-test-token-here';

// Endurance test: Steady load over extended period to detect leaks
export const options = {
    stages: [
        { duration: '2m', target: 50 },     // Ramp up
        { duration: '10m', target: 50 },    // Hold steady load for 10 minutes
        { duration: '2m', target: 0 },      // Ramp down
    ],
    thresholds: {
        'http_req_duration{staticAsset:no}': ['p(95)<500', 'p(99)<1000'],
        'http_req_failed': ['rate<0.01'],
    },
};

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
};

export default function () {
    group('Candidate Operations - Endurance', () => {
        // Realistic workflow: list, search, create, read

        // 1. List candidates
        let res = http.get(`${BASE_URL}/api/v1/candidates?page=1&limit=20`, { headers });
        check(res, {
            'list candidates OK': (r) => r.status === 200,
        });

        // 2. Search candidates
        res = http.post(
            `${BASE_URL}/api/v1/candidates/search/advanced`,
            JSON.stringify({
                q: 'engineer',
                limit: 20,
            }),
            { headers }
        );
        check(res, {
            'search candidates OK': (r) => r.status === 200,
        });

        // 3. Create candidate
        res = http.post(
            `${BASE_URL}/api/v1/candidates`,
            JSON.stringify({
                candidate_name: `Endurance Test ${Date.now()}`,
                email: `endurance-${Date.now()}-${Math.random()}@test.com`,
                phone: '+1234567890',
                candidate_status: 'Active',
            }),
            { headers }
        );
        check(res, {
            'create candidate OK': (r) => r.status === 201 || r.status === 200,
        });
    });

    group('Application Workflow - Endurance', () => {
        // 1. List applications
        let res = http.get(`${BASE_URL}/api/v1/applications?page=1&limit=20`, { headers });
        check(res, {
            'list applications OK': (r) => r.status === 200,
        });

        // 2. Get dashboard stats
        res = http.get(`${BASE_URL}/api/v1/dashboard/key-stats`, { headers });
        check(res, {
            'get dashboard stats OK': (r) => r.status === 200,
        });
    });

    sleep(Math.random() * 3 + 1);
}
