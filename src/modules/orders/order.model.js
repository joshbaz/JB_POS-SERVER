const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  catalogItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CatalogItem',
    required: true,
  },
  foamType: {
    type: String,
    enum: ['Rosefoam', 'EcoFoam'],
    required: true,
  },
  quantityOrdered: {
    type: Number,
    required: true,
    min: 1,
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'received', 'cancelled'],
    default: 'pending',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  receiveDate: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
