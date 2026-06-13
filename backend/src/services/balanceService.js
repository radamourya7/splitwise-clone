const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const calculateGroupPairwise = (expenses, settlements) => {
    const net = {};

    for (let exp of expenses) {
        const creditor = exp.paidById;
        for (let split of exp.splits) {
            const debtor = split.userId;
            if (debtor === creditor) continue;

            const pair = [debtor, creditor].sort((a, b) => a - b);
            const key = `${pair[0]}_${pair[1]}`;
            if (!net[key]) net[key] = 0;

            if (debtor === pair[0]) {
                net[key] += split.amountOwed;
            } else {
                net[key] -= split.amountOwed;
            }
        }
    }

    for (let set of settlements) {
        const payer = set.payerId;
        const receiver = set.receiverId;
        if (payer === receiver) continue;

        const pair = [payer, receiver].sort((a, b) => a - b);
        const key = `${pair[0]}_${pair[1]}`;
        if (!net[key]) net[key] = 0;

        // Payer pays down debt -> behaves like Receiver owes Payer mathematically for offsets
        if (receiver === pair[0]) {
            net[key] += set.amount;
        } else {
            net[key] -= set.amount;
        }
    }

    const result = [];
    for (let key in net) {
        let amount = Math.round(net[key] * 100) / 100;
        if (amount === 0) continue;

        const [u1, u2] = key.split('_').map(Number);
        if (amount > 0) {
            result.push({ debtor: u1, creditor: u2, amount: amount });
        } else {
            result.push({ debtor: u2, creditor: u1, amount: Math.abs(amount) });
        }
    }
    return result;
};

const getGroupBalances = async (userId, groupId) => {
    groupId = Number(groupId);
    const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } }
    });
    if (!member) throw { status: 403, message: 'Not a member of group' };

    const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: { splits: true }
    });

    const settlements = await prisma.settlement.findMany({
        where: { groupId }
    });

    return calculateGroupPairwise(expenses, settlements);
};

const getOverallBalances = async (userId) => {
    // Find all groups user belongs to
    const userGroups = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true }
    });

    let totalOwedByMe = 0;
    let totalOwedToMe = 0;

    for (let g of userGroups) {
        const expenses = await prisma.expense.findMany({
            where: { groupId: g.groupId },
            include: { splits: true }
        });
        const settlements = await prisma.settlement.findMany({
            where: { groupId: g.groupId }
        });

        const pairwise = calculateGroupPairwise(expenses, settlements);
        for (let b of pairwise) {
            if (b.debtor === userId) totalOwedByMe += b.amount;
            if (b.creditor === userId) totalOwedToMe += b.amount;
        }
    }

    // Fix precision
    totalOwedByMe = Math.round(totalOwedByMe * 100) / 100;
    totalOwedToMe = Math.round(totalOwedToMe * 100) / 100;
    const netBalance = Math.round((totalOwedToMe - totalOwedByMe) * 100) / 100;

    return { totalOwedByMe, totalOwedToMe, netBalance };
};

module.exports = { getGroupBalances, getOverallBalances, calculateGroupPairwise };
