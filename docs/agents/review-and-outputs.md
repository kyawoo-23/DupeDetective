# Review and outputs

Apply this guide when changing the review queue, group review, decisions, verdict drafts, migration status, saved scans, or generated Markdown.

- Candidate pairs are comparison evidence inside a group. Each component belongs to one candidate group, and the reviewer records one decision for that group by giving every member a role: keep (`target`), merge into it, or leave separate. The score filter hides a whole group below the minimum. It does not remove members or change the verdict.
- **Merge:** At least one member folds into exactly one chosen component. Other members may stay separate. A note is optional. Create one migration backlog item and one coding-agent instruction that lists both the components to replace and any members to leave unchanged. Changing the chosen component or the set of merged members resets a completed migration to Pending.
- **Keep separate:** Every member stays distinct. A note is optional. This verdict creates no backlog item.
- Store group decisions under their scan with group ID, a role for each member, timestamp, note, and migration status when something merges.
- Track merge cleanup as Pending or Complete. Mark Complete only on reviewer confirmation; reviewers can move a completed item back to Pending from the backlog.
- Store decisions in the website under their scan. Starting another scan imports no decisions, notes, statuses, or backlog. Generate outputs solely from the current scan.
- Generate a Markdown backlog for decisions that merge at least one component. Include paths to replace, paths to leave unchanged, note, component to keep, status, and next step. Reviewers can copy the backlog markdown from the UI.
- Offer individual merge instructions and a combined instruction for pending merges by default, with selection controls. Name the component to keep, components to replace, components to leave unchanged, behavior to preserve, and suggested checks. The reviewer copies instructions into a coding agent manually; the website does not modify source code.
- In group review (`GroupReviewPanel`), the member roster at the top shows each component's name and a `FileLocation` chip. Target and merge controls show component names. The roster is how those names are tied to a path.
- Verdict drafts save under the `sessionStorage` key `dd-group-verdict-draft:{scanId}:{groupId}`. Moving between groups keeps that draft. The browser may still warn on `beforeunload`.
