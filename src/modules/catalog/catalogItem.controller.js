const CatalogItem = require('./catalogItem.model');
const fs = require('fs');
const csv = require('csv-parser');

const parseNumber = (val) => {
  if (!val) return null;
  const parsed = Number(val.replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
};

// Retrieve all catalog items
const getCatalogItems = async (req, res, next) => {
  try {
    const items = await CatalogItem.find({}).sort({ category: 1, productType: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// Import CSV
const importCSV = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const results = [];
  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Expected headers: Category,Product Type,Size (Inches),Size (Feet),Rosefoam Price,Eco Foam Price
        const category = data['Category'];
        const productType = data['Product Type'];
        
        // Skip empty rows
        if (!category && !productType) return;

        const sizeInches = data['Size (Inches)'] || '';
        const sizeFeet = data['Size (Feet)'] || '';
        
        const rosefoamPriceRaw = data['Rosefoam Price'];
        const ecoFoamPriceRaw = data['Eco Foam Price'];

        const purchasePriceRosefoam = parseNumber(rosefoamPriceRaw);
        const purchasePriceEcoFoam = parseNumber(ecoFoamPriceRaw);

        const retailPriceRosefoam = purchasePriceRosefoam !== null ? Math.ceil(purchasePriceRosefoam * 1.30) : null;
        const retailPriceEcoFoam = purchasePriceEcoFoam !== null ? Math.ceil(purchasePriceEcoFoam * 1.30) : null;

        results.push({
          updateOne: {
            filter: { category, productType, sizeInches, sizeFeet },
            update: {
              $set: {
                category,
                productType,
                sizeInches,
                sizeFeet,
                purchasePriceRosefoam,
                purchasePriceEcoFoam,
                retailPriceRosefoam,
                retailPriceEcoFoam,
              }
            },
            upsert: true
          }
        });
      })
      .on('end', async () => {
        // Perform bulk upsert
        if (results.length > 0) {
          await CatalogItem.bulkWrite(results);
        }
        
        // Remove temp file
        fs.unlinkSync(req.file.path);
        
        res.json({ message: `Successfully imported ${results.length} catalog items.` });
      });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

module.exports = {
  getCatalogItems,
  importCSV
};
