const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifyExpenseAccess = async (userId, expenseId) => {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new Error('Expense not found');

    const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: expense.groupId } }
    });
    if (!member) throw new Error('Not a group member');

    return expense;
};

module.exports = (io, socket) => {
    socket.on('joinExpenseRoom', async (payload) => {
        try {
            const { expenseId } = payload;
            await verifyExpenseAccess(socket.user.id, Number(expenseId));
            socket.join(`expense_${expenseId}`);
            socket.emit('joinedRoom', { expenseId });
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('sendMessage', async (payload) => {
        try {
            const { expenseId, message } = payload;
            if (!message || message.trim().length === 0) throw new Error('Empty message');
            if (message.length > 500) throw new Error('Message too long');

            await verifyExpenseAccess(socket.user.id, Number(expenseId));

            const chatMsg = await prisma.chatMessage.create({
                data: {
                    expenseId: Number(expenseId),
                    userId: socket.user.id,
                    message: message.trim()
                },
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            });

            // Broadcast only after db persistence
            io.to(`expense_${expenseId}`).emit('receiveMessage', chatMsg);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });
};
