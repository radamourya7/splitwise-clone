const groupService = require('../services/groupService');

exports.createGroup = async (req, res) => {
    try {
        const group = await groupService.createGroup(req.user.id, req.body.name);
        res.status(201).json(group);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const groups = await groupService.getGroups(req.user.id);
        res.status(200).json(groups);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const group = await groupService.getGroupById(req.user.id, req.params.id);
        res.status(200).json(group);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const group = await groupService.updateGroup(req.user.id, req.params.id, req.body.name);
        res.status(200).json(group);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const result = await groupService.deleteGroup(req.user.id, req.params.id);
        res.status(200).json(result);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addMember = async (req, res) => {
    try {
        const member = await groupService.addMember(req.user.id, req.params.id, req.body.email);
        res.status(201).json(member);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const result = await groupService.removeMember(req.user.id, req.params.id, req.params.userId);
        res.status(200).json(result);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
