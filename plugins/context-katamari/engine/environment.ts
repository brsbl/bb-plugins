import * as THREE from "three";

import { mulberry32 } from "../katamari-math";
import { Horizon } from "./horizon";
import type { MaterialKit } from "./materials";
import {
  ZONE_ACCENT_COLORS,
  ZONE_GROUND_COLORS,
  ZONES,
  zoneAt,
  zoneIndex,
} from "./zones";

/** One full dawn-to-dawn cycle. */
const DAY_SECONDS = 240;
const ZONE_MAP_TEXELS = 128;
/** Ground and zone map span, in ball radii. */
const GROUND_SPAN_RADII = 200;

interface SkyKey {
  at: number;
  top: number;
  horizon: number;
  sun: number;
  hemiSky: number;
  hemiGround: number;
  light: number;
  stars: number;
}

// A long key-art day of clean blue sky, then a quick sunset, a starry
// night, and dawn.
const SKY_KEYS: readonly SkyKey[] = [
  { at: 0.0, top: 0x6f9be0, horizon: 0xf7d2dd, sun: 0xffd2a8, hemiSky: 0xfff0f4, hemiGround: 0xb9c79a, light: 1.0, stars: 0.1 },
  { at: 0.07, top: 0x3d8fd6, horizon: 0xcdeefa, sun: 0xffffff, hemiSky: 0xffffff, hemiGround: 0xbfdc8e, light: 1.15, stars: 0 },
  { at: 0.64, top: 0x3d8fd6, horizon: 0xcdeefa, sun: 0xffffff, hemiSky: 0xffffff, hemiGround: 0xbfdc8e, light: 1.15, stars: 0 },
  { at: 0.72, top: 0x6a5fb0, horizon: 0xffb38a, sun: 0xff9a66, hemiSky: 0xffe0cc, hemiGround: 0xa89a8a, light: 0.95, stars: 0 },
  { at: 0.79, top: 0x2d3278, horizon: 0xc77a96, sun: 0xffa6b0, hemiSky: 0xd0b8e6, hemiGround: 0x5a4f80, light: 0.75, stars: 0.4 },
  { at: 0.86, top: 0x101a4a, horizon: 0x33488f, sun: 0xbccfff, hemiSky: 0x9aaee8, hemiGround: 0x333060, light: 0.6, stars: 1 },
  { at: 0.95, top: 0x33459a, horizon: 0x9a8acb, sun: 0xdcc8ff, hemiSky: 0xcbc0f2, hemiGround: 0x5f5590, light: 0.75, stars: 0.5 },
  { at: 1.0, top: 0x6f9be0, horizon: 0xf7d2dd, sun: 0xffd2a8, hemiSky: 0xfff0f4, hemiGround: 0xb9c79a, light: 1.0, stars: 0.1 },
];

const scratchColor = new THREE.Color();
const scratchSunDirection = new THREE.Vector3();
const WHITE = new THREE.Color(1, 1, 1);

/** Rewritten by every `sampleSky` call, so read it before sampling again. */
const skySample = {
  top: new THREE.Color(),
  horizon: new THREE.Color(),
  sun: new THREE.Color(),
  hemiSky: new THREE.Color(),
  hemiGround: new THREE.Color(),
  light: 0,
  stars: 0,
};

function mixHex(target: THREE.Color, from: number, to: number, blend: number): void {
  target.setHex(from).lerp(scratchColor.setHex(to), blend);
}

function sampleSky(phase: number) {
  let index = 0;
  while (index < SKY_KEYS.length - 2 && SKY_KEYS[index + 1].at <= phase) index += 1;
  const from = SKY_KEYS[index];
  const to = SKY_KEYS[index + 1];
  const blend = THREE.MathUtils.smoothstep(phase, from.at, to.at);
  mixHex(skySample.top, from.top, to.top, blend);
  mixHex(skySample.horizon, from.horizon, to.horizon, blend);
  mixHex(skySample.sun, from.sun, to.sun, blend);
  mixHex(skySample.hemiSky, from.hemiSky, to.hemiSky, blend);
  mixHex(skySample.hemiGround, from.hemiGround, to.hemiGround, blend);
  skySample.light = THREE.MathUtils.lerp(from.light, to.light, blend);
  skySample.stars = THREE.MathUtils.lerp(from.stars, to.stars, blend);
  return skySample;
}

const SKY_VERTEX = /* glsl */ `
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww;
}
`;

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDirection;
uniform float uStars;
uniform float uTime;
varying vec3 vDirection;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 direction = normalize(vDirection);
  float height = direction.y;
  // The camera sees only the lowest band of sky, so reach full blue early.
  vec3 color = mix(uHorizon, uTop, smoothstep(0.0, 0.16, height));
  color = mix(color, uHorizon * 0.92, smoothstep(0.0, -0.3, height));
  // The key art has no sun disk, only a faint warm glow toward the light.
  float facing = max(dot(direction, uSunDirection), 0.0);
  color += uSunColor * pow(facing, 24.0) * 0.12;
  vec3 grid = direction * 150.0;
  vec3 cell = floor(grid);
  float star = hash(cell);
  if (star > 0.982 && height > 0.02) {
    float twinkle = 0.6 + 0.4 * sin(uTime * (2.0 + star * 5.0) + star * 40.0);
    float spot = smoothstep(0.32, 0.0, length(fract(grid) - 0.5));
    color += vec3(1.0, 0.96, 0.85) * spot * twinkle * uStars;
  }
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

const GROUND_VERTEX = /* glsl */ `
varying vec3 vWorld;
varying float vDepth;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 view = viewMatrix * world;
  vDepth = -view.z;
  gl_Position = projectionMatrix * view;
}
`;

const GROUND_FRAGMENT = /* glsl */ `
uniform sampler2D uZoneMap;
uniform vec2 uMapOrigin;
uniform float uMapSize;
uniform vec3 uZoneColors[${ZONES.length}];
uniform vec3 uAccentColors[${ZONES.length}];
uniform float uDetail;
uniform vec3 uLight;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vWorld;
varying float vDepth;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float line(float value, float width) {
  float f = fract(value);
  return step(1.0 - width, f) + step(f, width * 0.5);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  // Warp the lookup a little so zone borders wander instead of stair-stepping.
  vec2 texel = vWorld.xz / (uMapSize / 128.0);
  vec2 warp = vec2(valueNoise(texel * 0.7), valueNoise(texel * 0.7 + 17.0)) - 0.5;
  vec2 uv = (vWorld.xz - uMapOrigin) / uMapSize + warp * (1.6 / 128.0);
  vec4 zoneSample = texture2D(uZoneMap, uv);
  int zone = int(floor(zoneSample.r * 255.0 / 32.0 + 0.5));
  float variant = zoneSample.g;
  vec3 base = uZoneColors[zone] * (0.93 + variant * 0.14);
  vec3 accent = uAccentColors[zone];
  vec2 p = vWorld.xz / uDetail;
  vec3 color = base;
  if (zone == 0) {
    // Tatami: long mats with dark seams and a fine weave.
    vec2 mats = p * vec2(0.5, 1.0);
    float offset = mod(floor(mats.y), 2.0) * 0.5;
    float seam = clamp(line(mats.x + offset, 0.04) + line(mats.y, 0.06), 0.0, 1.0);
    float weave = 0.5 + 0.5 * sin(p.y * 40.0);
    color = mix(base * (0.96 + weave * 0.05), accent * 0.8, seam);
  } else if (zone == 1) {
    // Lawn: mown stripes and clover speckles.
    float stripe = mod(floor(p.x * 0.5), 2.0);
    color = mix(base, accent, stripe * 0.35);
    // Beige dirt paths winding through the grass.
    float path = abs(sin(p.x * 0.09 + sin(p.y * 0.07) * 2.2));
    color = mix(color, vec3(0.95, 0.87, 0.67), 1.0 - smoothstep(0.05, 0.09, path));
  } else if (zone == 2) {
    // Paving slabs, with a painted road every few blocks.
    float slabs = clamp(line(p.x, 0.05) + line(p.y, 0.05), 0.0, 1.0);
    color = mix(base, base * 0.78, slabs);
    float road = step(mod(floor(p.x / 4.0), 3.0), 0.5);
    vec3 asphalt = vec3(0.33, 0.35, 0.42);
    float dash = step(0.5, fract(p.y * 0.5)) * step(abs(fract(p.x / 4.0) * 4.0 - 2.0), 0.08);
    color = mix(color, mix(asphalt, accent, dash), road);
  } else if (zone == 3) {
    // Sand ripples.
    float ripple = 0.5 + 0.5 * sin(p.x * 3.0 + sin(p.y * 1.3) * 2.0);
    color = mix(base, accent, ripple * 0.5);
  } else if (zone == 4) {
    // Frosting checkerboard with sprinkles.
    float check = mod(floor(p.x) + floor(p.y), 2.0);
    color = mix(base, accent, check * 0.7);
    float sprinkle = step(0.975, hash2(floor(p * 5.0)));
    vec3 sprinkleColor = vec3(hash2(floor(p * 5.0) + 3.0), hash2(floor(p * 5.0) + 7.0), 0.9);
    color = mix(color, sprinkleColor, sprinkle);
  } else if (zone == 5) {
    // Forest floor: clover patches.
    float clover = step(0.55, hash2(floor(p * 1.5)));
    color = mix(base, accent, clover * 0.45);
  } else {
    // Snow drifts with glints.
    float drift = 0.5 + 0.5 * sin(p.x * 1.7 + sin(p.y * 0.9) * 2.5);
    color = mix(base, accent, drift * 0.5);
    color += vec3(step(0.985, hash2(floor(p * 12.0)))) * 0.4;
  }
  color *= uLight;
  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  #include <colorspace_fragment>
}
`;

export class Environment {
  readonly hemisphere: THREE.HemisphereLight;
  readonly sun: THREE.DirectionalLight;
  readonly fogColor = new THREE.Color();
  private readonly sky: THREE.Mesh;
  private readonly skyUniforms;
  private readonly ground: THREE.Mesh;
  private readonly groundUniforms;
  private readonly zoneData: Uint8Array;
  private readonly zoneTexture: THREE.DataTexture;
  private readonly horizon: Horizon;
  private zoneOrigin = new THREE.Vector2(Number.NaN, Number.NaN);
  private zoneLevel = -1;
  private zoneMapSize = 1;
  private phase: number;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly kit: MaterialKit,
    private readonly seed: number,
  ) {
    const random = mulberry32(seed);
    this.phase = 0.18 + random() * 0.2;

    this.hemisphere = new THREE.HemisphereLight(0xffffff, 0x88aa88, 1.1);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.2);
    scene.add(this.hemisphere, this.sun, this.sun.target);

    this.skyUniforms = {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
      uStars: { value: 0 },
      uTime: { value: 0 },
    };
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: this.skyUniforms,
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    scene.add(this.sky);

    this.zoneData = new Uint8Array(ZONE_MAP_TEXELS * ZONE_MAP_TEXELS * 4);
    this.zoneTexture = new THREE.DataTexture(this.zoneData, ZONE_MAP_TEXELS, ZONE_MAP_TEXELS);
    this.zoneTexture.magFilter = THREE.NearestFilter;
    this.zoneTexture.minFilter = THREE.NearestFilter;
    this.groundUniforms = {
      uZoneMap: { value: this.zoneTexture },
      uMapOrigin: { value: new THREE.Vector2() },
      uMapSize: { value: 1 },
      uZoneColors: { value: ZONE_GROUND_COLORS.map((color) => new THREE.Color(color)) },
      uAccentColors: { value: ZONE_ACCENT_COLORS.map((color) => new THREE.Color(color)) },
      uDetail: { value: 1 },
      uLight: { value: new THREE.Color(1, 1, 1) },
      uFogColor: { value: new THREE.Color() },
      uFogNear: { value: 10 },
      uFogFar: { value: 40 },
    };
    const groundGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    groundGeometry.rotateX(-Math.PI / 2);
    this.ground = new THREE.Mesh(
      groundGeometry,
      new THREE.ShaderMaterial({
        uniforms: this.groundUniforms,
        vertexShader: GROUND_VERTEX,
        fragmentShader: GROUND_FRAGMENT,
      }),
    );
    this.ground.frustumCulled = false;
    this.ground.renderOrder = -5;
    scene.add(this.ground);

    this.horizon = new Horizon(kit, seed);
    scene.add(this.horizon.group);
  }

  get skyPhase(): number {
    return this.phase;
  }

  update(
    deltaSeconds: number,
    time: number,
    focus: THREE.Vector3,
    radius: number,
    level: number,
    camera: THREE.PerspectiveCamera,
  ): void {
    this.phase = (this.phase + deltaSeconds / DAY_SECONDS) % 1;
    const sky = sampleSky(this.phase);

    const daylight = this.phase < 0.7;
    const arc = daylight ? this.phase / 0.7 : (this.phase - 0.7) / 0.3;
    const elevation = Math.sin(arc * Math.PI) * (daylight ? 1 : 0.7);
    const azimuth = arc * Math.PI + 0.4;
    const sunDirection = scratchSunDirection
      .set(
        Math.cos(azimuth) * Math.cos(Math.asin(Math.min(0.999, elevation))),
        Math.max(0.05, elevation),
        Math.sin(azimuth) * 0.6,
      )
      .normalize();

    this.skyUniforms.uTop.value.copy(sky.top);
    this.skyUniforms.uHorizon.value.copy(sky.horizon);
    this.skyUniforms.uSunColor.value.copy(sky.sun);
    this.skyUniforms.uSunDirection.value.copy(sunDirection);
    this.skyUniforms.uStars.value = sky.stars;
    this.skyUniforms.uTime.value = time;
    this.sky.position.copy(camera.position);
    this.sky.scale.setScalar(camera.far * 0.5);

    this.hemisphere.color.copy(sky.hemiSky);
    this.hemisphere.groundColor.copy(sky.hemiGround);
    this.hemisphere.intensity = 0.55 + sky.light * 0.6;
    this.sun.color.copy(sky.sun);
    this.sun.intensity = sky.light * 1.1;
    this.sun.position.copy(focus).addScaledVector(sunDirection, radius * 40);
    this.sun.target.position.copy(focus);

    this.fogColor.copy(sky.horizon);
    const fog = this.scene.fog as THREE.Fog | null;
    // A light haze: the skyline goes grey-teal, but the view stays crisp.
    const fogNear = radius * 34;
    const fogFar = radius * 150;
    if (fog) {
      fog.color.copy(this.fogColor);
      fog.near = fogNear;
      fog.far = fogFar;
    }

    const span = radius * GROUND_SPAN_RADII;
    this.refreshZones(focus, span, level);
    this.ground.position.set(focus.x, 0, focus.z);
    this.ground.scale.set(span, 1, span);
    this.groundUniforms.uDetail.value = 0.36 * 2 ** level;
    this.groundUniforms.uLight.value
      .copy(sky.hemiSky)
      .lerp(WHITE, 0.35)
      .multiplyScalar(0.55 + sky.light * 0.4);
    this.groundUniforms.uFogColor.value.copy(this.fogColor);
    this.groundUniforms.uFogNear.value = fogNear;
    this.groundUniforms.uFogFar.value = fogFar;

    this.horizon.update(deltaSeconds, focus, radius, camera, this.phase > 0.05 && this.phase < 0.7 ? 1 : 0);
  }

  /** Zones are sampled on a grid that follows the ball, snapped so patches stay put. */
  private refreshZones(focus: THREE.Vector3, span: number, level: number): void {
    const texel = span / ZONE_MAP_TEXELS;
    const originX = Math.floor((focus.x - span / 2) / texel) * texel;
    const originZ = Math.floor((focus.z - span / 2) / texel) * texel;
    const moved =
      Math.abs(originX - this.zoneOrigin.x) > span / 8 ||
      Math.abs(originZ - this.zoneOrigin.y) > span / 8 ||
      Math.abs(span - this.zoneMapSize) > span * 0.2 ||
      Number.isNaN(this.zoneOrigin.x);
    if (!moved && level === this.zoneLevel) {
      this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin);
      this.groundUniforms.uMapSize.value = this.zoneMapSize;
      return;
    }
    this.zoneOrigin.set(originX, originZ);
    this.zoneLevel = level;
    this.zoneMapSize = span;
    for (let row = 0; row < ZONE_MAP_TEXELS; row += 1) {
      for (let column = 0; column < ZONE_MAP_TEXELS; column += 1) {
        const sample = zoneAt(
          originX + (column + 0.5) * texel,
          originZ + (row + 0.5) * texel,
          level,
          this.seed,
        );
        const offset = (row * ZONE_MAP_TEXELS + column) * 4;
        this.zoneData[offset] = zoneIndex(sample.zone) * 32;
        this.zoneData[offset + 1] = Math.floor(sample.variant * 255);
        this.zoneData[offset + 2] = 0;
        this.zoneData[offset + 3] = 255;
      }
    }
    this.zoneTexture.needsUpdate = true;
    this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin);
    this.groundUniforms.uMapSize.value = span;
  }

  dispose(): void {
    this.horizon.dispose();
    this.sky.geometry.dispose();
    (this.sky.material as THREE.Material).dispose();
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();
    this.zoneTexture.dispose();
  }
}
