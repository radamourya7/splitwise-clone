const settlementService = require('../services/settlementService');

exports.recordSettlement = async (req, res) => {
    try {
        const settlement = await settlementService.recordSettlement(req.user.id, req.params.id, req.body);
        res.status(201).json(settlement);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getGroupSettlements = async (req, res) => {
    try {
        const settlements = await settlementService.getGroupSettlements(req.user.id, req.params.id);
        res.status(200).json(settlements);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
