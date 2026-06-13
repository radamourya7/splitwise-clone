const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const registerUser = async (name, email, password) => {
    if (!name || !email || !password) {
        throw { status: 400, message: 'Please provide name, email, and password' };
    }
    if (password.length < 6) {
        throw { status: 400, message: 'Password must be at least 6 characters' };
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
        throw { status: 409, message: 'Email already exists' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    });

    return {
        token: generateToken(user.id),
        user: { id: user.id, name: user.name, email: user.email }
    };
};

const loginUser = async (email, password) => {
    if (!email || !password) {
        throw { status: 400, message: 'Please provide email and password' };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw { status: 401, message: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw { status: 401, message: 'Invalid credentials' };
    }

    return {
        token: generateToken(user.id),
        user: { id: user.id, name: user.name, email: user.email }
    };
};

module.exports = { registerUser, loginUser };
