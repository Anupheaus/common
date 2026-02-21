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

});

