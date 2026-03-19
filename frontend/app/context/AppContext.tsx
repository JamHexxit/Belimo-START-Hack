'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { getDevices, getRooms, Device, Room } from '../lib/api';

// ===== Notification Types =====
export type NotifType = 'info' | 'success' | 'warning' | 'error';

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
  rooms: Room[];
  notifications: Notification[];
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  refreshDevices: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  addNotification: (type: NotifType, title: string, message: string) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  unreadCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
      addNotification('error', 'Connection Error', 'Could not reach the backend. Is the server running on port 3000?');
    }
  }, [addNotification]);

  const refreshRooms = useCallback(async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch {
      // silently fail for rooms
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
      await Promise.all([refreshDevices(), refreshRooms()]);
      setIsLoading(false);
    };
    init();
    const interval = setInterval(() => {
      refreshDevices();
      refreshRooms();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshDevices, refreshRooms]);

  return (
    <AppContext.Provider value={{
      devices, rooms, notifications, isLoading, theme, toggleTheme,
      refreshDevices, refreshRooms, addNotification,
      markAllRead, clearNotification, unreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
