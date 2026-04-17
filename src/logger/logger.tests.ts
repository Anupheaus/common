import { Logger, LogLevels } from './logger';
import type { LoggerEntry } from './logger-listener';

describe('logger', () => {

  it('can create a logger and log a message without throwing', () => {
    const logger = new Logger('test');
    logger.info('hey');
  });

  it('can create a sub-logger and log without throwing', () => {
    const logger = new Logger('Test');
    const subLogger = logger.createSubLogger('sub');
    subLogger.info('hey');
  });

  describe('log levels', () => {

    function captureEntry(fn: (logger: Logger) => void): LoggerEntry | undefined {
      const logger = new Logger('test', { minLevel: 0 });
      let entry: LoggerEntry | undefined;
      const unsub = logger.onLog(e => { entry = e; });
      fn(logger);
      unsub();
      return entry;
    }

    it('silly logs at LogLevels.silly', () => {
      const entry = captureEntry(l => l.silly('test silly'));
      expect(entry).not.to.be.undefined;
      expect(entry!.level).to.equal(LogLevels.silly);
      expect(entry!.message).to.equal('test silly');
    });

    it('trace logs at LogLevels.trace', () => {
      const entry = captureEntry(l => l.trace('test trace'));
      expect(entry!.level).to.equal(LogLevels.trace);
    });

    it('debug logs at LogLevels.debug', () => {
      const entry = captureEntry(l => l.debug('test debug'));
      expect(entry!.level).to.equal(LogLevels.debug);
    });

    it('info logs at LogLevels.info', () => {
      const entry = captureEntry(l => l.info('test info'));
      expect(entry!.level).to.equal(LogLevels.info);
      expect(entry!.message).to.equal('test info');
    });

    it('warn logs at LogLevels.warn', () => {
      const entry = captureEntry(l => l.warn('test warn'));
      expect(entry!.level).to.equal(LogLevels.warn);
    });

    it('error logs at LogLevels.error with a string message', () => {
      const entry = captureEntry(l => l.error('test error'));
      expect(entry!.level).to.equal(LogLevels.error);
      expect(entry!.message).to.equal('test error');
    });

    it('error logs at LogLevels.error with an Error object', () => {
      const entry = captureEntry(l => l.error(new Error('boom')));
      expect(entry!.level).to.equal(LogLevels.error);
      // parseError formats Error objects as "<name>: <message>"
      expect(entry!.message).to.equal('Error: boom');
    });

    it('fatal logs at LogLevels.fatal with a string message', () => {
      const entry = captureEntry(l => l.fatal('test fatal'));
      expect(entry!.level).to.equal(LogLevels.fatal);
    });

    it('always logs at LogLevels.always', () => {
      const entry = captureEntry(l => l.always('test always'));
      expect(entry!.level).to.equal(LogLevels.always);
    });

  });

  describe('onLog', () => {

    it('calls callback with the logged entry', () => {
      const logger = new Logger('test', { minLevel: 0 });
      const entries: LoggerEntry[] = [];
      const unsub = logger.onLog(e => entries.push(e));
      logger.info('hello');
      logger.warn('world');
      unsub();
      expect(entries).to.have.length(2);
      expect(entries[0].message).to.equal('hello');
      expect(entries[1].message).to.equal('world');
    });

    it('unsubscribe stops receiving entries', () => {
      const logger = new Logger('test', { minLevel: 0 });
      let count = 0;
      const unsub = logger.onLog(() => count++);
      logger.info('first');
      unsub();
      logger.info('second');
      expect(count).to.equal(1);
    });

    it('multiple callbacks all receive the same entry', () => {
      const logger = new Logger('test', { minLevel: 0 });
      let count1 = 0;
      let count2 = 0;
      const unsub1 = logger.onLog(() => count1++);
      const unsub2 = logger.onLog(() => count2++);
      logger.info('msg');
      unsub1();
      unsub2();
      expect(count1).to.equal(1);
      expect(count2).to.equal(1);
    });

    it('includes meta in the entry when provided', () => {
      const logger = new Logger('test', { minLevel: 0 });
      let entry: LoggerEntry | undefined;
      const unsub = logger.onLog(e => { entry = e; });
      logger.info('with meta', { key: 'value' });
      unsub();
      expect(entry!.meta).to.deep.include({ key: 'value' });
    });

  });

  describe('sub-logger', () => {

    it('sub-logger entries are received by its own onLog callback', () => {
      const parent = new Logger('parent', { minLevel: 0 });
      const child = parent.createSubLogger('child');
      let entry: LoggerEntry | undefined;
      const unsub = child.onLog(e => { entry = e; });
      child.info('from child');
      unsub();
      expect(entry).not.to.be.undefined;
      expect(entry!.message).to.equal('from child');
    });

  });

  describe('getLevelAsString', () => {

    it('returns "silly" for LogLevels.silly', () => {
      expect(Logger.getLevelAsString(LogLevels.silly)).to.equal('silly');
    });

    it('returns "info" for LogLevels.info', () => {
      expect(Logger.getLevelAsString(LogLevels.info)).to.equal('info');
    });

    it('returns "error" for LogLevels.error', () => {
      expect(Logger.getLevelAsString(LogLevels.error)).to.equal('error');
    });

    it('returns "always" for LogLevels.always', () => {
      expect(Logger.getLevelAsString(LogLevels.always)).to.equal('always');
    });

  });

});
