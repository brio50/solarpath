import { useState } from "react";
import { arcPoints, sideViewCoords, compassLabel, doyToDate, SQUISH, COLORS, SEASONS } from "../lib/solar.js";

const R = 150;

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
      const { x: x1, y: y1 } = sideViewCoords(p.az, p.elev, R, facing);
      const { x: x2, y: y2 } = sideViewCoords(seg[i + 1].az, seg[i + 1].elev, R, facing);
      const t = Math.sin(p.elev * Math.PI / 180);
      const tNorm = maxT > 0 ? t / maxT : 0;
      return (
        <line key={`${si}-${i}`} x1={x1} y1={-y1} x2={x2} y2={-y2}
          stroke={color} strokeOpacity={0.15 + 0.85 * t} strokeWidth={0.5 + 2.0 * tNorm}
          vectorEffect="non-scaling-stroke" />
      );
    })
  );
}

function SunSymbol({ cx, cy }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line key={i}
            x1={cx + 4.5 * Math.sin(a)} y1={cy - 4.5 * Math.cos(a)}
            x2={cx + 7.5 * Math.sin(a)} y2={cy - 7.5 * Math.cos(a)}
            stroke="#FFBB00" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        );
      })}
      <circle cx={cx} cy={cy} r={3.5} fill="#FFBB00" stroke="white" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function ElevationLines() {
  return [30, 60, 90].map((elev) => {
    const y = -(elev / 90) * R * SQUISH;
    return (
      <g key={elev}>
        <line x1={-R} y1={y} x2={R} y2={y} stroke="#555" strokeWidth={0.3} strokeDasharray="3,3" opacity={0.6} vectorEffect="non-scaling-stroke" />
        <text x={-(R + 3)} y={y + 3} textAnchor="end" style={{ fontSize: "7px" }} fill="#71717a">{elev}°</text>
      </g>
    );
  });
}

function Axes({ facing }) {
  const ry = R * SQUISH;
  return (
    <>
      <line x1={-2 * R} y1={0} x2={2 * R} y2={0} stroke="#555" strokeWidth={0.5} opacity={0.7} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={0} x2={0} y2={-ry} stroke="#555" strokeWidth={0.3} opacity={0.5} vectorEffect="non-scaling-stroke" />
      <text x={-(R + 9)} y={4} textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing - 90)}</text>
      <text x={ R + 9}   y={4} textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing + 90)}</text>
      <text x={0}        y={12} textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing)}</text>
      <text x={-180} y={4} textAnchor="middle" style={{ fontSize: "8px" }} fill="#52525b">{compassLabel(facing + 180)}</text>
      <text x={ 180} y={4} textAnchor="middle" style={{ fontSize: "8px" }} fill="#52525b">{compassLabel(facing + 180)}</text>
    </>
  );
}

// Vertical lines mark the ±90° facing-hemisphere boundary.
function BoundaryLines() {
  const ry = R * SQUISH;
  return (
    <>
      <line x1={-R} y1={0} x2={-R} y2={-ry} stroke="#4a9eff" strokeWidth={1} opacity={0.2} vectorEffect="non-scaling-stroke" />
      <line x1={ R} y1={0} x2={ R} y2={-ry} stroke="#4a9eff" strokeWidth={1} opacity={0.2} vectorEffect="non-scaling-stroke" />
      <line x1={-R} y1={0} x2={ R} y2={0}   stroke="#4a9eff" strokeWidth={1} opacity={0.2} vectorEffect="non-scaling-stroke" />
    </>
  );
}

// Shaded bands for the "behind you" zones beyond ±90°.
function BehindZone() {
  const ry = R * SQUISH;
  return (
    <>
      <rect x={-2 * R} y={-ry} width={R} height={ry} fill="#18181b" />
      <rect x={R}      y={-ry} width={R} height={ry} fill="#18181b" />
    </>
  );
}

function WindowDots({ win, facing, color }) {
  const [hovered, setHovered] = useState(null);
  if (!win) return null;

  const { start, end, durationHours } = win;
  const fmt = (t) => t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const durH = Math.floor(durationHours);
  const durM = Math.round((durationHours - durH) * 60);
  const durStr = durH > 0 ? `${durH}h ${durM}m` : `${durM}m`;

  const Dot = ({ id, az, elev, label, sublabel }) => {
    const { x, y } = sideViewCoords(az, elev, R, facing);
    const cy = -y;
    const anchor = x < 0 ? "end" : x > 0 ? "start" : "middle";
    const labelX = x < 0 ? x - 6 : x > 0 ? x + 6 : x;
    return (
      <g onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)}>
        <circle cx={x} cy={cy} r={10} fill="transparent" style={{ cursor: "default" }} />
        <circle cx={x} cy={cy} r={3.5} fill={color} stroke="white" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {hovered === id && (
          <>
            <text x={labelX} y={cy - 5} textAnchor={anchor} style={{ fontSize: "7px" }} fill="white">{label}</text>
            {sublabel && <text x={labelX} y={cy - 13} textAnchor={anchor} style={{ fontSize: "7px" }} fill="#a1a1aa">{sublabel}</text>}
          </>
        )}
      </g>
    );
  };

  return (
    <>
      <Dot id="start" az={start.az} elev={start.elev} label={fmt(start.t)} sublabel={null} />
      <Dot id="end"   az={end.az}   elev={end.elev}   label={fmt(end.t)}   sublabel={durStr} />
    </>
  );
}

export default function SideView({ lat, lon, date, nowDot, facing, sunWindows }) {
  const year = date.getFullYear();
  const viewBox = "-195 -112 390 134";

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 5, left: 8, zIndex: 10, fontSize: 9, color: "#52525b", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", pointerEvents: "none" }}>
        Side View · Facing {compassLabel(facing)}
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
              <WindowDots win={sunWindows[name]} facing={facing} color={COLORS[name]} />
            </g>
          );
        })}

        <g>
          <SunArc date={date} lat={lat} lon={lon} color={COLORS.today} facing={facing} />
          <WindowDots win={sunWindows.today} facing={facing} color={COLORS.today} />
        </g>

        {nowDot && (() => {
          const { x, y } = sideViewCoords(nowDot.az, nowDot.elev, R, facing);
          return <SunSymbol cx={x} cy={-y} />;
        })()}

        <circle cx={0} cy={0} r={4} fill="#e4e4e7" />
      </svg>
      </div>
    </div>
  );
}
