import { auditor } from './auditor';
import type { AuditOf, AuditRecord, AuditUpdateRecord } from './auditor-models';
// import type { AuditInfo, AuditOf } from './auditor-models';

describe('auditor', () => {

  it('should create a simple audit from a record', () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    const timestamp = audit.history[0].timestamp;
    expect(audit).to.be.deep.equal({ id: '1', history: [{ type: 'created', timestamp, value: { id: '1', name: 'test' }, userId: 'user1' }] });
  });

  it('should update an audit with a new record', () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    const updatedAudit = auditor.updateAuditWith({ id: '1', name: 'test2' }, audit, 'user1');
    const firstTimestamp = updatedAudit.history[0].timestamp;
    const secondTimestamp = updatedAudit.history[1].timestamp;
    expect(updatedAudit).to.be.deep.equal({
      id: '1',
      history: [
        { type: 'created', timestamp: firstTimestamp, value: { id: '1', name: 'test' }, userId: 'user1' },
        { type: 'updated', timestamp: secondTimestamp, ops: [{ type: 'replace', path: ['name'], value: 'test2' }], userId: 'user1' },
      ],
    });
  });

  it('should restore an audit to a previous record', async () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    const originalTimestamp = Date.now();
    await Promise.delay(2);
    const updatedAudit = auditor.updateAuditWith({ id: '1', name: 'test2' }, audit, 'user1');
    const firstTimestamp = updatedAudit.history[0].timestamp;
    const { record, audit: auditRecord } = auditor.restoreTo(updatedAudit, originalTimestamp, 'user1');
    const updatedTimestamp = auditRecord.history[1].timestamp;
    const restoredTimestamp = auditRecord.history[2].timestamp;
    expect(record).to.be.deep.equal({ id: '1', name: 'test' });
    expect(auditRecord).to.be.deep.equal({
      id: '1',
      history: [
        { type: 'created', timestamp: firstTimestamp, value: { id: '1', name: 'test' }, userId: 'user1' },
        { type: 'updated', timestamp: updatedTimestamp, ops: [{ type: 'replace', path: ['name'], value: 'test2' }], userId: 'user1' },
        { type: 'restored', timestamp: restoredTimestamp, value: { id: '1', name: 'test' }, userId: 'user1' },
      ],
    });
  });

  it('can do an add audit', () => {
    const originalRecord = { id: '1', name: 'test', address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' } };
    const audit = auditor.createAuditFrom(originalRecord, 'user1');
    const updatedAudit = auditor.updateAuditWith({ ...originalRecord, something: 'new' } as any, audit, 'user1');
    const lastOperation = updatedAudit.history.last() as AuditUpdateRecord;
    expect(lastOperation.type).to.be.equal('updated');
    expect(lastOperation.ops).to.be.deep.equal([{ type: 'add', path: ['something'], value: 'new' }]);
  });

  it('can do a remove audit', () => {
    const originalRecord = { id: '1', name: 'test', address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' } };
    const audit = auditor.createAuditFrom(originalRecord, 'user1');
    const updatedAudit = auditor.updateAuditWith({ id: '1', name: 'test' } as any, audit, 'user1');
    const lastOperation = updatedAudit.history.last() as AuditUpdateRecord;
    expect(lastOperation.type).to.be.equal('updated');
    expect(lastOperation.ops).to.be.deep.equal([{ type: 'remove', path: ['address'] }]);
  });

  it('can do many audits quickly', () => {
    const originalRecord = { id: '1', name: 'test', address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' } };
    let audit = auditor.createAuditFrom(originalRecord, 'user1');
    for (let i = 0; i < 200; i++) {
      audit = auditor.updateAuditWith({ id: '1', name: `test ${i}`, address: originalRecord.address }, audit, 'user1');
    }
    const lastOperation = audit.history.last() as AuditUpdateRecord;
    expect(lastOperation.ops).to.be.deep.equal([{ type: 'replace', path: ['name'], value: 'test 199' }]);
    expect(audit.history).to.have.lengthOf(201);
  });

  it('can create a record from an audit', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'test2' }, audit, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'test3' }, audit, 'user1');
    const record = auditor.createRecordFrom(audit);
    expect(record).to.be.deep.equal({ id: '1', name: 'test3' });
  });

  it('ignores bad audits', () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    const timestamp = Date.now();
    const badHistory: AuditRecord = { type: 'updated', timestamp, ops: [{ type: 'replace', path: ['part'], value: 'test2' }], userId: 'user1' };
    const goodHistory: AuditRecord = { type: 'updated', timestamp: timestamp + 1, ops: [{ type: 'replace', path: ['name'], value: 'test2' }], userId: 'user1' };
    const badAudit: AuditOf<{ id: string; name: string; }> = { ...audit, history: [...audit.history, badHistory, goodHistory] };
    let error: Error | undefined;
    const record = auditor.createRecordFrom(badAudit, undefined, internalError => { error = internalError; });
    expect(record).to.be.deep.equal({ id: '1', name: 'test2' });
    expect(error).to.be.instanceOf(Error);
    expect(error?.message).to.be.equal('Audit operation failed on record');
  });

  it('can merge audits', () => {
    let oldAudit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    oldAudit = auditor.updateAuditWith({ id: '1', name: 'test2' }, oldAudit, 'user1');
    oldAudit = auditor.updateAuditWith({ id: '1', name: 'test3' }, oldAudit, 'user1');

    let newAudit = auditor.createAuditFrom({ id: '1', name: 'test3' }, 'user1');
    newAudit = auditor.updateAuditWith({ id: '1', name: 'test4' }, newAudit, 'user1');
    newAudit = auditor.updateAuditWith({ id: '1', name: 'test5' }, newAudit, 'user1');

    const mergedAudit = auditor.merge(oldAudit, newAudit);
    expect(mergedAudit).to.be.deep.equal({ ...oldAudit, history: [...oldAudit.history, ...newAudit.history.slice(1)] });
    expect(auditor.createRecordFrom(mergedAudit)).to.be.deep.equal({ id: '1', name: 'test5' });
  });

  it('can branch an audit', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'test2' }, audit, 'user1');
    const branchedAudit = auditor.createBranchFrom(audit);
    const timestamp = branchedAudit?.history[0].timestamp;
    expect(branchedAudit).to.be.deep.equal({ ...audit, history: [{ type: 'branched', value: { id: '1', name: 'test2' }, timestamp }] });
  });

  it('accumulates multiple updates as separate history entries', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'a' }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'b' }, audit, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'c' }, audit, 'user1');
    expect(audit.history).to.have.lengthOf(3);
    const lastOp = audit.history[2] as AuditUpdateRecord;
    expect(lastOp.type).to.equal('updated');
    expect(lastOp.ops).to.be.deep.equal([{ type: 'replace', path: ['name'], value: 'c' }]);
    expect(auditor.createRecordFrom(audit)).to.be.deep.equal({ id: '1', name: 'c' });
  });

  it('can delete a record and then restore it via updateAuditWith', () => {
    const record = { id: '1', name: 'test' };
    let audit = auditor.createAuditFrom(record, 'user1');
    audit = auditor.delete(audit, 'user1');
    expect(auditor.isDeleted(audit)).to.be.true;
    expect(auditor.createRecordFrom(audit)).to.be.undefined;
    audit = auditor.updateAuditWith(record, audit, 'user1');
    expect(auditor.isDeleted(audit)).to.be.false;
    expect(auditor.createRecordFrom(audit)).to.be.deep.equal(record);
    expect(audit.history.map(op => op.type)).to.be.deep.equal(['created', 'deleted', 'restored']);
  });

  it('createRecordFrom correctly processes deleted followed by restored when bypassing cache', () => {
    const record = { id: '1', name: 'test' };
    let audit = auditor.createAuditFrom(record, 'user1');
    audit = auditor.delete(audit, 'user1');
    audit = auditor.updateAuditWith(record, audit, 'user1');
    const restoredTimestamp = audit.history[2].timestamp;
    const recreated = auditor.createRecordFrom({ ...audit, history: audit.history } as typeof audit, restoredTimestamp);
    expect(recreated).to.be.deep.equal(record);
  });

  it('each distinct update is stored as a separate history entry with correct ops', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'a' }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'b' }, audit, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'c' }, audit, 'user1');
    expect(audit.history).to.have.lengthOf(3);
    const updatedOps = audit.history.filter(op => op.type === 'updated') as AuditUpdateRecord[];
    expect(updatedOps).to.have.lengthOf(2);
    expect(updatedOps[0].ops).to.be.deep.equal([{ type: 'replace', path: ['name'], value: 'b' }]);
    expect(updatedOps[1].ops).to.be.deep.equal([{ type: 'replace', path: ['name'], value: 'c' }]);
    expect(auditor.createRecordFrom(audit)).to.be.deep.equal({ id: '1', name: 'c' });
  });

  it('createBranchFrom accepts a record directly', () => {
    const record = { id: '1', name: 'test' };
    const branchedAudit = auditor.createBranchFrom(record);
    expect(branchedAudit?.history[0].type).to.equal('branched');
    expect(branchedAudit?.history[0]).to.have.property('value');
    expect((branchedAudit?.history[0] as { value: typeof record }).value).to.be.deep.equal(record);
    const normalAudit = auditor.createFromBranch(branchedAudit!, 'user1');
    expect(normalAudit).to.not.be.undefined;
    expect(auditor.createRecordFrom(normalAudit!)).to.be.deep.equal(record);
  });

  it('createBranchFrom returns undefined when audit is deleted', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    audit = auditor.delete(audit, 'user1');
    const branchedAudit = auditor.createBranchFrom(audit);
    expect(branchedAudit).to.be.undefined;
  });

  it('createFromBranch converts branched audit to normal audit with created', () => {
    const record = { id: '1', name: 'test' };
    const branchedAudit = auditor.createBranchFrom(record)!;
    const normalAudit = auditor.createFromBranch(branchedAudit, 'user1');
    expect(normalAudit).to.not.be.undefined;
    expect(normalAudit!.history[0].type).to.equal('created');
    expect((normalAudit!.history[0] as { value: typeof record }).value).to.be.deep.equal(record);
    expect(auditor.createRecordFrom(normalAudit!)).to.be.deep.equal(record);
  });

  it('hasHistory returns false for audit with only created op', () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    expect(auditor.hasHistory(audit)).to.be.false;
  });

  it('hasHistory returns true when audit has updates', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'test2' }, audit, 'user1');
    expect(auditor.hasHistory(audit)).to.be.true;
  });

  it('isAudit rejects null, non-objects, and invalid shapes', () => {
    expect(auditor.isAudit(null)).to.be.false;
    expect(auditor.isAudit(undefined)).to.be.false;
    expect(auditor.isAudit('string')).to.be.false;
    expect(auditor.isAudit({})).to.be.false;
    expect(auditor.isAudit({ id: '1' })).to.be.false;
    expect(auditor.isAudit({ id: '1', history: [] })).to.be.false;
    expect(auditor.isAudit({ id: '1', history: [{ type: 'updated' }] })).to.be.false;
    const validAudit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    expect(auditor.isAudit(validAudit)).to.be.true;
  });

  it('lastUpdated returns timestamp of last history entry', () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    const lastTs = audit.history[0].timestamp;
    expect(auditor.lastUpdated(audit)).to.equal(lastTs);
    const updatedAudit = auditor.updateAuditWith({ id: '1', name: 'test2' }, audit, 'user1');
    expect(auditor.lastUpdated(updatedAudit)).to.equal(updatedAudit.history[1].timestamp);
  });

  it('delete when already deleted is idempotent', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    audit = auditor.delete(audit, 'user1');
    const deletedAgain = auditor.delete(audit, 'user1');
    expect(deletedAgain).to.equal(audit);
    expect(deletedAgain.history).to.have.lengthOf(2);
  });

  it('restoreTo when timestamp points to deleted state returns record undefined and deletes audit', async () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    await Promise.delay(2);
    audit = auditor.updateAuditWith({ id: '1', name: 'test2' }, audit, 'user1');
    const updatedTimestamp = audit.history[1].timestamp;
    await Promise.delay(2);
    audit = auditor.delete(audit, 'user1');
    const deletedTimestamp = audit.history[2].timestamp;
    const { record, audit: resultAudit } = auditor.restoreTo(audit, deletedTimestamp, 'user1');
    expect(record).to.be.undefined;
    expect(auditor.isDeleted(resultAudit)).to.be.true;
    const { record: restoredRecord } = auditor.restoreTo(audit, updatedTimestamp, 'user1');
    expect(restoredRecord).to.be.deep.equal({ id: '1', name: 'test2' });
  });

  it('merge throws when validateRecord does not match merged result', () => {
    let oldAudit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    oldAudit = auditor.updateAuditWith({ id: '1', name: 'test2' }, oldAudit, 'user1');
    let newAudit = auditor.createAuditFrom({ id: '1', name: 'test2' }, 'user1');
    newAudit = auditor.updateAuditWith({ id: '1', name: 'test3' }, newAudit, 'user1');
    expect(() => auditor.merge(oldAudit, newAudit, { id: '1', name: 'wrong' } as any)).to.throw('Record does not match');
  });

  it('merge returns originalAudit when newAudit is invalid', () => {
    const originalAudit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    const invalidAudit = { id: '1', history: [{ type: 'updated' }] } as any;
    const result = auditor.merge(originalAudit, invalidAudit);
    expect(result).to.equal(originalAudit);
  });

  it('handles multiple consecutive updates correctly', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'v1' }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'v2' }, audit, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'v3' }, audit, 'user1');
    expect(audit.history).to.have.length(3);
    expect(audit.history[2].type).to.equal('updated');
  });

  it('reconstructs the current record correctly from history', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'original', count: 0 }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'updated', count: 1 }, audit, 'user1');
    const record = auditor.createRecordFrom(audit);
    expect(record).to.eql({ id: '1', name: 'updated', count: 1 });
  });

  it('tracks nested object field changes', () => {
    const original = { id: '1', address: { city: 'London', zip: 'EC1' } };
    let audit = auditor.createAuditFrom(original, 'user1');
    audit = auditor.updateAuditWith({ id: '1', address: { city: 'Paris', zip: 'EC1' } }, audit, 'user1');
    const lastOp = audit.history[1] as any;
    expect(lastOp.type).to.equal('updated');
    const cityOp = lastOp.ops.find((op: any) => op.path.join('.') === 'address.city');
    expect(cityOp).not.to.be.undefined;
    expect(cityOp.value).to.equal('Paris');
  });

  it('allows further updates after restore', async () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'v1' }, 'user1');
    const t1 = Date.now();
    await Promise.delay(2);
    audit = auditor.updateAuditWith({ id: '1', name: 'v2' }, audit, 'user1');
    const { record, audit: restoredAudit } = auditor.restoreTo(audit, t1, 'user1');
    expect(record?.name).to.equal('v1');
    const furtherAudit = auditor.updateAuditWith({ id: '1', name: 'v3' }, restoredAudit, 'user1');
    expect(furtherAudit.history.last()?.type).to.equal('updated');
  });

  it('merge correctly handles delete and restore in history', () => {
    let oldAudit = auditor.createAuditFrom({ id: '1', name: 'a' }, 'user1');
    oldAudit = auditor.updateAuditWith({ id: '1', name: 'b' }, oldAudit, 'user1');
    oldAudit = auditor.delete(oldAudit, 'user1');
    oldAudit = auditor.updateAuditWith({ id: '1', name: 'b' }, oldAudit, 'user1');
    let newAudit = auditor.createAuditFrom({ id: '1', name: 'b' }, 'user1');
    newAudit = auditor.updateAuditWith({ id: '1', name: 'c' }, newAudit, 'user1');
    const merged = auditor.merge(oldAudit, newAudit);
    expect(auditor.createRecordFrom(merged)).to.be.deep.equal({ id: '1', name: 'c' });
  });

  describe('prototype pollution via diff ops', () => {
    afterEach(() => {
      delete (Object.prototype as any).polluted;
      delete (Object.prototype as any).polluted2;
    });

    it('should not pollute Object.prototype when audit ops contain dangerous paths', () => {
      const record = { id: '1', name: 'Alice' };
      const audit = auditor.createAuditFrom(record, 'user1');

      // Inject a poisoned op with __proto__ path
      const poisonedOp = {
        type: 'updated' as const,
        timestamp: Date.now() + 1,
        userId: 'user1',
        ops: [{ type: 'add' as const, path: ['__proto__', 'polluted'], value: true }],
      };
      (audit as any).history.push(poisonedOp);

      // This should not throw, and should not pollute Object.prototype
      auditor.createRecordFrom(audit);
      expect((Object.prototype as any).polluted).to.be.undefined;
    });

    it('should not pollute Object.prototype when audit ops contain constructor path', () => {
      const record = { id: '2', name: 'Bob' };
      const audit = auditor.createAuditFrom(record, 'user1');

      const poisonedOp = {
        type: 'updated' as const,
        timestamp: Date.now() + 1,
        userId: 'user1',
        ops: [{ type: 'add' as const, path: ['constructor', 'prototype', 'polluted2'], value: true }],
      };
      (audit as any).history.push(poisonedOp);

      auditor.createRecordFrom(audit);
      expect((Object.prototype as any).polluted2).to.be.undefined;
    });

    it('should still apply safe ops when an updated entry also contains a dangerous op', () => {
      const record = { id: '1', name: 'Alice' };
      let audit = auditor.createAuditFrom(record, 'user1');

      // Add a mixed entry: one safe op + one dangerous op
      const mixedOp = {
        type: 'updated' as const,
        timestamp: audit.history[0].timestamp + 1,
        userId: 'user1',
        ops: [
          { type: 'replace' as const, path: ['name'], value: 'Bob' },      // safe
          { type: 'add' as const, path: ['__proto__', 'polluted'], value: true }, // dangerous
        ],
      };
      (audit as any).history.push(mixedOp);

      const result = auditor.createRecordFrom(audit);
      expect((Object.prototype as any).polluted).to.be.undefined;
      expect(result?.name).to.equal('Bob'); // safe op was applied
    });
  });

  it('updateAuditWith with identical record returns original audit', () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'test' }, 'user1');
    const result = auditor.updateAuditWith({ id: '1', name: 'test' }, audit, 'user1');
    expect(result).to.equal(audit);
    expect(result.history).to.have.lengthOf(1);
  });

  it('createRecordFrom with timestamp returns record at that point in time', async () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'a' }, 'user1');
    const createdTs = audit.history[0].timestamp;
    await Promise.delay(2);
    const updated = auditor.updateAuditWith({ id: '1', name: 'b' }, audit, 'user1');
    const updatedTs = updated.history[1].timestamp;
    await Promise.delay(2);
    const updated2 = auditor.updateAuditWith({ id: '1', name: 'c' }, updated, 'user1');
    expect(auditor.createRecordFrom(updated2)).to.be.deep.equal({ id: '1', name: 'c' });
    expect(auditor.createRecordFrom(updated2, createdTs)).to.be.deep.equal({ id: '1', name: 'a' });
    expect(auditor.createRecordFrom(updated2, updatedTs)).to.be.deep.equal({ id: '1', name: 'b' });
  });

  it('createRecordFrom returns the correct record for a fresh (uncached) audit', async () => {
    const audit = auditor.createAuditFrom({ id: '1', name: 'a' }, 'user1');
    await Promise.delay(2);
    const updated = auditor.updateAuditWith({ id: '1', name: 'b' }, audit, 'user1');
    await Promise.delay(2);
    const updated2 = auditor.updateAuditWith({ id: '1', name: 'c' }, updated, 'user1');
    // Create a fresh audit reference (not cached) to verify reconstruction from scratch
    const freshAudit = { ...updated2, history: [...updated2.history] };
    expect(auditor.createRecordFrom(freshAudit)).to.be.deep.equal({ id: '1', name: 'c' });
  });

  it('records updates correctly after delete-then-restore cycle', () => {
    let audit = auditor.createAuditFrom({ id: '1', name: 'a' }, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'b' }, audit, 'user1');
    audit = auditor.delete(audit, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'b' }, audit, 'user1');
    audit = auditor.updateAuditWith({ id: '1', name: 'c' }, audit, 'user1');
    const updatedOps = audit.history.filter(op => op.type === 'updated') as AuditUpdateRecord[];
    expect(updatedOps).to.have.lengthOf(2);
    expect(updatedOps[1].ops).to.be.deep.equal([{ type: 'replace', path: ['name'], value: 'c' }]);
    expect(auditor.createRecordFrom(audit)).to.be.deep.equal({ id: '1', name: 'c' });
  });

});

