const PDFDocument = require('pdfkit');
const { DOMImplementation, XMLSerializer } = require('xmldom');
const SVGtoPDF = require('svg-to-pdfkit');

/**
 * Generates a PDF with barcodes from the provided data
 * Each label/value pair is rendered on one line with its barcode to the right
 */
exports.generateBarcodePDF = async (req, res) => {
  try {
    // Extract and validate input
    const { data = {}, filename = 'barcodes' } = req.body;
    const { receipt_id, consignment_id, box_id } = data;
    if (!receipt_id || !consignment_id || !box_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data: receipt_id, consignment_id, box_id'
      });
    }

    // Create PDF (half A4 landscape)
    const doc = new PDFDocument({
      size: [419.53, 297.64],
      margin: 30,
      info: { Title: 'Barcode Document', Author: 'File Manipulator Extension' }
    });

    // Prepare response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const leftX = doc.page.margins.left;
    const barcodeX = pageWidth / 2 + 10;
    const rowGap = 40;

    // Header
    doc.font('Helvetica-Bold').fontSize(20).text('Barcodes', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(9)
       .text(`File: ${filename} | Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Barcode items
    const items = [
      { label: 'Receipt ID', value: receipt_id },
      { label: 'Consignment ID', value: consignment_id },
      { label: 'Box ID', value: box_id }
    ];

    // DOM setup for SVG creation
    const domImpl = new DOMImplementation();
    const xmlSerializer = new XMLSerializer();

    // Draw each item with its barcode on the same line
    let currentY = doc.y;
    items.forEach(({ label, value }, idx) => {
      // Text label + value
      doc.font('Helvetica-Bold').fontSize(12)
         .text(`${label}:`, leftX, currentY);
      doc.font('Helvetica').fontSize(12)
         .text(value, leftX + 80, currentY);

      // Build barcode SVG for this value
      const svgDoc = domImpl.createDocument('http://www.w3.org/2000/svg', 'svg', null);
      const svgRoot = svgDoc.documentElement;
      const barWidth = 2;
      const barHeight = 50;
      const barcodeWidth = 200;
      svgRoot.setAttribute('width', barcodeWidth);
      svgRoot.setAttribute('height', barHeight);

      const pattern = generateCode128(value);
      let xPos = 0;
      pattern.forEach(bit => {
        if (bit) {
          const rect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', xPos);
          rect.setAttribute('y', 0);
          rect.setAttribute('width', barWidth);
          rect.setAttribute('height', barHeight);
          rect.setAttribute('fill', '#000');
          svgRoot.appendChild(rect);
        }
        xPos += barWidth;
      });
      const svgString = xmlSerializer.serializeToString(svgRoot);

      // Place barcode to the right of text
      SVGtoPDF(doc, svgString, barcodeX, currentY - 2, {
        width: barcodeWidth,
        preserveAspectRatio: 'xMinYMin meet'
      });

      // Move down for next item
      currentY += barHeight + 20;
    });

    // Finalize
    doc.end();
  } catch (err) {
    console.error('Error generating barcode PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

/**
 * Simplified Code128 pattern generator (for demo purposes)
 * @param {string} text
 * @returns {boolean[]}
 */
function generateCode128(text) {
  let pattern = [true, true, false, true, false, false, true];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    for (let i = 0; i < 6; i++) {
      pattern.push(Boolean((code >> i) & 1));
      pattern.push(false);
    }
  }
  return pattern.concat([true, true, false, false, true]);
}
