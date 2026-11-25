.42 * (w * w) * freq * cos(u * freq + phase * 3.0);
  vec3 normal = normalize(N - across * (dW / max(W, 0.004)) - T * (dU / max(L, 0.1)) * 0.3);
  vUv = position.xy;
  vW = P;
  vN = normal;
  vAcross = across;
  vTint = aOut.w;
  vCa = kCausticsAt(P, normal);
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;
const BLADE_FRAG = /* glsl */ `
uniform vec3 uBlade, uBladeB;
varying vec2 vUv;
varying vec3 vW, vN, vAcross, vCa;
varying float vTint;
void main(){
  float u = vUv.x;
  float w = vUv.y;
  // Close up, the blade's veins: fine ridges running from the stalk to the tip, drawing together toward each end,
  // with a crinkle across them. They tip the normal and darken a little, so they show in light through the blade.
  float close = 1.0 - smoothstep(0.9, 2.6, length(vW - cameraPosition));
  float veinPhase = w * (30.0 - u * 8.0) + sin(u * 9.0) * 0.5;
  float vein = smoothstep(0.55, 0.95, cos(veinPhase));
  float crinkle = sin(u * 170.0 + w * 6.0) * 0.5;
  vec3 A = normalize(vAcross);
  vec3 N = normalize(normalize(vN) - A * (sin(veinPhase) * 0.28 * close) + A * (crinkle * 0.08 * close));
  // The blade's own colour: darker toward the stalk and down the middle, finely streaked along its length, paler
  // and thinner at the ruffled edges, with a little blotching.
  float streak = sin(w * 37.0 + sin(u * 11.0) * 2.0) * 0.06 + 0.97;
  float blotch = sin(u * 23.0 + w * 3.0) * sin(u * 7.3) * 0.08 + 1.0;
  float middle = 1.0 - pow(max(1.0 - abs(w), 0.0), 6.0) * 0.18;
  float edge = smoothstep(0.7, 1.0, abs(w)) * 0.25 + 1.0;
  float toTip = mix(0.6, 1.12, smoothstep(0.0, 0.5, u));
  vec3 tone = mix(uBlade, uBladeB, vTint) * (streak * blotch * middle * edge * toTip) * (1.0 - vein * close * 0.16);
  gl_FragColor = vec4(kFinish(tone, N, vW, 0.45, vCa, tone * vec3(1.25, 1.05, 0.55) * 0.9), 1.0);
  ${K_OUT}
}`;
// The floats: small glossy bladders where each blade meets the stipe.
const FLOAT_VERT = /* glsl */ `
attribute vec4 aBase, aAxis, aOut;
varying vec3 vW, vN, vCa;
varying float vTint;
void main(){
  vec3 axis = normalize(aAxis.xyz + vec3(0.0, 1e-4, 0.0));
  vec3 along = normalize(axis * 0.55 + normalize(aOut.xyz) * 0.85);
  vec3 level = normalize(cross(axis, aOut.xyz) + vec3(1e-4, 0.0, 0.0));
  vec3 third = cross(along, level);
  float s = aBase.w * 0.05 + 0.012;
  vec3 p = position;
  vec3 P = aBase.xyz + along * (p.y * (s * 1.5) + s) + level * (p.x * s) + third * (p.z * s);
  P.y = min(P.y, -0.01);
  vec3 n = normalize(along * p.y + level * p.x + third * p.z);
  vW = P;
  vN = n;
  vTint = aOut.w;
  vCa = kCausticsAt(P, n);
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;
const FLOAT_FRAG = /* glsl */ `
uniform vec3 uBlade, uBladeB;
varying vec3 vW, vN, vCa;
varying float vTint;
void main(){
  vec3 tone = mix(uBlade, uBladeB, vTint) * vec3(1.15, 1.05, 0.7);
  gl_FragColor = vec4(kFinish(tone, normalize(vN), vW, 0.3, vCa, tone * 0.6), 1.0);
  ${K_OUT}
}`;
const ROOT_VERT = /* glsl */ `
attribute vec4 aPlant;
attribute vec4 aSpin;
varying vec3 vW, vN, vL, vCa;
varying float vTint;
void main(){
  float c = cos(aSpin.x), s = sin(aSpin.x);
  vec3 q = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c);
  vec3 n = vec3(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c);
  vec3 P = aPlant.xyz + q * aPlant.w;
  vW = P;
  vN = n;
  vL = position;
  vTint = aSpin.y;
  vCa = kCausticsAt(P, n);
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;
const ROOT_FRAG = /* glsl */ `
uniform vec3 uStipe, uStipeB;
varying vec3 vW, vN, vL, vCa;
varying float vTint;
void main(){
  // Older haptera darker, younger ones paler, mottled over a few centimetres.
  vec3 tone = mix(uStipe, uStipeB, vTint) * (kNoise3(vL * 28.0) * 0.25 + 0.85) * vec3(1.0, 0.97, 0.9);
  gl_FragColor = vec4(kFinish(tone, normalize(vN), vW, 0.8, vCa, vec3(0.0)), 1.0);
  ${K_OUT}
}`;
const tangent = new THREE.Vector3();
const outward = new THREE.Vector3();
export class KelpPool {
  constructor(maxPlants, fine) {
    this.maxPlants = maxPlants;
    this.group = new THREE.Group();
    this.group.name = "kelp3-giant";
    const maxSegs = maxPlants * 11 * (NODES - 1);
    const maxBlades = maxPlants * 11 * (NODES - 2);
    this.maxSegs = maxSegs;
    this.maxBlades = maxBlades;
    const dynamic = (count) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    // The stipe: a tube of rings along each length between nodes, x the way along and y the way round.
    const rings = fine > 0.8 ? 3 : 2;
    const sides = fine > 0.6 ? 5 : 4;
    const tubePoints = [];
    const tubeIndex = [];
    for (let r = 0; r <= rings; r++) for (let s = 0; s <= sides; s++) tubePoints.push(r / rings, (s / sides) * Math.PI * 2, 0);
    for (let r = 0; r < rings; r++)
      for (let s = 0; s < sides; s++) {
        const a = r * (sides + 1) + s;
        const b = a + sides + 1;
        tubeIndex.push(a, b, a + 1, a + 1, b, b + 1);
      }
    this.tube = new THREE.InstancedBufferGeometry();
    this.tube.setAttribute("position", new THREE.Float32BufferAttribute(tubePoints, 3));
    this.tube.setIndex(tubeIndex);
    this.ends = ["aP0", "aP1", "aP2", "aP3"].map((name) => {
      const a = dynamic(maxSegs);
      this.tube.setAttribute(name, a);
      return a;
    });
    this.tube.instanceCount = 0;
    // Blades: each a strip, x along and y across.
    const along = fine > 0.7 ? 6 : 4;
    const across = 2;
    const leafPoints = [];
    const leafIndex = [];
    for (let a = 0; a <= along; a++) for (let c = 0; c <= across; c++) leafPoints.push(a / along, (c / across) * 2 - 1, 0);
    for (let a = 0; a < along; a++)
      for (let c = 0; c < across; c++) {
        const i = a * (across + 1) + c;
        const j = i + across + 1;
        leafIndex.push(i, j, i + 1, i + 1, j, j + 1);
      }
    this.leaf = new THREE.InstancedBufferGeometry();
    this.leaf.setAttribute("position", new THREE.Float32BufferAttribute(leafPoints, 3));
    this.leaf.setIndex(leafIndex);
    this.base = dynamic(maxBlades);
    this.axis = dynamic(maxBlades);
    this.stream = dynamic(maxBlades);
    this.out = dynamic(maxBlades);
    this.leaf.setAttribute("aBase", this.base);
    this.leaf.setAttribute("aAxis", this.axis);
    this.leaf.setAttribute("aFlow", this.stream);
    this.leaf.setAttribute("aOut", this.out);
    this.leaf.instanceCount = 0;
    // The floats share the blades' placing.
    const sphere = fine > 0.6 ? new THREE.SphereGeometry(1, 5, 4) : new THREE.SphereGeometry(1, 4, 3);
    this.bladder = new THREE.InstancedBufferGeometry();
    this.bladder.setAttribute("position", sphere.getAttribute("position"));
    this.bladder.setIndex(sphere.getIndex());
    this.bladder.setAttribute("aBase", this.base);
    this.bladder.setAttribute("aAxis", this.axis);
    this.bladder.setAttribute("aOut", this.out);
    this.bladder.instanceCount = 0;
    // Holdfasts: two shapes, each plant one of them, placed and turned by its own attributes.
    this.roots = [0, 1].map((v) => {
      const shape = holdfast(7001 + v * 13, fine);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute("position", shape.getAttribute("position"));
      g.setAttribute("normal", shape.getAttribute("normal"));
      const plant = dynamic(maxPlants);
      const spin = dynamic(maxPlants);
      g.setAttribute("aPlant", plant);
      g.setAttribute("aSpin", spin);
      g.instanceCount = 0;
      return { geometry: g, plant, spin };
    });
    const tones = {
      uBlade: { value: new THREE.Color("#8a6a22") },
      // Fresh-water weed runs greener than the sea's kelp: rivers and swamps lean toward it.
      uBladeB: { value: new THREE.Color("#6e7226") },
      uStipe: { value: new THREE.Color("#5a4518") },
      uStipeB: { value: new THREE.Color("#4b4a1a") },
    };
    this.materials = {
      stipe: kMaterial({ uniforms: tones, vertex: STIPE_VERT, fragment: STIPE_FRAG }),
      blade: kMaterial({ uniforms: tones, vertex: BLADE_VERT, fragment: BLADE_FRAG, side: THREE.DoubleSide }),
      float: kMaterial({ uniforms: tones, vertex: FLOAT_VERT, fragment: FLOAT_FRAG }),
      root: kMaterial({ uniforms: tones, vertex: ROOT_VERT, fragment: ROOT_FRAG }),
    };
    this.meshes = [
      new THREE.Mesh(this.tube, this.materials.stipe),
      new THREE.Mesh(this.leaf, this.materials.blade),
      new THREE.Mesh(this.bladder, this.materials.float),
      ...this.roots.map((r) => new THREE.Mesh(r.geometry, this.materials.root)),
    ];
    for (const m of this.meshes) {
      m.frustumCulled = false;
      this.group.add(m);
    }
    this.counts = { segments: 0, blades: 0 };
  }
  // The holdfasts stand still: placed whenever the set of plants changes.
  place(plants) {
    const n = [0, 0];
    for (const plant of plants) {
      const r = this.roots[plant.variant];
      const i = n[plant.variant]++ * 4;
      const s = plant.site;
      r.plant.array[i] = s.x;
      r.plant.array[i + 1] = s.y;
      r.plant.array[i + 2] = s.z;
      r.plant.array[i + 3] = s.size * 1.25;
      r.spin.array[i] = plant.turn;
      r.spin.array[i + 1] = s.tint;
    }
    this.roots.forEach((r, v) => {
      r.geometry.instanceCount = n[v];
      r.plant.needsUpdate = true;
      r.spin.needsUpdate = true;
    });
  }
  // Every instanced piece's per-frame data, filled from the plants' chains once a frame. Plain loops with nothing
  // made along the way: this runs for every length of stipe and every blade, every frame.
  fill(plants) {
    const e0 = this.ends[0].array;
    const e1 = this.ends[1].array;
    const e2 = this.ends[2].array;
    const e3 = this.ends[3].array;
    const b = this.base.array;
    const a = this.axis.array;
    const f = this.stream.array;
    const out = this.out.array;
    const last = NODES - 1;
    let o = 0;
    let j = 0;
    for (let n = 0; n < plants.length; n++) {
      const plant = plants[n];
      const p = plant.chains.shown;
      const rel = plant.chains.stream;
      const tint = plant.site.tint;
      const girth = plant.site.size;
      const stipes = plant.stipes;
      for (let i = 0; i < stipes.length; i++) {
        const first = i * NODES;
        const thick = stipes[i].thick * girth;
        for (let k = 0; k < last; k++) {
          const q0 = (first + Math.max(0, k - 1)) * 3;
          const q1 = (first + k) * 3;
          const q2 = (first + k + 1) * 3;
          const q3 = (first + Math.min(last, k + 2)) * 3;
          e0[o] = p[q0];
          e0[o + 1] = p[q0 + 1];
          e0[o + 2] = p[q0 + 2];
          e0[o + 3] = tint;
          e1[o] = p[q1];
          e1[o + 1] = p[q1 + 1];
          e1[o + 2] = p[q1 + 2];
          e2[o] = p[q2];
          e2[o + 1] = p[q2 + 1];
          e2[o + 2] = p[q2 + 2];
          e3[o] = p[q3];
          e3[o + 1] = p[q3 + 1];
          e3[o + 2] = p[q3 + 2];
          // Radius in the fourth place of the two middle points: thicker at the root, thinner up the stipe.
          e1[o + 3] = (0.016 - 0.007 * Math.min(1, k / 6)) * thick;
          e2[o + 3] = (0.016 - 0.007 * Math.min(1, (k + 1) / 6)) * thick;
          o += 4;
        }
      }
      const sites = plant.sites;
      for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        const first = site.chain * NODES;
        const q = (first + site.node) * 3;
        const before = (first + site.node - 1) * 3;
        const after = (first + Math.min(last, site.node + 1)) * 3;
        tangent.set(p[after] - p[before], p[after + 1] - p[before + 1], p[after + 2] - p[before + 2]).normalize();
        // Out to one side of the stipe, the site's own level direction squared to it. A little of the level way
        // across the stipe is added so it never runs out when the stipe lies along that direction: the side then
        // turns smoothly instead of flipping, which would make the blades twitch.
        const tx = tangent.x;
        const ty = tangent.y;
        const tz = tangent.z;
        const d = site.cx * tx + site.cz * tz;
        outward.set(site.cx - tx * d - 0.3 * tz, -ty * d, site.cz - tz * d + 0.3 * tx).normalize();
        b[j] = p[q];
        b[j + 1] = p[q + 1];
        b[j + 2] = p[q + 2];
        b[j + 3] = site.length;
        a[j] = tx;
        a[j + 1] = ty;
        a[j + 2] = tz;
        a[j + 3] = site.phase;
        f[j] = rel[q];
        f[j + 1] = rel[q + 1];
        f[j + 2] = rel[q + 2];
        f[j + 3] = site.width;
        out[j] = outward.x;
        out[j + 1] = outward.y;
        out[j + 2] = outward.z;
        out[j + 3] = tint;
        j += 4;
      }
    }
    const segments = o / 4;
    const blades = j / 4;
    this.tube.instanceCount = segments;
    this.leaf.instanceCount = blades;
    this.bladder.instanceCount = blades;
    for (const attribute of this.ends) send(attribute, o);
    send(this.base, j);
    send(this.axis, j);
    send(this.stream, j);
    send(this.out, j);
    this.counts.segments = segments;
    this.counts.blades = blades;
  }
  dispose() {
    this.group.removeFromParent();
    this.tube.dispose();
    this.leaf.dispose();
    this.bladder.dispose();
    for (const r of this.roots) r.geometry.dispose();
    for (const m of Object.values(this.materials)) m.dispose();
  }
}
// Only the part in use is sent.
function send(attribute, floats) {
  if (attribute.clearUpdateRanges) {
    attribute.clearUpdateRanges();
    if (floats > 0) attribute.addUpdateRange(0, floats);
  }
  attribute.needsUpdate = true;
}
