// Inline markup and LaTeX escaping shared by every output format.

// Splits "**bold**, *italic*, [text](url), [@key, @key]" into styled segments.
// Citations only reach here in the moderncv output; the plain and Word outputs
// get them already replaced by their [n] labels (see resolveCitations).
function parseInline(str) {
  const segments = [];
  const re = /\[@([^\]]+)\]|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) segments.push({ text: str.slice(last, m.index) });
    if (m[1] !== undefined) segments.push({ text: '', cite: citeKeys(m[1]) });
    else if (m[2] !== undefined) segments.push({ text: m[2], bold: true });
    else if (m[3] !== undefined) segments.push({ text: m[3], italic: true });
    else segments.push({ text: m[4], url: m[5] });
    last = re.lastIndex;
  }
  if (last < str.length) segments.push({ text: str.slice(last) });
  return segments;
}

// "@a, @b" -> ['a', 'b']
const citeKeys = (inner) => inner.split(',').map((k) => k.trim().replace(/^@/, ''));

const TEX_ESCAPES = {
  '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
  '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};
const texEscape = (s) => s.replace(/[\\&%$#_{}~^]/g, (c) => TEX_ESCAPES[c]);
const texUrl = (u) => u.replace(/[%#]/g, (c) => '\\' + c);

// Converts a YAML text field (with inline markup) to LaTeX.
function tex(str) {
  if (!str) return '';
  return parseInline(String(str)).map((s) => {
    const t = texEscape(s.text);
    if (s.cite) return `\\cite{${s.cite.join(',')}}`;
    if (s.url) return `\\href{${texUrl(s.url)}}{${t}}`;
    if (s.bold) return `\\textbf{${t}}`;
    if (s.italic) return `\\textit{${t}}`;
    return t;
  }).join('');
}

// `contact` is either one list (one line) or a list of lists (several lines)
const contactLines = (contact) => (Array.isArray(contact[0]) ? contact : [contact]);

// The \leftright macro, defined in every generated LaTeX preamble: left text,
// then the right text flush right on the same line if there is at least 1em to
// spare, otherwise flush right on the next line, never broken (TeXbook \signed).
const LEFTRIGHT_MACRO = `\\newcommand{\\leftright}[2]{{#1\\unskip\\nobreak\\hfil\\penalty50\\hskip1em\\hbox{}%
  \\nobreak\\hfil\\mbox{#2}\\parfillskip=0pt\\par}}`;

// `par` lets moderncv pass \endgraf, since \cventry's arguments reject \par.
const lineWithRight = (left, right, par = '\\par') =>
  (right ? `\\leftright{${left}}{${tex(right)}}` : `${left}${par}`);

// Returns a copy of the document for the plain and Word outputs: list items
// written as { key, text } become plain strings, and every [@key] citation is
// replaced by the label that starts the cited item's text ("[9] Davis, ..."),
// so [@Davis:2021ru, @Davis:2024ru] reads "[8, 9]". Unknown keys are errors.
function resolveCitations(doc) {
  const labels = {};
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (!node || typeof node !== 'object') return;
    if (typeof node.key === 'string' && typeof node.text === 'string') {
      const m = node.text.match(/^\[([^\]]+)\]/);
      if (!m) throw new Error(`cited item ${node.key} has no [label] at the start of its text`);
      labels[node.key] = m[1];
    }
    Object.values(node).forEach(collect);
  };
  collect(doc);
  const replace = (str) => str.replace(/\[@([^\]]+)\]/g, (_, inner) => `[${citeKeys(inner).map((k) => {
    if (!(k in labels)) throw new Error(`unknown citation key "${k}"`);
    return labels[k];
  }).join(', ')}]`);
  const walk = (node) => {
    if (typeof node === 'string') return replace(node);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      if (typeof node.key === 'string' && typeof node.text === 'string') return replace(node.text);
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v)]));
    }
    return node;
  };
  return walk(doc);
}

module.exports = { resolveCitations, parseInline, texEscape, texUrl, tex, contactLines, LEFTRIGHT_MACRO, lineWithRight };
