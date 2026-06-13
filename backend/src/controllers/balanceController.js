const balanceService = require('../services/balanceService');

exports.getGroupBalances = async (req, res) => {
    try {
        const balances = await balanceService.getGroupBalances(req.user.id, req.params.id);
        res.status(200).json(balances);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getOverallBalances = async (req, res) => {
    try {
        const balances = await balanceService.getOverallBalances(req.user.id);
        res.status(200).json(balances);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
