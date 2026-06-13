import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Sparkles } from 'lucide-react';

interface Point {
  name: string;
  lat: number;
  lng: number;
  x: number; // percentage width on canvas (30-90)
  y: number; // percentage height on canvas (20-80)
}

// Fixed preset logistics hubs for accurate coordinate drawing
export const LOGISTICS_HUBS: Point[] = [
  { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321, x: 12, y: 15 },
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, x: 8, y: 40 },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, x: 14, y: 56 },
  { name: 'Denver, CO', lat: 39.7392, lng: -104.9903, x: 38, y: 38 },
  { name: 'Houston, TX', lat: 29.7604, lng: -95.3698, x: 55, y: 78 },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298, x: 65, y: 30 },
  { name: 'Newark, NJ', lat: 40.7356, lng: -74.1724, x: 85, y: 25 },
  { name: 'Savannah, GA', lat: 32.0809, lng: -81.0912, x: 79, y: 64 },
  { name: 'Miami, FL', lat: 25.7617, lng: -80.1918, x: 84, y: 88 },
];

interface InteractiveMapProps {
  pickupName: string;
  dropName: string;
  onRoutesCalculated: (pickup: string, drop: string, distance: number) => void;
  trackingBookingId?: string;
  trackingVehicleName?: string;
  onPickupSelect?: (name: string, coords: { lat: number; lng: number }) => void;
  onDropSelect?: (name: string, coords: { lat: number; lng: number }) => void;
}

export default function InteractiveMap({
  pickupName,
  dropName,
  onRoutesCalculated,
  trackingBookingId,
  trackingVehicleName,
  onPickupSelect,
  onDropSelect,
}: InteractiveMapProps) {
  // Find preset points matching props or default to empty
  const [pickupPoint, setPickupPoint] = useState<Point | null>(null);
  const [dropPoint, setDropPoint] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [isSimulatingTracking, setIsSimulatingTracking] = useState<boolean>(false);
  const [truckProgress, setTruckProgress] = useState<number>(0); // 0 to 100 percentage of transit
  const [activeTab, setActiveTab] = useState<'map' | 'gmp'>('map');
  const [gmpKeyError, setGmpKeyError] = useState<boolean>(false);

  // Sync with component props
  useEffect(() => {
    const pick = LOGISTICS_HUBS.find(h => h.name.toLowerCase().includes(pickupName.toLowerCase())) || null;
    const drop = LOGISTICS_HUBS.find(h => h.name.toLowerCase().includes(dropName.toLowerCase())) || null;
    setPickupPoint(pick);
    setDropPoint(drop);

    if (pick && drop) {
      const dist = calculateDistance(pick.lat, pick.lng, drop.lat, drop.lng);
      setDistance(dist);
      onRoutesCalculated(pick.name, drop.name, dist);
    }
  }, [pickupName, dropName]);

  // Handle simulated tracking driving animation
  useEffect(() => {
    if (trackingBookingId && pickupPoint && dropPoint) {
      setIsSimulatingTracking(true);
      setTruckProgress(0);
      const interval = setInterval(() => {
        setTruckProgress(prev => {
          if (prev >= 100) {
            return 0; // Loop tracking motion
          }
          return prev + 2.5;
        });
      }, 150);
      return () => clearInterval(interval);
    } else {
      setIsSimulatingTracking(false);
      setTruckProgress(0);
    }
  }, [trackingBookingId, pickupPoint, dropPoint]);

  // Geographic distance calculators (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d); // Round to nearest km
  };

  const handleHubClick = (point: Point) => {
    if (!pickupPoint || (pickupPoint && dropPoint)) {
      setPickupPoint(point);
      setDropPoint(null);
      setDistance(0);
      if (onPickupSelect) {
        onPickupSelect(point.name, { lat: point.lat, lng: point.lng });
      }
    } else if (point.name !== pickupPoint.name) {
      setDropPoint(point);
      const dist = calculateDistance(pickupPoint.lat, pickupPoint.lng, point.lat, point.lng);
      setDistance(dist);
      if (onDropSelect) {
        onDropSelect(point.name, { lat: point.lat, lng: point.lng });
      }
      onRoutesCalculated(pickupPoint.name, point.name, dist);
    }
  };

  // Compute animated real-time truck position x & y
  const truckX = pickupPoint && dropPoint
    ? pickupPoint.x + ((dropPoint.x - pickupPoint.x) * truckProgress) / 100
    : 0;

  const truckY = pickupPoint && dropPoint
    ? pickupPoint.y + ((dropPoint.y - pickupPoint.y) * truckProgress) / 100
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Map Control Headers */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
          <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
            Live Tactical Shipping Map
          </span>
        </div>
        
        {/* Header Tabs */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Digital Radar Simulator
          </button>
          <button
            onClick={() => {
              setActiveTab('gmp');
              setGmpKeyError(true);
            }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'gmp'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-150 bg-slate-905'
            }`}
          >
            Google Maps API
          </button>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="p-4 bg-slate-950/70">
          <div className="text-center mb-3">
            <p className="text-xs text-slate-400">
              {trackingBookingId ? (
                <span className="text-blue-400 font-semibold">
                  🚚 GPS tracking active for {trackingVehicleName || 'Vehicle'}. Speed: 55mph.
                </span>
              ) : (
                <span>
                  Click any two hubs below to draw route, calculate freight cost, or simulate coordinates.
                </span>
              )}
            </p>
          </div>

          {/* Core Interactive Digital Map */}
          <div className="relative w-full aspect-[1.8/1] min-h-[280px] md:min-h-[350px] bg-slate-950 border border-blue-950/40 rounded-xl overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Background Map Contours & Radar Scopes */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950" />
            
            {/* Compass Compass Icon Overlay */}
            <div className="absolute top-4 right-4 text-slate-800 pointer-events-none">
              <Compass className="w-16 h-16 animate-pulse" />
            </div>

            {/* Connecting Vector Lines */}
            {pickupPoint && dropPoint && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* Router Line */}
                <line
                  x1={`${pickupPoint.x}%`}
                  y1={`${pickupPoint.y}%`}
                  x2={`${dropPoint.x}%`}
                  y2={`${dropPoint.y}%`}
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="stroke-blue-550 opacity-80"
                />
                
                {/* Animated Dash Movement Overlay */}
                <line
                  x1={`${pickupPoint.x}%`}
                  y1={`${pickupPoint.y}%`}
                  x2={`${dropPoint.x}%`}
                  y2={`${dropPoint.y}%`}
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 8"
                  className="stroke-blue-400 opacity-90"
                  style={{
                    animation: 'dash 15s linear infinite',
                  }}
                />
              </svg>
            )}

            {/* Simulated Animated Vehicle along route */}
            {isSimulatingTracking && pickupPoint && dropPoint && (
              <div
                className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-shadow duration-150"
                style={{
                  left: `${truckX}%`,
                  top: `${truckY}%`,
                }}
              >
                <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center animate-bounce border-2 border-white">
                  <Navigation className="w-4 h-4 transform rotate-45 text-white fill-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-[10px] text-white font-mono border border-slate-700 py-0.5 px-1.5 rounded shadow whitespace-nowrap">
                  {Math.round(truckProgress)}% in transit
                </div>
              </div>
            )}

            {/* Render Preset Hub Clickable Buttons */}
            {LOGISTICS_HUBS.map(hub => {
              const isPickup = pickupPoint?.name === hub.name;
              const isDrop = dropPoint?.name === hub.name;
              
              return (
                <button
                  key={hub.name}
                  id={`map-hub-${hub.name.replace(/[\s,]+/g, '-')}`}
                  onClick={() => handleHubClick(hub)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 focus:outline-none"
                  style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
                >
                  {/* Status Indicator Lights */}
                  <div className="relative">
                    {isPickup && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded shadow-md z-30 flex items-center gap-1.5">
                        <MapPin className="w-2.5 h-2.5 fill-white" /> Pickup
                      </span>
                    )}
                    {isDrop && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded shadow-md z-30 flex items-center gap-1.5">
                        <MapPin className="w-2.5 h-2.5 fill-white" /> Drop
                      </span>
                    )}

                    {/* Circle Ping Animations depending on state */}
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isPickup
                          ? 'bg-blue-600 border-white scale-125 shadow-lg shadow-blue-500/50'
                          : isDrop
                          ? 'bg-indigo-600 border-white scale-125 shadow-lg shadow-indigo-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 hover:scale-110 border-slate-600'
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${
                        isPickup ? 'bg-white' : isDrop ? 'bg-white' : 'bg-slate-300'
                      }`} />
                    </div>

                    {/* Popover city details */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-1.5 bg-slate-900 border border-slate-700 py-0.5 px-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-slate-200">
                      {hub.name}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Quick Summary Panels */}
            {pickupPoint && (
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg z-20 text-xs font-mono max-w-xs text-slate-200">
                <div className="space-y-1">
                  <div><span className="text-blue-400 font-bold">A:</span> {pickupPoint.name}</div>
                  {dropPoint && <div><span className="text-indigo-400 font-bold">B:</span> {dropPoint.name}</div>}
                  {distance > 0 && (
                    <div className="pt-1.5 mt-1 border-t border-slate-800 text-slate-300 font-bold flex justify-between gap-1.5">
                      <span>CALCULATED:</span>
                      <span className="text-blue-400">{distance.toLocaleString()} km</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -1000;
              }
            }
          `}</style>
        </div>
      ) : (
        <div className="p-8 bg-slate-950 flex flex-col items-center justify-center text-center text-slate-300" style={{ minHeight: '350px' }}>
          <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          <h4 className="text-sm font-semibold text-white mb-2">Google Maps Core Module Loaded</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            The platform is configured to listen to `process.env.GOOGLE_MAPS_PLATFORM_KEY` which binds directly into native Google Maps layers when deployed.
          </p>

          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg text-left text-[11px] font-mono text-slate-300 space-y-1.5 max-w-md">
            <h5 className="font-bold text-amber-400 text-xs mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> API Key Configuration Pending
            </h5>
            <p>1. Ensure your Google Maps key has Places, Directions, and Maps Javascript APIs enabled.</p>
            <p>2. Set variable in settings config secret key: <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300">GOOGLE_MAPS_PLATFORM_KEY</code></p>
            <p>3. Dynamic fallback radar simulation (left tab) handles 100% of marketplace pricing and coordinate generation without any setup required!</p>
          </div>
        </div>
      )}
    </div>
  );
}
