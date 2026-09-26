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
  jsxDepth: number;
  jsxNodeCount: number;
  source: string;
  previewDependencies?: string;
}

export type SimilaritySignal =
  | 'jsx-structure'
  | 'prop-overlap'
  | 'event-handlers'
  | 'class-names'
  | 'component-name'
  | 'nesting-depth';

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

export interface CandidateGroup {
  id: string;
  components: ReactComponent[];
  pairs: CandidatePair[];
  topScore: number;
  primarySignals: SimilaritySignal[];
}

export type DecisionType = 'merge' | 'keep';

export type MigrationStatus = 'pending' | 'complete';

export interface Decision {
  id: string;
  scanId: string;
  pairId: string;
  componentIds: string[];
  type: DecisionType;
  rationale: string;
  canonicalComponentId?: string;
  migrationStatus?: MigrationStatus;
  completionNote?: string;
  reviewedAt: string;
}

export interface BacklogItem {
  id: string;
  decisionId: string;
  type: DecisionType;
  componentNames: string[];
  sourcePaths: string[];
  rationale: string;
  canonicalComponent?: string;
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
  decisions: Decision[];
  error?: string;
}

export interface MockPropValues {
  [propName: string]: unknown;
}
