const express = require('express');
const barcodeController = require('../controllers/barcodeController');

const router = express.Router();

// POST endpoint to generate barcode PDF
router.post('/generate-barcode', barcodeController.generateBarcodePDF);

module.exports = router; 