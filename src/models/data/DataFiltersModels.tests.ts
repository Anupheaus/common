import { DateTime } from 'luxon';
import { DataFilters } from './DataFiltersModels';

describe('DataFiltersModels', () => {

  it('can parse a filter correctly', () => {
    const parsedValue = DataFilters.parse({ something: 'key' }, {
      leaf: data => data,
      fork: data => data,
    });
    expect(parsedValue).to.deep.equal([{ path: ['something'], operator: '$eq', value: 'key' }]);
  });

  it('can parse a more complicated filter correctly', () => {
    const parsedValue = DataFilters.parse({ something: { else: 'key' } }, {
      leaf: data => data,
      fork: data => data,
    });
    expect(parsedValue).to.deep.equal([{ path: ['something', 'else'], operator: '$eq', value: 'key' }]);
  });

  it('can handle dates correctly', () => {
    const dtNow = DateTime.now();
    const now = new Date();
    const parsedValue = DataFilters.parse({ something: { else: dtNow, other: now } }, {
      leaf: data => data,
      fork: data => data,
    });
    expect(parsedValue).to.deep.equal([{ path: ['something', 'else'], operator: '$eq', value: dtNow }, { path: ['something', 'other'], operator: '$eq', value: now }]);
  });

  it('can handle other operators correctly', () => {
    const dtNow = DateTime.now();
    const now = new Date();
    const parsedValue = DataFilters.parse({ something: { else: { $gt: dtNow }, other: { $lt: now } } }, {
      leaf: data => data,
      fork: data => data,
    });
    expect(parsedValue).to.deep.equal([{ path: ['something', 'else'], operator: '$gt', value: dtNow }, { path: ['something', 'other'], operator: '$lt', value: now }]);
  });

  it('can handle "or" operators correctly', () => {
    const dtNow = DateTime.now();
    const now = new Date();
    const parsedValue = DataFilters.parse({ something: { $or: [{ else: { $gt: dtNow }, other: { $lt: now } }, { else: { $lt: dtNow }, other: { $gt: now } }] } }, {
      leaf: data => data,
      fork: data => data,
    });
    expect(parsedValue).to.deep.equal([{
      operator: 'or',
      items: [
        [{ path: ['something', 'else'], operator: '$gt', value: dtNow }, { path: ['something', 'other'], operator: '$lt', value: now }],
        [{ path: ['something', 'else'], operator: '$lt', value: dtNow }, { path: ['something', 'other'], operator: '$gt', value: now }],
      ],
    }]);
  });

  it('can handle "and" and "or" operators correctly', () => {
    const dtNow = DateTime.now();
    const now = new Date();
    const parsedValue = DataFilters.parse({ something: { there: { $lte: 2 }, $or: [{ else: { $gt: dtNow }, other: { $lt: now } }, { else: { $lt: dtNow }, other: { $gt: now } }] } }, {
      leaf: data => data,
      fork: data => data,
    });
    expect(parsedValue).to.deep.equal([{
      path: ['something', 'there'],
      operator: '$lte',
      value: 2,
    }, {
      operator: 'or',
      items: [
        [{ path: ['something', 'else'], operator: '$gt', value: dtNow }, { path: ['something', 'other'], operator: '$lt', value: now }],
        [{ path: ['something', 'else'], operator: '$lt', value: dtNow }, { path: ['something', 'other'], operator: '$gt', value: now }],
      ],
    }]);
  });

  it('can correctly handle arrays', () => {
    const parsedValue = DataFilters.parse({ something: { there: ['one', 'two'] } }, {
      leaf: data => data,
      fork: data => data,
    });
    expect(parsedValue).to.deep.equal([{
      path: ['something', 'there'],
      operator: '$in',
      value: ['one', 'two'],
    }]);
  });

});