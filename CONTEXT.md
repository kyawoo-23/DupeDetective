# Review terminology

- **Candidate pair:** Evidence only. Two scanned React components and a breakdown of why they look similar. A pair is never decided on directly.
- **Candidate group:** The unit of review. A set of related components; each component belongs to at most one group in a scan. Its score is cohesion: the average similarity of every pair in the group, not the single best pair.
- **Group decision:** A role for every member. `target` is the component to keep, `merge` folds into that component, and `separate` stays as it is. Keeping the group separate means every member is `separate`. A decision that merges anything becomes one cleanup task, and names the members that must stay unchanged.
