/**
 * PDF Generator Utility
 * Creates a PDF with barcodes from extracted JSON data
 * - Uses OffscreenCanvas for Service Worker compatibility
 */
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';

/**
 * Create a canvas element that works in a Service Worker
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {OffscreenCanvas} New canvas
 */
function createOffscreenCanvas(width = 400, height = 200) {
  // Check if OffscreenCanvas is available
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  
  // Fallback to regular canvas if in browser context
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  
  throw new Error('Cannot create canvas: both OffscreenCanvas and document are unavailable');
}

/**
 * Generate text content for PDF without barcodes
 * @param {Object} data - JSON data with receipt_id, consignment_id, box_id
 * @param {string} originalFilename - Original filename
 * @returns {Object} Text and layout information for PDF
 */
function generateTextContent(data, originalFilename) {
  const now = new Date().toLocaleString();
  
  // Define field data
  const fields = [
    { key: 'receipt_id', label: 'Receipt ID' },
    { key: 'consignment_id', label: 'Consignment ID' },
    { key: 'box_id', label: 'Box ID' }
  ];
  
  // Format data for display
  const content = fields.map(field => {
    const value = data[field.key] || 'N/A';
    return {
      label: field.label,
      value: value
    };
  });
  
  return {
    title: 'File Processing Results',
    originalFile: originalFilename,
    processingDate: now,
    content: content
  };
}

/**
 * Create a PDF document from JSON data without barcode images
 * This version is compatible with Service Workers where DOM is not available
 * @param {Object} data - JSON data with receipt_id, consignment_id, box_id
 * @param {string} originalFilename - Original filename
 * @returns {Blob} PDF blob
 */
export async function createPdfWithoutBarcodes(data, originalFilename) {
  // Create PDF document (A4 portrait)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Generate content
  const content = generateTextContent(data, originalFilename);
  
  // Add title and metadata
  pdf.setFontSize(20);
  pdf.text(content.title, 105, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Original file: ${content.originalFile}`, 20, 30);
  pdf.text(`Processing date: ${content.processingDate}`, 20, 38);
  
  // Add separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, 45, 190, 45);
  
  let yPosition = 55;
  
  // Add data fields
  for (const item of content.content) {
    // Add field label and value
    pdf.setFontSize(14);
    pdf.text(`${item.label}:`, 20, yPosition);
    pdf.setFontSize(12);
    pdf.text(item.value, 80, yPosition);
    
    // Add text representation of barcode
    yPosition += 15;
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(20, yPosition, 170, 20, 3, 3, 'FD');
    
    pdf.setFontSize(10);
    if (item.value !== 'N/A') {
      // Draw a "fake" barcode representation with the text
      pdf.text(`[BARCODE: ${item.value}]`, 105, yPosition + 10, { align: 'center' });
    } else {
      pdf.text('No barcode data available', 105, yPosition + 10, { align: 'center' });
    }
    
    yPosition += 35; // Space for next field
  }
  
  // Add QR code info
  pdf.setFillColor(240, 240, 240);
  pdf.roundedRect(20, yPosition, 170, 40, 3, 3, 'FD');
  
  pdf.setFontSize(12);
  pdf.text('Data Summary (QR Code):', 20, yPosition + 10);
  
  // Format JSON data for display
  const jsonStr = JSON.stringify({
    receipt_id: data.receipt_id || 'N/A',
    consignment_id: data.consignment_id || 'N/A',
    box_id: data.box_id || 'N/A'
  }, null, 2);
  
  pdf.setFontSize(10);
  pdf.text(jsonStr, 25, yPosition + 20);
  
  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  // Return PDF as blob
  return pdf.output('blob');
}

/**
 * Create a data URL from a PDF blob
 * @param {Blob} pdfBlob - PDF blob
 * @returns {Promise<string>} Data URL
 */
export function pdfBlobToDataUrl(pdfBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(pdfBlob);
  });
} 