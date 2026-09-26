import type { ReactNode } from 'react';
import { componentJsxTag, mergeComponentsTitle } from '../../lib/componentDisplay';

export { componentJsxTag, mergeComponentsTitle };

const tagClass = 'font-mono font-normal';

export function ComponentTag({ name, className }: { name: string; className?: string }) {
  return (
    <span className={className ? `${tagClass} ${className}` : tagClass}>
      {componentJsxTag(name)}
    </span>
  );
}

export function ComponentTagList({
  names,
  separator = ', ',
}: {
  names: string[];
  separator?: string;
}) {
  return (
    <>
      {names.map((name, index) => (
        <span key={name}>
          {index > 0 ? separator : null}
          <ComponentTag name={name} />
        </span>
      ))}
    </>
  );
}

export function MergeComponentTitle({
  sources,
  target,
}: {
  sources: string[];
  target: string;
}): ReactNode {
  return (
    <>
      <ComponentTagList names={sources} />
      {' → '}
      <ComponentTag name={target} />
    </>
  );
}
