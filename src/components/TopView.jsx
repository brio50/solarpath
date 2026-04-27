import { arcPoints, topViewCoords, compassLabel, doyToDate, SQUISH, COLORS, SEASONS } from "../lib/solar.js";
import SunSymbol from "./SunSymbol.jsx";
import WindowDots from "./WindowDots.jsx";

const R = 150;

function GradientArc({ date, lat, lon, facing, color }) {
  const pts = arcPoints(date, lat, lon);
  if (pts.length < 2) return null;
  const ts = pts.map((p) => Math.sin(p.elev * Math.PI / 180));
  const maxT = Math.max(...ts);
  return pts.slice(0, -1).map((p, i) => {
    const { x: x1, y: y1 } = topViewCoords(p.az, p.elev, R, facing);
    const { x: x2, y: y2 } = topViewCoords(pts[i + 1].az, pts[i + 1].elev, R, facing);
    const t = ts[i];
    const tNorm = maxT > 0 ? t / maxT : 0;
    return (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeOpacity={0.15 + 0.85 * t} strokeWidth={0.5 + 3.5 * tNorm}
        vectorEffect="non-scaling-stroke" />
    );
  });
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
      <line x1={0} y1={-ry} x2={0} y2={ry} stroke="#555" strokeWidth={1} opacity={0.25} vectorEffect="non-scaling-stroke" />
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



export default function TopView({ lat, lon, date, nowDot, facing, sunWindows }) {
  const year = date.getFullYear();
  const viewBox = "-195 -115 390 230";

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 5, left: 8, zIndex: 10, fontSize: 9, color: "#52525b", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", pointerEvents: "none" }}>
        Top View · {compassLabel(facing)} at top
      </div>
      <div style={{ position: "absolute", inset: 0 }}>
      <svg viewBox={viewBox} style={{ position: "absolute", width: "100%", height: "100%" }}>
        <ellipse cx={0} cy={0} rx={R} ry={R * SQUISH} fill="none" stroke="#555" strokeWidth={0.5} opacity={0.6} vectorEffect="non-scaling-stroke" />

        <ElevationRings />
        <CardinalLines facing={facing} />

        {SEASONS.map(({ name, doy }) => {
          const d = doyToDate(doy, year);
          return (
            <g key={name}>
              <GradientArc date={d} lat={lat} lon={lon} facing={facing} color={COLORS[name]} />
              <WindowDots win={sunWindows[name]} project={(az, elev) => topViewCoords(az, elev, R, facing)} color={COLORS[name]} />
            </g>
          );
        })}

        <g>
          <GradientArc date={date} lat={lat} lon={lon} facing={facing} color={COLORS.today} />
          <WindowDots win={sunWindows.today} project={(az, elev) => topViewCoords(az, elev, R, facing)} color={COLORS.today} />
        </g>

        {nowDot && (() => {
          const { x, y } = topViewCoords(nowDot.az, nowDot.elev, R, facing);
          return <SunSymbol cx={x} cy={y} />;
        })()}

      </svg>
      </div>
    </div>
  );

}
