/* eslint-disable max-classes-per-file */
import { hash } from './utils';
import './math';

type HashOptions = Parameters<typeof hash>[1];

interface IObfuscateOptions {
  percentage?: number;
  minimum?: number;
  character?: string;
}

export class StringExtensions {

  public asTemplate(values: object): string;
  public asTemplate(this: string, values: object): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = Reflect.ownKeys(values).map(key => [key, (values as any)[key]]);
    return new Function(...mapped.map(item => item[0]), `return \`${this}\`;`)(...mapped.map(item => item[1]));
  }

  public hash(options?: HashOptions): string;
  public hash(this: string, options?: HashOptions): string {
    return hash(this, options);
  }

  public condenseWhitespace(): string;
  public condenseWhitespace(this: string): string {
    return this.replace(/(^\s+)|(\s*\n\s*)/gm, ' ');
  }

  public toPascalCase(): string;
  public toPascalCase(this: string): string {
    if (typeof (this) !== 'string' || this.length === 0) { return ''; }
    if (this.length === 1) { return this.toUpperCase(); }
    return this.split(/\s+/g)
      .filter(word => typeof (word) === 'string' && word.length > 0)
      .map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
      .join(' ');
  }

  public toCamelCase(): string;
  public toCamelCase(this: string): string {
    if (typeof (this) !== 'string' || this.length === 0) { return ''; }
    if (this.length === 1) { return this.toLowerCase(); }
    const value = this.toPascalCase();
    return `${value.substr(0, 1).toLowerCase()}${value.substr(1)}`;
  }

  public toVariableName(): string;
  public toVariableName(this: string): string {
    return this.toCamelCase().replace(/\s+/g, '');
  }

  public countOf(value: string): number;
  public countOf(this: string, value: string): number {
    if (typeof (value) !== 'string' || value.length === 0 || this.length === 0) { return 0; }
    return this.split(value).length - 1;
  }

  public obfuscate(): string;
  public obfuscate(options: IObfuscateOptions): string;
  public obfuscate(this: string, options?: IObfuscateOptions): string {
    if (this.length === 0) { return this; }

    let { minimum, percentage, character } = {
      minimum: 6,
      percentage: 80,
      character: '*',
      ...options,
    };
    minimum = Math.max(minimum, 0);
    percentage = Math.between(percentage, 0, 100) / 100;
    if (minimum === 0 && percentage === 0) { return this; }
    character = character.length === 0 ? '*' : character[0];

    if (this.length <= minimum) { return character.repeat(minimum); }
    let hiddenCount = Math.max(Math.floor(this.length * percentage), minimum);
    const visibleCount = this.length - hiddenCount;
    const startVisibleCount = Math.ceil(visibleCount / 2);
    const endVisibleCount = Math.floor(visibleCount / 2);
    hiddenCount = this.length - startVisibleCount - endVisibleCount;
    const endVisibleStart = startVisibleCount + hiddenCount;
    const endVisibleLength = this.length - endVisibleStart;
    return `${this.substr(0, startVisibleCount)}${character.repeat(hiddenCount)}${this.substr(endVisibleStart, endVisibleLength)}`;
  }

  public between(start: string | number, end: string | number): string;
  public between(start: string | number, end: string | number, inclusive: boolean): string;
  public between(this: string, start: string | number, end: string | number, inclusive = false): string {
    let startIndex = typeof (start) === 'number' ? start : this.indexOf(start);
    let endIndex = typeof (end) === 'number' ? end : this.indexOf(end, startIndex + 1);
    if (startIndex < 0) throw new Error('The starting index was invalid or starting search string was not found.');
    if (endIndex < 0) throw new Error('The ending index was invalid or ending search string was not found.');
    if (typeof (start) === 'string' && !inclusive) startIndex += start.length;
    if (typeof (end) === 'string' && inclusive) endIndex += end.length;
    return this.substr(startIndex, endIndex - startIndex);
  }

}

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export class StringConstructorExtensions {

  public pluralize(strings: TemplateStringsArray, ...keys: (string | string[] | ((value: number) => string))[]): (value: number) => string {
    return value => {
      const result: string[] = [];

      value = Math.max(value, 0);

      const getKeyIndex = (length: number) => {
        if (length < 2) { return null; }
        if (length === 2) { return value === 1 ? 0 : 1; }
        return Math.min(value, 2);
      };

      strings.forEach((constant, index) => {
        result.push(constant);
        const values = keys[index];
        if (values == null) { return; }
        if (typeof (values) === 'string') {
          result.push(values);
        } else if (typeof (values) === 'function') {
          result.push(values(value));
        } else if (values instanceof Array) {
          const keyIndex = getKeyIndex(values.length);
          if (keyIndex == null) { return; }
          result.push(values[keyIndex]);
        }
      });
      return result.join('').replace(/\$\$/g, value.toString());
    };
  }

  public percentageMatch(value1: string | undefined, value2: string | undefined): number {
    if (value1 == null || value2 == null) { return 0; }
    const longer = value1.length > value2.length ? value1 : value2;
    const shorter = value1.length <= value2.length ? value1 : value2;
    const longerLength = longer.length;
    if (longerLength == 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / longerLength;
  }

}
