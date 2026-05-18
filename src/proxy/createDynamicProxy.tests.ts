import { expect } from 'chai';
import { createDynamicProxy } from './createDynamicProxy';

describe('createDynamicProxyOf', () => {

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

  it('can create a dynamic proxy', () => {
    let setValue: unknown;
    const { proxy, get, set } = createDynamicProxy<TestObject>({
      onGet: event => {
        event.value = 'hey';
      },
      onSet: event => {
        setValue = event.newValue;
      },
    });

    expect(get(proxy.something)).to.equal('hey');
    expect(get(proxy.notSetAtAll)).to.equal('hey');
    set(proxy.notSetObject?.subArray?.[3]?.myProp, '56');
    expect(setValue).to.equal('56');
  });

  it('fires onAfterSet after a value is committed', () => {
    const afterValues: unknown[] = [];
    const { proxy, set } = createDynamicProxy<TestObject>({
      onAfterSet: event => {
        afterValues.push(event.newValue);
      },
    });

    set(proxy.something, 'first');
    set(proxy.something, 'second');
    expect(afterValues).to.deep.equal(['first', 'second']);
  });

  it('fires onDefault when set() traverses through an unset intermediate property', () => {
    let defaultFiredCount = 0;
    const { proxy, set, onDefault } = createDynamicProxy<TestObject>();
    onDefault(proxy, event => {
      defaultFiredCount++;
      event.value = {};  // supply a default object so traversal can continue
    }, { includeSubProperties: true });

    set(proxy.notSetObject?.subProperty, 'hello');
    expect(defaultFiredCount).to.be.at.least(1);
  });

  it('onSet event exposes oldValue and newValue', () => {
    let captured: { oldValue: unknown; newValue: unknown } | null = null;
    const { proxy, set } = createDynamicProxy<TestObject>({
      onSet: event => {
        captured = { oldValue: event.oldValue, newValue: event.newValue };
      },
    });

    set(proxy.something, 'first');
    set(proxy.something, 'second');
    expect(captured).to.deep.equal({ oldValue: 'first', newValue: 'second' });
  });

  it('prevents the default set when preventDefault() is called in onSet', () => {
    const { proxy, get, set } = createDynamicProxy<TestObject>({
      onSet: event => {
        if (event.newValue === 'blocked') event.preventDefault();
      },
    });

    set(proxy.something, 'allowed');
    expect(get(proxy.something)).to.equal('allowed');
    set(proxy.something, 'blocked');
    expect(get(proxy.something)).to.equal('allowed');
  });

  it('multiple onGet subscribers all receive the event', () => {
    const received: string[] = [];
    const { proxy, get, onGet } = createDynamicProxy<TestObject>();

    onGet(proxy.something, () => { received.push('first'); }, { includeSubProperties: true });
    onGet(proxy.something, () => { received.push('second'); }, { includeSubProperties: true });

    get(proxy.something);
    expect(received).to.include('first');
    expect(received).to.include('second');
  });

  it('unsubscribing from onSet stops receiving events', () => {
    const received: unknown[] = [];
    const { proxy, set, onSet } = createDynamicProxy<TestObject>();

    const unsubscribe = onSet(proxy.something, event => {
      received.push(event.newValue);
    }, { includeSubProperties: true });

    set(proxy.something, 'before');
    unsubscribe();
    set(proxy.something, 'after');

    expect(received).to.deep.equal(['before']);
  });

});