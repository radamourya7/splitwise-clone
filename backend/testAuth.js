const axios = require('axios');

async function runTests() {
    const email = `test_${Date.now()}@example.com`;
    const password = `password123`;

    console.log("=== Auth Tests ===");
    try {
        let res = await axios.post('http://localhost:5000/api/auth/register', { name: "Test User", email, password });
        console.log("1. Register:", res.status === 201 ? "PASS" : "FAIL");
        const token = res.data.token;

        try {
            await axios.post('http://localhost:5000/api/auth/register', { name: "Test User", email, password });
            console.log("2. Duplicate Register: FAIL (Did not throw)");
        } catch (err) {
            console.log("2. Duplicate Register:", err.response?.status === 409 ? "PASS" : `FAIL (${err.response?.status})`);
        }

        res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        console.log("3. Successful login:", res.status === 200 && res.data.token ? "PASS" : "FAIL");

        try {
            await axios.post('http://localhost:5000/api/auth/login', { email, password: 'wrongpassword' });
            console.log("4. Incorrect login: FAIL (Did not throw)");
        } catch (err) {
            console.log("4. Incorrect login:", err.response?.status === 401 ? "PASS" : `FAIL (${err.response?.status})`);
        }

        try {
            await axios.get('http://localhost:5000/api/users/me');
            console.log("5. Protected (no token): FAIL");
        } catch (err) {
            console.log("5. Protected (no token):", err.response?.status === 401 ? "PASS" : `FAIL (${err.response?.status})`);
        }

        res = await axios.get('http://localhost:5000/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
        console.log("6. Protected (with token):", res.status === 200 && res.data.email === email ? "PASS" : "FAIL");

        try {
            await axios.get('http://localhost:5000/api/users/me', { headers: { Authorization: `Bearer INVALID_TOKEN` } });
            console.log("7. Protected (invalid token): FAIL");
        } catch (err) {
            console.log("7. Protected (invalid token):", err.response?.status === 401 ? "PASS" : `FAIL (${err.response?.status})`);
        }

        console.log("All tests completed.");
        process.exit(0);

    } catch (e) {
        console.error("Test execution error:", e.message);
        if (e.response) console.error(e.response.data);
        process.exit(1);
    }
}

setTimeout(runTests, 1500);
