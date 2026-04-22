const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  // The inventory line (gives us product + foam type)
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  },
  // Snapshot of catalog info at time of sale (survives inventory deletion)
  catalogSnapshot: {
    productType:  { type: String, required: true },
    category:     { type: String, required: true },
    sizeInches:   { type: String },
    sizeFeet:     { type: String },
    foamType:     { type: String, enum: ['Rosefoam', 'EcoFoam'], required: true },
  },
  clientName:       { type: String, required: true, trim: true },
  quantitySold:     { type: Number, required: true, min: 1 },
  // What the client actually paid per unit
  salePricePerUnit: { type: Number, required: true, min: 0 },
  // Factory cost per unit at time of sale (snapshot)
  costPricePerUnit: { type: Number, required: true, min: 0 },
  saleDate:         { type: Date, default: Date.now },
  notes:            { type: String, default: '' },
  status: {
    type: String,
    enum: ['completed', 'pending', 'refunded'],
    default: 'completed',
  },
}, { timestamps: true });

// Virtual: profit for this sale record
saleSchema.virtual('totalRevenue').get(function () {
  return this.salePricePerUnit * this.quantitySold;
});
saleSchema.virtual('totalCost').get(function () {
  return this.costPricePerUnit * this.quantitySold;
});
saleSchema.virtual('totalProfit').get(function () {
  return (this.salePricePerUnit - this.costPricePerUnit) * this.quantitySold;
});

saleSchema.set('toJSON', { virtuals: true });
saleSchema.set('toObject', { virtuals: true });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
