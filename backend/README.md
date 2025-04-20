# Barcode Generator Backend

A Node.js server that generates PDF files with barcodes based on provided data.

## Setup

1. Install dependencies:
```
npm install
```

2. Start the server:
```
npm start
```

Or for development with auto-restart:
```
npm run dev
```

## API Endpoints

### Generate Barcode PDF

**URL**: `/api/generate-barcode`
**Method**: `POST`
**Content Type**: `application/json`

**Request Body**:
```json
{
  "data": {
    "receipt_id": "REC123456789",
    "consignment_id": "CON987654321",
    "box_id": "BOX456789123"
  },
  "filename": "example_document"
}
```

**Response**:
- A downloadable PDF file with barcodes for each ID
- Status: 200 OK

**Error Response**:
- Status: 400 Bad Request (Missing required data)
- Status: 500 Internal Server Error (Server error during PDF generation)

```json
{
  "success": false,
  "error": "Error message"
}
```

## Dependencies

- Express - Web server framework
- PDFKit - PDF generation
- JsBarcode - Barcode generation
- xmldom - DOM implementation for SVG creation
- svg-to-pdfkit - SVG to PDF conversion
- cors - Cross-origin resource sharing 