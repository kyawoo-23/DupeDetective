// Output generators: Markdown backlog, component guidelines, agent instructions

import { getDecisionLabel, getMigrationStatusLabel } from '../store';
import type { BacklogItem, Decision, ReactComponent, Scan } from '../types';

// ──────────────────────────────────────────
// Backlog
// ──────────────────────────────────────────
export function buildBacklog(scan: Scan): BacklogItem[] {
  const items: BacklogItem[] = [];

  for (const decision of scan.decisions) {
    if (decision.type !== 'merge') continue;

    const components = decision.componentIds
      .map((id) => scan.components.find((c) => c.id === id))
      .filter((c): c is ReactComponent => c != null);

    const canonical = decision.canonicalComponentId
      ? scan.components.find((c) => c.id === decision.canonicalComponentId)
      : undefined;

    const status = decision.migrationStatus ?? 'pending';
    const suggestedNextStep = getSuggestedNextStep(decision.type, status);

    items.push({
      id: `item_${decision.id}`,
      decisionId: decision.id,
      type: decision.type,
      componentNames: components.map((c) => c.name),
      sourcePaths: components.map((c) => c.file),
      rationale: decision.rationale,
      canonicalComponent: canonical?.name,
      status,
      completionNote: decision.completionNote,
      suggestedNextStep,
    });
  }

  return items;
}

function getSuggestedNextStep(type: Decision['type'], status: Decision['migrationStatus']): string {
  if (type !== 'merge') return '';
  if (status === 'pending')
    return 'Copy the agent instruction and run it in your coding assistant.';
  return 'The kept component is ready to list in your guidelines.';
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
    lines.push(`## ${getDecisionLabel(item.type)}: ${item.componentNames.join(' + ')}`);
    lines.push('');
    lines.push(`**Status:** ${getMigrationStatusLabel(item.status)}`);
    lines.push(`**Decision:** ${getDecisionLabel(item.type)}`);
    if (item.canonicalComponent) lines.push(`**Keep:** \`${item.canonicalComponent}\``);
    lines.push('');
    lines.push('**Affected components:**');
    for (let i = 0; i < item.componentNames.length; i++) {
      lines.push(`- \`${item.componentNames[i]}\` — \`${item.sourcePaths[i]}\``);
    }
    lines.push('');
    lines.push(`**Note:** ${item.rationale}`);
    lines.push('');
    lines.push(`**Suggested next step:** ${item.suggestedNextStep}`);
    if (item.completionNote) {
      lines.push('');
      lines.push(`**Completion note:** ${item.completionNote}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// ──────────────────────────────────────────
// Component guidelines
// ──────────────────────────────────────────
export function renderGuidelinesMarkdown(scan: Scan): string {
  const lines: string[] = [
    '# Component Guidelines',
    '',
    `Generated from scan: ${formatScanSource(scan)}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
    '',
  ];

  const completed = scan.decisions.filter(
    (d) => d.type === 'merge' && d.migrationStatus === 'complete'
  );
  const pending = scan.decisions.filter(
    (d) => d.type === 'merge' && d.migrationStatus !== 'complete'
  );
  const kept = scan.decisions.filter((d) => d.type === 'keep' && d.rationale.trim());

  if (completed.length > 0) {
    lines.push('## Components to use');
    lines.push('');
    lines.push('These merges are done. Use the component listed below.');
    lines.push('');
    for (const d of completed) {
      const canonical = scan.components.find((c) => c.id === d.canonicalComponentId);
      const others = d.componentIds
        .filter((id) => id !== d.canonicalComponentId)
        .map((id) => scan.components.find((c) => c.id === id))
        .filter((c): c is ReactComponent => c != null);
      if (!canonical) continue;
      lines.push(`### \`${canonical.name}\``);
      lines.push('');
      lines.push(`**Source:** \`${canonical.file}\``);
      lines.push(`**Replaces:** ${others.map((c) => `\`${c.name}\``).join(', ')}`);
      lines.push(`**Note:** ${d.rationale}`);
      if (d.completionNote) lines.push(`**Note:** ${d.completionNote}`);
      lines.push('');
    }
  }

  if (kept.length > 0) {
    lines.push('## Keep separate');
    lines.push('');
    for (const d of kept) {
      const components = d.componentIds
        .map((id) => scan.components.find((c) => c.id === id))
        .filter((c): c is ReactComponent => c != null);
      lines.push(`### ${components.map((c) => `\`${c.name}\``).join(' and ')}`);
      lines.push('');
      lines.push(`**Note:** ${d.rationale}`);
      lines.push('');
      for (const c of components) {
        lines.push(`- \`${c.name}\` (\`${c.file}\`)`);
      }
      lines.push('');
    }
  }

  if (pending.length > 0) {
    lines.push('## Pending merges');
    lines.push('');
    lines.push('> These merges are decided but not done yet.');
    lines.push('');
    for (const d of pending) {
      const canonical = scan.components.find((c) => c.id === d.canonicalComponentId);
      const components = d.componentIds
        .map((id) => scan.components.find((c) => c.id === id))
        .filter((c): c is ReactComponent => c != null);
      lines.push(
        `- ${components.map((c) => `\`${c.name}\``).join(' → ')} → keep: \`${canonical?.name ?? 'TBD'}\``
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ──────────────────────────────────────────
// Coding-agent instructions
// ──────────────────────────────────────────
export function renderAgentInstruction(scan: Scan, decisionId: string): string {
  const decision = scan.decisions.find((d) => d.id === decisionId);
  if (decision?.type !== 'merge') return '';

  const canonical = scan.components.find((c) => c.id === decision.canonicalComponentId);
  const others = decision.componentIds
    .filter((id) => id !== decision.canonicalComponentId)
    .map((id) => scan.components.find((c) => c.id === id))
    .filter((c): c is ReactComponent => c != null);

  if (!canonical) return '';

  const lines = [
    `## Merge: ${others.map((c) => c.name).join(', ')} → ${canonical.name}`,
    '',
    '### Task',
    `Merge the following components into \`${canonical.name}\`.`,
    '',
    '### Component to keep',
    `- Name: \`${canonical.name}\``,
    `- File: \`${canonical.file}\``,
    `- Props: ${canonical.propNames.length > 0 ? canonical.propNames.map((p) => `\`${p}\``).join(', ') : 'none declared'}`,
    '',
    '### Components to replace',
  ];

  for (const c of others) {
    lines.push(`- \`${c.name}\` in \`${c.file}\``);
    if (c.propNames.length > 0) {
      lines.push(`  - Props: ${c.propNames.map((p) => `\`${p}\``).join(', ')}`);
    }
  }

  lines.push('');
  lines.push('### Note');
  lines.push(decision.rationale);
  lines.push('');
  lines.push('### Required behavior to preserve');
  lines.push(
    '- All existing usages of replaced components must continue to work after the migration.'
  );
  lines.push(
    '- The canonical component must support all prop variants used by the replaced components.'
  );
  lines.push("- Do not change the canonical component's public API unless strictly required.");
  lines.push('');
  lines.push('### Suggested checks');
  lines.push('1. Search for all imports of the replaced components and update them.');
  lines.push('2. Check all prop mappings — some prop names may differ between components.');
  lines.push('3. Run the existing test suite after migration.');
  lines.push('4. Verify the canonical component renders correctly in all usage contexts.');
  lines.push('');
  lines.push('### Source files affected');
  for (const c of [...others, canonical]) {
    lines.push(`- \`${c.file}\``);
  }

  return lines.join('\n');
}

export function renderCombinedAgentInstruction(scan: Scan, decisionIds?: string[]): string {
  const ids = decisionIds ?? scan.decisions.filter((d) => d.type === 'merge').map((d) => d.id);
  const instructions = ids.map((id) => renderAgentInstruction(scan, id)).filter(Boolean);

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
