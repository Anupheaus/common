import { Currency, type CurrencyRounding } from './currency';
import { ArgumentInvalidError } from '../errors';

describe('currency', () => {

  it('roundTo upTo99 rounds up to .99', () => {
    expect(Currency.roundTo(1.5, 'upTo99')).to.equal(1.99);
  });

  it('roundTo downTo99 leaves value unchanged when not at .99', () => {
    expect(Currency.roundTo(2.50, 'downTo99')).to.equal(2.50);
  });

  it('roundTo downTo99 preserves value when already at .99', () => {
    expect(Currency.roundTo(2.99, 'downTo99')).to.equal(2.99);
  });

  it('roundTo upTo0 rounds up', () => {
    expect(Currency.roundTo(1.1, 'upTo0')).to.equal(2);
  });

  it('roundTo downTo0 rounds down', () => {
    expect(Currency.roundTo(1.9, 'downTo0')).to.equal(1);
  });

  it('returns 0 for null, NaN, or 0', () => {
    expect(Currency.roundTo(null as any, 'upTo0')).to.equal(0);
    expect(Currency.roundTo(NaN, 'upTo0')).to.equal(0);
    expect(Currency.roundTo(0, 'upTo0')).to.equal(0);
  });

  it('throws for invalid rounding', () => {
    expect(() => Currency.roundTo(1.5, 'invalid' as CurrencyRounding)).to.throw(ArgumentInvalidError);
  });
});
