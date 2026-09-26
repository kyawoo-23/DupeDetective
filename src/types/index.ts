// Core domain types for DupeDetective

export type ScanSource =
  | { kind: 'github'; url: string; branch?: string; commitSha: string }
  | { kind: 'zip'; filename: string; contentHash: string };

export type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

export interface ParseError {
  file: string;
  message: string;
}

export interface ReactComponent {
  id: string;
  name: string;
  file: string;
  line: number;
  kind: 'function' | 'arrow' | 'class';
  exportType: 'default' | 'named' | 'none';
  jsxTags: string[];
  propNames: string[];
  propTypes: Record<string, string>;
  eventHandlers: string[];
  classNames: string[];
  rootTag: string;
  ariaRoles: string[];
  jsxDepth: number;
  jsxNodeCount: number;
  source: string;
  previewDependencies?: string;
  previewPropValues?: Record<string, unknown>;
}

export type SimilaritySignal = 'markup' | 'styling' | 'props' | 'name' | 'behavior';

export interface SignalDetail {
  signal: SimilaritySignal;
  label: string;
  score: number;
}

export interface CandidatePair {
  id: string;
  componentA: ReactComponent;
  componentB: ReactComponent;
  totalScore: number;
  signals: SignalDetail[];
  summary: string;
}

export type GroupConfidence = 'strong' | 'possible';

export interface CandidateGroup {
  id: string;
  components: ReactComponent[];
  pairs: CandidatePair[];
  /** Mean score across every pair in the group. */
  score: number;
  confidence: GroupConfidence;
  primarySignals: SimilaritySignal[];
}

/** Role of one component in a group decision. */
export type MemberRole = 'target' | 'merge' | 'separate';

/** What a saved group decision amounts to. */
export type DecisionOutcome = 'merge' | 'partial' | 'keep';

export type MigrationStatus = 'pending' | 'complete';

export interface GroupDecision {
  id: string;
  scanId: string;
  groupId: string;
  /** Every group member at decision time. */
  roles: Record<string, MemberRole>;
  rationale: string;
  /** Set only when at least one member merges. */
  migrationStatus?: MigrationStatus;
  completionNote?: string;
  reviewedAt: string;
}

export interface BacklogItem {
  id: string;
  decisionId: string;
  outcome: DecisionOutcome;
  /** Components folded into the one that is kept. */
  componentNames: string[];
  sourcePaths: string[];
  rationale: string;
  canonicalComponent?: string;
  unchangedNames: string[];
  unchangedPaths: string[];
  status: MigrationStatus;
  completionNote?: string;
  suggestedNextStep: string;
}

export interface Scan {
  id: string;
  source: ScanSource;
  status: ScanStatus;
  createdAt: string;
  components: ReactComponent[];
  groups: CandidateGroup[];
  parseErrors: ParseError[];
  groupDecisions: GroupDecision[];
  /** 2 = cohesion groups and per-member decision roles. */
  analysisVersion: 2;
  error?: string;
}

export interface MockPropValues {
  [propName: string]: unknown;
}
