const express = require('express');
const router = express.Router();
const { getSales, recordSale, deleteSale } = require('./sale.controller');

router.route('/').get(getSales).post(recordSale);
router.route('/:id').delete(deleteSale);

module.exports = router;
