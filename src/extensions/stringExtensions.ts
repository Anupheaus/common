import './math';

interface IObfuscateOptions {
  percentage?: number;
  minimum?: number;
  character?: string;
}

export class StringExtensions {

  public asTemplate(values: object): string;
  public asTemplate(this: string, values: object): string {
    const mapped = Reflect.ownKeys(values).map(key => [key, values[key]]);
    return new Function(...mapped.map(item => item[0]), `return \`${this}\`;`)(...mapped.map(item => item[1]));
  }

  public hash(): number;
  public hash(this: string): number {
    let hashValue = 0;
    if (this.length === 0) { return hashValue; }
    for (let i = 0; i < this.length; i++) {
      const chr = this.charCodeAt(i);
      hashValue = ((hashValue << 5) - hashValue) + chr;
      hashValue |= 0;
    }
    return hashValue;
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
      .map(word => `${word.substr(0, 1).toUpperCase()}${word.substr(1).toLowerCase()}`)
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

  public padRight(length: number): string;
  public padRight(length: number, paddingChar: string): string;
  public padRight(this: string, length: number, paddingChar: string = ' '): string {
    length = length - this.length;
    length = Math.max(0, length);
    return `${this}${paddingChar.repeat(length)}`;
  }

  public padLeft(length: number): string;
  public padLeft(length: number, paddingChar: string): string;
  public padLeft(this: string, length: number, paddingChar: string = ' '): string {
    length = length - this.length;
    length = Math.max(0, length);
    return `${paddingChar.repeat(length)}${this}`;
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

}
