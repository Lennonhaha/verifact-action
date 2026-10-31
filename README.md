# verifact claim binding

A GitHub Action that fails a build when a **number written in Markdown** does not
bind to an **artefact that exists in the repository**, or binds to one whose value
disagrees.

This is a thin wrapper: the checker itself lives in
[`Lennonhaha/fibemate-tools`](https://github.com/Lennonhaha/fibemate-tools/tree/main/verifact).
The source is vendored here at a pinned commit (`verifact/VENDORED.json`) so the
action runs with no install step and no network access.

## Why

CI is very good at proving that the code compiles and that the tests you wrote
pass. It is silent about the numbers in your README. Those numbers decay: a
benchmark is re-run, a table is edited, a paragraph keeps the old value. Nothing
fails, because nothing compares the prose to the artefact.

`verifact` extracts numeric claims from Markdown, tries to bind each one to a
value in a JSON/log/CSV/source artefact, and reports four distinct outcomes:
verified, drifted, ambiguous, unbound. A build that only ever says "0 errors"
tells you nothing; the point here is that **unbound is a reported state, not a
success**.

## Usage

```yaml
name: docs

on: [push, pull_request]

jobs:
  claims:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Lennonhaha/verifact-action@v1
        with:
          config: verifact.json     # default
          fail-on: drift            # default: fail only on a real mismatch
```

With a report file and the JSON format:

```yaml
      - uses: Lennonhaha/verifact-action@v1
        with:
          format: json
          out: verifact-report.json
          extra-args: '--no-cache'
```

## Inputs

| Input | Default | Meaning |
| --- | --- | --- |
| `config` | `verifact.json` | Config path, relative to `workdir`. |
| `workdir` | `.` | Directory to scan. |
| `fail-on` | `drift` | `none` never fails; `drift` fails when a bound value disagrees with its artefact; `review` also fails on ambiguous bindings; `lint-high` fails on high-severity wording lint. |
| `format` | `text` | `text`, `json` or `md` on stdout. |
| `out` | *(empty)* | Also write the report to this file, relative to `workdir`. |
| `extra-args` | *(empty)* | Passed through verbatim, e.g. `--no-cache --deep --concurrency 4`. |
| `node-version` | `20` | Node.js used to run the checker. |

## Outputs

| Output | Meaning |
| --- | --- |
| `exit-code` | `0` pass, `1` gate failed or a scan error, `2` usage/config error. |
| `report-path` | Absolute path of the written report, empty when `out` is unset. |

`unbound` claims do **not** fail the default gate. That is deliberate: in real
corpora most unbound claims are prose that was never meant to be a measurement.
If you want them to fail, either bind them or run with `fail-on: review` and
triage what it surfaces.

## What this does not do

- It does not prove the artefact is *correct*, only that the document and the
  artefact **agree**, and that the artefact exists at the commit being built.
- It does not read your mind about which prose number is a claim. Ambiguity is
  reported as `ambiguous`, and the config has `ignore` / `deny` lists that
  require a written reason per entry.
- It is not a security scanner. `--deep` extracts more aggressively and raises
  the false-positive rate.

## Vendored source

`verifact/` is a copy of `fibemate-tools/verifact` at the commit in
`verifact/VENDORED.json`, with per-file SHA-256 hashes. `scripts/verify-vendored.cjs`
recomputes them; CI runs it, so a local edit that is not upstreamed fails here
rather than silently diverging. To update: copy from upstream, regenerate
`VENDORED.json`, and note the upstream commit in the PR.

## Licence

Apache-2.0. The vendored checker carries its own `LICENSE` file.
