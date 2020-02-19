import { to } from './to';

describe('to', () => {

  describe('string', () => {

    it('can convert a number to a string', () => {
      expect(to.string(34)).to.be.a('string').and.eq('34');
      expect(to.string(35456544)).to.be.a('string').and.eq('35456544');
    });

    it('can convert a number to a string with a format', () => {
      expect(to.string(345845484, '#,##0')).to.be.a('string').and.eq('345,845,484');
      expect(to.string(345845484, '$#,##0')).to.be.a('string').and.eq('$345,845,484');
      // expect(to.string(345845484, '£#,##0')).to.be.a('string').and.eq('£345,845,484');
    });

  });

});