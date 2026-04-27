import { useState, useEffect, useCallback, useRef } from "react";
import SunCalc from "suncalc";
import TopView from "./components/TopView.jsx";
import SideView from "./components/SideView.jsx";
import { Input } from "./components/ui/input.jsx";
import { Slider } from "./components/ui/slider.jsx";
import {
  doyToDate,
  hoursOfDaylight,
  solarNoonElevation,
  COLORS,
  SEASONS,
} from "./lib/solar.js";

const SEATTLE = { lat: 47.6762, lon: -122.3321, name: "Seattle, Washington" };

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

function coordLabel(lat, lon) {
  return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? "E" : "W"}`;
}

function Legend({ lat, lon, date }) {
  const year = date.getFullYear();
  const rows = [
    ...SEASONS.map(({ name, doy }) => ({ name, date: doyToDate(doy, year), dashed: false })),
    { name: "today", date, dashed: true },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-1.5 mb-2">
      {rows.map(({ name, date: d, dashed }) => {
        const peak = solarNoonElevation(d, lat, lon).toFixed(0);
        const hrs = hoursOfDaylight(d, lat, lon).toFixed(1);
        const label = name === "today" ? "Today" : name.charAt(0).toUpperCase() + name.slice(1);
        return (
          <div key={name} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-0.5">
            <svg width={18} height={8} style={{ flexShrink: 0 }}>
              <line x1={0} y1={4} x2={18} y2={4} stroke={COLORS[name]} strokeWidth={2} strokeDasharray={dashed ? "4,2.5" : "none"} />
            </svg>
            <span style={{ fontSize: 10 }} className="text-zinc-300 font-medium whitespace-nowrap">{label}</span>
            <span style={{ fontSize: 10 }} className="text-zinc-500 whitespace-nowrap">{peak}° · {hrs}h</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-0.5">
        <span style={{ fontSize: 10 }} className="text-zinc-500">↑ rise · ↓ set</span>
      </div>
      <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-0.5">
        <svg width={10} height={10} style={{ flexShrink: 0 }}>
          <circle cx={5} cy={5} r={3.5} fill="#a1a1aa" stroke="white" strokeWidth={1} />
        </svg>
        <span style={{ fontSize: 10 }} className="text-zinc-500 whitespace-nowrap">hover for sun window</span>
      </div>
    </div>
  );
}

// Crosshair icon for "locate me" button
function CrosshairIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx={12} cy={12} r={4} />
      <line x1={12} y1={2} x2={12} y2={7} />
      <line x1={12} y1={17} x2={12} y2={22} />
      <line x1={2} y1={12} x2={7} y2={12} />
      <line x1={17} y1={12} x2={22} y2={12} />
    </svg>
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

  const [locationName, setLocationName] = useState(SEATTLE.name);
  const [locationQuery, setLocationQuery] = useState(SEATTLE.name);
  const [searchResults, setSearchResults] = useState([]);
  const [showCoords, setShowCoords] = useState(false);
  const searchTimeoutRef = useRef(null);

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

  function handleLocationInput(value) {
    setLocationQuery(value);
    clearTimeout(searchTimeoutRef.current);
    if (value.length < 2) { setSearchResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en", "User-Agent": "SolarPath/1.0" } }
        );
        setSearchResults(await res.json());
      } catch {
        setSearchResults([]);
      }
    }, 400);
  }

  function selectResult(result) {
    const newLat = parseFloat(parseFloat(result.lat).toFixed(4));
    const newLon = parseFloat(parseFloat(result.lon).toFixed(4));
    const parts = result.display_name.split(", ");
    const name = parts.slice(0, 2).join(", ");
    setLat(newLat); setLon(newLon);
    setLatInput(String(newLat)); setLonInput(String(newLon));
    setLocationName(name); setLocationQuery(name);
    setSearchResults([]);
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const newLat = parseFloat(pos.coords.latitude.toFixed(4));
      const newLon = parseFloat(pos.coords.longitude.toFixed(4));
      setLat(newLat); setLon(newLon);
      setLatInput(String(newLat)); setLonInput(String(newLon));
      setLocationName("Current location");
      setLocationQuery("Current location");
      setSearchResults([]);
    });
  }

  function commitLat() {
    const v = parseCoord(latInput, lat);
    const clamped = Math.max(-90, Math.min(90, v));
    setLat(clamped);
    setLatInput(String(clamped));
    setLocationName(coordLabel(clamped, lon));
    setLocationQuery(coordLabel(clamped, lon));
  }

  function commitLon() {
    const v = parseCoord(lonInput, lon);
    const clamped = Math.max(-180, Math.min(180, v));
    setLon(clamped);
    setLonInput(String(clamped));
    setLocationName(coordLabel(lat, clamped));
    setLocationQuery(coordLabel(lat, clamped));
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden text-zinc-100 px-3 pt-2.5 pb-2 box-border">

      {/* Controls card */}
      <div className="flex justify-center mb-2">
        <div
          className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-2.5 flex-wrap justify-center"
          style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}
        >
            <h1 className="text-xs font-semibold tracking-[0.12em] text-zinc-400 uppercase">
              Solar Path
            </h1>
            <div className="w-px h-3.5 bg-zinc-700" />

            {/* Location — search mode */}
            {!showCoords && (
              <div className="relative">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowCoords(true)}
                    title="Switch to coordinate entry"
                    className="flex-shrink-0 text-[9px] uppercase tracking-wide font-medium px-2 h-7 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
                  >
                    lat/lon
                  </button>
                  <Input
                    type="text"
                    placeholder="Search city or place…"
                    value={locationQuery}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    onFocus={(e) => { if (locationQuery === SEATTLE.name || locationQuery === locationName) e.target.select(); }}
                    onBlur={() => setTimeout(() => setSearchResults([]), 150)}
                    onKeyDown={(e) => { if (e.key === "Enter" && searchResults.length > 0) selectResult(searchResults[0]); }}
                    className="w-48 text-zinc-200"
                  />
                  <button
                    onClick={locateMe}
                    title="Use my location"
                    className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors flex-shrink-0"
                  >
                    <CrosshairIcon />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-[260px]">
                    {searchResults.map((r) => {
                      const parts = r.display_name.split(", ");
                      return (
                        <button
                          key={r.place_id}
                          onMouseDown={() => selectResult(r)}
                          className="w-full text-left px-3 py-2 hover:bg-zinc-700 transition-colors border-b border-zinc-700/50 last:border-0"
                        >
                          <div style={{ fontSize: 12 }} className="text-zinc-200 font-medium">{parts[0]}</div>
                          <div style={{ fontSize: 10 }} className="text-zinc-500">{parts.slice(1, 3).join(", ")}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Location — lat/lon mode */}
            {showCoords && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCoords(false)}
                  title="Switch to location search"
                  className="flex-shrink-0 text-[9px] uppercase tracking-wide font-medium px-2 h-7 rounded-md border border-emerald-700 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 transition-colors"
                >
                  search
                </button>
                <label className="flex items-center gap-1 text-xs text-zinc-500">
                  Lat
                  <Input
                    type="number"
                    min={-90} max={90} step={0.0001}
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    onBlur={commitLat}
                    className="w-[80px]"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-500">
                  Lon
                  <Input
                    type="number"
                    min={-180} max={180} step={0.0001}
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    onBlur={commitLon}
                    className="w-[80px]"
                  />
                </label>
              </div>
            )}

            <label className="flex items-center gap-1.5 text-xs text-zinc-500">
              Date
              <Input
                type="date"
                value={toDateInput(selectedDate)}
                onChange={(e) => setSelectedDate(parseDateInput(e.target.value))}
                className="w-auto"
              />
            </label>

            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-zinc-500">Facing</span>
              <div className="flex flex-col items-center gap-0.5">
                <Slider
                  min={0} max={360} step={1}
                  value={[facing]}
                  onValueChange={([v]) => {
                    const snap = FACINGS.find(({ deg }) => Math.min(Math.abs(v - deg), 360 - Math.abs(v - deg)) <= 8);
                    setFacing(snap ? snap.deg : v % 360);
                  }}
                  className="w-32"
                />
                <div className="flex justify-between w-32 text-zinc-600" style={{ fontSize: 9 }}>
                  <span>N</span><span>E</span><span>S</span><span>W</span><span>N</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400 min-w-[32px]">{facing}°</span>
            </div>

        </div>
      </div>

      <Legend lat={lat} lon={lon} date={selectedDate} />

      {/* Diagram containers */}
      <div className="flex-1 min-h-0 flex flex-col gap-1.5">
        <div style={{ flex: 230, minHeight: 0 }} className="border border-zinc-800/70 rounded-xl overflow-hidden bg-zinc-950/60">
          <TopView lat={lat} lon={lon} date={selectedDate} nowDot={nowDot} facing={facing} />
        </div>
        <div style={{ flex: 134, minHeight: 0 }} className="border border-zinc-800/70 rounded-xl overflow-hidden bg-zinc-950/60">
          <SideView lat={lat} lon={lon} date={selectedDate} nowDot={nowDot} facing={facing} />
        </div>
      </div>

    </div>
  );
}
