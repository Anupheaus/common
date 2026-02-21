import { ArrayModifications } from './ArrayModifications';

interface TestRecord {
  id: string;
  name: string;
}

describe('ArrayModifications', () => {

  const r = (id: string, name: string): TestRecord => ({ id, name });

  it('add tracks added records', () => {
    const mods = new ArrayModifications<TestRecord>();
    mods.add(r('1', 'a'));
    const json = mods.toJSON();
    expect(json.added).to.deep.equal([r('1', 'a')]);
    expect(json.removed).to.deep.equal([]);
    expect(json.updated).to.deep.equal([]);
  });

  it('update tracks updated records', () => {
    const mods = new ArrayModifications<TestRecord>();
    mods.update(r('1', 'updated'));
    expect(mods.toJSON().updated).to.deep.equal([r('1', 'updated')]);
  });

  it('remove tracks removed ids', () => {
    const mods = new ArrayModifications<TestRecord>();
    mods.remove('1');
    expect(mods.toJSON().removed).to.deep.equal(['1']);
  });

  it('clear resets all', () => {
    const mods = new ArrayModifications<TestRecord>();
    mods.add(r('1', 'a'));
    mods.clear();
    expect(mods.toJSON()).to.deep.equal({ added: [], updated: [], removed: [] });
  });

  it('applyTo filters removed and applies updates', () => {
    const mods = new ArrayModifications<TestRecord>();
    mods.add(r('3', 'new'));
    mods.update(r('2', 'updated'));
    mods.remove('1');
    const array = [r('1', 'a'), r('2', 'b')];
    const result = mods.applyTo(array);
    expect(result.find(x => x.id === '1')).to.be.undefined;
    expect(result.find(x => x.id === '2')?.name).to.equal('updated');
    expect(result.find(x => x.id === '3')?.name).to.equal('new');
    expect(result.find(x => x.id === '3')?.isNew).to.be.true;
  });

  it('applyTo with applyAddedAtTheEnd puts new records at end', () => {
    const mods = new ArrayModifications<TestRecord>();
    mods.add(r('3', 'new'));
    const array = [r('1', 'a'), r('2', 'b')];
    const result = mods.applyTo(array, { applyAddedAtTheEnd: true });
    expect(result.map(x => x.id)).to.deep.equal(['1', '2', '3']);
  });

  it('applyTo with applyAddedAtTheEnd false puts new records at start', () => {
    const mods = new ArrayModifications<TestRecord>();
    mods.add(r('3', 'new'));
    const array = [r('1', 'a'), r('2', 'b')];
    const result = mods.applyTo(array, { applyAddedAtTheEnd: false });
    expect(result.map(x => x.id)).to.deep.equal(['3', '1', '2']);
  });
});
