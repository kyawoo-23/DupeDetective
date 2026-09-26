import { create } from 'zustand';
import { sameMembers } from '../lib/decisions';
import { deleteSavedScan, loadSavedScans, saveScan } from '../lib/scanStorage';
import { buildCandidateGroups } from '../lib/scorer';
import type { DecisionOutcome, GroupDecision, MemberRole, MigrationStatus, Scan } from '../types';

interface AppState {
  scans: Scan[];
  activeScanId: string | null;
  scansLoaded: boolean;
  storageWarning: string | null;

  // Scan management
  initializeScans: () => Promise<void>;
  addScan: (scan: Scan) => Promise<void>;
  deleteScan: (id: string) => Promise<void>;
  updateScan: (id: string, updates: Partial<Scan>) => void;
  setActiveScan: (id: string | null) => void;
  getActiveScan: () => Scan | undefined;

  // Decision management
  saveGroupDecision: (decision: GroupDecision) => void;
  updateGroupDecision: (id: string, updates: Partial<GroupDecision>) => void;
}

function memberIds(roles: Record<string, MemberRole>): string[] {
  return Object.keys(roles);
}

function migrateGroupDecisions(
  raw: unknown,
  scanId: string,
  groups: Scan['groups']
): GroupDecision[] {
  if (!Array.isArray(raw)) return [];
  const migrated: GroupDecision[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id : '';
    if (!id) continue;
    const rationale = typeof record.rationale === 'string' ? record.rationale : '';
    const reviewedAt =
      typeof record.reviewedAt === 'string' ? record.reviewedAt : new Date().toISOString();
    const recordScanId = typeof record.scanId === 'string' ? record.scanId : scanId;

    if (record.roles && typeof record.roles === 'object') {
      const roles = record.roles as Record<string, MemberRole>;
      const group = groups.find((candidate) =>
        sameMembers(
          memberIds(roles),
          candidate.components.map((component) => component.id)
        )
      );
      if (!group) continue;
      migrated.push({
        id,
        scanId: recordScanId,
        groupId: group.id,
        roles,
        rationale,
        migrationStatus:
          record.migrationStatus === 'complete' || record.migrationStatus === 'pending'
            ? record.migrationStatus
            : undefined,
        completionNote:
          typeof record.completionNote === 'string' ? record.completionNote : undefined,
        reviewedAt,
      });
      continue;
    }

    const componentIds = Array.isArray(record.componentIds)
      ? record.componentIds.filter(
          (componentId): componentId is string => typeof componentId === 'string'
        )
      : [];
    const group = groups.find((candidate) =>
      sameMembers(
        componentIds,
        candidate.components.map((component) => component.id)
      )
    );
    if (!group) continue;
    const canonical =
      typeof record.canonicalComponentId === 'string' ? record.canonicalComponentId : undefined;
    const roles: Record<string, MemberRole> = {};
    if (record.type === 'merge' && canonical && componentIds.includes(canonical)) {
      for (const componentId of componentIds) {
        roles[componentId] = componentId === canonical ? 'target' : 'merge';
      }
    } else if (record.type === 'keep') {
      for (const componentId of componentIds) roles[componentId] = 'separate';
    } else continue;
    migrated.push({
      id,
      scanId: recordScanId,
      groupId: group.id,
      roles,
      rationale,
      migrationStatus:
        record.type === 'merge'
          ? record.migrationStatus === 'complete'
            ? 'complete'
            : 'pending'
          : undefined,
      completionNote:
        record.type === 'merge' && typeof record.completionNote === 'string'
          ? record.completionNote
          : undefined,
      reviewedAt,
    });
  }
  return migrated;
}

function normalizeScan(scan: Scan): Scan {
  const stored = scan as Scan & { decisions?: unknown; analysisVersion?: number };
  if (stored.analysisVersion === 2) {
    const current: Scan = {
      ...scan,
      groupDecisions: Array.isArray(scan.groupDecisions) ? scan.groupDecisions : [],
      analysisVersion: 2,
    };
    delete (current as { decisions?: unknown }).decisions;
    return current;
  }

  const components = scan.components.map((component) => ({
    ...component,
    rootTag:
      component.rootTag ||
      component.jsxTags.find((tag) => tag === tag.toLowerCase()) ||
      component.jsxTags[0] ||
      '',
    ariaRoles: component.ariaRoles ?? [],
  }));
  const groups = buildCandidateGroups(components);
  const next: Scan = {
    ...scan,
    components,
    groups,
    groupDecisions: migrateGroupDecisions(stored.groupDecisions, scan.id, groups),
    analysisVersion: 2,
  };
  delete (next as { decisions?: unknown }).decisions;
  return next;
}

const saveQueues = new Map<string, Promise<void>>();
const failedSaveIds = new Set<string>();
let loadFailed = false;
let initialization: Promise<void> | null = null;

function updateStorageWarning() {
  useAppStore.setState({
    storageWarning: loadFailed
      ? 'Saved scans could not be loaded. Changes in this browser may be lost on reload.'
      : failedSaveIds.size > 0
        ? 'Some scan changes could not be saved. They may be lost on reload.'
        : null,
  });
}

function persistScan(scan: Scan): Promise<void> {
  const previous = saveQueues.get(scan.id);
  const pending = (previous ?? Promise.resolve()).catch(() => undefined).then(() => saveScan(scan));
  saveQueues.set(scan.id, pending);

  return pending
    .then(() => {
      failedSaveIds.delete(scan.id);
      updateStorageWarning();
    })
    .catch((error: unknown) => {
      console.error('Could not save scan', error);
      failedSaveIds.add(scan.id);
      updateStorageWarning();
    })
    .finally(() => {
      if (saveQueues.get(scan.id) === pending) saveQueues.delete(scan.id);
    });
}

function persistCurrentScan(id: string, get: () => AppState): void {
  const scan = get().scans.find((item) => item.id === id);
  if (scan) void persistScan(scan);
}

export const useAppStore = create<AppState>((set, get) => ({
  scans: [],
  activeScanId: null,
  scansLoaded: false,
  storageWarning: null,

  initializeScans: () => {
    if (!initialization) {
      initialization = loadSavedScans()
        .then((savedScans) => {
          set((state) => {
            const scansById = new Map(savedScans.map((scan) => [scan.id, normalizeScan(scan)]));
            for (const scan of state.scans) scansById.set(scan.id, scan);
            return {
              scans: [...scansById.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
            };
          });
        })
        .catch((error: unknown) => {
          console.error('Could not load saved scans', error);
          loadFailed = true;
          updateStorageWarning();
        })
        .finally(() => set({ scansLoaded: true }));
    }
    return initialization;
  },

  addScan: async (scan) => {
    set((s) => ({ scans: [...s.scans, scan] }));
    await persistScan(scan);
  },

  deleteScan: async (id) => {
    await saveQueues.get(id)?.catch(() => undefined);
    await deleteSavedScan(id);
    failedSaveIds.delete(id);
    updateStorageWarning();
    try {
      for (let index = window.sessionStorage.length - 1; index >= 0; index--) {
        const key = window.sessionStorage.key(index);
        if (key?.startsWith(`dd-group-verdict-draft:${id}:`)) {
          window.sessionStorage.removeItem(key);
        }
      }
    } catch {
      /* Draft storage may be unavailable. */
    }
    set((state) => ({
      scans: state.scans.filter((scan) => scan.id !== id),
      activeScanId: state.activeScanId === id ? null : state.activeScanId,
    }));
  },

  updateScan: (id, updates) => {
    set((s) => ({
      scans: s.scans.map((sc) => (sc.id === id ? { ...sc, ...updates } : sc)),
    }));
    persistCurrentScan(id, get);
  },

  setActiveScan: (id) => set({ activeScanId: id }),

  getActiveScan: () => {
    const { scans, activeScanId } = get();
    return scans.find((s) => s.id === activeScanId);
  },

  saveGroupDecision: (decision) => {
    set((state) => ({
      scans: state.scans.map((scan) =>
        scan.id === decision.scanId
          ? {
              ...scan,
              groupDecisions: [
                ...scan.groupDecisions.filter((item) => item.groupId !== decision.groupId),
                decision,
              ],
            }
          : scan
      ),
    }));
    persistCurrentScan(decision.scanId, get);
  },

  updateGroupDecision: (id, updates) => {
    const scan = get().scans.find((item) =>
      item.groupDecisions.some((decision) => decision.id === id)
    );
    if (!scan) return;
    set((state) => ({
      scans: state.scans.map((item) =>
        item.id === scan.id
          ? {
              ...item,
              groupDecisions: item.groupDecisions.map((decision) =>
                decision.id === id ? { ...decision, ...updates } : decision
              ),
            }
          : item
      ),
    }));
    persistCurrentScan(scan.id, get);
  },
}));

// Helpers
export function makeDecisionId() {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeScanId() {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getDecisionLabel(outcome: DecisionOutcome): string {
  const labels: Record<DecisionOutcome, string> = {
    merge: 'Merge',
    partial: 'Partial merge',
    keep: 'Keep separate',
  };
  return labels[outcome];
}

export function getMigrationStatusLabel(status: MigrationStatus): string {
  const labels: Record<MigrationStatus, string> = {
    pending: 'Pending',
    complete: 'Complete',
  };
  return labels[status];
}
