# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please report it privately to the team lead via Slack DM. Do not open a public issue.

## Security Practices

### Credentials
- All API keys and passwords live in `.env.local` (gitignored)
- Never hardcode secrets in source code
- All Q360 and Gemini API calls happen in Next.js API Routes (server-side only)
- The `.env.example` file contains placeholder values only

### Dependencies
- Dependabot is enabled for automated dependency updates
- The Dependency Review action blocks PRs that introduce high-severity vulnerabilities
- CodeQL runs on every PR for static analysis (SAST)

### Code Review
- All PRs require at least one approval before merge
- The CI pipeline must pass (lint + type check + build) before merge
