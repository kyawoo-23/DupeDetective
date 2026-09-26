export function componentJsxTag(name: string): string {
  return `<${name} />`;
}

export function mergeComponentsTitle(sources: string[], target: string): string {
  return `${sources.map(componentJsxTag).join(', ')} → ${componentJsxTag(target)}`;
}
