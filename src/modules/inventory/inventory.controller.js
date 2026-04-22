const InventoryItem = require('./inventory.model');

// GET /api/inventory — all stock, fully populated with catalog details
const getInventory = async (req, res, next) => {
  try {
    const items = await InventoryItem.find({})
      .populate('catalogItem')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory — add stock for a catalog item
// Body: { catalogItemId, foamType, quantity, notes }
const addInventoryItem = async (req, res, next) => {
  try {
    const { catalogItemId, foamType, quantity, notes } = req.body;

    if (!catalogItemId || !foamType || !quantity) {
      res.status(400);
      throw new Error('catalogItemId, foamType and quantity are required.');
    }

    // Try to find existing record for this product+foam combo and increment qty
    const existing = await InventoryItem.findOne({ catalogItem: catalogItemId, foamType });

    if (existing) {
      existing.quantityOnHand += Number(quantity);
      if (notes) existing.notes = notes;
      await existing.save();
      const populated = await existing.populate('catalogItem');
      return res.json({ message: 'Stock updated', item: populated });
    }

    const item = await InventoryItem.create({
      catalogItem: catalogItemId,
      foamType,
      quantityOnHand: Number(quantity),
      notes: notes || '',
    });

    const populated = await item.populate('catalogItem');
    res.status(201).json({ message: 'Stock added', item: populated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/inventory/:id — update quantity or notes
const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Inventory item not found');
    }

    const { quantityOnHand, notes } = req.body;
    if (quantityOnHand !== undefined) item.quantityOnHand = Number(quantityOnHand);
    if (notes !== undefined) item.notes = notes;

    await item.save();
    const populated = await item.populate('catalogItem');
    res.json({ message: 'Updated', item: populated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/inventory/:id
const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Inventory item not found');
    }
    res.json({ message: 'Removed from inventory' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem };
