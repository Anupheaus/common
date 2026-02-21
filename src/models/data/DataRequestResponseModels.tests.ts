import { DataRequest } from './DataRequestResponseModels';

describe('DataRequestResponseModels', () => {

  describe('DataRequest.isEmpty', () => {
    it('returns true for null', () => {
      expect(DataRequest.isEmpty(null as any)).to.be.true;
    });

    it('returns true for empty request', () => {
      expect(DataRequest.isEmpty({})).to.be.true;
    });

    it('returns false when pagination has limit', () => {
      expect(DataRequest.isEmpty({ pagination: { limit: 10 } })).to.be.false;
    });

    it('returns false when sorts exist', () => {
      expect(DataRequest.isEmpty({ sorts: [['name', 'asc']] })).to.be.false;
    });
  });
});
