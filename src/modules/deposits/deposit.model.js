const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  catalogSnapshot: {
    productType: { type: String, required: true },
    category: { type: String, required: true },
    sizeInches: { type: String },
    sizeFeet: { type: String },
    foamType: { type: String, enum: ['Rosefoam', 'EcoFoam'], required: true },
  },
  clientName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
}, { timestamps: true });

depositSchema.virtual('balanceDue').get(function () {
  return this.totalPrice - this.amountPaid;
});

depositSchema.set('toJSON', { virtuals: true });
depositSchema.set('toObject', { virtuals: true });

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;
