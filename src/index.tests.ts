describe('index', () => {

  it('ensure all imports are done in the correct order', async () => {
    try {
      await import('./index');
    } catch (error) {
      expect.fail('The imports should not create an error but they currently do.');
    }
  });

});
