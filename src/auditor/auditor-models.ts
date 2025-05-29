import type { diffApply } from 'just-diff-apply';
import type { Record as CommonRecord } from '../extensions';

export type Timestamp = number;

export type Operation = Parameters<typeof diffApply>[1][number]['op'];

export interface AuditOperation {
  type: Operation;
  path: (string | number)[];
  value?: unknown;
}

export interface AuditCommonRecord {
  timestamp: Timestamp;
  userId: string;
}

export interface AuditUpdateRecord extends AuditCommonRecord {
  type: 'updated';
  ops: AuditOperation[];
}

export interface AuditCreateOrRestoredRecord<T extends CommonRecord> extends AuditCommonRecord {
  type: 'created' | 'restored';
  value: T;
}

export interface AuditDeleteRecord extends AuditCommonRecord {
  type: 'deleted';
}

export interface AuditBranchedRecord<T extends CommonRecord> extends Omit<AuditCommonRecord, 'userId'> {
  type: 'branched';
  value: T;
}

export type AuditRecord<T extends CommonRecord = CommonRecord> = AuditCreateOrRestoredRecord<T> | AuditUpdateRecord | AuditDeleteRecord | AuditBranchedRecord<T>;

export type AuditRecordType = AuditRecord['type'];

export interface AuditOf<T extends CommonRecord> {
  id: string;
  history: AuditRecord<T>[];
}