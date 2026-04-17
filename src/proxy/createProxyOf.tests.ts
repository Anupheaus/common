import { expect } from 'chai';
import { createProxyOf } from '.';
import type { OnDefaultEvent, OnGetEvent, OnSetEvent } from '.';

describe('createProxyOf', () => {

  interface TestObject {
    something: string;
    setToUndefined?: boolean;
    notSetAtAll?: number;
    notSetObject?: {
      subProperty?: string;
      subArray?: {
        myProp: string;
      }[];
    };
  }

  function setupTest() {
    const original: TestObject = {
      something: 'hey',
      setToUndefined: undefined,
    };
    const result = createProxyOf(original);
    return {
      ...result,
      original,
    };
  }

  it('can create a proxy', () => {
    const { proxy } = setupTest();

    expect(proxy).not.to.be.undefined;
    expect(Reflect.has(proxy, 'something')).to.be.true;
    expect(Reflect.has(proxy, 'setToUndefined')).to.be.true;
    expect(Reflect.has(proxy, 'notSetAtAll')).to.be.false;
  });

  it('can get a value from a proxy', () => {
    const { proxy, get } = setupTest();

    expect(get(proxy.something)).to.equal('hey');
    expect(get(proxy.notSetObject?.subProperty)).to.be.undefined;
  });

  it('can set a value on a proxy', () => {
    const { original, proxy, set } = setupTest();

    expect(original.notSetAtAll).to.be.undefined;
    set(proxy.notSetAtAll, 13);
    expect(original.notSetAtAll).to.equal(13);
  });

  it('can set a deep value on a proxy', () => {
    const { original, proxy, set } = setupTest();

    expect(original.notSetObject?.subProperty).to.be.undefined;
    set(proxy.notSetObject?.subProperty, 'new value');
    expect(original.notSetObject?.subProperty).to.equal('new value');
  });

  it('raises onGet when a get is used', () => {
    const { proxy, get, onGet } = setupTest();

    let event: OnGetEvent<string> | undefined;
    let callCount = 0;
    onGet(proxy.something, e => { event = e; callCount++; });
    get(proxy.something);
    expect(event).to.eql({ path: ['something'], value: 'hey' });
    expect(callCount).to.equal(1);
  });

  it('raises onSet when a set is used', () => {
    const { proxy, set, onSet } = setupTest();

    let event: OnSetEvent<string> | undefined;
    let callCount = 0;
    onSet(proxy.something, e => { event = e; callCount++; });
    set(proxy.something, 'blah');
    expect(event).to.eql({ path: ['something'], newValue: 'blah', oldValue: 'hey', isDefaultPrevented: false, preventDefault: event?.preventDefault });
    expect(callCount).to.equal(1);
  });

  it('can set own onDefault value when deeply set', () => {
    const { original, proxy, set, onSet, onDefault } = setupTest();

    let defaultEvent: OnDefaultEvent | undefined;
    const setEvents = new Set<OnSetEvent>();
    let defaultCallCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDefault(proxy.notSetObject, e => { defaultEvent = { ...e }; defaultCallCount++; e.value = { blah: 1, subProperty: '' } as any; });
    onSet(proxy.notSetObject, e => {
      setEvents.add({ ...e, newValue: typeof (e.newValue) === 'object' ? { ...e.newValue } : e.newValue });
      return e.newValue;
    }, { includeSubProperties: true });
    set(proxy.notSetObject?.subProperty, 'blah');
    expect(defaultEvent).to.eql({ value: undefined, traversedPath: ['notSetObject'], remainingPath: [] });
    const setEventsAsArray = Array.from(setEvents.values());
    expect(defaultCallCount).to.equal(1);
    expect(setEventsAsArray.length).to.equal(2);
    expect(setEventsAsArray[0]).to.eql({
      newValue: { blah: 1, subProperty: '', }, oldValue: undefined, isDefaultPrevented: false, path: ['notSetObject'],
      preventDefault: setEventsAsArray[0].preventDefault
    });
    expect(setEventsAsArray[1]).to.eql({
      newValue: 'blah', oldValue: '', isDefaultPrevented: false, path: ['notSetObject', 'subProperty'],
      preventDefault: setEventsAsArray[1].preventDefault
    });
    expect(original).to.eql({ something: 'hey', setToUndefined: undefined, notSetObject: { blah: 1, subProperty: 'blah' } });
  });

  it('can set an array value correctly when being deeply set', () => {
    const { original, proxy, set } = setupTest();
    expect(original.notSetObject).to.be.undefined;
    set(proxy.notSetObject?.subArray?.[3]?.myProp, 'foo');
    expect(original.notSetObject?.subArray).to.be.an('array');
    expect(original.notSetObject?.subArray?.length).to.equal(4);
    expect(original.notSetObject?.subArray?.[3].myProp).to.equal('foo');
  });

  it('can set the root object', () => {
    const { original, proxy, set } = setupTest();
    set(proxy, { something: 'else' });
    expect(original).to.eql({ something: 'else', setToUndefined: undefined });
  });

  describe('isSet', () => {
    it('returns true for a property that was explicitly set in the original object', () => {
      const { proxy, isSet } = setupTest();
      expect(isSet(proxy.something)).to.be.true;
    });
    it('returns false for a property that was never set', () => {
      const { proxy, isSet } = setupTest();
      expect(isSet(proxy.notSetAtAll)).to.be.false;
    });
    it('returns true for a property explicitly set to undefined', () => {
      const { proxy, isSet } = setupTest();
      expect(isSet(proxy.setToUndefined)).to.be.true;
    });
  });

  describe('onSet with preventDefault', () => {
    it('prevents the value being applied when preventDefault is called', () => {
      const { original, proxy, set, onSet } = setupTest();
      onSet(proxy.something, (e: OnSetEvent<string>) => { e.preventDefault(); });
      set(proxy.something, 'changed');
      expect(original.something).to.equal('hey');
    });
    it('allows the value when preventDefault is not called', () => {
      const { original, proxy, set, onSet } = setupTest();
      onSet(proxy.something, () => { /* no preventDefault */ });
      set(proxy.something, 'changed');
      expect(original.something).to.equal('changed');
    });
    it('calls multiple onSet handlers for the same path', () => {
      const { proxy, set, onSet } = setupTest();
      let count = 0;
      onSet(proxy.something, () => { count++; });
      onSet(proxy.something, () => { count++; });
      set(proxy.something, 'new');
      expect(count).to.equal(2);
    });
  });

  describe('onGet (additional)', () => {
    it('is called on every get access', () => {
      const { proxy, get, onGet } = setupTest();
      let count = 0;
      onGet(proxy.something, () => { count++; });
      get(proxy.something);
      get(proxy.something);
      expect(count).to.equal(2);
    });
  });

  describe('onDefault (additional)', () => {
    it('is called exactly once per unset intermediate object when setting a deep path', () => {
      const { proxy, set, onDefault } = setupTest();
      let callCount = 0;
      onDefault(proxy.notSetObject, (e: OnDefaultEvent) => { callCount++; e.value = {} as any; });
      set(proxy.notSetObject?.subProperty, 'val');
      expect(callCount).to.equal(1);
    });
    it('is NOT called when the intermediate object is already set', () => {
      const { original, proxy, set, onDefault } = setupTest();
      (original as any).notSetObject = { subProperty: 'existing' };
      let callCount = 0;
      onDefault(proxy.notSetObject, (e: OnDefaultEvent) => { callCount++; e.value = {} as any; });
      set(proxy.notSetObject?.subProperty, 'val');
      expect(callCount).to.equal(0);
    });
  });

});
