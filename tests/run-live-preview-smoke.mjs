import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const previewBundlePath = resolve(process.argv[2]);
const warnings = [];
const failures = [];
let currentSourceRecordId = "module import";

const captureWarning = (...values) => {
  warnings.push({
    sourceRecordId: currentSourceRecordId,
    message: values.map(String).join(" "),
  });
};

console.error = captureWarning;
console.warn = captureWarning;

try {
  const previews = await import(`${pathToFileURL(previewBundlePath).href}?smoke=${Date.now()}`);

  for (const definition of previews.livePreviewDefinitions) {
    currentSourceRecordId = definition.sourceRecordId;

    try {
      const Component =
        definition.delivery === "eager"
          ? definition.component
          : await definition.loadComponent();
      renderToStaticMarkup(React.createElement(Component));
    } catch (error) {
      failures.push({
        sourceRecordId: currentSourceRecordId,
        message: error instanceof Error ? error.stack ?? error.message : String(error),
      });
    }
  }
} catch (error) {
  failures.push({
    sourceRecordId: currentSourceRecordId,
    message: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}

const report = { failures, warnings };
process.stdout.write(JSON.stringify(report), () => {
  process.exit(failures.length === 0 && warnings.length === 0 ? 0 : 1);
});
