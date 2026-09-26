import { create } from 'zustand';
import type { Decision, DecisionType, MigrationStatus, ReactComponent, Scan } from '../types';

interface AppState {
  scans: Scan[];
  activeScanId: string | null;

  // Scan management
  addScan: (scan: Scan) => void;
  updateScan: (id: string, updates: Partial<Scan>) => void;
  setActiveScan: (id: string | null) => void;
  getActiveScan: () => Scan | undefined;

  // Decision management
  addDecision: (decision: Decision) => void;
  updateDecision: (id: string, updates: Partial<Decision>) => void;
  getDecision: (pairId: string) => Decision | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  scans: [],
  activeScanId: null,

  addScan: (scan) => set((s) => ({ scans: [...s.scans, scan] })),

  updateScan: (id, updates) =>
    set((s) => ({
      scans: s.scans.map((sc) => (sc.id === id ? { ...sc, ...updates } : sc)),
    })),

  setActiveScan: (id) => set({ activeScanId: id }),

  getActiveScan: () => {
    const { scans, activeScanId } = get();
    return scans.find((s) => s.id === activeScanId);
  },

  addDecision: (decision) => {
    const { activeScanId, scans } = get();
    if (!activeScanId) return;
    set({
      scans: scans.map((sc) =>
        sc.id === activeScanId ? { ...sc, decisions: [...sc.decisions, decision] } : sc
      ),
    });
  },

  updateDecision: (id, updates) => {
    const { activeScanId, scans } = get();
    if (!activeScanId) return;
    set({
      scans: scans.map((sc) =>
        sc.id === activeScanId
          ? {
              ...sc,
              decisions: sc.decisions.map((d) => (d.id === id ? { ...d, ...updates } : d)),
            }
          : sc
      ),
    });
  },

  getDecision: (pairId) => {
    const scan = get().getActiveScan();
    return scan?.decisions.find((d) => d.pairId === pairId);
  },
}));

// Helpers
export function makeDecisionId() {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeScanId() {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getDecisionLabel(type: DecisionType): string {
  const labels: Record<DecisionType, string> = {
    merge: 'Merge',
    keep: 'Keep separate',
  };
  return labels[type];
}

export function getMigrationStatusLabel(status: MigrationStatus): string {
  const labels: Record<MigrationStatus, string> = {
    pending: 'Pending',
    complete: 'Complete',
  };
  return labels[status];
}

export function getCanonicalComponent(scan: Scan, decision: Decision): ReactComponent | undefined {
  if (!decision.canonicalComponentId) return undefined;
  return scan.components.find((c) => c.id === decision.canonicalComponentId);
}
