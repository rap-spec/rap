// Usage: node vectors/run-decision-vectors.mjs vectors/decision-v1.1.json <your decision endpoint URL>
// The endpoint takes a JSON POST body with payment_intent (and previous_payment_intent) and returns the RAP decision object.
import fs from "node:fs";
import crypto from "node:crypto";
const V = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const order = V.decision_order;
const jcs = (o) => JSON.stringify(Object.keys(o).sort().reduce((a, k) => (a[k] = o[k], a), {}));
let pass = 0;
for (const v of V.vectors) {
  const r = await fetch(process.argv[3] || "https://oceanalt.com/api/decide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v.request) });
  const j = await r.json().catch(() => ({}));
  const e = v.expect, fails = [];
  if (e.rejected) { if (r.status !== 400) fails.push(`status ${r.status}`); if (!JSON.stringify(j).includes(e.error_code)) fails.push(`no ${e.error_code}: ${JSON.stringify(j).slice(0,120)}`); }
  else {
    if (e.decision && j.decision !== e.decision) fails.push(`decision ${j.decision}`);
    if (e.decision_at_least && order.indexOf(j.decision) < order.indexOf(e.decision_at_least)) fails.push(`decision ${j.decision}`);
    if (e.reason_code && j.reason_code !== e.reason_code) fails.push(`reason ${j.reason_code}`);
    if (e.signal_class && j.signal_class !== e.signal_class) fails.push(`class ${j.signal_class}`);
    if (e.signal_keys_contain && !(j.signal_keys || []).includes(e.signal_keys_contain)) fails.push(`keys ${j.signal_keys}`);
    if (e.evidence_nonempty && !(j.evidence || []).length) fails.push("no evidence");
    if (e.evidence_set_valid) { const it = j.evidence_set?.items; if (!Array.isArray(it) || !it.length || !it.every((x) => ["type", "subject_ref", "source", "status", "anchor"].every((k) => k in x))) fails.push("evidence_set invalid"); }
    if (e.payment_intent_digest_equals_local) {
      const pi = { ...v.request.payment_intent }; for (const k of ["payee", "asset_id"]) pi[k] = pi[k].toLowerCase();
      const d = "sha256:" + crypto.createHash("sha256").update(jcs(pi)).digest("hex");
      if (j.payment_intent_digest !== d) fails.push(`digest ${j.payment_intent_digest} vs ${d}`);
    }
  }
  console.log(v.id, fails.length ? "FAIL " + fails.join("; ") : "pass", "|", j.decision, j.reason_code);
  if (!fails.length) pass++;
}
console.log(`${pass}/${V.vectors.length}`);
