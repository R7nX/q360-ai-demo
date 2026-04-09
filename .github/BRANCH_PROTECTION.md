# Branch Protection — Setup Instructions

> Apply these settings in GitHub → Settings → Branches → Add rule for `main`.

## Recommended Rules for `main`

| Setting | Value |
|---------|-------|
| **Require a pull request before merging** | Yes |
| Require approvals | 1 |
| **Require status checks to pass** | Yes |
| Required checks | `Lint, Type Check & Build`, `CodeQL Analysis`, `Check for vulnerable dependencies` |
| **Require branches to be up to date** | Yes |
| **Restrict who can push** | Team lead only (or nobody — PRs only) |
| **Do not allow force pushes** | Yes |
| **Do not allow deletions** | Yes |

## How to Apply

1. Go to your repo on GitHub
2. Settings → Branches → Add branch protection rule
3. Branch name pattern: `main`
4. Check the boxes above
5. Save changes

> Note: These settings require a GitHub Team or Pro plan for private repos.
> For public repos, all of these are free.
