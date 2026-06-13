import { Vehicle, Booking, Review, Notification, User, UserRole, BookingStatus } from './types';
import { INITIAL_USERS, INITIAL_VEHICLES, INITIAL_REVIEWS } from './data';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

// Key names for storage
const STORAGE_KEYS = {
  USERS: 'tc_users',
  VEHICLES: 'tc_vehicles',
  BOOKINGS: 'tc_bookings',
  REVIEWS: 'tc_reviews',
  NOTIFICATIONS: 'tc_notifications',
  CURRENT_USER_ID: 'tc_current_user_id',
};

// Initialize Storage Helpers
function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage key ' + key, e);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage key ' + key, e);
  }
}

export class TransportStore {
  private users: User[];
  private vehicles: Vehicle[];
  private bookings: Booking[];
  private reviews: Review[];
  private notifications: Notification[];
  private currentUserId: string;
  private listeners: (() => void)[] = [];

  constructor() {
    this.users = getStoredItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.vehicles = getStoredItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    this.bookings = getStoredItem<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
    this.reviews = getStoredItem<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    this.notifications = getStoredItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, [
      {
        id: 'notif-1',
        userId: 'usr-company-1',
        title: 'Welcome to Transport Connect!',
        message: 'Search vehicles, pick routes with distance calculation, and book elite carriers directly.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        type: 'general'
      }
    ]);
    this.currentUserId = getStoredItem<string>(STORAGE_KEYS.CURRENT_USER_ID, 'usr-company-1');

    // Run remote synchronizer asynchronously
    this.syncFromFirestore();
  }

  // Reactive subscription system
  public onSync(callback: () => void): () => void {
    this.listeners.push(callback);
    // Trigger immediately in case store was already loaded
    try {
      callback();
    } catch {}
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private triggerListeners(): void {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (e) {
        console.error('Listener callback error', e);
      }
    });
  }

  // Seeding and Downloading database asynchronously
  public async syncFromFirestore(): Promise<void> {
    try {
      // 1. Synchronize Users
      const usersSnap = await getDocs(collection(db, 'users')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'users');
        throw err;
      });
      if (usersSnap.empty) {
        const batch: Promise<void>[] = [];
        for (const u of INITIAL_USERS) {
          batch.push(
            setDoc(doc(db, 'users', u.id), u).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`);
            })
          );
        }
        await Promise.all(batch);
        this.users = INITIAL_USERS;
      } else {
        this.users = usersSnap.docs.map(d => d.data() as User);
      }

      // 2. Synchronize Vehicles
      const vehiclesSnap = await getDocs(collection(db, 'vehicles')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'vehicles');
        throw err;
      });
      if (vehiclesSnap.empty) {
        const batch: Promise<void>[] = [];
        for (const v of INITIAL_VEHICLES) {
          batch.push(
            setDoc(doc(db, 'vehicles', v.id), v).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `vehicles/${v.id}`);
            })
          );
        }
        await Promise.all(batch);
        this.vehicles = INITIAL_VEHICLES;
      } else {
        this.vehicles = vehiclesSnap.docs.map(d => d.data() as Vehicle);
      }

      // 3. Synchronize Bookings
      const bookingsSnap = await getDocs(collection(db, 'bookings')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'bookings');
        throw err;
      });
      this.bookings = bookingsSnap.docs
        .map(d => d.data() as Booking)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      // 4. Synchronize Reviews
      const reviewsSnap = await getDocs(collection(db, 'reviews')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'reviews');
        throw err;
      });
      if (reviewsSnap.empty) {
        const batch: Promise<void>[] = [];
        for (const r of INITIAL_REVIEWS) {
          batch.push(
            setDoc(doc(db, 'reviews', r.id), r).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `reviews/${r.id}`);
            })
          );
        }
        await Promise.all(batch);
        this.reviews = INITIAL_REVIEWS;
      } else {
        this.reviews = reviewsSnap.docs
          .map(d => d.data() as Review)
          .sort((a, b) => b.date.localeCompare(a.date));
      }

      // 5. Synchronize Notifications
      const notificationsSnap = await getDocs(collection(db, 'notifications')).catch(err => {
        handleFirestoreError(err, OperationType.GET, 'notifications');
        throw err;
      });
      if (notificationsSnap.empty) {
        const defaultNotif: Notification = {
          id: 'notif-1',
          userId: 'usr-company-1',
          title: 'Welcome to Transport Connect!',
          message: 'Search vehicles, pick routes with distance calculation, and book elite carriers directly.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          type: 'general'
        };
        await setDoc(doc(db, 'notifications', defaultNotif.id), defaultNotif).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `notifications/notif-1`);
        });
        this.notifications = [defaultNotif];
      } else {
        this.notifications = notificationsSnap.docs
          .map(d => d.data() as Notification)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }

      // Save snapshots back to localStorage
      setStoredItem(STORAGE_KEYS.USERS, this.users);
      setStoredItem(STORAGE_KEYS.VEHICLES, this.vehicles);
      setStoredItem(STORAGE_KEYS.BOOKINGS, this.bookings);
      setStoredItem(STORAGE_KEYS.REVIEWS, this.reviews);
      setStoredItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

      // Trigger reactive UI re-renders
      this.triggerListeners();
    } catch (e) {
      console.error('Failed to sync state from Firestore', e);
    }
  }

  // Auth Operations
  public getUsers(): User[] {
    return this.users;
  }

  public getCurrentUser(): User {
    const user = this.users.find(u => u.id === this.currentUserId);
    if (!user) {
      return this.users[0] || INITIAL_USERS[0];
    }
    return user;
  }

  public setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    setStoredItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    this.triggerListeners();
  }

  public registerUser(
    name: string,
    email: string,
    role: UserRole,
    phone: string,
    companyName?: string,
    whatsappNumber?: string
  ): User {
    const id = `usr-${role}-${Date.now()}`;
    const newUser: User = {
      id,
      name,
      email,
      role,
      phone,
      companyName,
      whatsappNumber: whatsappNumber || phone.replace('+', '')
    };
    this.users.push(newUser);
    setStoredItem(STORAGE_KEYS.USERS, this.users);
    this.currentUserId = id;
    setStoredItem(STORAGE_KEYS.CURRENT_USER_ID, id);

    // Save user to Firestore asynchronously
    setDoc(doc(db, 'users', newUser.id), newUser).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `users/${newUser.id}`);
    });

    // Send Welcome Notification
    this.createNotification(
      id,
      'Account Created Successfully',
      `Welcome ${name}! Setup profile filters and explore features tailored for ${role}s.`,
      'general'
    );

    this.triggerListeners();
    return newUser;
  }

  // Vehicle Operations
  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public addVehicle(vehicleData: Omit<Vehicle, 'id' | 'rating' | 'reviewsCount' | 'isAvailable'>): Vehicle {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `vh-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      isAvailable: true
    };
    this.vehicles.unshift(newVehicle);
    setStoredItem(STORAGE_KEYS.VEHICLES, this.vehicles);

    // Save vehicle to Firestore asynchronously
    setDoc(doc(db, 'vehicles', newVehicle.id), newVehicle).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${newVehicle.id}`);
    });

    // Notify administrator
    const admin = this.users.find(u => u.role === 'admin');
    if (admin) {
      this.createNotification(
        admin.id,
        'New Vehicle Approved',
        `A new ${newVehicle.type} ("${newVehicle.name}") was listed by ${newVehicle.ownerName}.`,
        'booking_request'
      );
    }

    this.triggerListeners();
    return newVehicle;
  }

  public updateVehicleAvailability(vehicleId: string, dates: string[]): void {
    this.vehicles = this.vehicles.map(v => {
      if (v.id === vehicleId) {
        return { ...v, availabilityDates: dates };
      }
      return v;
    });
    setStoredItem(STORAGE_KEYS.VEHICLES, this.vehicles);

    // Update vehicle availability to Firestore asynchronously
    updateDoc(doc(db, 'vehicles', vehicleId), { availabilityDates: dates }).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${vehicleId}`);
    });

    this.triggerListeners();
  }

  // Booking Operations
  public getBookings(): Booking[] {
    return this.bookings;
  }

  public createBooking(bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>): Booking {
    const id = `bk-${Date.now()}`;
    const newBooking: Booking = {
      ...bookingData,
      id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.bookings.unshift(newBooking);
    setStoredItem(STORAGE_KEYS.BOOKINGS, this.bookings);

    // Save booking to Firestore asynchronously
    setDoc(doc(db, 'bookings', newBooking.id), newBooking).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `bookings/${newBooking.id}`);
    });

    // Block the booking date from vehicle availability list
    this.vehicles = this.vehicles.map(v => {
      if (v.id === bookingData.vehicleId) {
        const updatedDates = v.availabilityDates.filter(d => d !== bookingData.bookingDate);
        
        // Update vehicle dates on Firestore asynchronously
        updateDoc(doc(db, 'vehicles', v.id), { availabilityDates: updatedDates }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `vehicles/${v.id}`);
        });

        return {
          ...v,
          availabilityDates: updatedDates
        };
      }
      return v;
    });
    setStoredItem(STORAGE_KEYS.VEHICLES, this.vehicles);

    // Create Notification and trigger Alerts
    this.createNotification(
      bookingData.ownerId,
      'New Booking Request Received',
      `Company "${bookingData.companyName}" requested your ${bookingData.vehicleType} on ${bookingData.bookingDate}. Check pending actions.`,
      'booking_request'
    );

    this.createNotification(
      bookingData.companyId,
      'Booking Request Sent',
      `Your booking request for "${bookingData.vehicleName}" on ${bookingData.bookingDate} is pending owner confirmation.`,
      'booking_status'
    );

    this.triggerListeners();
    return newBooking;
  }

  public updateBookingStatus(bookingId: string, status: BookingStatus): void {
    this.bookings = this.bookings.map(b => {
      if (b.id === bookingId) {
        const updated = { ...b, status };

        // Save booking status to Firestore asynchronously
        updateDoc(doc(db, 'bookings', bookingId), { status }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
        });
        
        // Notify company
        this.createNotification(
          b.companyId,
          `Booking ${status === 'approved' ? 'Approved' : status === 'completed' ? 'Completed' : 'Declined'}`,
          status === 'approved' 
            ? `Your booking for "${b.vehicleName}" on ${b.bookingDate} has been Approved! You can now contact the owner via WhatsApp.`
            : status === 'completed'
            ? `Your cargo delivery with "${b.vehicleName}" on ${b.bookingDate} was checked as Completed. Please leave a rating!`
            : `Your booking for "${b.vehicleName}" on ${b.bookingDate} was declined. Availability has been updated.`,
          'booking_status'
        );

        // If declined, restore vehicle availability date
        if (status === 'declined') {
          this.vehicles = this.vehicles.map(v => {
            if (v.id === b.vehicleId && !v.availabilityDates.includes(b.bookingDate)) {
              const updatedDates = [...v.availabilityDates, b.bookingDate].sort();
              
              // Update vehicle dates on Firestore asynchronously
              updateDoc(doc(db, 'vehicles', v.id), { availabilityDates: updatedDates }).catch(err => {
                handleFirestoreError(err, OperationType.WRITE, `vehicles/${v.id}`);
              });

              return {
                ...v,
                availabilityDates: updatedDates
              };
            }
            return v;
          });
          setStoredItem(STORAGE_KEYS.VEHICLES, this.vehicles);
        }

        return updated;
      }
      return b;
    });
    setStoredItem(STORAGE_KEYS.BOOKINGS, this.bookings);
    this.triggerListeners();
  }

  // Reviews Operations
  public getReviews(vehicleId?: string): Review[] {
    if (vehicleId) {
      return this.reviews.filter(r => r.vehicleId === vehicleId);
    }
    return this.reviews;
  }

  public addReview(vehicleId: string, companyName: string, rating: number, comment: string): Review {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      vehicleId,
      companyName,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    };
    this.reviews.unshift(newReview);
    setStoredItem(STORAGE_KEYS.REVIEWS, this.reviews);

    // Save review to Firestore asynchronously
    setDoc(doc(db, 'reviews', newReview.id), newReview).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `reviews/${newReview.id}`);
    });

    // Recalculate vehicle rating
    const vehicleReviews = this.reviews.filter(r => r.vehicleId === vehicleId);
    const avgRating = Number(
      (vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length).toFixed(1)
    );

    this.vehicles = this.vehicles.map(v => {
      if (v.id === vehicleId) {
        // Update vehicle rating on Firestore asynchronously
        updateDoc(doc(db, 'vehicles', v.id), { rating: avgRating, reviewsCount: vehicleReviews.length }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `vehicles/${v.id}`);
        });

        return {
          ...v,
          rating: avgRating,
          reviewsCount: vehicleReviews.length
        };
      }
      return v;
    });
    setStoredItem(STORAGE_KEYS.VEHICLES, this.vehicles);

    this.triggerListeners();
    return newReview;
  }

  // Notification Operations
  public getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  public createNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type']
  ): Notification {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      type
    };
    this.notifications.unshift(newNotif);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    // Save notification to Firestore asynchronously
    setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`);
    });

    this.triggerListeners();
    return newNotif;
  }

  public markNotificationsAsRead(userId: string): void {
    this.notifications = this.notifications.map(n => {
      if (n.userId === userId) {
        if (!n.read) {
          // Update notification to Firestore asynchronously
          updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `notifications/${n.id}`);
          });
        }
        return { ...n, read: true };
      }
      return n;
    });
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.triggerListeners();
  }

  // System Reset (for easier testing environment)
  public async factoryReset(): Promise<void> {
    localStorage.clear();
    this.users = INITIAL_USERS;
    this.vehicles = INITIAL_VEHICLES;
    this.bookings = [];
    this.reviews = INITIAL_REVIEWS;
    this.notifications = [
      {
        id: 'notif-1',
        userId: 'usr-company-1',
        title: 'System Factory Reset',
        message: 'All booking logs cleared and database has synced back to initial setups.',
        createdAt: new Date().toISOString(),
        read: false,
        type: 'general'
      }
    ];
    this.currentUserId = 'usr-company-1';
    
    setStoredItem(STORAGE_KEYS.USERS, this.users);
    setStoredItem(STORAGE_KEYS.VEHICLES, this.vehicles);
    setStoredItem(STORAGE_KEYS.BOOKINGS, this.bookings);
    setStoredItem(STORAGE_KEYS.REVIEWS, this.reviews);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    setStoredItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);

    this.triggerListeners();

    // Reset and sync Firestore asynchronously
    try {
      const batchPromises: Promise<void>[] = [];
      for (const u of INITIAL_USERS) {
        batchPromises.push(setDoc(doc(db, 'users', u.id), u).catch(() => {}));
      }
      for (const v of INITIAL_VEHICLES) {
        batchPromises.push(setDoc(doc(db, 'vehicles', v.id), v).catch(() => {}));
      }
      for (const r of INITIAL_REVIEWS) {
        batchPromises.push(setDoc(doc(db, 'reviews', r.id), r).catch(() => {}));
      }
      batchPromises.push(setDoc(doc(db, 'notifications', 'notif-1'), this.notifications[0]).catch(() => {}));
      await Promise.all(batchPromises);
    } catch (e) {
      console.error('Error during Firestore factory reset', e);
    }
  }
}
