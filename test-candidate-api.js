const http = require('http');

async function makeRequest(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function test() {
    console.log('\n🔵 Starting Candidate Creation Test...\n');

    // Step 1: Login
    console.log('Step 1: Logging in as company admin...');
    const loginResult = await makeRequest('POST', '/api/v1/auth/login', {
        email: 'admin@demo-company.com',
        password: 'DemoAdmin@123'
    });

    if (loginResult.status !== 200) {
        console.error('❌ Login failed:', loginResult);
        return;
    }

    const token = loginResult.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Create candidate
    console.log('Step 2: Creating candidate...');
    try {
        const candidateResult = await makeRequest('POST', '/api/v1/candidates', {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@test.com',
            status: 'active'
        }, token);

        if (candidateResult.status === 201) {
            console.log('\n✅✅✅ SUCCESS - CANDIDATE CREATED ✅✅✅\n');
            console.log('Response:', JSON.stringify(candidateResult.data, null, 2));
        } else {
            console.log('\n❌ Failed with status:', candidateResult.status);
            console.log('Response:', JSON.stringify(candidateResult.data, null, 2));
        }
    } catch (error) {
        console.error('\n❌ Request failed:', error.message);
    }
}

test().catch(console.error);
