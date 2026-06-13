# Security Specification: Transport Connect Firebase Hardening

## 1. Data Invariants

1. **User Identity Security**: Shippers and Owners can only create or update their own user profiles. Nobody can escalate their privilege level (e.g., changing their role to `admin`) via client writes.
2. **Vehicle Directory Integrity**: Only authenticated Owners can list vehicles, and they must be the listed owner (`ownerId == request.auth.uid`). No other roles can edit or delete vehicle profiles.
3. **Booking Flow Integrity**: Only Shippers (`role == 'company'`) can initiate a request. Owners (`role == 'owner'`) can only update status fields (`approved`, `declined`, `completed`). A booking's static fields (locations, cost, dates) are immutable once created.
4. **Reviews Legitimacy**: Reviews can only be created by signed-in users. Once created, a review is immutable.
5. **System Notifications Isolation**: Users can only read, write, or dismiss their own notifications.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 attack payloads must be actively rejected by our security layers:

### Payload 1: Role Escalation (Admin Privilege Spoof)
* **Goal**: A client tries to register as, or update their profile to an Admin.
* **Write**: `PATCH /users/attacker-uid`
* **Data**: `{ role: 'admin' }`
* **Result**: `Permission Denied`

### Payload 2: Identity Hijack (Vehicle Impersonation)
* **Goal**: An owner tries to list a vehicle but sets a different `ownerId` to spoof another operator.
* **Write**: `POST /vehicles/vh-1234`
* **Data**: `{ name: 'Mega Truck', ownerId: 'innocent-owner-uid', ... }`
* **Result**: `Permission Denied`

### Payload 3: Booking Price Manipulation
* **Goal**: A shipper tries to hijack/force-update price fields on an existing pending booking to zero.
* **Write**: `PATCH /bookings/bk-1111`
* **Data**: `{ totalFreightCost: 0 }`
* **Result**: `Permission Denied`

### Payload 4: Invalid Identifier Injection (Denial of Wallet)
* **Goal**: Send a 1MB string into a Firestore Document ID path variable to exceed storage/indexing bounds.
* **Write**: `POST /vehicles/invalid-extremely-long-string-over-128-characters...`
* **Result**: `Permission Denied`

### Payload 5: Anonymous Spam Posting
* **Goal**: An unauthenticated user tries to create a custom notification alert.
* **Write**: `POST /notifications/notif-999`
* **Data**: `{ title: 'Spam Alert', userId: 'usr-company-1', ... }`
* **Result**: `Permission Denied`

### Payload 6: Booking Status Bypass (Shipper Self-Approving)
* **Goal**: A shipper tries to bypass the carrier's consent by directly approving their own pending booking.
* **Write**: `PATCH /bookings/bk-2222`
* **Data**: `{ status: 'approved' }` (sent by companyId user instead of ownerId user)
* **Result**: `Permission Denied`

### Payload 7: Terminal State Workaround (Undoing Completed Booking)
* **Goal**: An owner tries to revert a `completed` or `declined` booking state back to `pending`.
* **Write**: `PATCH /bookings/bk-completed-333`
* **Data**: `{ status: 'pending' }`
* **Result**: `Permission Denied`

### Payload 8: Review Spoofing
* **Goal**: An unauthenticated bot tries to post a 1-star rating containing random comment blocks.
* **Write**: `POST /reviews/rev-toxic`
* **Data**: `{ vehicleId: 'vh-123', rating: 1, comment: 'Spam comment' }`
* **Result**: `Permission Denied`

### Payload 9: Notification Interception
* **Goal**: A competitor carrier tries to read notifications belonging to other operators.
* **Write**: `GET /notifications/notif-carrier-private`
* **Result**: `Permission Denied`

### Payload 10: Vehicle Availability Injection (Malicious Overwriting)
* **Goal**: An outsider tries to empty out a truck's entire schedule list.
* **Write**: `PATCH /vehicles/vh-target`
* **Data**: `{ availabilityDates: [] }` (sent by non-owner UID)
* **Result**: `Permission Denied`

### Payload 11: Future Timing Spoofing
* **Goal**: Tamper with custom creation dates using client local system time instead of server timestamp.
* **Write**: `POST /bookings/bk-4444`
* **Data**: `{ createdAt: '3026-06-13T00:00:00Z', ... }`
* **Result**: `Permission Denied`

### Payload 12: General Blanket Scrapes
* **Goal**: An authenticated user attempts a sweeping list queries over the whole private `/bookings` directory.
* **Write**: `GET /bookings` (as list query, with no filter checks)
* **Result**: `Permission Denied`

---

## 3. Verification Plan

The custom Firestore Rules will build and be tested against these exact threat scenarios. In typical environments, we run a full `firestore.rules.test.ts` suite via Node Jest. Since we are running in Vite Applet, we will define our full defensive, fortified rules in `firestore.rules`, use `eslint` to validate compile safety, and verify it live via our sandbox compiler check.
