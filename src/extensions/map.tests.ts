import './map';

describe('map', () => {

  describe('toArray', () => {

    it('can convert the entries to an array', () => {
      const entries: [string, number][] = [['a', 1], ['b', 2], ['c', 3]];
      const a = new Map(entries);
      expect(a.toArray()).to.eql(entries);
    });

    it('can convert the keys to an array', () => {
      const entries: [string, number][] = [['a', 1], ['b', 2], ['c', 3]];
      const a = new Map(entries);
      expect(a.toKeysArray()).to.eql(entries.map(([key]) => key));
    });

    it('can convert the values to an array', () => {
      const entries: [string, number][] = [['a', 1], ['b', 2], ['c', 3]];
      const a = new Map(entries);
      expect(a.toValuesArray()).to.eql(entries.map(([, value]) => value));
    });

  });

  describe('fromPlainObject', () => {

    it('can convert an object into a map', () => {
      const a = Map.fromPlainObject({ a: 1, b: 2, c: 'e' });
      expect(a.toArray()).to.eql([['a', 1], ['b', 2], ['c', 'e']]);
    });

  });

});