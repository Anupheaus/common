import { type Record, is } from '../extensions';
import type { AuditRecord, AuditOf, Timestamp, AuditRecordType, AuditBranchedRecord, AuditCreateOrRestoredRecord } from './auditor-models';
import { diffApply } from 'just-diff-apply';
import { diff } from 'just-diff';
import { InternalError } from '../errors';
import { DateTime } from 'luxon';

const currentRecordCache = new WeakMap<AuditOf<Record>, Record | undefined>();

const createTimestamp = () => DateTime.utc().toMillis();

function getCurrentRecordForAudit<T extends Record>(audit: AuditOf<T>, onError?: (error: Error) => void): T | undefined {
  if (currentRecordCache.has(audit)) return currentRecordCache.get(audit) as T | undefined;
  const record = createRecordFrom(audit, undefined, onError);
  currentRecordCache.set(audit, record);
  return record;
}

function setCurrentRecordForAudit<T extends Record>(audit: AuditOf<T>, record: T | undefined) {
  currentRecordCache.set(audit, record);
}

function cloneAudit<T extends Record>(audit: AuditOf<T>) {
  const auditClone = Object.clone(audit);
  const currentRecord = currentRecordCache.get(audit);
  if (currentRecord != null) currentRecordCache.set(auditClone, currentRecord);
  return auditClone;
}

function addOpToAudit<T extends Record>(audit: AuditOf<T>, operation: AuditRecord<T>) {
  const history = audit.history;
  if (history.last()?.timestamp ?? 0 < operation.timestamp) { history.push(operation); return; }
  const index = history.findIndex(op => op.timestamp > operation.timestamp);
  if (index == -1) {
    return history.push(operation);
  } else if (index === 0) {
    return history.unshift(operation);
  } else {
    return history.splice(index, 0, operation);
  }
}

function getOperationsUpTo<T extends Record>(audit: AuditOf<T>, timestamp?: Timestamp) {
  if (!isAudit(audit)) return [];
  if (timestamp == null) return audit.history;
  if ((audit.history.last()?.timestamp ?? 0) < timestamp) return audit.history;
  const index = audit.history.findIndex(op => op.timestamp > timestamp);
  if (index == -1) return audit.history;
  return audit.history.slice(0, index);
}

function performOperation<T extends Record>(record: T | undefined, operation: AuditRecord<T>, onError?: (error: Error) => void) {
  switch (operation.type) {
    case 'created': {
      record = operation.value;
      break;
    }
    case 'updated': {
      if (record == null) return;
      try {
        diffApply(record, operation.ops.map(({ type, ...rest }) => ({ ...rest, op: type })));
      } catch (err) {
        const error = new InternalError('Audit operation failed on record', { meta: { error: err, operation, record } });
        if (typeof onError === 'function') {
          onError(error);
        } else {
          throw error;
        }
      }
      break;
    }
    case 'restored': {
      record = operation.value;
      break;
    }
    case 'deleted': {
      record = undefined;
      break;
    }
  }
  return record;
}

function createRecordFrom<T extends Record>(audit: AuditOf<T>, timestamp?: Timestamp, onError?: (error: Error) => void): T | undefined {
  if (timestamp == null && currentRecordCache.has(audit)) return getCurrentRecordForAudit(audit, onError);
  const operations = getOperationsUpTo(audit, timestamp);
  if (operations.length == 0) return;
  const lastOp = operations.last();
  const firstOp = operations.first();
  if (lastOp?.type === 'deleted') return;
  if (firstOp?.type !== 'created') return;
  const original = firstOp.value;
  let record: any = Object.clone(original);
  for (const operation of operations) { record = performOperation(record, operation, onError); }
  setCurrentRecordForAudit(audit, record);
  return record;
}

function createAuditFrom<T extends Record>(record: T, userId: string): AuditOf<T> {
  return {
    id: record.id,
    history: [{ type: 'created', value: Object.clone(record), userId, timestamp: createTimestamp() }],
  };
}

function updateAuditWith<T extends Record>(currentRecord: T | undefined, auditRecord: AuditOf<T>, userId: string, onError?: (error: Error) => void): AuditOf<T> {
  if (currentRecord == null) return deleteRecord(auditRecord, userId);
  const auditRecordClone = cloneAudit(auditRecord);
  const recentRecord = createRecordFrom(auditRecordClone, undefined, onError);
  if (recentRecord == null) {
    // audit has been deleted, so restore with this record    
    addOpToAudit(auditRecordClone, { type: 'restored', value: currentRecord, userId, timestamp: createTimestamp() });
  } else {
    const ops = diff(recentRecord, currentRecord);
    if (ops.length === 0) return auditRecord; // no changes
    addOpToAudit(auditRecordClone, { type: 'updated', timestamp: createTimestamp(), ops: ops.map(({ op, ...rest }) => ({ ...rest, type: op })), userId });
  }
  setCurrentRecordForAudit(auditRecordClone, currentRecord);
  return auditRecordClone;
}

function restoreTo<T extends Record>(audit: AuditOf<T>, timestamp: Timestamp, userId: string, onError?: (error: Error) => void): { record: T | undefined, audit: AuditOf<T>; } {
  if (!isAudit(audit)) { onError?.(new InternalError('The audit provided was not a valid audit record', { meta: { audit } })); return { record: undefined, audit }; }
  const auditRecordClone = cloneAudit(audit);
  const record = createRecordFrom(auditRecordClone, timestamp, onError);
  if (record == null) return { record: undefined, audit: deleteRecord(audit, userId) };
  addOpToAudit(auditRecordClone, { type: 'restored', value: record, userId, timestamp: createTimestamp() });
  setCurrentRecordForAudit(auditRecordClone, record);
  return { record, audit: auditRecordClone };
}

function deleteRecord<T extends Record>(audit: AuditOf<T>, userId: string) {
  if (isDeleted(audit)) return audit;
  const auditRecordClone = cloneAudit(audit);
  addOpToAudit(auditRecordClone, { type: 'deleted', timestamp: createTimestamp(), userId });
  setCurrentRecordForAudit(auditRecordClone, undefined);
  return auditRecordClone;
}

function merge<T extends Record>(originalAudit: AuditOf<T>, newAudit: AuditOf<T>, validateRecord?: T, onError?: (error: Error) => void) {
  if ((!isAudit(newAudit) || !isAudit(originalAudit))) return originalAudit;
  const ignoredOps: AuditRecordType[] = ['branched', 'created'];
  const newAuditHistory = newAudit.history.filter(op => !ignoredOps.includes(op.type));
  const mergedAudit = { ...originalAudit, history: [...originalAudit.history, ...newAuditHistory].orderBy('timestamp') };
  const record = createRecordFrom(mergedAudit, undefined, onError);
  if (validateRecord != null && !is.deepEqual(record, validateRecord)) throw new Error('Record does not match');
  return mergedAudit;
}

function createBranchFrom<T extends Record>(record: T, onError?: (error: Error) => void): AuditOf<T>;
function createBranchFrom<T extends Record>(audit: AuditOf<T>, onError?: (error: Error) => void): AuditOf<T> | undefined;
function createBranchFrom<T extends Record>(auditOrRecord: AuditOf<T> | T, onError?: (error: Error) => void): AuditOf<T> | undefined {
  const record = isAudit(auditOrRecord) ? createRecordFrom(auditOrRecord, undefined, onError) : auditOrRecord;
  if (record == null) return;
  return {
    id: record.id,
    history: [{ type: 'branched', value: Object.clone(record), timestamp: createTimestamp() }],
  };
}

function createFromBranch<T extends Record>(audit: AuditOf<T>, userId: string): AuditOf<T> | undefined {
  if (!isAudit(audit)) return;
  const createdHistoryItem = audit.history.findBy('type', 'created') as AuditCreateOrRestoredRecord<T>;
  const branchedHistoryItem = audit.history.findBy('type', 'branched') as AuditBranchedRecord<T>;
  const history = audit.history.filter(op => op.type !== 'branched' && op.type !== 'created');
  if (createdHistoryItem == null && branchedHistoryItem == null) return;
  if (createdHistoryItem == null) {
    return { ...audit, history: [{ type: 'created', value: branchedHistoryItem.value, userId, timestamp: branchedHistoryItem.timestamp }, ...history] };
  } else {
    return { ...audit, history: [createdHistoryItem, ...history] };
  }
}

function hasHistory<T extends Record>(audit: AuditOf<T>) {
  if (!isAudit(audit)) return false;
  return audit.history.findIndex(op => op.type !== 'created' && op.type !== 'branched') > -1;
}

function isDeleted<T extends Record>(audit: AuditOf<T>) {
  if (!isAudit(audit)) return false;
  return audit.history.last()?.type === 'deleted';
}

function isAudit<T extends Record>(audit: unknown): audit is AuditOf<T> {
  if (typeof (audit) !== 'object' || audit == null) return false;
  if (!('id' in audit) || typeof audit.id !== 'string') return false;
  if (!('history' in audit) || !(audit.history instanceof Array)) return false;
  const firstAuditTypes: AuditRecordType[] = ['created', 'branched'];
  if (audit.history.length === 0 || !firstAuditTypes.includes(audit.history[0].type)) return false;
  return true;
}

function lastUpdated<T extends Record>(audit: AuditOf<T>): number | undefined {
  if (!isAudit(audit)) return;
  return audit.history.last()?.timestamp;
}

export const auditor = {
  createAuditFrom,
  updateAuditWith,
  createRecordFrom,
  createFromBranch,
  restoreTo,
  delete: deleteRecord,
  merge,
  createBranchFrom,
  hasHistory,
  isDeleted,
  isAudit,
  lastUpdated,
};
