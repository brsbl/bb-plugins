import { copyFileSync, constants } from "node:fs";
import { execFileSync } from "node:child_process";

export function durationBucket(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("Invalid clip duration.");
  return seconds < 15 ? "under_15s" : seconds <= 30 ? "15_30s" : seconds <= 60 ? "30_60s" : "over_60s";
}

export function reportClipExport({ anatomy, format, size, seconds }, run = execFileSync) {
  const bucket = durationBucket(seconds);
  try {
    run(process.env.BB_CLI || "bb", [
      "playgrounds", "clip-exported", "--kind", anatomy ? "anatomy" : "html",
      "--format", format, "--size", size, "--duration-bucket", bucket,
    ], { stdio: "ignore", timeout: 3000 });
  } catch {
    // Export remains usable offline and on hosts without the telemetry route.
  }
}

export function saveClipOutputs({ out, output, gif, gifOutput, anatomy, size, seconds }, report = reportClipExport) {
  for (const [from, to] of [[out + ".json", output + ".json"], [out + ".end.png", output + ".end.png"], [out, output], ...(gifOutput ? [[gif, gifOutput]] : [])]) {
    copyFileSync(from, to, constants.COPYFILE_EXCL);
    if (to === output || to === gifOutput) report({
      anatomy, format: to === output ? "mp4" : "gif", size, seconds,
    });
  }
}
