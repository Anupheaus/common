import { Logger } from './logger';

const logger = new Logger('Test', { minLevel: 0 });

logger.silly('hey', { something: 'else' });
logger.trace('hey');
logger.debug('hey', { something: 'else' });
logger.info('hey');
logger.warn('hey', { something: 'else' });
logger.error('hey');
logger.error(new Error('This is my message'));
logger.fatal('hey', { something: 'else' });

const subLogger = logger.createSubLogger('Sub');

subLogger.silly('hey', { something: 'else' });
subLogger.trace('hey', { something: 'else' });
subLogger.debug('hey', { something: 'else' });
subLogger.info('hey', { something: 'else' });
subLogger.warn('hey', { something: 'else' });
subLogger.error('hey', { something: 'else' });
subLogger.fatal('hey', { something: 'else' });