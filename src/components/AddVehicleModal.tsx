import React, { useState } from 'react';
import { Truck, DollarSign, Scale, MapPin, X, ShieldAlert } from 'lucide-react';
import { VehicleType, Vehicle } from '../types';
import { LOGISTICS_HUBS } from './InteractiveMap';

interface AddVehicleModalProps {
  onClose: () => void;
  onAdd: (vehicleData: Omit<Vehicle, 'id' | 'ownerId' | 'ownerName' | 'ownerPhone' | 'ownerWhatsapp' | 'rating' | 'reviewsCount' | 'isAvailable'>) => void;
}

const VEHICLE_PRES_PHOTOS: { type: VehicleType; url: string }[] = [
  { type: 'Semi-Trailer', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600' },
  { type: 'Flatbed', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600' },
  { type: 'Refrigerated/Reefer', url: 'https://images.unsplash.com/photo-1590481487858-3c52b4cd4613?auto=format&fit=crop&q=80&w=600' },
  { type: 'Box Truck', url: 'https://images.unsplash.com/photo-1516501224897-267352fc99b1?auto=format&fit=crop&q=80&w=600' },
  { type: 'Container Carrier', url: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=600' },
  { type: 'Car Carrier', url: 'https://images.unsplash.com/photo-1563968743333-044cef800494?auto=format&fit=crop&q=80&w=600' },
];

export default function AddVehicleModal({ onClose, onAdd }: AddVehicleModalProps) {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<VehicleType>('Semi-Trailer');
  const [capacityTons, setCapacityTons] = useState<number>(20);
  const [basePricePerKm, setBasePricePerKm] = useState<number>(3.20);
  const [minPrice, setMinPrice] = useState<number>(150);
  const [stagingHub, setStagingHub] = useState<string>('Chicago, IL');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !licensePlate) return;

    // Pick preset photo matching type if no custom photo specified
    const matchedPhoto = VEHICLE_PRES_PHOTOS.find(p => p.type === type)?.url || VEHICLE_PRES_PHOTOS[0].url;
    const finalPhoto = customPhotoUrl.trim() || matchedPhoto;

    // Retrieve geo coordinates from selected hub
    const targetHub = LOGISTICS_HUBS.find(h => h.name === stagingHub) || LOGISTICS_HUBS[0];

    onAdd({
      name,
      type,
      capacityTons,
      basePricePerKm,
      minPrice,
      location: stagingHub,
      coordinates: { lat: targetHub.lat, lng: targetHub.lng },
      photoUrl: finalPhoto,
      licensePlate,
      availabilityDates: [
        '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'
      ], // Auto fill baseline dates
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-105 animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-slate-950 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-display">Register New Fleet Asset</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vehicle / Engine Model</label>
              <input
                type="text"
                value={name}
                id="add-vh-model"
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Scania R500 V8 Streamline"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cargo Platform Type</label>
              <select
                value={type}
                id="add-vh-type"
                onChange={e => {
                  const val = e.target.value as VehicleType;
                  setType(val);
                  // Update mock default capacity matching typical weights
                  switch (val) {
                    case 'Semi-Trailer': setCapacityTons(25); setBasePricePerKm(3.50); break;
                    case 'Flatbed': setCapacityTons(18); setBasePricePerKm(2.80); break;
                    case 'Refrigerated/Reefer': setCapacityTons(12); setBasePricePerKm(4.20); break;
                    case 'Box Truck': setCapacityTons(4.5); setBasePricePerKm(1.80); break;
                    case 'Container Carrier': setCapacityTons(30); setBasePricePerKm(4.80); break;
                    case 'Car Carrier': setCapacityTons(22); setBasePricePerKm(3.90); break;
                  }
                }}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Semi-Trailer">Semi-Trailer (Generic Dry Freight)</option>
                <option value="Flatbed">Flatbed Trailer (Steel, Rebar, Timber)</option>
                <option value="Refrigerated/Reefer">Refrigerated Reefer (Cold Food)</option>
                <option value="Box Truck">Box Cargo van (Local Moving, Electronics)</option>
                <option value="Container Carrier">Container Chassis (Intermodal Port Hauling)</option>
                <option value="Car Carrier">Car Transporter (Automobiles)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-slate-400" /> Max Cargo (Tons)
              </label>
              <input
                type="number"
                step="0.1"
                id="add-vh-capacity"
                value={capacityTons}
                onChange={e => setCapacityTons(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Rate per km ($)
              </label>
              <input
                type="number"
                step="0.01"
                id="add-vh-rate"
                value={basePricePerKm}
                onChange={e => setBasePricePerKm(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Min. Charge ($)
              </label>
              <input
                type="number"
                value={minPrice}
                id="add-vh-min"
                onChange={e => setMinPrice(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Dispatch Base Hub
              </label>
              <select
                value={stagingHub}
                id="add-vh-hub"
                onChange={e => setStagingHub(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {LOGISTICS_HUBS.map(hub => (
                  <option key={hub.name} value={hub.name}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">License Plate Tag</label>
              <input
                type="text"
                id="add-vh-plate"
                value={licensePlate}
                onChange={e => setLicensePlate(e.target.value)}
                placeholder="e.g. TX-HAUL-891"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Custom Photo Link (Optional)</label>
            <input
              type="url"
              value={customPhotoUrl}
              id="add-vh-photo"
              onChange={e => setCustomPhotoUrl(e.target.value)}
              placeholder="Leave blank to auto-attach matching premium truck stock photography"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Guidelines */}
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-800 leading-normal">
              <strong>Asset Validation Invariant:</strong> Once listed, your vehicle will instantly undergo digital inspection approval and become discoverable by booking managers. A <strong>one-click WhatsApp link</strong> will be bound to your verified phone number on the profile.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-755 font-semibold py-2 px-4 border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-register-vehicle"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Verify & Launch Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
