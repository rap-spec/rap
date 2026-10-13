# RAP: Responsible Agentic Payments

RAP is an open, protocol-neutral specification for the decision an automated payer makes **before** it pays: should this payment go ahead, to this payee, for this amount, on this network.

It defines four things an implementation returns and a payer can check:

1. **A decision object.** `allow`, `review` or `decline`, with a stable reason code and language-independent signal keys.
2. **Evidence entries.** Each entry states what was observed, where, from which source and when. The payer's policy decides how old is too old.
3. **Intent binding.** The decision names the exact payment it was made for, through a digest of a canonical Payment Intent.
4. **A decision receipt.** A signed, short-lived statement of the decision that anyone can verify later.

RAP also covers **payee continuity**: a payee that changed since the last payment, or that differs from the payee the seller published, raises the decision to at least `review`.

RAP works with x402, MPP, AP2, ACP and card-network agent programs. It does not replace any of them.

## Contents

| Path | What it is |
|---|---|
| [SPEC.md](SPEC.md) | The specification, draft v1.1 |
| [payment-intent/payment-intent-v1.md](payment-intent/payment-intent-v1.md) | Payment Intent v1 and the digest rules |
| [vectors/payment-intent-v1.json](vectors/payment-intent-v1.json) | 22 vectors for intent validation and digests |
| [vectors/decision-v1.1.json](vectors/decision-v1.1.json) | Decision vectors: payee continuity, token-contract payee, sanctions, malformed input (D1 to D8, run against an endpoint), plus continuity outcomes (D13 to D15, run against your continuity logic) |
| [GOVERNANCE.md](GOVERNANCE.md) | How changes are made and who decides |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to propose a change |
| [LICENSE.md](LICENSE.md) | CC BY 4.0 for the text, Apache 2.0 for code and vectors |

## Implementations

An implementation is listed here when it publishes its own conformance run against the vectors. Listing is not certification.

| Implementation | Scope | Conformance run |
|---|---|---|
| OceanAlt (reference) | Decision object, evidence, intent binding, receipt, payee continuity | `vectors/` run published by the implementer |
| A second, independent implementation (listed by name once it agrees) | Payment Intent v1 digests | 22/22 on `payment-intent-v1.json`, reported by the implementer on 2026-10-04 |

## Status

Draft v1.1. Open for review. Nothing in this repository is a standard of any foundation or standards body.
