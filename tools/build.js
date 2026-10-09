// Generates every version of a document from one YAML content file:
//
//   - <output>.tex           plain single-column LaTeX (lib/plain-tex.js)
//   - <output>.docx          Word (lib/docx.js)
//   - <moderncv.output>.tex  moderncv main file, plus Sections/<file>.tex for
//                            each section (lib/moderncv.js), if the YAML has a
//                            `moderncv:` block
//
//   node tools/build.js content/resume.yaml [--no-pdf]
//
// All paths are relative to the repo root (the parent of content/). Every
// generated file is overwritten. Then each main .tex is compiled with
// pdflatex; the aux, out and log files go to the hidden folder .tex_tmp/ and
// only the PDF is copied back to the repo root. --no-pdf skips compiling.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');
const { Packer } = require('docx');
const { buildPlainTex } = require('./lib/plain-tex');
const { buildDocx } = require('./lib/docx');
const { buildModerncv } = require('./lib/moderncv');
const { resolveCitations } = require('./lib/markup');

// Compiles <root>/<base>.tex (twice, so references settle) with the aux files
// in .tex_tmp/, and copies the PDF back next to the .tex.
function compilePdf(root, base) {
  const tmp = path.join(root, '.tex_tmp');
  fs.mkdirSync(tmp, { recursive: true });
  for (let pass = 0; pass < 2; pass++) {
    const r = spawnSync('pdflatex', [
      '-interaction=nonstopmode', `-output-directory=${tmp}`, `${base}.tex`,
    ], { cwd: root, stdio: 'ignore' });
    if (r.error) throw new Error(`could not run pdflatex: ${r.error.message}`);
  }
  const pdf = path.join(tmp, `${base}.pdf`);
  if (!fs.existsSync(pdf)) throw new Error(`pdflatex failed on ${base}.tex; see .tex_tmp/${base}.log`);
  fs.copyFileSync(pdf, path.join(root, `${base}.pdf`));
  const log = fs.readFileSync(path.join(tmp, `${base}.log`), 'latin1');
  const errors = (log.match(/^! /gm) || []).length;
  const overfull = (log.match(/^Overfull/gm) || []).length;
  // the log wraps long lines at 79 columns, so match across line breaks
  const pages = (log.match(/Output written on[\s\S]*?\((\d+)\s+pages?/) || [])[1];
  const issues = errors || overfull ? `  <-- ${errors} errors, ${overfull} overfull boxes; see .tex_tmp/${base}.log` : '';
  console.log(`  ${base}.pdf (${pages} pages)${issues}`);
}

async function main() {
  const args = process.argv.slice(2);
  const skipPdf = args.includes('--no-pdf');
  const src = args.find((a) => !a.startsWith('--'));
  if (!src) {
    console.error('usage: node tools/build.js content/<file>.yaml [--no-pdf]');
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

  // the plain and Word versions print citations as [n]; moderncv uses \cite
  const resolved = resolveCitations(doc);
  write(`${doc.output}.tex`, buildPlainTex(resolved, srcName));
  write(`${doc.output}.docx`, await Packer.toBuffer(buildDocx(resolved)));
  const mains = [doc.output];
  if (doc.moderncv) {
    for (const f of buildModerncv(doc, srcName)) write(f.path, f.content);
    mains.push(doc.moderncv.output);
  }
  console.log(`${srcName} ->\n  ${written.join('\n  ')}`);
  if (!skipPdf) for (const base of mains) compilePdf(root, base);
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
