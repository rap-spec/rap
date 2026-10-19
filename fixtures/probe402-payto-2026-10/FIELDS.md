# payTo fixture set: field list

9 routes (3 stable, 3 rotating, 3 shared), 360 rows (one per reading), one CSV (`sellers.csv`). Rows read from 2026-09-19 to 2026-10-18T23:47:38.910Z (the newest reading read, on any route). Read from the probe402 archive.

**What is in it.** A route is one request on our list of routes, on its host. Every route we read in the period on a host not ours is classed by the payee address its readings carried. A route is classed when every reading we sent it in the period carried a payment request naming a payee, none of them on a test network, 4 or more of them, on a host whose operator has not asked us to read less of it: 11493 route(s) are. Of those, `stable` (one address throughout, which no other route we read quoted in the period): 523; `rotating` (a new address on every reading): 33; `shared` (one address throughout, which 3 or more routes we read quoted in the period): 10567; in none of the three: 370. Every row cites a capture whose hash its day's published manifest lists; 0 route(s) of the three patterns are left out because a reading's capture is not on a sealed day's manifest. The set is the 3 route(s) of each pattern with the most readings (ties go to the route's id), one route per host for `stable` and `rotating`, and for `shared` the routes of the one address the most such routes quote (636 routes we read quoted it in the period). A host of ours is never in the set.

**How to read it.** Each row is one reading that carried a payment request, on a route of one of the three patterns (`pay_to_pattern`): the address the route asked to be paid to (`pay_to`) on its network, the hash of the answer we captured (`capture_sha256`), and the day whose published manifest lists that hash (`sealed_in`).

**How to check a row.** Fetch https://probe402.com/chain/<sealed_in>: the day's manifest lists `capture_sha256` among its `blobs`, and its hash (the SHA-256 of the bytes served, less the final newline) is the `manifest_sha256` that https://probe402.com/chain publishes for that day.

A blank cell in a column a row fills is an absence, and `absence_reason` says why. A blank in a column it does not fill is not applicable. No count in this file is a zero standing in for an absence.

| Column | Source | Unit | What it does not say |
|---|---|---|---|
| `seller_host` | our list of routes (the route's URL) | host name | a legal party: one host can carry several sellers' routes (a gateway), and one seller several hosts |
| `endpoint_id` | our list of routes | identifier | that two ids are different sellers; a changed request gets a new id, and ids are never joined |
| `route` | our list of routes | method, path and any bound query | every route the seller offers: the routes we read |
| `observed_at` | the reading | UTC instant (ISO 8601) | the price at any other moment |
| `network` | the payment request the route returned to our unpaid request | chain id (CAIP-2 where stated) |  |
| `pay_to` | the payment request the route returned to our unpaid request | address | who the seller is: on a gateway many routes share one payee |
| `capture_sha256` | the captured answer we hold | sha256, hex | the answer's contents |
| `sealed_in` | the published chain of day manifests (/chain, and each day's manifest at /chain/<date>) | UTC date (YYYY-MM-DD): the day whose manifest lists `capture_sha256` among its `blobs`; that manifest's hash is the one /chain publishes for the day | the captured answer's contents: a manifest lists each capture's hash and size |
| `pay_to_pattern` | the route's readings in the period that carried a payment request, and every route we read that quoted the same address in the period | stable · rotating · shared, as the field list defines them | who controls an address, or why it changed or is shared |
| `absence_reason` | this file | sentence |  |

**What this sample cannot say.**

- Who controls an address, or who stands behind a host. A payee address is where a route asked to be paid, never a party; on a gateway many routes share one address.
- Why an address rotates or is shared, or what a route answered between two readings. Each route is read on its own calendar, and a day with no row is a day with no reading of that route.
- Anything else a payment request carried: the amount, the asset, the scheme and every other field are not in this set.
- The captured answer's bytes. `capture_sha256` names each answer, and `sealed_in` names the published day manifest that lists its hash and size.
- A route's readings outside the period, or a route not in the set: the three patterns are read over the period alone.

Every row the rule produced passed our publication check.
