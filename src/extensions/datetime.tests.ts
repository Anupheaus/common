import { expect } from 'chai';
import { DateTime } from 'luxon';
import { sameInstant } from './datetime';

describe('sameInstant', () => {
  it('returns true for the same instant in different zones', () => {
    const london = DateTime.fromISO('2026-06-04T10:00:00+01:00', { zone: 'Europe/London' });
    const utc = DateTime.fromISO('2026-06-04T09:00:00Z', { zone: 'utc' });
    expect(sameInstant(london, utc)).to.be.true;
    expect(london.equals(utc)).to.be.false;
  });

  it('returns false for different instants', () => {
    const a = DateTime.fromISO('2026-06-04T10:00:00+01:00');
    const b = DateTime.fromISO('2026-06-05T10:00:00+01:00');
    expect(sameInstant(a, b)).to.be.false;
  });

  it('returns false when either value is invalid', () => {
    const valid = DateTime.fromISO('2026-06-04T10:00:00+01:00');
    const invalid = DateTime.invalid('bad');
    expect(sameInstant(valid, invalid)).to.be.false;
    expect(sameInstant(invalid, invalid)).to.be.false;
  });
});
