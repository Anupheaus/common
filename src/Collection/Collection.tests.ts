import { Collection } from './Collection';

describe('Collection', () => {

  it('creates empty collection', () => {
    const c = new Collection<number>();
    expect(c.length).to.equal(0);
    expect(c.toArray()).to.deep.equal([]);
  });

  it('creates with initial items', () => {
    const c = new Collection([1, 2, 3]);
    expect(c.length).to.equal(3);
    expect(c.toArray()).to.deep.equal([1, 2, 3]);
  });

  it('adds single item', () => {
    const c = new Collection<number>();
    c.add(1);
    expect(c.length).to.equal(1);
    expect(c.has(1)).to.be.true;
    expect(c.get()).to.deep.equal([1]);
  });

  it('adds multiple items', () => {
    const c = new Collection<number>();
    c.add([1, 2, 3]);
    expect(c.length).to.equal(3);
    expect(c.toArray()).to.deep.equal([1, 2, 3]);
  });

  it('ignores duplicate add', () => {
    const c = new Collection([1]);
    c.add(1);
    expect(c.length).to.equal(1);
  });

  it('removes item', () => {
    const c = new Collection([1, 2, 3]);
    c.remove(2);
    expect(c.length).to.equal(2);
    expect(c.toArray()).to.deep.equal([1, 3]);
  });

  it('removes multiple items', () => {
    const c = new Collection([1, 2, 3]);
    c.remove([1, 3]);
    expect(c.toArray()).to.deep.equal([2]);
  });

  it('clear removes all', () => {
    const c = new Collection([1, 2, 3]);
    c.clear();
    expect(c.length).to.equal(0);
    expect(c.toArray()).to.deep.equal([]);
  });

  it('get with index returns item', () => {
    const c = new Collection([10, 20, 30]);
    expect(c.get(0)).to.equal(10);
    expect(c.get(1)).to.equal(20);
    expect(c.get(2)).to.equal(30);
    expect(c.get(99)).to.be.undefined;
  });

  it('onModified fires on add', () => {
    const c = new Collection<number>();
    let received: { items: number[]; reason: string } | undefined;
    c.onModified((items, reason) => { received = { items, reason }; });
    c.add(1);
    expect(received).to.deep.equal({ items: [1], reason: 'add' });
  });

  it('onModified fires on remove', () => {
    const c = new Collection([1, 2]);
    let received: { items: number[]; reason: string } | undefined;
    c.onModified((items, reason) => { received = { items, reason }; });
    c.remove(1);
    expect(received).to.deep.equal({ items: [1], reason: 'remove' });
  });

  it('onModified fires on clear', () => {
    const c = new Collection([1, 2]);
    let received: { items: number[]; reason: string } | undefined;
    c.onModified((items, reason) => { received = { items, reason }; });
    c.clear();
    expect(received?.reason).to.equal('clear');
    expect(received?.items).to.deep.equal([1, 2]);
  });

  it('onAdded only fires for add', () => {
    const c = new Collection<number>();
    let addCount = 0;
    c.onAdded(() => addCount++);
    c.add(1);
    expect(addCount).to.equal(1);
    c.remove(1);
    expect(addCount).to.equal(1);
  });

  it('onRemoved only fires for remove', () => {
    const c = new Collection([1]);
    let removeCount = 0;
    c.onRemoved(() => removeCount++);
    c.remove(1);
    expect(removeCount).to.equal(1);
    c.add(1);
    expect(removeCount).to.equal(1);
  });

  it('unsubscribe stops callbacks', () => {
    const c = new Collection<number>();
    let count = 0;
    const unsub = c.onModified(() => count++);
    c.add(1);
    expect(count).to.equal(1);
    unsub();
    c.add(2);
    expect(count).to.equal(1);
  });
});
