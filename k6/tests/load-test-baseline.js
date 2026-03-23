import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || 'your-test-token-here';

// Test scenarios
export const options = {
    stages: [
        { duration: '30s', target: 10 },    // Ramp-up: 0 to 10 users over 30s
        { duration: '1m30s', target: 10 },  // Stay at 10 users for 1:30
        { duration: '20s', target: 50 },    // Spike: ramp up to 50 users over 20s
        { duration: '1m30s', target: 50 },  // Stay at 50 for 1:30
        { duration: '20s', target: 0 },     // Ramp-down: back to 0 over 20s
    ],
    thresholds: {
        // HTTP request latency (p95)
        'http_req_duration{staticAsset:no}': ['p(95)<500', 'p(99)<1000'],
        // Error rate
        'http_requests{staticAsset:no}': ['rate>0.99'],
        // Custom threshold: 99% success
        http_req_failed: ['rate<0.01'],
    },
};

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
};

export default function () {
    // Group 1: Candidates endpoints
    group('Candidates API', () => {
        // List candidates
        let res = http.get(`${BASE_URL}/api/v1/candidates?page=1&limit=20`, { headers });
        check(res, {
            'list candidates status is 200': (r) => r.status === 200,
            'list candidates response time < 500ms': (r) => r.timings.duration < 500,
            'list candidates has data': (r) => r.json('data.length') > 0,
        });

        // Create candidate
        res = http.post(
            `${BASE_URL}/api/v1/candidates`,
            JSON.stringify({
                candidate_name: `Test Candidate ${Date.now()}`,
                email: `candidate-${Date.now()}@test.com`,
                phone: '+1234567890',
                candidate_status: 'Active',
                source: 'LinkedIn',
                skill_set: 'TypeScript, React, Node.js',
            }),
            { headers }
        );
        check(res, {
            'create candidate status is 201': (r) => r.status === 201,
            'create candidate response time < 1000ms': (r) => r.timings.duration < 1000,
        });

        // Advanced search
        res = http.post(
            `${BASE_URL}/api/v1/candidates/search/advanced`,
            JSON.stringify({
                q: 'typescript',
                limit: 20,
            }),
            { headers }
        );
        check(res, {
            'search candidates status is 200': (r) => r.status === 200,
            'search candidates response time < 500ms': (r) => r.timings.duration < 500,
        });
    });

    // Group 2: Jobs endpoints
    group('Jobs API', () => {
        let res = http.get(`${BASE_URL}/api/v1/jobs?page=1&limit=20`, { headers });
        check(res, {
            'list jobs status is 200': (r) => r.status === 200,
            'list jobs response time < 500ms': (r) => r.timings.duration < 500,
        });
    });

    // Group 3: Applications endpoints
    group('Applications API', () => {
        let res = http.get(`${BASE_URL}/api/v1/applications?page=1&limit=20`, { headers });
        check(res, {
            'list applications status is 200': (r) => r.status === 200,
            'list applications response time < 500ms': (r) => r.timings.duration < 500,
        });
    });

    // Group 4: Metrics endpoint
    group('System Metrics', () => {
        let res = http.get(`${BASE_URL}/metrics`, { headers });
        check(res, {
            'metrics status is 200': (r) => r.status === 200,
            'metrics response time < 100ms': (r) => r.timings.duration < 100,
        });
    });

    // Group 5: Health checks
    group('Health Checks', () => {
        let res = http.get(`${BASE_URL}/health`, {});
        check(res, {
            'health status is 200': (r) => r.status === 200,
            'health response time < 50ms': (r) => r.timings.duration < 50,
        });

        res = http.get(`${BASE_URL}/readiness`, {});
        check(res, {
            'readiness status is 200': (r) => r.status === 200,
        });
    });

    sleep(1);
}
