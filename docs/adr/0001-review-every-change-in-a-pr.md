# Review every change in a PR instead of committing to main

The development practices say trunk-based: agents commit small changes straight to `main`. Dom wants to read the code agents write before it lands, in small batches, so this project departs from that standard: each issue is done on a short-lived `<type>/<slug>` branch and opened as a PR, and Dom's merge is the approval. Branches stay short (hours, not days), so integration stays close to trunk-based.

## Considered Options

- **Trunk-based, read in the IDE afterwards.** The standard. Rejected because review would be optional and after the fact.
- **PRs opened by a second GitHub identity** (a machine user or GitHub App), so Dom can formally Approve and branch protection can require it. Rejected for now as setup cost without much gain for a personal project; worth revisiting if enforcement starts to matter.
- **Issue-based review** of a pushed branch, with labels and comments on the issue. Rejected as a weaker PR: no line comments, and the merge happens on the agent's side.

## Consequences

- Nothing technical enforces the review. Agents act as Dom's `gh` account, which has admin rights, so a direct push to `main` would succeed; only this ADR and `CONTRIBUTING.md` stop it. Branch protection (and, more cheaply, a local `no-commit-to-branch` hook) was considered and left out to keep the setup light during "can it work". If an agent ever skips review, add protection: require a PR and the `Checks` job on an up-to-date branch. It can't require an approval, because GitHub won't let Dom approve PRs opened from Dom's own account.
- Merges are rebase-only, so `main` holds only commits that passed the local hooks. Squash and merge commits are written by GitHub, skip the hooks, and can fail commit-lint in CI.
- Until hosting exists, the PR's CI checks are the production gate. A deploy job, when it comes, runs on `main` after merge.
