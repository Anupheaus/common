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

  describe('proxy', () => {

    it('can create a proxy', () => {
      const target = { something: 'hey', setToUndefined: undefined };
      const result = to.proxy(target);
      expect(result).not.to.be.undefined;
      expect(result).to.have.property('proxy').and.is.an('object');
      expect(result).to.have.property('get').and.is.a('function');
      expect(result).to.have.property('set').and.is.a('function');
      expect(result).to.have.property('onAfterSet').and.is.a('function');
      expect(result).to.have.property('onDefault').and.is.a('function');
      expect(result).to.have.property('onGet').and.is.a('function');
      expect(result).to.have.property('onSet').and.is.a('function');
    });

    it('proxy get returns target and set mutates it', () => {
      const target = { count: 0 };
      const { proxy, get, set } = to.proxy(target);
      expect(get()).to.deep.equal({ count: 0 });
      set(proxy.count, 5);
      expect(get().count).to.equal(5);
    });

  });

});