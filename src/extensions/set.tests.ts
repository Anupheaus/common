import './set';

describe('extension', () => {

  describe('set', () => {
    it('map transforms values', () => {
      const s = new Set([1, 2, 3]);
      const result = s.map(x => x * 2);
      expect(result).to.be.instanceOf(Set);
      expect(Array.from(result).sort()).to.deep.equal([2, 4, 6]);
    });

    it('filter', () => {
      const s = new Set([1, 2, 3, 4]);
      const result = s.filter(x => x % 2 === 0);
      expect(Array.from(result).sort()).to.deep.equal([2, 4]);
    });

    it('addMany', () => {
      const s = new Set<number>();
      s.addMany([1, 2, 3]);
      expect(s.size).to.equal(3);
    });

    it('deleteMany', () => {
      const s = new Set([1, 2, 3]);
      s.deleteMany([1, 3]);
      expect(Array.from(s)).to.deep.equal([2]);
    });

    it('toArray', () => {
      const s = new Set([1, 2, 3]);
      expect(s.toArray().sort()).to.deep.equal([1, 2, 3]);
    });
  });
});
