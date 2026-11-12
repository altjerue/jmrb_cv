# Resume and CV from YAML

The wording of every section lives once, in `content/sections/`. Two main
files pick the sections each document needs, and one build writes every
version of it, all with identical text:

| Main file     | Includes                                   | Generates |
|---------------|--------------------------------------------|-----------|
| `resume.yaml` | the concise sections, 3 selected papers    | `resume-RuedaBecerrilJM.tex/.pdf/.docx` |
| `cv.yaml`     | the same sections plus the long-form ones, full publication list | `cv-RuedaBecerrilJM.tex/.pdf/.docx` |

- `<output>.tex` (then `.pdf`): plain single-column LaTeX, `article` class,
  no tables
- `<output>.docx`: Word version for application portals that ask for one

Everything is written relative to the repo root. **Edit the YAML, never the
generated `.tex` files**: they are all overwritten on every build, and each
one starts with a comment saying which YAML it came from. The layout itself
(fonts, spacing, header) lives in the generators under `tools/lib/`, not in
the YAML.

## Layout

```
content/
  resume.yaml     header + list of sections for the resume
  cv.yaml         header + list of sections for the CV
  sections/       one file per section, shared by both documents
```

A section that only one document needs (grants, awards, talks…) is simply
listed in that document's main file only. If one document needs a variation of
a section (say, a page break in the resume but not in the CV), make that change
on its own branch rather than keeping two copies of the section on `master`.

## Requirements

- Node.js 18 or newer
- A TeX distribution with `pdflatex` (TeX Live)
- One-time setup of the two npm packages (`docx`, `js-yaml`):

  ```bash
  cd tools
  npm install
  ```

## Build

From the repo root (or from `tools/`):

```bash
npm run build:resume   # resume only
npm run build:cv       # CV only
npm run build          # both
```

Each one generates the `.tex` and the `.docx`, then compiles the `.tex` with
`pdflatex` (two passes, so citations settle). The aux, out and log files go to
the hidden folder `.tex_tmp/`; only the PDF is copied to the repo root, and the
build prints its page count plus any LaTeX errors or overfull boxes. To run it
by hand from the repo root:

```bash
node tools/build.js content/resume.yaml            # add --no-pdf to skip pdflatex
```

Commit the YAML together with every regenerated file (`.tex`, `.pdf`, `.docx`).

## Editing the YAML

### Main files and `!include`

A main file is the header (name, contact) plus a `sections:` list in which
each item pulls in one section file:

```yaml
sections:
  - !include sections/profile.yaml
  - !include sections/experience.yaml
```

A section file holds what would otherwise sit under that list item (a mapping
starting with `title:`). The path is relative to the file containing the tag,
`!include` works anywhere a value can go, includes can nest, and a circular
include is an error. Sections render in the order they are listed.

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
        - key: Davis:2024ru   # optional; makes the item citable
          text: >-
            [2] Item that carries its own label.
```

(In a section file these keys sit at the top level, without the leading `- `.)

Use `unbulleted: true` for lists whose items carry their own labels, like the
CV's numbered publications (`[12]` … `[1]`). A list item is either plain text
or a `key:` + `text:` pair; the key lets other text cite it.

### Citations

Write `[@Davis:2024ru]`, or `[@Murguia:2021no, @Lopez:2022et]` for several,
anywhere in a text field. It prints as the label at the start of that item's
text, e.g. `[9]`, or `[6, 7]`.

So when you add a paper, renumber the labels in the YAML list; every citation
follows automatically. A key that no list item defines stops the build with an
error.

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

With `sub_inline: true` on a section, its entries put `sub` on the heading
line instead, after a comma, and keep a second line only for `sub_right`:

```
heading (bold), sub (italic)                          right
                                                  sub_right
```

```yaml
- title: Experience
  sub_inline: true
```

Leave `sub_right` out (or comment it out) for the most compact layout; with a
`sub_right`, the second line holds only that text.

- Experience: `heading` = job title, `right` = dates, `sub` = employer,
  `sub_right` = location.
- Projects: `sub` = short description, `sub_right` = repository link.
- Education: `heading` = institution, `sub` = degree, `right` = graduation
  month and year.

`page_break: true` on an entry starts a new page right before it, in every
version (LaTeX `\newpage`, Word "page break before"). Use it to choose where
a page ends instead of letting an entry split across pages, and check the
page count afterwards: forcing an earlier break can push the end of the
document onto an extra page.

```yaml
- heading: Postdoctoral Research Fellow
  page_break: true   # start page 2 here
```

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

- Page count: `pdfinfo resume-RuedaBecerrilJM.pdf | grep Pages` (the
  resume should stay at 2 pages)
- What an ATS sees (should read top to bottom with no stray characters):
  `pdftotext resume-RuedaBecerrilJM.pdf - | less`
- The Word file: open it in Word, or render it with
  `soffice --headless --convert-to pdf resume-RuedaBecerrilJM.docx`.
  The Word version uses a different font (Calibri), so its line breaks and
  page breaks differ slightly from the PDF.

## Making another document from the same generator

Copy `resume.yaml` (or `cv.yaml`) to a new file, change `output`, edit the
`sections:` list, and run:

```bash
node tools/build.js content/<new-file>.yaml
```

## Troubleshooting

- **`LaTeX Error: Mismatched LaTeX support files detected`** after a TeX Live
  update: a stale personal format file is overriding the system one. Check
  with `kpsewhich -engine=pdftex pdflatex.fmt`; if it points into
  `~/Library/texlive/...`, delete that file so the system format is used.
- **`npm error enoent Could not read package.json`**: you are outside the
  repo; `cd` into it (the root `package.json` forwards to `tools/`).
- **`Cannot find module 'docx'` or `'js-yaml'`**: run `npm install` in
  `tools/`.
- **YAML error with a line number**: usually an unquoted value that starts
  with `[` or `*`, or contains `: ` (see the pitfalls above).
