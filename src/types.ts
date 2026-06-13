export type UserRole = 'company' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  companyName?: string;
  whatsappNumber?: string;
}

export type VehicleType = 'Semi-Trailer' | 'Flatbed' | 'Refrigerated/Reefer' | 'Box Truck' | 'Container Carrier' | 'Car Carrier';

export interface Vehicle {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  name: string;
  type: VehicleType;
  capacityTons: number;
  basePricePerKm: number;
  minPrice: number;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photoUrl: string;
  rating: number;
  reviewsCount: number;
  availabilityDates: string[]; // ISO Strings of available dates YYYY-MM-DD
  isAvailable: boolean;
  licensePlate: string;
}

export type BookingStatus = 'pending' | 'approved' | 'declined' | 'completed';

export interface Booking {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleType: VehicleType;
  vehiclePhoto: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  companyId: string;
  companyName: string;
  pickupLocation: string;
  dropLocation: string;
  pickupCoords: { lat: number; lng: number };
  dropCoords: { lat: number; lng: number };
  distanceKm: number;
  bookingDate: string; // YYYY-MM-DD
  totalFreightCost: number;
  status: BookingStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  vehicleId: string;
  companyName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Notification {
  id: string;
  userId: string; // recipient
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'booking_request' | 'booking_status' | 'general' | 'review';
}
