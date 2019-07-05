import './string';

describe('extensions', () => {

  describe('string', () => {

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
        const message = String.pluralize`There ${['are no fields', 'is $$ field', 'are $$ fields']} with ${['an error', 'errors']}; you cannot save until ${['it has', 'they have']} been corrected.`;
        expect(message(0)).to.eq('There are no fields with errors; you cannot save until they have been corrected.');
        expect(message(1)).to.eq('There is 1 field with an error; you cannot save until it has been corrected.');
        expect(message(2)).to.eq('There are 2 fields with errors; you cannot save until they have been corrected.');
        expect(message(10)).to.eq('There are 10 fields with errors; you cannot save until they have been corrected.');
      });

      it('can immediately pluralize a string', () => {
        const message = String.pluralize`There ${['are no fields', 'is $$ field', 'are $$ fields']} with ${['an error', 'errors']}; you cannot save until ${['it has', 'they have']} been corrected.`(0);
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
        const message = String.pluralize`Testing ${[]} this ${undefined} with some ${['']} bad ${null} values.`;
        expect(message(0)).to.eq('Testing  this  with some  bad  values.');
      });

      it('can still use variables', () => {
        const value = 'this';
        const message = String.pluralize`Testing ${value} still works.`;
        expect(message(0)).to.eq('Testing this still works.');
      });

    });

  });

});