u);

          // Blend smooth natural flow velocity through junction/mouth
          const spd = mix(spd0, spd1, t) * (0.45 + 0.55 * core);
          if (spd > 0.02 && flowX && flowZ) {
            const cur = Math.hypot(flowX[k], flowZ[k]);
            if (spd > cur * 0.85) {
              flowX[k] = mix(flowX[k], dirX * spd, 0.65);
              flowZ[k] = mix(flowZ[k], dirZ * spd, 0.65);
            }
          }
          if (inl && opts.inlTarget != null) {
            const inlV = mix(opts.inlTarget[0], opts.inlTarget[1], t);
            inl[k] = Math.max(inl[k], inlV * (0.55 + 0.45 * core));
          }
          if (sed && opts.sedVal != null) {
            sed[k] = Math.max(sed[k], opts.sedVal * (0.5 + 0.5 * core));
          }
        } else {
          // Gently grade adjacent dry banks down toward the channel so there are no vertical cliffs
          if (h[k] > 0) {
            const bankT = smooth01(1.0, bankFlare, u);
            const bankTarget = 0.25 + bankT * bankT * (opts.estuary ? 3.2 : 5.4);
            if (h[k] > bankTarget) {
              h[k] = mix(h[k], bankTarget, (1 - bankT) * 0.78);
            }
          }
        }
      }
    }
  };

  // 1) RIVER <-> LAKE PASSAGES: ensure every river touching or passing near a lake
  //    has a deep, wide, completely unobstructed throat into and out of the lake basin.
  for (const r of rivers) {
    const p = r.pts,
      hw = r.hw,
      m = Math.min(hw.length, p.length / 2);
    if (m < 3) continue;
    const isNav = r.navigable || r.kind === "main" || r.kind === "secondary";

    for (const lake of lakes || []) {
      const reachR = lake.r * 1.65 + 90;
      let minDist = Infinity,
        closestIdx = -1;
      for (let i = 0; i < m; i++) {
        const d = Math.hypot(p[i * 2] - lake.x, p[i * 2 + 1] - lake.z);
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      }
      if (minDist > reachR) continue;

      // Carve continuously along every reach segment crossing the lake rim zone (0.45*r .. 1.55*r)
      for (let i = 0; i + 1 < m; i++) {
        const ax = p[i * 2],
          az = p[i * 2 + 1],
          bx = p[i * 2 + 2],
          bz = p[i * 2 + 3];
        const mx = (ax + bx) * 0.5,
          mz = (az + bz) * 0.5;
        const dMid = Math.hypot(mx - lake.x, mz - lake.z);
        if (dMid > lake.r * 1.65 + 70) continue;
        // Flare width gently right as the river opens into the lake bay
        const mouthFlare = 1 + 0.55 * (1 - smooth01(lake.r * 0.65, lake.r * 1.4, dMid));
        const w0 = Math.max(hw[i] * mouthFlare, isNav ? 16 : 11);
        const w1 = Math.max(hw[i + 1] * mouthFlare, isNav ? 16 : 11);
        const d0 = Math.max(r.depths?.[i] || 3.4, isNav ? 4.0 : 2.8);
        const d1 = Math.max(r.depths?.[i + 1] || 3.4, isNav ? 4.0 : 2.8);
        const s0 = r.speeds?.[i] ?? 0.25;
        const s1 = r.speeds?.[i + 1] ?? 0.25;
        carveSegment(ax, az, bx, bz, w0, w1, d0, d1, s0, s1, {
          bankFlare: 1.6,
          inlTarget: [1.0, 1.0],
        });
      }

      // If the river polyline skirted the lake edge (closest point is outside lake basin),
      // bridge a natural navigable inlet/outlet channel straight into the lake's deep water!
      if (closestIdx >= 0 && minDist > lake.r * 0.55 && minDist < lake.r * 1.42) {
        const sx = p[closestIdx * 2],
          sz = p[closestIdx * 2 + 1];
        const vx = lake.x - sx,
          vz = lake.z - sz;
        const vl = Math.hypot(vx, vz) || 1;
        const ex = sx + (vx / vl) * Math.min(vl * 0.72, lake.r * 0.85);
        const ez = sz + (vz / vl) * Math.min(vl * 0.72, lake.r * 0.85);
        const wBase = Math.max(hw[closestIdx] || 14, isNav ? 17 : 12);
        carveSegment(sx, sz, ex, ez, wBase, wBase * 1.55, 4.1, 4.8, 0.26, 0.14, {
          bankFlare: 1.65,
          inlTarget: [1.0, 1.0],
        });
      }
    }
  }

  // 2) RIVER <-> SEA ESTUARY PASSAGES: carve every sea-bound river mouth continuously
  //    from 130m upstream right across any beach/berm/bar and smoothly into deep ocean!
  for (const r of rivers) {
    if (r.outlet !== "Sea" && r.bodyKind !== BODY_ESTUARY) continue;
    const p = r.pts,
      hw = r.hw,
      m = Math.min(hw.length, p.length / 2);
    if (m < 3) continue;

    // Backtrack ~110m upstream from reach end so the transition starts well inside the river
    let startIdx = m - 1,
      backDist = 0;
    while (startIdx > 0 && backDist < 110) {
      backDist += Math.hypot(
        p[startIdx * 2] - p[(startIdx - 1) * 2],
        p[startIdx * 2 + 1] - p[(startIdx - 1) * 2 + 1],
      );
      startIdx--;
    }
    const endX = p[(m - 1) * 2],
      endZ = p[(m - 1) * 2 + 1];
    const refIdx = Math.max(0, m - 5);
    let dirX = endX - p[refIdx * 2],
      dirZ = endZ - p[refIdx * 2 + 1];
    const dl = Math.hypot(dirX, dirZ) || 1;
    dirX /= dl;
    dirZ /= dl;

    // Build estuary polyline: last upstream segments + curved extension out to deep open sea
    const mouthPts = [];
    for (let i = startIdx; i < m; i++) {
      mouthPts.push({
        x: p[i * 2],
        z: p[i * 2 + 1],
        hw: Math.max(hw[i] || 16, 17),
        d: Math.max(r.depths?.[i] || 3.8, 4.1),
        spd: Math.max(r.speeds?.[i] || 0.35, 0.28),
        inl: 1.0,
      });
    }

    let cx = endX,
      cz = endZ;
    let curHw = Math.max(hw[m - 1] || 20, 20);
    let curSpd = Math.max(r.speeds?.[m - 1] || 0.38, 0.32);
    const step = 18;
    let reachedSeaAt = -1;

    for (let s = 1; s <= 44; s++) {
      const distOut = s * step;
      // Gently steer toward deeper ocean water so we never fight a parallel sandspit
      let bestDX = dirX,
        bestDZ = dirZ,
        bestScore = Infinity;
      for (const ang of [-0.45, -0.22, 0, 0.22, 0.45]) {
        const ca = Math.cos(ang),
          sa = Math.sin(ang);
        const tx = dirX * ca - dirZ * sa;
        const tz = dirX * sa + dirZ * ca;
        const probeK = idxOf(cx + tx * 45, cz + tz * 45);
        if (probeK < 0) continue;
        const score = h[probeK] + Math.abs(ang) * 2.2;
        if (score < bestScore) {
          bestScore = score;
          bestDX = tx;
          bestDZ = tz;
        }
      }
      dirX = mix(dirX, bestDX, 0.35);
      dirZ = mix(dirZ, bestDZ, 0.35);
      const nLen = Math.hypot(dirX, dirZ) || 1;
      dirX /= nLen;
      dirZ /= nLen;

      cx += dirX * step;
      cz += dirZ * step;
      const k = idxOf(cx, cz);
      if (k < 0) break;

      const isDeepSea = body[k] === BODY_SEA && h[k] < -3.2;
      if (isDeepSea && reachedSeaAt < 0) reachedSeaAt = distOut;

      // Natural trumpet/funnel estuary widening as it opens into the sea
      const flare = 1 + smooth01(0, 280, distOut) * 1.15;
      const wHere = Math.min(68, curHw * flare);
      const dHere = Math.max(4.4, Math.min(7.5, 4.4 + distOut * 0.008));
      // Smooth gradual freshwater plume fading over ~260m past the coastline
      const seaDist = reachedSeaAt >= 0 ? distOut - reachedSeaAt : 0;
      const inlHere =
        reachedSeaAt < 0
          ? 0.98
          : clamp(Math.exp(-seaDist / 165) * 0.96, 0.02, 0.98);
      const spdHere = curSpd * clamp(Math.exp(-seaDist / 190), 0.04, 1.0);

      mouthPts.push({
        x: cx,
        z: cz,
        hw: wHere,
        d: dHere,
        spd: spdHere,
        inl: inlHere,
      });

      if (reachedSeaAt >= 0 && seaDist > 260 && h[k] < -4.8) break;
    }

    for (let i = 0; i + 1 < mouthPts.length; i++) {
      const a = mouthPts[i],
        b = mouthPts[i + 1];
      carveSegment(a.x, a.z, b.x, b.z, a.hw, b.hw, a.d, b.d, a.spd, b.spd, {
        estuary: true,
        keepSea: b.inl < 0.72,
        bankFlare: 1.75,
        inlTarget: [a.inl, b.inl],
        sedVal: 0.42 * b.inl,
      });
    }
  }

  // 3) Smooth the inland-ness (inl) and estuary flow plume over a wide coastal mixing zone
  //    so river water gradually dissolves into turquoise sea water with zero abrupt seam!
  if (inl) {
    const tmpI = new Float32Array(NN);
    const tmpX = flowX ? new Float32Array(NN) : null;
    const tmpZ = flowZ ? new Float32Array(NN) : null;
    for (let pass = 0; pass < 7; pass++) {
      tmpI.set(inl);
      if (tmpX && tmpZ) {
        tmpX.set(flowX);
        tmpZ.set(flowZ);
      }
      for (let iz = 1; iz < N - 1; iz++) {
        for (let ix = 1; ix < N - 1; ix++) {
          const k = iz * N + ix;
          // Only diffuse across wet estuary/coastal-sea mixing zone (keep pure inland = 1.0)
          if (h[k] >= 0.05) continue;
          if (body[k] !== BODY_SEA && body[k] !== BODY_ESTUARY) continue;
          if (inl[k] > 0.995 && body[k] !== BODY_SEA) continue;
          let sI = tmpI[k] * 2,
            wS = 2,
            sX = tmpX ? tmpX[k] * 2 : 0,
            sZ = tmpZ ? tmpZ[k] * 2 : 0;
          for (const q of [k - 1, k + 1, k - N, k + N]) {
            if (h[q] >= 0.15) continue;
            sI += tmpI[q];
            if (tmpX && tmpZ) {
              sX += tmpX[q];
              sZ += tmpZ[q];
            }
            wS++;
          }
          const avgI = sI / wS;
          // Preserve strong inland core while softening outer estuary front
          inl[k] = body[k] === BODY_SEA ? Math.max(inl[k] * 0.45, avgI) : mix(inl[k], avgI, 0.35);
          if (tmpX && tmpZ && body[k] === BODY_SEA && inl[k] > 0.06) {
            flowX[k] = (sX / wS) * 0.92;
            flowZ[k] = (sZ / wS) * 0.92;
          }
        }
      }
    }
  }
}

export function sculptRiverWaterlines(o) {
  const { N, cell, half, h, rivers, body, lakeId, wet, lakeSD, navMask } = o;
  if (!h || !N) return;
  const NN = N * N,
    SLOPE = 0.095,
    bandOut = cell * 2.4,
    minHalf = cell * 1.05,
    sd = new Float32Array(NN).fill(1e9),
    vtAt = new Float32Array(NN);
  for (const r of rivers || []) {
    const p = r.pts,
      hw = r.hw,
      m = Math.min(hw.length, p.length / 2);
    for (let F = 0; F + 1 < m; F++) {
      const C = p[F * 2],
        P = p[F * 2 + 1],
        U = p[F * 2 + 2] - C,
        V = p[F * 2 + 3] - P,
        len2 = U * U + V * V || 1,
        reachR = Math.max(hw[F], hw[F + 1], minHalf) + bandOut + cell,
        x0 = Math.max(0, Math.floor((Math.min(C, C + U) - reachR + half) / cell)),
        x1 = Math.min(N - 1, Math.ceil((Math.max(C, C + U) + reachR + half) / cell)),
        z0 = Math.max(0, Math.floor((Math.min(P, P + V) - reachR + half) / cell)),
        z1 = Math.min(N - 1, Math.ceil((Math.max(P, P + V) + reachR + half) / cell));
      for (let iz = z0; iz <= z1; iz++) {
        const z = (iz + 0.5) * cell - half;
        for (let ix = x0; ix <= x1; ix++) {
          const x = (ix + 0.5) * cell - half,
            t = clamp(((x - C) * U + (z - P) * V) / len2),
            d = Math.hypot(x - (C + U * t), z - (P + V * t)),
            vt = Math.max(mix(hw[F], hw[F + 1], t), minHalf),
            s = d - vt,
            k = iz * N + ix;
          if (s < sd[k]) {
            sd[k] = s;
            vtAt[k] = vt;
          }
        }
      }
    }
  }
  // 1) soften the carved channel core: the navigable-depth clamp and the per-cell
  //    slope limiter leave grid-aligned steps on the bed that show up as blocky
  //    depth colour. A few masked averaging passes inside the channel only.
  const inside = (k) =>
    sd[k] < -0.5 && wet[k] && h[k] < 0 && body[k] !== BODY_SEA && lakeId[k] < 0;
  const copy = new Float32Array(NN);
  for (let pass = 0; pass < 3; pass++) {
    copy.set(h);
    for (let iz = 1; iz < N - 1; iz++)
      for (let ix = 1; ix < N - 1; ix++) {
        const k = iz * N + ix;
        if (!inside(k)) continue;
        let acc = copy[k] * 4,
          wsum = 4;
        for (let dz = -1; dz <= 1; dz++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dz) continue;
            const q = k + dz * N + dx;
            if (!inside(q)) continue;
            const w = dx && dz ? 1 : 2;
            acc += copy[q] * w;
            wsum += w;
          }
        const smoothed = Math.min(acc / wsum, -0.05);
        h[k] = navMask && navMask[k] ? Math.min(smoothed, -2.5) : smoothed;
      }
  }
  // 2) exact linear profile across the waterline (same slope both sides), then
  //    a short blend back to the existing bed / bank — NEVER raising a navigable
  //    river-lake junction or river-sea mouth above navigable boat draft!
  const linIn = cell * 1.15,
    linOut = cell * 1.2,
    blend = cell * 0.7;
  const reshape = (k, s, halfWidth) => {
    const t = SLOPE * s;
    if (s < 0) {
      if (!wet[k] || h[k] >= 0) return;
      // Preserve deep carved navigable fairways so boats never ground on artificial sills
      if (navMask && navMask[k]) {
        const l1 = Math.min(linIn * 0.6, halfWidth * 0.45),
          w = smooth01(l1, l1 + blend, -s);
        h[k] = Math.min(h[k], Math.min(t + (h[k] - t) * w, -2.2));
        return;
      }
      const l1 = Math.min(linIn, halfWidth * 0.75),
        w = smooth01(l1, l1 + blend, -s);
      h[k] = Math.min(t + (h[k] - t) * w, -0.004);
    } else {
      if (wet[k] || h[k] <= 0) return;
      const w = smooth01(linOut, linOut + blend, s);
      h[k] = Math.max(t + (h[k] - t) * w, 0.004);
    }
  };
  const reach = linOut + blend;
  for (let k = 0; k < NN; k++) {
    const s = sd[k];
    if (s > reach || body[k] === BODY_SEA || lakeId[k] >= 0) continue;
    reshape(k, s, vtAt[k]);
  }
  if (lakeSD)
    for (let k = 0; k < NN; k++) {
      const s = lakeSD[k];
      if (s > reach || body[k] === BODY_SEA) continue;
      // CRITICAL: never build a shallow lake-shore sill across a river inlet/outlet!
      if (sd[k] < reach * 1.25 || (navMask && navMask[k])) continue;
      if (s < 0 && lakeId[k] < 0) continue;
      reshape(k, s, 1e9);
    }
}

export function buildFreshwaterGeometry(world) {
  const position = [],
    water = [],
    edge = [],
    river = [],
    swamp = [],
    maskAttr = [];
  const n = world.N;
  const hasSwamp = !!world.swamp;
  const hasLake = !!world.lakeId;
  const sample = (x, z) => {
    const ix = Math.min(n - 2, Math.floor(x)),
      iz = Math.min(n - 2, Math.floor(z));
    const u = x - ix,
      v = z - iz,
      k = iz * n + ix;
    const at = (a) =>
      mix(mix(a[k], a[k + 1], u), mix(a[k + n], a[k + n + 1], u), v);
    const depth = -at(world.h);
    let lk = 0;
    if (hasLake) {
      const l00 = world.lakeId[k] >= 0 ? 1 : 0;
      const l10 = world.lakeId[k + 1] >= 0 ? 1 : 0;
      const l01 = world.lakeId[k + n] >= 0 ? 1 : 0;
      const l11 = world.lakeId[k + n + 1] >= 0 ? 1 : 0;
      lk = mix(mix(l00, l10, u), mix(l01, l11, u), v);
    }
    const swVal = hasSwamp ? at(world.swamp) : 0;
    // Open lakes stay purely crisp & crystalline even near low marsh margins
    const sw = clamp(swVal * (1 - lk * 0.88), 0, 1);
    return {
      x: (x + 0.5) * world.cell - world.half,
      z: (z + 0.5) * world.cell - world.half,
      depth,
      fx: at(world.flowX),
      fz: at(world.flowZ),
      sed: at(world.sed),
      mask: at(world.inl),
      sw,
      lk,
    };
  };
  const interpolate = (a, b) => {
    const t = a.depth / (a.depth - b.depth);
    return Object.fromEntries(
      Object.keys(a).map((k) => [k, mix(a[k], b[k], t)]),
    );
  };
  const emit = (p) => {
    // Exact matched smoothstep(0.28, 0.90, p.mask) with ocean freshTakeover so
    // freshwater + sea sum smoothly to 1.0 with zero seam across every estuary mouth!
    const mouthFade = smooth01(0.28, 0.90, p.mask);
    // Feather vertical offset gently from 0.008 inland to 0.001 at the sea mouth
    const yLevel = 0.001 + 0.007 * mouthFade;
    position.push(p.x, yLevel, p.z);
    water.push(p.fx, p.fz, Math.max(0.001, p.depth), p.sed);
    const t = clamp(p.depth / 0.055);
    edge.push(mouthFade * t * t * (3 - 2 * t));
    river.push(clamp((Math.hypot(p.fx, p.fz) - 0.04) / 0.30));
    swamp.push(p.sw, p.lk);
    maskAttr.push(mouthFade);
  };
  for (let z = 0; z < n - 1; z++)
    for (let x = 0; x < n - 1; x++) {
      const k = z * n + x;
      if (
        Math.max(
          world.inl[k],
          world.inl[k + 1],
          world.inl[k + n],
          world.inl[k + n + 1],
        ) < 0.285
      )
        continue;
      if (
        Math.min(
          world.h[k],
          world.h[k + 1],
          world.h[k + n],
          world.h[k + n + 1],
        ) >= 0
      )
        continue;
      for (let sz = 0; sz < 2; sz++)
        for (let sx = 0; sx < 2; sx++) {
          const a = sample(x + sx / 2, z + sz / 2),
            b = sample(x + (sx + 1) / 2, z + sz / 2);
          const c = sample(x + sx / 2, z + (sz + 1) / 2),
            d = sample(x + (sx + 1) / 2, z + (sz + 1) / 2);
          for (const tri of [
            [a, c, b],
            [b, c, d],
          ]) {
            const poly = [];
            for (let i = 0; i < 3; i++) {
              const p = tri[i],
                q = tri[(i + 1) % 3];
              if (p.depth >= 0) poly.push(p);
              if (p.depth >= 0 !== q.depth >= 0) poly.push(interpolate(p, q));
            }
            for (let i = 1; i < poly.length - 1; i++) {
              emit(poly[0]);
              emit(poly[i]);
              emit(poly[i + 1]);
            }
          }
        }
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute("aWater", new Float32BufferAttribute(water, 4));
  geometry.setAttribute("aEdge", new Float32BufferAttribute(edge, 1));
  geometry.setAttribute("aRiver", new Float32BufferAttribute(river, 1));
  geometry.setAttribute("aSwamp", new Float32BufferAttribute(swamp, 2));
  geometry.setAttribute("aMask", new Float32BufferAttribute(maskAttr, 1));
  geometry.computeBoundingSphere();
  return geometry;
}
