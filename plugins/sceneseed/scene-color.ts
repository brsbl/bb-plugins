import * as THREE from "three";

function colorize(
  color: THREE.Color,
  tint: string | null,
  preserveGraphite: boolean,
  foreground: THREE.Color,
  background: THREE.Color,
): void {
  const source = color.getHSL({ h: 0, s: 0, l: 0 });
  const foregroundLightness = foreground.getHSL({ h: 0, s: 0, l: 0 }).l;
  const backgroundLightness = background.getHSL({ h: 0, s: 0, l: 0 }).l;
  const lightGraphite = foregroundLightness > backgroundLightness;
  if (preserveGraphite && tint === null && !lightGraphite) return;

  const tintHsl =
    tint === null
      ? { h: 0, s: 0, l: 0 }
      : new THREE.Color(tint).getHSL({ h: 0, s: 0, l: 0 });
  const lightness = preserveGraphite
    ? lightGraphite
      ? THREE.MathUtils.lerp(
          backgroundLightness,
          foregroundLightness,
          0.58 + (1 - source.l) * 0.42,
        )
      : source.l
    : 0.07 + 0.72 * Math.pow(source.l, 0.78);
  color.setHSL(
    tintHsl.h,
    tint === null ? 0 : Math.max(0.46, Math.min(0.78, tintHsl.s)),
    lightness,
  );
}

/** Applies host tinting once per unique material while retaining sketch contrast. */
export function applySceneColor(
  root: THREE.Object3D,
  tint: string | null,
  foreground = "#111111",
  background = "#f5f5f5",
): void {
  const foregroundColor = new THREE.Color(foreground);
  const backgroundColor = new THREE.Color(background);
  const visited = new Set<THREE.Material>();
  root.traverse((object) => {
    if (
      !(
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.Line
      )
    )
      return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (visited.has(material)) continue;
      visited.add(material);
      const preserveGraphite = material.name.startsWith("Sketch ");
      const colored = material as THREE.Material & {
        color?: THREE.Color;
        emissive?: THREE.Color;
      };
      if (colored.color instanceof THREE.Color) {
        colorize(
          colored.color,
          tint,
          preserveGraphite,
          foregroundColor,
          backgroundColor,
        );
      }
      if (
        colored.emissive instanceof THREE.Color &&
        colored.emissive.getHex() !== 0
      ) {
        colorize(
          colored.emissive,
          tint,
          preserveGraphite,
          foregroundColor,
          backgroundColor,
        );
      }
    }
  });
}
