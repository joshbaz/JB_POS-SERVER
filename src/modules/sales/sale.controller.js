const Sale = require('./sale.model');
const InventoryItem = require('../inventory/inventory.model');

// GET /api/sales — all sales, newest first
const getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find({})
      .populate('inventoryItem')
      .sort({ saleDate: -1 });

    // Attach aggregate summary in response headers
    const totalRevenue = sales.reduce((s, i) => s + i.totalRevenue, 0);
    const totalCost    = sales.reduce((s, i) => s + i.totalCost, 0);
    const totalProfit  = sales.reduce((s, i) => s + i.totalProfit, 0);
    const totalUnits   = sales.reduce((s, i) => s + i.quantitySold, 0);

    res.json({
      sales,
      summary: { totalRevenue, totalCost, totalProfit, totalUnits },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sales — record a new client purchase
// Body: { inventoryItemId, clientName, quantitySold, salePricePerUnit, saleDate?, notes? }
const recordSale = async (req, res, next) => {
  try {
    const { inventoryItemId, clientName, quantitySold, salePricePerUnit, saleDate, notes } = req.body;

    if (!inventoryItemId || !clientName || !quantitySold || salePricePerUnit === undefined) {
      res.status(400);
      throw new Error('inventoryItemId, clientName, quantitySold and salePricePerUnit are required.');
    }

    // Fetch inventory item (populated)
    const invItem = await InventoryItem.findById(inventoryItemId).populate('catalogItem');
    if (!invItem) {
      res.status(404);
      throw new Error('Inventory item not found.');
    }

    if (invItem.quantityOnHand < Number(quantitySold)) {
      res.status(400);
      throw new Error(`Insufficient stock. Only ${invItem.quantityOnHand} unit(s) available.`);
    }

    // Determine cost price snapshot from catalog
    const costPrice = invItem.foamType === 'Rosefoam'
      ? invItem.catalogItem.purchasePriceRosefoam
      : invItem.catalogItem.purchasePriceEcoFoam;

    // Record the sale
    const sale = await Sale.create({
      inventoryItem: inventoryItemId,
      catalogSnapshot: {
        productType: invItem.catalogItem.productType,
        category:    invItem.catalogItem.category,
        sizeInches:  invItem.catalogItem.sizeInches,
        sizeFeet:    invItem.catalogItem.sizeFeet,
        foamType:    invItem.foamType,
      },
      clientName:       clientName.trim(),
      quantitySold:     Number(quantitySold),
      salePricePerUnit: Number(salePricePerUnit),
      costPricePerUnit: costPrice,
      saleDate:         saleDate ? new Date(saleDate) : new Date(),
      notes:            notes || '',
    });

    // Decrement inventory
    invItem.quantityOnHand -= Number(quantitySold);
    await invItem.save();

    res.status(201).json({ message: 'Sale recorded', sale });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sales/:id — delete a sale (does NOT restore inventory)
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      res.status(404);
      throw new Error('Sale record not found.');
    }
    res.json({ message: 'Sale record deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSales, recordSale, deleteSale };
