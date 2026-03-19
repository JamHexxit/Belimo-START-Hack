'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { getDevices, getCompanies, getBuildings, getPlaces, Device, Company, Building, Place } from '../lib/api';

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
  addNotification: (type: NotifType, title: string, message: string) => void;
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

  const addNotification = useCallback((type: NotifType, title: string, message: string) => {
    const notif: Notification = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const data = await getDevices();
      setDevices(data);
    } catch {
      addNotification('error', 'Connection Error', 'Could not reach the backend.');
    }
  }, [addNotification]);

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
    setNotifications([]);
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

  return (
    <AppContext.Provider value={{
      devices, companies, buildings, places, notifications, isLoading, theme, toggleTheme,
      language, setLanguage,
      refreshDevices, refreshHierarchy, refreshRooms: refreshHierarchy, // Compatibility
      addNotification,
      markAllRead, clearNotification, unreadCount,
      selectedCompanyId, setSelectedCompanyId,
      selectedBuildingId, setSelectedBuildingId,
      selectedPlaceId, setSelectedPlaceId,
      rooms: places, // Compatibility
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
