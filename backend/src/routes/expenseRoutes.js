const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

router.get('/:id', protect, expenseController.getExpenseById);
router.patch('/:id', protect, expenseController.updateExpense);
router.delete('/:id', protect, expenseController.deleteExpense);

module.exports = router;
