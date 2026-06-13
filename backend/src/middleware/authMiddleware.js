const { verifyToken } = require('../utils/jwt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = verifyToken(token);

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, name: true, email: true } // omit password
            });

            if (!user) {
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }
};

module.exports = { protect };
