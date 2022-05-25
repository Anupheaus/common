import { DynamicProxy } from '.';
import { AnyObject } from '../extensions';

describe('DynamicProxy', () => {

  function createProxy() {
    const obj = {
      a: 1,
      b: 'd',
      c: true,
      d: [1, 2, 3],
      e: { f: () => void 0, g: null as null | string | string[], i: undefined as unknown as string[], j: undefined as unknown as { k: string; } },
    };
    const proxy = DynamicProxy.create(obj);
    return { obj, proxy };
  }

  describe('create', () => {

    it('can create a proxy of an object', () => {
      const { proxy } = createProxy();
      expect(proxy.a).not.to.be.undefined;
      expect(proxy.e.f).not.to.be.undefined;
      expect(proxy.e.g).not.to.be.undefined;
      expect(DynamicProxy.with(proxy.a).get()).to.eq(1);
      expect(DynamicProxy.with(proxy.b).get()).to.eq('d');
      expect(DynamicProxy.with(proxy.c).get()).to.eq(true);
      expect(DynamicProxy.with(proxy.d).get()).to.eql([1, 2, 3]);
      expect(DynamicProxy.with(proxy.e).get()).to.be.an('object');
      expect(DynamicProxy.with(proxy.e.f).get()).to.be.a('function');
      expect(DynamicProxy.with(proxy.e.g).get()).to.be.eq(null);
    });

  });

  describe('with', () => {

    it('creates only one api instance per property', () => {
      const { proxy } = createProxy();
      const api1 = DynamicProxy.with(proxy.a);
      const api2 = DynamicProxy.with(proxy.a);
      expect(api1).to.eq(api2);
    });

    describe('get', () => {

      it('can handle external changes to the object', () => {
        const { obj, proxy } = createProxy();
        expect(DynamicProxy.with(proxy.a).get()).to.eq(1);
        obj.a = 2;
        expect(DynamicProxy.with(proxy.a).get()).to.eq(2);
      });
    });

    describe('set', () => {

      it('can set a value to a property', () => {
        const { obj, proxy } = createProxy();
        expect(obj.a).to.eq(1);
        expect(DynamicProxy.with(proxy.a).set(2)).to.eq(2);
        expect(DynamicProxy.with(proxy.a).get()).to.eq(2);
        expect(obj.a).to.eq(2);
      });

      it('can set a value to a sub-property', () => {
        const { obj, proxy } = createProxy();
        expect(obj.e.g).to.eq(null);
        expect(DynamicProxy.with(proxy.e.g).set('blah')).to.eq('blah');
        expect(DynamicProxy.with(proxy.e.g).get()).to.eq('blah');
        expect(obj.e.g).to.eq('blah');
      });

      it('can set a value to a non-existant property', () => {
        const { obj, proxy } = createProxy();
        expect((obj.e as AnyObject).h).to.be.undefined;
        expect(DynamicProxy.with((proxy.e as AnyObject).h.z).set('blah')).to.eq('blah');
        expect(DynamicProxy.with((proxy.e as AnyObject).h.z).get()).to.eq('blah');
        expect((obj.e as AnyObject).h.z).to.eq('blah');
      });

      it('can set values inside an array', () => {
        const { obj, proxy } = createProxy();

        expect(obj.d).to.eql([1, 2, 3]);
        expect(DynamicProxy.with(proxy.d[1]).set(99)).to.eq(99);
        expect(DynamicProxy.with(proxy.d[1]).get()).to.eq(99);
        expect(obj.d).to.eql([1, 99, 3]);
        expect(DynamicProxy.with(proxy.d[3]).set(87)).to.eq(87);
        expect(DynamicProxy.with(proxy.d[3]).get()).to.eq(87);
        expect(obj.d).to.eql([1, 99, 3, 87]);
      });

      it('can set values to a non-existant array', () => {
        const { obj, proxy } = createProxy();
        expect(obj.e.i).to.be.undefined;
        expect(DynamicProxy.with(proxy.e.i[1]).set('yippee')).to.eq('yippee');
        expect(obj.e.i).to.eql([undefined, 'yippee']);
        expect(DynamicProxy.with(proxy.e.i[3]).set('blah')).to.eq('blah');
        expect(obj.e.i).to.eql([undefined, 'yippee', undefined, 'blah']);
      });

    });

    describe('onChanged', () => {

      it('can subscribe and unsubscribe to a property and is triggered when the value changes', () => {
        const { obj, proxy } = createProxy();
        const api = DynamicProxy.with(proxy.a);
        expect(api.get()).to.eq(1);
        expect(obj.a).to.eq(1);
        let triggerCount = 0;
        const unsubscribe = api.onChanged((newValue, oldValue) => {
          triggerCount++;
          expect(newValue).to.eq(2);
          expect(oldValue).to.eq(1);
        });
        expect(unsubscribe).to.be.a('function');
        expect(triggerCount).to.eq(0);
        api.set(2);
        expect(obj.a).to.eq(2);
        expect(triggerCount).to.eq(1);
        expect(api.get()).to.eq(2);
        unsubscribe();
        api.set(3);
        expect(triggerCount).to.eq(1);
        expect(api.get()).to.eq(3);
        expect(obj.a).to.eq(3);
      });

      it('can subscribe to a non-existent property and is triggered when a sub-property is set', () => {
        const { proxy } = createProxy();
        const api = DynamicProxy.with(proxy.e.j);
        expect(api.get()).to.be.undefined;
        let triggerCount = 0;
        const unsubscribe = api.onChanged((newValue, oldValue) => {
          triggerCount++;
          expect(newValue).to.eql({});
          expect(oldValue).to.be.undefined;
        });
        expect(triggerCount).to.eq(0);
        DynamicProxy.with(proxy.e.j.k).set('yippee');
        expect(triggerCount).to.eq(1);
        unsubscribe();
      });

      it('can setting a property to the same value does not trigger the subscription', () => {
        const { obj, proxy } = createProxy();
        const api = DynamicProxy.with(proxy.a);
        expect(api.get()).to.eq(1);
        expect(obj.a).to.eq(1);
        let triggerCount = 0;
        const unsubscribe = api.onChanged(() => {
          triggerCount++;
        });
        expect(triggerCount).to.eq(0);
        api.set(1);
        expect(obj.a).to.eq(1);
        expect(triggerCount).to.eq(0);
        unsubscribe();
      });

    });

    describe('onSubPropertyChanged', () => {

      it('fires on any lower level change', () => {
        const { proxy } = createProxy();
        let triggerCount = 0;
        let unsubscribe = DynamicProxy.with(proxy).onSubPropertyChanged(() => {
          triggerCount++;
        });
        expect(triggerCount).to.eq(0);
        DynamicProxy.with(proxy.e.j.k).set('hey');
        expect(triggerCount).to.eq(1);
        unsubscribe();

        triggerCount = 0;
        unsubscribe = DynamicProxy.with(proxy.e).onSubPropertyChanged(() => {
          triggerCount++;
        });
        expect(triggerCount).to.eq(0);
        DynamicProxy.with(proxy.e.j.k).set('boo');
        expect(triggerCount).to.eq(1);
        unsubscribe();
      });

    });

  });


});
