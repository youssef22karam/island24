(_ * 59) | 0,
                  F,
                  y,
                  A - 0.25,
                  0.82 + a() * 0.68,
                  0.06,
                  0.25 + a() * 0.04,
                  0.38,
                  0.32 + a() * 0.1,
                )
            : O < 1.35 && I < 0.26 && _ < 0.19 * z
              ? (a() < 0.42
                  ? C(F, y, 0.55 + a() * a() * 1.55)
                  : H(F, y, 2.2 + a() * 3.6, 7 + ((a() * 11) | 0)))
              : O < 1.75 && _ < 0.235 * z && a() < 0.48
                ? W(F, y, A, Z)
                : O < 0.95 && _ < 0.32 * B * z * clump
                  ? b(
                      a() < 0.28 ? "calamites" : "reed",
                      a() * 6,
                      F,
                      y,
                      A - 0.05,
                      0.74 + a() * 0.5,
                      0.07,
                      0.22,
                      0.39,
                      0.37,
                    )
                  : O < 2.2 && _ < 0.42 * z * (0.45 + 0.65 * clump)
                    ? b(
                        "sedge",
                        a() * 6,
                        F,
                        y,
                        A - 0.04,
                        0.68 + a() * 0.45,
                        0.08,
                        0.23,
                        0.32,
                        0.34,
                      )
                    : O > 1.5 && _ < 0.11 * z * ee
                      ? b(
                          "shrub",
                          (_ * 29) | 0,
                          F,
                          y,
                          A - 0.08,
                          0.58 + a() * 0.72,
                          0.12,
                          0.24,
                          0.36,
                          0.36,
                        )
                      : O > 1.2 &&
                        _ < 0.17 * z &&
                        b(
                          "fern",
                          (_ * 31) | 0,
                          F,
                          y,
                          A - 0.04,
                          0.62 + a() * 0.52,
                          0.1,
                          0.26,
                          0.38,
                          0.36,
                        );
          continue;
        }
        if (Y < 0.1) {
          if (_ < (0.032 * ie * ie + 0.0015) * z) {
            C(F, y, 0.8 + a() * a() * 3.4);
            continue;
          }
          if (_ < (0.045 * ie + 0.004) * z && A < 4.5) {
            H(F, y, 1.6 + a() * 2.6, 6 + ((a() * 16) | 0));
            continue;
          }
          let ce = ar(F + i, y + m);
          if (Math.abs(ae - ce) < 6 && _ < 0.15 * z) {
            W(F, y, $e(o, F, y), Z);
            continue;
          }
          Y > 0.025 &&
            ae > ce + 18 &&
            _ < 0.012 * z &&
            P(F, y, A, Z, 0.9 + a() * 0.7);
          continue;
        }
        if (Y < 0.62) {
          let ce = ne(0.45, 0.8, Ae);
          if (_ < (0.03 + 0.07 * ce) * z && ee > 0.15) {
            P(F, y, A, Z, 0.95 + a() * 0.8);
            continue;
          }
          if (_ < 0.2 * z * ee) {
            b(
              "shrub",
              (_ * 29) | 0,
              F,
              y,
              A - 0.08,
              0.5 + a() * 0.7,
              0.12,
              0.2 + a() * 0.04,
              0.34,
              0.36,
            );
            continue;
          }
          if (_ < 0.215 * z && a() < 0.3 + ie) {
            C(F, y, 0.6 + a() * 1.6);
            continue;
          }
          continue;
        }
        if (Y < 0.85 && me < 420 && _ < 0.045 * z) {
          P(F, y, A, Z, 0.9 + a() * 0.8);
          continue;
        }
        let We = o.h[G - 1],
          Ve = o.h[G + 1],
          Se = o.h[G - r],
          oe = o.h[G + r],
          Be = K - (We + Ve + Se + oe) * 0.25;
        if ((K > 55 && Be > 1.35) || (K > 75 && se > 0.58)) {
          _ < 0.04 * z && C(F, y, 0.6 + a() * 1.6, 1);
          continue;
        }
        if (K > 180 + He * 70) {
          let ce = re(1 - (K - 180) / 280, 0.08, 1) * ne(0.72, 0.25, se);
          _ < 0.18 * z * ce
            ? b(
                "pine",
                (_ * 11) | 0,
                F,
                y,
                A - 0.15,
                0.68 + a() * 0.68,
                0.05,
                0.29 + a() * 0.03,
                0.32,
                0.28 + a() * 0.08,
              )
            : _ < 0.23 * z * ce
              ? b(
                  "shrub",
                  (_ * 23) | 0,
                  F,
                  y,
                  A - 0.08,
                  0.5 + a() * 0.6,
                  0.15,
                  0.22,
                  0.26,
                  0.32,
                )
              : _ < 0.26 * z && C(F, y, 0.6 + a() * 1.8, 1);
          continue;
        }
        if ($ > 0.48 && K < 52 && se < 0.22 && Ae < 0.72) {
          _ < 0.028 * z * Ee && A > 1.8
            ? b(
                "broadleaf",
                (_ * 59) | 0,
                F,
                y,
                A - 0.25,
                0.72 + a() * 0.62,
                0.05,
                0.26 + a() * 0.03,
                0.35 + a() * 0.15,
                0.34 + a() * 0.12,
              )
            : _ < 0.075 * z
              ? b(
                  "shrub",
                  (_ * 29) | 0,
                  F,
                  y,
                  A - 0.08,
                  0.55 + a() * 0.75,
                  0.1,
                  0.25,
                  0.36,
                  0.38,
                )
              : _ < 0.13 * z
                ? b(
                    "fern",
                    (_ * 31) | 0,
                    F,
                    y,
                    A - 0.04,
                    0.65 + a() * 0.55,
                    0.1,
                    0.26,
                    0.38,
                    0.38,
                  )
                : _ < 0.138 * z + 0.012 * ie && C(F, y, 0.5 + a() * 1.4, 1);
          continue;
        }
        let ke = (0.48 + 0.32 * He) * z * ne(0.95, 0.2, se) * Ee,
          be = re(ne(38, 155, K) * 0.58 + ne(0.22, 0.52, se) * 0.28, 0, 0.78);
        if (_ < ke && A > 1.2) {
          let ce = 0.68 + Math.pow(a(), 0.85) * 0.78;
          a() < be
            ? b(
                "pine",
                (_ * 37) | 0,
                F,
                y,
                A - 0.18,
                ce * 0.95,
                0.05,
                0.28 + a() * 0.03,
                0.3 + a() * 0.12,
                0.26 + a() * 0.12,
              )
            : b(
                "broadleaf",
                (_ * 59) | 0,
                F,
                y,
                A - 0.25,
                ce,
                0.06,
                0.25 + a() * 0.04,
                0.3 + a() * 0.2,
                0.29 + a() * 0.16,
              );
        } else if (_ < ke + 0.08 * z)
          b(
            "shrub",
            (_ * 29) | 0,
            F,
            y,
            A - 0.08,
            0.6 + a() * 0.9,
            0.12,
            0.24,
            0.32,
            0.34,
          );
        else if (_ < ke + 0.2 * z)
          b(
            "fern",
            (_ * 31) | 0,
            F,
            y,
            A - 0.04,
            0.7 + a() * 0.6,
            0.1,
            0.26,
            0.36,
            0.36,
          );
        else if (_ < ke + 0.22 * z) {
          let ce = 0.12 + 0.05 * a();
          v(
            "log",
            (_ * 7) | 0,
            F,
            y,
            A + 0.02,
            0.7 + a() * 0.6,
            0.8 + a() * 0.3,
            0.7 + a() * 0.6,
            a() * f,
            (a() - 0.5) * 0.12,
            (a() - 0.5) * 0.12,
            ce * 1.3,
            ce,
            ce * 0.75,
          );
        } else _ < ke + 0.24 * z && C(F, y, 0.5 + a() * 1.5, 1);
      }
    }
    (N & 31) === 0 && (yield { label: "Growing the forest", p: N / r });
  }
  let D = Ie(o.seed ^ 1120684009),
    q = 8.5;
  for (let N = -c + 15; N < c - 15; N += q) {
    for (let V = -c + 15; V < c - 15; V += q) {
      let G = V + (D() - 0.5) * q * 0.85,
        U = N + (D() - 0.5) * q * 0.85,
        K = no(o, G, U);
      if (K < 0.2) continue;
      let X = Vt(o, o.swamp, G, U),
        J = Xo(o, G, U),
        se = Xt(o, G, U, 0.7),
        te = se - Vt(o, o.nearLevel, G, U);
      if (
        te < -1.25 ||
        te > 24 ||
        Math.hypot(
          $e(o, G + 3, U) - $e(o, G - 3, U),
          $e(o, G, U + 3) - $e(o, G, U - 3),
        ) /
          6 >
          0.8
      )
        continue;
      let $ = 0.5 + 0.5 * M.fbm(G * 0.012, U * 0.012, 3),
        Z = D();
      let fFlow = Math.hypot(Vt(o, o.flowX, G, U), Vt(o, o.flowZ, G, U));
      if (X > 0.42 && fFlow < 0.24 && te < 2.6) {
        let j = J < 175;
        Z < (0.20 + $ * 0.36) * X
          ? j && D() < 0.6
            ? b(
                "mangrove",
                D() * 6,
                G,
                U,
                se - 0.17,
                0.85 + D() * 0.95,
                0.04,
                0.23 + D() * 0.025,
                0.26,
                0.56,
              )
            : b(
                "treefern",
                D() * 8,
                G,
                U,
                se - 0.15,
                0.82 + D() * 0.95,
                0.04,
                0.23 + D() * 0.03,
                0.34,
                0.52,
              )
          : te > -0.6 && te < 1.4 && Z < 0.56
            ? b(
                "calamites",
                D() * 6,
                G,
                U,
                se - 0.06,
                0.9 + D() * 0.75,
                0.05,
                0.23,
                0.36,
                0.44,
              )
            : te > 0.12 && Z < 0.76
              ? b(
                  "shrub",
                  D() * 6,
                  G,
                  U,
                  se - 0.13,
                  0.9 + D() * 0.75,
                  0.07,
                  0.23,
                  0.3,
                  0.52,
                )
              : te > -0.9 &&
                te < 0.8 &&
                Z < 0.82 &&
                v(
                  "snag",
                  (D() * 8) | 0,
                  G,
                  U,
                  se - 0.2,
                  0.85 + D() * 0.5,
                  0.85 + D() * 0.55,
                  0.85 + D() * 0.5,
                  D() * f,
                  (D() - 0.5) * 0.15,
                  (D() - 0.5) * 0.15,
                  0.82,
                  0.8,
                  0.74,
                );
      } else {
        // Set riparian canopy further back from immediate riverbanks & create scenic open meadows + rocky/pebbly shoreline shelves
        let openBank = te < 2.2 ? 0.38 : te < 4.4 ? 0.62 : 0.78;
        if (te > 2.15 && Z < K * (0.12 + $ * 0.24) * openBank) {
          D() < 0.26
            ? b(
                "treefern",
                D() * 8,
                G,
                U,
                se - 0.2,
                0.76 + D() * 0.72,
                0.035,
                0.23 + D() * 0.025,
                0.32,
                0.5,
              )
            : b(
                "broadleaf",
                D() * 8,
                G,
                U,
                se - 0.24,
                0.74 + D() * 0.82,
                0.035,
                0.23 + D() * 0.025,
                0.25,
                0.57,
              );
        } else if (te > -0.25 && te < 1.35 && Z < K * 0.14) {
          // River-smoothed boulders & flat mossy shore slabs accenting natural banks
          let rs = 0.55 + D() * 1.45,
            [rc, gc, bc] = R(G, U, !0);
          v(
            D() < 0.45 ? "slab" : "rock",
            (D() * 12) | 0,
            G,
            U,
            se - rs * 0.18,
            rs * (1.1 + D() * 0.35),
            rs * (0.46 + D() * 0.36),
            rs * (0.9 + D() * 0.3),
            D() * f,
            (D() - 0.5) * 0.22,
            (D() - 0.5) * 0.22,
            rc,
            gc,
            bc,
          );
        } else if (te > 1.05 && Z < K * 0.34 * (0.45 + 0.65 * $)) {
          b(
            "shrub",
            D() * 6,
            G,
            U,
            se - 0.12,
            0.78 + D() * 0.72,
            0.06,
            0.24,
            0.28,
            0.56,
          );
        }
      }
    }
    (Math.floor((N + c) / q) & 15) === 0 &&
      (yield { label: "Growing the river corridors", p: 1 });
  }
  return { defs: t, out: n };
}
export { wr };
