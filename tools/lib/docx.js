// Word (.docx) output.

const {
  Document, Paragraph, TextRun, ExternalHyperlink, AlignmentType,
  HeadingLevel, LevelFormat, BorderStyle, Tab, TabStopType,
} = require('docx');
const { parseInline, contactLines } = require('./markup');

const FONT = 'Calibri';
const BODY_SIZE = 20; // half-points: 10 pt
const MARGIN = 864; // 0.6 in, in DXA (1440 per inch)
const TEXT_WIDTH = 12240 - 2 * MARGIN; // US Letter width minus margins

function runs(str, base = {}) {
  if (!str) return [];
  return parseInline(String(str)).map((s) => {
    const opts = { text: s.text, bold: base.bold || s.bold, italics: base.italics || s.italic };
    if (s.url) return new ExternalHyperlink({ link: s.url, children: [new TextRun(opts)] });
    return new TextRun(opts);
  });
}

// A plain right-aligned tab stop at the right margin. (Word's "positional
// tab" is ignored by LibreOffice and some converters, which then run the date
// into the title.)
function lineParagraph(left, right, leftStyle, keepNext = true) {
  const children = [...runs(left, leftStyle)];
  if (right) children.push(new TextRun({ children: [new Tab()] }), ...runs(right));
  return new Paragraph({
    children, keepNext, spacing: { after: 0 },
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }],
  });
}

const bullet = (text) => new Paragraph({
  children: runs(text), numbering: { reference: 'bullets', level: 0 }, spacing: { after: 10 },
});

// Unbulleted list item with a hanging indent (mirrors the LaTeX version).
const plainItem = (text) => new Paragraph({
  children: runs(text), indent: { left: 300, hanging: 300 }, spacing: { after: 20 },
});

// Content shared by sections and subsections.
function docxBody(s) {
  const out = [];
  if (s.paragraph) out.push(new Paragraph({ children: runs(s.paragraph) }));
  if (s.skills) {
    for (const k of s.skills) {
      out.push(new Paragraph({
        children: [new TextRun({ text: `${k.label}: `, bold: true }), ...runs(k.text)],
        spacing: { after: 20 },
      }));
    }
  }
  if (s.entries) {
    for (const e of s.entries) {
      out.push(lineParagraph(e.heading, e.right, { bold: true }));
      if (e.sub || e.sub_right) out.push(lineParagraph(e.sub, e.sub_right, { italics: true }));
      if (e.intro) out.push(new Paragraph({ children: runs(e.intro), keepNext: true, spacing: { after: 20 } }));
      for (const d of e.details || []) out.push(new Paragraph({ children: runs(d), spacing: { after: 0 } }));
      for (const b of e.bullets || []) out.push(bullet(b));
      out.push(new Paragraph({ children: [], spacing: { after: 0 }, style: 'EntryGap' }));
    }
  }
  if (s.list) for (const item of s.list) out.push(s.unbulleted ? plainItem(item) : bullet(item));
  for (const sub of s.subsections || []) {
    out.push(new Paragraph({ text: sub.title, heading: HeadingLevel.HEADING_2 }), ...docxBody(sub));
  }
  return out;
}

const docxSection = (s) => [
  new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }), ...docxBody(s),
];

function buildDocx(doc) {
  const header = `${doc.name}, ${doc.credentials}`;
  const contactParagraphs = contactLines(doc.contact).map((line, n, all) => {
    const children = [];
    line.forEach((c, i) => {
      if (i) children.push(new TextRun({ text: '  |  ' }));
      children.push(...runs(c));
    });
    return new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: n === all.length - 1 ? 60 : 0 }, children,
    });
  });
  return new Document({
    creator: doc.name,
    title: header,
    styles: {
      // line: 230 (~0.96 x single) offsets Calibri's tall default line
      // height so the Word resume fits the same 2 pages as the LaTeX one
      default: { document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: 230 } } } },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 24, bold: true, color: '000000' },
          paragraph: {
            spacing: { before: 140, after: 60 }, keepNext: true, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
          },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: BODY_SIZE, bold: true, color: '000000' },
          paragraph: { spacing: { before: 80, after: 40 }, keepNext: true, outlineLevel: 1 },
        },
        {
          id: 'EntryGap', name: 'Entry Gap', basedOn: 'Normal',
          run: { size: 8 }, paragraph: { spacing: { before: 0, after: 0, line: 120 } },
        },
      ],
    },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 300, hanging: 220 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
          children: [new TextRun({ text: header, bold: true, size: 36 })],
        }),
        ...contactParagraphs,
        ...doc.sections.flatMap(docxSection),
      ],
    }],
  });
}

module.exports = { buildDocx };
