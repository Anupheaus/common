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

  describe('clone', () => {

    it('returns a new Map with the same entries', () => {
      const original = new Map([['x', 10], ['y', 20]]);
      const cloned = original.clone();
      expect(cloned.toArray()).to.eql(original.toArray());
    });

    it('returns a different Map instance', () => {
      const original = new Map([['a', 1]]);
      expect(original.clone()).not.to.equal(original);
    });

    it('mutations to the clone do not affect the original', () => {
      const original = new Map([['a', 1]]);
      const cloned = original.clone();
      cloned.set('a', 99);
      expect(original.get('a')).to.equal(1);
    });

  });

  describe('getOrSet', () => {

    it('returns an existing value without calling the factory', () => {
      const map = new Map([['key', 42]]);
      let factoryCalled = false;
      const result = map.getOrSet('key', () => { factoryCalled = true; return 99; });
      expect(result).to.equal(42);
      expect(factoryCalled).to.be.false;
    });

    it('calls the factory and sets the value when key is absent', () => {
      const map = new Map<string, number>();
      const result = map.getOrSet('missing', () => 7);
      expect(result).to.equal(7);
      expect(map.get('missing')).to.equal(7);
    });

    it('subsequent calls return the set value without re-invoking factory', () => {
      const map = new Map<string, number>();
      let callCount = 0;
      map.getOrSet('k', () => { callCount++; return 1; });
      map.getOrSet('k', () => { callCount++; return 2; });
      expect(callCount).to.equal(1);
      expect(map.get('k')).to.equal(1);
    });

  });

  describe('map', () => {

    it('maps entries to an array using key and value', () => {
      const m = new Map([['a', 1], ['b', 2], ['c', 3]]);
      const result = m.map((key, value) => `${key}=${value}`);
      expect(result).to.eql(['a=1', 'b=2', 'c=3']);
    });

    it('provides the index as the third argument', () => {
      const m = new Map([['x', 10], ['y', 20]]);
      const indices: number[] = [];
      m.map((_key, _value, index) => { indices.push(index); });
      expect(indices).to.eql([0, 1]);
    });

    it('returns an empty array for an empty map', () => {
      const m = new Map<string, number>();
      expect(m.map((k, v) => `${k}${v}`)).to.eql([]);
    });

  });

  describe('merge', () => {

    describe('with another Map', () => {

      it('overwrites existing keys with values from the other map', () => {
        const map = new Map([['a', 1], ['b', 2]]);
        map.merge(new Map([['b', 99], ['c', 3]]), {});
        expect(map.get('a')).to.equal(1);
        expect(map.get('b')).to.equal(99);
        expect(map.get('c')).to.equal(3);
      });

      it('mutates and returns the original map', () => {
        const map = new Map([['a', 1]]);
        const result = map.merge(new Map([['b', 2]]), {});
        expect(result).to.equal(map);
      });

      it('calls mapUnmatchedLeftTo for keys only in the original map', () => {
        const map = new Map([['a', 1], ['b', 2]]);
        map.merge(new Map([['b', 5]]), {
          mapUnmatchedLeftTo: (value) => value * 10,
        });
        expect(map.get('a')).to.equal(10);
        expect(map.get('b')).to.equal(5);
      });

    });

    describe('with an array', () => {

      it('calls mapMatchedTo when the key exists and values differ', () => {
        const map = new Map([['a', 1], ['b', 2]]);
        map.merge([{ id: 'b', val: 9 }], {
          keyExtractor: item => item.id,
          mapMatchedTo: (existing, incoming) => ({ id: existing.toString(), val: (existing as number) + incoming.val }),
        } as any);
        expect((map.get('b') as any).val).to.equal(11);
      });

      it('skips items that are deeply equal to the existing value', () => {
        const map = new Map<string, object>([['a', { v: 1 }]]);
        let matchedCalled = false;
        map.merge([{ v: 1 }], {
          keyExtractor: () => 'a',
          mapMatchedTo: () => { matchedCalled = true; return undefined; },
        } as any);
        expect(matchedCalled).to.be.false;
      });

      it('calls mapUnmatchedRightTo for keys only in the incoming array', () => {
        const map = new Map<string, number>();
        map.merge([42], {
          keyExtractor: () => 'newKey',
          mapUnmatchedRightTo: (item) => item * 2,
        } as any);
        expect(map.get('newKey')).to.equal(84);
      });

      it('calls mapUnmatchedLeftTo for keys only in the original map', () => {
        const map = new Map([['a', 1], ['b', 2]]);
        map.merge([] as number[], {
          keyExtractor: (v) => String(v),
          mapUnmatchedLeftTo: (value) => (value as number) + 100,
        } as any);
        expect(map.get('a')).to.equal(101);
        expect(map.get('b')).to.equal(102);
      });

    });

  });

});