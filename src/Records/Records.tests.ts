import { Records } from './Records';

interface TestRecord {
  id: string;
  name: string;
}

describe('Records', () => {

  const r = (id: string, name: string): TestRecord => ({ id, name });

  it('creates empty records', () => {
    const records = new Records<TestRecord>();
    expect(records.length).to.equal(0);
    expect(records.isEmpty).to.be.true;
    expect(records.toArray()).to.deep.equal([]);
  });

  it('creates with initial array', () => {
    const records = new Records([r('1', 'a'), r('2', 'b')]);
    expect(records.length).to.equal(2);
    expect(records.get('1')).to.deep.equal(r('1', 'a'));
  });

  it('adds single record', () => {
    const records = new Records<TestRecord>();
    records.add(r('1', 'a'));
    expect(records.length).to.equal(1);
    expect(records.get('1')).to.deep.equal(r('1', 'a'));
  });

  it('adds multiple records', () => {
    const records = new Records<TestRecord>();
    records.add([r('1', 'a'), r('2', 'b')]);
    expect(records.length).to.equal(2);
  });

    it('throws when adding record without id', () => {
      const records = new Records<TestRecord>();
      expect(() => records.add({ id: undefined as any, name: 'x' })).to.throw('No valid id');
    });

  it('remove by id', () => {
    const records = new Records([r('1', 'a'), r('2', 'b')]);
    records.remove('1');
    expect(records.length).to.equal(1);
    expect(records.get('1')).to.be.undefined;
  });

  it('remove by ids', () => {
    const records = new Records([r('1', 'a'), r('2', 'b'), r('3', 'c')]);
    records.remove(['1', '3']);
    expect(records.toArray()).to.deep.equal([r('2', 'b')]);
  });

  it('update record', () => {
    const records = new Records([r('1', 'a')]);
    records.update(r('1', 'updated'));
    expect(records.get('1')).to.deep.equal(r('1', 'updated'));
  });

  it('upsert adds new and updates existing', () => {
    const records = new Records([r('1', 'a')]);
    records.upsert([r('1', 'updated'), r('2', 'new')]);
    expect(records.get('1')?.name).to.equal('updated');
    expect(records.get('2')?.name).to.equal('new');
  });

  it('reorder changes order', () => {
    const records = new Records([r('1', 'a'), r('2', 'b'), r('3', 'c')]);
    records.reorder(['3', '1', '2']);
    expect(records.toArray().map(x => x.id)).to.deep.equal(['3', '1', '2']);
  });

  it('clear removes all', () => {
    const records = new Records([r('1', 'a')]);
    records.clear();
    expect(records.length).to.equal(0);
  });

  it('onModified fires on add', () => {
    const records = new Records<TestRecord>();
    let received: { reason: string; records: TestRecord[] } | undefined;
    records.onModified((recs, reason) => { received = { reason, records: recs }; });
    records.add(r('1', 'a'));
    expect(received?.reason).to.equal('add');
    expect(received?.records).to.deep.equal([r('1', 'a')]);
  });

  it('onModified fires on remove', () => {
    const records = new Records([r('1', 'a')]);
    let received: { reason: string } | undefined;
    records.onModified((_, reason) => { received = { reason }; });
    records.remove('1');
    expect(received?.reason).to.equal('remove');
  });

  it('indexOf by id', () => {
    const records = new Records([r('1', 'a'), r('2', 'b')]);
    expect(records.indexOf('1')).to.equal(0);
    expect(records.indexOf('2')).to.equal(1);
    expect(records.indexOf('99')).to.equal(-1);
  });

  it('has returns true for existing id', () => {
    const records = new Records([r('1', 'a')]);
    expect(records.has('1')).to.be.true;
    expect(records.has('2')).to.be.false;
  });

  it('clone creates independent copy', () => {
    const records = new Records([r('1', 'a')]);
    const clone = records.clone();
    records.add(r('2', 'b'));
    expect(clone.length).to.equal(1);
    expect(records.length).to.equal(2);
  });
});
