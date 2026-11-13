export type Rgba = [number, number, number, number];

/** Resolves any CSS color to 0..1 RGBA by painting it into a 1×1 canvas. Results are cached. */
export function colorParser(): (value: string) => Rgba {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  const cache = new Map<string, Rgba>();
  return (value) => {
    const cached = cache.get(value);
    if (cached) return cached;
    let parsed: Rgba = [0, 0, 0, 0];
    if (context && value && value !== "transparent") {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = "rgba(0, 0, 0, 0)";
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      parsed = [r! / 255, g! / 255, b! / 255, a! / 255];
    }
    cache.set(value, parsed);
    return parsed;
  };
}

export function encodePng(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("could not encode the capture"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("could not read the capture"));
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}
