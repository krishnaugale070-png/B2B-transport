import { Vehicle, Review, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-company-1',
    name: 'Bhausaheb Ugale',
    email: 'bhausaheb.ugale813@gmail.com',
    role: 'company',
    phone: '+15551234567',
    companyName: 'Express Logistics Inc.'
  },
  {
    id: 'usr-owner-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@transport.com',
    role: 'owner',
    phone: '+14155556789',
    companyName: 'Heavy Haul Fleet Services',
    whatsappNumber: '14155556789'
  },
  {
    id: 'usr-owner-2',
    name: 'Anjali Sharma',
    email: 'anjali.sharma@cargo.com',
    role: 'owner',
    phone: '+13125559876',
    companyName: 'Metro Cold Chain Ltd',
    whatsappNumber: '13125559876'
  },
  {
    id: 'usr-admin-1',
    name: 'Transport Connect Admin',
    email: 'admin@transportconnect.com',
    role: 'admin',
    phone: '+18005550201'
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'vh-1',
    ownerId: 'usr-owner-1',
    ownerName: 'Marcus Vance',
    ownerPhone: '+14155556789',
    ownerWhatsapp: '14155556789',
    name: 'Volvo FH16 Globetrotter',
    type: 'Semi-Trailer',
    capacityTons: 25,
    basePricePerKm: 3.50,
    minPrice: 150,
    location: 'Chicago, IL',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    photoUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    reviewsCount: 24,
    availabilityDates: [
      '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-25', '2026-06-26'
    ],
    isAvailable: true,
    licensePlate: 'CHI-TRK-789'
  },
  {
    id: 'vh-2',
    ownerId: 'usr-owner-1',
    ownerName: 'Marcus Vance',
    ownerPhone: '+14155556789',
    ownerWhatsapp: '14155556789',
    name: 'Kenworth T680 Flatbed',
    type: 'Flatbed',
    capacityTons: 18,
    basePricePerKm: 2.80,
    minPrice: 120,
    location: 'Houston, TX',
    coordinates: { lat: 29.7604, lng: -95.3698 },
    photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600',
    rating: 4.7,
    reviewsCount: 15,
    availabilityDates: [
      '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-20', '2026-06-21', '2026-06-22'
    ],
    isAvailable: true,
    licensePlate: 'HOU-FLT-302'
  },
  {
    id: 'vh-3',
    ownerId: 'usr-owner-2',
    ownerName: 'Anjali Sharma',
    ownerPhone: '+13125559876',
    ownerWhatsapp: '13125559876',
    name: 'Thermo King Refrigerated Hauler',
    type: 'Refrigerated/Reefer',
    capacityTons: 12,
    basePricePerKm: 4.20,
    minPrice: 200,
    location: 'Los Angeles, CA',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    photoUrl: 'https://images.unsplash.com/photo-1590481487858-3c52b4cd4613?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    reviewsCount: 19,
    availabilityDates: [
      '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'
    ],
    isAvailable: true,
    licensePlate: 'LAX-REF-451'
  },
  {
    id: 'vh-4',
    ownerId: 'usr-owner-2',
    ownerName: 'Anjali Sharma',
    ownerPhone: '+13125559876',
    ownerWhatsapp: '13125559876',
    name: 'Isuzu NPR Cargo Van',
    type: 'Box Truck',
    capacityTons: 4.5,
    basePricePerKm: 1.80,
    minPrice: 75,
    location: 'Newark, NJ',
    coordinates: { lat: 40.7357, lng: -74.1724 },
    photoUrl: 'https://images.unsplash.com/photo-1516501224897-267352fc99b1?auto=format&fit=crop&q=80&w=600',
    rating: 4.5,
    reviewsCount: 8,
    availabilityDates: [
      '2026-06-13', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-22', '2026-06-23'
    ],
    isAvailable: true,
    licensePlate: 'NWK-BOX-104'
  },
  {
    id: 'vh-5',
    ownerId: 'usr-owner-1',
    ownerName: 'Marcus Vance',
    ownerPhone: '+14155556789',
    ownerWhatsapp: '14155556789',
    name: 'Peterbilt 579 Container Transporter',
    type: 'Container Carrier',
    capacityTons: 30,
    basePricePerKm: 4.80,
    minPrice: 300,
    location: 'Savannah, GA',
    coordinates: { lat: 32.0809, lng: -81.0912 },
    photoUrl: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=600',
    rating: 5.0,
    reviewsCount: 32,
    availabilityDates: [
      '2026-06-13', '2026-06-14', '2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25'
    ],
    isAvailable: true,
    licensePlate: 'SAV-CON-912'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    vehicleId: 'vh-1',
    companyName: 'Apex Distributors Ltd',
    rating: 5,
    comment: 'Exceptional response time. Marcus and his Volvo FH16 moved 22 tons of industrial generators smoothly. Clean cab and highly verified logs.',
    date: '2026-06-01'
  },
  {
    id: 'rev-2',
    vehicleId: 'vh-1',
    companyName: 'Global Timber Corp',
    rating: 4,
    comment: 'Great support, truck arrived right on time for pickup in Chicago. Rate was very competitive for container freight.',
    date: '2026-06-05'
  },
  {
    id: 'rev-3',
    vehicleId: 'vh-2',
    companyName: 'Pioneer Construction',
    rating: 5,
    comment: 'Highly efficient steel rod moving. The Kenworth T680 flatbed is in stellar condition. Marcus secured everything perfectly.',
    date: '2026-05-24'
  },
  {
    id: 'rev-4',
    vehicleId: 'vh-3',
    companyName: 'Fresh Farms Organics',
    rating: 5,
    comment: 'Anjali saved our supply chain! Temp logs were strictly at 3°C for our entire organic berry haul from LA. Highly recommended.',
    date: '2026-06-10'
  },
  {
    id: 'rev-5',
    vehicleId: 'vh-4',
    companyName: 'Local Express Courier',
    rating: 4,
    comment: 'Perfect local box truck for office movers in Jersey. Quick booking.',
    date: '2026-06-08'
  }
];
