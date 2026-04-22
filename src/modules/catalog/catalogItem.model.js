const mongoose = require('mongoose');

const catalogItemSchema = new mongoose.Schema({
  category: { type: String, required: true },
  productType: { type: String, required: true },
  sizeInches: { type: String },
  sizeFeet: { type: String },
  purchasePriceRosefoam: { type: Number, default: null },
  purchasePriceEcoFoam: { type: Number, default: null },
  retailPriceRosefoam: { type: Number, default: null },
  retailPriceEcoFoam: { type: Number, default: null },
}, { timestamps: true });

// Create a compound index so we don't insert duplicate catalog items
catalogItemSchema.index({ category: 1, productType: 1, sizeInches: 1, sizeFeet: 1 }, { unique: true });

const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);

module.exports = CatalogItem;
