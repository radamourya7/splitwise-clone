const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        await prisma.$connect();
        console.log("SUCCESS: Prisma connected securely to Neon PostgreSQL");
        const count = await prisma.user.count();
        console.log(`Verified User count: ${count}`);
    } catch (error) {
        console.error("FAILED connecting to Neon:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
