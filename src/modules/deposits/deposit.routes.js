const express = require('express');
const router = express.Router();
const { getDeposits, createDeposit, addPayment, deleteDeposit } = require('./deposit.controller');

router.route('/').get(getDeposits).post(createDeposit);
router.route('/:id').delete(deleteDeposit);
router.route('/:id/payments').post(addPayment);

module.exports = router;
