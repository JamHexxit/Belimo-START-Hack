// API client — maps ALL backend endpoints in main.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Device {
  deviceId: string;
  url: string;
  org: string;
  bucket: string;
  roomId: string | null;
}

export interface Room {
  roomId: string;
  name: string;
  threshold: number;
}

export interface DeviceInfo {
  [key: string]: unknown;
  _measurement?: string;
  _field?: string;
  _value?: number | string;
  _time?: string;
}

// =========================================================
// ROOM ENDPOINTS
// POST /api/rooms          → createRoom (also updates if roomId provided)
// GET  /api/rooms          → getRooms
// DELETE /api/rooms/:id   → deleteRoom
// =========================================================

export async function getRooms(): Promise<Room[]> {
  const res = await fetch(`${BASE_URL}/api/rooms`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

/** Create a new room (no roomId → auto-generated) */
export async function createRoom(
  name: string,
  threshold = 0,
): Promise<{ roomId: string; room: Room }> {
  const res = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, threshold }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create room');
  }
  return res.json();
}

/** Update an existing room by supplying its roomId */
export async function updateRoom(
  roomId: string,
  name: string,
  threshold = 0,
): Promise<{ roomId: string; room: Room }> {
  const res = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, name, threshold }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update room');
  }
  return res.json();
}

export async function deleteRoom(roomId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/rooms/${roomId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete room');
}

// =========================================================
// DEVICE ENDPOINTS
// POST   /api/devices                         → addDevice
// GET    /api/devices                         → getDevices
// PATCH  /api/devices/:id                     → updateDeviceRoom
// GET    /api/devices/:id/getInformations     → getDeviceInfo
// DELETE /api/devices/:id                     → deleteDevice
// =========================================================

export async function getDevices(): Promise<Device[]> {
  const res = await fetch(`${BASE_URL}/api/devices`);
  if (!res.ok) throw new Error('Failed to fetch devices');
  return res.json();
}

export async function addDevice(data: {
  influxUrl: string;
  influxToken: string;
  org: string;
  bucket: string;
  roomId?: string;
}): Promise<{ deviceId: string }> {
  const res = await fetch(`${BASE_URL}/api/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add device');
  }
  return res.json();
}

/** PATCH /api/devices/:deviceId — change room assignment (null to unassign) */
export async function updateDeviceRoom(
  deviceId: string,
  roomId: string | null,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId }),
  });
  if (!res.ok) throw new Error('Failed to update device room');
}

/** DELETE /api/devices/:deviceId */
export async function deleteDevice(deviceId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete device');
}

/**
 * GET /api/devices/:deviceId/getInformations
 * Queries the last 10 minutes of actuator-data bucket.
 */
export async function getDeviceInfo(deviceId: string): Promise<DeviceInfo[]> {
  const res = await fetch(
    `${BASE_URL}/api/devices/${deviceId}/getInformations`,
  );
  if (!res.ok) throw new Error('Failed to fetch device info');
  return res.json();
}
