const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await authService.registerUser(name, email, password);
        res.status(201).json(result);
    } catch (error) {
        if (error.status) {
            res.status(error.status).json({ error: error.message });
        } else {
            console.error("Register Error:", error);
            res.status(500).json({ error: 'Unexpected server error' });
        }
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).json(result);
    } catch (error) {
        if (error.status) {
            res.status(error.status).json({ error: error.message });
        } else {
            console.error("Login Error:", error);
            res.status(500).json({ error: 'Unexpected server error' });
        }
    }
};

const getMe = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error("GetMe Error:", error);
        res.status(500).json({ error: 'Unexpected server error' });
    }
};

module.exports = { register, login, getMe };
