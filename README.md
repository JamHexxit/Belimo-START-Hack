# Belimo START Hack 2026

Belimo START Hack 2026 is a monitoring and demo platform for Belimo actuator data. The project combines a Next.js frontend with an Express backend to register devices, organize them into rooms, inspect system status, and detect actuator health issues from live or simulated sensor data.

## What the project can do

- Show a dashboard with device count, online status, room overview, and recent alerts
- Register Belimo devices via InfluxDB connection details
- Edit and remove registered devices
- Create rooms and assign devices to them
- Define a room threshold that is used as the baseline for health analysis
- Check whether a device is reachable
- Read the latest actuator values from the backend
- Detect warning and error states such as elevated torque or jammed actuators
- Run fully offline with simulated actuator scenarios for demos
- Switch the UI language between English, German, and French
- Toggle between light and dark mode

## Project structure

```text
Belimo-START-Hack/
|-- backend/
|   |-- src/
|   |   |-- main.js            # Express API and health analysis
|   |   `-- collectData.js     # Helper script for recording sample data
|   |-- config/                # Created at runtime for devices and rooms
|   `-- collected_sensor_data.json
|-- frontend/
|   |-- app/
|   |   |-- components/        # Navbar, sidebar, cards, notifications
|   |   |-- context/           # Global app state
|   |   |-- lib/               # API client and translations
|   |   `-- views/             # Dashboard, devices, rooms, notifications
|   `-- public/
|-- README.md
`-- .gitignore
```

## Tech stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: Node.js, Express
- Data source: InfluxDB
- Styling: CSS with global theme variables

## How it works

The frontend talks to the backend over HTTP. Devices are stored by the backend in JSON config files and queried through InfluxDB. For demo use, the backend can also start in offline mode and generate simulated actuator behavior:

- healthy actuator
- calcified actuator with elevated torque
- jammed actuator with critical failure behavior

The backend evaluates incoming readings and classifies device health as:

- `healthy`
- `warning`
- `error`
- `unknown`

## Local setup

### Requirements

- Node.js 18 or newer
- npm

### 1. Start the backend

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:4000`.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

### 3. Connect frontend and backend

By default, the frontend expects the backend at `http://localhost:4000`.

If needed, set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Offline demo mode

For hackathon demos or testing without live hardware, start the backend in offline mode:

```bash
cd backend
npm run start:offline
```

In offline mode the backend will:

- load `backend/collected_sensor_data.json` if available
- otherwise generate simulated readings internally
- create demo devices automatically if no device config exists

## Backend API overview

### Rooms

- `POST /api/rooms` creates a room or updates one when `roomId` is provided
- `GET /api/rooms` returns all rooms
- `DELETE /api/rooms/:roomId` deletes a room and unassigns affected devices

### Devices

- `POST /api/devices` registers a device
- `PATCH /api/devices/:deviceId` updates room assignment or connection details
- `GET /api/devices` returns all devices
- `GET /api/devices/:deviceId/getInformations` returns latest readings plus health analysis
- `GET /api/devices/:deviceId/status` checks whether the device is online
- `DELETE /api/devices/:deviceId` removes a device

## Recorded data helper

The backend contains a helper script to collect actuator data and save it to `backend/collected_sensor_data.json`:

```bash
cd backend
npm run collect
```

This is useful for building or refreshing offline demo data.

## Notes

- Backend config files are created automatically in `backend/config/`
- Notifications are currently managed in frontend state and are not persisted
- The UI is implemented as a single-page app inside the Next.js app router

## Team

Array of Idiots
