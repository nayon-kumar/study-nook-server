# StudyNook Backend API

Backend server for the **StudyNook** room booking platform.  
Built with **Node.js**, **Express.js**, **MongoDB**, and **JWT Authentication**.

---

## 🌐 Live Server

👉 https://study-nook-server-liart.vercel.app/

---

## 🚀 Features

- User authentication with JWT verification
- Create, update, delete study rooms
- Search rooms by name
- Filter rooms by:
  - Minimum price
  - Maximum price
  - Amenities
- Get latest rooms
- Room booking system
- Prevent booking conflicts
- User-specific listings
- User-specific bookings
- Cancel bookings
- MongoDB database integration

---

## 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- JOSE (JWT Verification)
- dotenv
- cors

---

## 🔹 Base Route

### GET `/`

Check server status.

---

## 🔹 Get All Rooms

### GET `/rooms`

### Query Parameters

| Parameter | Description               |
| --------- | ------------------------- |
| search    | Search by room name       |
| minPrice  | Minimum price             |
| maxPrice  | Maximum price             |
| amenities | Comma-separated amenities |

### Example

```bash
/rooms?search=reading&minPrice=100&maxPrice=500&amenities=Wi-Fi,Projector
```

---

## 🔹 Get Latest 6 Rooms

### GET `/rooms/latest`

Returns latest 6 added rooms.

---

## 🔹 Add New Room

### POST `/rooms`

🔒 Protected Route

---

## 🔹 Get Single Room

### GET `/rooms/:id`

🔒 Protected Route

---

## 🔹 Update Room

### PATCH `/rooms/:id`

🔒 Protected Route

Updates room information and synced booking display fields.

---

## 🔹 Delete Room

### DELETE `/rooms/:id`

🔒 Protected Route

---

## 🔹 Get My Listings

### GET `/my-listings/:id`

🔒 Protected Route

Returns all rooms created by a specific user.

---

## 🔹 Create Booking

### POST `/bookings`

🔒 Protected Route

### Features

- Prevents overlapping bookings
- Automatically increases room booking count

---

## 🔹 Get My Bookings

### GET `/bookings/:id`

🔒 Protected Route

Returns all bookings of a user.

---

## 🔹 Cancel Booking

### PATCH `/bookings/cancel/:id`

🔒 Protected Route

---

## 🔐 Authentication

This backend uses JWT verification with `jose-cjs`.

Protected routes require:

```bash
Authorization: Bearer <token>
```

---
