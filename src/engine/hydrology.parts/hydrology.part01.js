import { BufferGeometry, Float32BufferAttribute } from "three";

const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function unifyMainStems(network) {
  const original = network.reaches;
  const children = original.map(() => []);
  for (const reach of original)
    if (
      reach.parent >= 0 &&
      reach.parent !== reach.id &&
      children[reach.parent]
    )
      children[reach.parent].push(reach.id);
  const lengths = new Map(),
    visiting = new Set();
  const upstreamLength = (id) => {
    if (lengths.has(id)) return lengths.get(id);
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const length =
      original[id].length + Math.max(0, ...children[id].map(upstreamLength));
    visiting.delete(id);
    lengths.set(id, length);
    return length;
  };
  original.forEach((r) => upstreamLength(r.id));
  const continuation = new Map();
  for (const reach of original) {
    const branches = children[reach.id].filter(
      (id) => original[id].kind !== "distributary",
    );
    if (branches.length)
      continuation.set(
        reach.id,
        branches.sort((a, b) => upstreamLength(b) - upstreamLength(a))[0],
      );
  }
  const consumed = new Set(),
    mapping = new Map(),
    routes = [];
  const roots = original
    .filter((r) => r.parent < 0)
    .sort((a, b) => upstreamLength(b.id) - upstreamLength(a.id));
  const assemble = (end) => {
    if (consumed.has(end.id)) return;
    const chain = [end];
    consumed.add(end.id);
    let current = end;
    while (continuation.has(current.id)) {
      const next = original[continuation.get(current.id)];
      if (consumed.has(next.id)) break;
      chain.unshift(next);
      consumed.add(next.id);
      current = next;
    }
    const route = {
      ...end,
      id: routes.length,
      pts: [],
      hw: [],
      depth: [],
      sed: [],
      speed: [],
      q: [],
      curv: [],
      cells: [],
      _parent: end.parent,
    };
    for (const segment of chain) {
      mapping.set(segment.id, route.id);
      const start = route.pts.length ? 1 : 0;
      for (let i = start; i < segment.hw.length; i++) {
        route.pts.push(segment.pts[i * 2], segment.pts[i * 2 + 1]);
        for (const key of ["hw", "depth", "sed", "speed", "q", "curv"])
          route[key].push(segment[key][i] ?? 0);
      }
      route.cells.push(...segment.cells);
    }
    route.length = chain.reduce((sum, r) => sum + r.length, 0);
    route.strahler = Math.max(...chain.map((r) => r.strahler));
    routes.push(route);
    for (const segment of chain)
      for (const id of children[segment.id])
        if (!consumed.has(id)) assemble(original[id]);
  };
  for (const root of roots) assemble(root);
  for (const reach of original) if (!consumed.has(reach.id)) assemble(reach);
  for (const route of routes) {
    route.parent = route._parent >= 0 ? (mapping.get(route._parent) ?? -1) : -1;
    if (route.parent === route.id) route.parent = -1;
    route.kind =
      route.parent < 0
        ? route.id === 0
          ? "main"
          : "secondary"
        : route.length > 320
          ? "tributary"
          : "creek";
    delete route._parent;
  }
  network.reaches = routes;
}

/* ---------------------------------------------------------------------------
   Natural river planform
   ---------------------------------------------------------------------------
   The network is traced on the 10 m D8 drainage grid, so raw centrelines are
   staircases of 0/45/90 degree steps, and downstream extensions are pushed as
   raw cell centres. A Catmull-Rom curve through every one of those points
   reproduces the staircase exactly. Instead each reach is:
     1. resampled at a uniform arc-length spacing tied to its width,
     2. low-pass filtered with Taubin (lambda|mu) smoothing, which removes the
        grid-scale zig-zags but preserves the long meander wavelengths
        (plain Laplacian smoothing would shrink every bend),
     3. given gentle free meanders where it is still unnaturally straight
        (wavelength ~11 channel widths, amplitude ~1 width, tapered at both
        ends so mouths and confluences stay where hydrology put them),
     4. curvature-limited so no bend is tighter than ~2 channel widths,
     5. resampled again so the carving sees evenly spaced segments.
   Children are processed after their parents and their mouths are snapped
   onto the parent's final centreline first, so confluences stay joined.
--------------------------------------------------------------------------- */
const smooth01 = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const REACH_ATTRS = ["hw", "depth", "sed", "speed", "q"];

function hashUnit(k) {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
function noise1(t) {
  const i = Math.floor(t),
    f = t - i,
    u = f * f * (3 - 2 * f);
  return mix(hashUnit(i), hashUnit(i + 1), u);
}
function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function arcLengths(p) {
  const n = p.length / 2,
    s = new Float64Array(n);
  for (let i = 1; i < n; i++)
    s[i] =
      s[i - 1] + Math.hypot(p[i * 2] - p[i * 2 - 2], p[i * 2 + 1] - p[i * 2 - 1]);
  return s;
}
function medianOf(a) {
  if (!a || !a.length) return 6;
  const b = Array.from(a).sort((x, y) => x - y);
  return b[b.length >> 1] || 6;
}
function resampleReach(reach, ds) {
  const src = reach.pts,
    n = src.length / 2;
  if (n < 2) return;
  const s = arcLengths(src),
    L = s[n - 1];
  if (L < ds * 2.5) return;
  const m = Math.max(3, Math.round(L / ds) + 1),
    step = L / (m - 1),
    pts = new Array(m * 2),
    out = {};
  for (const k of REACH_ATTRS) out[k] = new Array(m);
  let j = 0;
  for (let i = 0; i < m; i++) {
    const target = i === m - 1 ? L : i * step;
    while (j < n - 2 && s[j + 1] < target) j++;
    const seg = s[j + 1] - s[j],
      t = seg > 1e-9 ? clamp((target - s[j]) / seg) : 0;
    pts[i * 2] = mix(src[j * 2], src[j * 2 + 2], t);
    pts[i * 2 + 1] = mix(src[j * 2 + 1], src[j * 2 + 3], t);
    for (const k of REACH_ATTRS) {
      const a = reach[k];
      if (!a || !a.length) {
        out[k][i] = 0;
        continue;
      }
      const a0 = a[Math.min(j, a.length - 1)] ?? 0,
        a1 = a[Math.min(j + 1, a.length - 1)] ?? a0;
      out[k][i] = mix(a0, a1, t);
    }
  }
  pts[0] = src[0];
  pts[1] = src[1];
  pts[m * 2 - 2] = src[n * 2 - 2];
  pts[m * 2 - 1] = src[n * 2 - 1];
  reach.pts = pts;
  for (const k of REACH_ATTRS) reach[k] = out[k];
}
// lambda|mu smoothing with pinned end points: a low-pass filter without shrinkage
function taubin(p, pairs, lam = 0.5, mu = -0.53) {
  const n = p.length / 2;
  if (n < 3 || pairs <= 0) return;
  const tmp = new Float64Array(p.length);
  for (let it = 0; it < pairs * 2; it++) {
    const f = it & 1 ? mu : lam;
    for (let i = 1; i < n - 1; i++) {
      tmp[i * 2] = p[i * 2] + f * ((p[i * 2 - 2] + p[i * 2 + 2]) * 0.5 - p[i * 2]);
      tmp[i * 2 + 1] =
        p[i * 2 + 1] + f * ((p[i * 2 - 1] + p[i * 2 + 3]) * 0.5 - p[i * 2 + 1]);
    }
    for (let i = 1; i < n - 1; i++) {
      p[i * 2] = tmp[i * 2];
      p[i * 2 + 1] = tmp[i * 2 + 1];
    }
  }
}
// relax any bend tighter than rmin(i) (Menger curvature on the polyline)
function limitCurvature(p, rmin, iterations) {
  const n = p.length / 2;
  if (n < 3) return;
  for (let it = 0; it < iterations; it++) {
    let moved = 0;
    for (let i = 1; i < n - 1; i++) {
      const ax = p[i * 2 - 2],
        az = p[i * 2 - 1],
        bx = p[i * 2],
        bz = p[i * 2 + 1],
        cx = p[i * 2 + 2],
        cz = p[i * 2 + 3];
      const cross = (bx - ax) * (cz - az) - (bz - az) * (cx - ax),
        den =
          Math.hypot(bx - ax, bz - az) *
          Math.hypot(cx - bx, cz - bz) *
          Math.hypot(cx - ax, cz - az);
      if (den < 1e-9) continue;
      const k = Math.abs((2 * cross) / den) * rmin(i);
      if (k <= 1) continue;
      const f = Math.min(0.5, 0.16 + (k - 1) * 0.22);
      p[i * 2] = bx + ((ax + cx) * 0.5 - bx) * f;
      p[i * 2 + 1] = bz + ((az + cz) * 0.5 - bz) * f;
      moved++;
    }
    if (!moved) break;
  }
}
// free meanders on reaches that are still unnaturally straight
function injectMeanders(reach, rnd) {
  const p = reach.pts,
    n = p.length / 2;
  if (n < 10) return;
  const s = arcLengths(p),
    L = s[n - 1];
  if (L < 150) return;
  const width = (i) => 2 * Math.max(reach.hw[i] || 4, 3);
  const straight = new Float32Array(n);
  let j0 = 0,
    j1 = 0;
  for (let i = 0; i < n; i++) {
    const win = clamp(width(i) * 6, 55, 420);
    while (j0 < i && s[i] - s[j0] > win) j0++;
    while (j1 < n - 1 && s[j1] - s[i] < win) j1++;
    const arc = s[j1] - s[j0],
      chord = Math.hypot(p[j1 * 2] - p[j0 * 2], p[j1 * 2 + 1] - p[j0 * 2 + 1]);
    straight[i] = arc > win * 0.9 ? smooth01(1.12, 1.025, arc / Math.max(chord, 1e-3)) : 0;
  }
  // soften the straightness field so meander amplitude never switches abruptly
  const soft = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let acc = 0,
      wsum = 0;
    for (let k = -6; k <= 6; k++) {
      const q = Math.min(n - 1, Math.max(0, i + k)),
        w = 1 - Math.abs(k) / 7;
      acc += straight[q] * w;
      wsum += w;
    }
    soft[i] = acc / wsum;
  }
  const ph1 = rnd() * 64,
    side = rnd() < 0.5 ? 1 : -1;
  let phase = rnd() * Math.PI * 2;
  const off = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const w = width(i),
      wl = clamp(w * 11, 70, 650);
    if (i) phase += (Math.PI * 2 * (s[i] - s[i - 1])) / wl;
    const taper = smooth01(0, wl * 0.6, s[i]) * smooth01(0, wl * 0.6, L - s[i]),
      amp =
        clamp(w * 0.85, 5, 55) *
        soft[i] *
        taper *
        (0.7 + 0.6 * noise1(s[i] / (wl * 1.7) + ph1));
    off[i] = side * amp * (Math.sin(phase) + 0.22 * Math.sin(2 * phase + ph1));
  }
  const q = p.slice();
  for (let i = 1; i < n - 1; i++) {
    const tx = p[i * 2 + 2] - p[i * 2 - 2],
      tz = p[i * 2 + 3] - p[i * 2 - 1],
      tl = Math.hypot(tx, tz) || 1;
    q[i * 2] = p[i * 2] - (tz / tl) * off[i];
    q[i * 2 + 1] = p[i * 2 + 1] + (tx / tl) * off[i];
  }
  reach.pts = q;
}
function signedCurvature(p) {
  const count = p.length / 2;
  return Array.from({ length: count }, (_, i) => {
    if (!i || i === count - 1) return 0;
    const ax = p[i * 2] - p[i * 2 - 2],
      az = p[i * 2 + 1] - p[i * 2 - 1];
    const bx = p[i * 2 + 2] - p[i * 2],
      bz = p[i * 2 + 3] - p[i * 2 + 1];
    return (
      (ax * bz - az * bx) /
      Math.max(Math.hypot(ax, az) * Math.hypot(bx, bz) * Math.hypot(ax + bx, az + bz), 1)
    );
  });
}
// pull one end of a reach onto its parent's centreline (falloff over the last points)
function snapToParent(reach, parent, atStart) {
  const n = reach.pts.length / 2,
    pp = parent.pts;
  if (n < 2 || pp.length < 4) return;
  const idx = atStart ? 0 : n - 1,
    ex = reach.pts[idx * 2],
    ez = reach.pts[idx * 2 + 1];
  let best = null,
    distance = Infinity,
    node = 0;
  for (let i = 0; i < pp.length - 2; i += 2) {
    const ax = pp[i],
      az = pp[i + 1],
      dx = pp[i + 2] - ax,
      dz = pp[i + 3] - az,
      t = clamp(((ex - ax) * dx + (ez - az) * dz) / Math.max(dx * dx + dz * dz, 0.001)),
      x = ax + t * dx,
      z = az + t * dz,
      d = Math.hypot(x - ex, z - ez);
    if (d < distance) {
      distance = d;
      best = { x, z };
      node = (i >> 1) + (t > 0.5 ? 1 : 0);
    }
  }
  if (!best || distance > 180) return;
  const dx = best.x - ex,
    dz = best.z - ez,
    span = Math.max(1, Math.min(n - 1, 10));
  for (let j = 0; j <= span; j++) {
    const w = Math.pow(1 - j / span, 2),
      k = atStart ? j : n - 1 - j;
    reach.pts[k * 2] += dx * w;
    reach.pts[k * 2 + 1] += dz * w;
  }
  if (!atStart) reach.joinNode = node;
}

export function refineRiverNetwork(network) {
  const full = !network._unified;
  if (full) {
    unifyMainStems(network);
    network._unified = true;
  }
  const reaches = network.reaches,
    level = new Map();
  const depthOf = (r) => {
    if (level.has(r.id)) return level.get(r.id);
    let d = 0,
      q = r;
    while (q && q.parent >= 0 && q.parent !== q.id && d < 64) {
      q = reaches[q.parent];
      d++;
    }
    level.set(r.id, d);
    return d;
  };
  const order = [...reaches].sort((a, b) => depthOf(a) - depthOf(b));
  for (const reach of order) {
    if (!reach.pts || reach.pts.length < 6) continue;
    const parent = reach.parent >= 0 ? reaches[reach.parent] : null;
    if (parent && parent !== reach)
      snapToParent(reach, parent, reach.kind === "distributary");
    const medHw = medianOf(reach.hw),
      rmin = (i) => clamp((reach.hw[i] || medHw) * 4.2, 20, 150);
    if (full) {
      const ds = clamp(medHw * 0.7, 5, 11);
      resampleReach(reach, ds);
      const sigma = clamp(1.1 * medHw + 8, 12, 45);
      taubin(reach.pts, Math.round(clamp(2 * (sigma / ds) ** 2, 4, 40)));
      const seed =
        ((reach.id + 1) * 2654435761) ^
        Math.round(reach.pts[0] * 7.31) ^
        (Math.round(reach.pts[1] * 3.17) << 9);
      injectMeanders(reach, seededRandom(seed));
      taubin(reach.pts, 3);
      limitCurvature(reach.pts, rmin, 70);
      resampleReach(reach, ds);
    } else {
      taubin(reach.pts, 3);
      limitCurvature(reach.pts, rmin, 30);
    }
    reach.length = arcLengths(reach.pts)[reach.pts.length / 2 - 1];
    reach.curv = signedCurvature(reach.pts);
  }
}

/* ---------------------------------------------------------------------------
   Smooth waterlines
   ---------------------------------------------------------------------------
   Carving marks a cell wet when its *centre* lies inside the channel and then
   forces it >= 0.2 m below the datum, while the bank just outside is held
   >= 0.2 m above it. The h = 0 contour therefore always sits halfway between
   cell centres and traces the 10 m wet mask as a staircase. Here, after every
   other terrain pass, heights within about one cell of each river or lake
   edge are blended towards a single linear function of the true signed
   distance to that edge (same slope on both sides). Linear interpolation of
   the heightfield then places the waterline with sub-cell accuracy, so banks
   follow the real curved channel instead of the grid.
--------------------------------------------------------------------------- */
const BODY_LAND = 0;
const BODY_SEA = 1;
const BODY_LAKE = 2;
const BODY_RIVER = 3;
const BODY_ESTUARY = 6;

/* ---------------------------------------------------------------------------
   Guaranteed unobstructed navigable passages:
     1) River <-> Lake inlets & outlets (cuts cleanly through any shore rim,
        ridge ring, or delta shoal created before river polyline refinement)
     2) River <-> Sea estuaries (carves BOTH land/beach berms AND shallow sea
        bars smoothly out to open deep ocean, with a wide gradual brackish
        plume & flow-field transition so the water blends seamlessly!)
--------------------------------------------------------------------------- */
export function carveNavigablePassages(o) {
  const {
    N,
    cell,
    half,
    h,
    rivers,
    lakes,
    lakeId,
    body,
    wet,
    inl,
    flowX,
    flowZ,
    navMask,
    sed,
    swamp,
  } = o;
  if (!h || !N || !rivers?.length) return;
  const NN = N * N;

  const idxOf = (x, z) => {
    const ix = Math.round((x + half) / cell - 0.5);
    const iz = Math.round((z + half) / cell - 0.5);
    if (ix < 1 || iz < 1 || ix >= N - 1 || iz >= N - 1) return -1;
    return iz * N + ix;
  };

  // Carve a smooth, natural parabolic navigable channel along segment (ax,az)->(bx,bz)
  // that cuts cleanly through land rims, shoals, AND coastal sandbars alike.
  const carveSegment = (
    ax,
    az,
    bx,
    bz,
    hw0,
    hw1,
    d0,
    d1,
    spd0,
    spd1,
    opts = {},
  ) => {
    const dx = bx - ax,
      dz = bz - az,
      len2 = dx * dx + dz * dz;
    if (len2 < 1e-4) return;
    const len = Math.sqrt(len2);
    const dirX = dx / len,
      dirZ = dz / len;
    const bankFlare = opts.bankFlare ?? 1.55;
    const maxR = Math.max(hw0, hw1) * bankFlare + cell * 2.2;
    const x0 = Math.max(1, Math.floor((Math.min(ax, bx) - maxR + half) / cell));
    const x1 = Math.min(N - 2, Math.ceil((Math.max(ax, bx) + maxR + half) / cell));
    const z0 = Math.max(1, Math.floor((Math.min(az, bz) - maxR + half) / cell));
    const z1 = Math.min(N - 2, Math.ceil((Math.max(az, bz) + maxR + half) / cell));

    for (let iz = z0; iz <= z1; iz++) {
      const z = (iz + 0.5) * cell - half;
      for (let ix = x0; ix <= x1; ix++) {
        const x = (ix + 0.5) * cell - half;
        const t = clamp(((x - ax) * dx + (z - az) * dz) / len2);
        const px = ax + dx * t,
          pz = az + dz * t;
        const dist = Math.hypot(x - px, z - pz);
        const hw = mix(hw0, hw1, t);
        const outerR = hw * bankFlare + cell * 1.4;
        if (dist > outerR) continue;
        const k = iz * N + ix;
        const depthC = mix(d0, d1, t);
        const u = dist / Math.max(hw, 1);

        if (u < 1.0) {
          // Smooth flat-bottomed U/parabolic navigable channel: wide deep core for boats,
          // gentle sloped flanks up to the natural waterline.
          const core = 1 - smooth01(0.42, 1.0, u);
          const targetH = -Math.max(0.28, depthC * (0.24 + 0.76 * core));
          if (targetH < h[k]) h[k] = targetH;
          if (!opts.keepSea || body[k] !== BODY_SEA) {
            wet[k] = 1;
            if (body[k] === BODY_LAND) {
              body[k] = opts.estuary ? BODY_ESTUARY : BODY_RIVER;
            }
          }
          if (u < 0.74 && navMask) navMask[k] = 1;
          if (swamp && u < 0.78) swamp[k] *= smooth01(0.45, 0.9, 