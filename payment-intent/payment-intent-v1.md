# RAP Payment Intent v1 and Decision Receipt v1

Status: v1, first published 2026-10-04 and cross-checked by two independent implementations. Test vectors: `../vectors/payment-intent-v1.json`.

## 1. Payment intent

```json
{
  "v": "1",
  "payee": "0x…",
  "amount_atomic": "850000",
  "asset_id": "eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  "network": "eip155:8453",

  "request_ref": "optional",
  "payer_address": "optional: the wallet that originates the payment",
  "principal_ref": "optional: the principal or agent identity in the caller's authorization system",
  "resource_ref": "optional, opaque, never normalized",
  "purpose_ref": "optional",
  "mandate_ref": "optional"
}
```

`payer_address` and `principal_ref` are separate fields, and both are bound into the digest when present.

### Validation, in order. Any failure rejects the intent and no digest is produced.

1. The raw JSON text has no duplicate member names at any depth (`duplicate_member:<name>`).
2. The input is an object with no fields beyond the eleven above (`unknown_field:<name>`).
3. All required fields are present (`missing_required:<name>`).
4. Every present field is a JSON string (`non_string_value:<name>`) and is not empty (`empty_value:<name>`). An absent optional field stays absent. An empty one is an error.
5. `v` is `"1"`. `amount_atomic` matches `^(0|[1-9][0-9]*)$`. `network` is CAIP-2. `asset_id` is CAIP-19.
6. The chain inside `asset_id` equals `network` (`asset_network_mismatch`).
7. On `eip155`, `payee`, `payer_address` (when present) and the ERC-20 contract in `asset_id` are 20-byte `0x` hex addresses (`invalid_address:<name>`, `invalid_asset_id`).

### Normalization

v1 defines exactly one: on `eip155`, the hex addresses in `payee`, `payer_address` and the ERC-20 contract in `asset_id` are lowercased. Nothing else is trimmed, changed or repaired.

### Canonicalization and digest

RFC 8785 (JCS). All scalar leaf values are JSON strings. Property names are sorted by UTF-16 code units. No Unicode normalization.

`payment_intent_digest = "sha256:" + hex(SHA-256(UTF-8 bytes of the JCS output))`

## 2. Decision receipt

JWS, compact serialization.

```
Protected header: { "alg": "EdDSA", "kid": "<kid>", "typ": "<issuer>-decision-receipt+jws" }

Payload:
{
  "v": "1",
  "iss": "https://decision-service.example",
  "decision_ref": "dr_…",
  "payment_intent_digest": "sha256:…",
  "decision": "allow" | "review" | "decline",
  "reason_code": "clear",
  "evidence_set_digest": "sha256:…",
  "policy_ref": "…",
  "issued_at": "2026-10-04T10:00:00Z",
  "expires_at": "2026-10-04T10:15:00Z"
}
```

- Resolve `kid` only from the issuer's key set at a fixed, published well-known path (the reference implementation uses `https://oceanalt.com/.well-known/oceanalt-keys.json`). Ignore any `jku`, `x5u` or `jwk` in a signed object.
- Retired keys stay listed permanently, so old receipts stay verifiable for audit after `expires_at`.
- `policy_ref` is immutable. A rule change produces a new ref.
- The receipt is evidence of a decision, not authority to move funds. Single-use execution stays with the wallet or rail (for example an `attempt_id` it rejects on reuse).

## 3. What the vectors cover

| Case | Vectors |
|---|---|
| Same intent, different spellings | P1 to P3 produce one digest |
| A change to a bound field | P4 amount, P11 payee, P6 asset, P10 payer_address (vs P7), P12 principal_ref (vs P7) each change the digest. P5 is a coherent network-and-asset change |
| A network change that conflicts with `asset_id` | Rejected before any digest (N3, `asset_network_mismatch`) |
| Rejection rules | N1 to N10 |
| Evidence set digest | E1, EN1 |
| Replay | Out of scope for the digest; handled by the wallet or rail |
