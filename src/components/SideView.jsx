import { arcPoints, sideViewCoords, compassLabel, doyToDate, SQUISH, COLORS, SEASONS } from "../lib/solar.js";

const R = 80;

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

function toPolyPts(seg, facing) {
  return seg.map((p) => {
    const { x, y } = sideViewCoords(p.az, p.elev, R, facing);
    return `${x},${-y}`;
  }).join(" ");
}

function SunArc({ date, lat, lon, color, dashed, facing }) {
  return arcSegments(arcPoints(date, lat, lon), facing).map((seg, i) => (
    <polyline
      key={i}
      points={toPolyPts(seg, facing)}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "6,4" : "none"}
      vectorEffect="non-scaling-stroke"
    />
  ));
}

function RiseSetMarkers({ date, lat, lon, color, facing }) {
  const segs = arcSegments(arcPoints(date, lat, lon), facing);
  if (segs.length === 0) return null;

  const first = segs[0];
  const last = segs[segs.length - 1];
  const r = sideViewCoords(first[0].az, first[0].elev, R, facing);
  const s = sideViewCoords(last[last.length - 1].az, last[last.length - 1].elev, R, facing);

  return (
    <>
      <text x={r.x} y={-r.y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: "10px" }} fill={color}>▲</text>
      <text x={s.x} y={-s.y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: "10px" }} fill={color}>▼</text>
    </>
  );
}

function ElevationArcs() {
  return [30, 60].map((elev) => {
    const ry = (elev / 90) * R * SQUISH;
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * Math.PI;
      const x = R * Math.cos(Math.PI - t);
      const y = ry * Math.sin(t);
      pts.push(`${x},${-y}`);
    }
    return (
      <g key={elev}>
        <polyline points={pts.join(" ")} fill="none" stroke="#888" strokeWidth={0.3} strokeDasharray="3,3" opacity={0.5} vectorEffect="non-scaling-stroke" />
        <text x={4} y={-(ry + 2)} style={{ fontSize: "7px" }} fill="#888">{elev}°</text>
      </g>
    );
  });
}

function Axes({ facing }) {
  const ry = R * SQUISH;
  return (
    <>
      <line x1={-2 * R} y1={0} x2={2 * R} y2={0} stroke="#888" strokeWidth={0.5} opacity={0.6} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={0} x2={0} y2={-ry} stroke="#888" strokeWidth={0.3} opacity={0.4} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={0} x2={-R * 0.5} y2={-ry * 0.5} stroke="#888" strokeWidth={0.3} strokeDasharray="3,3" opacity={0.4} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={0} x2={ R * 0.5} y2={-ry * 0.5} stroke="#888" strokeWidth={0.3} strokeDasharray="3,3" opacity={0.4} vectorEffect="non-scaling-stroke" />
      <text x={-(R + 9)}     y={4} textAnchor="middle" style={{ fontSize: "9px" }} fill="#555" fontWeight="bold">{compassLabel(facing - 90)}</text>
      <text x={ R + 9}       y={4} textAnchor="middle" style={{ fontSize: "9px" }} fill="#555" fontWeight="bold">{compassLabel(facing + 90)}</text>
      <text x={0}            y={12} textAnchor="middle" style={{ fontSize: "9px" }} fill="#555" fontWeight="bold">{compassLabel(facing)}</text>
      <text x={-(2 * R + 9)} y={4} textAnchor="middle" style={{ fontSize: "8px" }} fill="#aaa">{compassLabel(facing + 180)}</text>
      <text x={ 2 * R + 9}   y={4} textAnchor="middle" style={{ fontSize: "8px" }} fill="#aaa">{compassLabel(facing + 180)}</text>
      <text x={4} y={-(ry + 5)} style={{ fontSize: "7px" }} fill="#777">zenith</text>
    </>
  );
}

// Blue semi-ellipse marks the ±90° visible zone.
function BoundaryArc() {
  const pts = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * Math.PI;
    const x = R * Math.cos(Math.PI - t);
    const y = R * SQUISH * Math.sin(t);
    pts.push(`${x},${-y}`);
  }
  return (
    <>
      <polyline points={pts.join(" ")} fill="none" stroke="steelblue" strokeWidth={1} opacity={0.3} vectorEffect="non-scaling-stroke" />
      <line x1={-R} y1={0} x2={R} y2={0} stroke="steelblue" strokeWidth={1} opacity={0.3} vectorEffect="non-scaling-stroke" />
    </>
  );
}

// Shaded bands for the "behind you" zones beyond ±90°.
function BehindZone() {
  const ry = R * SQUISH;
  return (
    <>
      <rect x={-2 * R} y={-ry} width={R} height={ry} fill="#f0f0f0" />
      <rect x={R}      y={-ry} width={R} height={ry} fill="#f0f0f0" />
    </>
  );
}

export default function SideView({ lat, lon, date, nowDot, facing }) {
  const year = date.getFullYear();
  const ry = R * SQUISH;
  const viewBox = "-195 -175 390 300";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ textAlign: "center", fontSize: 12, color: "#555", padding: "2px 0" }}>
        side view (facing {compassLabel(facing)})
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <svg viewBox={viewBox} style={{ position: "absolute", width: "100%", height: "100%" }}>
        <BehindZone />
        <BoundaryArc />
        <ElevationArcs />
        <Axes facing={facing} />

        {SEASONS.map(({ name, doy }) => {
          const d = doyToDate(doy, year);
          return (
            <g key={name}>
              <SunArc date={d} lat={lat} lon={lon} color={COLORS[name]} dashed={false} facing={facing} />
              <RiseSetMarkers date={d} lat={lat} lon={lon} color={COLORS[name]} facing={facing} />
            </g>
          );
        })}

        <g>
          <SunArc date={date} lat={lat} lon={lon} color={COLORS.today} dashed={true} facing={facing} />
          <RiseSetMarkers date={date} lat={lat} lon={lon} color={COLORS.today} facing={facing} />
        </g>

        {nowDot && (() => {
          const { x, y } = sideViewCoords(nowDot.az, nowDot.elev, R, facing);
          return <circle cx={x} cy={-y} r={5} fill={COLORS.today} stroke="white" strokeWidth={1.5} />;
        })()}

        <circle cx={0} cy={0} r={4} fill="black" />
      </svg>
      </div>
    </div>
  );
}
