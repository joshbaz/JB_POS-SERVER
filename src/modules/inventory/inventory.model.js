const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  // Reference to the factory catalog
  catalogItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CatalogItem',
    required: true,
  },
  // Which foam variant this stock unit is
  foamType: {
    type: String,
    enum: ['Rosefoam', 'EcoFoam'],
    required: true,
  },
  quantityOnHand: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock',
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

// Auto-set status based on quantity before saving
inventoryItemSchema.pre('save', async function () {
  if (this.quantityOnHand === 0) this.status = 'out_of_stock';
  else if (this.quantityOnHand <= 3) this.status = 'low_stock';
  else this.status = 'in_stock';
});

// A unique unit = one catalog item + one foam type in stock
inventoryItemSchema.index({ catalogItem: 1, foamType: 1 }, { unique: true });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem;
