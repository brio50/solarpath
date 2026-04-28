import { useState } from "react";
import { fmtLocationTime, formatDuration } from "../lib/solar.js";

export default function WindowDots({ win, project, color, tz }) {
  const [hovered, setHovered] = useState(null);
  if (!win) return null;

  const { start, end, durationHours } = win;
  const fmt = (t) => fmtLocationTime(t, tz);
  const durStr = formatDuration(durationHours);

  const Dot = ({ id, az, elev, label, sublabel }) => {
    const { x, y } = project(az, elev);
    const anchor = x < -2 ? "end" : x > 2 ? "start" : "middle";
    const labelX = x < -2 ? x - 6 : x > 2 ? x + 6 : x;
    return (
      <g onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)}>
        <circle cx={x} cy={y} r={10} fill="transparent" style={{ cursor: "default" }} />
        <circle cx={x} cy={y} r={3.5} fill={color} stroke="white" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {hovered === id && (
          <>
            <text x={labelX} y={y - 5} textAnchor={anchor} style={{ fontSize: "7px" }} fill="white">{label}</text>
            {sublabel && <text x={labelX} y={y - 13} textAnchor={anchor} style={{ fontSize: "7px" }} fill="#a1a1aa">{sublabel}</text>}
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
