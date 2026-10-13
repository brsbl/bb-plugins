import * as THREE from "three";

import type { MaterialKit } from "./materials";

interface Entry {
  /** The baked body, or null for a prop made only of spinning parts. */
  body: THREE.Mesh | null;
  /** Spinning parts can't join the batch, so the prop also stays in the scene graph. */
  live: boolean;
  /** The body's transform relative to the prop's root. */
  inner: THREE.Matrix4;
  /** The batch instance, or -1 while it has none. */
  instance: number;
}

interface BatchOptions {
  instances: number;
  vertices: number;
  /** Cull instances one by one; worth it when many are off screen. */
  cull: boolean;
}

const instanceMatrix = new THREE.Matrix4();

/**
 * Draws the baked bodies of many props in one call. Each prop's root object
 * stays the source of truth for its transform relative to `parent`: after
 * moving one, call `update`. A prop with spinning parts also stays under
 * `parent` in the scene graph, body hidden, so the parts can still turn.
 */
export class PropBatch {
  private mesh: THREE.BatchedMesh | null = null;
  private readonly entries = new Map<THREE.Object3D, Entry>();
  /** The batch's id for each baked geometry it holds. */
  private readonly geometryIds = new Map<THREE.BufferGeometry, number>();
  private instanceCapacity: number;
  private vertexCapacity: number;

  constructor(
    private readonly kit: MaterialKit,
    private readonly parent: THREE.Object3D,
    private readonly options: BatchOptions,
  ) {
    this.instanceCapacity = options.instances;
    this.vertexCapacity = options.vertices;
    this.restore();
  }

  add(object: THREE.Object3D): void {
    let body = null as THREE.Mesh | null;
    let spinning = false;
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.ownedGeometry) body = child;
      else if (child.userData.spin) spinning = true;
    });
    const live = spinning || body === null;
    const entry: Entry = { body, live, inner: innerMatrix(object, body), instance: -1 };
    this.entries.set(object, entry);
    if (live) {
      this.parent.add(object);
      if (body) body.visible = false;
    }
    this.place(object, entry);
  }

  /** Copy a moved prop's transform into the batch. */
  update(object: THREE.Object3D): void {
    const entry = this.entries.get(object);
    if (entry && entry.instance >= 0) this.write(object, entry);
  }

  setVisible(object: THREE.Object3D, visible: boolean): void {
    object.visible = visible;
    const entry = this.entries.get(object);
    if (this.mesh && entry && entry.instance >= 0) this.mesh.setVisibleAt(entry.instance, visible);
  }

  remove(object: THREE.Object3D): void {
    const entry = this.entries.get(object);
    if (!entry) return;
    this.entries.delete(object);
    if (entry.live) this.parent.remove(object);
    if (this.mesh && entry.instance >= 0) {
      this.mesh.deleteInstance(entry.instance);
      this.mesh.visible = this.mesh.instanceCount > 0;
    }
  }

  /** Free the GPU copy while nobody can see these props; `restore` rebuilds it. */
  release(): void {
    if (!this.mesh) return;
    this.parent.remove(this.mesh);
    this.mesh.dispose();
    this.mesh = null;
    this.geometryIds.clear();
    for (const entry of this.entries.values()) entry.instance = -1;
  }

  restore(): void {
    if (this.mesh) return;
    const mesh = new THREE.BatchedMesh(this.instanceCapacity, this.vertexCapacity, undefined, this.kit.batched());
    // Props move after the batch measures its bounds, so never cull it whole.
    mesh.frustumCulled = false;
    mesh.perObjectFrustumCulled = this.options.cull;
    // Opaque and depth-tested, so draw order only matters for speed.
    mesh.sortObjects = false;
    mesh.visible = false;
    this.mesh = mesh;
    this.parent.add(mesh);
    for (const [object, entry] of this.entries) this.place(object, entry);
  }

  private place(object: THREE.Object3D, entry: Entry): void {
    const mesh = this.mesh;
    if (!mesh || !entry.body) return;
    const geometry = entry.body.geometry;
    let geometryId = this.geometryIds.get(geometry);
    if (geometryId === undefined) {
      const vertices = geometry.getAttribute("position").count;
      if (mesh.unusedVertexCount < vertices) {
        const used = this.vertexCapacity - mesh.unusedVertexCount;
        this.vertexCapacity = Math.max(this.vertexCapacity * 2, used + vertices);
        mesh.setGeometrySize(this.vertexCapacity, this.vertexCapacity * 2);
      }
      geometryId = mesh.addGeometry(geometry);
      this.geometryIds.set(geometry, geometryId);
    }
    if (mesh.instanceCount >= this.instanceCapacity) {
      this.instanceCapacity *= 2;
      mesh.setInstanceCount(this.instanceCapacity);
    }
    entry.instance = mesh.addInstance(geometryId);
    mesh.setVisibleAt(entry.instance, object.visible);
    this.write(object, entry);
    mesh.visible = true;
  }

  private write(object: THREE.Object3D, entry: Entry): void {
    object.updateMatrix();
    this.mesh?.setMatrixAt(entry.instance, instanceMatrix.multiplyMatrices(object.matrix, entry.inner));
  }
}

function innerMatrix(root: THREE.Object3D, body: THREE.Object3D | null): THREE.Matrix4 {
  const inner = new THREE.Matrix4();
  for (let node = body; node && node !== root; node = node.parent) {
    node.updateMatrix();
    inner.premultiply(node.matrix);
  }
  return inner;
}
