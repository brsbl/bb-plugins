import * as THREE from "three";

import { mulberry32 } from "../katamari-math";
import type { MaterialKit } from "./materials";
import { bake } from "./props";

/**
 * The key-art backdrop: a grey-teal city skyline with a tower, rows of dark
 * cypress trees, rolling green hills, a snow-capped Fuji, banks of cumulus
 * along the horizon, and a bold rainbow. Everything is built in ball-radius
 * units inside one group that follows the camera focus, so the horizon keeps
 * its size as the katamari grows.
 */
const SKYLINE_DISTANCE = 72;
const RAINBOW_DISTANCE = 110;
const RAINBOW_SCALE = 34;
const RAINBOW_BANDS = [0xe8453c, 0xf5913a, 0xf7d23e, 0x6cbf45, 0x3a8fd6, 0x7a4fb0];
const BUILDING_COLORS = [0x8fa4ae, 0x9db2bc, 0x7e949f, 0xb2c3cb, 0x6f8792];

type Vec3 = readonly [number, number, number];

function block(
  group: THREE.Group,
  kit: MaterialKit,
  color: number,
  scale: Vec3,
  position: Vec3,
  rotationY = 0,
): void {
  const mesh = new THREE.Mesh(kit.box(), kit.solid(color));
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  group.add(mesh);
}

function polar(angle: number, distance: number): [number, number] {
  return [Math.cos(angle) * distance, Math.sin(angle) * distance];
}

function buildSkyline(kit: MaterialKit, random: () => number, bearing: number): THREE.Group {
  const city = new THREE.Group();
  const span = 2.3;
  for (let index = 0; index < 64; index += 1) {
    const angle = bearing - span / 2 + (index / 64) * span + (random() - 0.5) * 0.03;
    const distance = SKYLINE_DISTANCE + random() * 10;
    const [x, z] = polar(angle, distance);
    const tall = random() < 0.12;
    const width = 1.6 + random() * 2.6;
    const height = tall ? 9 + random() * 4 : 2.5 + random() * 5.5;
    const color = BUILDING_COLORS[Math.floor(random() * BUILDING_COLORS.length)];
    const facing = -angle;
    block(city, kit, color, [width, height, width], [x, height / 2, z], facing);
    // Window bands in a lighter tint, like the illustration's flat facades.
    const windowTint = new THREE.Color(color).lerp(new THREE.Color(0xe6f1f5), 0.45).getHex();
    for (let floor = 1.2; floor < height - 0.6; floor += 1.1) {
      block(city, kit, windowTint, [width * 1.02, 0.28, width * 0.7], [x, floor, z], facing);
    }
    if (tall) block(city, kit, color, [0.2, 2.2, 0.2], [x, height + 1.1, z]);
  }
  // One lattice tower, red and white, standing off the end of the city.
  const [towerX, towerZ] = polar(bearing + span / 2 + 0.12, SKYLINE_DISTANCE + 4);
  for (let tier = 0; tier < 6; tier += 1) {
    const width = 2.2 - tier * 0.33;
    block(city, kit, tier % 2 === 0 ? 0xe2463a : 0xf4f4f4, [width, 2.4, width], [towerX, 1.2 + tier * 2.4, towerZ]);
  }
  return bake(city, kit);
}

function buildTrees(kit: MaterialKit, random: () => number): THREE.Group {
  const grove = new THREE.Group();
  for (let index = 0; index < 90; index += 1) {
    const angle = random() * Math.PI * 2;
    const [x, z] = polar(angle, 50 + random() * 14);
    const height = 2.2 + random() * 2.4;
    const trunk = new THREE.Mesh(kit.cylinder(6), kit.solid(0x6b4a2f));
    trunk.scale.set(0.2, height * 0.3, 0.2);
    trunk.position.set(x, height * 0.15, z);
    const crown = new THREE.Mesh(kit.sphere(1), kit.solid(random() < 0.5 ? 0x2f7d3a : 0x3b8f44));
    crown.scale.set(1.1, height, 1.1);
    crown.position.set(x, height * 0.72, z);
    grove.add(trunk, crown);
  }
  return bake(grove, kit);
}

function buildHills(kit: MaterialKit, random: () => number): THREE.Group {
  const hills = new THREE.Group();
  const greens = [0x8cc63f, 0x7ab835, 0x9dd04e, 0x6fae30];
  for (let index = 0; index < 22; index += 1) {
    const angle = (index / 22) * Math.PI * 2 + random() * 0.2;
    const [x, z] = polar(angle, 58 + random() * 12);
    const hill = new THREE.Mesh(kit.sphere(2), kit.solid(greens[index % greens.length]));
    const width = 18 + random() * 16;
    hill.scale.set(width, 5 + random() * 6, width * 0.8);
    hill.position.set(x, -1, z);
    hill.rotation.y = -angle;
    hills.add(hill);
  }
  return bake(hills, kit);
}

function buildFuji(kit: MaterialKit, bearing: number): THREE.Group {
  const mountain = new THREE.Group();
  const [x, z] = polar(bearing, 130);
  const body = new THREE.Mesh(kit.cone(28), kit.solid(0x3f8fbf));
  body.scale.set(96, 34, 96);
  body.position.set(x, 16, z);
  const snow = new THREE.Mesh(kit.cone(28), kit.solid(0xf6fbff));
  snow.scale.set(38, 13.6, 38);
  snow.position.set(x, 26.3, z);
  // Snow runs down the flanks in a few tongues.
  const group = new THREE.Group();
  group.add(body, snow);
  for (let index = 0; index < 7; index += 1) {
    const tongue = new THREE.Mesh(kit.cone(3), kit.solid(0xf6fbff));
    const angle = (index / 7) * Math.PI * 2;
    tongue.scale.set(6, 8, 3);
    tongue.position.set(x + Math.cos(angle) * 17, 19.5, z + Math.sin(angle) * 17);
    tongue.rotation.set(Math.PI, -angle, 0);
    group.add(tongue);
  }
  mountain.add(group);
  return bake(mountain, kit);
}

interface CloudBank {
  mesh: THREE.Group;
  angle: number;
  distance: number;
  drift: number;
}

export class Horizon {
  readonly group = new THREE.Group();
  private readonly rainbow = new THREE.Group();
  private readonly clouds: CloudBank[] = [];
  private readonly cloudMaterial: THREE.MeshToonMaterial;
  private readonly fujiMaterials: THREE.Material[] = [];

  constructor(kit: MaterialKit, seed: number) {
    const random = mulberry32(seed ^ 0x5eed);
    const skylineBearing = random() * Math.PI * 2;
    this.group.add(
      buildHills(kit, random),
      buildTrees(kit, random),
      buildSkyline(kit, random, skylineBearing),
    );
    // Fuji stands far enough off that the haze would wash it out; keep it crisp.
    const fuji = buildFuji(kit, skylineBearing + 2.6);
    fuji.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = (child.material as THREE.Material).clone();
        (material as THREE.MeshToonMaterial).fog = false;
        child.material = material;
        this.fujiMaterials.push(material);
      }
    });
    this.group.add(fuji);

    this.cloudMaterial = new THREE.MeshToonMaterial({ color: 0xffffff, fog: false });
    for (let index = 0; index < 16; index += 1) {
      const bank = new THREE.Group();
      const puffs = 5 + Math.floor(random() * 5);
      for (let puff = 0; puff < puffs; puff += 1) {
        const sphere = new THREE.Mesh(kit.sphere(2), this.cloudMaterial);
        const size = 2.2 + random() * 3.2;
        sphere.scale.set(size * 1.2, size, size);
        // Flat bottoms and billowing tops, the way cumulus sits on a horizon.
        sphere.position.set((puff - puffs / 2) * 2.6 + random(), 9 + size * 0.35 + random() * 2.5, random() * 2);
        bank.add(sphere);
      }
      this.group.add(bank);
      this.clouds.push({
        mesh: bank,
        angle: random() * Math.PI * 2,
        distance: 92 + random() * 22,
        drift: 0.004 + random() * 0.006,
      });
    }

    RAINBOW_BANDS.forEach((color, band) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(1 - band * 0.034, 0.017, 4, 80, Math.PI),
        new THREE.MeshBasicMaterial({ color, fog: false }),
      );
      this.rainbow.add(arc);
    });
    this.group.add(this.rainbow);
  }

  update(
    deltaSeconds: number,
    focus: THREE.Vector3,
    radius: number,
    camera: THREE.Camera,
    daylight: number,
  ): void {
    this.group.position.set(focus.x, 0, focus.z);
    this.group.scale.setScalar(radius);
    for (const cloud of this.clouds) {
      cloud.angle += cloud.drift * deltaSeconds;
      const [x, z] = polar(cloud.angle, cloud.distance);
      cloud.mesh.position.set(x, 0, z);
      cloud.mesh.rotation.y = -cloud.angle + Math.PI / 2;
    }
    // The rainbow hangs across the sky ahead of the camera, like the key art.
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    this.rainbow.visible = daylight > 0.5;
    this.rainbow.position.set(forward.x * RAINBOW_DISTANCE, -1, forward.z * RAINBOW_DISTANCE);
    this.rainbow.scale.setScalar(RAINBOW_SCALE);
    this.rainbow.lookAt(
      focus.x,
      this.group.position.y + radius * -1,
      focus.z,
    );
  }

  dispose(): void {
    this.cloudMaterial.dispose();
    for (const material of this.fujiMaterials) material.dispose();
    for (const arc of this.rainbow.children as THREE.Mesh[]) {
      arc.geometry.dispose();
      (arc.material as THREE.Material).dispose();
    }
  }
}
