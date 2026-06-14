const axios = require('axios');
const fs = require('fs');
const { io } = require('socket.io-client');
const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

let LOG = "";
const log = (msg) => { LOG += msg + "\n"; };

async function createUser(prefix) {
    const email = `${prefix}_chat_${Date.now()}@test.com`;
    const res = await axios.post(`${API}/auth/register`, { name: prefix, email, password: 'password123' });
    return { ...res.data.user, token: res.data.token };
}

function connectSocket(token) {
    return new Promise((resolve, reject) => {
        const socket = io(SOCKET_URL, { auth: { token } });
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', (err) => reject(err));
    });
}

function receiveOnce(socket, event, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout on event ' + event)), timeoutMs);
        socket.once(event, (data) => {
            clearTimeout(timeout);
            if (event !== 'error') socket.off('error');
            resolve(data);
        });
        if (event !== 'error') {
            socket.once('error', (err) => {
                clearTimeout(timeout);
                socket.off(event);
                reject(new Error('Socket Error: ' + err));
            });
        }
    });
}

async function runTest() {
    try {
        const admin = await createUser('AdminChat');
        const member = await createUser('MemberChat');
        const unauth = await createUser('HackerChat');

        const hAdmin = { headers: { Authorization: `Bearer ${admin.token}` } };

        // Create group & expense
        const group = (await axios.post(`${API}/groups`, { name: "Chat Group" }, hAdmin)).data;
        await axios.post(`${API}/groups/${group.id}/members`, { email: member.email }, hAdmin);

        const expense = (await axios.post(`${API}/groups/${group.id}/expenses`, {
            paidById: admin.id, amount: 100, description: "Lunch", splitType: "EQUAL",
            splits: [{ userId: admin.id }, { userId: member.id }]
        }, hAdmin)).data;

        log("=== Socket.io Chat Tests ===");

        // 1 & 7. Connect sockets
        const sockAdmin = await connectSocket(admin.token);
        const sockMember = await connectSocket(member.token);
        let sockUnauth;
        try {
            sockUnauth = await connectSocket('invalid_token');
            log("7. Unauthorized socket rejection: FAIL");
        } catch (e) {
            log("7. Unauthorized socket rejection: PASS");
        }

        // Connect valid hacker but not in group (to test isolation)
        const sockHacker = await connectSocket(unauth.token);

        // 2. Join room & Invalid expense rejection
        const pA = receiveOnce(sockAdmin, 'joinedRoom');
        sockAdmin.emit('joinExpenseRoom', { expenseId: expense.id });
        await pA;

        const pM = receiveOnce(sockMember, 'joinedRoom');
        sockMember.emit('joinExpenseRoom', { expenseId: expense.id });
        await pM;

        // Invalid expense ID test
        sockAdmin.emit('joinExpenseRoom', { expenseId: 99999 });
        const errObj = await receiveOnce(sockAdmin, 'error');
        log("8. Invalid expense rejection (join): " + (errObj === 'Expense not found' ? "PASS" : "FAIL"));

        // Room isolation / group membership rejection
        sockHacker.emit('joinExpenseRoom', { expenseId: expense.id });
        const hackerErr = await receiveOnce(sockHacker, 'error');
        log("5. Room isolation (Hacker join): " + (hackerErr === 'Not a group member' ? "PASS" : "FAIL"));

        // 3. Send message & Receive message
        const msgPromise = receiveOnce(sockMember, 'receiveMessage');
        sockAdmin.emit('sendMessage', { expenseId: expense.id, message: "Hello Splitwise!" });
        const received = await msgPromise;
        log("3. Receive message sent broadcast: " + (received.message === "Hello Splitwise!" ? "PASS" : "FAIL"));

        // 4. Multiple users (Member replies)
        const adminReceive = receiveOnce(sockAdmin, 'receiveMessage');
        sockMember.emit('sendMessage', { expenseId: expense.id, message: "I see it!" });
        const receivedReply = await adminReceive;
        log("4. Multiple users broadcast replies: " + (receivedReply.message === "I see it!" && receivedReply.userId === member.id ? "PASS" : "FAIL"));

        // 9. Empty message rejection
        sockAdmin.emit('sendMessage', { expenseId: expense.id, message: "   " });
        const emptyErr = await receiveOnce(sockAdmin, 'error');
        log("9. Empty message rejection: " + (emptyErr === 'Empty message' ? "PASS" : "FAIL"));

        // 6. Persistence verification
        const chatHistory = (await axios.get(`${API}/expenses/${expense.id}/chat`, hAdmin)).data;
        log("6. Persistence verification (REST API): " + (chatHistory.length === 2 && chatHistory[0].message === "Hello Splitwise!" ? "PASS" : "FAIL"));

        sockAdmin.disconnect();
        sockMember.disconnect();
        sockHacker.disconnect();

        fs.writeFileSync('test_chat_out.txt', LOG, 'utf8');
        process.exit(0);

    } catch (e) {
        fs.writeFileSync('test_chat_out.txt', LOG + "\nERROR: " + (e.stack || JSON.stringify(e, Object.getOwnPropertyNames(e))), 'utf8');
        process.exit(1);
    }
}

runTest();
