// ============================================================================
// ░░ PANEL PERSISTENCE HOOK ░░
// Saves/loads panels, connections, and config to/from localStorage
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { FloatingPanelData, PanelConnection, PhysicsConfig } from '@/types/grid';
import { DEFAULT_CONFIG } from '@/constants/grid';

const STORAGE_KEY = 'grid-playground-state';

// ░░ Persisted State Shape ░░
interface PersistedState {
  panels: FloatingPanelData[];
  connections: PanelConnection[];
  panelIdCounter: number;
  config: PhysicsConfig;
}

// ░░ Load initial state from localStorage ░░
const getInitialState = (): PersistedState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PersistedState;
      return {
        ...parsed,
        panels: (parsed.panels || []).filter(p => !p.isExiting),
        // Merge with defaults to handle new config fields added in updates
        config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { panels: [], connections: [], panelIdCounter: 0, config: DEFAULT_CONFIG };
};

export function usePanelPersistence() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [panels, setPanels] = useState<FloatingPanelData[]>([]);
  const [connections, setConnections] = useState<PanelConnection[]>([]);
  const [panelIdCounter, setPanelIdCounter] = useState(0);
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_CONFIG);

  // ░░ Load from localStorage on mount ░░
  useEffect(() => {
    const state = getInitialState();
    setPanels(state.panels);
    setConnections(state.connections);
    setPanelIdCounter(state.panelIdCounter);
    setConfig(state.config);
    setIsLoaded(true);
  }, []);

  // ░░ Save to localStorage on changes ░░
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const state: PersistedState = {
        panels: panels.filter(p => !p.isExiting),
        connections,
        panelIdCounter,
        config,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [panels, connections, panelIdCounter, config, isLoaded]);

  // ░░ Clear all panel/connection data (preserves config) ░░
  const clearAllData = useCallback(() => {
    setPanels([]);
    setConnections([]);
    setPanelIdCounter(0);
    try {
      // Re-save with empty panels but keep config
      const state: PersistedState = {
        panels: [],
        connections: [],
        panelIdCounter: 0,
        config,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }, [config]);

  // ░░ Export State to JSON File ░░
  const exportToFile = useCallback(() => {
    const state: PersistedState = { panels: panels.filter(p => !p.isExiting), connections, panelIdCounter, config };
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid-playground-state.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [panels, connections, panelIdCounter, config]);

  // ░░ Import State from JSON File ░░
  const importFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const state = JSON.parse(ev.target?.result as string) as PersistedState;
          setPanels(state.panels || []);
          setConnections(state.connections || []);
          setPanelIdCounter(state.panelIdCounter || 0);
          setConfig({ ...DEFAULT_CONFIG, ...(state.config || {}) });
        } catch (err) {
          console.error('Failed to load settings:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return {
    panels,
    setPanels,
    connections,
    setConnections,
    panelIdCounter,
    setPanelIdCounter,
    config,
    setConfig,
    isLoaded,
    clearAllData,
    exportToFile,
    importFromFile,
  };
}
