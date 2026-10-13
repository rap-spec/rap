# RAP Decision Interface, draft v1.1

Status: draft for review, 2026-10-09; sections 2.1, 6.4 and 6.5 revised 2026-10-13 (proposed, see #1). The key words MUST, SHOULD and MAY are used as in RFC 2119.

## 1. Scope

A **payer** is the agent, wallet or platform about to send a payment. A **decision service** answers one question for the payer before funds move: *should this payment go ahead?*

RAP specifies the shape of that answer and the evidence behind it, so a payer can switch decision services, run several in parallel, or audit a past decision without depending on one vendor's format.

## 2. The decision object

A decision service MUST return:

| Field | Type | Meaning |
|---|---|---|
| `decision` | `"allow"` \| `"review"` \| `"decline"` | Exactly three values. A fourth value would be read by existing payers as their default path, which is usually "pay". |
| `reason_code` | string | Stable, machine-readable. Registered codes are listed in §2.1. |
| `signal_class` | string | `ok`, `regulatory`, `uncertain`, `authorization`, `payment` or `client_error`. |
| `retry` | string | What the payer can do next: `not_applicable`, `non_retryable`, `policy_dependent_backoff`, `retry_after_authorization`, `retryable_after_funding`, `retry_after_fix`. |
| `signal_keys` | string[] | Language-independent keys such as `list.sanctions` or `payee.token_contract`. Payers branch on these, never on prose. Keys are append-only: once published, a key keeps its meaning. |
| `evidence` | Evidence[] | §3. |

A decision service MUST NOT return `allow` when screening could not run. It returns `review` with `reason_code: "screening_unavailable"` and `signal_class: "uncertain"`.

### 2.1 Registered reason codes (initial set)

| reason_code | decision | signal_class | retry |
|---|---|---|---|
| `clear` | allow | ok | not_applicable |
| `sanctioned_or_high_risk_payee` | decline | regulatory | non_retryable |
| `elevated_risk_payee` | review | uncertain | policy_dependent_backoff |
| `screening_unavailable` | review | uncertain | policy_dependent_backoff |
| `payee_is_token_contract` | decline | client_error | retry_after_fix |
| `payee_changed_since_previous` | review | authorization | retry_after_authorization |
| `payee_differs_from_listing` | review | authorization | retry_after_authorization |
| `payee_not_bound_to_origin` | review | authorization | retry_after_fix |
| `payee_origin_binding_unavailable` | review | uncertain | policy_dependent_backoff |
| `mandate_intent_mismatch` | decline | authorization | retry_after_authorization |
| `over_per_tx_limit` | decline | payment | retryable_after_funding |
| `invalid_input` | — (400) | client_error | retry_after_fix |

New codes are added through the change process in GOVERNANCE.md.

## 3. Evidence

Each evidence item describes one observation about one subject. It MUST NOT carry a verdict of its own.

```json
{
  "type": "issuer_freeze",
  "subject_ref": "payee",
  "source": "usdc-issuer-blacklist",
  "status": "not_frozen",
  "anchor": { "chain": "eip155:8453", "block": "21000000" }
}
```

| Field | Required | Meaning |
|---|---|---|
| `type` | MUST | What kind of observation: `list_membership`, `issuer_freeze`, `contract_code`, `transfer`, `listing`, `adverse_media`, `attestation`. |
| `subject_ref` | MUST | Which part of the payment it is about: `payee`, `payer_address`, `asset_id`, `resource_ref`. |
| `source` | MUST | Where the observation came from, as a stable identifier or URL. |
| `status` | MUST | The observed state, from a vocabulary fixed per `type` (for example `listed` / `not_listed`, `frozen` / `not_frozen`). |
| `anchor` | MUST | What a third party needs to re-find the same source state: a chain and block for on-chain reads, a publication date and content hash for published lists, or the read time when neither exists. |
| `observed_at` | SHOULD | When the source was read, when `anchor` does not already carry it. |

An item whose `anchor` lets a third party reproduce the observation is **recomputable**. A block number and a list hash are recomputable; a read time alone is not.

The **evidence set** is `{ "v": "1", "items": [...] }`, items sorted by their canonical (RFC 8785) form, exact duplicates rejected, canonicalized with RFC 8785 and hashed with SHA-256 into `evidence_set_digest` (vectors E1 and EN1 in `vectors/payment-intent-v1.json`).

**Freshness belongs to policy.** Evidence states when it was observed. Whether that is too old is decided by the payer's policy for that type of evidence, not by the decision service. A decision service MUST NOT describe evidence as stale or complete on the payer's behalf.

**Each evidence type answers only the question it is qualified for.** Delivery or fulfilment evidence about a seller does not show that a payee address is the seller's address. Payee continuity (§6) is a separate check.

## 4. Intent binding

When the payer sends a Payment Intent (see `payment-intent/payment-intent-v1.md`), the decision service MUST:

1. Validate it with the rules in that document and reject it when invalid. It never repairs an intent.
2. Compute `payment_intent_digest` with RFC 8785 canonicalization and SHA-256.
3. Return the digest with the decision, and screen the payee, network and asset from the intent, not from separate parameters.

A payer computes the same digest locally. A decision whose digest differs from the payer's own was made for a different payment and MUST NOT be used.

## 5. Decision receipt

A decision service SHOULD issue a receipt for `allow` and `review` decisions: a compact JWS signed with EdDSA.

Payload fields: `v`, `iss`, `decision_ref`, `payment_intent_digest`, `decision`, `reason_code`, `evidence_set_digest`, `policy_ref`, `issued_at`, `expires_at`.

- Verifiers resolve `kid` only from the issuer's published key set at a fixed well-known path. They ignore `jku`, `x5u` and `jwk` inside the token.
- Retired keys stay published, so old receipts stay verifiable after `expires_at`.
- `policy_ref` is immutable; a rule change produces a new reference.
- A receipt is evidence that a decision was made. It is not authority to move funds. Single-use execution belongs to the payment rail or wallet.

## 6. Payee continuity

Most payee substitution attacks use a new, clean address. List screening cannot see them. The checks below can.

**6.1 Against the previous payment.** The payer MAY send `previous_payment_intent`: the intent of its last payment to the same seller. The decision service compares fields. A change in `payee`, `network` or `asset_id` is high severity and MUST raise `allow` to at least `review` with `payee_changed_since_previous`. A change of host in `resource_ref`, or an amount jump beyond a stated factor, is medium severity and is reported without changing the decision.

**6.2 Against the seller's published listing.** When the seller's payout address is published in a directory the decision service reads (for x402, a discovery directory), and the intent carries `resource_ref`, the service compares the intent's payee with the listed payee. A mismatch MUST raise `allow` to at least `review` with `payee_differs_from_listing`. The service reports when the listing itself changed its payee recently.

**6.3 Reporting the outcome.** A response that ran a continuity check carries `payee_continuity` with one of four values: `unchanged`, `changed`, `not_evaluated` (no previous intent and no listing to compare with) or `indeterminate` (the comparison could not run, for example the directory was unreachable). `not_evaluated` and `indeterminate` MUST NOT be reported as `unchanged`.

**6.4 Corroborated changes.** A seller may rotate its payout address on purpose. When the current payment requirements are signed by a key the seller already used for earlier requirements, or the new payee is bound to the seller's origin as described in 6.5 (result `bound`), the service reports `corroborated: true` with the evidence. A corroborated change still sets `payee_continuity: changed`; whether it may stay `allow` is the payer's policy, not the service's. An uncorroborated change follows 6.1 and 6.2.

**6.5 Against the origin that served the terms.** 6.1 and 6.2 compare the payee with payment history and with a directory. Neither shows that the payee is bound to the origin the payer is talking to. A syntactically valid set of payment requirements can still name a payee unrelated to the origin that served them.

When `resource_ref` is an absolute HTTP or HTTPS URL supplied by the payer to identify the resource it actually requested, the service MAY evaluate whether the payee is bound to that request origin, the origin of the URL as defined by RFC 6454 (scheme, host and port, with the default port when none is given). Parsing the URL for this check does not change `resource_ref`: the Payment Intent digest still binds the original string exactly (Payment Intent v1 keeps `resource_ref` opaque). When `resource_ref` is absent, or is not an absolute HTTP or HTTPS URL (for example a `urn:` identifier), there is no request origin and this check does not apply.

A binding is established, for example, when the exact payment requirements naming the payee verify under a key anchored at that origin, or when an authenticated binding published under the origin's control names that payee. The evidence records the binding method and its source. RAP does not yet define one mandatory binding mechanism, which is why this check is MAY.

The service reports `payee_origin_binding` with one of four values:

- `bound`: a binding method completed and the payee is bound to the origin.
- `unbound`: an applicable binding method completed and the payee is not bound to the origin.
- `not_evaluated`: no request origin, or no supported binding method applies.
- `indeterminate`: an applicable method was attempted and could not complete, for example the origin was unreachable.

`not_evaluated` and `indeterminate` MUST NOT be reported as `bound`. An `unbound` result MUST prevent `allow`: an otherwise-`allow` decision is raised to at least `review` with `reason_code: "payee_not_bound_to_origin"` and the signal key `payee.origin_binding`. An `indeterminate` result MUST NOT leave an otherwise-`allow` decision at `allow`: the service raises it to at least `review` with `reason_code: "payee_origin_binding_unavailable"` and the same signal key, because a check that applied and did not finish has not passed. `bound` and `not_evaluated` do not change the decision on account of this check: a binding that holds adds no risk, and when no binding check applied there is nothing to act on. Other checks may still change the decision.

A `bound` result establishes only that the origin and the payee are consistent. It does not establish the seller's identity, legitimacy or safety.

Vectors D9 to D12 in `vectors/decision-v1.1.json` (`origin_binding_vectors`) cover the four outcomes. They are optional-feature vectors: an implementation that does not implement this section is not required to run them and keeps its base conformance; an implementation that implements or claims this section MUST pass them. They supply the binding outcome as an input, so the result does not depend on a live origin.

Raised in [#1](https://github.com/rap-spec/rap/issues/1) from a mis-attributed payment on a live x402 service.

These checks only raise the decision. They never lower it.

## 7. What RAP does not do

- **It does not move money.** RAP sits before settlement. It holds no funds and signs no transfers.
- **It does not replace KYC or KYB.** A decision can carry identity evidence, but RAP does not verify people or companies.
- **It does not judge entities.** Evidence states observations with sources. Adverse media, for example, is returned as a hint for the payer's policy and does not change the decision on its own.
- **It does not set the payer's policy.** Risk appetite, freshness limits and which evidence types count are the payer's choice.
- **It does not certify.** Passing the vectors shows conformance with the vectors. It is not an audit, a license or an endorsement.
- **It does not define a payment protocol.** It works alongside x402, MPP, AP2, ACP and others.

## 8. Conformance

`vectors/` holds request and expectation pairs. An implementation claims conformance with a vector set by publishing its full run: every vector, pass or fail, with the date and the implementation version. Partial claims name the vectors they cover.
