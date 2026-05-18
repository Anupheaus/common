# auditor

Append-only audit log for domain entities — stores a history of operations and can reconstruct or time-travel over object state.

## Overview

This module provides `AuditOf<T>`, a data structure that wraps an entity's full change history as an ordered array of typed operations. Helper functions read and mutate these audit records: reconstructing the current state, cloning an audit, adding operations in timestamp order, and replaying history up to a given point.

Consumers work with `AuditOf<T>` values directly (they are plain serialisable objects). The functions in `auditor.ts` are the read/write API.

## Contents

### Data structure (`auditor-models.ts`)
- `AuditOf<T>` — `{ id: string; history: AuditRecord<T>[] }` — the serialisable audit envelope.
- `AuditRecord<T>` — discriminated union of all operation types:
  - `AuditCreateOrRestoredRecord<T>` — `type: 'created' | 'restored'`, carries the full entity snapshot.
  - `AuditUpdateRecord` — `type: 'updated'`, carries a `just-diff` patch array (`ops`).
  - `AuditDeleteRecord` — `type: 'deleted'`, no payload beyond timestamp and userId.
  - `AuditBranchedRecord<T>` — `type: 'branched'`, carries a full snapshot but **no `userId`** — used for system-generated forks.
- `AuditOperation` — a single `just-diff` operation (`add`, `remove`, `replace`) with `path` and `value`.
- `Timestamp` — `number` (milliseconds since epoch, UTC, via Luxon).

### Functions (`auditor.ts`)
- `getCurrentRecordForAudit(audit, onError?)` — Reconstructs and caches the current entity by replaying history. Cached in a `WeakMap` keyed on the `AuditOf` object.
- `setCurrentRecordForAudit(audit, record)` — Manually updates the WeakMap cache (use after applying an optimistic update).
- `cloneAudit(audit)` — Deep-clones the audit and copies the WeakMap cache entry to the clone so reconstruction is not repeated.
- `addOpToAudit(audit, operation)` — Inserts an operation in timestamp order (operations arriving out of order are inserted at the correct position, not appended).
- `getOperationsUpTo(audit, timestamp?)` — Returns the slice of history up to (and including) the given timestamp; returns all history if `timestamp` is omitted.

## Architecture

History is stored as a flat array ordered by `timestamp` (UTC milliseconds). Reconstruction works by replaying all operations from the beginning: `created`/`restored` operations establish a baseline snapshot; `updated` operations apply `just-diff-apply` patches; `deleted` yields `undefined`; `branched` resets to a new snapshot without a userId.

The WeakMap cache (`currentRecordCache`) holds the reconstructed entity for each `AuditOf` instance. It is invalidated by replacing the `AuditOf` reference or by calling `setCurrentRecordForAudit` explicitly.

## Decision rationale

`AuditOf<T>` is a plain serialisable object (not a class) so audit records can be stored and retrieved from a database without a deserialisation step. The functions are separate from the data structure for the same reason.

`branched` records have no `userId` by design: they represent system forks (e.g. a copy created by an automated process) where attributing to a user would be misleading.

Prototype pollution is guarded by `hasDangerousPath` which blocks any diff operation whose path contains `__proto__`, `constructor`, or `prototype`.

## Ambiguities and gotchas

- **WeakMap cache invalidation**: replacing the `AuditOf` object reference (e.g. spreading into a new object) silently drops the cache entry. Always use `cloneAudit` rather than spreading to copy an audit.
- **Out-of-order insertions**: `addOpToAudit` binary-inserts by timestamp. If two operations have the same timestamp, the later-arriving one is inserted after the earlier one — ordering within the same millisecond is not guaranteed.
- **`'restored'` vs `'created'`**: both carry full snapshots and behave identically during reconstruction. The distinction is semantic — `'created'` is the initial state; `'restored'` is a rollback to a prior state.
- **Reconstruction cost**: replaying a long history is O(n) in the number of operations. For frequently-accessed hot records, ensure `setCurrentRecordForAudit` is called after each mutation so the cache stays current rather than replaying from scratch.
