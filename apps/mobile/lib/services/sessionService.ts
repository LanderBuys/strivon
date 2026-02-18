import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const ACTIVE_SESSIONS_KEY = '@strivon_active_sessions';
const CURRENT_SESSION_ID_KEY = '@strivon_current_session_id';

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  ipAddress: string;
  createdAt: string;
}

// Get device name
const getDeviceName = (): string => {
  if (Platform.OS === 'ios') {
    return Device.deviceName || Device.modelName || 'iOS Device';
  } else {
    return Device.modelName || Device.deviceName || 'Android Device';
  }
};

// Get approximate location (in real app, use geolocation API)
const getLocation = (): string => {
  // For demo, return a generic location
  // In production, use expo-location to get real location
  return 'Unknown Location';
};

// Get IP address (in real app, this would come from the server)
const getIPAddress = (): string => {
  // For demo, return a placeholder
  // In production, get from API or network info
  return 'N/A';
};

// Format time ago
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return then.toLocaleDateString();
  }
};

/**
 * Initialize or update current session
 */
export async function initializeCurrentSession(): Promise<ActiveSession> {
  try {
    // Check if we have a current session ID
    let currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_ID_KEY);
    const allSessions = await getAllSessions();

    if (currentSessionId) {
      // Update existing session
      const sessionIndex = allSessions.findIndex(s => s.id === currentSessionId);
      if (sessionIndex !== -1) {
        allSessions[sessionIndex].lastActive = new Date().toISOString();
        allSessions[sessionIndex].isCurrent = true;
        // Mark others as not current
        allSessions.forEach((s, i) => {
          if (i !== sessionIndex) s.isCurrent = false;
        });
        await AsyncStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(allSessions));
        return allSessions[sessionIndex];
      }
    }

    // Create new session
    const newSession: ActiveSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      device: getDeviceName(),
      location: getLocation(),
      lastActive: new Date().toISOString(),
      isCurrent: true,
      ipAddress: getIPAddress(),
      createdAt: new Date().toISOString(),
    };

    // Mark all other sessions as not current
    allSessions.forEach(s => s.isCurrent = false);
    allSessions.unshift(newSession);

    // Keep only last 10 sessions
    const limitedSessions = allSessions.slice(0, 10);

    await AsyncStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(limitedSessions));
    await AsyncStorage.setItem(CURRENT_SESSION_ID_KEY, newSession.id);

    return newSession;
  } catch (error) {
    console.error('Error initializing session:', error);
    throw error;
  }
}

/**
 * Update last active timestamp for current session
 */
export async function updateLastActive(): Promise<void> {
  try {
    const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!currentSessionId) {
      await initializeCurrentSession();
      return;
    }

    const allSessions = await getAllSessions();
    const sessionIndex = allSessions.findIndex(s => s.id === currentSessionId);
    
    if (sessionIndex !== -1) {
      allSessions[sessionIndex].lastActive = new Date().toISOString();
      await AsyncStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(allSessions));
    }
  } catch (error) {
    console.error('Error updating last active:', error);
  }
}

/**
 * Get all active sessions
 */
export async function getAllSessions(): Promise<ActiveSession[]> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_SESSIONS_KEY);
    if (stored) {
      const sessions: ActiveSession[] = JSON.parse(stored);
      // Format lastActive for display
      return sessions.map(s => ({
        ...s,
        lastActive: formatTimeAgo(s.lastActive),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  try {
    const allSessions = await getAllSessions();
    const updated = allSessions.filter(s => s.id !== sessionId);
    
    // If revoking current session, clear the current session ID
    const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (currentSessionId === sessionId) {
      await AsyncStorage.removeItem(CURRENT_SESSION_ID_KEY);
    }
    
    await AsyncStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllOtherSessions(): Promise<void> {
  try {
    const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_ID_KEY);
    if (!currentSessionId) {
      await AsyncStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify([]));
      return;
    }

    const allSessions = await getAllSessions();
    const currentSession = allSessions.find(s => s.id === currentSessionId);
    
    if (currentSession) {
      await AsyncStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify([currentSession]));
    } else {
      await AsyncStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    throw error;
  }
}
