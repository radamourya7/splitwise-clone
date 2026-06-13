const axios = require('axios');
const fs = require('fs');
const API = 'http://localhost:5000/api';
let LOG = "";
const log = (msg) => { LOG += msg + "\n"; };

async function setup() {
    const admin = (await axios.post(`${API}/auth/register`, { name: 'Admin', email: `ex_admin_${Date.now()}@test.com`, password: 'password123' })).data;
    const user1 = (await axios.post(`${API}/auth/register`, { name: 'User1', email: `ex_user1_${Date.now()}@test.com`, password: 'password123' })).data;
    const user2 = (await axios.post(`${API}/auth/register`, { name: 'User2', email: `ex_user2_${Date.now()}@test.com`, password: 'password123' })).data;
    const unauth = (await axios.post(`${API}/auth/register`, { name: 'Unauth', email: `ex_unauth_${Date.now()}@test.com`, password: 'password123' })).data;

    const hAdmin = { Authorization: `Bearer ${admin.token}` };
    const hU1 = { Authorization: `Bearer ${user1.token}` };
    const hUnauth = { Authorization: `Bearer ${unauth.token}` };

    const group = (await axios.post(`${API}/groups`, { name: "Split Test Group" }, { headers: hAdmin })).data;
    await axios.post(`${API}/groups/${group.id}/members`, { email: user1.user.email }, { headers: hAdmin });
    await axios.post(`${API}/groups/${group.id}/members`, { email: user2.user.email }, { headers: hAdmin });

    return { admin, user1, user2, unauth, group, hAdmin, hU1, hUnauth };
}

async function runTest() {
    try {
        const { admin, user1, user2, unauth, group, hAdmin, hU1, hUnauth } = await setup();
        log("=== Expense Validation Tests ===");

        // 1. EQUAL split creation
        let res = await axios.post(`${API}/groups/${group.id}/expenses`, {
            paidById: admin.user.id, amount: 300, description: "Equal Test", splitType: "EQUAL",
            splits: [{ userId: admin.user.id }, { userId: user1.user.id }, { userId: user2.user.id }]
        }, { headers: hAdmin });
        log("1. EQUAL split creation: " + (res.status === 201 && res.data.splits[0].amountOwed === 100 ? "PASS" : "FAIL"));
        const testExpenseId = res.data.id;

        // 2. UNEQUAL valid
        res = await axios.post(`${API}/groups/${group.id}/expenses`, {
            paidById: admin.user.id, amount: 300, description: "UNEQUAL Valid", splitType: "UNEQUAL",
            splits: [{ userId: admin.user.id, amountOwed: 50 }, { userId: user1.user.id, amountOwed: 100 }, { userId: user2.user.id, amountOwed: 150 }]
        }, { headers: hAdmin });
        log("2. UNEQUAL valid split: " + (res.status === 201 ? "PASS" : "FAIL"));

        // 3. UNEQUAL invalid
        try {
            await axios.post(`${API}/groups/${group.id}/expenses`, {
                paidById: admin.user.id, amount: 300, description: "UNEQUAL Invalid", splitType: "UNEQUAL",
                splits: [{ userId: admin.user.id, amountOwed: 50 }, { userId: user1.user.id, amountOwed: 100 }, { userId: user2.user.id, amountOwed: 100 }] // sum 250
            }, { headers: hAdmin });
            log("3. UNEQUAL invalid split: FAIL (Expected 400)");
        } catch (err) {
            log("3. UNEQUAL invalid split: " + (err.response?.status === 400 ? "PASS" : "FAIL"));
        }

        // 4. PERCENTAGE valid
        res = await axios.post(`${API}/groups/${group.id}/expenses`, {
            paidById: admin.user.id, amount: 100, description: "PERCENT Valid", splitType: "PERCENTAGE",
            splits: [{ userId: admin.user.id, percentage: 33.33 }, { userId: user1.user.id, percentage: 33.33 }, { userId: user2.user.id, percentage: 33.34 }] // sum 100
        }, { headers: hAdmin });
        log("4. PERCENTAGE valid split: " + (res.status === 201 ? "PASS" : "FAIL"));

        // 5. PERCENTAGE invalid
        try {
            await axios.post(`${API}/groups/${group.id}/expenses`, {
                paidById: admin.user.id, amount: 100, description: "PERCENT Invalid", splitType: "PERCENTAGE",
                splits: [{ userId: admin.user.id, percentage: 50 }, { userId: user1.user.id, percentage: 49 }] // sum 99
            }, { headers: hAdmin });
            log("5. PERCENTAGE invalid split: FAIL (Expected 400)");
        } catch (err) {
            log("5. PERCENTAGE invalid split: " + (err.response?.status === 400 ? "PASS" : "FAIL"));
        }

        // 6. SHARE valid
        res = await axios.post(`${API}/groups/${group.id}/expenses`, {
            paidById: admin.user.id, amount: 600, description: "SHARE Valid", splitType: "SHARE",
            splits: [{ userId: admin.user.id, shares: 1 }, { userId: user1.user.id, shares: 2 }, { userId: user2.user.id, shares: 3 }] // total 6 (100, 200, 300)
        }, { headers: hAdmin });
        log("6. SHARE valid split: " + (res.status === 201 && res.data.splits[2].amountOwed === 300 ? "PASS" : "FAIL"));

        // 7. SHARE invalid
        try {
            await axios.post(`${API}/groups/${group.id}/expenses`, {
                paidById: admin.user.id, amount: 600, description: "SHARE Invalid", splitType: "SHARE",
                splits: [{ userId: admin.user.id, shares: 1.5 }, { userId: user1.user.id, shares: 2 }] // decimals
            }, { headers: hAdmin });
            log("7. SHARE invalid split: FAIL (Expected 400)");
        } catch (err) {
            log("7. SHARE invalid split: " + (err.response?.status === 400 ? "PASS" : "FAIL"));
        }

        // 8. Edit expense
        res = await axios.patch(`${API}/expenses/${testExpenseId}`, {
            amount: 450, splitType: "EQUAL",
            splits: [{ userId: admin.user.id }, { userId: user1.user.id }, { userId: user2.user.id }]
        }, { headers: hAdmin });
        log("8. Edit expense: " + (res.status === 200 && res.data.amount === 450 && res.data.splits[0].amountOwed === 150 ? "PASS" : "FAIL"));

        // 9. Delete expense
        res = await axios.delete(`${API}/expenses/${testExpenseId}`, { headers: hAdmin });
        try {
            await axios.get(`${API}/expenses/${testExpenseId}`, { headers: hAdmin });
        } catch (err) {
            log("9. Delete expense: " + (res.status === 200 && err.response?.status === 404 ? "PASS" : "FAIL"));
        }

        // 10. Unauthorized expense creation
        try {
            await axios.post(`${API}/groups/${group.id}/expenses`, {
                paidById: unauth.user.id, amount: 100, description: "Hacker Expense", splitType: "EQUAL",
                splits: [{ userId: unauth.user.id }]
            }, { headers: hUnauth });
            log("10. Unauthorized expense creation: FAIL");
        } catch (err) {
            log("10. Unauthorized expense creation: " + ((err.response?.status === 403 || err.response?.status === 404) ? "PASS" : "FAIL"));
        }

        fs.writeFileSync('test_exp_out.txt', LOG, 'utf8');
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('test_exp_out.txt', "ERROR: " + (e.response?.data?.error || e.message), 'utf8');
        process.exit(1);
    }
}

runTest();
