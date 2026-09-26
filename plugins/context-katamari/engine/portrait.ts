import * as THREE from "three";

import type { MaterialKit } from "./materials";
import { buildProp, type PropDefinition } from "./props";

/**
 * Small pictures of props for the HUD's "last rolled up" circle, rendered
 * once per kind into an offscreen target and cached.
 */
export class PropPortraits {
  private readonly images = new Map<string, string | null>();

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly kit: MaterialKit,
  ) {}

  get(definition: PropDefinition): string | null {
    const cached = this.images.get(definition.kind);
    if (cached !== undefined) return cached;
    let image: string | null = null;
    try {
      const size = 96;
      const target = new THREE.WebGLRenderTarget(size, size);
      target.texture.colorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f9c, 1.6));
      const light = new THREE.DirectionalLight(0xffffff, 1.4);
      light.position.set(2, 3, 2);
      scene.add(light);
      const model = buildProp(definition, { kit: this.kit, random: () => 0 });
      model.rotation.y = -0.7;
      scene.add(model);
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
      camera.position.set(2.6, 2.4, 3.2);
      camera.lookAt(0, 0.8, 0);
      this.renderer.setRenderTarget(target);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.clear();
      this.renderer.render(scene, camera);
      const pixels = new Uint8Array(size * size * 4);
      this.renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
      this.renderer.setRenderTarget(null);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (context) {
        const data = context.createImageData(size, size);
        // WebGL rows run bottom-up; flip them for the 2D canvas.
        for (let row = 0; row < size; row += 1) {
          data.data.set(pixels.subarray((size - 1 - row) * size * 4, (size - row) * size * 4), row * size * 4);
        }
        context.putImageData(data, 0, 0);
        image = canvas.toDataURL("image/png");
      }
      target.dispose();
    } catch {
      image = null;
    }
    this.images.set(definition.kind, image);
    return image;
  }
}
