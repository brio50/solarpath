import { arcPoints, topViewCoords, compassLabel, doyToDate, SQUISH, COLORS, SEASONS } from "../lib/solar.js";

const R = 150;

function arcToPolyline(date, lat, lon, facing) {
  return arcPoints(date, lat, lon)
    .map((p) => {
      const { x, y } = topViewCoords(p.az, p.elev, R, facing);
      return `${x},${y}`;
    })
    .join(" ");
}

function RiseSetMarkers({ date, lat, lon, color, facing }) {
  const pts = arcPoints(date, lat, lon);
  if (pts.length < 2) return null;

  const r = topViewCoords(pts[0].az, pts[0].elev, R, facing);
  const s = topViewCoords(pts[pts.length - 1].az, pts[pts.length - 1].elev, R, facing);

  return (
    <>
      <text x={r.x} y={r.y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: "10px" }} fill={color}>↑</text>
      <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: "10px" }} fill={color}>↓</text>
    </>
  );
}

function ElevationRings() {
  return [30, 60].map((elev) => {
    const r = R * (90 - elev) / 90;
    return (
      <ellipse
        key={elev}
        cx={0} cy={0}
        rx={r} ry={r * SQUISH}
        fill="none"
        stroke="#555"
        strokeWidth={0.3}
        strokeDasharray="3,3"
        opacity={0.6}
        vectorEffect="non-scaling-stroke"
      />
    );
  });
}

function CardinalLines({ facing }) {
  const ry = R * SQUISH;
  return (
    <>
      <line x1={0} y1={-ry} x2={0} y2={ry} stroke="#555" strokeWidth={0.5} opacity={0.5} vectorEffect="non-scaling-stroke" />
      <line x1={-R} y1={0} x2={R} y2={0} stroke="#555" strokeWidth={0.5} opacity={0.5} vectorEffect="non-scaling-stroke" />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <line key={i} x1={0} y1={0} x2={sx * R * 0.707} y2={sy * ry * 0.707}
          stroke="#555" strokeWidth={0.3} strokeDasharray="3,3" opacity={0.5} vectorEffect="non-scaling-stroke" />
      ))}
      <text x={0}         y={-(ry + 7)}         textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing)}</text>
      <text x={0}         y={ry + 12}            textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing + 180)}</text>
      <text x={-(R + 9)}  y={4}                  textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing - 90)}</text>
      <text x={R + 9}     y={4}                  textAnchor="middle" style={{ fontSize: "9px" }} fill="#a1a1aa" fontWeight="bold">{compassLabel(facing + 90)}</text>
      <text x={-R * 0.72} y={-(ry * 0.72 - 3)}  textAnchor="middle" style={{ fontSize: "7px" }} fill="#71717a">{compassLabel(facing - 45)}</text>
      <text x={ R * 0.72} y={-(ry * 0.72 - 3)}  textAnchor="middle" style={{ fontSize: "7px" }} fill="#71717a">{compassLabel(facing + 45)}</text>
      <text x={-R * 0.72} y={ry * 0.72 + 6}     textAnchor="middle" style={{ fontSize: "7px" }} fill="#71717a">{compassLabel(facing - 135)}</text>
      <text x={ R * 0.72} y={ry * 0.72 + 6}     textAnchor="middle" style={{ fontSize: "7px" }} fill="#71717a">{compassLabel(facing + 135)}</text>
    </>
  );
}

export default function TopView({ lat, lon, date, nowDot, facing }) {
  const year = date.getFullYear();
  const viewBox = "-195 -115 390 230";

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 5, left: 8, zIndex: 10, fontSize: 9, color: "#52525b", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", pointerEvents: "none" }}>
        Top View · {compassLabel(facing)} at top
      </div>
      <div style={{ position: "absolute", inset: 0 }}>
      <svg viewBox={viewBox} style={{ position: "absolute", width: "100%", height: "100%" }}>
        <ellipse cx={0} cy={0} rx={R} ry={R * SQUISH} fill="none" stroke="#4a9eff" strokeWidth={1} opacity={0.2} vectorEffect="non-scaling-stroke" />

        <ElevationRings />
        <CardinalLines facing={facing} />

        {SEASONS.map(({ name, doy }) => {
          const d = doyToDate(doy, year);
          return (
            <g key={name}>
              <polyline points={arcToPolyline(d, lat, lon, facing)} fill="none" stroke={COLORS[name]} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              <RiseSetMarkers date={d} lat={lat} lon={lon} color={COLORS[name]} facing={facing} />
            </g>
          );
        })}

        <g>
          <polyline
            points={arcToPolyline(date, lat, lon, facing)}
            fill="none"
            stroke={COLORS.today}
            strokeWidth={1.5}
            strokeDasharray="6,4"
            vectorEffect="non-scaling-stroke"
          />
          <RiseSetMarkers date={date} lat={lat} lon={lon} color={COLORS.today} facing={facing} />
        </g>

        {nowDot && (() => {
          const { x, y } = topViewCoords(nowDot.az, nowDot.elev, R, facing);
          return <circle cx={x} cy={y} r={5} fill={COLORS.today} stroke="white" strokeWidth={1.5} />;
        })()}

        <circle cx={0} cy={0} r={4} fill="#e4e4e7" />
      </svg>
      </div>
    </div>
  );

}
