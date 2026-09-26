import * as THREE from "three";

/**
 * The Katamari key-art look: flat vector colors with two or three hard
 * shading bands, like cel-shaded illustration. Materials, geometries, and
 * baked prop models are shared across the world and freed together.
 */
export class MaterialKit {
  private readonly materials = new Map<string, THREE.Material>();
  private readonly geometries = new Map<string, THREE.BufferGeometry>();
  private readonly templates = new Map<string, THREE.Group>();
  /** Three hard light bands: shadow, body, highlight. */
  private readonly toonBands = (() => {
    const texture = new THREE.DataTexture(new Uint8Array([150, 212, 255]), 3, 1, THREE.RedFormat);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return texture;
  })();

  /** One baked model per prop kind and color variant, or per core look; callers clone it. */
  template(key: string, create: () => THREE.Group): THREE.Group {
    let template = this.templates.get(key);
    if (!template) {
      template = create();
      this.templates.set(key, template);
    }
    return template;
  }

  solid(color: THREE.ColorRepresentation): THREE.MeshToonMaterial {
    const key = `solid:${new THREE.Color(color).getHexString()}`;
    let material = this.materials.get(key) as THREE.MeshToonMaterial | undefined;
    if (!material) {
      material = new THREE.MeshToonMaterial({ color, gradientMap: this.toonBands });
      this.materials.set(key, material);
    }
    return material;
  }

  glow(color: THREE.ColorRepresentation): THREE.MeshBasicMaterial {
    const key = `glow:${new THREE.Color(color).getHexString()}`;
    let material = this.materials.get(key) as THREE.MeshBasicMaterial | undefined;
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color });
      this.materials.set(key, material);
    }
    return material;
  }

  /** One material for every baked prop; colors live in the geometry. */
  vertexColored(): THREE.MeshToonMaterial {
    let material = this.materials.get("vertex") as THREE.MeshToonMaterial | undefined;
    if (!material) {
      material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: this.toonBands });
      this.materials.set("vertex", material);
    }
    return material;
  }

  /**
   * The same look for batched props. three.js compiles batched and plain
   * meshes separately, so sharing one material would swap programs mid-frame.
   */
  batched(): THREE.MeshToonMaterial {
    let material = this.materials.get("batched") as THREE.MeshToonMaterial | undefined;
    if (!material) {
      material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: this.toonBands });
      this.materials.set("batched", material);
    }
    return material;
  }

  shadow(): THREE.MeshBasicMaterial {
    let material = this.materials.get("shadow") as THREE.MeshBasicMaterial | undefined;
    if (!material) {
      material = new THREE.MeshBasicMaterial({
        color: 0x1b1030,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      this.materials.set("shadow", material);
    }
    return material;
  }

  geometry<T extends THREE.BufferGeometry>(key: string, create: () => T): T {
    let geometry = this.geometries.get(key) as T | undefined;
    if (!geometry) {
      geometry = create();
      this.geometries.set(key, geometry);
    }
    return geometry;
  }

  box(): THREE.BoxGeometry {
    return this.geometry("box", () => new THREE.BoxGeometry(1, 1, 1));
  }

  sphere(detail = 1): THREE.IcosahedronGeometry {
    return this.geometry(`sphere:${detail}`, () => new THREE.IcosahedronGeometry(0.5, detail));
  }

  cylinder(segments = 10, topRatio = 1): THREE.CylinderGeometry {
    return this.geometry(
      `cylinder:${segments}:${topRatio}`,
      () => new THREE.CylinderGeometry(0.5 * topRatio, 0.5, 1, segments),
    );
  }

  cone(segments = 10): THREE.ConeGeometry {
    return this.geometry(`cone:${segments}`, () => new THREE.ConeGeometry(0.5, 1, segments));
  }

  torus(tube = 0.18, arc = Math.PI * 2): THREE.TorusGeometry {
    return this.geometry(
      `torus:${tube}:${arc.toFixed(3)}`,
      () => new THREE.TorusGeometry(0.5, tube, 6, 18, arc),
    );
  }

  shadowDisc(): THREE.CircleGeometry {
    return this.geometry("shadow-disc", () => {
      const disc = new THREE.CircleGeometry(1, 24);
      disc.rotateX(-Math.PI / 2);
      return disc;
    });
  }

  dispose(): void {
    for (const template of this.templates.values()) {
      template.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.ownedGeometry) child.geometry.dispose();
      });
    }
    this.templates.clear();
    this.toonBands.dispose();
    for (const material of this.materials.values()) material.dispose();
    for (const geometry of this.geometries.values()) geometry.dispose();
    this.materials.clear();
    this.geometries.clear();
  }
}

/** Bright, candy-colored palette in the spirit of the game's toy box. */
export const TOY_COLORS = [
  0xff4f6d, 0xff9f1c, 0xffd23f, 0x3bceac, 0x0ead69, 0x3a86ff, 0x8338ec,
  0xff6fb5, 0x00c2d1, 0xf15bb5, 0x9bf6ff, 0xfee440, 0xef476f, 0x06d6a0,
] as const;

export function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length) % values.length];
}
