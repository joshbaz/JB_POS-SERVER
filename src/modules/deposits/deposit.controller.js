const Deposit = require('./deposit.model');
const Sale = require('../sales/sale.model');
const InventoryItem = require('../inventory/inventory.model');

const getDeposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find({}).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (error) {
    next(error);
  }
};

const createDeposit = async (req, res, next) => {
  try {
    const { inventoryItemId, clientName, quantity, totalPrice, initialPayment, notes } = req.body;

    if (!inventoryItemId || !clientName || !quantity || totalPrice === undefined) {
      res.status(400);
      throw new Error('Required fields missing.');
    }

    const invItem = await InventoryItem.findById(inventoryItemId).populate('catalogItem');
    if (!invItem) {
      res.status(404);
      throw new Error('Inventory item not found.');
    }

    if (invItem.quantityOnHand < Number(quantity)) {
      res.status(400);
      throw new Error(`Insufficient stock. Only ${invItem.quantityOnHand} units available.`);
    }

    const deposit = await Deposit.create({
      inventoryItem: inventoryItemId,
      catalogSnapshot: {
        productType: invItem.catalogItem.productType,
        category: invItem.catalogItem.category,
        sizeInches: invItem.catalogItem.sizeInches,
        sizeFeet: invItem.catalogItem.sizeFeet,
        foamType: invItem.foamType,
      },
      clientName: clientName.trim(),
      quantity: Number(quantity),
      totalPrice: Number(totalPrice),
      amountPaid: Number(initialPayment || 0),
      payments: initialPayment > 0 ? [{ amount: Number(initialPayment), notes: 'Initial payment' }] : [],
      notes: notes || '',
    });

    // Decrement inventory immediately to "reserve" the item
    invItem.quantityOnHand -= Number(quantity);
    await invItem.save();

    res.status(201).json(deposit);
  } catch (error) {
    next(error);
  }
};

const addPayment = async (req, res, next) => {
  try {
    const { amount, notes } = req.body;
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      res.status(404);
      throw new Error('Deposit not found.');
    }

    deposit.amountPaid += Number(amount);
    deposit.payments.push({ amount: Number(amount), notes: notes || '' });

    if (deposit.amountPaid >= deposit.totalPrice) {
      deposit.status = 'completed';
      
      // Move to Sales
      const invItem = await InventoryItem.findById(deposit.inventoryItem).populate('catalogItem');
      // Even if inventory item is gone, we have snapshot. But we need cost price.
      // We can try to get cost price from catalog if available, or just use 0 if not found (though it should be there).
      let costPrice = 0;
      if (invItem) {
        costPrice = invItem.foamType === 'Rosefoam' 
          ? invItem.catalogItem.purchasePriceRosefoam 
          : invItem.catalogItem.purchasePriceEcoFoam;
      }

      await Sale.create({
        inventoryItem: deposit.inventoryItem,
        catalogSnapshot: deposit.catalogSnapshot,
        clientName: deposit.clientName,
        quantitySold: deposit.quantity,
        salePricePerUnit: deposit.totalPrice / deposit.quantity,
        costPricePerUnit: costPrice,
        notes: `Converted from deposit. Original notes: ${deposit.notes}`,
        status: 'completed'
      });

      await Deposit.findByIdAndDelete(deposit._id);
      return res.json({ message: 'Deposit completed and moved to sales.', status: 'completed' });
    }

    await deposit.save();
    res.json(deposit);
  } catch (error) {
    next(error);
  }
};

const deleteDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      res.status(404);
      throw new Error('Deposit not found.');
    }

    // Restore inventory if deposit is deleted
    const invItem = await InventoryItem.findById(deposit.inventoryItem);
    if (invItem) {
      invItem.quantityOnHand += deposit.quantity;
      await invItem.save();
    }

    await Deposit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deposit deleted and inventory restored.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDeposits, createDeposit, addPayment, deleteDeposit };
