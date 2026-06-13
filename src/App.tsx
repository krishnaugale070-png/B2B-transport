import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, MapPin, Calendar, Compass, DollarSign, Scale, 
  MessageCircle, Star, Phone, Bell, Shield, User, Filter, 
  Clock, Plus, RefreshCw, Layers, CheckCircle2, XCircle, Info, Trash2
} from 'lucide-react';
import { TransportStore } from './store';
import { User as UserType, Vehicle, Booking, Review, Notification, VehicleType } from './types';
import InteractiveMap, { LOGISTICS_HUBS } from './components/InteractiveMap';
import NotificationCenter from './components/NotificationCenter';
import ReviewList from './components/ReviewList';
import CalendarView from './components/CalendarView';
import AddVehicleModal from './components/AddVehicleModal';

// Initialize the central reactive local storage replica store
const store = new TransportStore();

export default function App() {
  // Authentication & Session Roles
  const [currentUser, setCurrentUser] = useState<UserType>(store.getCurrentUser());
  const [allUsers, setAllUsers] = useState<UserType[]>(store.getUsers());
  const [selectedRole, setSelectedRole] = useState<string>(currentUser.role);
  
  // Database States
  const [vehicles, setVehicles] = useState<Vehicle[]>(store.getVehicles());
  const [bookings, setBookings] = useState<Booking[]>(store.getBookings());
  const [notifications, setNotifications] = useState<Notification[]>(store.getNotifications(currentUser.id));
  
  // Registration Form States
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regRole, setRegRole] = useState<'company' | 'owner'>('company');
  const [regCompany, setRegCompany] = useState<string>('');

  // Marketplace Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMinCapacity, setFilterMinCapacity] = useState<number>(0);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(10);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Detail View Drawer Mode
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState<boolean>(false);

  // Active Routing Variables
  const [pickupCity, setPickupCity] = useState<string>('');
  const [dropCity, setDropCity] = useState<string>('');
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);
  const [calendarBookingDate, setCalendarBookingDate] = useState<string>('');

  // GPS Simulation Variable
  const [trackingBookingId, setTrackingBookingId] = useState<string | undefined>(undefined);
  const [trackingVehicleName, setTrackingVehicleName] = useState<string | undefined>(undefined);

  // Sync state whenever actions complete
  const refreshStoreStates = () => {
    setVehicles(store.getVehicles());
    setBookings(store.getBookings());
    const userNow = store.getCurrentUser();
    setCurrentUser(userNow);
    setNotifications(store.getNotifications(userNow.id));
    setAllUsers(store.getUsers());
  };

  useEffect(() => {
    refreshStoreStates();
    // Subscribe to reactive database changes from Firestore synchronization
    const unsubscribe = store.onSync(() => {
      refreshStoreStates();
    });
    return () => unsubscribe();
  }, []);

  // Update scope when switches logged in user
  const handleUserSelect = (userId: string) => {
    store.setCurrentUser(userId);
    const userNow = store.getCurrentUser();
    setCurrentUser(userNow);
    setSelectedRole(userNow.role);
    setNotifications(store.getNotifications(userNow.id));
    
    // Clear tracking if switches profile
    setTrackingBookingId(undefined);
    setTrackingVehicleName(undefined);
  };

  // Register novel shippers or carriers
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone) return;
    
    const newUser = store.registerUser(
      regName,
      regEmail,
      regRole,
      regPhone,
      regCompany || undefined
    );
    
    setIsRegistering(false);
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegCompany('');
    
    refreshStoreStates();
    setSelectedRole(newUser.role);
  };

  // Switch role view
  const handleRoleTabChange = (role: string) => {
    setSelectedRole(role);
    // Find first user with that role to represent view actions
    const matched = store.getUsers().find(u => u.role === role);
    if (matched) {
      handleUserSelect(matched.id);
    }
  };

  // Register New vehicle post
  const handleAddVehicle = (vehicleData: any) => {
    store.addVehicle({
      ...vehicleData,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerPhone: currentUser.phone,
      ownerWhatsapp: currentUser.whatsappNumber || currentUser.phone.replace('+', ''),
    });
    refreshStoreStates();
  };

  // Launch fresh booking
  const handleInitiateBooking = () => {
    if (!selectedVehicle || !pickupCity || !dropCity || !calendarBookingDate) return;

    const freightRate = selectedVehicle.basePricePerKm;
    const calcCost = calculatedDistance * freightRate;
    const finalFreightCost = calcCost < selectedVehicle.minPrice ? selectedVehicle.minPrice : Math.round(calcCost);

    const pickupHub = LOGISTICS_HUBS.find(h => h.name === pickupCity) || LOGISTICS_HUBS[0];
    const dropHub = LOGISTICS_HUBS.find(h => h.name === dropCity) || LOGISTICS_HUBS[1];

    store.createBooking({
      vehicleId: selectedVehicle.id,
      vehicleName: selectedVehicle.name,
      vehicleType: selectedVehicle.type,
      vehiclePhoto: selectedVehicle.photoUrl,
      ownerId: selectedVehicle.ownerId,
      ownerName: selectedVehicle.ownerName,
      ownerPhone: selectedVehicle.ownerPhone,
      companyId: currentUser.id,
      companyName: currentUser.companyName || currentUser.name,
      pickupLocation: pickupCity,
      dropLocation: dropCity,
      pickupCoords: { lat: pickupHub.lat, lng: pickupHub.lng },
      dropCoords: { lat: dropHub.lat, lng: dropHub.lng },
      distanceKm: calculatedDistance,
      bookingDate: calendarBookingDate,
      totalFreightCost: finalFreightCost,
    });

    // Reset Booking selection
    setSelectedVehicle(null);
    setCalendarBookingDate('');
    setPickupCity('');
    setDropCity('');
    setCalculatedDistance(0);

    refreshStoreStates();
  };

  // Review posting
  const handlePostReview = (vehicleId: string, rating: number, comment: string) => {
    const compName = currentUser.companyName || currentUser.name;
    store.addReview(vehicleId, compName, rating, comment);
    refreshStoreStates();
  };

  // Notification center triggers
  const handleMarkNotificationsRead = () => {
    store.markNotificationsAsRead(currentUser.id);
    refreshStoreStates();
  };

  // Reset demo
  const handleFactoryReset = () => {
    store.factoryReset();
    refreshStoreStates();
    // Select first default user
    handleUserSelect('usr-company-1');
  };

  // Dynamic filter lists
  const filteredVehicles = vehicles.filter(v => {
    const matchQuery = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       v.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchType = filterType === 'all' || v.type === filterType;
    const matchCapacity = v.capacityTons >= filterMinCapacity;
    const matchPrice = v.basePricePerKm <= filterMaxPrice;
    const matchLocation = filterLocation === 'all' || v.location === filterLocation;
    const matchDate = !filterDate || v.availabilityDates.includes(filterDate);

    return matchQuery && matchType && matchCapacity && matchPrice && matchLocation && matchDate;
  });

  // Calculate stats for carrier dashboard
  const myCompletedBookings = bookings.filter(b => b.ownerId === currentUser.id && b.status === 'completed');
  const myEarnings = myCompletedBookings.reduce((sum, b) => sum + b.totalFreightCost, 0);
  const myActiveVehiclesCount = vehicles.filter(v => v.ownerId === currentUser.id).length;
  const myPendingRequests = bookings.filter(b => b.ownerId === currentUser.id && b.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-905 antialiased">
      {/* Dynamic Geometric Navigation Bar */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 flex flex-wrap items-center justify-between gap-4 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg italic select-none">T</div>
          <span className="font-extrabold text-lg text-slate-905 tracking-tight uppercase font-display">
            Transport<span className="text-blue-600">Connect</span>
          </span>
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold tracking-wide uppercase">
            Network Sync: Live
          </span>
        </div>

        {/* Dynamic Sandbox Selector Controls representing secure logins */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-3xs">
            <span className="text-[10px] text-slate-400 font-mono uppercase px-2 font-bold">Act-As:</span>
            <button
              onClick={() => handleRoleTabChange('company')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedRole === 'company'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🏢 Dispatcher
            </button>
            <button
              onClick={() => handleRoleTabChange('owner')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedRole === 'owner'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🚚 Carrier Owner
            </button>
            <button
              onClick={() => handleRoleTabChange('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🛡️ Admin
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentUser.id}
              onChange={e => handleUserSelect(e.target.value)}
              className="bg-white text-xs text-slate-700 py-1.5 px-3 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setIsRegistering(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors shadow-3xs cursor-pointer"
            >
              + Register Role
            </button>

            <button
              onClick={handleFactoryReset}
              title="Reset Simulated DB State"
              className="bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-650 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Register User Modal Dialog */}
      {isRegistering && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="px-5 py-4 bg-slate-950 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider">Register Carrier or Shipper Profile</h3>
              <button onClick={() => setIsRegistering(false)} className="text-slate-400 hover:text-white pb-1 select-none">✕</button>
            </div>

            <form onSubmit={handleRegisterUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Bhausaheb Ugale"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Coordinates</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="e.g. bhausaheb.ugale813@gmail.com"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="e.g. +14155556789"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign System Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-850"
                  >
                    <option value="company">Shipper Company</option>
                    <option value="owner">Vehicle Fleet Owner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Freight Brand Name</label>
                <input
                  type="text"
                  value={regCompany}
                  onChange={e => setRegCompany(e.target.value)}
                  placeholder="e.g. Ugale Freight Lines Ltd."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded-lg"
                >
                  Create & Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Core App Dashboard Layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Dynamic Warning of Current Authenticated Profile Role */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              {currentUser.role === 'company' ? (
                <Layers className="w-5 h-5" />
              ) : currentUser.role === 'owner' ? (
                <Truck className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">
                Active Client Context
              </div>
              <h2 className="text-sm font-bold text-slate-800">
                {currentUser.companyName || 'Corporate Partner'}: "{currentUser.name}"
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-mono text-slate-500 bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-lg">
              ✉️ {currentUser.email}
            </div>
            <div className="text-xs font-mono text-slate-500 bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-lg">
              📞 {currentUser.phone}
            </div>
          </div>
        </div>

        {/* 🏢 MAIN DISPATCHER VIEW */}
        {selectedRole === 'company' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Search, Filter & Vehicles Listings Grid column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dynamic Filter Controls Panel */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 font-display">
                    <Filter className="w-4 h-4 text-blue-600" /> Search & Filter Fleet
                  </h3>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterMinCapacity(0);
                      setFilterMaxPrice(10);
                      setFilterLocation('all');
                      setFilterDate('');
                    }}
                    className="text-[11px] text-slate-500 hover:text-blue-650 font-semibold focus:outline-none cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>

                {/* Primary Query Text Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by vehicle model, types (Semi, flatbed), license plates, transit base city..."
                    className="w-full text-xs border border-slate-205 rounded-xl p-3 pl-10 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Granular filtration cluster */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Type Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Platform Type
                    </label>
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-semibold"
                    >
                      <option value="all">All Heavy Trailers</option>
                      <option value="Semi-Trailer">Semi-Trailer</option>
                      <option value="Flatbed">Flatbed Trailer</option>
                      <option value="Refrigerated/Reefer">Reefer Cold Chain</option>
                      <option value="Box Truck">Box Van Cargo</option>
                      <option value="Container Carrier">Intermodal Container</option>
                      <option value="Car Carrier">Car Carrier</option>
                    </select>
                  </div>

                  {/* Weight Capacity Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Min Capacity (Tons)
                    </label>
                    <select
                      value={filterMinCapacity}
                      onChange={e => setFilterMinCapacity(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-semibold"
                    >
                      <option value="0">Any capacity</option>
                      <option value="5">5+ Tons (Medium Box)</option>
                      <option value="12">12+ Tons (Reefer)</option>
                      <option value="20">20+ Tons (Semi Trailer)</option>
                      <option value="25">25+ Tons (Container)</option>
                    </select>
                  </div>

                  {/* Freight Tariffs Rate Limit */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Max Rate per Km ($)
                    </label>
                    <select
                      value={filterMaxPrice}
                      onChange={e => setFilterMaxPrice(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-semibold"
                    >
                      <option value="10">Any price</option>
                      <option value="2">Under $2.00/km</option>
                      <option value="3">Under $3.00/km</option>
                      <option value="4">Under $4.00/km</option>
                      <option value="5">Under $5.00/km</option>
                    </select>
                  </div>

                  {/* Hub Locations Base Picker */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Staging Base
                    </label>
                    <select
                      value={filterLocation}
                      onChange={e => setFilterLocation(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-semibold"
                    >
                      <option value="all">Any US Hub</option>
                      {LOGISTICS_HUBS.map(hub => (
                        <option key={hub.name} value={hub.name}>
                          {hub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Availability Date Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Target Shipping Date
                    </label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-semibold h-[34px] flex items-center"
                    />
                  </div>
                </div>
              </div>

              {/* Carrier search listings count banner */}
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 font-medium">
                  Discovered <strong className="text-slate-800">{filteredVehicles.length}</strong> matching carriers out of {vehicles.length} registered.
                </p>
              </div>

              {/* Vehicle Listings Render Loop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVehicles.map(v => {
                  const isCurSelected = selectedVehicle?.id === v.id;
                  
                  return (
                    <div
                      key={v.id}
                      id={`vehicle-card-${v.id}`}
                      className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 ${
                        isCurSelected 
                          ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-lg' 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {/* Photo Header */}
                      <div className="relative h-44 bg-slate-900 overflow-hidden">
                        <img
                          src={v.photoUrl}
                          alt={v.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-slate-950/80 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-display">
                          {v.type}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-blue-600 text-white font-semibold text-xs py-1 px-2.5 rounded-lg shadow-md flex items-center gap-0.5 animate-in fade-in duration-200">
                          <DollarSign className="w-3.5 h-3.5 animate-pulse" />{v.basePricePerKm.toFixed(2)} / km
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-slate-805 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors font-display">
                              {v.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Staged: {v.location}
                            </p>
                          </div>
                          
                          {/* Rating display */}
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-105 py-0.5 px-2 rounded-lg text-amber-700 text-xs font-bold leading-normal">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-505" />
                            {v.rating.toFixed(1)}
                          </div>
                        </div>

                        {/* Truck Specifications Metrics row */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 py-2 px-3 rounded-lg border border-slate-100 font-mono">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Scale className="w-3.5 h-3.5 text-slate-400" /> {v.capacityTons} Tons Max
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {v.availabilityDates.length} Days Free
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2.5">
                          {/* Authentic Green WhatsApp button */}
                          <a
                            href={`https://wa.me/${v.ownerWhatsapp}?text=Hello%20${encodeURIComponent(v.ownerName)},%20I%20saw%20your%2520${encodeURIComponent(v.type)}%20("${encodeURIComponent(v.name)}")%20listed%20on%20Transport%20Connect.%20Is%20it%20available%20for%20a%20haul?`}
                            target="_blank"
                            rel="noopener noreferrer"
                            id={`wa-btn-${v.id}`}
                            className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid choosing vehicle card trigger
                            }}
                          >
                            <Phone className="w-3.5 h-3.5" /> WhatsApp Owner
                          </a>

                          <button
                            onClick={() => {
                              setSelectedVehicle(v);
                              // Auto fill default values for mapping
                              setPickupCity(v.location);
                              const partnerCity = LOGISTICS_HUBS.find(h => h.name !== v.location)?.name || 'Houston, TX';
                              setDropCity(partnerCity);
                            }}
                            id={`details-btn-${v.id}`}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer shadow-3xs"
                          >
                            Route & Book Cargo
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredVehicles.length === 0 && (
                  <div className="col-span-full bg-white border border-dashed border-slate-300 p-10 text-center rounded-2xl">
                    <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-700 text-xs">No Matching Vehicles Detected</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Reset your search criteria, adjust max freight rate threshold, or toggle staging locations.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notification and Selection column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Notification Center */}
              <NotificationCenter 
                notifications={notifications}
                onMarkAllAsRead={handleMarkNotificationsRead}
              />

              {/* Interactive Router and Live Booking Container */}
              {selectedVehicle ? (
                <div className="bg-slate-950 border border-slate-808 rounded-3xl p-5 shadow-2xl text-white space-y-5 animate-in slide-in-from-right duration-200">
                  <div className="flex justify-between items-start gap-1 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] text-blue-400 font-mono tracking-wider font-bold">ACTIVE BOOKING FORM</span>
                      <h3 className="font-extrabold text-sm text-white leading-tight font-display">{selectedVehicle.name}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        Plate: <span className="font-mono text-blue-400">{selectedVehicle.licensePlate}</span> | Base: {selectedVehicle.location}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedVehicle(null)}
                      className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Route Selecting Selector Forms */}
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          📍 Origin City
                        </label>
                        <select
                          value={pickupCity}
                          id="book-origin-select"
                          onChange={e => setPickupCity(e.target.value)}
                          className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-100 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        >
                          {LOGISTICS_HUBS.map(hub => (
                            <option key={hub.name} value={hub.name}>
                              {hub.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          🏁 Dest City
                        </label>
                        <select
                          value={dropCity}
                          id="book-dest-select"
                          onChange={e => setDropCity(e.target.value)}
                          className="w-full text-xs border border-slate-800 bg-slate-900 text-slate-100 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        >
                          {LOGISTICS_HUBS.map(hub => (
                            <option key={hub.name} value={hub.name}>
                              {hub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Integrated Embedded Map for routing selection & math calculations */}
                    <InteractiveMap
                      pickupName={pickupCity}
                      dropName={dropCity}
                      onRoutesCalculated={(p, d, dist) => {
                        setCalculatedDistance(dist);
                      }}
                      onPickupSelect={(p, coords) => setPickupCity(p)}
                      onDropSelect={(d, coords) => setDropCity(d)}
                    />

                    {/* Date Selector from Vehicle Available calendar dates */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        📅 Select Shipping Date
                      </span>
                      <CalendarView
                        availableDates={selectedVehicle.availabilityDates}
                        selectedDate={calendarBookingDate}
                        onSelectDate={(date) => {
                          setCalendarBookingDate(date);
                        }}
                        readOnly={true}
                      />
                    </div>

                    {/* Dynamic Freight Quotation Board */}
                    {calculatedDistance > 0 ? (
                      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2 font-mono text-xs">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Transit Path Length:</span>
                          <span className="text-white">{calculatedDistance.toLocaleString()} km</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Cargo Platform Fee ({selectedVehicle.type}):</span>
                          <span className="text-white">${selectedVehicle.basePricePerKm} / km</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Floor Minimum:</span>
                          <span className="text-white">${selectedVehicle.minPrice}</span>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-blue-400">
                          <span>ESTIMATED FREIGHT COST:</span>
                          <span>
                            ${(calculatedDistance * selectedVehicle.basePricePerKm < selectedVehicle.minPrice 
                              ? selectedVehicle.minPrice 
                              : Math.round(calculatedDistance * selectedVehicle.basePricePerKm)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 p-3 text-center text-[11px] text-slate-400 rounded-lg">
                        Select contrasting origin and destination points to compute transport distance constraints.
                      </div>
                    )}

                    {/* Submit Reserve Button trigger */}
                    <button
                      onClick={handleInitiateBooking}
                      disabled={!pickupCity || !dropCity || !calendarBookingDate || calculatedDistance <= 0}
                      id="btn-confirm-booking"
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center tracking-wide transition-all shadow-md ${
                        pickupCity && dropCity && calendarBookingDate && calculatedDistance > 0
                          ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer hover:shadow-lg'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {!calendarBookingDate 
                        ? 'Select a date on calendar' 
                        : `Instant Book freight for June ${calendarBookingDate.split('-')[2]}`}
                    </button>
                  </div>

                  {/* Vehicle Historical Reviews embedded detail */}
                  <div className="text-slate-950 pt-1">
                    <ReviewList
                      vehicleId={selectedVehicle.id}
                      reviews={store.getReviews(selectedVehicle.id)}
                      onAddReview={(rating, comment) => handlePostReview(selectedVehicle.id, rating, comment)}
                      canReview={false} // Dispatcher can only review after delivery completion
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs shadow-xs">
                  <Compass className="w-8 h-8 text-slate-350 mx-auto mb-2 animate-spin-slow" />
                  <p className="font-semibold text-slate-700">No active shipping draft</p>
                  <p className="text-slate-400 mt-1 max-w-xs mx-auto">
                    Choose "Route & Book Cargo" on any registered platform vehicle on the left to activate instant routing.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🏢 COMPANY WORKBOOK: BOOKING HISTORY LOGS */}
        {selectedRole === 'company' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-emerald-600" /> Booking History & Live GPS Tracking
            </h3>

            {/* If there is active GPS tracking focus, render tracking map panel */}
            {trackingBookingId && (
              <div className="mb-6 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                      Live GPS Tracking Sim Node: Approved cargo run
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setTrackingBookingId(undefined);
                      setTrackingVehicleName(undefined);
                    }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Close GPS panel
                  </button>
                </div>
                {/* Active Map in tracking simulation mode */}
                {(() => {
                  const targetBooking = bookings.find(b => b.id === trackingBookingId);
                  if (!targetBooking) return null;
                  return (
                    <InteractiveMap
                      pickupName={targetBooking.pickupLocation}
                      dropName={targetBooking.dropLocation}
                      onRoutesCalculated={() => {}}
                      trackingBookingId={trackingBookingId}
                      trackingVehicleName={trackingVehicleName}
                    />
                  );
                })()}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-705">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-3">Vehicle / Carrier Details</th>
                    <th className="p-3">Route (Origin ➔ Dest)</th>
                    <th className="p-3">Distance</th>
                    <th className="p-3">Shipment Date</th>
                    <th className="p-3">Price Paid</th>
                    <th className="p-3 text-center">Security Status</th>
                    <th className="p-3 text-right">Actions / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.filter(b => b.companyId === currentUser.id).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-medium">
                        No historical booking records logged. Set filters on the search panel to secure bookings!
                      </td>
                    </tr>
                  ) : (
                    bookings.filter(b => b.companyId === currentUser.id).map(b => (
                      <tr key={b.id} id={`booking-row-${b.id}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 flex items-center gap-3">
                          <img
                            src={b.vehiclePhoto}
                            alt={b.vehicleName}
                            className="w-10 h-10 object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h5 className="font-semibold text-slate-800 line-clamp-1">{b.vehicleName}</h5>
                            <span className="text-[10px] text-slate-400 bg-slate-100 py-0.2 px-1 rounded font-semibold font-mono">
                              {b.vehicleType}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{b.pickupLocation}</div>
                          <div className="text-[10px] text-slate-400">➔ {b.dropLocation}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px] font-semibold text-slate-650">
                          {b.distanceKm} km
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {b.bookingDate}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          ${b.totalFreightCost.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`w-full py-1 text-[10px] font-bold rounded-lg text-center block uppercase tracking-wider ${
                            b.status === 'approved' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                              : b.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-105'
                              : b.status === 'declined'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-105 text-amber-700 border border-amber-200'
                          }`}>
                            ● {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            {b.status === 'approved' && (
                              <button
                                onClick={() => {
                                  setTrackingBookingId(b.id);
                                  setTrackingVehicleName(b.vehicleName);
                                }}
                                className="text-[11px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded font-bold cursor-pointer"
                              >
                                GPS Tracking
                              </button>
                            )}

                            {b.status === 'completed' ? (
                              <button
                                onClick={() => {
                                  setSelectedVehicle(store.getVehicles().find(v => v.id === b.vehicleId) || null);
                                  // Trigger focus on details button
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                                className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded font-semibold cursor-pointer shadow-3xs"
                              >
                                Leave Review
                              </button>
                            ) : b.status === 'approved' ? (
                              <button
                                onClick={() => {
                                  store.updateBookingStatus(b.id, 'completed');
                                  refreshStoreStates();
                                }}
                                className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-bold cursor-pointer shadow-3xs"
                              >
                                Mark Completed
                              </button>
                            ) : null}

                            {/* Standard direct chat button equipped with official WhatsApp shade */}
                            <a
                              href={`https://wa.me/${store.getVehicles().find(v => v.id === b.vehicleId)?.ownerWhatsapp || '14155556789'}?text=Hello%20carrier,%20regarding%2520booking%2520ID%2520${b.id}%2520for%2520shipping%2520on%2520${b.bookingDate}...`}
                              target="_blank"
                              id={`history-chat-btn-${b.id}`}
                              className="text-xs p-1 hover:bg-[#25D366]/10 rounded text-[#25D366] border border-slate-200 cursor-pointer"
                              title="Chat regarding booking"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🚚 CARRIER FLEET OWNER INTERFACES */}
        {selectedRole === 'owner' && (
          <div className="space-y-6">
            
            {/* Owner Stats Analytics Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Month Earnings (June 2026)</span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono block mt-1">${myEarnings.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">From completed shipments</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Active Fleet Registered</span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono block mt-1">{myActiveVehiclesCount} Heavy Trucks</span>
                <span className="text-[10px] text-slate-400">Discoverable on map radar</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Pending Cargo Requests</span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono block mt-1">{myPendingRequests.length} Orders</span>
                <span className={`text-[10px] font-semibold ${myPendingRequests.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
                  Requires instant attention
                </span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex flex-row items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block font-mono">Fleet Actions</span>
                  <button
                    onClick={() => setIsAddingVehicle(true)}
                    id="btn-trigger-add-vehicle"
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register Vehicle
                  </button>
                </div>
                <Truck className="w-10 h-10 text-blue-200" />
              </div>
            </div>

            {/* Inbound Booking requests module */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Bell className="w-4.5 h-4.5 text-amber-600 animate-bounce" /> Inbound Company Cargo Requests
              </h3>

              <div className="divide-y divide-slate-100">
                {myPendingRequests.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No active pending transportation requests. Active orders list here once companies execute reservation forms.
                  </div>
                ) : (
                  myPendingRequests.map(r => (
                    <div key={r.id} id={`carrier-request-${r.id}`} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-3 items-start">
                        <img
                          src={r.vehiclePhoto}
                          alt={r.vehicleName}
                          className="w-12 h-12 object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-xs">Origin: "{r.companyName}"</h4>
                            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 py-0.2 px-1 rounded-sm uppercase tracking-wider font-mono">
                              Inbound Request
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-600 mt-1">
                            Requested <strong>{r.vehicleName}</strong> to haul cargo from <strong>{r.pickupLocation}</strong> to <strong>{r.dropLocation}</strong> on <strong>{r.bookingDate}</strong>.
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Trip Distance: {r.distanceKm} km | Total freight tariff earnings: <strong>${r.totalFreightCost}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => {
                            store.updateBookingStatus(r.id, 'approved');
                            refreshStoreStates();
                          }}
                          id={`btn-approve-${r.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                        >
                          Approve Logistics
                        </button>
                        <button
                          onClick={() => {
                            store.updateBookingStatus(r.id, 'declined');
                            refreshStoreStates();
                          }}
                          id={`btn-decline-${r.id}`}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-1.5 px-2.5 rounded-lg text-xs transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manage Fleet details and Availability plan */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Fleet vehicles loop list */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">Active Truck Fleet Asset Management</h3>
                  <span className="text-xs text-slate-500 font-mono">{vehicles.filter(v => v.ownerId === currentUser.id).length} Active Assets</span>
                </div>

                {vehicles.filter(v => v.ownerId === currentUser.id).map(v => (
                  <div key={v.id} className="bg-white p-4 border border-slate-205 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <img
                        src={v.photoUrl}
                        alt={v.name}
                        className="w-16 h-16 object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-slate-805 text-xs">{v.name}</h4>
                          <span className="text-[10px] font-mono font-bold text-slate-500">{v.licensePlate}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-505 py-0.2 px-1 rounded-sm block w-fit mt-0.5">
                          {v.type}
                        </span>
                        
                        <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] text-slate-500 font-mono">
                          <div>Cap: <strong>{v.capacityTons}T</strong></div>
                          <div>Rate: <strong>${v.basePricePerKm}/km</strong></div>
                          <div>Min: <strong>${v.minPrice}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Availability Dates Calendar controller */}
                    <div className="pt-3 border-t border-slate-105">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                        📅 Schedule & Duty Plan: Click dates to toggle free cargo slots
                      </span>
                      <CalendarView
                        availableDates={v.availabilityDates}
                        onToggleDate={(date) => {
                          const exist = v.availabilityDates.includes(date);
                          const newDates = exist
                            ? v.availabilityDates.filter(d => d !== date)
                            : [...v.availabilityDates, date].sort();
                          store.updateVehicleAvailability(v.id, newDates);
                          refreshStoreStates();
                        }}
                        readOnly={false}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Booking History archives for Owner */}
              <div className="lg:col-span-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Historical Transport Operations Log</h3>
                
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
                  {bookings.filter(b => b.ownerId === currentUser.id).length === 0 ? (
                    <div className="text-center p-8 text-xs text-slate-400">
                      No operations historical runs registered. Approving order requests logs statistics here.
                    </div>
                  ) : (
                    bookings.filter(b => b.ownerId === currentUser.id).map(b => (
                      <div key={b.id} className="p-4 flex justify-between items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-800 text-xs">{b.pickupLocation} ➔ {b.dropLocation}</h5>
                            <span className="text-[9px] bg-slate-50 text-slate-600 border border-slate-200 py-0.2 px-1 rounded">
                              {b.bookingDate}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Client: <strong>"{b.companyName}"</strong> | Vehicle: {b.vehicleName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Freight Cost: <strong>${b.totalFreightCost}</strong> | Net 85% Earnings: ${(b.totalFreightCost * 0.85).toFixed(0)}
                          </p>
                        </div>

                        <div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase ${
                            b.status === 'completed'
                              ? 'bg-blue-50 text-blue-700'
                              : b.status === 'approved'
                              ? 'bg-indigo-50 text-indigo-700'
                              : b.status === 'declined'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-105 text-amber-700'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Add Vehicle form */}
            {isAddingVehicle && (
              <AddVehicleModal
                onClose={() => setIsAddingVehicle(false)}
                onAdd={handleAddVehicle}
              />
            )}
          </div>
        )}

        {/* 🛡️ ADMIN SYSTEM OVERVIEW VIEW */}
        {selectedRole === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Global dashboard stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-slate-800">
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Core platform Users</span>
                <span className="text-2xl font-extrabold text-slate-850 font-mono block mt-1">{allUsers.length} Logged Profiles</span>
                <span className="text-[10px] text-blue-600 font-semibold">Verified security log</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Total registered Fleet</span>
                <span className="text-2xl font-extrabold text-slate-850 font-mono block mt-1">{vehicles.length} Trucks</span>
                <span className="text-[10px] text-blue-600 font-semibold">Active radar staging</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Executed transactions</span>
                <span className="text-2xl font-extrabold text-slate-850 font-mono block mt-1">{bookings.length} Runs requested</span>
                <span className="text-[10px] text-slate-400">Total inter-state logistics</span>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Calculated commission (15%)</span>
                <span className="text-2xl font-extrabold text-slate-850 font-mono block mt-1">
                  ${Math.round(
                    bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.totalFreightCost, 0) * 0.15
                  ).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Commission revenue pool</span>
              </div>
            </div>

            {/* Split layout for User listings and Bookings management */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* User Profiles global log */}
              <div className="lg:col-span-5 bg-white border border-slate-205 rounded-2xl p-5 shadow-xs">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Core platform Shippers & Logistics Carriers</h3>
                
                <div className="divide-y divide-slate-100">
                  {allUsers.map(u => (
                    <div key={u.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs">
                            {u.name} <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">({u.role})</span>
                          </h5>
                          <span className="text-[10px] text-slate-400 block">{u.companyName || 'Not defined'}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Phone: {u.phone}</span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <span className="px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[9px]">
                          Approved
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bookings comprehensive audit logs */}
              <div className="lg:col-span-7 bg-white border border-slate-205 rounded-2xl p-5 shadow-xs">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Comprehensive Booking Operations Supervisor Audit</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 text-[9px] uppercase">
                      <tr>
                        <th className="p-2.5">Shipper Partner</th>
                        <th className="p-2.5">Platform Truck</th>
                        <th className="p-2.5">Total Toll</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-right">Settings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400">
                            No operational bookings exist yet. Run sandbox dispatch scripts to trigger logs.
                          </td>
                        </tr>
                      ) : (
                        bookings.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-800">{b.companyName}</td>
                            <td className="p-2.5 text-slate-505">{b.vehicleName}</td>
                            <td className="p-2.5 font-bold font-mono text-slate-800">${b.totalFreightCost}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                b.status === 'completed' ? 'bg-blue-50 text-blue-700' : 
                                b.status === 'approved' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-105 text-amber-700'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => {
                                  store.updateBookingStatus(b.id, 'completed');
                                  refreshStoreStates();
                                }}
                                disabled={b.status === 'completed'}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-0.5 px-1.5 rounded text-[9px] font-bold disabled:opacity-40 cursor-pointer"
                              >
                                Force Complete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 Transport Connect Inc. • Secure Cross-Platform Logistics Marketplace.</p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
          Chicago • Los Angeles • Houston • Savannah • Newark
        </p>
      </footer>
    </div>
  );
}
