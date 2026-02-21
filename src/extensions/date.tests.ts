import './date';

describe('extension', () => {

  describe('date', () => {
    it('clone returns new date with same time', () => {
      const d = new Date(2024, 0, 15);
      const c = d.clone();
      expect(c.getTime()).to.equal(d.getTime());
      expect(c).not.to.equal(d);
    });

    it('add days', () => {
      const d = new Date(2024, 0, 15);
      const result = d.add(2, 'days');
      expect(result.getDate()).to.equal(17);
    });

    it('format returns ISO by default', () => {
      const d = new Date(2024, 0, 15, 12, 30);
      const formatted = d.format();
      expect(formatted).to.match(/\d{4}-\d{2}-\d{2}/);
      expect(formatted).to.include('2024');
    });

    it('Date.timeTaken with number returns ms since epoch', () => {
      const start = Date.now() - 100;
      const taken = Date.timeTaken(start);
      expect(taken).to.be.at.least(90);
    });

    it('Date.timeTaken with Date', () => {
      const d = new Date(Date.now() - 50);
      expect(Date.timeTaken(d)).to.be.at.least(40);
    });

    it('Date.isIsoString validates ISO date strings', () => {
      expect(Date.isIsoString('2024-01-15T12:00:00Z')).to.be.true;
      expect(Date.isIsoString('invalid')).to.be.false;
    });
  });
});
