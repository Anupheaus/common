import './weakMap';

describe('extension', () => {

  describe('weakMap', () => {
    it('getOrSet returns existing value', () => {
      const wm = new WeakMap<object, number>();
      const key = {};
      wm.set(key, 42);
      expect(wm.getOrSet(key, () => 99)).to.equal(42);
    });

    it('getOrSet calls default and sets when missing', () => {
      const wm = new WeakMap<object, string>();
      const key = {};
      const result = wm.getOrSet(key, () => 'default');
      expect(result).to.equal('default');
      expect(wm.get(key)).to.equal('default');
    });
  });
});
