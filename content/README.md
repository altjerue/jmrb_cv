# Resume and CV from YAML

Each YAML file here is the single source of wording for one document. One
build writes every version of it, all with identical text:

| Content file  | Generates |
|---------------|-----------|
| `resume.yaml` | `RuedaBecerrilJM-resume-plain.tex/.pdf/.docx`, and the moderncv `RuedaBecerrilJM-resume.tex/.pdf` with its `Sections/*.tex` files |
| `cv.yaml`     | `RuedaBecerrilJM-CV-plain.tex/.pdf/.docx`, and the moderncv `RuedaBecerrilJM-CV.tex/.pdf` with its `Sections/*.tex` files (except the hand-edited `Sections/publications.tex`) |

- `<output>.tex` (then `.pdf`): plain single-column LaTeX, `article` class,
  no tables
- `<output>.docx`: Word version for application portals that ask for one
- moderncv version (when the YAML has a `moderncv:` block): the main `.tex`
  plus one `Sections/<file>.tex` per section, in the look set by the
  `moderncvstyle*.sty` file

Everything is written relative to the repo root. **Edit the YAML, never the
generated `.tex` files**: they are all overwritten on every build, and each
one starts with a comment saying which YAML it came from. The layout itself
(fonts, spacing, header) lives in the generators under `tools/lib/` and in
the `moderncvstyle*.sty` files, not in the YAML.

## Requirements

- Node.js 18 or newer
- A TeX distribution with `pdflatex` (TeX Live)
- One-time setup of the two npm packages (`docx`, `js-yaml`):

  ```bash
  cd tools
  npm install
  ```

## Build

From `tools/`:

```bash
npm run build:resume   # resume only
npm run build:cv       # CV only
npm run build          # both
```

Each one generates all the `.tex` files and the `.docx`, then compiles every
main `.tex` with `pdflatex` (two passes, so citations settle). The aux, out
and log files go to the hidden folder `.tex_tmp/`; only the PDFs are copied
to the repo root, and the build prints each PDF's page count plus any LaTeX
errors or overfull boxes. To run it by hand from the repo root:

```bash
node tools/build.js content/resume.yaml            # add --no-pdf to skip pdflatex
```

Commit the YAML together with every regenerated file (`.tex`, `Sections/*.tex`,
`.pdf`, `.docx`).

## Editing the YAML

### Top-level keys

| Key           | Meaning                                                        |
|---------------|----------------------------------------------------------------|
| `output`      | Base name of the generated files (no extension)                |
| `name`        | Your name, shown in the header                                 |
| `credentials` | Shown after the name: `Jesús M. Rueda-Becerril, Ph.D.`          |
| `contact`     | Items joined with `\|` under the name (see below)              |
| `sections`    | List of sections, rendered in order                            |
| `moderncv`    | Optional: also generate the moderncv version (see below)       |

`contact` is either one list (one line) or a list of lists (one line each):

```yaml
contact:                      # one line
  - Seattle, WA
  - "[jm.ruebe@gmail.com](mailto:jm.ruebe@gmail.com)"

contact:                      # two lines
  - - Seattle, WA
    - "[jm.ruebe@gmail.com](mailto:jm.ruebe@gmail.com)"
  - - "[github.com/altjerue](https://github.com/altjerue)"
```

### The moderncv version

```yaml
moderncv:
  output: RuedaBecerrilJM-resume   # main moderncv .tex (no extension)
  style: resume                    # moderncvstyle<style>.sty to use
  sections_dir: Sections           # where the section files go
```

With this block, every section also needs a `file:` naming its moderncv
section file, e.g. `file: experience_resume` writes
`Sections/experience_resume.tex`. The main file `\input`s them in the order
the sections appear in the YAML. The moderncv header fits at most two
contact lines.

A section can instead say `manual: <file>`: the moderncv version then
`\input`s that hand-edited `Sections/<file>.tex` unchanged and never
overwrites it, while the plain and Word versions still render the section
from the YAML. The CV does this for `publications`, whose bibliography uses
its own macros. Keep the two in sync by hand: same papers, same order, and
the same `key:` as the `\bibitem`/`\mybibitem` key (see Citations below).

`preamble:` (a list of raw LaTeX lines, not escaped) is added to the moderncv
main file; the CV uses it for the macros `publications.tex` needs:

```yaml
moderncv:
  preamble:
    - \input{bib_setup3}
    - \input{newmacros}
```

Supported styles, each mapping the generic entry fields onto that style's
`\cventry` arguments in `tools/lib/moderncv.js`:

| `style`    | Style file                  | Used by |
|------------|-----------------------------|---------|
| `resume`   | `moderncvstyleresume.sty`   | resume  |
| `banking2` | `moderncvstylebanking2.sty` | CV      |

### Sections

Every section has a `title` and one or more kinds of content:

```yaml
- title: Professional Summary
  paragraph: >-
    One block of text.

- title: Skills
  skills:
    - label: Languages
      text: Python, C/C++, Fortran

- title: Experience          # also used for Projects and Education
  entries:
    - heading: Spatial Data Scientist
      right: May 2025 – Jan 2026
      sub: TealWaters
      sub_right: Seattle, WA
      intro: One-line description of the role.
      bullets:
        - First accomplishment.
        - Second accomplishment.

- title: Selected Publications
  list:
    - One bulleted item per entry.

- title: Publications
  subsections:                # each subsection takes the same content keys
    - title: Articles
      unbulleted: true        # hanging indent, no bullet
      list:
        - key: Davis:2024ru   # optional; makes the item citable
          text: >-
            [2] Item that carries its own label.
```

Use `unbulleted: true` for lists whose items carry their own labels, like the
CV's numbered publications (`[12]` … `[1]`). A list item is either plain text
or a `key:` + `text:` pair; the key lets other text cite it.

### Citations

Write `[@Davis:2024ru]`, or `[@Murguia:2021no, @Lopez:2022et]` for several,
anywhere in a text field:

- moderncv version: `\cite{Davis:2024ru}`, numbered by the bibliography
- plain and Word versions: the label at the start of that item's text, e.g.
  `[9]`, or `[6, 7]`

So when you add a paper, renumber the labels in the YAML list (and the
hand-edited bibliography); every citation follows automatically. A key that
no list item defines stops the build with an error.

### Entries

Each entry is laid out like this; only `heading` is required, and any field
you leave out is simply not printed:

```
heading (bold)                                        right
sub (italic)                                      sub_right
intro (plain text)
details (plain lines, one per item, no bullets)
  • bullets
  • ...
```

If a `heading` or `sub` is too long to share its line with `right` or
`sub_right`, the right-hand text moves to the next line, still flush right.

- Experience: `heading` = job title, `right` = dates, `sub` = employer,
  `sub_right` = location.
- Projects: `sub` = short description, `sub_right` = repository link.
- Education: in the resume, `heading` = institution, `right` = location,
  `sub` = degree, `sub_right` = year (leave it out to omit the year). In the
  CV, `heading` = degree and `details` holds the advisor and thesis lines.

To reorder sections or entries, move them in the file; to remove one, delete
it or comment it out with `#`.

### Inline formatting

Any text field accepts:

| Write                         | Get                    |
|-------------------------------|------------------------|
| `**Rueda-Becerril, J. M.**`   | bold                   |
| `*Tleco: A Toolkit*`          | italic                 |
| `[arXiv:2405.17581](https://arxiv.org/abs/2405.17581)` | link |
| `[@Davis:2024ru]`             | citation (see Citations) |

Write plain Unicode characters (`–`, `×`, `²`, `é`). LaTeX special characters
(`& % $ # _ ~ ^ \ { }`) are escaped automatically, so write `$68K` and
`R&D`, not `\$68K`.

### YAML pitfalls

- Use `>-` for long text that wraps over several lines; the line breaks are
  joined into spaces.
- Quote a value that **starts** with `[`, `*`, `&`, `!`, `%`, `@`, or a
  backtick, or that contains `: ` (colon followed by a space), e.g.
  `sub_right: "[github.com/x](https://github.com/x)"`.
- Quote values that YAML would read as numbers or booleans if you want them
  shown as text, e.g. `sub_right: "2017"`.
- `#` starts a comment unless it is inside quotes: write
  `sub_right: "Grant #121077"`.
- A list item that starts with `[12]` must be quoted or written as a `>-`
  block.
- Indent with spaces, never tabs.

## Checking the result

- Page count: `pdfinfo RuedaBecerrilJM-resume-plain.pdf | grep Pages` (the
  resume should stay at 2 pages)
- What an ATS sees (should read top to bottom with no stray characters):
  `pdftotext RuedaBecerrilJM-resume-plain.pdf - | less`
- The Word file: open it in Word, or render it with
  `soffice --headless --convert-to pdf RuedaBecerrilJM-resume-plain.docx`.
  The Word version uses a different font (Calibri), so its line breaks and
  page breaks differ slightly from the PDF.

## Making another document from the same generator

Copy `resume.yaml` (or `cv.yaml`) to a new file, change `output`, and run:

```bash
node tools/build.js content/<new-file>.yaml
pdflatex <output>.tex
```

## Troubleshooting

- **`LaTeX Error: Mismatched LaTeX support files detected`** after a TeX Live
  update: a stale personal format file is overriding the system one. Check
  with `kpsewhich -engine=pdftex pdflatex.fmt`; if it points into
  `~/Library/texlive/...`, delete that file so the system format is used.
- **`Cannot find module 'docx'` or `'js-yaml'`**: run `npm install` in
  `tools/`.
- **YAML error with a line number**: usually an unquoted value that starts
  with `[` or `*`, or contains `: ` (see the pitfalls above).
