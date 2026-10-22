# Contributing

Thanks for helping improve 2048³. Small, focused changes are easiest to review.

## Get started

Use Node.js 22 or later. Run `npm ci`, then `npm run web`. This repository is
web-only: please do not copy native app code, store credentials, or private project
notes into it. The `private` field in package.json prevents accidental npm
publication; it does not restrict the MIT license or the public GitHub repository.

## Before opening a pull request

1. Add a regression test for changed behavior. Keep rules independent of React.
2. Run `npm run format`, `npm run lint`, `npm run typecheck`,
   `npm test -- --runInBand`, and `npm run build:web`.
3. For visual changes, check narrow phones and desktop widths, all six swipe
   directions, keyboard input, and reduced-motion settings. Include screenshots.
4. Describe the problem, solution, and checks performed. Explain any intentional
   change to saved games or scoring. Do not commit generated exports or dependencies.

Prefer comments explaining a rule or tradeoff over comments narrating obvious
syntax. Avoid unrelated dependency upgrades and large abstractions for one use.

## Compatibility and privacy

Keep local saves backward-compatible, and never erase a saved run silently.
The game needs no backend, analytics, login, or personal permissions. Discuss any
change to that boundary before implementation. Read [SECURITY.md](SECURITY.md)
before reporting security concerns; never put secrets in a public issue.

New top-level files must be reflected in the public inventory test. See
[architecture](docs/architecture.md) before changing the move or animation pipeline.
