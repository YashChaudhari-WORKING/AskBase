"use client";

const N = 5;
const bezier = "cubic-bezier(.25,.8,.25,1)";

const NATIVE_W = 560;
const NATIVE_H = 290;

interface IsoPyramidProps {
  width?: number;
  height?: number;
}

export function IsoPyramid({ width = NATIVE_W, height = NATIVE_H }: IsoPyramidProps) {
  const scale = Math.min(width / NATIVE_W, height / NATIVE_H);

  return (
    <>
      <style>{`
        @keyframes iso-pyr-pop {
          0%   { transform: scale(0); }
          50%  { transform: scale(1); }
          100% { transform: scale(0); }
        }
        @keyframes iso-pyr-hue {
          from { filter: hue-rotate(0deg); }
          to   { filter: hue-rotate(360deg); }
        }
      `}</style>

      <div style={{ width, height, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: NATIVE_W,
          height: NATIVE_H,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}>
          {Array.from({ length: N }, (_, ri) => {
            const rn = ri + 1;
            return (
              <div
                key={ri}
                style={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  position: "absolute",
                  left: 25 * rn,
                  top: 15 * rn,
                }}
              >
                {Array.from({ length: N }, (_, ci) => {
                  const cn = ci + 1;
                  return (
                    <div
                      key={ci}
                      style={{
                        display: "flex",
                        flexDirection: "column-reverse",
                        position: "relative",
                        top: 15 * cn,
                        left: 25 * cn,
                      }}
                    >
                      {Array.from({ length: N }, (_, si) => {
                        const sn = si + 1;
                        const delay = `${0.125 * rn + 0.125 * sn - 0.125 * cn}s`;
                        return (
                          <svg
                            key={si}
                            viewBox="0 0 86.6 100"
                            style={{
                              width: 50,
                              marginTop: -29,
                              animation: `iso-pyr-pop 2.4s ${bezier} ${delay} infinite, iso-pyr-hue 4.8s ${bezier} ${delay} infinite`,
                            }}
                          >
                            {/* Full silhouette fill — teal */}
                            <polygon
                              points="43.3,0 0,75 43.3,100 86.6,75"
                              fill="#55eebb"
                            />
                            {/* Right face — dark overlay */}
                            <polygon
                              points="43.3,0 86.6,75 43.3,100"
                              fill="black"
                              fillOpacity={0.45}
                            />
                            {/* Base rhombus — light overlay (top of base visible) */}
                            <polygon
                              points="0,75 43.3,50 86.6,75 43.3,100"
                              fill="white"
                              fillOpacity={0.22}
                            />
                          </svg>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
