const express = require('express');
const router = express.Router();
const {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('./inventory.controller');

router.route('/').get(getInventory).post(addInventoryItem);
router.route('/:id').patch(updateInventoryItem).delete(deleteInventoryItem);

module.exports = router;
