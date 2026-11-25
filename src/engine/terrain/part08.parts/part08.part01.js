// terrain.worker.js - part 8/9 (statements 83-83 of the original module).
import * as Kt from "three";
import { leanTree } from "../lean.js";
import { At, at, et, jt } from "./part01.js";
import { Yt, be } from "./part05.js";
import { Cn, Pn, Se, Wn, en, nn, ye } from "./part07.js";

function* Bn(o, n, e = Se()) {
  let { N: r, cell: a, half: f } = o,
    t = At(o.seed ^ 1542469173),
    l = {};
  for (let q of Object.keys(e))
    l[q] = e[q].map(() => ({ matrices: [], colors: [] }));
  let [c, p] = Wn(o.seed),
    h = new Kt.Matrix4(),
    i = new Kt.Quaternion(),
    x = new Kt.Euler(),
    M = new Kt.Vector3(),
    g = new Kt.Vector3(),
    w = new Kt.Color(),
    y = Math.PI * 2,
    b = (q, K, V, Y, J, tt, ct, st, nt, pt, ft, dt, j, u) => {
      (x.set(pt, nt, ft),
        i.setFromEuler(x),
        leanTree(o, q, V, Y, i),
        M.set(V, J, Y),
        g.set(tt, ct, st),
        h.compose(M, i, g));
      let d = l[q][Math.abs(K | 0) % l[q].length];
      for (let s = 0; s < 16; s++) d.matrices.push(h.elements[s]);
      d.colors.push(dt, j, u);
    },
    v = (q, K, V, Y, J, tt, ct, st, nt, pt) => {
      (w.setHSL(st, nt, pt),
        b(
          q,
          K,
          V,
          Y,
          J,
          tt,
          tt * (0.85 + t() * 0.3),
          tt,
          t() * y,
          ct * (t() - 0.5),
          ct * (t() - 0.5),
          w.r,
          w.g,
          w.b,
        ));
    },
    A = new jt(o.seed ^ 523124044),
    E = new jt(o.seed ^ 2056368835),
    H = new jt(o.seed ^ 739982445),
    R = (q, K) => et(0.08, 0.5, H.fbm(q * 0.0024 + 7.7, K * 0.0024 - 3.1, 3)),
    D = 0.15 + 0.7 * t(),
    z = (q, K, V = !1) => {
      let Y = (0.5 + 0.5 * H.fbm(q * 0.0017 - 11.3, K * 0.0017 + 5.9, 2)) * D,
        J = t(),
        tt,
        ct,
        st;
      if (J < Y) {
        let nt = 0.13 + 0.07 * t();
        ((tt = nt), (ct = nt * 0.97), (st = nt * 0.93));
      } else if (J < Y + (1 - Y) * 0.25) {
        let nt = 0.42 + 0.12 * t();
        ((tt = nt * 1.04), (ct = nt), (st = nt * 0.88));
      } else {
        let nt = 0.27 + 0.11 * t();
        ((tt = nt * 1.07), (ct = nt), (st = nt * 0.87));
      }
      return (V && ((tt *= 0.8), (ct *= 0.82), (st *= 0.82)), [tt, ct, st]);
    },
    T = (q, K, V, Y) => {
      for (let J = 0; J < Y; J++) {
        let tt = t() * y,
          ct = V * Math.sqrt(t()),
          st = q + Math.cos(tt) * ct,
          nt = K + Math.sin(tt) * ct,
          pt = Yt(o, st, nt, -40);
        if (pt < 0.35) continue;
        let ft = 0.06 + Math.pow(t(), 2.2) * 0.32,
          dt = t(),
          j,
          u,
          d;
        if (dt < 0.12) {
          let s = 0.14 + 0.07 * t();
          ((j = s), (u = s), (d = s * 0.96));
        } else if (dt < 0.47) {
          let s = 0.52 + 0.14 * t();
          ((j = s), (u = s * 0.96), (d = s * 0.88));
        } else {
          let s = 0.32 + 0.14 * t();
          ((j = s * 1.08), (u = s), (d = s * 0.84));
        }
        b(
          "pebble",
          t() * 8,
          st,
          nt,
          pt - ft * 0.06,
          ft,
          ft * (0.55 + t() * 0.5),
          ft * (0.7 + t() * 0.5),
          t() * y,
          (t() - 0.5) * 0.3,
          (t() - 0.5) * 0.3,
          j,
          u,
          d,
        );
      }
    },
    I = (q, K, V, Y = 0.6) => {
      let J = 1 + ((t() * 5.5) | 0),
        [tt, ct, st] = z(q, K);
      for (let nt = 0; nt < J; nt++) {
        let pt = t() * y,
          ft = nt === 0 ? 0 : V * (0.55 + t() * 1.5),
          dt = q + Math.cos(pt) * ft,
          j = K + Math.sin(pt) * ft,
          u = nt === 0 ? V : V * (0.22 + t() * 0.55),
          d = be(o, dt, j, u * 0.45, -40);
        if (d < Y) continue;
        let s = 0.88 + t() * 0.24;
        (b(
          t() < 0.3 ? "slab" : "rock",
          t() * 12,
          dt,
          j,
          d - u * 0.04,
          u * (0.9 + t() * 0.3),
          u * (0.8 + t() * 0.45),
          u * (0.9 + t() * 0.3),
          t() * y,
          (t() - 0.5) * 0.4,
          (t() - 0.5) * 0.4,
          tt * s,
          ct * s,
          st * s,
        ),
          t() < 0.7 && T(dt, j, u * 1.4 + 0.6, 2 + ((t() * 7) | 0)));
      }
    },
    B = (q, K, V, Y) => {
      let J = Y + Math.PI / 2 + (t() - 0.5) * 1.1,
        tt = 0.45 + t() * 0.9,
        ct = 0.5 + 0.12 * t();
      b(
        "driftwood",
        t() * 6,
        q,
        K,
        V - 0.05 * tt,
        tt,
        tt * (0.8 + t() * 0.4),
        tt,
        -J,
        (t() - 0.5) * 0.1,
        (t() - 0.5) * 0.1,
        ct * 1.02,
        ct,
        ct * 0.93,
      );
    },
    W = (q, K, V, Y) => {
      if (t() < 0.4) return;
      let J = q + Math.cos(V) * Y * 0.85,
        tt = K + Math.sin(V) * Y * 0.85,
        ct = 1 + ((t() * 4) | 0);
      for (let st = 0; st < ct; st++) {
        let nt = t() * y,
          pt = 0.3 + t() * 2.4,
          ft = J + Math.cos(nt) * pt,
          dt = tt + Math.sin(nt) * pt,
          j = Yt(o, ft, dt, -40);
        if (j < 0.6) continue;
        let u = t() < 0.25,
          d = 0.85 + t() * 0.35;
        if (u)
          b(
            "coconut",
            t() * 4,
            ft,
            dt,
            j - 0.02,
            d,
            d,
            d,
            t() * y,
            (t() - 0.5) * 0.6,
            (t() - 0.5) * 0.6,
            0.16,
            0.2,
            0.06,
          );
        else {
          let s = 0.13 + 0.06 * t();
          b(
            "coconut",
            t() * 4,
            ft,
            dt,
            j - 0.02,
            d,
            d,
            d,
            t() * y,
            (t() - 0.5) * 0.6,
            (t() - 0.5) * 0.6,
            s * 1.35,
            s,
            s * 0.6,
          );
        }
      }
    },
    G = (q, K, V, Y, J) => {
      let tt = (t() * e.palm.length) | 0,
        ct = e.palm[tt].lean ?? { a: 0, bend: 0 },
        st = Y + (t() - 0.5) * 1.2;
      (w.setHSL(0.23 + t() * 0.03, 0.4, 0.38 + t() * 0.06),
        b(
          "palm",
          tt,
          q,
          K,
          V - 0.18,
          J,
          J * (0.85 + t() * 0.3),
          J,
          ct.a - st,
          0.05 * (t() - 0.5),
          0.05 * (t() - 0.5),
          w.r,
          w.g,
          w.b,
        ),
        W(q, K, st, ct.bend * J));
    },
    O = n >= 1 ? 1 : 2,
    S = n;
  for (let q = 1; q < r - 1; q += O) {
    for (let K = 1; K < r - 1; K += O) {
      let V = q * r + K,
        Y = o.wet[V] ? 1 : o.type[V],
        J = o.h[V],
        tt = o.h[V + 1] - o.h[V - 1],
        ct = o.h[V + r] - o.h[V - r],
        st = Math.hypot(tt, ct) / (2 * a);
      if (Y !== 0 && o.inl[V] > 0.5) {
        let u = (K + 0.5) * a - f + (t() - 0.5) * a * O,
          d = (q + 0.5) * a - f + (t() - 0.5) * a * O,
          s = Yt(o, u, d, J),
          m = o.wet[V] ? o.nearLevel[V] : 0,
          k = m - s,
          F = o.tau[V],
          C = Math.hypot(o.flowX[V], o.flowZ[V]),
          P = o.swamp[V],
          _ = o.cdist[V],
          ot = t(),
          U = 0.5 + 0.5 * E.fbm(u * 0.02 + 3.3, d * 0.02 - 8.1, 2),
          $ = _ < 165;
        let isNav = !!(o.navMask && o.navMask[V]);
        if (!isNav && P > 0.36 && C < 0.24 && k < 1.35 && F < 36 && ot < 0.30 * P * S)
          $ || t() < 0.52
            ? v(
                "mangrove",
                t() * 6,
                u,
                d,
                s - 0.16,
                0.88 + t() * 0.85,
                0.06,
                0.24,
                0.34,
                0.32,
              )
            : v(
                "treefern",
                t() * 8,
                u,
                d,
                s - 0.12,
                0.82 + t() * 0.75,
                0.05,
                0.24 + t() * 0.03,
                0.38,
                0.42,
              );
        else if (
          !isNav &&
          P > 0.24 &&
          k < 0.85 &&
          F < 28 &&
          C < 0.38 &&
          ot < 0.42 * P * S * U
        )
          v(
            "calamites",
            t() * 6,
            u,
            d,
            s - 0.05,
            0.88 + t() * 0.62,
            0.05,
            0.23,
            0.4,
            0.38,
          );
        else if (
          !isNav &&
          k < 0.82 &&
          F < 22 &&
          C < 0.36 &&
          ot < (0.28 + 0.34 * P) * S * U
        )
          v(
            "reed",
            t() * 6,
            u,
            d,
            s - 0.05,
            0.82 + t() * 0.56,
            0.06,
            0.22,
            0.38,
            0.36,
          );
        else if (
          !isNav &&
          C < 0.17 &&
          k > 0.18 &&
          k < 3.2 &&
          F > 2 &&
          F < 92 &&
          ot < (0.38 + 0.34 * P) * S * et(0.38, 0.66, U)
        ) {
          let cl = P > 0.4 ? 2 + ((t() * 2) | 0) : 1 + ((t() * 2) | 0);
          for (let ci = 0; ci < cl; ci++) {
            let lu = u + (ci ? (t() - 0.5) * 4.2 : 0),
              ld = d + (ci ? (t() - 0.5) * 4.2 : 0),
              ls = 0.82 + t() * 0.82;
            b("lily", t() * 6, lu, ld, m, ls, 1, ls, t() * y, 0, 0, 1, 1, 1);
          }
        } else if (!isNav && k < 1.2 && C < 0.26 && ot < (0.28 + 0.14 * P) * S * U)
          v(
            "sedge",
            t() * 6,
            u,
            d,
            s - 0.03,
            0.78 + t() * 0.55,
            0.07,
            0.24,
            0.3,
            0.31,
          );
        else if (!isNav && P > 0.26 && k < 1.9 && ot < 0.072 * S)
          b(
            "snag",
            t() * 8,
            u,
            d,
            s - 0.18,
            0.92 + t() * 0.72,
            0.92 + t() * 0.78,
            0.92 + t() * 0.72,
            t() * y,
            (t() - 0.5) * 0.24,
            (t() - 0.5) * 0.24,
            0.80,
            0.78,
            0.72,
          );
        else if (!isNav && P > 0.26 && k < 1.3 && ot < 0.088 * S) {
          let N = 0.18 + 0.06 * t();
          b(
            "log",
            t() * 6,
            u,
            d,
            m - 0.08,
            0.88 + t() * 0.72,
            0.85 + t() * 0.42,
            0.88 + t() * 0.72,
            t() * y,
            (t() - 0.5) * 0.08,
            (t() - 0.5) * 0.08,
            N * 1.15,
            N * 1.22,
            N * 0.82,
          );
        } else if (!isNav && (C > 0.12 || P < 0.24) && k < 1.95 && F < 28) {
          if (ot < 0.135 * S) {
            let N = 0.68 + t() * 1.55,
              [ut, xt, mt] = z(u, d, !0);
            b(
              t() < 0.40 ? "slab" : "rock",
              t() * 12,
              u,
              d,
              s - 0.14,
              N * (1.05 + t() * 0.35),
              N * (0.48 + t() * 0.38),
              N * (0.9 + t() * 0.3),
              t() * y,
              (t() - 0.5) * 0.24,
              (t() - 0.5) * 0.24,
              ut * 0.90,
              xt * 0.96,
              mt * 0.86,
            );
          } else if (ot < 0.40 * S)
            for (let N = 0; N < 7; N++) {
              let ut = u + (t() - 0.5) * 8.8,
                xt = d + (t() - 0.5) * 8.8,
                mt = Yt(o, ut, xt, s),
                wt = 0.22 + t() * t() * 0.64,
                St = 0.32 + 0.28 * t();
              b(
                "pebble",
                t() * 8,
                ut,
                xt,
                mt - wt * 0.09,
                wt * (0.95 + t() * 0.3),
                wt * 0.48,
                wt * (0.78 + t() * 0.25),
                t() * y,
                0,
                0,
                St * (1.04 + (t() - 0.5) * 0.12),
                St * 0.99,
                St * 0.88,
              );
            }
          else if (k < 0.85 && ot < 0.445 * S) {
            let dr = 0.24 + 0.1 * t();
            b(
              "log",
              t() * 6,
              u,
              d,
              m - 0.06,
              0.78 + t() * 0.68,
              0.72 + t() * 0.32,
              0.78 + t() * 0.68,
              t() * y,
              (t() - 0.5) * 0.07,
              (t() - 0.5) * 0.07,
              dr * 1.15,
              dr * 1.06,
              dr * 0.86,
            );
          }
        }
        continue;
      }
      if (Y !== 0) {
        if (J > -1.9 && J < -0.12) {
          let u = (K + 0.5) * a - f + (t() - 0.5) * a * O,
            d = (q + 0.5) * a - f + (t() - 0.5) * a * O,
            s = R(u, d);
          if (t() < 0.05 * S * s * s) {
            let m = be(o, u, d, 0.8, J),
              k = 1 + ((t() * 3) | 0);
            for (let F = 0; F < k; F++) {
              let C = t() * y,
                P = F ? 1.5 + t() * 3 : 0,
                _ = u + Math.cos(C) * P,
                ot = d + Math.sin(C) * P,
                U = Math.min(be(o, _, ot, 0.6, m), -0.05),
                $ = (-U + 0.25 + t() * 0.8) * (F ? 0.7 : 1),
                N = $ * (1.25 + t() * 0.6),
                [ut, xt, mt] = z(_, ot, !0);
              b(
                t() < 0.35 ? "slab" : "rock",
                t() * 12,
                _,
                ot,
                U - 0.08,
                N,
                $ * 1.4,
                N * (0.8 + t() * 0.4),
                t() * y,
                (t() - 0.5) * 0.3,
                (t() - 0.5) * 0.3,
                ut,
                xt,
                mt,
              );
            }
          }
        }
        continue;
      }
      let nt = o.fresh[V];
      if (J - o.nearLevel[V] <= (nt > 0.3 ? 0.06 : 0.5)) continue;
      let pt = o.cdist[V],
        ft = o.plain[V],
        dt = Math.atan2(-o.dirZ[V], -o.dirX[V]),
        j = 1 + ((t() * 2.99) | 0);
      for (let u = 0; u < j; u++) {
        let d = (K + 0.5) * a - f + (t() - 0.5) * a * O * 1.8,
          s = (q + 0.5) * a - f + (t() - 0.5) * a * O * 1.8,
          m = be(o, d, s, 0.55, J),
          k = nn(o, d, s),
          F = ye(o, o.swamp, d, s),
          C = m - ye(o, o.nearLevel, d, s);
        if (C <= (k > 0.3 ? 0.06 : 0.5)) continue;
        let P = t(),
          _ = en(o, d, s),
          ot = Cn(d + c, s + p, m, _, st, k),
          U = ot[0],
          $ = ot[1],
          N = R(d, s),
          ut = 0.5 + 0.5 * A.fbm(d * 0.00105, s * 98e-5, 3),
          xt = 0.5 + 0.5 * E.fbm(d * 0.0062 + 11.3, s * 0.0057 - 4.1, 3),
          mt = A.fbm(d * 0.014 + 51.2, s * 0.013 - 27.6, 2),
          wt = at(ut * 0.72 + xt * 0.42 - 0.06, 0, 1),
          St = at(xt * 0.7 + ut * 0.5, 0, 1),
          Vt = et(-0.25, 0.05, mt) * 0.5 + 0.5;
        if (st > 1.05) {
          P < 0.05 * S && I(d, s, 0.9 + t() * 2.6);
          continue;
        }
        if (st > 0.55 && P < 0.02 * S * (0.4 + N)) {
          I(d, s, 0.8 + t() * 2.2);
          continue;
        }
        let rivSpd = Math.hypot(o.flowX[V], o.flowZ[V]);
        if (F > 0.38 && rivSpd < 0.26 && C < 3.8 && st < 0.34) {
          let Q = pt < 185;
          if (P < 0.17 * F * S)
            Q || t() < 0.28
              ? v(
                  "mangrove",
                  t() * 6,
                  d,
                  s,
                  m - 0.2,
                  0.8 + t() * 0.75,
                  0.05,
                  0.25,
                  0.36,
                  0.34,
                )
              : v(
                  "treefern",
                  t() * 8,
                  d,
                  s,
                  m - 0.18,
                  0.78 + t() * 0.72,
                  0.04,
                  0.24 + t() * 0.03,
                  0.38,
                  0.42,
                );
          else if (C < 1.8 && P < 0.36 * S)
            v(
              "calamites",
              t() * 6,
              d,
              s,
              m - 0.06,
              0.8 + t() * 0.65,
              0.05,
              0.23 + t() * 0.03,
              0.38,
              0.38,
            );
          else if (C < 1.5 && P < 0.5 * S)
            v(
              "reed",
              t() * 6,
              d,
              s,
              m - 0.05,
              0.8 + t() * 0.55,
              0.07,
              0.21 + t() * 0.04,
              0.36,
              0.36,
            );
          else if (C < 2.1 && P < 0.62 * S)
            v(
              "sedge",
              t() * 6,
              d,
              s,
              m - 0.04,
              0.8 + t() * 0.5,
              0.08,
              0.22,
              0.3,
              0.34,
            );
          else if (P < 0.72 * S)
            v(
              "fern",
              (P * 31) | 0,
              d,
              s,
              m - 0.04,
              0.7 + t() * 0.6,
              0.09,
              0.26,
              0.4,
              0.36,
            );
          else if (P < 0.755 * S)
            b(
              "snag",
              t() * 8,
              d,
              s,
              m - 0.25,
              0.75 + t() * 0.55,
              0.75 + t() * 0.6,
              0.75 + t() * 0.55,
              t() * y,
              (t() - 0.5) * 0.18,
              (t() - 0.5) * 0.18,
              0.84,
              0.82,
              0.76,
            );
          else if (P < 0.785 * S && C < 1.6) {
            let gt = 0.16 + 0.06 * t();
            b(
              "log",
              t() * 6,
              d,
              s,
              m - 0.02,
              0.8 + t() * 0.6,
              0.85 + t() * 0.35,
              0.8 + t() * 0.6,
              t() * y,
              (t() - 0.5) * 0.14,
              (t() - 0.5) * 0.14,
              gt * 1.2,
              gt * 1.18,
              gt * 0.82,
            );
          }
          continue;
        }
        if (k > 0.42 && U > 0.25 && C < 9.5 && st < 0.48) {
          let clump = et(0.32, 0.72, xt);
          C > 2.35 && P < 0.046 * S * (0.5 + 0.85 * clump)
            ? t() < 0.3
              ? v(
                  "treefern",
                 