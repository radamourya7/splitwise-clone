const axios = require('axios');

const API = 'http://localhost:5000/api';

async function createUser(prefix) {
    const email = `${prefix}_${Date.now()}@test.com`;
    const res = await axios.post(`${API}/auth/register`, { name: prefix, email, password: 'password123' });
    return { id: res.data.user.id, email, token: res.data.token };
}

async function runTests() {
    try {
        const admin = await createUser('admin');
        const u1 = await createUser('user1');
        const u2 = await createUser('user2');

        const headersA = { Authorization: `Bearer ${admin.token}` };
        const headers1 = { Authorization: `Bearer ${u1.token}` };

        console.log("=== Group Tests ===");

        // 1. Create group
        let res = await axios.post(`${API}/groups`, { name: "Test Group" }, { headers: headersA });
        const groupId = res.data.id;
        console.log("1. Create group:", res.status === 201 ? "PASS" : "FAIL");

        // 2. List groups
        res = await axios.get(`${API}/groups`, { headers: headersA });
        console.log("2. List groups:", (res.status === 200 && res.data.length > 0) ? "PASS" : "FAIL");

        // 3. Get single group
        res = await axios.get(`${API}/groups/${groupId}`, { headers: headersA });
        console.log("3. Get single group:", res.status === 200 ? "PASS" : "FAIL");

        // 4. Add member
        res = await axios.post(`${API}/groups/${groupId}/members`, { email: u1.email }, { headers: headersA });
        console.log("4. Add member:", res.status === 201 ? "PASS" : "FAIL");

        // 5. Add duplicate member
        try {
            await axios.post(`${API}/groups/${groupId}/members`, { email: u1.email }, { headers: headersA });
            console.log("5. Add duplicate member: FAIL (Did not throw 409)");
        } catch (err) {
            console.log("5. Add duplicate member:", err.response?.status === 409 ? "PASS" : "FAIL");
        }

        // 6. Unauthorized member removal
        try {
            await axios.delete(`${API}/groups/${groupId}/members/${admin.id}`, { headers: headers1 });
            console.log("6. Unauthorized member removal: FAIL (Did not throw 403)");
        } catch (err) {
            console.log("6. Unauthorized member removal:", err.response?.status === 403 ? "PASS" : "FAIL");
        }

        // 7. Remove member
        res = await axios.delete(`${API}/groups/${groupId}/members/${u1.id}`, { headers: headersA });
        console.log("7. Remove member:", res.status === 200 ? "PASS" : "FAIL");

        // 8. Admin transfer scenario
        await axios.post(`${API}/groups/${groupId}/members`, { email: u1.email }, { headers: headersA });
        await axios.post(`${API}/groups/${groupId}/members`, { email: u2.email }, { headers: headersA });
        // Admin removes themselves
        res = await axios.delete(`${API}/groups/${groupId}/members/${admin.id}`, { headers: headersA });
        const groupVer = await axios.get(`${API}/groups/${groupId}`, { headers: headers1 }); // u1 is now admin hopefully
        const newAdminMember = groupVer.data.members.find(m => m.userId === u1.id);
        console.log("8. Admin transfer scenario:", (res.status === 200 && newAdminMember.role === 'ADMIN') ? "PASS" : "FAIL");

        // 9. Delete group
        res = await axios.delete(`${API}/groups/${groupId}`, { headers: headers1 }); // u1 executes it as new Admin
        try {
            await axios.get(`${API}/groups/${groupId}`, { headers: headers1 });
        } catch (err) {
            console.log("9. Delete group:", (res.status === 200 && err.response?.status === 404) ? "PASS" : "FAIL");
        }

        process.exit(0);
    } catch (err) {
        console.error("Test execution error:", err.response?.data || err.message);
        process.exit(1);
    }
}

setTimeout(runTests, 1500);
