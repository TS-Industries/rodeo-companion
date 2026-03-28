/// <reference types="@types/google.maps" />
import { useState, useRef, useCallback, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MapPin, Plus, Trash2, RotateCcw, Navigation, Fuel, Clock,
  Route, ChevronDown, ChevronUp, Loader2, GripVertical, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnits } from "@/contexts/UnitContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stop {
  id: string;
  label: string;
  address: string;
  latLng: google.maps.LatLngLiteral | null;
}

interface LegInfo {
  from: string;
  to: string;
  distance: string;
  duration: string;
  distanceMeters: number;
}

interface FuelStation {
  name: string;
  address: string;
  rating?: number;
  isOpen?: boolean;
  placeId: string;
  location: google.maps.LatLngLiteral;
}

// ─── Autocomplete Input ───────────────────────────────────────────────────────
function AddressInput({
  value,
  placeholder,
  onSelect,
  mapReady,
  disabled,
}: {
  value: string;
  placeholder: string;
  onSelect: (address: string, latLng: google.maps.LatLngLiteral) => void;
  mapReady: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  useEffect(() => {
    if (!mapReady || !inputRef.current || autocompleteRef.current) return;
    try {
      const ac = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode", "establishment"],
        fields: ["formatted_address", "geometry", "name"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        const addr = place.formatted_address || place.name || "";
        const latLng = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        setLocalValue(addr);
        onSelect(addr, latLng);
      });
      autocompleteRef.current = ac;
    } catch (e) {
      console.warn("Autocomplete init failed:", e);
    }
  }, [mapReady, onSelect]);

  return (
    <input
      ref={inputRef}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full h-9 px-3 text-sm rounded-lg outline-none transition-all"
      style={{
        background: "oklch(0.20 0.05 48)",
        border: "1px solid oklch(0.32 0.07 55)",
        color: "oklch(0.93 0.03 75)",
      }}
    />
  );
}

// ─── Fuel Station Card ────────────────────────────────────────────────────────
function FuelCard({ station }: { station: FuelStation }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.30 0.06 50)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "oklch(0.72 0.16 75 / 15%)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}
      >
        <Fuel className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.93 0.03 75)" }}>{station.name}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>{station.address}</p>
        <div className="flex items-center gap-2 mt-1">
          {station.rating && (
            <span className="text-xs font-medium" style={{ color: "oklch(0.78 0.18 80)" }}>
              ★ {station.rating.toFixed(1)}
            </span>
          )}
          {station.isOpen !== undefined && (
            <span
              className="text-xs font-semibold"
              style={{ color: station.isOpen ? "oklch(0.65 0.14 145)" : "oklch(0.55 0.22 25)" }}
            >
              {station.isOpen ? "Open" : "Closed"}
            </span>
          )}
        </div>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: "oklch(0.72 0.16 75 / 10%)", color: "oklch(0.72 0.16 75)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Navigation className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Locations() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const fuelMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const [stops, setStops] = useState<Stop[]>([
    { id: "origin", label: "Start", address: "", latLng: null },
    { id: "dest1", label: "Stop 1", address: "", latLng: null },
  ]);
  const [roundTrip, setRoundTrip] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [legs, setLegs] = useState<LegInfo[]>([]);
  const [totalDistance, setTotalDistance] = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [fuelStations, setFuelStations] = useState<FuelStation[]>([]);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [expandedLeg, setExpandedLeg] = useState<number | null>(null);
  const { isCanada, distanceLabel, fuelEconomyLabel, fuelVolumeLabel, currencyLabel, currencySymbol, defaultFuelEconomy, defaultFuelPrice } = useUnits();
  const [fuelPrice, setFuelPrice] = useState(defaultFuelPrice);
  const [fuelEconomy, setFuelEconomy] = useState(defaultFuelEconomy); // MPG or L/100km
  const [routeBuilt, setRouteBuilt] = useState(false);

  // Sync fuel inputs when unit system changes in Settings
  useEffect(() => {
    setFuelPrice(defaultFuelPrice);
    setFuelEconomy(defaultFuelEconomy);
  }, [isCanada, defaultFuelPrice, defaultFuelEconomy]);

  // Clear map markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => { try { m.map = null; } catch {} });
    markersRef.current = [];
    fuelMarkersRef.current.forEach(m => { try { m.map = null; } catch {} });
    fuelMarkersRef.current = [];
  }, []);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
    // Try to center on user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const updateStop = useCallback((id: string, address: string, latLng: google.maps.LatLngLiteral) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, address, latLng } : s));
  }, []);

  const addStop = () => {
    setStops(prev => [
      ...prev,
      { id: `stop-${Date.now()}`, label: `Stop ${prev.length}`, address: "", latLng: null },
    ]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return toast.error("Need at least 2 stops");
    setStops(prev => prev.filter(s => s.id !== id));
  };

  // ── Fetch fuel stations near a LatLng ──
  const fetchFuelStations = useCallback(async (points: google.maps.LatLngLiteral[]) => {
    if (!mapRef.current || points.length === 0) return;
    setLoadingFuel(true);
    setFuelStations([]);
    fuelMarkersRef.current.forEach(m => { try { m.map = null; } catch {} });
    fuelMarkersRef.current = [];

    const allStations: FuelStation[] = [];
    const seen = new Set<string>();

    // Sample points every ~40km along the full route path for thorough coverage
    const totalPoints = points.length;
    const samplePoints: google.maps.LatLngLiteral[] = [];
    if (totalPoints <= 6) {
      samplePoints.push(...points);
    } else {
      // Always include start and end, then sample every ~40 points in between
      const step = Math.max(1, Math.floor(totalPoints / 8));
      for (let i = 0; i < totalPoints; i += step) {
        samplePoints.push(points[i]);
      }
      if (samplePoints[samplePoints.length - 1] !== points[totalPoints - 1]) {
        samplePoints.push(points[totalPoints - 1]);
      }
    }

    // Search radius: ~15km per sample point to ensure overlap between samples
    const searchRadius = 15000;

    for (const pt of samplePoints) {
      try {
        const service = new google.maps.places.PlacesService(mapRef.current);
        await new Promise<void>((resolve) => {
          service.nearbySearch(
            {
              location: pt,
              radius: searchRadius,
              type: "gas_station",
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                for (const r of results.slice(0, 5)) {
                  if (!r.place_id || seen.has(r.place_id)) continue;
                  seen.add(r.place_id);
                  const loc = r.geometry?.location;
                  if (!loc) continue;
                  allStations.push({
                    name: r.name ?? "Gas Station",
                    address: r.vicinity ?? "",
                    rating: r.rating,
                    isOpen: r.opening_hours?.isOpen?.(),
                    placeId: r.place_id,
                    location: { lat: loc.lat(), lng: loc.lng() },
                  });
                }
              }
              resolve();
            }
          );
        });
      } catch {}
    }

    // Sort by rating (best first), deduplicate and limit to 20
    allStations.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    const unique = allStations.slice(0, 20);
    setFuelStations(unique);

    // Add fuel markers
    for (const s of unique) {
      try {
        const pin = document.createElement("div");
        pin.innerHTML = `<div style="background:oklch(0.72 0.16 75);color:oklch(0.14 0.04 45);font-size:10px;font-weight:700;padding:3px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4)">⛽</div>`;
        const m = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current!,
          position: s.location,
          title: s.name,
          content: pin,
        });
        fuelMarkersRef.current.push(m);
      } catch {}
    }

    setLoadingFuel(false);
  }, []);

  // ── Build Route ──
  const buildRoute = useCallback(async () => {
    const validStops = stops.filter(s => s.latLng);
    if (validStops.length < 2) return toast.error("Enter at least 2 locations");

    setCalculating(true);
    setLegs([]);
    setFuelStations([]);
    setRouteBuilt(false);
    clearMarkers();

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    try {
      const service = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
        map: mapRef.current!,
        polylineOptions: {
          strokeColor: "#C8860A",
          strokeWeight: 5,
          strokeOpacity: 0.9,
        },
        suppressMarkers: false,
      });
      directionsRendererRef.current = renderer;

      const origin = validStops[0].latLng!;
      const destination = roundTrip ? origin : validStops[validStops.length - 1].latLng!;
      const waypoints = (roundTrip ? validStops.slice(1) : validStops.slice(1, -1)).map(s => ({
        location: s.latLng!,
        stopover: true,
      }));

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (res, status) => {
            if (status === "OK" && res) resolve(res);
            else reject(new Error(`Directions failed: ${status}`));
          }
        );
      });

      renderer.setDirections(result);

      // Build leg summaries
      const legData: LegInfo[] = result.routes[0].legs.map((leg, i) => ({
        from: validStops[i]?.address || leg.start_address,
        to: roundTrip && i === result.routes[0].legs.length - 1
          ? validStops[0].address
          : validStops[i + 1]?.address || leg.end_address,
        distance: leg.distance?.text ?? "",
        duration: leg.duration?.text ?? "",
        distanceMeters: leg.distance?.value ?? 0,
      }));

      setLegs(legData);

      const totalMeters = legData.reduce((s, l) => s + l.distanceMeters, 0);
      const totalKm = totalMeters / 1000;
      const displayDist = isCanada
        ? `${totalKm.toFixed(0)} km`
        : `${(totalKm * 0.621371).toFixed(0)} mi`;
      setTotalDistance(displayDist);

      const totalSecs = result.routes[0].legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      setTotalDuration(h > 0 ? `${h}h ${m}m` : `${m}m`);

      setRouteBuilt(true);

      // Collect route path points for fuel search
      const path: google.maps.LatLngLiteral[] = [];
      result.routes[0].legs.forEach(leg => {
        leg.steps?.forEach(step => {
          step.path?.forEach(pt => path.push({ lat: pt.lat(), lng: pt.lng() }));
        });
      });
      if (path.length === 0) {
        validStops.forEach(s => { if (s.latLng) path.push(s.latLng); });
      }
      fetchFuelStations(path);

    } catch (err: any) {
      toast.error(err.message ?? "Could not build route");
    } finally {
      setCalculating(false);
    }
  }, [stops, roundTrip, clearMarkers, fetchFuelStations]);

  const clearRoute = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    clearMarkers();
    setLegs([]);
    setFuelStations([]);
    setTotalDistance("");
    setTotalDuration("");
    setRouteBuilt(false);
  };

  // Estimated fuel cost — handle both unit systems
  const totalDistNum = parseFloat(totalDistance) || 0;
  const estimatedFuelCost = (() => {
    if (fuelEconomy <= 0) return "0.00";
    if (isCanada) {
      // L/100km: litres = distance_km * L/100km / 100
      const litres = totalDistNum * fuelEconomy / 100;
      return (litres * fuelPrice).toFixed(2);
    } else {
      // MPG: gallons = miles / MPG
      const gallons = totalDistNum / fuelEconomy;
      return (gallons * fuelPrice).toFixed(2);
    }
  })();

  return (
    <div className="min-h-screen bg-background page-enter flex flex-col">
      {/* ── Flashy Hero Header ── */}
      <div className="hero-western relative px-4 pt-10 pb-5">
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">🗺️</div>
        <div className="absolute top-8 right-14 text-sm opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>✦ Navigation ✦</p>
            <h1 className="text-3xl font-black leading-none mb-1"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
              Trip Planner
            </h1>
            <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>Multi-stop routes &amp; fuel stations</p>
          </div>
          {routeBuilt && (
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs rounded-full mb-1"
              style={{ border: "1px solid oklch(0.55 0.22 25 / 40%)", color: "oklch(0.65 0.20 25)" }}
              onClick={clearRoute}>
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* ── Stop Builder ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.30 0.06 50)" }}
        >
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid oklch(0.30 0.06 50)", background: "oklch(0.16 0.04 46)" }}
          >
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />
              <span className="text-sm font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>Route Stops</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-medium" style={{ color: "oklch(0.62 0.05 65)" }}>Round Trip</span>
              <div
                className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
                style={{ background: roundTrip ? "oklch(0.72 0.16 75)" : "oklch(0.28 0.06 50)" }}
                onClick={() => setRoundTrip(v => !v)}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                  style={{
                    background: "oklch(0.93 0.03 75)",
                    transform: roundTrip ? "translateX(22px)" : "translateX(2px)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            </label>
          </div>

          <div className="p-3 space-y-2">
            {stops.map((stop, i) => (
              <div key={stop.id} className="flex items-center gap-2">
                {/* Stop number badge */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={
                    i === 0
                      ? { background: "oklch(0.65 0.14 145 / 20%)", color: "oklch(0.65 0.14 145)", border: "1px solid oklch(0.65 0.14 145 / 40%)" }
                      : i === stops.length - 1 && !roundTrip
                      ? { background: "oklch(0.55 0.22 25 / 20%)", color: "oklch(0.65 0.20 25)", border: "1px solid oklch(0.55 0.22 25 / 40%)" }
                      : { background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.78 0.18 80)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }
                  }
                >
                  {i === 0 ? "S" : i === stops.length - 1 && !roundTrip ? "E" : i}
                </div>

                <div className="flex-1 min-w-0">
                  <AddressInput
                    value={stop.address}
                    placeholder={
                      i === 0 ? "Starting location…"
                      : i === stops.length - 1 && !roundTrip ? "Final destination…"
                      : `Stop ${i} address…`
                    }
                    onSelect={(addr, latLng) => updateStop(stop.id, addr, latLng)}
                    mapReady={mapReady}
                  />
                </div>

                {/* Remove button (not for first 2) */}
                {stops.length > 2 && i > 0 && (
                  <button
                    onClick={() => removeStop(stop.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-destructive/20"
                    style={{ color: "oklch(0.52 0.05 60)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Round trip indicator */}
            {roundTrip && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                style={{ background: "oklch(0.72 0.16 75 / 10%)", border: "1px dashed oklch(0.72 0.16 75 / 30%)", color: "oklch(0.72 0.16 75)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Returns to starting location
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 gap-1.5 text-xs rounded-lg"
                style={{ border: "1px dashed oklch(0.72 0.16 75 / 30%)", color: "oklch(0.72 0.16 75)" }}
                onClick={addStop}
              >
                <Plus className="w-3.5 h-3.5" /> Add Stop
              </Button>
              <Button
                size="sm"
                className="flex-1 btn-gold gap-1.5 text-xs rounded-lg"
                onClick={buildRoute}
                disabled={calculating || !mapReady}
              >
                {calculating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                {calculating ? "Routing…" : "Build Route"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Map ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid oklch(0.30 0.06 50)", height: "clamp(280px, calc(100vh - 520px), 420px)" }}
        >
          <MapView
            onMapReady={handleMapReady}
            initialCenter={{ lat: 39.8283, lng: -98.5795 }}
            initialZoom={4}
            className="w-full h-full"
          />
        </div>

        {/* ── Trip Summary ── */}
        {routeBuilt && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}
          >
            <div
              className="px-4 py-2.5"
              style={{ background: "linear-gradient(135deg, oklch(0.72 0.16 75 / 15%), oklch(0.55 0.20 25 / 10%))", borderBottom: "1px solid oklch(0.72 0.16 75 / 20%)" }}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" style={{ color: "oklch(0.72 0.16 75)" }} />
                <span className="text-sm font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>Trip Summary</span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { icon: Route, label: "Distance", value: totalDistance },
                  { icon: Clock, label: "Drive Time", value: totalDuration },
                  { icon: Fuel, label: "Est. Fuel", value: `${currencySymbol}${estimatedFuelCost}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl"
                    style={{ background: "oklch(0.22 0.05 48)", border: "1px solid oklch(0.30 0.06 50)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />
                    <span className="text-base font-bold" style={{ color: "oklch(0.93 0.03 75)" }}>{value}</span>
                    <span className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Fuel cost inputs — unit-aware */}
              <div className="rounded-lg p-2 mb-3 text-xs" style={{ background: "oklch(0.20 0.04 48)", border: "1px solid oklch(0.28 0.06 50)", color: "oklch(0.52 0.05 60)" }}>
                {isCanada ? "🍁 Canadian units: km · L/100km · CAD" : "🇺🇸 US units: miles · MPG · USD"}
                <span className="ml-1" style={{ color: "oklch(0.42 0.04 55)" }}>— change in Settings</span>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1" style={{ color: "oklch(0.62 0.05 65)" }}>
                    {isCanada ? `${currencySymbol}/L (fuel price)` : `${currencySymbol}/gal (fuel price)`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={fuelPrice}
                    onChange={e => setFuelPrice(parseFloat(e.target.value) || (isCanada ? 1.65 : 3.5))}
                    className="w-full h-8 px-2 text-sm rounded-lg"
                    style={{ background: "oklch(0.22 0.05 48)", border: "1px solid oklch(0.30 0.06 50)", color: "oklch(0.93 0.03 75)" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1" style={{ color: "oklch(0.62 0.05 65)" }}>
                    {fuelEconomyLabel} (vehicle)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={fuelEconomy}
                    onChange={e => setFuelEconomy(parseFloat(e.target.value) || defaultFuelEconomy)}
                    className="w-full h-8 px-2 text-sm rounded-lg"
                    style={{ background: "oklch(0.22 0.05 48)", border: "1px solid oklch(0.30 0.06 50)", color: "oklch(0.93 0.03 75)" }}
                  />
                </div>
              </div>

              {/* Leg breakdown */}
              {legs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "oklch(0.62 0.05 65)" }}>
                    LEG BREAKDOWN
                  </p>
                  {legs.map((leg, i) => (
                    <div
                      key={i}
                      className="rounded-lg overflow-hidden"
                      style={{ background: "oklch(0.22 0.05 48)", border: "1px solid oklch(0.30 0.06 50)" }}
                    >
                      <button
                        className="w-full flex items-center justify-between p-3 text-left"
                        onClick={() => setExpandedLeg(expandedLeg === i ? null : i)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "oklch(0.72 0.16 75 / 20%)", color: "oklch(0.78 0.18 80)" }}
                          >
                            {i + 1}
                          </div>
                          <span className="text-xs truncate" style={{ color: "oklch(0.72 0.06 65)" }}>
                            Leg {i + 1}: {leg.distance} · {leg.duration}
                          </span>
                        </div>
                        {expandedLeg === i
                          ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.52 0.05 60)" }} />
                          : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.52 0.05 60)" }} />
                        }
                      </button>
                      {expandedLeg === i && (
                        <div className="px-3 pb-3 space-y-1" style={{ borderTop: "1px solid oklch(0.28 0.06 50)" }}>
                          <p className="text-xs pt-2" style={{ color: "oklch(0.52 0.05 60)" }}>
                            <span style={{ color: "oklch(0.65 0.14 145)" }}>From:</span> {leg.from}
                          </p>
                          <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
                            <span style={{ color: "oklch(0.65 0.20 25)" }}>To:</span> {leg.to}
                          </p>
                          <p className="text-xs font-semibold mt-1" style={{ color: "oklch(0.72 0.16 75)" }}>
                            Est. fuel: ${fuelEconomy > 0 ? (() => {
                              const legKm = leg.distanceMeters / 1000;
                              if (isCanada) {
                                return (legKm * fuelEconomy / 100 * fuelPrice).toFixed(2);
                              } else {
                                const legMi = legKm * 0.621371;
                                return (legMi / fuelEconomy * fuelPrice).toFixed(2);
                              }
                            })() : "0.00"}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Fuel Stations ── */}
        {(loadingFuel || fuelStations.length > 0) && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.30 0.06 50)" }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-2"
              style={{ borderBottom: "1px solid oklch(0.30 0.06 50)", background: "oklch(0.16 0.04 46)" }}
            >
              <Fuel className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />
              <span className="text-sm font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>
                Fuel Stations Along Route
              </span>
              {loadingFuel && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" style={{ color: "oklch(0.72 0.16 75)" }} />}
              {!loadingFuel && fuelStations.length > 0 && (
                <span
                  className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.78 0.18 80)" }}
                >
                  {fuelStations.length} found
                </span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {loadingFuel ? (
                <div className="flex items-center justify-center py-6 gap-2" style={{ color: "oklch(0.52 0.05 60)" }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Searching for fuel stations…</span>
                </div>
              ) : (
                fuelStations.map(s => <FuelCard key={s.placeId} station={s} />)
              )}
            </div>
          </div>
        )}

        {/* Bottom padding for nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}
