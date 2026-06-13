const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const validateSplits = (amount, type, splits) => {
    if (!splits || splits.length === 0) throw { status: 400, message: 'Splits cannot be empty' };

    if (type === 'EQUAL') {
        const share = Number((amount / splits.length).toFixed(2));
        let totalAssigned = 0;

        return splits.map((s, idx) => {
            let finalShare = share;
            if (idx === splits.length - 1) {
                finalShare = Number((amount - totalAssigned).toFixed(2));
            }
            totalAssigned += share;
            return { userId: s.userId, amountOwed: finalShare };
        });
    }

    if (type === 'UNEQUAL') {
        const sum = splits.reduce((acc, curr) => acc + curr.amountOwed, 0);
        if (Math.abs(sum - amount) > 0.01) {
            throw { status: 400, message: 'Sum of splits must equal expense amount' };
        }
        return splits.map(s => ({ userId: s.userId, amountOwed: s.amountOwed }));
    }

    if (type === 'PERCENTAGE') {
        const percentSum = splits.reduce((acc, curr) => acc + curr.percentage, 0);
        if (Math.abs(percentSum - 100) > 0.01) {
            throw { status: 400, message: 'Percentages must total exactly 100' };
        }

        let totalAssigned = 0;
        return splits.map((s, idx) => {
            let finalShare = Number(((s.percentage / 100) * amount).toFixed(2));
            if (idx === splits.length - 1) {
                finalShare = Number((amount - totalAssigned).toFixed(2));
            }
            totalAssigned += finalShare;
            return { userId: s.userId, amountOwed: finalShare, percentage: s.percentage };
        });
    }

    if (type === 'SHARE') {
        const totalShares = splits.reduce((acc, curr) => acc + curr.shares, 0);
        if (totalShares <= 0 || !splits.every(s => Number.isInteger(s.shares) && s.shares > 0)) {
            throw { status: 400, message: 'Shares must be positive integers' };
        }

        let totalAssigned = 0;
        return splits.map((s, idx) => {
            let finalShare = Number(((s.shares / totalShares) * amount).toFixed(2));
            if (idx === splits.length - 1) {
                finalShare = Number((amount - totalAssigned).toFixed(2));
            }
            totalAssigned += finalShare;
            return { userId: s.userId, amountOwed: finalShare, shares: s.shares };
        });
    }
};

const verifyGroupMember = async (userId, groupId) => {
    const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: Number(groupId) } }
    });
    if (!member) throw { status: 403, message: 'User is not a member of this group' };
};

const createExpense = async (userId, groupId, data) => {
    groupId = Number(groupId);
    await verifyGroupMember(userId, groupId);

    const { paidById, amount, description, splitType, splits } = data;
    if (!paidById || !amount || !description || !splitType) {
        throw { status: 400, message: 'Missing required expense fields' };
    }

    await verifyGroupMember(paidById, groupId);
    for (let s of splits) {
        await verifyGroupMember(s.userId, groupId);
    }

    const processedSplits = validateSplits(amount, splitType, splits);

    return await prisma.$transaction(async (tx) => {
        return await tx.expense.create({
            data: {
                groupId,
                paidById,
                amount,
                description,
                type: splitType,
                splits: {
                    create: processedSplits
                }
            },
            include: { splits: true }
        });
    });
};

const getGroupExpenses = async (userId, groupId) => {
    await verifyGroupMember(userId, groupId);
    return await prisma.expense.findMany({
        where: { groupId: Number(groupId) },
        include: { splits: true }
    });
};

const getExpenseById = async (userId, expenseId) => {
    expenseId = Number(expenseId);
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId }
    });
    if (!expense) throw { status: 404, message: 'Expense not found' };
    await verifyGroupMember(userId, expense.groupId);

    return await prisma.expense.findUnique({
        where: { id: expenseId },
        include: { splits: true }
    });
};

const updateExpense = async (userId, expenseId, data) => {
    expenseId = Number(expenseId);
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing) throw { status: 404, message: 'Expense not found' };
    await verifyGroupMember(userId, existing.groupId);

    const amount = data.amount || existing.amount;
    const splitType = data.splitType || existing.type;

    if (data.splits) {
        for (let s of data.splits) {
            await verifyGroupMember(s.userId, existing.groupId);
        }
    }

    const processedSplits = data.splits ? validateSplits(amount, splitType, data.splits) : null;

    return await prisma.$transaction(async (tx) => {
        if (processedSplits) {
            await tx.expenseSplit.deleteMany({ where: { expenseId } });
        }

        return await tx.expense.update({
            where: { id: expenseId },
            data: {
                amount: data.amount,
                description: data.description,
                type: data.splitType,
                paidById: data.paidById,
                ...(processedSplits && {
                    splits: {
                        create: processedSplits
                    }
                })
            },
            include: { splits: true }
        });
    });
};

const deleteExpense = async (userId, expenseId) => {
    expenseId = Number(expenseId);
    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing) throw { status: 404, message: 'Expense not found' };
    await verifyGroupMember(userId, existing.groupId);

    return await prisma.$transaction(async (tx) => {
        await tx.expense.delete({ where: { id: expenseId } });
        return { message: 'Expense deleted successfully' };
    });
};

module.exports = {
    createExpense, getGroupExpenses, getExpenseById, updateExpense, deleteExpense
};
