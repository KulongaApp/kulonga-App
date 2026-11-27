const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const mdPath = path.join(__dirname, '..', 'report.md');
const outPath = path.join(__dirname, '..', 'relatorio-ficticios.pdf');

if (!fs.existsSync(mdPath)) {
  console.error('report.md não encontrado em', mdPath);
  process.exit(1);
}

const md = fs.readFileSync(mdPath, 'utf8');
const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(outPath));

doc.fontSize(16).text('Relatório de Dados Fictícios (mocks)', { align: 'center' });
doc.moveDown();

const lines = md.split('\n');
let fontSize = 10;
lines.forEach((line) => {
  if (line.startsWith('# ')) {
    doc.moveDown(0.5);
    doc.fontSize(14).text(line.replace(/^#\s+/, ''));
    doc.moveDown(0.2);
    doc.fontSize(fontSize);
  } else if (line.startsWith('## ')) {
    doc.moveDown(0.3);
    doc.fontSize(12).text(line.replace(/^##\s+/, ''));
    doc.moveDown(0.1);
    doc.fontSize(fontSize);
  } else if (line.startsWith('- ')) {
    doc.list([line.replace(/^-\s+/, '')], { bulletIndent: 20 });
  } else if (line.trim() === '') {
    doc.moveDown(0.2);
  } else {
    doc.text(line);
  }
});

doc.end();
console.log('PDF gerado em', outPath);
