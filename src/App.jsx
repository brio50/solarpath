import { useState, useEffect, useCallback } from "react";
import SunCalc from "suncalc";
import TopView from "./components/TopView.jsx";
import SideView from "./components/SideView.jsx";
import {
  doyToDate,
  hoursOfDaylight,
  solarNoonElevation,
  COLORS,
  SEASONS,
} from "./lib/solar.js";

const SEATTLE = { lat: 47.6762, lon: -122.3321 };

const FACINGS = [
  { deg: 0 }, { deg: 90 }, { deg: 180 }, { deg: 270 },
];

function toDateInput(d) {
  return d.toISOString().slice(0, 10);
}

function parseDateInput(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function parseCoord(s, fallback) {
  const v = parseFloat(s);
  return isNaN(v) ? fallback : v;
}

function nowSunPosition(lat, lon) {
  const now = new Date();
  const { sunrise, sunset } = SunCalc.getTimes(now, lat, lon);
  if (now < sunrise || now > sunset) return null;
  const pos = SunCalc.getPosition(now, lat, lon);
  const elev = pos.altitude * (180 / Math.PI);
  if (elev < 0) return null;
  const az = ((pos.azimuth * (180 / Math.PI)) + 180 + 360) % 360;
  return { az, elev };
}

function Legend({ lat, lon, date }) {
  const year = date.getFullYear();
  const rows = [
    ...SEASONS.map(({ name, doy }) => ({ name, date: doyToDate(doy, year), dashed: false })),
    { name: "today", date, dashed: true },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 20px", marginBottom: 8, fontSize: 12 }}>
      {rows.map(({ name, date: d, dashed }) => {
        const peak = solarNoonElevation(d, lat, lon).toFixed(0);
        const hrs = hoursOfDaylight(d, lat, lon).toFixed(1);
        const label =
          name === "today"
            ? `Today  ${peak}° peak  ${hrs}h daylight`
            : `${name.charAt(0).toUpperCase() + name.slice(1)}  ${peak}° peak  ${hrs}h daylight`;
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={28} height={10}>
              <line
                x1={0} y1={5} x2={28} y2={5}
                stroke={COLORS[name]}
                strokeWidth={2.5}
                strokeDasharray={dashed ? "5,3" : "none"}
              />
            </svg>
            <span style={{ color: "#444" }}>{label}</span>
          </div>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#444" }}>▲ sunrise</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#444" }}>▼ sunset</span>
      </div>
    </div>
  );
}

export default function App() {
  const today = new Date();
  const [lat, setLat] = useState(SEATTLE.lat);
  const [lon, setLon] = useState(SEATTLE.lon);
  const [latInput, setLatInput] = useState(String(SEATTLE.lat));
  const [lonInput, setLonInput] = useState(String(SEATTLE.lon));
  const [selectedDate, setSelectedDate] = useState(today);
  const [nowDot, setNowDot] = useState(null);
  const [facing, setFacing] = useState(180);
  const [activeView, setActiveView] = useState("top");

  const updateNowDot = useCallback(() => {
    const todayStr = toDateInput(new Date());
    const selStr = toDateInput(selectedDate);
    setNowDot(selStr === todayStr ? nowSunPosition(lat, lon) : null);
  }, [lat, lon, selectedDate]);

  useEffect(() => {
    updateNowDot();
    const id = setInterval(updateNowDot, 60000);
    return () => clearInterval(id);
  }, [updateNowDot]);

  function commitLat() {
    const v = parseCoord(latInput, lat);
    const clamped = Math.max(-90, Math.min(90, v));
    setLat(clamped);
    setLatInput(String(clamped));
  }

  function commitLon() {
    const v = parseCoord(lonInput, lon);
    const clamped = Math.max(-180, Math.min(180, v));
    setLon(clamped);
    setLonInput(String(clamped));
  }

  const dateStr = selectedDate.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const latLabel = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}`;
  const lonLabel = `${Math.abs(lon).toFixed(4)}°${lon >= 0 ? "E" : "W"}`;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", padding: "12px", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", fontSize: 16, fontWeight: 600, color: "#333", marginBottom: 10 }}>
        Sun Path · {latLabel} {lonLabel} · {dateStr}
      </h1>

      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 16, flexWrap: "wrap", fontSize: 13 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Lat
          <input
            type="number"
            min={-90} max={90} step={0.0001}
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={commitLat}
            style={{ width: 80, padding: "3px 6px", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Lon
          <input
            type="number"
            min={-180} max={180} step={0.0001}
            value={lonInput}
            onChange={(e) => setLonInput(e.target.value)}
            onBlur={commitLon}
            style={{ width: 80, padding: "3px 6px", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Date
          <input
            type="date"
            value={toDateInput(selectedDate)}
            onChange={(e) => setSelectedDate(parseDateInput(e.target.value))}
            style={{ padding: "3px 6px", border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 12, fontSize: 13 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #ddd" }}>
          {[{ label: "Top view", key: "top" }, { label: "Side view", key: "side" }].map(({ label, key }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              style={{
                padding: "5px 18px",
                fontSize: 13,
                cursor: "pointer",
                border: "none",
                borderBottom: activeView === key ? "2px solid #1D9E75" : "2px solid transparent",
                background: "none",
                color: activeView === key ? "#1D9E75" : "#888",
                fontWeight: activeView === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#555", fontSize: 13 }}>Facing</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <input
              type="range"
              min={0} max={360} step={1}
              value={facing}
              onChange={(e) => {
                let v = Number(e.target.value);
                // snap to cardinal within 8°
                const snap = FACINGS.find(({ deg }) => Math.min(Math.abs(v - deg), 360 - Math.abs(v - deg)) <= 8);
                setFacing(snap ? snap.deg : v % 360);
              }}
              style={{ width: 160, accentColor: "#1D9E75", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", width: 160, fontSize: 11, color: "#888" }}>
              <span>N</span><span>E</span><span>S</span><span>W</span><span>N</span>
            </div>
          </div>
          <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 600, minWidth: 32, textAlign: "left" }}>
            {facing}°
          </span>
        </div>
      </div>

      <Legend lat={lat} lon={lon} date={selectedDate} />

      <div style={{ flex: 1, minHeight: 0 }}>
        {activeView === "top"
          ? <TopView lat={lat} lon={lon} date={selectedDate} nowDot={nowDot} facing={facing} />
          : <SideView lat={lat} lon={lon} date={selectedDate} nowDot={nowDot} facing={facing} />
        }
      </div>
    </div>
  );
}
