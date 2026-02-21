import './math';

describe('extension', () => {

  describe('math', () => {
    it('emptyId returns zero guid', () => {
      expect(Math.emptyId()).to.equal('00000000-0000-0000-0000-000000000000');
    });

    it('uniqueId returns uuid format', () => {
      const id = Math.uniqueId();
      expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('between clamps value', () => {
      expect(Math.between(5, 0, 10)).to.equal(5);
      expect(Math.between(-1, 0, 10)).to.equal(0);
      expect(Math.between(15, 0, 10)).to.equal(10);
    });

    it('roundTo rounds to decimal places', () => {
      expect(Math.roundTo(1.234, 2)).to.equal(1.23);
    });

    it('toPercentage', () => {
      expect(Math.toPercentage(0.5)).to.equal(50);
      expect(Math.toPercentage(0.123, 2)).to.equal(12.3);
    });
  });
});
