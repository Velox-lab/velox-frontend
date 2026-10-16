# Contributing to velox-frontend

Thanks for helping. This repo is a React component library and client for Velox payments on Stellar.

## Finding work

Pick an open issue labeled [`good first issue`](https://github.com/Velox-lab/velox-frontend/labels/good%20first%20issue) or [`help wanted`](https://github.com/Velox-lab/velox-frontend/labels/help%20wanted). Comment on the issue to say you are taking it, so two people do not build the same thing. For anything not covered by an issue, open one first and describe the change.

## Setup

You need Node.js **22.12 or newer** (required by `@stellar/stellar-sdk` 17).

```bash
git clone https://github.com/Velox-lab/velox-frontend.git
cd velox-frontend
npm ci
```

## Checks to run before opening a PR

CI runs exactly these commands:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

The project target is 95% coverage (`npm test -- --coverage` reports it). It is not met yet because the hooks and `VeloxClient` have no tests, and CI does not enforce it, but new code should arrive with tests.

## Branches and commits

- Branch from `main`: `feat/short-name`, `fix/short-name`, `docs/short-name`, `test/short-name`.
- Commit messages follow the existing style: `feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`, then a short imperative summary. Explain the why in the body when it is not obvious.
- One concern per PR.
- If you change dependencies, commit the updated `package-lock.json`.

## Code conventions

The layers are strict, as described in [ARCHITECTURE.md](ARCHITECTURE.md):

- **Components render only.** They take props and return markup. No network calls, no wallet logic.
- **Hooks hold state and actions.** Components call hooks; they never call `VeloxClient` directly.
- **`VeloxClient` is the only module that talks to the blockchain.** It returns typed domain objects and throws typed errors, so no raw SDK types or exceptions leak upward.
- **Tests first**, next to the code as `*.test.ts(x)`, using Testing Library for components. Query by role or label the way a user would, and assert on what the user sees.
- **Accessible by default:** labelled controls, correct roles, keyboard support.
- Update the README and ARCHITECTURE.md when you add or change a public component, hook or client method, and export it from `src/index.ts`.

## Documentation must match the code

Docs are held to the same standard as code. Before submitting a docs PR, check that every file, command, script and setting you mention exists on `main`, and that any commands you give actually run. If something is planned but not built yet (for example Storybook is listed in `package.json` but not configured), say so or link the issue instead of describing it as available.

## Pull requests

- Link the issue with `Closes #N` in the description.
- Fill in the PR template.
- Wait for the CI check to pass. If it shows "waiting for approval" because this is your first contribution, a maintainer needs to approve the run.
- Expect review comments; small follow-up commits on the same branch are fine.

## Reporting security problems

Do not describe a vulnerability in a public issue or pull request. Open an issue that only asks the maintainers for a private way to report it, with no details, and we will get in touch.
