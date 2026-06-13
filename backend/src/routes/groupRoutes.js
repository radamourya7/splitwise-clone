const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const groupController = require('../controllers/groupController');
const expenseController = require('../controllers/expenseController');
const balanceController = require('../controllers/balanceController');
const settlementController = require('../controllers/settlementController');

const router = express.Router();

router.post('/', protect, groupController.createGroup);
router.get('/', protect, groupController.getGroups);
router.get('/:id', protect, groupController.getGroupById);
router.patch('/:id', protect, groupController.updateGroup);
router.delete('/:id', protect, groupController.deleteGroup);

router.post('/:id/members', protect, groupController.addMember);
router.delete('/:id/members/:userId', protect, groupController.removeMember);

router.post('/:id/expenses', protect, expenseController.createGroupExpense);
router.get('/:id/expenses', protect, expenseController.getGroupExpenses);

router.get('/:id/balances', protect, balanceController.getGroupBalances);
router.post('/:id/settlements', protect, settlementController.recordSettlement);
router.get('/:id/settlements', protect, settlementController.getGroupSettlements);

module.exports = router;
