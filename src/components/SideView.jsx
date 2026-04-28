import { arcPoints, sideViewCoords, compassLabel, compassName, doyToDate, COLORS, SEASONS } from "../lib/solar.js";
import SunSymbol from "./SunSymbol.jsx";
import WindowDots from "./WindowDots.jsx";

const R = 150;
const SY = 1; // no squish — full elevation range to 90°

// Split arc into continuous segments, cutting only at the ±180° seam (directly behind viewer).
function arcSegments(pts, facing) {
  const segs = [];
  let cur = [];
  let prevD = null;
  for (const p of pts) {
    const d = (((p.az - facing + 180 + 360) % 360) - 180);
    if (prevD !== null && Math.abs(d - prevD) > 180) {
      if (cur.length >= 2) segs.push(cur);
      cur = [];
    }
    cur.push(p);
    prevD = d;
  }
  if (cur.length >= 2) segs.push(cur);
  return segs;
}

function SunArc({ date, lat, lon, color, facing }) {
  const allPts = arcPoints(date, lat, lon);
  const maxT = Math.max(...allPts.map((p) => Math.sin(p.elev * Math.PI / 180)));
  return arcSegments(allPts, facing).flatMap((seg, si) =>
    seg.slice(0, -1).map((p, i) => {
      const { x: x1, y: y1 } = sideViewCoords(p.az, p.elev, R, facing, SY);
      const { x: x2, y: y2 } = sideViewCoords(seg[i + 1].az, seg[i + 1].elev, R, facing, SY);
      const t = Math.sin(p.elev * Math.PI / 180);
      const tNorm = maxT > 0 ? t / maxT : 0;
      return (
        <line key={`${si}-${i}`} x1={x1} y1={-y1} x2={x2} y2={-y2}
          stroke={color} strokeOpacity={0.15 + 0.85 * t} strokeWidth={0.5 + 3.5 * tNorm}
          vectorEffect="non-scaling-stroke" />
      );
    })
  );
}


function ElevationLines() {
  return [30, 60, 90].map((elev) => {
    const y = -(elev / 90) * R;
    return (
      <g key={elev}>
        <line x1={-R} y1={y} x2={R} y2={y} stroke="#555" strokeWidth={0.3} strokeDasharray="3,3" opacity={0.6} vectorEffect="non-scaling-stroke" />
        <text x={-(R + 3)} y={y + 3} textAnchor="end" style={{ fontSize: "7px" }} fill="#71717a">{elev}°</text>
      </g>
    );
  });
}

function Axes({ facing }) {
  return (
    <>
      <line x1={-2 * R} y1={0} x2={2 * R} y2={0} stroke="#555" strokeWidth={0.5} opacity={0.7} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={0} x2={0} y2={-R} stroke="#555" strokeWidth={0.3} opacity={0.5} vectorEffect="non-scaling-stroke" />
      <text x={-(R + 9)} y={4} textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing - 90)}</text>
      <text x={ R + 9}   y={4} textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing + 90)}</text>
      <text x={0}        y={12} textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing)}</text>
    </>
  );
}

// Vertical lines mark the ±90° facing-hemisphere boundary.
function BoundaryLines() {
  return (
    <>
      <line x1={-R} y1={0} x2={-R} y2={-R} stroke="#555" strokeWidth={0.5} opacity={0.5} vectorEffect="non-scaling-stroke" />
      <line x1={ R} y1={0} x2={ R} y2={-R} stroke="#555" strokeWidth={0.5} opacity={0.5} vectorEffect="non-scaling-stroke" />
    </>
  );
}

// Shaded bands for the "behind you" zones beyond ±90°.
function BehindZone() {
  return (
    <>
      <rect x={-2 * R} y={-R} width={R} height={R} fill="#18181b" />
      <rect x={R}      y={-R} width={R} height={R} fill="#18181b" />
    </>
  );
}


export default function SideView({ lat, lon, date, nowDot, facing, sunWindows }) {
  const year = date.getFullYear();
  const viewBox = "-195 -160 390 182";

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 5, left: 8, zIndex: 10, fontSize: 9, color: "#52525b", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", pointerEvents: "none" }}>
        Side View · Facing {compassName(facing)}
      </div>
      <div style={{ position: "absolute", inset: 0 }}>
      <svg viewBox={viewBox} style={{ position: "absolute", width: "100%", height: "100%" }}>
        <BehindZone />
        <BoundaryLines />
        <ElevationLines />
        <Axes facing={facing} />

        {SEASONS.map(({ name, doy }) => {
          const d = doyToDate(doy, year);
          return (
            <g key={name}>
              <SunArc date={d} lat={lat} lon={lon} color={COLORS[name]} facing={facing} />
              <WindowDots win={sunWindows[name]} project={(az, elev) => { const {x, y} = sideViewCoords(az, elev, R, facing, SY); return {x, y: -y}; }} color={COLORS[name]} />
            </g>
          );
        })}

        <g>
          <SunArc date={date} lat={lat} lon={lon} color={COLORS.today} facing={facing} />
          <WindowDots win={sunWindows.today} project={(az, elev) => { const {x, y} = sideViewCoords(az, elev, R, facing, SY); return {x, y: -y}; }} color={COLORS.today} />
        </g>

        {nowDot && (() => {
          const { x, y } = sideViewCoords(nowDot.az, nowDot.elev, R, facing, SY);
          return <SunSymbol cx={x} cy={-y} />;
        })()}

      </svg>
      </div>
    </div>
  );
}
