# Review and outputs

Apply this guide when changing the review queue, decisions, migration status, saved scans, or generated Markdown.

- A candidate is a relationship to review, not a duplicate verdict. Let reviewers decide a pair or subset within a group. Record affected component IDs, reviewer, timestamp, a note when required, and migration status where applicable.
- **Merge:** Require the component to keep and a note. Create a migration backlog item and individual coding-agent instruction. Track Pending and Complete. Mark Complete only on reviewer confirmation; a completion note is optional. Add the kept component to guidelines only when Complete.
- **Keep separate:** A note is optional. If the note is filled in, add it to guidelines. If the note is blank, remove the relationship from this scan's active queue without a guideline or backlog item. A later scan evaluates it independently.
- Store decisions in the website under their scan. Starting another scan imports no decisions, notes, statuses, backlog, or guidelines. Generate outputs solely from the current scan.
- Generate a Markdown backlog for merge decisions only. Include affected paths, note, component to keep, status, next step, and optional completion note.
- Generate `component-guidelines.md` with completed merges, keep-separate notes, and a clearly marked pending merge section. Omit keep-separate decisions that have a blank note.
- Offer individual merge instructions and a combined instruction for pending merges by default, with selection controls. Name the component to keep and affected paths, behavior to preserve, and suggested checks. The reviewer copies instructions into a coding agent manually; the website does not modify source code.
