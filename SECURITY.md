# Security Policy

velox-frontend builds and signs Stellar transactions through a connected
wallet (Freighter). Treat anything that could get a user to sign or send a
transaction they did not intend, leak wallet state, or misreport a balance
or stream's status, as a security issue.

## Reporting a vulnerability

**Do not open a public issue or pull request describing the vulnerability.**
Instead, open an issue using the normal issue form with only a short note
asking for a private way to reach the maintainers — no details about the
vulnerability itself — and we will follow up to arrange a private channel.

Please include, once we are in touch privately:

- A description of the issue and its potential impact.
- Steps to reproduce it, or a proof of concept.
- The version or commit you tested against.

We will acknowledge your report, work with you to understand and fix the
issue, and credit you in the fix unless you ask us not to.

## Supported versions

Only the `main` branch is supported. There are no published package versions
yet; once there are, security fixes will target the latest minor version.

## Scope

In scope:

- This repository's code (`src/`, build, and CI configuration).
- How `VeloxClient` interacts with the `velox-contracts` contracts it calls.

Out of scope:

- Vulnerabilities in `@stellar/stellar-sdk`, `@stellar/freighter-api`, React,
  or other third-party dependencies — report those to their own maintainers.
- Vulnerabilities in the Freighter extension itself.
