import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Filter, MapPin, Search, Calendar, ChevronRight, Info } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { subscribeToComplaints } from "../lib/firebaseData";
import { useLang } from "./LanguageContext";
import type { Complaint } from "../types";

// Default coordinates centered on Karnataka / Bangalore area
const KARNATAKA_CENTER: [number, number] = [12.9716, 77.5946];

// Custom map helper component to fly to selected markers or bounds
function MapAutoCenter({ center, bounds }: { center?: [number, number]; bounds?: L.LatLngBoundsBounds }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    } else if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [center, bounds, map]);
  return null;
}

// Generate pin SVG icons dynamically based on severity
function createMarkerIcon(severity: string) {
  const color = 
    severity === "Critical" || severity === "High" ? "#ef4444" : 
    severity === "Medium" ? "#facc15" : "#4ade80";

  return L.divIcon({
    html: `<div style="color: ${color}; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5)); transform: translate(-10px, -20px);">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3" fill="black"></circle>
      </svg>
    </div>`,
    className: "custom-div-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
}

export function CommunityMap() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | undefined>(undefined);

  useEffect(() => subscribeToComplaints(setComplaints), []);

  const filtered = useMemo(() => complaints.filter((item) =>
    item.coords &&
    (status === "All" || item.status === status) &&
    `${item.titleEn} ${item.location} ${item.issueType}`.toLowerCase().includes(search.toLowerCase()),
  ), [complaints, search, status]);

  // Compute map bounding box
  const mapBounds = useMemo(() => {
    if (!filtered.length) return undefined;
    const points = filtered.map((item) => L.latLng(item.coords!.lat, item.coords!.lng));
    return L.latLngBounds(points);
  }, [filtered]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-60px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
          <MapPin className="text-blue-400 w-8 h-8" /> {t("Community Map", "ಸಮುದಾಯ ನಕ್ಷೆ")}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {t("Real-time tracked civic complaint locations reported by citizens.", "ನಾಗರಿಕರಿಂದ ವರದಿಯಾದ ನೈಜ-ಸಮಯದ ನಾಗರಿಕ ದೂರುಗಳ ಸ್ಥಳಗಳು.")}
        </p>
      </div>

      <div className="flex-1 grid lg:grid-cols-4 gap-5 min-h-0">
        {/* Sidebar Filters */}
        <div className="space-y-4 flex flex-col h-full overflow-y-auto pr-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
            <input 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder={t("Search location or issue…", "ಸ್ಥಳ ಅಥವಾ ಸಮಸ್ಯೆ ಹುಡುಕಿ…")} 
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-white text-sm" 
            />
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <h2 className="font-bold flex gap-2 items-center text-sm text-gray-200 mb-3">
              <Filter className="w-4 h-4 text-indigo-400" /> {t("Filter Status", "ಸ್ಥಿತಿ ಫಿಲ್ಟರ್")}
            </h2>
            <div className="flex flex-col gap-1">
              {["All", "Pending", "Verified", "Assigned", "In Progress", "Resolved"].map((item) => (
                <button 
                  key={item} 
                  onClick={() => setStatus(item)} 
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                    status === item 
                      ? "bg-indigo-600 text-white font-medium shadow-md" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t(item, item)}
                </button>
              ))}
            </div>
          </div>

          {/* List of Mapped Items */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>{t("Report List", "ವರದಿಗಳ ಪಟ್ಟಿ")}</span>
              <span className="px-2 py-0.5 bg-slate-800 text-gray-300 rounded-full text-[10px]">
                {filtered.length} {t("Mapped", "ನಕ್ಷೆಯಲ್ಲಿದೆ")}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] lg:max-h-none scrollbar-thin">
              {filtered.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedCoords([item.coords!.lat, item.coords!.lng])}
                  className="p-3 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 rounded-xl cursor-pointer transition-all flex items-start gap-3 group"
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    item.severity === "Critical" || item.severity === "High" ? "bg-red-500/10 text-red-400" :
                    item.severity === "Medium" ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs text-white truncate group-hover:text-indigo-300 transition-colors">
                      {lang === "kn" ? item.titleKn : item.titleEn}
                    </h3>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.location}</p>
                    <div className="flex gap-2 items-center mt-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        item.status === "Resolved" ? "bg-green-500/15 text-green-400" : "bg-blue-500/15 text-blue-400"
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[9px] text-gray-500">{item.issueType}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  {t("No matches found.", "ಯಾವುದೇ ದೂರುಗಳು ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ.")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3 bg-slate-950 border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl min-h-[400px] lg:min-h-0 flex flex-col">
          <MapContainer 
            center={KARNATAKA_CENTER} 
            zoom={12} 
            scrollWheelZoom={true} 
            className="w-full h-full z-0 flex-1"
          >
            {/* Using CartoDB Dark Matter tile layer for premium dark aesthetics */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {filtered.map((item) => (
              <Marker 
                key={item.id} 
                position={[item.coords!.lat, item.coords!.lng]} 
                icon={createMarkerIcon(item.severity)}
              >
                <Popup className="custom-map-popup">
                  <div className="w-56 p-1.5 text-slate-100 flex flex-col gap-2">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt="Issue" 
                        className="w-full h-24 object-cover rounded-lg border border-white/10" 
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-slate-100 leading-snug">
                        {lang === "kn" ? item.titleKn : item.titleEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-700/50 pt-2 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        item.severity === "Critical" || item.severity === "High" ? "bg-red-500/20 text-red-300" : "bg-yellow-500/20 text-yellow-300"
                      }`}>
                        {item.severity}
                      </span>
                      <button
                        onClick={() => navigate(`/app/tracking/${item.id}`)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 transition-colors"
                      >
                        {t("Track", "ಟ್ರ್ಯಾಕ್")} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapAutoCenter center={selectedCoords} bounds={selectedCoords ? undefined : mapBounds?.isValid() ? mapBounds : undefined} />
          </MapContainer>

          {/* Quick Stats Overlay Panel */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-gray-300 font-medium">{t("Live Issues:", "ಲೈವ್ ಸಮಸ್ಯೆಗಳು:")}</span>
            </div>
            <div className="flex gap-3 text-gray-400">
              <span>{complaints.filter(c => c.status === "Pending").length} {t("Pending", "ಬಾಕಿ")}</span>
              <span className="text-slate-700">|</span>
              <span>{complaints.filter(c => c.status === "In Progress").length} {t("In Progress", "ಪ್ರಗತಿಯಲ್ಲಿದೆ")}</span>
              <span className="text-slate-700">|</span>
              <span className="text-green-400">{complaints.filter(c => c.status === "Resolved").length} {t("Resolved", "ಪರಿಹರಿಸಲಾಗಿದೆ")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
