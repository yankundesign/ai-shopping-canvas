// The canvas's styles. Trace was chosen on 2026-11-25; Paper and Plate were removed. A variant is one CSS file in this folder:
// design tokens (colour, type, radius, spacing, motion) plus its own styles for
// cards, the finalists area and pointing. It never changes layout or behaviour.
// To add one: write styles/<id>.css scoped to :root[data-style="<id>"], and list it here.

export const VARIANTS = [
  { id: "trace", name: "Trace", refs: "RAG Pipeline · AI Spreadsheet Fill · Dropdown Component", note: "Frosted cards on a dot grid, labels in mono, numbered sources, requests as skeleton bars. The agent points with a measuring label." },
];
