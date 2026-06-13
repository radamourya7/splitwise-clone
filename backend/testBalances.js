const axios = require('axios');
const fs = require('fs');
const API = 'http://localhost:5000/api';
let LOG = "";
const log = (msg) => { LOG += msg + "\n"; };

async function createUser(prefix) {
    const email = `${prefix}_${Date.now()}@test.com`;
    const res = await axios.post(`${API}/auth/register`, { name: prefix, email, password: 'password123' });
    return { ...res.data.user, token: res.data.token };
}

async function runTest() {
    try {
        const admin = await createUser('Admin');
        const u1 = await createUser('Bob');
        const u2 = await createUser('Charlie');
        const unauth = await createUser('Hacker');

        const hAdmin = { Authorization: `Bearer ${admin.token}` };
        const hU1 = { Authorization: `Bearer ${u1.token}` };
        const hUnauth = { Authorization: `Bearer ${unauth.token}` };

        const g1 = (await axios.post(`${API}/groups`, { name: "G1" }, { headers: hAdmin })).data;
        await axios.post(`${API}/groups/${g1.id}/members`, { email: u1.email }, { headers: hAdmin });
        await axios.post(`${API}/groups/${g1.id}/members`, { email: u2.email }, { headers: hAdmin });

        const g2 = (await axios.post(`${API}/groups`, { name: "G2 Isolation" }, { headers: hAdmin })).data;
        await axios.post(`${API}/groups/${g2.id}/members`, { email: u1.email }, { headers: hAdmin });

        log("=== Balances & Settlements Tests ===");

        // 1. Expense creates balance
        await axios.post(`${API}/groups/${g1.id}/expenses`, {
            paidById: admin.id, amount: 900, splitType: "EQUAL", description: "Exp1",
            splits: [{ userId: admin.id }, { userId: u1.id }, { userId: u2.id }] // each owes 300
        }, { headers: hAdmin });

        let balances = (await axios.get(`${API}/groups/${g1.id}/balances`, { headers: hAdmin })).data;
        let bU1 = balances.find(b => b.debtor === u1.id && b.creditor === admin.id);
        let bU2 = balances.find(b => b.debtor === u2.id && b.creditor === admin.id);
        log("1. Expense creates balance: " + (bU1?.amount === 300 && bU2?.amount === 300 ? "PASS" : "FAIL"));

        // 2. Multiple expenses accumulate correctly
        await axios.post(`${API}/groups/${g1.id}/expenses`, {
            paidById: u1.id, amount: 200, splitType: "UNEQUAL", description: "Exp2",
            splits: [{ userId: admin.id, amountOwed: 200 }] // Admin owes U1 200
        }, { headers: hAdmin });
        // Admin was owed 300 by U1. Now Admin owes 200 to U1. Net = U1 owes Admin 100.
        balances = (await axios.get(`${API}/groups/${g1.id}/balances`, { headers: hAdmin })).data;
        bU1 = balances.find(b => b.debtor === u1.id && b.creditor === admin.id);
        log("2. Multiple expenses accumulate correctly: " + (bU1?.amount === 100 ? "PASS" : "FAIL"));

        // 3. Partial settlement
        let sett = await axios.post(`${API}/groups/${g1.id}/settlements`, { receiverId: admin.id, amount: 50 }, { headers: hU1 });
        balances = (await axios.get(`${API}/groups/${g1.id}/balances`, { headers: hAdmin })).data;
        bU1 = balances.find(b => b.debtor === u1.id && b.creditor === admin.id);
        log("3. Partial settlement: " + (sett.status === 201 && bU1?.amount === 50 ? "PASS" : "FAIL"));

        // 4. Full settlement
        await axios.post(`${API}/groups/${g1.id}/settlements`, { receiverId: admin.id, amount: 50 }, { headers: hU1 });
        balances = (await axios.get(`${API}/groups/${g1.id}/balances`, { headers: hAdmin })).data;
        bU1 = balances.find(b => b.debtor === u1.id && b.creditor === admin.id);
        log("4. Full settlement: " + (!bU1 ? "PASS" : "FAIL"));

        // 5. Over-settlement prevention
        try {
            await axios.post(`${API}/groups/${g1.id}/settlements`, { receiverId: admin.id, amount: 1000 }, { headers: hU2 });
            log("5. Over-settlement prevention: FAIL (Expected error)");
        } catch (e) {
            log("5. Over-settlement prevention: " + (e.response?.status === 400 ? "PASS" : "FAIL"));
        }

        // 6. Group isolation verification
        await axios.post(`${API}/groups/${g2.id}/expenses`, {
            paidById: admin.id, amount: 50, splitType: "EQUAL", description: "Exp Iso",
            splits: [{ userId: admin.id }, { userId: u1.id }] // U1 owes admin 25 in G2
        }, { headers: hAdmin });
        let balG2 = (await axios.get(`${API}/groups/${g2.id}/balances`, { headers: hAdmin })).data;
        balances = (await axios.get(`${API}/groups/${g1.id}/balances`, { headers: hAdmin })).data;
        // G1 should not have U1 owing anything. G2 should have U1 owing 25.
        let bU1_g1 = balances.find(b => b.debtor === u1.id && b.creditor === admin.id);
        let bU1_g2 = balG2.find(b => b.debtor === u1.id && b.creditor === admin.id);
        log("6. Group isolation verification: " + (!bU1_g1 && bU1_g2?.amount === 25 ? "PASS" : "FAIL"));

        // 7. Overall balance endpoint
        let overall = (await axios.get(`${API}/balances`, { headers: hAdmin })).data;
        // Admin is owed 300 from U2 (G1), and 25 from U1 (G2). Admin owes no one right now. Net = 325.
        log("7. Overall balance endpoint: " + (overall.totalOwedToMe === 325 && overall.netBalance === 325 ? "PASS" : "FAIL"));

        // 8. Unauthorized access
        try {
            await axios.get(`${API}/groups/${g1.id}/balances`, { headers: hUnauth });
            log("8. Unauthorized access: FAIL");
        } catch (e) {
            log("8. Unauthorized access: " + (e.response?.status === 403 ? "PASS" : "FAIL"));
        }

        // 9. Invalid settlement scenarios (Settle with self)
        try {
            await axios.post(`${API}/groups/${g1.id}/settlements`, { receiverId: admin.id, amount: 100 }, { headers: hAdmin });
            log("9. Invalid settlement scenarios: FAIL");
        } catch (e) {
            log("9. Invalid settlement scenarios: " + (e.response?.status === 400 ? "PASS" : "FAIL"));
        }

        fs.writeFileSync('test_bal_out.txt', LOG, 'utf8');
        process.exit(0);

    } catch (e) {
        fs.writeFileSync('test_bal_out.txt', "ERROR: " + (e.response?.data?.error || e.message), 'utf8');
        process.exit(1);
    }
}

runTest();
