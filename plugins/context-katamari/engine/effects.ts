import * as THREE from "three";

import { type MaterialKit, TOY_COLORS } from "./materials";
import { randomDirection, smoothing } from "./world-math";

const PUFF_POOL = 14;
const CONFETTI_POOL = 48;
const GLINT_POOL = 28;
const COIN_POOL = 72;
const COIN_LIFE_SECONDS = 9;

interface Puff {
  mesh: THREE.Mesh;
  life: number;
  grow: number;
}

interface Coin {
  mesh: THREE.Mesh;
  life: number;
  vy: number;
  spin: number;
  size: number;
}

interface Confetti {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
}

export interface EffectMaterials {
  glint: THREE.MeshBasicMaterial;
  shockwave: THREE.MeshBasicMaterial;
}

/**
 * The glint and shockwave materials. The world makes them before its renderer
 * and scenery so material ids, and with them the opaque draw order, stay put.
 */
export function createEffectMaterials(): EffectMaterials {
  return {
    glint: new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }),
    shockwave: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };
}

/**
 * Pooled one-shot effects: dust puffs, the pop's confetti and shockwave, the
 * glints behind a rolling katamari, and the coin trail. A pooled mesh sits in
 * the scene only while it is alive, so idle ones cost nothing per frame.
 */
export class Effects {
  private readonly puffs: Puff[] = [];
  private readonly confetti: Confetti[] = [];
  /** The game's white glints that trail a rolling katamari. */
  private readonly glints: Confetti[] = [];
  private readonly coins: Coin[] = [];
  private readonly shockwave: THREE.Mesh;
  private shockwaveLife = 0;
  private shockwaveRadius = 1;
  private readonly direction = new THREE.Vector3();

  constructor(
    private readonly scene: THREE.Scene,
    kit: MaterialKit,
    private readonly materials: EffectMaterials,
  ) {
    for (let index = 0; index < PUFF_POOL; index += 1) {
      const mesh = new THREE.Mesh(
        kit.sphere(2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
      );
      this.puffs.push({ mesh, life: 0, grow: 0 });
    }
    for (let index = 0; index < CONFETTI_POOL; index += 1) {
      const mesh = new THREE.Mesh(kit.box(), kit.solid(TOY_COLORS[index % TOY_COLORS.length]));
      this.confetti.push({ mesh, velocity: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 });
    }
    for (let index = 0; index < GLINT_POOL; index += 1) {
      const mesh = new THREE.Mesh(
        kit.geometry("octahedron", () => new THREE.OctahedronGeometry(0.5, 0)),
        materials.glint,
      );
      this.glints.push({ mesh, velocity: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 });
    }
    const coinMaterial = kit.solid(0xffc629);
    const coinGeometry = kit.cylinder(18);
    for (let index = 0; index < COIN_POOL; index += 1) {
      const mesh = new THREE.Mesh(coinGeometry, coinMaterial);
      this.coins.push({ mesh, life: 0, vy: 0, spin: 0, size: 0 });
    }
    const ring = new THREE.RingGeometry(0.8, 1, 48);
    ring.rotateX(-Math.PI / 2);
    this.shockwave = new THREE.Mesh(ring, materials.shockwave);
  }

  /** True while any coin is still flipping or fading on the ground. */
  coinsFlying(): boolean {
    for (const coin of this.coins) if (coin.life > 0) return true;
    return false;
  }

  puff(x: number, z: number, radius: number): void {
    const puff = this.puffs.find((candidate) => candidate.life <= 0);
    if (!puff) return;
    puff.life = 0.6;
    puff.grow = radius * 0.28;
    this.wake(puff.mesh);
    puff.mesh.position.set(
      x + (Math.random() - 0.5) * radius * 0.6,
      radius * 0.1,
      z + (Math.random() - 0.5) * radius * 0.6,
    );
  }

  /** A white glint flicking off a ball of `radius` rolling at (x, z). */
  glint(x: number, z: number, radius: number, random: () => number): void {
    const glint = this.glints.find((candidate) => candidate.life <= 0);
    if (!glint) return;
    const angle = random() * Math.PI * 2;
    glint.life = 0.7;
    this.wake(glint.mesh);
    glint.mesh.position.set(
      x + Math.cos(angle) * radius * 0.9,
      radius * (1 + random() * 0.9),
      z + Math.sin(angle) * radius * 0.9,
    );
    glint.velocity.set(Math.cos(angle) * radius * 1.2, radius * 1.6, Math.sin(angle) * radius * 1.2);
    glint.spin.set(0, 8, 4);
    glint.mesh.scale.setScalar(radius * 0.12);
  }

  /** A compaction's shower of confetti and the ring it sends along the ground. */
  burst(x: number, z: number, radius: number, random: () => number): void {
    for (const piece of this.confetti) {
      const direction = randomDirection(random, this.direction);
      direction.y = Math.abs(direction.y) + 0.3;
      piece.velocity.copy(direction.normalize()).multiplyScalar(radius * (4 + random() * 5));
      piece.spin.set(random() * 12, random() * 12, random() * 12);
      piece.life = 1.4 + random() * 0.8;
      this.wake(piece.mesh);
      piece.mesh.position.set(x, radius, z);
      piece.mesh.scale.set(radius * 0.14, radius * 0.05, radius * 0.09);
    }
    this.shockwaveLife = 1;
    this.shockwaveRadius = radius;
    this.shockwave.position.set(x, radius * 0.02, z);
    this.wake(this.shockwave);
  }

  /** Spill one coin of `size`, recycling the oldest when the pool runs dry. */
  coin(x: number, height: number, z: number, size: number, random: () => number): void {
    const coin = this.coins.find((candidate) => candidate.life <= 0) ?? this.coins[0];
    coin.life = COIN_LIFE_SECONDS;
    coin.size = size;
    coin.vy = size * (9 + random() * 5);
    coin.spin = 14 + random() * 10;
    this.wake(coin.mesh);
    coin.mesh.position.set(
      x + (random() - 0.5) * size * 3,
      height,
      z + (random() - 0.5) * size * 3,
    );
    coin.mesh.rotation.set(Math.PI / 2, random() * Math.PI, 0);
    coin.mesh.scale.set(size, size * 0.16, size);
    // Move the coin to the back of the pool so the oldest one is recycled first.
    this.coins.splice(this.coins.indexOf(coin), 1);
    this.coins.push(coin);
  }

  update(deltaSeconds: number): void {
    this.updatePuffs(deltaSeconds);
    this.updateConfetti(deltaSeconds);
    this.updateCoins(deltaSeconds);
  }

  dispose(): void {
    this.shockwave.geometry.dispose();
    for (const puff of this.puffs) (puff.mesh.material as THREE.Material).dispose();
    this.materials.glint.dispose();
    this.materials.shockwave.dispose();
  }

  private wake(mesh: THREE.Mesh): void {
    if (mesh.parent === null) this.scene.add(mesh);
  }

  private updatePuffs(deltaSeconds: number): void {
    for (const puff of this.puffs) {
      if (puff.life <= 0) continue;
      puff.life -= deltaSeconds;
      const progress = 1 - Math.max(0, puff.life) / 0.6;
      puff.mesh.scale.setScalar(puff.grow * (0.4 + progress * 0.8));
      (puff.mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - progress);
      puff.mesh.position.y += deltaSeconds * puff.grow * 0.8;
      if (puff.life <= 0) this.scene.remove(puff.mesh);
    }
  }

  private updateConfetti(deltaSeconds: number): void {
    for (const glint of this.glints) {
      if (glint.life <= 0) continue;
      glint.life -= deltaSeconds;
      glint.mesh.position.addScaledVector(glint.velocity, deltaSeconds);
      glint.mesh.rotation.y += glint.spin.y * deltaSeconds;
      glint.mesh.scale.multiplyScalar(1 - deltaSeconds * 1.2);
      if (glint.life <= 0) this.scene.remove(glint.mesh);
    }
    for (const piece of this.confetti) {
      if (piece.life <= 0) continue;
      piece.life -= deltaSeconds;
      const gravity = piece.mesh.scale.x * 40;
      piece.velocity.y -= gravity * deltaSeconds;
      piece.velocity.multiplyScalar(1 - smoothing(1.2, deltaSeconds));
      piece.mesh.position.addScaledVector(piece.velocity, deltaSeconds);
      if (piece.mesh.position.y < 0) {
        piece.mesh.position.y = 0;
        piece.velocity.set(0, 0, 0);
      }
      piece.mesh.rotation.x += piece.spin.x * deltaSeconds;
      piece.mesh.rotation.y += piece.spin.y * deltaSeconds;
      piece.mesh.rotation.z += piece.spin.z * deltaSeconds;
      if (piece.life <= 0) this.scene.remove(piece.mesh);
    }
    if (this.shockwaveLife > 0) {
      this.shockwaveLife = Math.max(0, this.shockwaveLife - deltaSeconds * 1.3);
      const grow = 1 - this.shockwaveLife;
      this.shockwave.scale.setScalar(this.shockwaveRadius * (1.2 + grow * 5));
      this.materials.shockwave.opacity = this.shockwaveLife * 0.85;
      if (this.shockwaveLife === 0) this.scene.remove(this.shockwave);
    }
  }

  private updateCoins(deltaSeconds: number): void {
    for (const coin of this.coins) {
      if (coin.life <= 0) continue;
      coin.life -= deltaSeconds;
      const rest = coin.size * 0.08;
      const position = coin.mesh.position;
      if (position.y > rest || coin.vy > 0) {
        // Flipping through the air, then landing flat with a clink.
        coin.vy -= coin.size * 60 * deltaSeconds;
        position.y = Math.max(rest, position.y + coin.vy * deltaSeconds);
        coin.mesh.rotation.x += coin.spin * deltaSeconds;
        if (position.y === rest) {
          coin.vy = 0;
          coin.mesh.rotation.x = 0;
        }
      }
      const fade = Math.min(1, coin.life / 1.2);
      coin.mesh.scale.set(coin.size * fade, coin.size * 0.16 * fade, coin.size * fade);
      if (coin.life <= 0) this.scene.remove(coin.mesh);
    }
  }
}
