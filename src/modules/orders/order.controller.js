const Order = require('./order.model');
const InventoryItem = require('../inventory/inventory.model');

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('catalogItem')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { catalogItemId, foamType, quantityOrdered, costPerUnit, notes } = req.body;

    const order = await Order.create({
      catalogItem: catalogItemId,
      foamType,
      quantityOrdered: Number(quantityOrdered),
      costPerUnit: Number(costPerUnit),
      notes,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const receiveOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    if (order.status === 'received') {
      res.status(400);
      throw new Error('Order already received.');
    }

    // Update Inventory
    let inventoryItem = await InventoryItem.findOne({
      catalogItem: order.catalogItem,
      foamType: order.foamType,
    });

    if (inventoryItem) {
      inventoryItem.quantityOnHand += order.quantityOrdered;
    } else {
      inventoryItem = new InventoryItem({
        catalogItem: order.catalogItem,
        foamType: order.foamType,
        quantityOnHand: order.quantityOrdered,
      });
    }

    await inventoryItem.save();

    order.status = 'received';
    order.receiveDate = Date.now();
    await order.save();

    res.json({ message: 'Order received and inventory updated.', order });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }
    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = { getOrders, createOrder, receiveOrder, cancelOrder };
