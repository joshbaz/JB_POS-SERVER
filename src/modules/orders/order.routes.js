const express = require('express');
const router = express.Router();
const { getOrders, createOrder, receiveOrder, cancelOrder } = require('./order.controller');

router.route('/').get(getOrders).post(createOrder);
router.route('/:id/receive').post(receiveOrder);
router.route('/:id/cancel').post(cancelOrder);

module.exports = router;
