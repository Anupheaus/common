/* eslint-disable max-classes-per-file */
import './reflect';

describe('reflect', () => {

  describe('invoke', () => {

    it('can invoke a simple function on a simple object', () => {
      const obj = { test() { return 'hey'; } };
      const result = Reflect.invoke(obj, 'test');
      expect(result).to.eq('hey');
    });

    it('can invoke a simple function on a complex object', () => {
      const obj = { something: { blah: { test() { return 'hey'; } } } };
      const result = Reflect.invoke(obj, 'something.blah.test');
      expect(result).to.eq('hey');
    });

    it('can invoke a complex function on a complex object', () => {
      const obj = { something: { blah: { test() { return this.value; }, value: 10 } } };
      const result = Reflect.invoke(obj, 'something.blah.test');
      expect(result).to.eq(10);
    });

    it('can invoke a complex function on a complex object including a class', () => {
      class Test {
        constructor() { this.value = 10; }
        public value: number;
        public test() { return this.value; }
      }
      const blah = new Test();
      const obj = { something: { blah } };
      const result = Reflect.invoke(obj, 'something.blah.test');
      expect(result).to.eq(10);
    });

    it('can invoke a function with parameters', () => {
      const obj = { something: { blah: { test(val1: number, val2: number, val3: number) { return val1 + val2 + val3; } } } };
      const result = Reflect.invoke(obj, 'something.blah.test', 200, 50, 150);
      expect(result).to.eq(400);
    });

  });

  describe('getAllPrototypesOf', () => {

    it('can get the prototypes of a single class', () => {
      class TestClass {
        public simpleTest(): void { return; }
      }

      const prototypes = Reflect.getAllPrototypesOf(TestClass);
      expect(prototypes).to.be.an('array').with.lengthOf(1);
      expect(prototypes.map(item => Reflect.ownKeys(item))).to.eql([['constructor', 'simpleTest']]);
    });

    it('can get the prototypes of a derived class', () => {
      class SubTestClass {
        public subSimpleTest(): void { return; }
      }
      class TestClass extends SubTestClass {
        public simpleTest(): void { return; }
      }

      const prototypes = Reflect.getAllPrototypesOf(TestClass);
      expect(prototypes).to.be.an('array').with.lengthOf(2);
      expect(prototypes.map(item => Reflect.ownKeys(item))).to.eql([['constructor', 'simpleTest'], ['constructor', 'subSimpleTest']]);
    });

    it('can get the prototypes of an instance of a single class', () => {
      class TestClass {
        public simpleTest(): void { return; }
      }

      const prototypes = Reflect.getAllPrototypesOf(new TestClass());
      expect(prototypes).to.be.an('array').with.lengthOf(1);
      expect(prototypes.map(item => Reflect.ownKeys(item))).to.eql([['constructor', 'simpleTest']]);
    });

    it('can get the prototypes of an instance of a derived class', () => {
      class SubTestClass {
        public subSimpleTest(): void { return; }
      }
      class TestClass extends SubTestClass {
        public simpleTest(): void { return; }
      }

      const prototypes = Reflect.getAllPrototypesOf(new TestClass());
      expect(prototypes).to.be.an('array').with.lengthOf(2);
      expect(prototypes.map(item => Reflect.ownKeys(item))).to.eql([['constructor', 'simpleTest'], ['constructor', 'subSimpleTest']]);
    });

    it('can get the prototype of a plain object', () => {
      const plainObject = {
        simpleTest: () => void 0,
      };

      const prototypes = Reflect.getAllPrototypesOf(plainObject);
      expect(prototypes).to.be.an('array').with.lengthOf(1);
      expect(prototypes.map(item => Reflect.ownKeys(item))).to.eql([['simpleTest']]);
    });

    it('returns empty when not provided with class or instance of a class', () => {
      const getKeysFrom = (value: unknown) => Reflect.getAllPrototypesOf(value).map(item => Reflect.ownKeys(item));
      expect(getKeysFrom(1)).to.eql([]);
      expect(getKeysFrom(true)).to.eql([]);
      expect(getKeysFrom('')).to.eql([]);
      expect(getKeysFrom(() => ({ test: 'here' }))).to.eql([]);
      expect(getKeysFrom(null)).to.eql([]);
      expect(getKeysFrom(undefined)).to.eql([]);
      expect(getKeysFrom(NaN)).to.eql([]);
    });

  });

  describe('getAllDefinitions', () => {

    it('can get the definitions of a single class', () => {
      class TestClass {
        public TestMethod(): void { return; }
      }

      const definitions = Reflect.getAllDefinitions(TestClass);
      expect(Object.keys(definitions)).to.eql(['TestMethod']);
    });

    it('can get the definitions of a derived class', () => {
      class SubTestClass {
        public SubTestMethod(): void { return; }
      }
      class TestClass extends SubTestClass {
        public TestMethod(): void { return; }
      }

      const definitions = Reflect.getAllDefinitions(TestClass);
      expect(Object.keys(definitions)).to.eql(['TestMethod', 'SubTestMethod']);
    });

    it('can get the definitions of an instance of a single class', () => {
      class TestClass {
        public TestMethod(): void { return; }
      }

      const definitions = Reflect.getAllDefinitions(new TestClass());
      expect(Object.keys(definitions)).to.eql(['TestMethod']);
    });

    it('can get the definitions of an instance of a derived class', () => {
      class SubTestClass {
        public SubTestMethod(): void { return; }
      }
      class TestClass extends SubTestClass {
        public TestMethod(): void { return; }
      }

      const definitions = Reflect.getAllDefinitions(new TestClass());
      expect(Object.keys(definitions)).to.eql(['TestMethod', 'SubTestMethod']);
    });

  });

  describe('bindAllMethodsOn', () => {

    it('can bind all methods on an instance', () => {
      class Test {
        constructor() { this.value = 'hey'; }
        public value: string;
        public myMethod(): string { return this.value; }
      }
      const test = new Test();
      Reflect.bindAllMethodsOn(test);
      const { myMethod } = test;
      expect(myMethod()).to.eql('hey');
    });

    it('can bind multiple times on the same instance without causing an issue', () => {
      class Test {
        constructor() { this.value = 'hey'; }
        public value: string;
        public myMethod(): string { return this.value; }
      }
      const test = new Test();
      Reflect.bindAllMethodsOn(test);
      Reflect.bindAllMethodsOn(test);
      Reflect.bindAllMethodsOn(test);
      const { myMethod } = test;
      expect(myMethod()).to.eql('hey');
    });

    it('can bind all methods on a type', () => {
      class Test {
        constructor() { this.value = 'hey'; }
        public value: string;
        public myMethod(): string { return this.value; }
      }
      Reflect.bindAllMethodsOn(Test);
      const test = new Test();
      const { myMethod } = test;
      expect(myMethod()).to.eql('hey');
      Reflect.bindAllMethodsOn(test);
      const { myMethod: myMethod2 } = test;
      expect(myMethod2()).to.eql('hey');
    });

  });

  describe('className', () => {

    it('can get the className from an instance', () => {
      class TestClass { }
      const test = new TestClass();
      expect(Reflect.className(test)).to.eq('TestClass');
    });

    it('can get the className from a class', () => {
      class TestClass { }
      expect(Reflect.className(TestClass)).to.eq('TestClass');
    });

    it('throws an error when a non-instance or class is provided', () => {
      [2, {}, () => void 0, null, undefined, NaN, true].forEach(value => {
        expect(() => Reflect.className(value)).to.throw();
      });
    });

  });

  describe('walk', () => {

    it('can walk a simple object and get the names and paths of the fields', () => {
      const target = {
        something: 'simple',
        aNumberField: 1,
        aBooleanField: true,
        anObject: {
          myInnerObject: 'blah',
        },
        anArray: [{
          myInnerArrayObject: 'blah',
        }, 2, {
          blah: true,
        }],
      };
      const propertyNames: string[] = [];
      const paths: (string | number)[][] = [];
      const values: unknown[] = [];
      Reflect.walk(target, ({ name, path, get }) => {
        propertyNames.push(name);
        paths.push(path);
        values.push(get());
      });
      expect(propertyNames).to.eql(['something', 'aNumberField', 'aBooleanField', 'anObject', 'myInnerObject', 'anArray', 'myInnerArrayObject', 'blah']);
      expect(paths).to.eql([
        ['something'],
        ['aNumberField'],
        ['aBooleanField'],
        ['anObject'],
        ['anObject', 'myInnerObject'],
        ['anArray'],
        ['anArray', 0, 'myInnerArrayObject'],
        ['anArray', 2, 'blah'],
      ]);
      expect(values).to.eql([
        'simple',
        1,
        true,
        { myInnerObject: 'blah' },
        'blah',
        [{ myInnerArrayObject: 'blah' }, 2, { blah: true }],
        'blah',
        true,
      ]);
    });

    it('can be used to set values', () => {
      const target = {
        something: 'simple',
        aNumberField: 1,
        aBooleanField: true,
        anObject: {
          myInnerObject: 'blah',
        },
        anArray: [{
          myInnerArrayObject: 'blah',
        }, 2, {
          blah: true,
        }],
      };
      Reflect.walk(target, ({ name, set }) => {
        if (['anObject', 'anArray'].includes(name)) return;
        set(10);
      });
      expect(target).to.eql({
        something: 10,
        aNumberField: 10,
        aBooleanField: 10,
        anObject: {
          myInnerObject: 10,
        },
        anArray: [{
          myInnerArrayObject: 10,
        }, 2, {
          blah: 10,
        }],
      });
    });

    it('does not walk through symbols', () => {
      const DATA = Symbol('data');
      const target = {
        [DATA]: {
          myData: 2,
        },
      };
      const propertyNames: string[] = [];
      Reflect.walk(target, ({ name }) => {
        propertyNames.push(name);
      });
      expect(propertyNames).to.eql([]);
    });

    it('can walk through a definition of a class', () => {
      class Test {
        public get something() { return 'hey'; }
      }
      const propertyNames: string[] = [];
      Reflect.walk(Test, ({ name }) => {
        propertyNames.push(name);
      });
      expect(propertyNames).to.eql(['something']);
    });

    it('can walk through an instance of a class', () => {
      class Test {
        public get something() { return 'hey'; }
      }
      const propertyNames: string[] = [];
      Reflect.walk(new Test(), ({ name }) => {
        propertyNames.push(name);
      });
      expect(propertyNames).to.eql(['something']);
    });

  });

  describe('getByPath', () => {

    it('can successfully get a value by path', () => {
      const target = {
        here: {
          is: {
            my: {
              really: {
                long: {
                  pathName: 'blah',
                },
              },
            },
          },
        },
      };
      const { wasFound, value } = Reflect.getByPath(target, 'here.is.my.really.long.pathName');
      expect(wasFound).to.be.true;
      expect(value).to.eql('blah');
    });

    it('returns wasFound false and undefined if not found', () => {
      const target = {
        here: {
          is: {
            my: {
              really: {
                long: {
                  pathName: 'blah',
                },
              },
            },
          },
        },
      };
      (() => {
        const { wasFound, value } = Reflect.getByPath(target, 'here.is.my.really.long.other.pathName');
        expect(wasFound).to.be.false;
        expect(value).to.be.undefined;
      })();
      (() => {
        const { wasFound, value } = Reflect.getByPath(target, 'here.is.my.really.long.other.pathName.that.just.keeps.going');
        expect(wasFound).to.be.false;
        expect(value).to.be.undefined;
      })();
    });

    it('can navigate through arrays', () => {
      const target = {
        here: {
          is: [{}, {}, {
            my: [{
              path: 'hey!',
            }],
          }],
        },
      };
      const { wasFound, value } = Reflect.getByPath(target, 'here.is[2].my[0].path');
      expect(wasFound).to.be.true;
      expect(value).to.eql('hey!');
    });

  });

  describe('setByPath', () => {

    it('can set a simple path', () => {
      const target = {
        here: {
          is: {
            something: 'hey!',
          },
        },
      };
      const result = Reflect.setByPath(target, 'here.is.something', 'there!');
      expect(target).to.eql({
        here: {
          is: {
            something: 'there!',
          },
        },
      });
      expect(result).to.be.true;
    });

    it('can set a path with an array', () => {
      const target = {
        here: [{}, {
          is: [2, '', {
            something: 'hey!',
          }],
        }],
      };
      const result = Reflect.setByPath(target, 'here[1].is[2].something', 'there!');
      expect(target).to.eql({
        here: [{}, {
          is: [2, '', {
            something: 'there!',
          }],
        }],
      });
      expect(result).to.be.true;
    });

    it('can create a path when it doesn\'t exist', () => {
      const target = {
        here: [{}, {
          is: undefined,
        }],
      };
      const result = Reflect.setByPath(target, 'here[1].is[2].something', 'there!');
      expect(target).to.eql({
        here: [{}, {
          is: [undefined, undefined, {
            something: 'there!',
          }],
        }],
      });
      expect(result).to.be.true;
    });

    it('can create a path terminated in an array when it doesn\'t exist', () => {
      const target = {
        here: [{}, {
          is: undefined,
        }],
      };
      const result = Reflect.setByPath(target, 'here[1].is[2].something[1]', 'there!');
      expect(target).to.eql({
        here: [{}, {
          is: [undefined, undefined, {
            something: [undefined, 'there!'],
          }],
        }],
      });
      expect(result).to.be.true;
    });

    it('can set a value into an existing array', () => {
      const target = {
        here: [{}, {
          is: [undefined, undefined, undefined],
        }],
      };
      const result = Reflect.setByPath(target, 'here[1].is[2]', 'there!', false);
      expect(target).to.eql({
        here: [{}, {
          is: [undefined, undefined, 'there!'],
        }],
      });
      expect(result).to.be.true;
    });

    it('cannot set a value into an existing array that is not long enough to support the index when not creating the path', () => {
      const target = {
        here: [{}, {
          is: [],
        }],
      };
      const result = Reflect.setByPath(target, 'here[1].is[2]', 'there!', false);
      expect(target).to.eql({
        here: [{}, {
          is: [],
        }],
      });
      expect(result).to.be.false;
    });

    it('does not create a path when it isn\'t requested', () => {
      const target = {
        here: [{}, {
          is: undefined,
        }],
      };
      const result = Reflect.setByPath(target, 'here[1].is[2].something', 'there!', false);
      expect(target).to.eql({
        here: [{}, {
          is: undefined,
        }],
      });
      expect(result).to.be.false;
    });

  });

});
