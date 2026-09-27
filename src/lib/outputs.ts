// Copyable backlog and coding-agent instructions for group decisions that merge something.

import { getDecisionLabel, getMigrationStatusLabel } from '../store';
import type { BacklogItem, GroupDecision, ReactComponent, Scan } from '../types';
import { decisionOutcome, mergedIds, mergeTarget, separateIds } from './decisions';

function named(components: ReactComponent[], ids: string[]): ReactComponent[] {
  const byId = new Map(components.map((component) => [component.id, component]));
  return ids.flatMap((id) => {
    const component = byId.get(id);
    return component ? [component] : [];
  });
}

function componentsFor(scan: Scan, decision: GroupDecision): ReactComponent[] {
  const ids = new Set(Object.keys(decision.roles));
  return scan.components.filter((component) => ids.has(component.id));
}

export function buildBacklog(scan: Scan): BacklogItem[] {
  return scan.groupDecisions.flatMap((decision) => {
    const targetId = mergeTarget(decision);
    const merged = named(scan.components, mergedIds(decision));
    const separate = named(scan.components, separateIds(decision));
    const canonical = scan.components.find((component) => component.id === targetId);
    if (!targetId || !canonical || merged.length === 0) return [];
    const status = decision.migrationStatus === 'complete' ? 'complete' : 'pending';
    return [
      {
        id: `item_${decision.id}`,
        decisionId: decision.id,
        outcome: decisionOutcome(decision),
        componentNames: merged.map((component) => component.name),
        sourcePaths: merged.map((component) => component.file),
        rationale: decision.rationale,
        canonicalComponent: canonical.name,
        unchangedNames: separate.map((component) => component.name),
        unchangedPaths: separate.map((component) => component.file),
        status,
        completionNote: decision.completionNote,
        suggestedNextStep:
          status === 'pending'
            ? 'Copy the agent instruction and run it in your coding assistant.'
            : 'No further action unless you want to re-run agent instructions.',
      } satisfies BacklogItem,
    ];
  });
}

export function renderBacklogMarkdown(scan: Scan): string {
  const items = buildBacklog(scan);
  if (items.length === 0) return '# Merge backlog\n\nNo backlog items yet.\n';

  const lines: string[] = [
    '# Merge backlog',
    '',
    `Generated from scan: ${formatScanSource(scan)}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
    '',
  ];
  for (const item of items) {
    lines.push(`## ${getDecisionLabel(item.outcome)}: ${item.componentNames.join(' + ')}`);
    lines.push('');
    lines.push(`**Status:** ${getMigrationStatusLabel(item.status)}`);
    lines.push(`**Keep:** \`${item.canonicalComponent}\``);
    lines.push('');
    lines.push('**Components to replace:**');
    for (let i = 0; i < item.componentNames.length; i++) {
      lines.push(`- \`${item.componentNames[i]}\` — \`${item.sourcePaths[i]}\``);
    }
    if (item.unchangedNames.length > 0) {
      lines.push('');
      lines.push('**Leave unchanged:**');
      for (let i = 0; i < item.unchangedNames.length; i++) {
        lines.push(`- \`${item.unchangedNames[i]}\` — \`${item.unchangedPaths[i]}\``);
      }
    }
    if (item.rationale.trim()) {
      lines.push('');
      lines.push(`**Note:** ${item.rationale}`);
    }
    lines.push('');
    lines.push(`**Suggested next step:** ${item.suggestedNextStep}`);
    if (item.completionNote) {
      lines.push('');
      lines.push(`**Completion note:** ${item.completionNote}`);
    }
    lines.push('', '---', '');
  }
  return lines.join('\n');
}

export function renderAgentInstruction(scan: Scan, decisionId: string): string {
  const decision = scan.groupDecisions.find((item) => item.id === decisionId);
  if (!decision) return '';
  const components = componentsFor(scan, decision);
  const canonical = components.find((component) => component.id === mergeTarget(decision));
  const others = named(components, mergedIds(decision));
  const unchanged = named(components, separateIds(decision));
  if (!canonical || others.length === 0) return '';

  const lines = [
    `## ${getDecisionLabel(decisionOutcome(decision))}: ${others.map((component) => component.name).join(', ')} → ${canonical.name}`,
    '',
    '### Task',
    `Merge the following components into \`${canonical.name}\`.`,
    '',
    '### Component to keep',
    `- Name: \`${canonical.name}\``,
    `- File: \`${canonical.file}\``,
    `- Props: ${canonical.propNames.length > 0 ? canonical.propNames.map((prop) => `\`${prop}\``).join(', ') : 'none declared'}`,
    '',
    '### Components to replace',
  ];
  for (const component of others) {
    lines.push(`- \`${component.name}\` in \`${component.file}\``);
    if (component.propNames.length > 0) {
      lines.push(`  - Props: ${component.propNames.map((prop) => `\`${prop}\``).join(', ')}`);
    }
  }
  if (unchanged.length > 0) {
    lines.push('', '### Leave unchanged');
    lines.push('These components were reviewed with the group and must stay as they are:');
    for (const component of unchanged) {
      lines.push(`- \`${component.name}\` in \`${component.file}\``);
    }
  }
  lines.push('');
  if (decision.rationale.trim()) {
    lines.push('### Note', decision.rationale, '');
  }
  lines.push(
    '### Required behavior to preserve',
    '- All existing usages of replaced components must continue to work after the migration.',
    '- The canonical component must support all prop variants used by the replaced components.',
    "- Do not change the canonical component's public API unless strictly required.",
    ...(unchanged.length > 0
      ? ['- Do not merge, delete, or rewrite the components listed under Leave unchanged.']
      : []),
    '',
    '### Suggested checks',
    '1. Search for all imports of the replaced components and update them.',
    '2. Check all prop mappings — some prop names may differ between components.',
    '3. Run the existing test suite after migration.',
    '4. Verify the canonical component renders correctly in all usage contexts.',
    '',
    '### Source files affected'
  );
  for (const component of [...others, canonical]) lines.push(`- \`${component.file}\``);
  return lines.join('\n');
}

export function renderCombinedAgentInstruction(scan: Scan, decisionIds?: string[]): string {
  const selected = decisionIds ? new Set(decisionIds) : null;
  const instructions = scan.groupDecisions
    .filter(
      (decision) => mergedIds(decision).length > 0 && (!selected || selected.has(decision.id))
    )
    .map((decision) => renderAgentInstruction(scan, decision.id))
    .filter(Boolean);
  if (instructions.length === 0) return 'No merge decisions to include.';
  return [
    '# Combined merge instructions',
    '',
    `Generated from scan: ${formatScanSource(scan)}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
    `Total merges: ${instructions.length}`,
    '',
    '---',
    '',
    instructions.join('\n\n---\n\n'),
  ].join('\n');
}

function formatScanSource(scan: Scan): string {
  if (scan.source.kind === 'github') {
    return `${scan.source.url} @ ${scan.source.commitSha.slice(0, 7)}`;
  }
  return `${scan.source.filename} (${scan.source.contentHash})`;
}
