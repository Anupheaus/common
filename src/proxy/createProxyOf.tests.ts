import { expect } from 'chai';
import { createProxyOf, OnDefaultEvent, OnGetEvent, OnSetEvent } from '.';

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

});
