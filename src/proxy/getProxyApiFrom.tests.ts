import { expect } from 'chai';
import { createProxyOf, getProxyApiFrom } from '.';

describe('getProxyApiFrom', () => {

  it('returns undefined for non-proxy', () => {
    expect(getProxyApiFrom({})).to.be.undefined;
    expect(getProxyApiFrom(123)).to.be.undefined;
  });

  it('returns ProxyApi for proxy from createProxyOf', () => {
    const obj = { foo: 'bar' };
    const { proxy } = createProxyOf(obj);
    const api = getProxyApiFrom(proxy);
    expect(api).not.to.be.undefined;
    expect(api!.value).to.deep.equal(obj);
    expect(api!.isSet).to.be.true;
  });
});
