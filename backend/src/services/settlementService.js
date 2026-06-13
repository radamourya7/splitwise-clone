const { PrismaClient } = require('@prisma/client');
const { getGroupBalances } = require('./balanceService');
const prisma = new PrismaClient();

const recordSettlement = async (userId, groupId, data) => {
    groupId = Number(groupId);
    const { receiverId, amount } = data;
    const payerId = userId;

    if (!receiverId || !amount || amount <= 0) {
        throw { status: 400, message: 'Invalid settlement data' };
    }

    if (payerId === Number(receiverId)) {
        throw { status: 400, message: 'Cannot settle with self' };
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw { status: 404, message: 'Group not found' };

    // Validate users in group
    const payerMember = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: payerId, groupId } }
    });
    const receiverMember = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: Number(receiverId), groupId } }
    });

    if (!payerMember || !receiverMember) {
        throw { status: 403, message: 'Users must belong to group' };
    }

    // Prevent over-settlement. Extract pairwise explicitly.
    const currentBalances = await getGroupBalances(userId, groupId);
    const debt = currentBalances.find(b => b.debtor === payerId && b.creditor === Number(receiverId));

    if (!debt) {
        throw { status: 400, message: 'No existing debt to settle' };
    }

    if (amount > debt.amount) {
        throw { status: 400, message: `Over-settlement prevented. You only owe ${debt.amount}` };
    }

    return await prisma.settlement.create({
        data: {
            groupId,
            payerId,
            receiverId: Number(receiverId),
            amount
        }
    });
};

const getGroupSettlements = async (userId, groupId) => {
    groupId = Number(groupId);
    const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } }
    });
    if (!member) throw { status: 403, message: 'Permission denied' };

    return await prisma.settlement.findMany({
        where: { groupId }
    });
};

module.exports = { recordSettlement, getGroupSettlements };
