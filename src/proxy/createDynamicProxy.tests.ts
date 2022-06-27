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

});