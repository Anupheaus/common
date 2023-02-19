import { Logger } from './logger';

describe.only('logger', () => {

  it('can create a logger and record messages', async () => {
    const logger = new Logger('test');
    logger.info('hey');
  });

  it('can create a sub-logger and record messages', async () => {
    const logger = new Logger('test');
    const subLogger = logger.createSubLogger('sub');
    subLogger.info('hey');
  });

});
