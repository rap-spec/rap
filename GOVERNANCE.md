# Governance

## Principles

1. **Open to any implementer.** Anyone can implement RAP without permission, fees or membership.
2. **No vendor owns the decision.** Changes are decided in public, on the record, by the process below.
3. **Implementations prove themselves by running the vectors**, not by claims.

## Roles

- **Editors** merge changes that have passed review. The initial editor is the OceanAlt team, which wrote the first drafts. The goal is at least two editors from unrelated organizations by v1.2; until then the initial editor commits to the process below and to stepping back from any change where it has a conflict.
- **Implementers** are organizations with a published conformance run. Each implementer may name one reviewer.
- **Contributors** are anyone who opens an issue or pull request.

## How a change is made

1. Open an issue describing the problem and, where possible, a vector that fails today.
2. Open a pull request against `SPEC.md` and `vectors/`. A behavior change MUST come with at least one vector.
3. The pull request stays open for review for at least 14 days.
4. It merges when an editor approves and no implementer reviewer has an unresolved objection. An objection must state the concrete failure it would cause.
5. Breaking changes (removing a field, changing the meaning of a reason code or signal key) need a new major version and a 60-day review.

Reason codes and signal keys are append-only. Once published, a key keeps its meaning.

## Moving to a foundation

When at least three unrelated organizations publish conformance runs, the editors will propose moving the repository to a neutral foundation or standards body chosen by the implementers. The licenses below allow that move without any one contributor's consent.

## Trademarks

"RAP" names this specification. No contributor's company name or logo is part of it, and conformance does not permit use of any contributor's marks.
