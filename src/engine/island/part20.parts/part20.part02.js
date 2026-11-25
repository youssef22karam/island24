 * 0.065;
        let camY = re(diveState.y + floatBob, Math.min(-0.55, bedHere + 0.62), -0.34);
        ge.set(diveState.x, camY, diveState.z);
        m.lookAt(ge.x + fwdX * 18, ge.y + fwdY * 18, ge.z + fwdZ * 18);
        je = Math.hypot(diveState.vx, diveState.vy, diveState.vz);
        Ke = ((oe * 180) / Math.PI + 90 + 360) % 360;
      } else {
        if (ke && !Fe.drag) {
          let fa = Ue * 0.015,
            da = h.target,
            Vn = ge.x - da.x,
            Gn = ge.z - da.z;
          ((ge.x = da.x + Vn * Math.cos(fa) - Gn * Math.sin(fa)),
            (ge.z = da.z + Vn * Math.sin(fa) + Gn * Math.cos(fa)));
        }
        let qe = h.target,
          Lt = 0.5 + 0.2 * l.hs;
        (qe.y < Lt && (qe.y += (Lt - qe.y) * Math.min(1, Ue * 0.8)),
          h.update());
        let Uo = Ee.waterAt(ge.x, ge.z),
          qo = Math.max(
            Uo.bed + 1.7,
            Uo.level + (Uo.type === 1 ? 0.8 + 0.35 * l.hs : 1.25),
          );
        ge.y < qo && (ge.y = qo);
      }
      let Ne = Ee.islandAt(ge.x, ge.z);
      Ne && Ne !== We && N.mode !== "fly" && ((We = Ne), V(po(Ne)));
    }
    (U.position.set(ge.x, -Math.max(36, 1.3 * l.hs + 20), ge.z), xe(Ue));
    updateSeaGrid(m, l.hs);
    let Et = _e.boatState,
      _o = N.mode === "boat" && A.visible && Ee.isFreshAt(Et.x, Et.z);
    _o
      ? te.track(
          "boat",
          Et.x,
          Et.z,
          Math.cos(Et.heading) * Et.speed,
          Math.sin(Et.heading) * Et.speed,
          2.9,
          L.uTime.value,
        )
      : te.remove("boat");
    let ha = _o ? Et.x : ge.x,
      ma = _o ? Et.z : ge.z,
      wo = Ee.islandAt(ha, ma),
      So = wo?.cellIndex(ha, ma) ?? -1,
      Ds = So >= 0 && !!wo?.world && wo.world.wet[So] === 1,
      Ls = !lt && Ds && Ee.freshAt(ha, ma) > 0.13 && (_o || ge.y < 125);
    te.update(
      Ue,
      L.uTime.value,
      ha,
      ma,
      So >= 0 && wo?.world ? wo.world.flowX[So] : 0,
      So >= 0 && wo?.world ? wo.world.flowZ[So] : 0,
      Ls,
    );
    let isUnder = ge.y < -0.04;
    {
      let Ne = ge.y - Math.max(Ee.heightAt(ge.x, ge.z), 0),
        qe = isUnder ? 0.16 : N.mode === "walk" && ge.y < 0.9 ? 0.18 : re(Ne * 0.015, N.mode === "boat" ? 1.2 : 0.38, 8);
      Math.abs(qe - m.near) > m.near * 0.02 &&
        ((m.near = qe), m.updateProjectionMatrix());
    }
    // Toggle sky/sea meshes cleanly while diving beneath lakes, rivers, and swamps
    G.visible = !isUnder;
    U.visible = !isUnder;
    se.visible = !isUnder;
 for (let fo of Ee.freshwaterObjects()) fo.visible = !isUnder;
 if (isUnder) s.toneMappingExposure = 1.05;
    if (isUnder) Z.forEach((Q) => { Q.visible = !1; });
    else Z.forEach((Q) => { Q.visible = !0; });
    (F &&
      ((F.group.visible = l.vegetation && !isUnder), l.vegetation && !lt && !isUnder && F.update(m)),
      y &&
        ((y.group.visible = l.vegetation && !isUnder), l.vegetation && !lt && !isUnder && y.update(m)),
      kelpSys && !lt && kelpSys.update(m, Ue, isUnder ? 5 : 3));
    let In = 0,
      $a = !isUnder && Ee.freshAt(ge.x, ge.z) > 0.06 && ge.y < 260,
      ja = Ee.islandAt(ge.x, ge.z),
      Pn = ja?.cellIndex(ge.x, ge.z) ?? -1,
      Ka = $a && Pn >= 0 && ja?.world ? ja.world.nearLevel[Pn] : 0;
    if (
      !isUnder &&
      l.reflections &&
      N.mode !== "fly" &&
      (N.mode !== "survey" || ge.y < 190)
    ) {
      let Ne = $a;
      if (!Ne) {
        for (let qe of Ee.islands.values())
          if (
            qe.stage >= 2 &&
            Math.hypot(ge.x - qe.spec.cx, ge.z - qe.spec.cz) - qe.spec.half <
              4500
          ) {
            Ne = !0;
            break;
          }
      }
      Ne &&
        ((J.uReflectionLevel.value = Ka),
        (!Dt || $t % __PF.reflEvery === 0) &&
          ((Dt = B.render(Ka)), ua.copy(ge)),
        (In = Dt ? 1 : 0));
    }
    let wantRefract =
      !isUnder &&
      __PF.q.refr &&
      N.mode !== "fly" &&
      ge.y < Ka + 145 &&
      ($a || (ja?.world && ge.y < 85 && Ee.freshAt(ge.x, ge.z) > 0.01));
    ((J.uReflectionStrength.value = 0.96 - 0.36 * ne(1.2, 4.5, l.hs)),
      (J.uReflectionActive.value = In),
      (J.uRefractionActive.value = 0),
      wantRefract &&
        (__PF.units?.perStage ?? 16) >= 20 &&
        (j.render(), (J.uRefractionActive.value = 1)));
    {
      let Ne = ge.y - Math.max(Ee.heightAt(ge.x, ge.z), 0),
        qe = L.uSun.value.y,
        Lt =
          l.vegetation && !lt && _ < 2 && N.mode !== "fly"
            ? ne(0.035, 0.14, qe) * (1 - ne(110, 180, Ne)) * (1 - 0.6 * g)
            : 0;
      ($t % __PF.q.shEvery === 0 || Lt <= 0.004) &&
        z.update(
          i,
          m,
          L.uSun.value,
          Lt > 0.004 ? Ee.shadowCasters(ge.x, ge.z, __PF.q.shRange) : [],
          Lt,
        );
    }
    if (
      (isUnder && kelpSys ? kelpSys.render(s, i, m) : s.render(i, m),
      c.end(),
      (Tt += Ue),
      Tt > (t ? 0.75 : 0.2))
    ) {
      Tt = 0;
      let Ne = Ee.waterAt(ge.x, ge.z),
        qe = Ee.islandAt(ge.x, ge.z),
        Lt = qe?.cellIndex(ge.x, ge.z) ?? -1,
        Uo = Ne.type === 1 && Lt >= 0 && !!qe?.world && qe.world.inl[Lt] > 0.55;
      V({
        fps: Math.round(qt),
        hour: l.hour,
        speed: je,
        heading: N.mode === 'survey' ? (Math.atan2(m.getWorldDirection(new et.Vector3()).x,-m.getWorldDirection(new et.Vector3()).z)*180/Math.PI+360)%360 : Ke,
        frameMs: Math.round((performance.now() - Te) * 10) / 10,
        gpuMs: c.gpuMs === null ? null : Math.round(c.gpuMs * 10) / 10,
        drawCalls: s.info.render.calls,
        triangles: s.info.render.triangles,
        depth: Math.max(0, Ne.type === 1 ? -Ne.bed : 0),
        water: Ne.type === 1 ? (Uo ? "fresh" : "sea") : "land",
        altitude: ge.y,
        place: Kr(qe, ge.x, ge.z),
        storm: v,
        waveHeight: l.height,
        hs: l.hs,
        windDirection: u.direction,
        windSpeed: u.windSpeed,
        generating: Ee.queue.some((qo) => !qo.done && qo.stage < 2),
      });
    }
  }
  (s.setAnimationLoop(Nn),
    location.search.includes("debug") && (window.__ready = !0));
  let Cs = ls({
      state: N,
      camera: m,
      controls: h,
      boat: A,
      el: be,
      rnd: r,
      push: V,
      flight: Ce,
      movement: _e,
      surfView: Me,
      getField: () => Ee,
      getCurrent: () => We,
      setCurrent: (Q) => {
        We = Q;
      },
      setPending: (Q) => {
        Ve = Q;
      },
      setLook: (Q, Te) => {
        ((oe = Q), (Be = Te));
      },
      snapSurf: () => {
        ((he.snap = !0), le.reset());
      },
    }),
    Bn = hs({
      camera: m,
      controls: h,
      boat: A,
      push: V,
      flight: Ce,
      movement: _e,
      getField: () => Ee,
      setCurrent: (Q) => {
        We = Q;
      },
      setLook: (Q, Te) => {
        ((oe = Q), (Be = Te));
      },
    });
  return {
    get currentIsland() {
      return We;
    },
    get camera() {
      return m;
    },
    regenerate: _t,
    setMode: Ce.setMode,
    setCameraMode(Q) { _e.seaBoat.setCamera(Q); },
    rightBoat() { _e.seaBoat.right(); },
    getBoatState() { return _e.seaBoat.telemetry(); },
    setThrottle(Q) { _e.seaBoat.setThrottle(Q); },
    setMist(Q) { l.fog = re(Q, 0, 1) * 3.5; V({ mist: Q }); },
    capture() { updateSeaGrid(m, l.hs); m.position.y < -0.04 && kelpSys ? kelpSys.render(s, i, m) : s.render(i, m); return s.domElement.toDataURL('image/png'); },
    get renderer() { return s; },
    teleport: Cs,
    setPaused(Q) {
      ((jt = Q), Se.clear());
    },
    setKey(Q, Te) {
      Te ? Se.add(Q) : Se.delete(Q);
    },
    dive(kind = "lake", name) {
      let isl = We ?? Ee.home;
      if (!isl?.world) return null;
      let spot = findUnderwaterSpot(isl.world, kind, name, { x: isl.spec.cx, z: isl.spec.cz });
      if (!spot) return null;
      document.exitPointerLock?.();
      A.visible = !1;
      h.enabled = !1;
      diveState.x = spot.x;
      diveState.y = spot.y;
      diveState.z = spot.z;
      diveState.vx = diveState.vy = diveState.vz = 0;
      diveState.kind = kind;
      diveState.waterBody = spot.name || kind;
      oe = spot.yaw;
      Be = spot.pitch;
      m.position.set(spot.x, spot.y, spot.z);
      m.lookAt(
        spot.x + Math.cos(oe) * Math.cos(Be) * 18,
        spot.y + Math.sin(Be) * 18,
        spot.z + Math.sin(oe) * Math.cos(Be) * 18,
      );
      kelpSys?.warmAll(m, 28);
      V({ mode: "dive", place: `${spot.name} · Underwater`, water: "fresh", depth: spot.bedDepth });
      be.focus({ preventScroll: !0 });
      return spot;
    },
    debugDive(x, y, z, yawDeg = 0, pitchDeg = 6) {
      let isl = Ee.islandAt(x, z) ?? Ee.home;
      if (!isl?.world) return;
      document.exitPointerLock?.();
      A.visible = !1;
      h.enabled = !1;
      let yr = (yawDeg * Math.PI) / 180, pr = (pitchDeg * Math.PI) / 180;
      diveState.x = x; diveState.y = y; diveState.z = z;
      diveState.vx = diveState.vy = diveState.vz = 0;
      oe = yr; Be = pr;
      m.position.set(x, y, z);
      m.lookAt(x + Math.cos(yr) * Math.cos(pr) * 18, y + Math.sin(pr) * 18, z + Math.sin(yr) * Math.cos(pr) * 18);
      kelpSys?.warmAll(m);
      V({ mode: "dive", water: "fresh" });
    },
    stirWater(strength = 1.5) {
      if (!kelpSys) return;
      let d = m.getWorldDirection(new et.Vector3());
      let pt = m.position.clone().addScaledVector(d, 5.5);
      kelpSys.stirAt(pt.x, Math.min(pt.y, -0.5), pt.z, strength);
    },
    get kelpStats() {
      return kelpSys?.stats ?? null;
    },
    // Analog movement (touch stick): x strafes right, y goes forward, both -1..1.
    setMove(Q, Te) {
      inputState.mx = re(+Q || 0, -1, 1);
      inputState.my = re(+Te || 0, -1, 1);
    },
    setRun(Q) {
      inputState.run = !!Q;
    },
    setUnderwaterWalk(Q) {
      inputState.underwater = !!Q;
    },
    // Start walking where the view already is, instead of flying off to a beach.
    walkHere() {
      if (N.loading || lt) return !1;
      let px = m.position.x,
        pz = m.position.z;
      if (N.mode === "boat") ((px = _e.boatState.x), (pz = _e.boatState.z));
      else if (
        N.mode === "survey" &&
        m.position.y - Math.max(Ee.heightAt(px, pz), 0) > 45
      )
        // looking down from high up: land where the view is aimed, not under the lens
        ((px = h.target.x), (pz = h.target.z));
      let isl = Ee.islandAt(px, pz);
      if (!isl?.world) return !1;
      let ci = isl.cellIndex(px, pz);
      if (ci < 0) return !1;
      if (Ee.heightAt(px, pz) < 0 && isl.world.inl[ci] < 0.5) return !1;
      let dir = m.getWorldDirection(new et.Vector3());
      (document.exitPointerLock?.(),
        (A.visible = !1),
        (h.enabled = !1),
        (Ce.fly.done = null),
        (_e.walkState.x = px),
        (_e.walkState.z = pz),
        (_e.walkState.phase = 0),
        (_e.walkState.y = void 0),
        (oe = Math.atan2(dir.z, dir.x)),
        (Be = re(Math.asin(re(dir.y, -1, 1)), -0.5, 0.4)),
        (We = isl),
        V({ mode: "walk", ...po(isl) }),
        be.focus({ preventScroll: !0 }));
      return !0;
    },
    // Slip under the surface right where we are, if there is fresh water deep enough.
    diveHere() {
      if (N.loading || lt || m.position.y > 30) return null;
      let px = m.position.x,
        pz = m.position.z;
      N.mode === "boat" && ((px = _e.boatState.x), (pz = _e.boatState.z));
      let isl = Ee.islandAt(px, pz);
      if (!isl?.world) return null;
      let ci = isl.cellIndex(px, pz);
      if (ci < 0 || isl.world.inl[ci] < 0.9) return null;
      let bed = Ee.heightAt(px, pz);
      if (bed > -1.8) return null;
      let dir = m.getWorldDirection(new et.Vector3());
      (document.exitPointerLock?.(),
        (A.visible = !1),
        (h.enabled = !1),
        (Ce.fly.done = null),
        (diveState.x = px),
        (diveState.z = pz),
        (diveState.y = re(Math.min(m.position.y, -1.1), bed + 0.9, -0.6)),
        (diveState.vx = diveState.vy = diveState.vz = 0),
        (oe = Math.atan2(dir.z, dir.x)),
        (Be = re(Math.asin(re(dir.y, -1, 1)), -0.6, 0.6)),
        (We = isl),
        V({ mode: "dive", water: "fresh", depth: -bed, ...po(isl) }),
        be.focus({ preventScroll: !0 }));
      return { x: px, y: diveState.y, z: pz, bedDepth: -bed, name: N.place || "the water" };
    },
    debugCapture() {
      (F?.update(m, 70), y?.update(m, 70), kelpSys?.warmAll(m));
      let Q = jt;
      return (
        (jt = !1),
        (Dt = !1),
        (Tt = 1),
        Nn(performance.now()),
        (jt = Q),
        {
          ...s.info.render,
          detail: y?.stats,
          kelp: kelpSys?.stats,
          reflections: J.uReflectionActive.value,
          refraction: J.uRefractionActive.value,
        }
      );
    },
    surveyAt(Q, Te) {
      ms({ island: We, field: Ee, boat: A, flight: Ce }, Q, Te);
    },
    debugView: Bn.debugView,
    debugBoat: Bn.debugBoat,
    // Advance walking or the boat by simulated seconds without drawing (control tests).
    debugStep(Q = 1, Te = 1 / 30) {
      let steps = Math.max(1, Math.round(Q / Te));
      for (let i = 0; i < steps; i++)
        ((L.uTime.value += Te),
          N.mode === "walk"
            ? _e.updateWalk(Te)
            : N.mode === "boat" && _e.updateBoat(Te));
      return steps;
    },
    debugSurf(Q = 28, Te = -8, at = 1.7) {
      let Ue = Ee.home;
      if (!Ue?.world) return null;
      let ge = Ue.beachSpot(Ie(7));
      if (!ge) return null;
      let bt = Me(ge.x, ge.z, (Q * Math.PI) / 180);
      return (
        this.debugView("walk", bt.x, bt.z, (bt.yaw * 180) / Math.PI, Te, at),
        (he.snap = !0),
        (he.timer = 0),
        le.reset(),
        { x: bt.x, z: bt.z, yaw: bt.yaw }
      );
    },
    debugWarm(Q) {
      let Te = Math.round(Q * 60);
      for (let at = 0; at < Te; at++) ((L.uTime.value += 1 / 60), xe(1 / 60));
    },
    debugStats() {
      return cs({
        surf: le,
        camera: m,
        onshore: he.valid ? he.dir : null,
        U: L,
        P: l,
      });
    },
    debugWaterState() {
      return {
        rain: L.uRain.value,
        windAmount: L.uWindAmt.value,
        windX: L.uWind.value.x,
        windZ: L.uWind.value.y,
        sky: L.uStorm.value,
        surfActive: L.uSurfOn.value,
      };
    },
    debugSea(Q, Te) {
      ((f = v = re(Q, 0, 1)),
        b(),
        (l.height = k = re(Te, 0.2, 2.5)),
        (T.dirty = !0),
        V({ storm: v, waveHeight: l.height }));
    },
    debugWeather(Q) {
      ((g = M = re(Q, 0, 1)), E(), V({ weather: g }));
    },
    get world() {
      return We?.world ?? null;
    },
    get shaderError() {
      return n;
    },
    getFreshwaterView(Q, Te) {
      return We?.world ? Na(We.world, Q, Te) : null;
    },
    get currentCenter() {
      return We ? { x: We.spec.cx, z: We.spec.cz } : null;
    },
    setHour(Q) {
      ((l.hour = ((Q % 24) + 24) % 24), V({ hour: l.hour }));
    },
    setPlaying(Q) {
      ((l.play = Q), V({ playing: Q }));
    },
    setCloud(Q) {
      ((w = re(Q, 0, 1)), E());
    },
    setWeather(Q) {
      ((M = re(Q, 0, 1)), V({ weather: M }));
    },
    setWindDirection(Q) {
      ((u.direction = re(Q, -180, 180)),
        (T.dirty = !0),
        V({ windDirection: u.direction }));
    },
    setStorm(Q) {
      ((v = M = re(Q, 0, 1)), V({ storm: v, weather: M }));
    },
    setWaveHeight(Q) {
      ((l.height = re(Q, 0.2, 2.5)),
        (T.dirty = !0),
        V({ waveHeight: l.height }));
    },
    setSurf(Q) {
      ((l.shore = re(Q, 0.35, 1.8)), V({ surf: l.shore }));
    },
    setFoam(Q) {
      ((l.foam = re(Q, 0.25, 2)),
        (L.uFoamGain.value = l.foam),
        V({ foam: l.foam }));
    },
    setSpray(Q) {
      ((l.spray = re(Q, 0, 2)),
        (L.uSprayGain.value = l.spray),
        V({ spray: l.spray }));
    },
    setWetness(Q) {
      ((l.wetness = re(Q, 0.2, 3)),
        (L.uWetDry.value = l.wetness),
        V({ wetness: l.wetness }));
    },
    setVegetation(Q) {
      l.vegetation = Q;
    },
    setWakeSource(Q, Te, at, Ue, ge, bt = 1.2) {
      te.track(Q, Te, at, Ue, ge, bt, L.uTime.value);
    },
    removeWakeSource(Q) {
      te.remove(Q);
    },
    setQuality(Q) {
      ((Ae = Q), ot(), Y(), _t(Ee.worldSeed));
    },
    setAutoOrbit(Q) {
      ke = Q;
    },
    getCamera() {
      return { x: m.position.x, y: m.position.y, z: m.position.z };
    },
    dispose() {
      (s.setAnimationLoop(null),
        seaWakeZero.dispose(),
        Fe.dispose(),
        _e.seaBoat.dispose(),
        Mt.disconnect(),
        be.removeEventListener("webglcontextlost", ce),
        be.removeEventListener("click", onDiveTap),
        z.dispose(),
        P.dispose(),
        y?.dispose(),
        kelpSys?.dispose(),
        j.dispose(),
        te.dispose(),
        c.dispose(),
        us({
          scene: i,
          renderer: s,
          controls: h,
          field: Ee,
          fft: C,
          reflectRT: X,
          surf: le,
          water: se,
          sky: G,
          seabed: U,
          rain: Z,
          grass: F,
          boat: A,
          emptyLand: D,
          foamTex: K,
          maps: S,
        }));
    },
  };
}
export { gs };
