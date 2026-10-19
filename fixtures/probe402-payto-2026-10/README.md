# probe402 payTo fixture set (2026-09-19 to 2026-10-18)

Observed payment requests from live x402 routes, read and published by [probe402](https://probe402.com). Redistributed here under the terms in `TERMS.txt`: credit probe402 and cite a row by its `capture_sha256`, which the day manifest at `https://probe402.com/chain/<sealed_in>` lists.

The readings describe routes, not people or organisations. Nothing here says that any route or operator is unsafe.

## What is in it

`sellers.csv` holds 360 readings of 9 routes, three for each pattern probe402 classed across 11,493 routes in the period:

| Pattern | Routes in the full probe402 set | What a reading sequence looks like here |
|---|---|---|
| `stable` | 523 | one payee throughout, not quoted by any other route |
| `rotating` | 33 | a new payee on every reading |
| `shared` | 10,567 | one payee throughout, quoted by three or more routes (one address in the period was quoted by 636 routes) |

Field definitions are in `FIELDS.md`.

## How the patterns map to Section 6 (payee continuity)

| Pattern | §6.1 / §6.2 comparison between consecutive readings | Expected `payee_continuity` | Note |
|---|---|---|---|
| `stable` | payee equal | `unchanged` | the case the continuity check is built for |
| `rotating` | payee differs on every reading | `changed`, every time | Without §6.4 corroboration (requirements signed by a key the seller used before, or a payee bound to the seller's origin) a decision service raises each payment to at least `review`. Some operators rotate payout addresses on purpose, so these routes show why corroboration has to exist for continuity checks to be usable in practice. |
| `shared` | payee equal per route | `unchanged` | The check per route passes. That the same payee sits behind many routes on different hosts is outside what §6 evaluates today; whether RAP should report it is an open question for the working group. |

These rows are inputs for discussion and for future vectors. They are not normative and do not change `decision-v1.1.json`.
