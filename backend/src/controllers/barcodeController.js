const PDFDocument   = require('pdfkit');
const bwipjs        = require('bwip-js');

/** mm → PDF points */
const mmToPt = mm => mm * 2.8346;

exports.generateBarcodePDF = async (req, res) => {
  try {
    const { data = {}, filename = 'barcodes' } = req.body;
    const { receipt_id, consignment_id, box_id } = data;
    if (![receipt_id, consignment_id, box_id].every(Boolean)) {
      return res.status(400).json({
        success: false,
        error: 'Missing receipt_id, consignment_id or box_id'
      });
    }

    // —— Layout (mm) ——
    const PAGE_MM     = 100;
    const TITLE_Y_MM  =   5;
    const TITLE_PT    =  14;
    const LABEL_PT    =  10;
    const BAR_W_MM    =  70;   // barcode width
    const BAR_H_MM    =  15;   // barcode height

    const LABEL1_Y_MM =  15;
    const BAR1_Y_MM   =  18;
    const LABEL2_Y_MM =  45;
    const BAR2_Y_MM   =  48;
    const LABEL3_Y_MM =  75;
    const BAR3_Y_MM   =  78;
    const CENTER_X_MM = (PAGE_MM - BAR_W_MM) / 2;

    // —— Convert mm → pts ——
    const pagePt = mmToPt(PAGE_MM);
    const xPt     = mmToPt(CENTER_X_MM);
    const barWPt  = mmToPt(BAR_W_MM);
    const barHPt  = mmToPt(BAR_H_MM);

    // —— Generate barcodes as PNG buffers ——  
    const [png1, png2, png3] = await Promise.all([
      bwipjs.toBuffer({
        bcid:        'code128',       // Barcode type
        text:        receipt_id,      
        scale:       3,               // 3x scaling
        height:      BAR_H_MM * 5,    // pixels: mm→rough px (5px per mm)
        includetext: false,           // no text (we have labels)
        paddingwidth: 10,
        paddingheight: 10,
      }),
      bwipjs.toBuffer({
        bcid: 'code128', text: consignment_id,
        scale: 3, height: BAR_H_MM * 5, includetext: false,
        paddingwidth: 10, paddingheight: 10,
      }),
      bwipjs.toBuffer({
        bcid: 'code128', text: box_id,
        scale: 3, height: BAR_H_MM * 5, includetext: false,
        paddingwidth: 10, paddingheight: 10,
      }),
    ]);

    // —— Create PDF ——
    const doc = new PDFDocument({ size: [pagePt, pagePt], margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    doc.pipe(res);

    // — Title —
    doc
      .font('Helvetica-Bold')
      .fontSize(TITLE_PT)
      .text('Barcode Document', 0, mmToPt(TITLE_Y_MM), {
        width: pagePt,
        align: 'center'
      });

    // — 1️⃣ Receipt ID —
    doc
      .font('Helvetica-Bold')
      .fontSize(LABEL_PT)
      .text(`Receipt ID: ${receipt_id}`, 0, mmToPt(LABEL1_Y_MM), {
        width: pagePt,
        align: 'center'
      });
    doc.image(png1, xPt, mmToPt(BAR1_Y_MM), { width: barWPt, height: barHPt });

    // — 2️⃣ Consignment ID —
    doc
      .font('Helvetica-Bold')
      .fontSize(LABEL_PT)
      .text(`Consignment ID: ${consignment_id}`, 0, mmToPt(LABEL2_Y_MM), {
        width: pagePt,
        align: 'center'
      });
    doc.image(png2, xPt, mmToPt(BAR2_Y_MM), { width: barWPt, height: barHPt });

    // — 3️⃣ Box ID —
    doc
      .font('Helvetica-Bold')
      .fontSize(LABEL_PT)
      .text(`Box ID: ${box_id}`, 0, mmToPt(LABEL3_Y_MM), {
        width: pagePt,
        align: 'center'
      });
    doc.image(png3, xPt, mmToPt(BAR3_Y_MM), { width: barWPt, height: barHPt });

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
