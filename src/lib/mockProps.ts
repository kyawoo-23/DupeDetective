// Mock prop generation: deterministic rules based on declared prop types
// No AI — pattern matching only.

import type { MockPropValues, ReactComponent } from '../types';

export type PropControl =
  | { type: 'text'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'select'; options: string[]; value: string }
  | { type: 'json'; value: string }
  | { type: 'callback'; value: string };

export type PropControls = Record<string, PropControl>;

// Common prop name → type heuristics
const NAME_HINTS: Record<string, PropControl> = {
  children: { type: 'text', value: 'Example content' },
  label: { type: 'text', value: 'Label' },
  title: { type: 'text', value: 'Title' },
  subtitle: { type: 'text', value: 'Subtitle' },
  description: { type: 'text', value: 'A short description.' },
  error: { type: 'text', value: '' },
  errorMessage: { type: 'text', value: '' },
  errorMsg: { type: 'text', value: '' },
  placeholder: { type: 'text', value: 'Placeholder text…' },
  text: { type: 'text', value: 'Text' },
  value: { type: 'text', value: 'value' },
  name: { type: 'text', value: 'name' },
  id: { type: 'text', value: 'id-1' },
  href: { type: 'text', value: '#' },
  src: {
    type: 'text',
    value:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="120"%3E%3Crect width="200" height="120" fill="%23d9e4f8"/%3E%3Ctext x="65" y="65" fill="%232457c5"%3EImage%3C/text%3E%3C/svg%3E',
  },
  alt: { type: 'text', value: 'Image description' },
  className: { type: 'text', value: '' },
  type: { type: 'select', options: ['button', 'submit', 'reset'], value: 'button' },
  variant: {
    type: 'select',
    options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    value: 'primary',
  },
  size: { type: 'select', options: ['sm', 'md', 'lg', 'xl'], value: 'md' },
  color: {
    type: 'select',
    options: ['default', 'primary', 'success', 'warning', 'danger'],
    value: 'primary',
  },
  disabled: { type: 'boolean', value: false },
  loading: { type: 'boolean', value: false },
  checked: { type: 'boolean', value: false },
  selected: { type: 'boolean', value: false },
  isOpen: { type: 'boolean', value: true },
  open: { type: 'boolean', value: true },
  visible: { type: 'boolean', value: true },
  active: { type: 'boolean', value: false },
  count: { type: 'number', value: 0 },
  max: { type: 'number', value: 100 },
  min: { type: 'number', value: 0 },
  step: { type: 'number', value: 1 },
  width: { type: 'number', value: 200 },
  height: { type: 'number', value: 200 },
  // callbacks
  onClick: { type: 'callback', value: '() => {}' },
  onChange: { type: 'callback', value: '() => {}' },
  onSubmit: { type: 'callback', value: '() => {}' },
  onClose: { type: 'callback', value: '() => {}' },
  onOpen: { type: 'callback', value: '() => {}' },
  onBlur: { type: 'callback', value: '() => {}' },
  onFocus: { type: 'callback', value: '() => {}' },
  onSelect: { type: 'callback', value: '() => {}' },
};

// The bundled scan fixture doubles as a visual demo. Give its standalone
// previews coherent content while keeping the controls editable by reviewers.
const DEMO_PREVIEW_VALUES: Record<string, Record<string, string | number | boolean>> = {
  SectionHeader: {
    title: 'Component library',
    desc: 'A collection of useful interface patterns for everyday work.',
  },
  ComponentBlock: {
    label: 'Example component',
    children: 'A simple example with enough content to show the spacing and type.',
  },
  Btn: { children: 'Continue' },
  Button: { children: 'Continue' },
  ActionButton: { children: 'Continue' },
  Card: {
    title: 'Team workspace',
    description: 'Keep shared projects organized and everyone in sync.',
    children: 'Invite teammates and share your first project.',
    footer: 'Updated today',
  },
  InfoCard: {
    icon: '✦',
    heading: 'Team workspace',
    body: 'Bring your team’s projects and updates together in one place.',
    action: 'View workspace',
  },
  SummaryCard: {
    label: 'Active projects',
    value: '24',
    trend: '12% this month',
    trendUp: true,
    icon: '↗',
  },
  StatCard: { label: 'Active users', value: '12,480', delta: '+8.2%', positive: true },
  Badge: { status: 'active', label: 'Active' },
  StatusPill: { color: 'green', children: 'Active' },
  Tag: { label: 'Design system' },
  Spinner: { size: 24, color: '#2457c5' },
  LoadingIndicator: { scale: 'md', label: 'Loading…' },
  SubmitButton: { label: 'Save changes', pendingLabel: 'Saving…' },
  TextInput: { id: 'preview-name', label: 'Full name', value: '', placeholder: 'Jane Smith' },
  FormField: {
    id: 'preview-username',
    label: 'Username',
    value: '',
    placeholder: 'jane_smith',
    hint: 'Choose a name for your account.',
  },
  InputField: {
    id: 'preview-search',
    label: 'Search projects',
    value: '',
    placeholder: 'Search projects…',
    icon: '⌕',
  },
  ConfirmDialog: {
    title: 'Archive project?',
    message: 'You can restore this project from the archive later.',
    confirmLabel: 'Archive project',
    cancelLabel: 'Cancel',
  },
  AlertModal: {
    type: 'warning',
    heading: 'Unsaved changes',
    detail: 'Save your work before leaving this page.',
  },
};

function typeStringToControl(typeStr: string, propName: string): PropControl {
  const t = typeStr.toLowerCase().trim();
  if (t === 'string')
    return NAME_HINTS[propName]?.type === 'text'
      ? NAME_HINTS[propName]
      : { type: 'text', value: propName };
  if (t === 'number') return { type: 'number', value: 0 };
  if (t === 'boolean')
    return NAME_HINTS[propName]?.type === 'boolean'
      ? NAME_HINTS[propName]
      : { type: 'boolean', value: false };
  if (t === 'reactnode' || t === 'react.reactnode') return { type: 'text', value: 'Content' };
  if (t.startsWith('(') || t.includes('=>')) return { type: 'callback', value: '() => {}' };
  if (t.endsWith('[]') || t.startsWith('array'))
    return {
      type: 'json',
      value:
        t === 'string[]'
          ? '["Example item"]'
          : t === 'number[]'
            ? '[1]'
            : t === 'boolean[]'
              ? '[true]'
              : '[]',
    };
  if (t === 'object' || t.startsWith('{')) return { type: 'json', value: '{}' };
  // String literal union: "sm" | "md" | "lg"
  const unionMatches = typeStr.match(/"([^"]+)"/g);
  if (unionMatches && unionMatches.length > 0) {
    const options = unionMatches.map((m) => m.replace(/"/g, ''));
    return { type: 'select', options, value: options[0] };
  }
  return NAME_HINTS[propName] ?? { type: 'text', value: String(propName) };
}

export function generateMockProps(component: ReactComponent): PropControls {
  const controls: PropControls = {};

  for (const propName of new Set([
    ...component.propNames,
    ...Object.keys(component.previewPropValues ?? {}),
  ])) {
    // Skip callback props detected by name
    if (
      propName.startsWith('on') &&
      propName.length > 2 &&
      propName[2] === propName[2].toUpperCase()
    ) {
      controls[propName] = { type: 'callback', value: `() => console.log('${propName}')` };
      continue;
    }

    const inferred = component.previewPropValues?.[propName];
    if (
      typeof inferred === 'string' &&
      (inferred.startsWith('__date__') || inferred.startsWith('__element__'))
    ) {
      controls[propName] = { type: 'text', value: inferred.replace(/^__(date|element)__/, '') };
      continue;
    }
    if (
      inferred !== undefined &&
      !component.propTypes[propName] &&
      (!NAME_HINTS[propName] ||
        (typeof inferred === 'string' &&
          (inferred !== propName || inferred.startsWith('__callback__'))) ||
        typeof inferred === 'object' ||
        typeof inferred === 'boolean' ||
        typeof inferred === 'number')
    ) {
      controls[propName] =
        typeof inferred === 'boolean'
          ? { type: 'boolean', value: inferred }
          : typeof inferred === 'number'
            ? { type: 'number', value: inferred }
            : typeof inferred === 'string'
              ? inferred.startsWith('__callback__')
                ? { type: 'callback', value: '() => {}' }
                : { type: 'text', value: inferred }
              : { type: 'json', value: JSON.stringify(inferred) };
      continue;
    }
    const typeStr = component.propTypes[propName];
    if (typeStr) {
      controls[propName] = typeStringToControl(typeStr, propName);
      if (
        controls[propName].type === 'json' &&
        !/^(string|number|boolean)\[\]$/.test(typeStr) &&
        inferred &&
        typeof inferred === 'object'
      )
        controls[propName] = { type: 'json', value: JSON.stringify(inferred) };
    } else if (NAME_HINTS[propName]) {
      controls[propName] = NAME_HINTS[propName];
    } else {
      controls[propName] = { type: 'text', value: propName };
    }
  }

  if (/(^|\/)demo-project\/src\//.test(component.file)) {
    for (const [name, value] of Object.entries(DEMO_PREVIEW_VALUES[component.name] ?? {})) {
      if (!(name in controls)) continue;
      const control = controls[name];
      if (control.type === 'select' && typeof value === 'string') {
        controls[name] = control.options.includes(value)
          ? { ...control, value }
          : { type: 'text', value };
      } else if (control.type === 'text' && typeof value === 'string') {
        controls[name] = { ...control, value };
      } else if (control.type === 'number' && typeof value === 'number') {
        controls[name] = { ...control, value };
      } else if (control.type === 'boolean' && typeof value === 'boolean') {
        controls[name] = { ...control, value };
      }
    }
  }

  return controls;
}

export function controlsToValues(controls: PropControls): MockPropValues {
  const values: MockPropValues = {};
  for (const [key, ctrl] of Object.entries(controls)) {
    if (ctrl.type === 'json') {
      try {
        values[key] = JSON.parse(ctrl.value);
      } catch {
        values[key] = ctrl.value;
      }
    } else if (ctrl.type === 'callback') {
      values[key] = `__callback__${key}`;
    } else {
      values[key] = ctrl.value;
    }
  }
  return values;
}
