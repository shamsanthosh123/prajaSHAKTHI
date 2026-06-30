import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthContext";
import { verifyComplaintLocation } from "../../lib/firebaseData";
import { VERIFICATION_LABELS } from "../../lib/adminUtils";
import type { Complaint, LocationVerificationStatus } from "../../types";

const markerIcon = L.divIcon({
  html: `<div style="color:#f97316;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5));transform:translate(-12px,-24px)">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#0B0F19"/></svg>
  </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const OPTIONS: LocationVerificationStatus[] = [
  "verified",
  "fake",
  "duplicate",
  "outside_jurisdiction",
];

interface LocationVerificationMapProps {
  complaint: Complaint;
}

export function LocationVerificationMap({ complaint }: LocationVerificationMapProps) {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState(complaint.reverseGeocodedAddress || complaint.location);

  useEffect(() => {
    if (complaint.coords && !complaint.reverseGeocodedAddress) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${complaint.coords.lat}&lon=${complaint.coords.lng}`,
        { headers: { "Accept-Language": "en" } },
      )
        .then((res) => res.json())
        .then((data) => setAddress(data.display_name ?? complaint.location))
        .catch(() => setAddress(complaint.location));
    }
  }, [complaint]);

  const verify = async (status: LocationVerificationStatus) => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await verifyComplaintLocation(complaint.id, status, {
        id: user.uid,
        name: profile.displayName,
      });
      toast.success(`Location marked as ${VERIFICATION_LABELS[status]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setSaving(false);
    }
  };

  if (!complaint.coords) {
    return (
      <div className="bg-card border border-white/10 rounded-2xl p-5 text-sm text-gray-500">
        No coordinates available for this complaint.
      </div>
    );
  }

  const current = complaint.locationVerification ?? "pending";

  return (
    <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-400" />
          Map Verification
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Current: {VERIFICATION_LABELS[current]}
        </p>
      </div>

      <div className="h-56 relative z-0">
        <MapContainer
          center={[complaint.coords.lat, complaint.coords.lng]}
          zoom={16}
          className="w-full h-full"
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[complaint.coords.lat, complaint.coords.lng]} icon={markerIcon} />
        </MapContainer>
      </div>

      <div className="p-4 space-y-3 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/5">
            <span className="text-gray-500">Latitude</span>
            <p className="font-mono mt-1">{complaint.coords.lat.toFixed(6)}</p>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <span className="text-gray-500">Longitude</span>
            <p className="font-mono mt-1">{complaint.coords.lng.toFixed(6)}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300">{address}</p>

        <a
          href={`https://www.openstreetmap.org/?mlat=${complaint.coords.lat}&mlon=${complaint.coords.lng}#map=18/${complaint.coords.lat}/${complaint.coords.lng}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Open in OpenStreetMap <ExternalLink className="w-3 h-3" />
        </a>

        <div className="grid grid-cols-2 gap-2 pt-2">
          {OPTIONS.map((option) => (
            <button
              key={option}
              disabled={saving || current === option}
              onClick={() => verify(option)}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 ${
                current === option
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {VERIFICATION_LABELS[option]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
