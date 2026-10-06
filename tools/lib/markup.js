// Inline markup and LaTeX escaping shared by every output format.

// Splits "**bold**, *italic*, [text](url)" into styled segments.
function parseInline(str) {
  const segments = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) segments.push({ text: str.slice(last, m.index) });
    if (m[1] !== undefined) segments.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) segments.push({ text: m[2], italic: true });
    else segments.push({ text: m[3], url: m[4] });
    last = re.lastIndex;
  }
  if (last < str.length) segments.push({ text: str.slice(last) });
  return segments;
}

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

module.exports = { parseInline, texEscape, texUrl, tex, contactLines, LEFTRIGHT_MACRO, lineWithRight };
