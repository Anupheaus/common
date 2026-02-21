import { DoubleMap } from './DoubleMap';

describe('DoubleMap', () => {

  it('starts empty', () => {
    const dm = new DoubleMap<string, string, number>();
    expect(dm.size).to.equal(0);
    expect(dm.keys()).to.deep.equal([]);
  });

  it('set and get', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('a', 'y', 2);
    dm.set('b', 'x', 3);
    expect(dm.get('a', 'x')).to.equal(1);
    expect(dm.get('a', 'y')).to.equal(2);
    expect(dm.get('b', 'x')).to.equal(3);
    expect(dm.size).to.equal(3);
  });

  it('get returns undefined for missing', () => {
    const dm = new DoubleMap<string, string, number>();
    expect(dm.get('a', 'x')).to.be.undefined;
  });

  it('get with defaultValue creates and returns default', () => {
    const dm = new DoubleMap<string, string, number>();
    const v = dm.get('a', 'x', () => 99);
    expect(v).to.equal(99);
    expect(dm.get('a', 'x')).to.equal(99);
  });

  it('has checks key1 only or key1+key2', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    expect(dm.has('a')).to.be.true;
    expect(dm.has('b')).to.be.false;
    expect(dm.has('a', 'x')).to.be.true;
    expect(dm.has('a', 'y')).to.be.false;
  });

  it('delete by key1 removes all for that key', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('a', 'y', 2);
    dm.delete('a');
    expect(dm.size).to.equal(0);
    expect(dm.get('a', 'x')).to.be.undefined;
  });

  it('delete by key1 and key2 removes single', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('a', 'y', 2);
    dm.delete('a', 'x');
    expect(dm.get('a', 'x')).to.be.undefined;
    expect(dm.get('a', 'y')).to.equal(2);
  });

  it('clear removes all', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.clear();
    expect(dm.size).to.equal(0);
  });

  it('clear with key removes only that key', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('b', 'x', 2);
    dm.clear('a');
    expect(dm.get('a', 'x')).to.be.undefined;
    expect(dm.get('b', 'x')).to.equal(2);
  });

  it('keys returns top-level keys', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('b', 'y', 2);
    expect(dm.keys().sort()).to.deep.equal(['a', 'b']);
  });

  it('keys with key returns second-level keys', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('a', 'y', 2);
    expect(dm.keys('a').sort()).to.deep.equal(['x', 'y']);
  });

  it('values returns all values', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('a', 'y', 2);
    expect(dm.values().sort()).to.deep.equal([1, 2]);
  });

  it('clone creates independent copy', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    const clone = dm.clone();
    dm.set('a', 'x', 99);
    expect(clone.get('a', 'x')).to.equal(1);
  });

  it('forEach iterates all', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('a', 'y', 2);
    const seen: [number, string, string][] = [];
    dm.forEach((v, k1, k2) => seen.push([v, k1, k2]));
    expect(seen.sort()).to.deep.equal([[1, 'a', 'x'], [2, 'a', 'y']]);
  });

  it('map transforms values', () => {
    const dm = new DoubleMap<string, string, number>();
    dm.set('a', 'x', 1);
    dm.set('a', 'y', 2);
    expect(dm.map(v => v * 10).sort()).to.deep.equal([10, 20]);
  });
});
