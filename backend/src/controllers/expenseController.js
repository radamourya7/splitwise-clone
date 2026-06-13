const expenseService = require('../services/expenseService');

exports.createGroupExpense = async (req, res) => {
    try {
        const expense = await expenseService.createExpense(req.user.id, req.params.id, req.body);
        res.status(201).json(expense);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getGroupExpenses = async (req, res) => {
    try {
        const expenses = await expenseService.getGroupExpenses(req.user.id, req.params.id);
        res.status(200).json(expenses);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getExpenseById = async (req, res) => {
    try {
        const expense = await expenseService.getExpenseById(req.user.id, req.params.id);
        res.status(200).json(expense);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const expense = await expenseService.updateExpense(req.user.id, req.params.id, req.body);
        res.status(200).json(expense);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const result = await expenseService.deleteExpense(req.user.id, req.params.id);
        res.status(200).json(result);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};
