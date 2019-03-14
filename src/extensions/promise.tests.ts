import './promise';

describe('delay', () => {

  it('can cause a delay', async () => {
    const timeStarted = Date.now();
    await Promise.delay(6);
    const timeTaken = Date.now() - timeStarted;
    expect(timeTaken).to.be.at.least(5);
  });

});
