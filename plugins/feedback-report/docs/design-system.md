# Feedback Report design system

The dashboard should make three things easy to scan: the overall numbers, what they mean, and the supporting detail. Use a small shared hierarchy across cards, headlines, recommendations, tables, and charts. The PostHog plugin is the reference for readable secondary text and emphasis on a number rather than its whole sentence.

## Typography

The tokens live in `scripts/dashboard-template.html`. These are the only four text sizes.

| Role | Token | Size | Use |
| --- | --- | --- | --- |
| Metadata | `--text-meta` | 12px | Dates, table headers, chart labels, legends, captions |
| Body | `--text-body` | 14px | Evidence, card labels, supporting statistics, table cells, controls |
| Heading | `--text-heading` | 16px | Page and section headings, headline titles, weekly table values |
| Key metric | `--text-metric` | 30px | The single leading number in each summary card |

Use three weights: `--weight-body` (400) for prose, `--weight-label` (500) for labels and card titles, and `--weight-emphasis` (600) for section headings and important values. Do not bold an entire evidence sentence. Keep numbers in tabular figures when comparing them. Use `--leading-body` (1.5) for readable text and `--leading-tight` (1.2) for standalone headings and metrics.

The BB panel shell uses the equivalent native `text-xs`, `text-sm`, and `text-base` classes and normal, medium, and semibold weights. Its colors remain owned by BB. The standalone dashboard carries its own light and dark anchors.

## Spacing and surfaces

| Role | Token | Size | Use |
| --- | --- | --- | --- |
| Inline | `--space-inline` | 4px | Icon-to-label gaps and small label offsets |
| Related | `--space-related` | 8px | Evidence lines, table padding, related controls |
| Group | `--space-group` | 16px | Card padding, card gaps, grouped content |
| Section | `--space-section` | 24px | Section separation and page insets |

Use one 8px card radius, one 4px control radius, and one subtle border treatment. Keep metric annotations unboxed; borders identify containers and controls. Shadows belong only to floating overlays. Chart geometry, breakpoints, and icons have their own dimensions; they do not add text or spacing steps.

There are three surface levels: page (`--plane`), card (`--surface-1`), and selected or muted content (`--mid`). There are three text contrast levels: primary (`--ink-1`), supporting (`--ink-2`), and metadata (`--ink-3`). Neutral colors derive from the `--canvas` and `--ink` anchors so the family changes together in light and dark mode.

## Color and charts

Color carries meaning: blue for the primary series, green for resolved or positive state, amber for warnings or a comparison series, and red for complaints or critical state. Keep the role consistent within each chart, label it in the legend, and retain numeric values or state labels so color is not the only signal.

Heatmaps use four blue levels: 0–24%, 25–49%, 50–74%, and 75–100%. The displayed value remains exact. Missing data uses the neutral surface and a dash, never the zero-value color. Text on the darkest level uses the contrasting series foreground. Every SVG label uses the metadata size; never shrink labels to fit more data. Keep dense charts and tables scrollable inside their own container.

## Component rules

- **Summary cards:** one label, one large value, then readable detail. Weekly values stay in a table with concise dates and their trend line underneath at the same width. Open issue bullets use the available height. Resolution details use short labeled rows.
- **Headlines:** one card per takeaway, with a short title and a vertical list of evidence. Keep a leading number inline with its explanation at body size. Do not introduce another grid of large metrics or a separate title column. A supporting chart stays below that card's evidence.
- **Recommendations:** a small priority marker, a title, supporting bullets, and plain metric annotations. Avoid pills around every number.
- **Tables:** sentence-case headers, regular body text, right-aligned numeric columns, subtle row dividers, and visible sorting state.
- **Controls:** normal body text; medium weight only for a selected tab or a label. Use one control radius and the shared spacing steps.

Use the existing tokens for new content. Add a new value only when it represents a distinct semantic role that the existing four-step system cannot express; update this document with that decision.
