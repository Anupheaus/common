import './string';

describe('extensions', () => {

  describe('string', () => {

    describe('hash', () => {

      it('can produce a hash of the expected length', () => {
        expect('something'.hash()).to.be.a('string').with.lengthOf(40);
      });

    });

    describe('obfuscate', () => {

      it('all values below minimum are set to minimum x star', () => {
        ['a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef'].forEach(value => {
          expect(value.obfuscate()).to.eq('******');
        });
      });

      it('values above minimum are correctly hidden', () => {
        [
          { value: 'abcdefg', result: 'a******' },
          { value: 'abcdefgh', result: 'a******h' },
          { value: 'abcdefghi', result: 'a*******i' },
          { value: 'abcdefghij', result: 'a********j' },
          { value: 'abcdefghijk', result: 'ab********k' },
          { value: 'abcdefghijkl', result: 'ab*********l' },
          { value: 'abcdefghijklm', result: 'ab**********m' },
          { value: 'abcdefghijklmn', result: 'ab***********n' },
          { value: 'abcdefghijklmno', result: 'ab************o' },
          { value: 'abcdefghijklmnop', result: 'ab************op' },
          { value: 'abcdefghijklmnopq', result: 'ab*************pq' },
          { value: 'abcdefghijklmnopqr', result: 'ab**************qr' },
          { value: 'abcdefghijklmnopqrs', result: 'ab***************rs' },
          { value: 'abcdefghijklmnopqrst', result: 'ab****************st' },
          { value: 'abcdefghijklmnopqrstu', result: 'abc****************tu' },
          { value: 'abcdefghijklmnopqrstuv', result: 'abc*****************uv' },
          { value: 'abcdefghijklmnopqrstuvw', result: 'abc******************vw' },
          { value: 'abcdefghijklmnopqrstuvwx', result: 'abc*******************wx' },
          { value: 'abcdefghijklmnopqrstuvwxy', result: 'abc********************xy' },
          { value: 'abcdefghijklmnopqrstuvwxyz', result: 'abc********************xyz' },
        ].forEach(({ value, result }) => {
          expect(value.obfuscate()).to.eq(result);
        });
      });

      it('obfuscates correctly with different percentages', () => {
        const fullString = 'abcdefghijklmnopqrstuvwxyz';
        [
          { percentage: 0, result: 'abcdefghijklmnopqrstuvwxyz' },
          { percentage: 20, result: 'abcdefghijk*****qrstuvwxyz' },
          { percentage: 40, result: 'abcdefgh**********stuvwxyz' },
          { percentage: 60, result: 'abcdef***************vwxyz' },
          { percentage: 80, result: 'abc********************xyz' },
          { percentage: 100, result: '**************************' },
        ].forEach(({ percentage, result }) => {
          expect(fullString.obfuscate({ percentage, minimum: 0 })).to.eq(result);
        });
      });

      it('obfuscates correctly with different minimums', () => {
        const fullString = 'abcdefghijklmnopqrstuvwxyz';
        [
          { minimum: 0, result: 'abcdefghijklmnopqrstuvwxyz' },
          { minimum: 6, result: 'abcdefghij******qrstuvwxyz' },
          { minimum: 13, result: 'abcdefg*************uvwxyz' },
          { minimum: 18, result: 'abcd******************wxyz' },
          { minimum: 26, result: '**************************' },
        ].forEach(({ minimum, result }) => {
          expect(fullString.obfuscate({ minimum, percentage: 0 })).to.eq(result);
        });
      });

      it('obfuscates correctly with different characters', () => {
        const fullString = 'abcdefgh';
        [
          { character: 'x', result: 'axxxxxxh' },
          { character: '#', result: 'a######h' },
          { character: '?', result: 'a??????h' },
          { character: ' ', result: 'a      h' },
          { character: '', result: 'a******h' },
        ].forEach(({ character, result }) => {
          expect(fullString.obfuscate({ character })).to.eq(result);
        });
      });

    });

    describe('pluralize', () => {

      it('can pluralize a string', () => {
        const message = String.pluralize`There ${['are no fields', 'is $$ field', 'are $$ fields']} with ${['an error',
          'errors']}; you cannot save until ${['it has', 'they have']} been corrected.`;
        expect(message(0)).to.eq('There are no fields with errors; you cannot save until they have been corrected.');
        expect(message(1)).to.eq('There is 1 field with an error; you cannot save until it has been corrected.');
        expect(message(2)).to.eq('There are 2 fields with errors; you cannot save until they have been corrected.');
        expect(message(10)).to.eq('There are 10 fields with errors; you cannot save until they have been corrected.');
      });

      it('can immediately pluralize a string', () => {
        const message = String.pluralize`There ${['are no fields', 'is $$ field', 'are $$ fields']} with ${['an error',
          'errors']}; you cannot save until ${['it has', 'they have']} been corrected.`(0);
        expect(message).to.eq('There are no fields with errors; you cannot save until they have been corrected.');
      });

      it('can pluralize with a delegate', () => {
        const message = String.pluralize`There ${value => (value === 0 ? 'are no fields' : value === 1 ? 'is 1 field' : value > 10
          ? 'are too many fields' : 'are $$ fields')} with ${['an error', 'errors']}; you cannot save until ${['it has', 'they have']} been corrected.`;
        expect(message(0)).to.eq('There are no fields with errors; you cannot save until they have been corrected.');
        expect(message(1)).to.eq('There is 1 field with an error; you cannot save until it has been corrected.');
        expect(message(2)).to.eq('There are 2 fields with errors; you cannot save until they have been corrected.');
        expect(message(11)).to.eq('There are too many fields with errors; you cannot save until they have been corrected.');
      });

      it('ignores invalid values', () => {
        const message = String.pluralize`Testing ${[]} this ${undefined as unknown as string} with some ${['']} bad ${null as unknown as string} values.`;
        expect(message(0)).to.eq('Testing  this  with some  bad  values.');
      });

      it('can still use variables', () => {
        const value = 'this';
        const message = String.pluralize`Testing ${value} still works.`;
        expect(message(0)).to.eq('Testing this still works.');
      });

    });

    describe('between', () => {

      it('can get the value between two search strings', () => {
        const result = 'Hey @you@ there'.between('@', '@');
        expect(result).to.eq('you');
      });

      it('can get the value between two search strings inclusively', () => {
        const result = 'Hey @you@ there'.between('@', '@', true);
        expect(result).to.eq('@you@');
      });

      it('can get the value between two search index points', () => {
        expect('Hey @you@ there'.between(5, 8)).to.eq('you');
        expect('Hey @you@ there'.between(0, 3)).to.eq('Hey');
        expect('Hey @you@ there'.between(10, 15)).to.eq('there');
      });

    });

    describe('toPascalCase', () => {

      it('converts space-separated words', () => {
        expect('hello world'.toPascalCase()).to.equal('Hello World');
      });

      it('converts hyphen-separated words', () => {
        expect('hello-world'.toPascalCase()).to.equal('Hello World');
      });

      it('converts underscore-separated words', () => {
        expect('hello_world'.toPascalCase()).to.equal('Hello World');
      });

      it('returns empty string for empty input', () => {
        expect(''.toPascalCase()).to.equal('');
      });

      it('handles a single character', () => {
        expect('a'.toPascalCase()).to.equal('A');
      });

    });

    describe('toCamelCase', () => {

      it('converts space-separated words to camelCase', () => {
        expect('hello world'.toCamelCase()).to.equal('hello World');
      });

      it('lowercases the first letter', () => {
        expect('Hello World'.toCamelCase()).to.equal('hello World');
      });

      it('returns empty string for empty input', () => {
        expect(''.toCamelCase()).to.equal('');
      });

    });

    describe('toVariableName', () => {

      it('removes spaces and converts to camelCase by default', () => {
        expect('hello world'.toVariableName()).to.equal('helloWorld');
      });

      it('removes hyphens and converts to camelCase', () => {
        expect('my-variable-name'.toVariableName()).to.equal('myVariableName');
      });

      it('converts to PascalCase when specified', () => {
        expect('hello world'.toVariableName('pascal')).to.equal('HelloWorld');
      });

    });

    describe('countOf', () => {

      it('counts occurrences of a substring', () => {
        expect('abcabcabc'.countOf('abc')).to.equal(3);
      });

      it('returns 0 when substring not found', () => {
        expect('hello'.countOf('xyz')).to.equal(0);
      });

      it('returns 0 for empty string input', () => {
        expect(''.countOf('a')).to.equal(0);
      });

      it('returns 0 when search value is empty', () => {
        expect('hello'.countOf('')).to.equal(0);
      });

    });

    describe('condenseWhitespace', () => {

      it('replaces newlines and surrounding whitespace with a single space', () => {
        expect('hello\n  world'.condenseWhitespace()).to.equal('hello world');
      });

      it('removes leading whitespace', () => {
        expect('  hello'.condenseWhitespace()).to.equal(' hello');
      });

      it('leaves single-line strings without leading spaces unchanged', () => {
        expect('hello world'.condenseWhitespace()).to.equal('hello world');
      });

    });

    describe('asTemplate', () => {

      it('substitutes a variable into a template string', () => {
        expect('Hello ${name}!'.asTemplate({ name: 'World' })).to.equal('Hello World!');
      });

      it('substitutes multiple variables', () => {
        expect('${a} + ${b} = ${c}'.asTemplate({ a: 1, b: 2, c: 3 })).to.equal('1 + 2 = 3');
      });

      it('should replace named placeholders with values', () => {
        expect('Hello, ${name}!'.asTemplate({ name: 'World' })).to.equal('Hello, World!');
      });

      it('should replace multiple placeholders', () => {
        expect('${a} + ${b} = ${c}'.asTemplate({ a: '1', b: '2', c: '3' })).to.equal('1 + 2 = 3');
      });

      it('should leave unmatched placeholders as-is', () => {
        expect('Hello, ${name}!'.asTemplate({})).to.equal('Hello, ${name}!');
      });

      it('should not execute injected code', () => {
        const result = 'Value: ${x}'.asTemplate({ x: '${y}' });
        expect(result).to.equal('Value: ${y}');
      });

      it('should handle numeric values', () => {
        expect('Count: ${n}'.asTemplate({ n: 42 as any })).to.equal('Count: 42');
      });

    });

    describe('percentageMatch', () => {

      it('returns 1 for identical strings', () => {
        expect(String.percentageMatch('hello', 'hello')).to.equal(1);
      });

      it('returns 0 when either value is undefined', () => {
        expect(String.percentageMatch(undefined, 'hello')).to.equal(0);
        expect(String.percentageMatch('hello', undefined)).to.equal(0);
      });

      it('returns 1 for two empty strings', () => {
        expect(String.percentageMatch('', '')).to.equal(1);
      });

      it('returns a value between 0 and 1 for partially matching strings', () => {
        const result = String.percentageMatch('hello', 'help');
        expect(result).to.be.above(0).and.below(1);
      });

    });

  });

});