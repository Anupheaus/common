/* eslint-disable max-classes-per-file */
import './array';
import './map';
import type { AnyObject, Record, Upsertable } from './global';

class TestClass {
  public constructor(value: number) { this.value = value; }
  public value: number;
}

class TestIdClass {
  public constructor(id: string) { this.id = id; }
  public id: string;
}

describe('extension > array', () => {

  describe('mapMany', () => {

    it('can flatten a multi-dimension array', () => {
      const array = [[1, 2], [3, 4, 5], [6, 7, 8, 9]];
      const result = array.mapMany(item => item);
      expect(result).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

  });

  describe('ofType', () => {

    it('can filter type by string', () => {
      const array = [1, '2', 3, 4, '5', 6, 7, 8, '9'];
      const result = array.ofType('string');
      expect(result).to.eql(['2', '5', '9']);
    });

    it('can filter type by number', () => {
      const array = [1, '2', 3, 4, '5', 6, 7, 8, '9'];
      const result = array.ofType('number');
      expect(result).to.eql([1, 3, 4, 6, 7, 8]);
    });

    it('can filter class type', () => {
      const array = [new TestClass(1), '2', 3, new TestClass(4), '5', 6, 7, new TestClass(8), '9'];
      const result = array.ofType(TestClass);
      expect(result.map(item => item.value)).to.eql([1, 4, 8]);
    });

  });

  describe('single', () => {

    it('can select at most one', () => {
      const array = [1];
      const result = array.single();
      expect(result).to.eql(1);
    });

    it('errors if more than one is found', () => {
      const array = [1, 2];
      expect(() => array.single()).to.throw('Multiple items were found when only one was expected.');
    });

    it('returns undefined if none are found', () => {
      const array: string[] = [];
      const result = array.single();
      expect(result).to.be.undefined;
    });

    it('can apply a filter', () => {
      const array = [1, 2];
      const result = array.single(item => item === 2);
      expect(result).to.eql(2);
    });

    it('errors if more than one is found when applying a filter', () => {
      const array = [1, 2, 3];
      expect(() => array.single(item => item % 2 === 1)).to.throw('Multiple items were found when only one was expected.');
    });

    it('returns undefined if none are found when applying a filter', () => {
      const array = [1, 2, 3];
      const result = array.single(() => false);
      expect(result).to.be.undefined;
    });

  });

  describe('first', () => {

    it('can select at most one', () => {
      const array = [1];
      const result = array.first();
      expect(result).to.eql(1);
    });

    it('returns only the first in an array', () => {
      const array = [1, 2];
      const result = array.first();
      expect(result).to.eql(1);
    });

    it('returns undefined if none are found', () => {
      const array: string[] = [];
      const result = array.first();
      expect(result).to.be.undefined;
    });

    it('can apply a filter', () => {
      const array = [1, 2];
      const result = array.first(item => item === 2);
      expect(result).to.eql(2);
    });

    it('returns the correct value when applying a filter', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const result = array.first(item => item % 2 === 0);
      expect(result).to.eql(2);
    });

    it('returns undefined if none are found when applying a filter', () => {
      const array = [1, 2, 3];
      const result = array.first(() => false);
      expect(result).to.be.undefined;
    });

  });

  describe('last', () => {

    it('can select at most one and is the last in the array', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const result = array.last();
      expect(result).to.eql(6);
    });

    it('returns undefined if none are found', () => {
      const array: string[] = [];
      const result = array.last();
      expect(result).to.be.undefined;
    });

    it('can apply a filter and returns the correct value', () => {
      const array = [1, 2, 3, 4, 4, 4, 5, 6, 7].map(value => new TestClass(value));
      const result = array.last(item => item.value === 4);
      expect(result).to.eq(array[5]);
    });

    it('returns undefined if none are found when applying a filter', () => {
      const array = [1, 2, 3];
      const result = array.last(() => false);
      expect(result).to.be.undefined;
    });

  });

  describe('clone', () => {

    it('can clone an array', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.clone();
      expect(result).to.eql(array).but.not.to.eq(array);
    });

  });

  describe('remove', () => {
    let array: TestClass[];

    beforeEach(() => {
      array = [1, 2, 3, 4, 5].map(value => new TestClass(value));
    });

    afterEach(() => {
      array = undefined as unknown as TestClass[];
    });

    it('can remove an item', () => {
      const result = array.remove(array[2]);
      expect(result.map(item => item.value)).to.eql([1, 2, 4, 5]);
    });

    it('will not remove an item that does not exist and returns the same instance of the array if none are removed', () => {
      const result = array.remove(new TestClass(3));
      expect(result).to.eq(array);
    });

    it('will remove all instances of the item', () => {
      array.push(array[2]);
      expect(array.map(item => item.value)).to.eql([1, 2, 3, 4, 5, 3]);
      const result = array.remove(array[2]);
      expect(result.map(item => item.value)).to.eql([1, 2, 4, 5]);
    });

  });

  describe('removeByFilter', () => {
    let array: TestClass[];

    beforeEach(() => {
      array = [1, 2, 3, 4, 5].map(value => new TestClass(value));
    });

    afterEach(() => {
      array = undefined as unknown as TestClass[];
    });

    it('can remove an item using a filter', () => {
      const result = array.removeByFilter(item => item.value === 3);
      expect(result.map(item => item.value)).to.eql([1, 2, 4, 5]);
    });

    it('will not remove an item that does not exist and returns the same instance of the array if none are removed', () => {
      const result = array.removeByFilter(item => item.value === 10);
      expect(result).to.eq(array);
    });

    it('will remove all items where the filter matches', () => {
      array.push(array[2]);
      expect(array.map(item => item.value)).to.eql([1, 2, 3, 4, 5, 3]);
      const result = array.removeByFilter(item => item.value === 3);
      expect(result.map(item => item.value)).to.eql([1, 2, 4, 5]);
    });

    it('will error if no filter is given', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => array.removeByFilter(undefined as any)).to.throw('The argument \'filter\' was invalid.');
    });

  });

  describe('removeById', () => {
    let array: TestIdClass[];

    beforeEach(() => {
      array = [1, 2, 3, 4, 5].map(value => new TestIdClass(value.toString()));
    });

    afterEach(() => {
      array = undefined as unknown as TestIdClass[];
    });

    it('can remove an item using the id', () => {
      const result = array.removeById('3');
      expect(result.map(item => item.id)).to.eql(['1', '2', '4', '5']);
    });

    it('will not remove an item that does not exist and returns the same instance of the array if none are removed', () => {
      const result = array.removeById('10');
      expect(result).to.eq(array);
    });

    it('will remove all items where the id matches', () => {
      array.push(array[2]);
      expect(array.map(item => item.id)).to.eql(['1', '2', '3', '4', '5', '3']);
      const result = array.removeById('3');
      expect(result.map(item => item.id)).to.eql(['1', '2', '4', '5']);
    });

  });

  describe('indexOfId', () => {

    let array: TestIdClass[];

    beforeEach(() => {
      array = [1, 2, 3, 4, 5].map(value => new TestIdClass(value.toString()));
    });

    afterEach(() => {
      array = undefined as unknown as TestIdClass[];
    });

    it('can find the index of an item with id', () => {
      const result = array.indexOfId('3');
      expect(result).to.eq(2);
    });

    it('will return -1 if no item with the id can be found', () => {
      const result = array.indexOfId('10');
      expect(result).to.eq(-1);
    });

  });

  describe('findById', () => {
    let array: TestIdClass[];

    beforeEach(() => {
      array = [1, 2, 3, 4, 5].map(value => new TestIdClass(value.toString()));
    });

    afterEach(() => {
      array = undefined as unknown as TestIdClass[];
    });

    it('can find the item with the correct id', () => {
      const result = array.findById('3');
      expect(result).to.eq(array[2]);
    });

    it('will return undefined if no item with the id can be found', () => {
      const result = array.findById('10');
      expect(result).to.undefined;
    });

  });

  describe('upsert', () => {

    describe('with objects with ids', () => {
      let array: { id: string; name: string; }[];

      beforeEach(() => {
        array = [1, 2, 3, 4, 5].map(id => ({ id: id.toString(), name: id.toString() }));
      });

      afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        array = undefined as any;
      });

      function createTestData() {
        return [
          { id: '1', name: 'tony', surname: 'hales' },
          { id: '2', name: 'jodie', surname: 'pearce' },
          { id: '3', name: 'harrison', surname: 'george' },
          { id: '4', name: 'lucas', surname: 'george' },
        ];
      }

      it('can update an existing item', () => {
        const result = array.upsert({ id: '2', name: 'Jodie' });
        expect(result.map(item => item.name)).to.eql(['1', 'Jodie', '3', '4', '5']);
      });

      it('can insert an non-existing item', () => {
        const result = array.upsert({ id: '6', name: 'Jodie' });
        expect(result.map(item => item.name)).to.eql(['1', '2', '3', '4', '5', 'Jodie']);
      });

      it('returns the existing array instance if the object is already found and no changes are made', () => {
        const result = array.upsert({ id: '2', name: '2' });
        expect(result).to.eq(array);
        expect(result.map(item => item.name)).to.eql(['1', '2', '3', '4', '5']);
      });

      it('returns a different array instance if the object is already found but is moved to another index', () => {
        const result = array.upsert({ id: '2', name: '2' }, 4);
        expect(result).not.to.eq(array);
        expect(result.map(item => item.name)).to.eql(['1', '3', '4', '5', '2']);
      });

      it('can update the correct object in an array', () => {
        let data = createTestData();
        data = data.upsert({ id: '2', name: 'jodie', surname: 'hales' });
        expect(data[1]).to.eql({ id: '2', name: 'jodie', surname: 'hales' });
        expect(data[2]).to.eql({ id: '3', name: 'harrison', surname: 'george' });
      });

      it('can insert a new object into the array', () => {
        let data = createTestData();
        const length = data.length;
        data = data.upsert({ id: '5', name: 'hayden', surname: 'hales' });
        expect(data.length).to.eq(length + 1);
        expect(data[4]).to.eql({ id: '5', name: 'hayden', surname: 'hales' });
      });

    });

    describe('with strings', () => {

      it('returns the same array instance if the value is found', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.upsert('3');
        expect(result).to.eql(['1', '2', '3', '4', '5']).and.to.eq(stringArray);
      });

      it('returns a new array instance with the value if the value is not found', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.upsert('6');
        expect(result).to.eql(['1', '2', '3', '4', '5', '6']).and.not.to.eq(stringArray);
      });

      it('returns a new array instance if the value is found but the index is different', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.upsert('2', 4);
        expect(result).to.eql(['1', '3', '4', '5', '2']).and.not.to.eq(stringArray);
      });

    });

    describe('with numbers', () => {

      it('returns the same array instance if the value is found', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.upsert(3);
        expect(result).to.eql([1, 2, 3, 4, 5]).and.to.eq(numberArray);
      });

      it('returns a new array instance with the value if the value is not found', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.upsert(6);
        expect(result).to.eql([1, 2, 3, 4, 5, 6]).and.not.to.eq(numberArray);
      });

      it('returns a new array instance if the value is found but the index is different', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.upsert(2, 4);
        expect(result).to.eql([1, 3, 4, 5, 2]).and.not.to.eq(numberArray);
      });

    });

  });

  describe('upsertMany', () => {

    it('can upsert many items and does not duplicate existing items', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.upsertMany([5, 6, 7]);
      expect(result).to.eql([1, 2, 3, 4, 5, 6, 7]);
    });

    it('can upsert many items to a specific index', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.upsertMany([5, 6, 7], 2);
      expect(result).to.eql([1, 2, 5, 6, 7, 3, 4]);
    });

    interface UpsertTestRecord extends Record {
      something: string;
    }

    it('can upsert many records', () => {
      function testUpsert<T extends Record>(array: T[], items: T[]) {
        return array.upsertMany(items);
      }
      const records: UpsertTestRecord[] = [{ id: '1', something: 'hey1' }, { id: '2', something: 'bee' }, { id: '3', something: 'new' }];
      let result: UpsertTestRecord[] = [];
      result = testUpsert<UpsertTestRecord>(result, records);
      expect(result).to.eql(records);
    });

    it('can upsert many upsertable records', () => {
      function testUpsert<T extends Record>(array: T[], items: Upsertable<T>[]) {
        return array.upsertMany(items);
      }
      const records: Upsertable<UpsertTestRecord>[] = [{ id: '1', something: 'hey1' }, { id: '2', something: 'bee' }, { something: 'new' }];
      let result: UpsertTestRecord[] = [];
      result = testUpsert<UpsertTestRecord>(result, records);
      expect(result).to.eql(records);
    });

  });

  describe('replace', () => {

    describe('with objects with ids', () => {
      let array: { id: string; name: string; }[];

      beforeEach(() => {
        array = [1, 2, 3, 4, 5].map(id => ({ id: id.toString(), name: id.toString() }));
      });

      afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        array = undefined as any;
      });

      it('can replace an existing item', () => {
        const result = array.replace({ id: '2', name: 'Jodie' });
        expect(result.map(item => item.name)).to.eql(['1', 'Jodie', '3', '4', '5']);
      });

      it('cannot replace an non-existing item', () => {
        const result = array.replace({ id: '6', name: 'Jodie' });
        expect(result).to.eq(array);
        expect(result.map(item => item.name)).to.eql(['1', '2', '3', '4', '5']);
      });

      it('returns the existing array instance if no changes are made', () => {
        const result = array.replace({ id: '2', name: '2' });
        expect(result).to.eq(array);
        expect(result.map(item => item.name)).to.eql(['1', '2', '3', '4', '5']);
      });

      it('returns a different array instance if the object is already found but is moved to another index', () => {
        const result = array.replace({ id: '2', name: '2' }, 4);
        expect(result).not.to.eq(array);
        expect(result.map(item => item.name)).to.eql(['1', '3', '4', '5', '2']);
      });

    });

    describe('with strings', () => {

      it('returns the same array instance if the value is found', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.replace('3');
        expect(result).to.eql(['1', '2', '3', '4', '5']).and.to.eq(stringArray);
      });

      it('returns the same array instance if the value is not found', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.replace('6');
        expect(result).to.eql(['1', '2', '3', '4', '5']).and.to.eq(stringArray);
      });

      it('returns a new array instance if the value is found but the index is different', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.replace('2', 4);
        expect(result).to.eql(['1', '2', '3', '4', '2']).and.not.to.eq(stringArray);
      });

    });

    describe('with numbers', () => {

      it('returns the same array instance if the value is found', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.replace(3);
        expect(result).to.eql([1, 2, 3, 4, 5]).and.to.eq(numberArray);
      });

      it('returns the same array instance if the value is not found', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.replace(6);
        expect(result).to.eql([1, 2, 3, 4, 5]).and.to.eq(numberArray);
      });

      it('returns a new array instance if the value is found but the index is different', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.replace(2, 4);
        expect(result).to.eql([1, 2, 3, 4, 2]).and.not.to.eq(numberArray);
      });

    });

  });

  describe('replaceMany', () => {

    it('can replace many items at a given index', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.replaceMany([4, 5, 6], 1);
      expect(result).to.eql([1, 4, 5, 6, 5]);
    });

    it('can replace items at a given index and will increase the length of the array if it overruns', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.replaceMany([4, 5, 6], 3);
      expect(result).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('can replace items without an index but will not increase the array length', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.replaceMany([4, 5, 6]);
      expect(result).to.eql([1, 2, 3, 4, 5]);
    });

    it('can replace items without an index and will ignore ones that don\'t exist and will return the original array if no changes are made', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.replaceMany([2, 3, 6]);
      expect(result).to.eql([1, 2, 3, 4, 5]);
    });

  });

  describe('update', () => {
    interface IArrayItem {
      id: string;
      name: string;
      additionalProperty: number;
    }
    let array: IArrayItem[];

    beforeEach(() => {
      array = [1, 2, 3, 4, 5].map((id): IArrayItem => ({ id: id.toString(), name: id.toString(), additionalProperty: id }));
    });

    afterEach(() => {
      array = undefined as unknown as IArrayItem[];
    });

    it('can update where a filter is matched', () => {
      expect(array[1].name).to.eq('2');
      const result = array.update(item => item.id === '2', ({ id }) => ({ id, name: 'boo' }));
      expect(result).not.to.eq(array);
      expect(result.map(item => item.name)).to.eql(['1', 'boo', '3', '4', '5']);
    });

    it('if it does not match an item, it returns the original array', () => {
      const result = array.update(item => item.id === '6', ({ id }) => ({ id, name: 'boo' }));
      expect(result).to.eq(array);
    });

  });

  describe('except', () => {

    describe('with objects with ids', () => {
      let array: { id: string; name: string; }[];

      beforeEach(() => {
        array = [1, 2, 3, 4, 5].map(id => ({ id: id.toString(), name: id.toString() }));
      });

      afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        array = undefined as any;
      });

      it('can except an existing item', () => {
        const result = array.except([{ id: '2' }]);
        expect(result.map(item => item.name)).to.eql(['1', '3', '4', '5']);
      });

      it('returns the same instance if the exceptions are not found', () => {
        const result = array.except([{ id: '6' }]);
        expect(result.map(item => item.id)).to.eql(['1', '2', '3', '4', '5']);
      });

    });

    describe('with strings', () => {

      it('can except an existing item', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.except(['3']);
        expect(result).to.eql(['1', '2', '4', '5']).and.not.to.eq(stringArray);
      });

      it('returns the same instance if the exceptions are not found', () => {
        const stringArray = ['1', '2', '3', '4', '5'];
        const result = stringArray.except(['6']);
        expect(result).to.eql(['1', '2', '3', '4', '5']).and.to.eq(stringArray);
      });

    });

    describe('with numbers', () => {

      it('can except an existing item', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.except([3]);
        expect(result).to.eql([1, 2, 4, 5]).and.not.to.eq(numberArray);
      });

      it('returns the same instance if the exceptions are not found', () => {
        const numberArray = [1, 2, 3, 4, 5];
        const result = numberArray.except([6]);
        expect(result).to.eql([1, 2, 3, 4, 5]).and.to.eq(numberArray);
      });

    });

  });

  describe('distinct', () => {
    let array: { id: string; name: string; }[];

    beforeEach(() => {
      array = [1, 2, 4, 3, 4, 8, 2, 7, 1, 5].map(id => ({ id: id.toString(), name: id.toString() }));
    });

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      array = undefined as any;
    });

    it('can distinct an array', () => {
      const numberArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 3, 2, 7];
      const result = numberArray.distinct();
      expect(result).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('returns the same instance of the array if no changes are made', () => {
      const numberArray = [1, 2, 3, 4, 5];
      const result = numberArray.distinct();
      expect(result).to.eql([1, 2, 3, 4, 5]).and.eq(numberArray);
    });

    it('can distinct an array with a delegate', () => {
      const result = array.distinct(item => item.id);
      expect(result.map(item => item.id)).to.eql(['1', '2', '4', '3', '8', '7', '5']);
    });

  });

  describe('mergeWith', () => {

    it('can merge two simple arrays', () => {
      const a = [1, 2, 3, 4];
      const b = [5, 6, 7];

      const c = a.mergeWith(b);

      expect(c).to.eql([1, 2, 3, 4, 5, 6, 7]);
    });

    it('can merge two overlapping arrays', () => {
      const a = [1, 2, 3, 4, 7];
      const b = [5, 6, 7, 4, 2];

      const c = a.mergeWith(b);

      expect(c).to.eql([1, 2, 3, 4, 7, 5, 6]);
    });

    it('returns original array if nothing is changed', () => {
      const a = [1, 2, 3, 4, 7];
      const b = [3, 2, 1, 4];

      const c = a.mergeWith(b);

      expect(c).to.eq(a);
    });

    it('returns new array if order is changed', () => {
      const a = [1, 2, 3, 4];
      const b = [3, 2, 1, 4];

      const c = a.mergeWith(b, { matchOrder: true });

      expect(c).to.eql(b);
      expect(c).not.to.eq(b);
    });

    it('removes items if required', () => {
      const a = [1, 2, 7, 3, 4];
      const b = [3, 2, 1, 4];

      const c = a.mergeWith(b, { removeUnmatched: true });

      expect(c).to.eql([1, 2, 3, 4]);
    });

    it('matches the target order', () => {
      const a = [1, 2, 7, 3, 4];
      const b = [3, 2, 1, 4];

      const c = a.mergeWith(b, { matchOrder: true });

      expect(c).to.eql([3, 2, 1, 4, 7]);
    });

    it('removes any unmatched items', () => {
      const a: number[] = [1, 2, 7, 3, 4];
      const b: number[] = [];

      const c = a.mergeWith(b, { removeUnmatched: true });

      expect(c).to.eql([]);
    });

    it('matches the target order with no target items', () => {
      const a: number[] = [1, 2, 7, 3, 4];
      const b: number[] = [];

      const c = a.mergeWith(b, { matchOrder: true });

      expect(c).to.eql([1, 2, 7, 3, 4]);
    });

    it('matches the target order with no source items', () => {
      const a: number[] = [];
      const b: number[] = [1, 2, 7, 3, 4];

      const c = a.mergeWith(b, { matchOrder: true, removeUnmatched: true });

      expect(c).to.eql([1, 2, 7, 3, 4]);
    });

    it('matches the target order with fewer source items and removes any unmatched items', () => {
      const a = [7, 9, 2];
      const b = [1, 2, 7, 3, 4];

      const c = a.mergeWith(b, { matchOrder: true, removeUnmatched: true });

      expect(c).to.eql([1, 2, 7, 3, 4]);
    });

    it('matches the target where all target items are filtered', () => {
      const a = [{ doCopy: false }];
      const b: typeof a = [];

      const c = b.mergeWith(a, { addNew: item => item.doCopy === true });
      expect(c).to.eq(b);
      expect(c).to.eql([]);
    });

    it('matches the target where some target items are filtered', () => {
      const a = [{ id: 1, doCopy: true }, { id: 2, doCopy: false }, { id: 3, doCopy: true }];
      const b: typeof a = [];

      const c = b.mergeWith(a, { addNew: item => item.doCopy === true });
      expect(c).to.eql([{ id: 1, doCopy: true }, { id: 3, doCopy: true }]);
    });

    it('matches the target where some target items are filtered and matched items are the target', () => {
      const a = [{ id: 1, doCopy: true }, { id: 2, doCopy: false }, { id: 3, doCopy: true }];
      const b = [{ id: 3 }, { id: 1 }];

      const c = b.mergeWith(a, { addNew: item => item.doCopy === true, matchOrder: true, updateMatched: (_ia, ib) => ib });
      expect(c).to.eql([{ id: 1, doCopy: true }, { id: 3, doCopy: true }]);
    });

    it('matches the target where some target items are filtered and matched items are the source', () => {
      const a = [{ id: 1, doCopy: true }, { id: 2, doCopy: false }, { id: 3, doCopy: true }];
      const b = [{ id: 3 }, { id: 1 }];

      const c = b.mergeWith(a, { addNew: item => item.doCopy === true, matchOrder: true, updateMatched: ia => ia });
      expect(c).to.eql([{ id: 1 }, { id: 3 }]);
    });

  });

  describe('syncWith', () => {

    it('can synchronise two different arrays', () => {
      const a = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const b = [3, 7, 1];

      const c = a.syncWith(b, {
        matchBy: (aa, bb) => aa.id === bb,
        createBy: bb => ({ id: bb }),
      });

      expect(c).to.eql([{ id: 3 }, { id: 7 }, { id: 1 }]);
    });

    it('returns the original array if no changes are made', () => {
      const a = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const b = [1, 2, 3];

      const c = a.syncWith(b, {
        matchBy: (aa, bb) => aa.id === bb,
        createBy: bb => ({ id: bb }),
      });

      expect(c).to.eql([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(c).to.eq(a);
    });

    it('correctly returns a converted array if no source array', () => {
      const b = [1, 2, 3];
      const a: AnyObject[] = [];

      const c = a.syncWith(b, {
        matchBy: (aa, bb) => 'id' in aa && aa.id === bb,
        createBy: bb => ({ id: bb }),
      });

      expect(c).to.eql([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('correctly returns a complex synchronisation of an array', () => {
      const itemA = { id: 'A' };
      const itemB = { id: 'B' };
      const item1 = { id: 1, data: itemA };
      const item2 = { id: 2, data: itemB };
      const a = [item1, item2];
      const b = [itemB, itemA];

      const c = a.syncWith(b, {
        matchBy: (aa, bb) => aa.data === bb,
      });

      expect(c).to.eql([item2, item1]);
    });

    it('correctly updates a matched complex item', () => {
      const itemA = { id: 'A', value: 1 };
      const itemB = { id: 'B', value: 2 };
      const itemC = { id: 'A', value: 3 };
      const item1 = { id: 1, data: itemA };
      const item2 = { id: 2, data: itemB };
      const item3 = { ...item1, data: itemC };
      const a = [item1, item2];
      const b = [itemB, itemC];

      const c = a.syncWith(b, {
        matchBy: (aa, bb) => aa.data.id === bb.id,
        updateMatched: (aa, bb) => aa.data === bb ? aa : ({ ...aa, data: bb }),
      });

      expect(c).to.eql([item2, item3]);
      expect(c[0]).to.eq(item2);
      expect(c[1].data).to.eq(itemC);
    });

  });

  describe('take', () => {

    it('can take the first n number of items', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = array.take(5);
      expect(result).to.eql([1, 2, 3, 4, 5]);
    });

    it('does not take more than the number of items', () => {
      const array = [1, 2, 3, 4];
      const result = array.take(5);
      expect(result).to.eql([1, 2, 3, 4]);
      expect(result).to.eq(array);
    });

    it('returns the same array if the count is the same as the length', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.take(5);
      expect(result).to.eq(array);
    });

    it('returns a new empty array if the count is zero and the array length is greater than zero', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.take(0);
      expect(result).to.eql([]);
    });

  });

  describe('takeLast', () => {

    it('can take the last n number of items', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = array.takeLast(5);
      expect(result).to.eql([5, 6, 7, 8, 9]);
    });

    it('does not take more than the number of items', () => {
      const array = [1, 2, 3, 4];
      const result = array.takeLast(5);
      expect(result).to.eql([1, 2, 3, 4]);
      expect(result).to.eq(array);
    });

    it('returns the same array if the count is the same as the length', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.takeLast(5);
      expect(result).to.eq(array);
    });

    it('returns a new empty array if the count is zero and the array length is greater than zero', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.takeLast(0);
      expect(result).to.eql([]);
    });

  });

  describe('skip', () => {

    it('can skip the first n number of items', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = array.skip(5);
      expect(result).to.eql([6, 7, 8, 9]);
    });

    it('does not skip more than the number of items', () => {
      const array = [1, 2, 3, 4];
      const result = array.skip(5);
      expect(result).to.eql([]);
    });

    it('returns the same array if the count is zero', () => {
      const array = [1, 2, 3, 4, 5];
      const result = array.skip(0);
      expect(result).to.eq(array);
    });

    it('returns the same array if the length is zero and the count is not', () => {
      const array: string[] = [];
      const result = array.skip(10);
      expect(result).to.eq(array);
    });

  });

  describe('toMap', () => {

    it('can create a map of an array', () => {
      const array = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const result = array.toMap(id => id);
      expect(result).to.instanceOf(Map);
      expect(result.size).to.eq(9);
    });

    it('can create a map of a record array', () => {
      const array = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' }, { id: '9' }];
      const result = array.toMap();
      expect(result).to.instanceOf(Map);
      expect(result.size).to.eq(9);
    });

    it('errors when there is no way to identify the key', () => {
      const array = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      expect(() => {
        array.toMap();
      }).to.throw('Item at index 0 of this array is not a record and no createKey delegate was provided to generate the key.');
    });

  });

  describe('toSet', () => {

    it('can create a set of an array', () => {
      const array = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const result = array.toSet();
      expect(result).to.instanceOf(Set);
      expect(result.size).to.eq(9);
    });

  });

  describe('flatten', () => {

    it('can flatten a very deep array', () => {
      const a = [[[[[[[{ a: 1 }, { b: 2 }]]]]]]];
      const b = a.flatten();
      expect(b).to.eql([{ a: 1 }, { b: 2 }]);
    });

    it('can flatten a very shallow array', () => {
      const a = [{ a: 1 }, { b: 2 }];
      const b = a.flatten();
      expect(b).to.eql([{ a: 1 }, { b: 2 }]);
    });

    it('can flatten a mixed array', () => {
      const a = [{ a: 1 }, { b: 2 }, [{ c: 3 }, [[{ d: 4 }]]]];
      const b = a.flatten();
      expect(b).to.eql([{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }]);
    });

  });

  describe('groupBy', () => {

    it('can group objects together', () => {
      const values = [{ key: 'a', value: 1 }, { key: 'b', value: 2 }, { key: 'a', value: 3 }, { key: 'b', value: 4 }, { key: 'a', value: 5 }, { key: 'c', value: 6 }];
      const result = values.groupBy(({ key }) => key);
      expect(result).to.be.instanceOf(Map);
      expect(result.size).to.eql(3);
      const resultAsArray = result.toArray();
      expect(resultAsArray).to.eql([
        ['a', [{ key: 'a', value: 1 }, { key: 'a', value: 3 }, { key: 'a', value: 5 }]],
        ['b', [{ key: 'b', value: 2 }, { key: 'b', value: 4 }]],
        ['c', [{ key: 'c', value: 6 }]],
      ]);
    });

  });

});
