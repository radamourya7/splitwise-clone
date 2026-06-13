const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createGroup = async (userId, name) => {
    if (!name) throw { status: 400, message: 'Group name is required' };

    return await prisma.group.create({
        data: {
            name,
            members: {
                create: {
                    userId,
                    role: 'ADMIN' // Prisma enum Role.ADMIN
                }
            }
        },
        include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } }
        }
    });
};

const getGroups = async (userId) => {
    return await prisma.group.findMany({
        where: { members: { some: { userId } } },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });
};

const getGroupById = async (userId, groupId) => {
    const group = await prisma.group.findUnique({
        where: { id: Number(groupId) },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });

    if (!group) throw { status: 404, message: 'Group not found' };

    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) throw { status: 403, message: 'Permission denied' };

    return group;
};

const updateGroup = async (userId, groupId, name) => {
    if (!name) throw { status: 400, message: 'Group name is required' };

    const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: Number(groupId) } }
    });

    if (!member || member.role !== 'ADMIN') throw { status: 403, message: 'Permission denied' };

    return await prisma.group.update({
        where: { id: Number(groupId) },
        data: { name }
    });
};

const deleteGroup = async (userId, groupId) => {
    const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: Number(groupId) } }
    });

    if (!member || member.role !== 'ADMIN') throw { status: 403, message: 'Permission denied' };

    await prisma.group.delete({ where: { id: Number(groupId) } });
    return { message: 'Group deleted successfully' };
};

const addMember = async (adminId, groupId, email) => {
    const adminMember = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: adminId, groupId: Number(groupId) } }
    });
    if (!adminMember || adminMember.role !== 'ADMIN') throw { status: 403, message: 'Permission denied' };

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) throw { status: 404, message: 'User not found' };

    const existingMember = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: targetUser.id, groupId: Number(groupId) } }
    });

    if (existingMember) throw { status: 409, message: 'User already member' };

    return await prisma.groupMember.create({
        data: {
            userId: targetUser.id,
            groupId: Number(groupId),
            role: 'MEMBER' // Prisma enum Role.MEMBER
        },
        include: { user: { select: { id: true, name: true, email: true } } }
    });
};

const removeMember = async (adminId, groupId, targetUserId) => {
    groupId = Number(groupId);
    targetUserId = Number(targetUserId);

    const adminMember = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: adminId, groupId } }
    });
    if (!adminMember || adminMember.role !== 'ADMIN') throw { status: 403, message: 'Permission denied' };

    const memberToRemove = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: targetUserId, groupId } }
    });
    if (!memberToRemove) throw { status: 404, message: 'User not found in group' };

    const allMembers = await prisma.groupMember.findMany({
        where: { groupId },
        orderBy: { joinedAt: 'asc' }
    });

    if (allMembers.length === 1) throw { status: 400, message: 'Cannot remove the final member of a group' };

    await prisma.groupMember.delete({
        where: { id: memberToRemove.id }
    });

    // Transfer ADMIN role logic
    if (targetUserId === adminId) {
        const remainingMembers = allMembers.filter(m => m.userId !== adminId);
        const oldestMember = remainingMembers[0];

        if (oldestMember) {
            await prisma.groupMember.update({
                where: { id: oldestMember.id },
                data: { role: 'ADMIN' }
            });
        }
    }

    return { message: 'Member removed successfully' };
};

module.exports = {
    createGroup, getGroups, getGroupById, updateGroup, deleteGroup, addMember, removeMember
};
