// Generates every version of a document from one YAML content file:
//
//   - <output>.tex           plain single-column LaTeX (lib/plain-tex.js)
//   - <output>.docx          Word (lib/docx.js)
//   - <moderncv.output>.tex  moderncv main file, plus Sections/<file>.tex for
//                            each section (lib/moderncv.js), if the YAML has a
//                            `moderncv:` block
//
//   node tools/build.js content/resume.yaml
//
// All paths are relative to the repo root (the parent of content/). Every
// generated file is overwritten. Compile the .tex files with pdflatex.

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Packer } = require('docx');
const { buildPlainTex } = require('./lib/plain-tex');
const { buildDocx } = require('./lib/docx');
const { buildModerncv } = require('./lib/moderncv');

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error('usage: node tools/build.js content/<file>.yaml');
    process.exit(1);
  }
  const doc = yaml.load(fs.readFileSync(src, 'utf8'));
  const root = path.resolve(path.dirname(src), '..');
  const srcName = path.relative(root, path.resolve(src));
  const written = [];
  const write = (rel, data) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, data);
    written.push(rel);
  };

  write(`${doc.output}.tex`, buildPlainTex(doc, srcName));
  write(`${doc.output}.docx`, await Packer.toBuffer(buildDocx(doc)));
  if (doc.moderncv) {
    for (const f of buildModerncv(doc, srcName)) write(f.path, f.content);
  }
  console.log(`${srcName} ->\n  ${written.join('\n  ')}`);
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
