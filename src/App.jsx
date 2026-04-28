import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SunCalc from "suncalc";
import TopView from "./components/TopView.jsx";
import SideView from "./components/SideView.jsx";
import { Input } from "./components/ui/input.jsx";
import { Slider } from "./components/ui/slider.jsx";
import {
  doyToDate,
  COLORS,
  SEASONS,
  sunWindowTimes,
  fmtLocationTime,
  formatDuration,
  normalizeAzimuth,
  getTimezone,
} from "./lib/solar.js";

const SEATTLE = { lat: 47.6762, lon: -122.3321, name: "Seattle, Washington" };

function parseUrlParams() {
  const p = new URLSearchParams(window.location.search);
  const lat = parseFloat(p.get("lat"));
  const lon = parseFloat(p.get("lon"));
  const dateStr = p.get("date");
  const facing = parseInt(p.get("facing"), 10);
  const rlat = !isNaN(lat) ? Math.max(-90,  Math.min(90,  lat))    : SEATTLE.lat;
  const rlon = !isNaN(lon) ? Math.max(-180, Math.min(180, lon))    : SEATTLE.lon;
  const defaultName = (rlat === SEATTLE.lat && rlon === SEATTLE.lon)
    ? SEATTLE.name
    : coordLabel(rlat, rlon);
  return {
    lat:    rlat,
    lon:    rlon,
    date:   dateStr ? parseDateInput(dateStr) : new Date(),
    facing: !isNaN(facing) && facing >= 0 && facing <= 359 ? facing : 180,
    name:   p.get("name") || defaultName,
  };
}
const URL_PARAMS = parseUrlParams();

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
  const az = normalizeAzimuth(pos.azimuth);
  return { az, elev };
}

function coordLabel(lat, lon) {
  return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? "E" : "W"}`;
}

const SEASON_TOOLTIPS = {
  summer:  "Summer solstice · Jun 21",
  equinox: "Spring equinox · Mar 21",
  winter:  "Winter solstice · Dec 21",
  today:   "Selected date",
};

function Legend({ sunWindows, tz }) {
  const names = [...SEASONS.map(({ name }) => name), "today"];

  const fmt = (t) => fmtLocationTime(t, tz);
  const fmtDur = formatDuration;

  return (
    <div className="flex flex-wrap justify-center gap-1.5 mb-2">
      {names.map((name) => {
        const label = name === "today" ? "Today" : name.charAt(0).toUpperCase() + name.slice(1);
        const dashed = name === "today";
        const win = sunWindows[name];
        return (
          <div key={name} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-0.5">
            <svg width={18} height={8} style={{ flexShrink: 0 }}>
              <line x1={0} y1={4} x2={18} y2={4} stroke={COLORS[name]} strokeWidth={2} strokeDasharray={dashed ? "4,2.5" : "none"} />
            </svg>
            <span style={{ fontSize: 10 }} className="text-zinc-300 font-medium whitespace-nowrap">{label}</span>
            <div className="w-px h-3 bg-zinc-700" />
            <span style={{ fontSize: 10 }} className="text-zinc-500 whitespace-nowrap">
              {win ? `${fmt(win.start.t)} → ${fmt(win.end.t)}` : "—"}
            </span>
            {win && (
              <span style={{ fontSize: 10 }} className="text-zinc-400 font-medium whitespace-nowrap">
                {fmtDur(win.durationHours)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

function LinkIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function App() {
  const [lat, setLat] = useState(URL_PARAMS.lat);
  const [lon, setLon] = useState(URL_PARAMS.lon);
  const tz = useMemo(() => getTimezone(lat, lon), [lat, lon]);
  const [latInput, setLatInput] = useState(String(URL_PARAMS.lat));
  const [lonInput, setLonInput] = useState(String(URL_PARAMS.lon));
  const [selectedDate, setSelectedDate] = useState(URL_PARAMS.date);
  const [nowDot, setNowDot] = useState(null);
  const [facing, setFacing] = useState(URL_PARAMS.facing);
  const [facingDraft, setFacingDraft] = useState(String(URL_PARAMS.facing));
  const [copied, setCopied] = useState(false);

  const sunWindows = useMemo(() => {
    const year = selectedDate.getFullYear();
    const result = {};
    for (const { name, doy } of SEASONS)
      result[name] = sunWindowTimes(doyToDate(doy, year), lat, lon, facing, 360);
    result.today = sunWindowTimes(selectedDate, lat, lon, facing, 360);
    return result;
  }, [lat, lon, selectedDate, facing]);

  const [locationName, setLocationName] = useState(URL_PARAMS.name);
  const [locationQuery, setLocationQuery] = useState(URL_PARAMS.name);
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

  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams({
        lat: lat.toFixed(4),
        lon: lon.toFixed(4),
        date: toDateInput(selectedDate),
        facing: String(facing),
        name: locationName,
      });
      history.replaceState(null, "", "?" + p.toString());
    }, 300);
    return () => clearTimeout(id);
  }, [lat, lon, selectedDate, facing, locationName]);

  const shareUrl = useMemo(() => {
    const p = new URLSearchParams({
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
      date: toDateInput(selectedDate),
      facing: String(facing),
      name: locationName,
    });
    return `${window.location.origin}${window.location.pathname}?${p.toString()}`;
  }, [lat, lon, selectedDate, facing, locationName]);

  function shareLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

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

  function updateCoords(newLat, newLon, name) {
    setLat(newLat); setLon(newLon);
    setLatInput(String(newLat)); setLonInput(String(newLon));
    setLocationName(name); setLocationQuery(name);
  }

  function selectResult(result) {
    const newLat = parseFloat(parseFloat(result.lat).toFixed(4));
    const newLon = parseFloat(parseFloat(result.lon).toFixed(4));
    const parts = result.display_name.split(", ");
    updateCoords(newLat, newLon, parts.slice(0, 2).join(", "));
    setSearchResults([]);
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const newLat = parseFloat(pos.coords.latitude.toFixed(4));
      const newLon = parseFloat(pos.coords.longitude.toFixed(4));
      updateCoords(newLat, newLon, "Current location");
      setSearchResults([]);
    });
  }

  function commitLat() {
    const clamped = Math.max(-90, Math.min(90, parseCoord(latInput, lat)));
    updateCoords(clamped, lon, coordLabel(clamped, lon));
  }

  function commitLon() {
    const clamped = Math.max(-180, Math.min(180, parseCoord(lonInput, lon)));
    updateCoords(lat, clamped, coordLabel(lat, clamped));
  }

  return (
    <div className="min-h-screen flex flex-col text-zinc-100" style={{ background: "linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%)" }}>

      {/* Sticky nav */}
      <div
        className="sticky top-0 z-50 w-full"
        style={{
          background: "linear-gradient(180deg, #1f1f27 0%, #13131a 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
      >
      <div className="relative flex items-center gap-3 px-5 py-2.5 flex-wrap justify-center">
          <h1
            className="text-zinc-200 uppercase"
            style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "15px", fontWeight: 700, letterSpacing: "0.2em" }}
          >
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
                  onFocus={(e) => { if (locationQuery === locationName) e.target.select(); }}
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
                className="flex-shrink-0 text-[9px] uppercase tracking-wide font-medium px-2 h-7 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
              >
                search
              </button>
              <label className="flex items-center gap-1 text-xs text-zinc-500">
                Lat
                <Input type="number" min={-90} max={90} step={0.0001} value={latInput}
                  onChange={(e) => setLatInput(e.target.value)} onBlur={commitLat}
                  onKeyDown={(e) => { if (e.key === "Enter") { commitLat(); e.target.blur(); } }}
                  className="w-[80px]" />
              </label>
              <label className="flex items-center gap-1 text-xs text-zinc-500">
                Lon
                <Input type="number" min={-180} max={180} step={0.0001} value={lonInput}
                  onChange={(e) => setLonInput(e.target.value)} onBlur={commitLon}
                  onKeyDown={(e) => { if (e.key === "Enter") { commitLon(); e.target.blur(); } }}
                  className="w-[80px]" />
              </label>
            </div>
          )}

          <label className="flex items-center gap-1.5 text-xs text-zinc-500">
            Date
            <Input type="date" value={toDateInput(selectedDate)}
              onChange={(e) => setSelectedDate(parseDateInput(e.target.value))} className="w-auto" />
          </label>

          <div className="w-px h-5 bg-zinc-700 mx-0.5" />

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-zinc-500">Facing</span>
            <div className="flex flex-col items-center gap-0.5">
              <Slider min={0} max={359} step={1} value={[facing]}
                onValueChange={([v]) => {
                  const cardinals = [0, 90, 180, 270];
                  const snapped = cardinals.find((c) => Math.abs(v - c) <= 8);
                  const val = snapped ?? v;
                  setFacing(val); setFacingDraft(String(val));
                }}
                className="w-32"
              />
              <div className="flex justify-between w-32 text-zinc-600" style={{ fontSize: 9 }}>
                <span>N</span><span>E</span><span>S</span><span>W</span><span>N</span>
              </div>
            </div>
            <div className="h-7 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center px-2.5 shadow-sm focus-within:ring-1 focus-within:ring-zinc-400 transition-colors">
              <input
                type="text" inputMode="numeric" min={0} max={359}
                value={facingDraft}
                onChange={(e) => {
                  setFacingDraft(e.target.value);
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 0 && v <= 359) setFacing(v);
                }}
                onBlur={() => setFacingDraft(String(facing))}
                className="text-xs font-semibold text-zinc-100 bg-transparent border-none outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ width: `${(facingDraft.length || 1) + 0.2}ch` }}
              />
              <span className="text-xs font-semibold text-white select-none">°</span>
            </div>
          </div>

          <div className="w-px h-5 bg-zinc-700 mx-0.5" />

          <button
            onClick={shareLink}
            title={shareUrl}
            className="flex items-center gap-1.5 text-[9px] uppercase tracking-wide font-medium px-2 h-7 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <LinkIcon />
            {copied ? "Copied!" : "Share"}
          </button>

      </div>

      </div>

      {/* Page content */}
      <div className="relative z-10 px-3 pt-2 pb-4 flex flex-col">

      <div className="text-center pb-1" style={{ fontSize: 10, color: "#52525b" }}>
        Shows when and how long the sun shines directly on a surface at your location. Adjust facing direction to see seasonal exposure windows.
      </div>

      <div className="relative px-3 pb-2">
        <Legend sunWindows={sunWindows} tz={tz} />
      </div>

        {/* Diagram containers */}
        <div className="flex flex-col md:flex-row gap-1.5">
          <div className="relative w-full md:flex-1 aspect-[390/339] border border-zinc-700/70 rounded-xl overflow-hidden bg-zinc-950/30">
            <TopView lat={lat} lon={lon} date={selectedDate} nowDot={nowDot} facing={facing} sunWindows={sunWindows} tz={tz} />
          </div>
          <div className="relative w-full md:flex-1 aspect-[390/182] border border-zinc-700/70 rounded-xl overflow-hidden bg-zinc-950/30">
            <SideView lat={lat} lon={lon} date={selectedDate} nowDot={nowDot} facing={facing} sunWindows={sunWindows} tz={tz} />
          </div>
        </div>
      </div>

      <footer className="mt-auto py-3 text-center" style={{ fontSize: 10, color: "#3f3f46" }}>
        <a href="https://github.com/brio50/solarpath/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">v1.0.1</a>
        {" · "}
        <a href="https://github.com/brio50/solarpath" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">github.com/brio50/solarpath</a>
      </footer>

    </div>
  );
}
