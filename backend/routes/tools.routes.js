const { Router } = require('express');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const QRCode = require('qrcode');
const { spawn } = require('node:child_process');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const toolsRouter = Router();
const { authenticateToken } = require('./auth');
const spacesService = require('../services/spacesService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function buildQrLabelsPdf(labels) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const lab of labels) {
    const page = pdf.addPage([595, 842]);
    const { width, height } = page.getSize();
    const payload = `CP|${lab.kind}|${lab.direction}|${lab.year}|${lab.id}|${lab.ico}`;
    const qrPng = await QRCode.toBuffer(payload, { width: 300, margin: 1 });
    const qrImage = await pdf.embedPng(qrPng);
    const qrW = 300, qrH = 300;
    page.drawImage(qrImage, { x: (width - qrW) / 2, y: height - qrH - 180, width: qrW, height: qrH });
    const title = 'Client Portal Label';
    page.drawText(title, { x: 50, y: height - 80, size: 20, font, color: rgb(0,0,0) });
    const human = `Type: ${lab.kind}  Dir: ${lab.direction}  Year: ${lab.year}\nID: ${lab.id}  ICO: ${lab.ico}${lab.note ? `  Note: ${lab.note}` : ''}`;
    page.drawText(human, { x: 50, y: height - qrH - 210, size: 12, font });
    page.drawText(`QR: ${payload}`, { x: 50, y: 60, size: 10, font, color: rgb(0.2,0.2,0.2) });
  }
  return await pdf.save();
}

function parsePayload(payload) {
  const [prefix, kind, direction, year, docId, ico] = String(payload || '').split('|');
  if (prefix !== 'CP') throw new Error('Not a CP payload');
  const fileName = (kind === 'INV')
    ? `companies/${ico}/documents/invoices/${direction}/${year}/${docId}.pdf`
    : `companies/${ico}/documents/docs/${year}/${docId}.pdf`;
  return { kind, direction, year, docId, ico, fileName };
}

async function rasterizePdfToPngs(pdfPath, outPrefix, dpi = 200) {
  await new Promise((resolve, reject) => {
    const p = spawn('pdftoppm', ['-png', '-r', String(dpi), pdfPath, outPrefix]);
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`pdftoppm exit ${code}`)));
  });
  const dir = path.dirname(outPrefix);
  const base = path.basename(outPrefix);
  const files = (await fs.readdir(dir))
    .filter(f => f.startsWith(base + '-') && f.endsWith('.png'))
    .sort((a,b) => Number(a.replace(base + '-', '').replace('.png','')) - Number(b.replace(base + '-', '').replace('.png','')))
    .map(f => path.join(dir, f));
  return files;
}

async function detectSeparators(pngPaths) {
  const { readBarcodes } = require('zxing-wasm/reader');
  const hits = [];
  for (let i = 0; i < pngPaths.length; i++) {
    const img = await fs.readFile(pngPaths[i]);
    const res = await readBarcodes(new Uint8Array(img));
    for (const r of res) {
      const txt = r.text || '';
      if (txt.startsWith('CP|')) { hits.push({ pageIndex: i, payload: txt }); break; }
    }
  }
  return hits;
}

async function splitScannedPdfByQr(inputPdf) {
  const tdir = os.tmpdir();
  const stamp = Date.now();
  const inPath = path.join(tdir, `cp_scan_${stamp}.pdf`);
  await fs.writeFile(inPath, inputPdf);
  const outPrefix = path.join(tdir, `cp_scan_${stamp}`);
  const pngs = await rasterizePdfToPngs(inPath, outPrefix, 200);
  const seps = await detectSeparators(pngs);
  if (seps.length === 0) throw new Error('Nenašiel sa žiadny CP| separator');
  const srcPdf = await PDFDocument.load(inputPdf);
  const lastPage = srcPdf.getPageCount() - 1;
  const idxs = seps.map(s => s.pageIndex).sort((a,b) => a - b);
  const segments = [];
  for (let i = 0; i < idxs.length; i++) {
    const startAfter = idxs[i] + 1;
    const endBefore = (i + 1 < idxs.length ? idxs[i+1] : lastPage + 1) - 1;
    if (startAfter <= endBefore) segments.push({ start: startAfter, end: endBefore, payload: seps[i].payload });
  }
  const outputs = [];
  for (const seg of segments) {
    const outPdf = await PDFDocument.create();
    const pages = await outPdf.copyPages(srcPdf, Array.from({length: seg.end - seg.start + 1}, (_,k) => seg.start + k));
    pages.forEach(p => outPdf.addPage(p));
    const bytes = await outPdf.save();
    const meta = parsePayload(seg.payload);
    outputs.push({ range: [seg.start, seg.end], payload: seg.payload, ...meta, fileName: meta.fileName, bytes });
  }
  return { segments: outputs };
}

toolsRouter.post('/qr-labels', authenticateToken, async (req, res, next) => {
  try {
    const labels = req.body && req.body.labels;
    if (!Array.isArray(labels) || labels.length === 0) {
      return res.status(400).json({ error: 'labels[] required' });
    }
    const pdf = await buildQrLabelsPdf(labels);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="qr-labels.pdf"');
    return res.send(Buffer.from(pdf));
  } catch (e) { next(e); }
});

toolsRouter.post('/batch-scan', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file (PDF) required' });
    const autoUpload = String(req.query.autoUpload || req.body?.autoUpload || '').toLowerCase() === 'true';
    const result = await splitScannedPdfByQr(req.file.buffer);

    let uploads = [];
    if (autoUpload) {
      if (!spacesService.isInitialized()) {
        return res.status(503).json({ error: 'Úložisko nie je nakonfigurované (SPACES_* env chýbajú)' });
      }
      // Nahrávame len INV (faktúry) podľa existujúcej konvencie
      for (const seg of result.segments) {
        if (seg.kind !== 'INV') {
          uploads.push({ fileName: seg.fileName, uploaded: false, reason: 'unsupported_kind' });
          continue;
        }
        try {
          const { url, key } = await spacesService.getPresignedUploadUrlForInvoice(seg.ico, seg.direction, seg.year, seg.docId);
          const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: Buffer.from(seg.bytes) });
          if (!put.ok) throw new Error(`PUT failed ${put.status}`);
          uploads.push({ fileName: seg.fileName, key, uploaded: true });
        } catch (e) {
          uploads.push({ fileName: seg.fileName, uploaded: false, error: e.message });
        }
      }
    }

    // Vyrež bytes z odpovede kvôli veľkosti, ponecháme len metadáta
    const segments = result.segments.map(s => ({ range: s.range, payload: s.payload, fileName: s.fileName, kind: s.kind, direction: s.direction, year: s.year, docId: s.docId, ico: s.ico, size: s.bytes.length }));
    res.json({ count: segments.length, segments, autoUpload, uploads: autoUpload ? uploads : undefined });
  } catch (e) { next(e); }
});

module.exports = toolsRouter;


