'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { getDevices, getCompanies, getBuildings, getPlaces, getDeviceInfo, isDeviceOnline, Device, Company, Building, Place } from '../lib/api';

// ===== Notification Types =====
export type NotifType = 'info' | 'success' | 'warning' | 'error';
export type Language = 'en' | 'de' | 'fr';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  deviceId?: string;
  placeId?: string | null;
  buildingId?: string | null;
  companyId?: string | null;
}

// ===== App Context =====
interface AppContextValue {
  devices: Device[];
  companies: Company[];
  buildings: Building[];
  places: Place[];
  notifications: Notification[];
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  refreshDevices: () => Promise<void>;
  refreshHierarchy: () => Promise<void>;
  addNotification: (type: NotifType, title: string, message: string, meta?: { deviceId?: string; placeId?: string | null; buildingId?: string | null; companyId?: string | null }) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  unreadCount: number;

  // New Selection State
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;

  // Background Health & Status State
  deviceHealth: Record<string, { status: string; message: string }>;
  deviceStatuses: Record<string, boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('en');

  const [deviceHealth, setDeviceHealth] = useState<Record<string, { status: string; message: string }>>({});
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, boolean>>({});
  
  // Keep track of which notifications have been triggered per device so we don't spam
  const notifiedHealthRef = useRef<Record<string, string>>({});
  const notifiedStatusRef = useRef<Record<string, boolean>>({});

  // Selection States
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  const addNotification = useCallback((type: NotifType, title: string, message: string, meta?: { deviceId?: string; placeId?: string | null; buildingId?: string | null; companyId?: string | null }) => {
    setNotifications(prev => {
      // Prevent duplicate identical unread notifications
      const isDuplicate = prev.some(n => n.title === title && n.message === message && !n.read);
      if (isDuplicate) return prev;

      const notif: Notification = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        deviceId: meta?.deviceId,
        placeId: meta?.placeId ?? null,
        buildingId: meta?.buildingId ?? null,
        companyId: meta?.companyId ?? null,
      };
      return [notif, ...prev].slice(0, 50);
    });
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const data = await getDevices();
      setDevices(data);
    } catch {
      // Silent fail on interval
    }
  }, []);

  const refreshHierarchy = useCallback(async () => {
    try {
      const [c, b, p] = await Promise.all([getCompanies(), getBuildings(), getPlaces()]);
      setCompanies(c);
      setBuildings(b);
      setPlaces(p);
    } catch {
      // fail silently
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([refreshDevices(), refreshHierarchy()]);
      setIsLoading(false);
    };
    init();
    const interval = setInterval(() => {
      refreshDevices();
      refreshHierarchy();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshDevices, refreshHierarchy]);

  // Background Health Polling
  useEffect(() => {
    if (devices.length === 0) return;

    let active = true;
    const pollHealth = async () => {
      const newHealth: Record<string, { status: string; message: string }> = {};
      const newStatuses: Record<string, boolean> = {};
      
      await Promise.all(devices.map(async (device) => {
        try {
          const isOnline = await isDeviceOnline(device.deviceId);
          newStatuses[device.deviceId] = isOnline;

          const previousOnlineStatus = notifiedStatusRef.current[device.deviceId];
          if (isOnline && previousOnlineStatus === false) {
             // Recovered online
             notifiedStatusRef.current[device.deviceId] = true;
          } else if (!isOnline && previousOnlineStatus !== false) {
             // Went offline
             const place = places.find(p => p.placeId === device.placeId);
             const building = place ? buildings.find(b => b.buildingId === place.buildingId) : undefined;
             const company = building ? companies.find(c => c.companyId === building.companyId) : undefined;
             addNotification('error', 'Device Offline', `Device "${device.name}" has lost connection.`, {
               deviceId: device.deviceId,
               placeId: device.placeId,
               buildingId: building?.buildingId ?? null,
               companyId: company?.companyId ?? null,
             });
             notifiedStatusRef.current[device.deviceId] = false;
          } else if (previousOnlineStatus === undefined) {
             // First time setting
             notifiedStatusRef.current[device.deviceId] = isOnline;
          }

          if (isOnline) {
            const info = await getDeviceInfo(device.deviceId);
            if (info && info.health && active) {
              newHealth[device.deviceId] = info.health;

              const previousNotifiedStatus = notifiedHealthRef.current[device.deviceId];
              
              // Trigger global notification if needed and if it hasn't been triggered yet
              if ((info.health.status === 'error' || info.health.status === 'warning') && previousNotifiedStatus !== info.health.status) {
                const type = info.health.status === 'error' ? 'error' : 'warning';
                const title = info.health.status === 'error' ? 'Critical Malfunction' : 'Predictive Warning';
                const place = places.find(p => p.placeId === device.placeId);
                const building = place ? buildings.find(b => b.buildingId === place.buildingId) : undefined;
                const company = building ? companies.find(c => c.companyId === building.companyId) : undefined;
                addNotification(type, title, `Device "${device.name}": ${info.health.message}`, {
                  deviceId: device.deviceId,
                  placeId: device.placeId,
                  buildingId: building?.buildingId ?? null,
                  companyId: company?.companyId ?? null,
                });

                // Mark as notified for this specific error/warning state
                notifiedHealthRef.current[device.deviceId] = info.health.status;
              } else if (info.health.status === 'healthy' && previousNotifiedStatus && previousNotifiedStatus !== 'healthy') {
                // If it recovered, reset the tracking so it can notify again if it fails later
                 notifiedHealthRef.current[device.deviceId] = 'healthy';
              }
            }
          }
        } catch (e) {
            // Ignore offline devices for this specific background check so we don't spam errors
            newStatuses[device.deviceId] = false;
        }
      }));

      if (active) {
        setDeviceHealth(newHealth);
        setDeviceStatuses(newStatuses);
      }
    };

    pollHealth(); // Run immediately

    // Poll every 5 seconds to catch live offline simulation changes quickly
    const interval = setInterval(pollHealth, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [devices, addNotification]);

  return (
    <AppContext.Provider value={{
      devices, companies, buildings, places, notifications, isLoading, theme, toggleTheme,
      language, setLanguage,
      refreshDevices, refreshHierarchy,
      addNotification,
      markAllRead, clearNotification, unreadCount,
      selectedCompanyId, setSelectedCompanyId,
      selectedBuildingId, setSelectedBuildingId,
      selectedPlaceId, setSelectedPlaceId,
      deviceHealth,
      deviceStatuses
    } as any}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
