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
  placeholder: { type: 'text', value: 'Placeholder text…' },
  text: { type: 'text', value: 'Text' },
  value: { type: 'text', value: 'value' },
  name: { type: 'text', value: 'name' },
  id: { type: 'text', value: 'id-1' },
  href: { type: 'text', value: '#' },
  src: { type: 'text', value: 'https://placekitten.com/200/200' },
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

function typeStringToControl(typeStr: string, propName: string): PropControl {
  const t = typeStr.toLowerCase().trim();
  if (t === 'string') return NAME_HINTS[propName] ?? { type: 'text', value: propName };
  if (t === 'number') return { type: 'number', value: 0 };
  if (t === 'boolean') return NAME_HINTS[propName]?.type === 'boolean'
    ? NAME_HINTS[propName] : { type: 'boolean', value: false };
  if (t === 'reactnode' || t === 'react.reactnode') return { type: 'text', value: 'Content' };
  if (t.startsWith('(') || t.includes('=>')) return { type: 'callback', value: '() => {}' };
  if (t.endsWith('[]') || t.startsWith('array')) return { type: 'json', value: '[]' };
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

  for (const propName of component.propNames) {
    // Skip callback props detected by name
    if (
      propName.startsWith('on') &&
      propName.length > 2 &&
      propName[2] === propName[2].toUpperCase()
    ) {
      controls[propName] = { type: 'callback', value: `() => console.log('${propName}')` };
      continue;
    }

    const typeStr = component.propTypes[propName];
    if (typeStr) {
      controls[propName] = typeStringToControl(typeStr, propName);
    } else if (NAME_HINTS[propName]) {
      controls[propName] = NAME_HINTS[propName];
    } else {
      controls[propName] = { type: 'text', value: propName };
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
