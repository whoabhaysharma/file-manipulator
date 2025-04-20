const express = require('express');
const cors = require('cors');
const barcodeRoutes = require('./routes/barcodeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', barcodeRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Barcode Generator API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 