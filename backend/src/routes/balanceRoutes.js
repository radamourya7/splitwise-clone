const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const balanceController = require('../controllers/balanceController');

const router = express.Router();

router.get('/', protect, balanceController.getOverallBalances);

module.exports = router;
