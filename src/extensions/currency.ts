export type CurrencyRounding = 'upTo99' | 'downTo99' | 'upTo0' | 'downTo0';

export const Currency = {
  roundTo(value: number, rounding: CurrencyRounding): number {
    if (value == null || isNaN(value) || value === 0) return 0;
    const ceil = Math.ceil(value);
    const floor = Math.floor(value);
    switch (rounding) {
      case 'upTo99': return (ceil === value ? ceil + 1 : ceil) - 0.01;
      case 'downTo99': return (value - floor !== 0.99 ? value : floor - 0.01);
      case 'upTo0': return ceil;
      case 'downTo0': return floor;
    }
  }
};
