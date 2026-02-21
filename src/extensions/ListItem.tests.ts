import { ListItems } from './ListItem';

describe('ListItem', () => {

  it('create returns ids and pairs', () => {
    const result = ListItems.create([
      { id: '1', text: 'One' },
      { id: '2', text: 'Two' },
    ]);
    expect(result.ids).to.deep.equal(['1', '2']);
    expect(result.pairs).to.deep.equal([{ id: '1', text: 'One' }, { id: '2', text: 'Two' }]);
  });

  it('is returns true for valid ListItem', () => {
    expect(ListItems.is({ id: '1', text: 'x' })).to.be.true;
  });

  it('is returns false for invalid', () => {
    expect(ListItems.is({})).to.be.false;
    expect(ListItems.is({ id: 1, text: 'x' })).to.be.false;
    expect(ListItems.is(null)).to.be.false;
  });
});
