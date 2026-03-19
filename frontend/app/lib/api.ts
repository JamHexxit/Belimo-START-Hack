// API client — maps ALL backend endpoints in main.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Device {
  deviceId: string;
  name: string;
  url: string;
  org: string;
  bucket: string;
  placeId: string | null;
}

export interface Company {
  companyId: string;
  name: string;
}

export interface Building {
  buildingId: string;
  name: string;
  companyId: string;
}

export interface Place {
  placeId: string;
  name: string;
  buildingId: string;
  type: string;
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
// HIERARCHY ENDPOINTS
// =========================================================

export async function getCompanies(): Promise<Company[]> {
  const res = await fetch(`${BASE_URL}/api/companies`);
  if (!res.ok) throw new Error('Failed to fetch companies');
  return res.json();
}

export async function createCompany(name: string): Promise<{ companyId: string }> {
  const res = await fetch(`${BASE_URL}/api/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create company');
  return res.json();
}

export async function updateCompany(companyId: string, name: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/companies/${companyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update company');
}

export async function deleteCompany(companyId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/companies/${companyId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete company');
}

export async function getBuildings(): Promise<Building[]> {
  const res = await fetch(`${BASE_URL}/api/buildings`);
  if (!res.ok) throw new Error('Failed to fetch buildings');
  return res.json();
}

export async function createBuilding(name: string, companyId: string): Promise<{ buildingId: string }> {
  const res = await fetch(`${BASE_URL}/api/buildings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, companyId }),
  });
  if (!res.ok) throw new Error('Failed to create building');
  return res.json();
}

export async function updateBuilding(buildingId: string, data: { name?: string; companyId?: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/buildings/${buildingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update building');
}

export async function deleteBuilding(buildingId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/buildings/${buildingId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete building');
}

export async function getPlaces(): Promise<Place[]> {
  const res = await fetch(`${BASE_URL}/api/places`);
  if (!res.ok) throw new Error('Failed to fetch places');
  return res.json();
}

export async function createPlace(data: {
  name: string;
  buildingId: string;
  type?: string;
  threshold?: number;
}): Promise<{ placeId: string; place: Place }> {
  const res = await fetch(`${BASE_URL}/api/places`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create place');
  return res.json();
}

export async function updatePlace(
  placeId: string,
  data: {
    name?: string;
    buildingId?: string;
    type?: string;
    threshold?: number;
  }
): Promise<{ placeId: string; place: Place }> {
  const res = await fetch(`${BASE_URL}/api/places/${placeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update place');
  return res.json();
}

export async function deletePlace(placeId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/places/${placeId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete place');
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
  placeId?: string;
  name?: string;
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

/** PATCH /api/devices/:deviceId — change room assignment or connection */
export async function updateDevice(
  deviceId: string,
  data: {
    placeId?: string | null;
    name?: string;
    influxUrl?: string;
    influxToken?: string;
    org?: string;
    bucket?: string;
  }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update device');
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
export interface DeviceInfoResponse {
  data: DeviceInfo[];
  health?: {
    status: string;
    message: string;
  };
}

export async function getDeviceInfo(deviceId: string): Promise<DeviceInfoResponse> {
  const res = await fetch(
    `${BASE_URL}/api/devices/${deviceId}/getInformations`,
  );
  if (!res.ok) throw new Error('Failed to fetch device info');
  return res.json();
}

/**
 * GET /api/devices/:deviceId/status
 * checks if the device is online or offline
 */
export async function isDeviceOnline(deviceId: string): Promise<boolean>{
  const res = await fetch(`${BASE_URL}/api/devices/${deviceId}/status`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.status === 'online';
}
