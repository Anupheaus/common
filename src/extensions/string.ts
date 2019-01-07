import './object';

declare global {

  interface String {
    asTemplate(values: object): string;
    hash(): number;
    condenseWhitespace(): string;
    toPascalCase(): string;
    toCamelCase(): string;
    toVariableName(): string;
    padRight(length: number): string;
    padRight(length: number, paddingChar: string): string;
    padLeft(length: number): string;
    padLeft(length: number, paddingChar: string): string;
    countOf(value: string): number;
  }

}

Object.addMethods(String.prototype, [

  function asTemplate(this: string, values: object): string {
    const mapped = Reflect.ownKeys(values).map(key => [key, values[key]]);
    return new Function(...mapped.map(item => item[0]), `return \`${this}\`;`)(...mapped.map(item => item[1]));
  },

  function hash(this: string): number {
    let hashValue = 0;
    if (this.length === 0) { return hashValue; }
    for (let i = 0; i < this.length; i++) {
      const chr = this.charCodeAt(i);
      hashValue = ((hashValue << 5) - hashValue) + chr;
      hashValue |= 0;
    }
    return hashValue;
  },

  function condenseWhitespace(this: string): string {
    return this.replace(/(^\s+)|(\s*\n\s*)/gm, ' ');
  },

  function toPascalCase(this: string): string {
    if (typeof (this) !== 'string' || this.length === 0) { return ''; }
    if (this.length === 1) { return this.toUpperCase(); }
    return this.split(/\s+/g)
      .filter(word => typeof (word) === 'string' && word.length > 0)
      .map(word => `${word.substr(0, 1).toUpperCase()}${word.substr(1).toLowerCase()}`)
      .join(' ');
  },

  function toCamelCase(this: string): string {
    if (typeof (this) !== 'string' || this.length === 0) { return ''; }
    if (this.length === 1) { return this.toLowerCase(); }
    const value = this.toPascalCase();
    return `${value.substr(0, 1).toLowerCase()}${value.substr(1)}`;
  },

  function toVariableName(this: string): string {
    return this.toCamelCase().replace(/\s+/g, '');
  },

  function padRight(this: string, length: number, paddingChar: string = ' '): string {
    length = length - this.length;
    length = Math.max(0, length);
    return `${this}${paddingChar.repeat(length)}`;
  },

  function padLeft(this: string, length: number, paddingChar: string = ' '): string {
    length = length - this.length;
    length = Math.max(0, length);
    return `${paddingChar.repeat(length)}${this}`;
  },

  function countOf(this: string, value: string): number {
    if (typeof (value) !== 'string' || value.length === 0 || this.length === 0) { return 0; }
    return this.split(value).length - 1;
  },

]);
