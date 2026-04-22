require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const { notFound, errorHandler } = require('./shared/middlewares/errorHandler');
const userRoutes = require('./modules/users/user.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const catalogRoutes = require('./modules/catalog/catalogItem.routes');
const salesRoutes = require('./modules/sales/sale.routes');
const depositRoutes = require('./modules/deposits/deposit.routes');
const orderRoutes = require('./modules/orders/order.routes');

const app = express();

// Connect to database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/orders', orderRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
