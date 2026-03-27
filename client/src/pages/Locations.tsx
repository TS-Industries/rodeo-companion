import { useState, useEffect, useRef, useCallback } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapView } from "@/components/Map";
import { toast } from "sonner";
import {
  MapPin, Navigation, Fuel, Search, X, ChevronDown, ChevronUp,
  Clock, Route, DollarSign, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FuelStation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  rating?: number;
  isOpen?: boolean;
}

interface RouteInfo {
  distance: string;
  duration: string;
  distanceMiles: number;
}

function FuelStationCard({ station, onNavigate }: { station: FuelStation; onNavigate: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-3">
      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
        <Fuel className="w-4 h-4 text-orange-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{station.name}</p>
        <p className="text-xs text-muted-foreground truncate">{station.address}</p>
        <div className="flex items-center gap-2 mt-1">
          {station.rating && (
            <span className="text-xs text-yellow-600">★ {station.rating.toFixed(1)}</span>
          )}
          {station.isOpen !== undefined && (
            <span className={cn("text-xs font-medium", station.isOpen ? "text-green-600" : "text-red-500")}>
              {station.isOpen ? "Open" : "Closed"}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onNavigate}
        className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
      >
        <Navigation className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Locations() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const prefilledAddress = params.get("address") ?? "";
  const prefilledName = params.get("name") ?? "";

  const [destination, setDestination] = useState(prefilledAddress);
  const [destinationName, setDestinationName] = useState(prefilledName);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [fuelStations, setFuelStations] = useState<FuelStation[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [showFuelList, setShowFuelList] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedStation, setSelectedStation] = useState<FuelStation | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const { data: rodeos } = trpc.rodeos.list.useQuery();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // Default to center of US if denied
          setUserLocation({ lat: 39.8283, lng: -98.5795 });
        }
      );
    }
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);

    // Init directions renderer
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#c2410c",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });
    renderer.setMap(map);
    directionsRendererRef.current = renderer;

    // If we have a prefilled destination, auto-route
    if (prefilledAddress) {
      setTimeout(() => calculateRoute(prefilledAddress, map, renderer), 500);
    }
  }, [prefilledAddress]);

  const calculateRoute = async (dest: string, map?: google.maps.Map, renderer?: google.maps.DirectionsRenderer) => {
    const theMap = map ?? mapRef.current;
    const theRenderer = renderer ?? directionsRendererRef.current;
    if (!theMap || !theRenderer || !dest) return;

    setLoadingRoute(true);
    setFuelStations([]);
    setRouteInfo(null);

    try {
      const directionsService = new google.maps.DirectionsService();
      const origin = userLocation
        ? new google.maps.LatLng(userLocation.lat, userLocation.lng)
        : "Current Location";

      const result = await directionsService.route({
        origin,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      theRenderer.setDirections(result);

      const leg = result.routes[0]?.legs[0];
      if (leg) {
        const distMiles = (leg.distance?.value ?? 0) / 1609.34;
        setRouteInfo({
          distance: leg.distance?.text ?? "",
          duration: leg.duration?.text ?? "",
          distanceMiles: distMiles,
        });

        // Fit map to route
        const bounds = new google.maps.LatLngBounds();
        result.routes[0]?.legs.forEach((l) => {
          l.steps.forEach((s) => {
            bounds.extend(s.start_location);
            bounds.extend(s.end_location);
          });
        });
        theMap.fitBounds(bounds, { top: 60, bottom: 60, left: 20, right: 20 });

        // Find fuel stations along the route
        await findFuelStations(result, theMap);
      }
    } catch (err: any) {
      toast.error("Could not find route. Check the destination address.");
      console.error(err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const findFuelStations = async (directionsResult: google.maps.DirectionsResult, map: google.maps.Map) => {
    setLoadingFuel(true);
    clearMarkers();

    try {
      const placesService = new google.maps.places.PlacesService(map);
      const route = directionsResult.routes[0];
      if (!route) return;

      // Sample points along the route every ~50 miles
      const legs = route.legs;
      const samplePoints: google.maps.LatLng[] = [];

      legs.forEach((leg) => {
        leg.steps.forEach((step, i) => {
          if (i % 5 === 0) samplePoints.push(step.start_location);
        });
        if (leg.end_location) samplePoints.push(leg.end_location);
      });

      // Deduplicate by ~50km proximity
      const dedupedPoints: google.maps.LatLng[] = [];
      samplePoints.forEach((pt) => {
        const tooClose = dedupedPoints.some((existing) => {
          const dx = pt.lat() - existing.lat();
          const dy = pt.lng() - existing.lng();
          return Math.sqrt(dx * dx + dy * dy) < 0.5; // ~50km
        });
        if (!tooClose) dedupedPoints.push(pt);
      });

      const allStations: FuelStation[] = [];
      const seen = new Set<string>();

      // Search around each sample point (limit to 3 points to avoid too many requests)
      const pointsToSearch = dedupedPoints.slice(0, Math.min(dedupedPoints.length, 4));

      for (const point of pointsToSearch) {
        await new Promise<void>((resolve) => {
          placesService.nearbySearch(
            {
              location: point,
              radius: 8000, // 8km radius
              type: "gas_station",
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                results.slice(0, 3).forEach((place) => {
                  if (!place.place_id || seen.has(place.place_id)) return;
                  seen.add(place.place_id);
                  const loc = place.geometry?.location;
                  if (!loc) return;
                  allStations.push({
                    name: place.name ?? "Gas Station",
                    address: place.vicinity ?? "",
                    lat: loc.lat(),
                    lng: loc.lng(),
                    placeId: place.place_id,
                    rating: place.rating,
                    isOpen: place.opening_hours?.isOpen?.(),
                  });
                });
              }
              resolve();
            }
          );
        });
      }

      setFuelStations(allStations);

      // Add fuel station markers
      allStations.forEach((station) => {
        const marker = new google.maps.Marker({
          position: { lat: station.lat, lng: station.lng },
          map,
          title: station.name,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="#ea580c" stroke="white" stroke-width="2"/>
                <text x="16" y="21" text-anchor="middle" font-size="14" fill="white">⛽</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
          },
        });
        markersRef.current.push(marker);
      });

      if (allStations.length > 0) setShowFuelList(true);
    } catch (err) {
      console.error("Fuel station search error:", err);
    } finally {
      setLoadingFuel(false);
    }
  };

  const navigateToStation = (station: FuelStation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}&destination_place_id=${station.placeId}`;
    window.open(url, "_blank");
  };

  const estimatedFuelCost = routeInfo
    ? `~$${((routeInfo.distanceMiles / 20) * 3.5).toFixed(0)}–$${((routeInfo.distanceMiles / 15) * 4.0).toFixed(0)}`
    : null;

  return (
    <div className="min-h-screen bg-background page-enter flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            📍 Locations
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-3 space-y-3 flex-1 flex flex-col">
        {/* Search / destination input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 text-sm"
              placeholder="Enter rodeo location or address…"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && calculateRoute(destination)}
            />
            {destination && (
              <button onClick={() => { setDestination(""); setDestinationName(""); setRouteInfo(null); setFuelStations([]); directionsRendererRef.current?.setDirections({ routes: [] } as any); clearMarkers(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={() => calculateRoute(destination)}
            disabled={!destination || loadingRoute || !mapReady}
            size="sm"
            className="gap-1.5 flex-shrink-0"
          >
            {loadingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            Route
          </Button>
        </div>

        {/* Quick-pick from upcoming rodeos */}
        {rodeos && rodeos.filter(r => r.locationAddress || r.locationName).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {rodeos
              .filter((r) => r.locationAddress || r.locationName)
              .slice(0, 5)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    const addr = r.locationAddress ?? r.locationName ?? "";
                    setDestination(addr);
                    setDestinationName(r.name);
                    calculateRoute(addr);
                  }}
                  className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors whitespace-nowrap"
                >
                  📍 {r.name}
                </button>
              ))}
          </div>
        )}

        {/* Route info */}
        {routeInfo && (
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Route to {destinationName || destination}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-sm font-bold text-foreground">{routeInfo.distance}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drive Time</p>
                <p className="text-sm font-bold text-foreground">{routeInfo.duration}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Fuel</p>
                <p className="text-sm font-bold text-primary">{estimatedFuelCost}</p>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-border flex-1" style={{ minHeight: 300, height: "calc(100vh - 420px)" }}>
          <MapView
            onMapReady={handleMapReady}
            initialCenter={userLocation ?? { lat: 39.8283, lng: -98.5795 }}
            initialZoom={userLocation ? 10 : 4}
          />
        </div>

        {/* Fuel stations panel */}
        {(loadingFuel || fuelStations.length > 0) && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setShowFuelList(!showFuelList)}
            >
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-foreground">
                  {loadingFuel ? "Finding fuel stations…" : `${fuelStations.length} Fuel Stations Along Route`}
                </span>
                {loadingFuel && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              </div>
              {!loadingFuel && (showFuelList ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
            </button>

            {showFuelList && !loadingFuel && (
              <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
                {fuelStations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No fuel stations found along this route</p>
                ) : (
                  fuelStations.map((station) => (
                    <FuelStationCard
                      key={station.placeId}
                      station={station}
                      onNavigate={() => navigateToStation(station)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!routeInfo && !loadingRoute && fuelStations.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Enter a destination above to get directions and see fuel stations along the way.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
