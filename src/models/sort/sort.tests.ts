import { SortDirections } from './directions';

describe('models', () => {

  describe('SortDirections', () => {
    it('toCSSClass', () => {
      expect(SortDirections.toCSSClass(SortDirections.Ascending)).to.equal('sorted-asc');
      expect(SortDirections.toCSSClass(SortDirections.Descending)).to.equal('sorted-desc');
      expect(SortDirections.toCSSClass(SortDirections.None)).to.equal('');
    });

    it('toShortName', () => {
      expect(SortDirections.toShortName(SortDirections.Ascending)).to.equal('Asc');
      expect(SortDirections.toShortName(SortDirections.Descending)).to.equal('Desc');
      expect(SortDirections.toShortName(SortDirections.None)).to.equal('');
    });

    it('nextDirectionAfter cycles', () => {
      expect(SortDirections.nextDirectionAfter(SortDirections.None)).to.equal(SortDirections.Ascending);
      expect(SortDirections.nextDirectionAfter(SortDirections.Ascending)).to.equal(SortDirections.Descending);
      expect(SortDirections.nextDirectionAfter(SortDirections.Descending)).to.equal(SortDirections.None);
    });
  });
});
