import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || 'your-test-token-here';

// Spike test: Normal load with sudden spike
export const options = {
    stages: [
        { duration: '30s', target: 10 },    // Baseline: 10 users
        { duration: '1m', target: 10 },     // Stable baseline
        { duration: '10s', target: 100 },   // SPIKE: Jump to 100 users
        { duration: '30s', target: 100 },   // Hold spike
        { duration: '10s', target: 10 },    // Back to baseline
        { duration: '30s', target: 10 },    // Recovery period
        { duration: '10s', target: 0 },     // Ramp down
    ],
    thresholds: {
        'http_req_duration{staticAsset:no}': ['p(95)<1000', 'p(99)<2000'],
        'http_req_failed': ['rate<0.01'],
    },
};

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
};

export default function () {
    group('Dashboard - Spike Test', () => {
        // Simulate dashboard load with multiple concurrent requests
        const requests = [
            {
                url: `${BASE_URL}/api/v1/dashboard/key-stats`,
                name: 'Dashboard Stats',
            },
            {
                url: `${BASE_URL}/api/v1/dashboard/recent-applications`,
                name: 'Recent Applications',
            },
            {
                url: `${BASE_URL}/api/v1/dashboard/upcoming-interviews`,
                name: 'Upcoming Interviews',
            },
            {
                url: `${BASE_URL}/api/v1/dashboard/daily-applications`,
                name: 'Daily Trends',
            },
        ];

        requests.forEach((req) => {
            const res = http.get(req.url, { headers });
            check(res, {
                [`${req.name} status is 200`]: (r) => r.status === 200,
                [`${req.name} response time < 1s`]: (r) => r.timings.duration < 1000,
            });
        });
    });

    group('Candidate Search - Spike Test', () => {
        const res = http.post(
            `${BASE_URL}/api/v1/candidates/search/advanced`,
            JSON.stringify({
                q: 'senior',
                filters: [{ field: 'candidate_status', operator: 'eq', value: 'Active' }],
                limit: 50,
            }),
            { headers }
        );

        check(res, {
            'search status is 200': (r) => r.status === 200,
            'search response time < 1s': (r) => r.timings.duration < 1000,
            'search returns results': (r) => r.json('data.length') > 0,
        });
    });

    sleep(Math.random() + 0.5);
}
