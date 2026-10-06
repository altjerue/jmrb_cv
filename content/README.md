# Plain resume and CV from YAML

Each YAML file here is the single source for one plain, ATS-friendly document:

| Content file  | Generates                                   |
|---------------|---------------------------------------------|
| `resume.yaml` | `RuedaBecerrilJM-resume-plain.tex/.pdf/.docx` (2-page resume) |
| `cv.yaml`     | `RuedaBecerrilJM-CV-plain.tex/.pdf/.docx` (full CV) |

One command turns a YAML file into two files with identical text:

- `<output>.tex` (then `.pdf`): single-column LaTeX, `article` class, no
  tables
- `<output>.docx`: Word version for application portals that ask for one

Both are written to the repo root. **Edit the YAML, not the generated `.tex`**:
the `.tex` is overwritten on every build.

The moderncv documents (`RuedaBecerrilJM-resume.tex`, `RuedaBecerrilJM-CV.tex`)
are separate and are not affected by any of this.

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

Each one generates the `.tex` and `.docx`, then runs `pdflatex` to produce the
PDF. To do the steps by hand from the repo root:

```bash
node tools/build.js content/resume.yaml
pdflatex RuedaBecerrilJM-resume-plain.tex
```

Commit the YAML together with the regenerated `.tex`, `.pdf`, and `.docx`.

## Editing the YAML

### Top-level keys

| Key           | Meaning                                                        |
|---------------|----------------------------------------------------------------|
| `output`      | Base name of the generated files (no extension)                |
| `name`        | Your name, shown in the header                                 |
| `credentials` | Shown after the name: `Jesús M. Rueda-Becerril, Ph.D.`          |
| `contact`     | Items joined with `\|` under the name (see below)              |
| `sections`    | List of sections, rendered in order                            |

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
        - >-
          [2] Item that carries its own label.
```

Use `unbulleted: true` for lists whose items carry their own labels, like the
CV's numbered publications (`[12]` … `[1]`). The numbers are plain text, so
when you add a paper, renumber the list and any references to it (the CV's
Experience and Teaching entries cite papers as `[5]`, `[8, 9]`).

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
