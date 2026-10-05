import { Logger, LogLevels } from './logger';
import type { LoggerEntry } from './logger-listener';
import type { LoggerListenerSettings } from './logger-listener';
import { createScopeBuffer } from './logger-flight-recorder';
import { DEFAULT_REDACTED_KEYS } from './logger-redaction';

/** A logger that stays quiet on the console below error, so only the listeners see the trail. */
const createLogger = (name = 'recorder-test') => new Logger(name, { minLevel: LogLevels.error, useColors: false });

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

describe('logger flight recorder', () => {
  const unsubscribes: (() => void)[] = [];

  /** Registers a listener that hands over every entry the moment it is delivered. */
  function listen(settings: Partial<LoggerListenerSettings> = {}): LoggerEntry[] {
    const received: LoggerEntry[] = [];
    unsubscribes.push(Logger.registerListener({ maxEntries: 1, minLevel: LogLevels.info, flushIntervalMs: 0, ...settings, onTrigger: batch => { received.push(...batch); } }));
    return received;
  }

  afterEach(() => {
    unsubscribes.splice(0).forEach(unsubscribe => unsubscribe());
    Logger.configureFlightRecorder({ bufferSize: 200, sharedBufferSize: 50, redactedKeys: [...DEFAULT_REDACTED_KEYS] });
  });

  const messages = (entries: LoggerEntry[]) => entries.map(({ message }) => message);

  describe('the buffer', () => {
    it('keeps only the last N entries, oldest first', () => {
      const buffer = createScopeBuffer('s', 3);
      ['a', 'b', 'c', 'd', 'e'].forEach(message => buffer.push({ timestamp: undefined as never, level: 2, names: [], message }));
      expect(buffer.entries().map(({ message }) => message)).to.deep.equal(['c', 'd', 'e']);
      expect(buffer.entries().map(({ seq }) => seq)).to.deep.equal([3, 4, 5]);
    });

    it('bounds a scope to its configured size when an error flushes it', () => {
      const received = listen();
      const logger = createLogger();
      Logger.runInScope(() => {
        ['d1', 'd2', 'd3', 'd4', 'd5'].forEach(message => logger.debug(message));
        logger.error('boom');
      }, { bufferSize: 3 });
      // The error itself is in the buffer too, so three slots hold the last two debug lines and the error.
      expect(messages(received)).to.deep.equal(['d4', 'd5', 'boom']);
    });
  });

  describe('flushing on error', () => {
    it('delivers info and above as they happen, and an error with its lower-level trail ahead of it, in order', () => {
      const received = listen();
      const logger = createLogger();
      Logger.runInScope(() => {
        logger.debug('first debug');
        logger.info('an info');
        logger.silly('a silly');
        expect(messages(received)).to.deep.equal(['an info']);
        logger.error('boom');
      });
      expect(messages(received)).to.deep.equal(['an info', 'first debug', 'a silly', 'boom']);
      expect(received.map(({ preceding }) => preceding)).to.deep.equal([undefined, true, true, undefined]);
    });

    it('tags the trail with the same scope id as the error', () => {
      const received = listen();
      const logger = createLogger();
      Logger.runInScope(() => { logger.debug('context'); logger.error('boom'); }, { id: 'req-1' });
      expect(received.map(({ scopeId }) => scopeId)).to.deep.equal(['req-1', 'req-1']);
    });

    it('ships only info and above when nothing errors', () => {
      const received = listen();
      const logger = createLogger();
      Logger.runInScope(() => { logger.debug('quiet'); logger.info('loud'); logger.warn('louder'); });
      expect(messages(received)).to.deep.equal(['loud', 'louder']);
    });

    it('does not resend what a previous flush delivered', () => {
      const received = listen();
      const logger = createLogger();
      Logger.runInScope(() => {
        logger.debug('before first');
        logger.error('first error');
        logger.debug('between');
        logger.error('second error');
      });
      expect(messages(received)).to.deep.equal(['before first', 'first error', 'between', 'second error']);
    });

    it('flushes at the listener\'s own flushLevel', () => {
      const received = listen({ flushLevel: LogLevels.warn });
      const logger = createLogger();
      Logger.runInScope(() => { logger.debug('context'); logger.warn('just a warning'); });
      expect(messages(received)).to.deep.equal(['context', 'just a warning']);
    });

    it('leaves a listener without a minLevel receiving every entry as before', () => {
      const received: LoggerEntry[] = [];
      unsubscribes.push(Logger.registerListener({ maxEntries: 1, onTrigger: batch => { received.push(...batch); } }));
      createLogger().silly('everything');
      expect(messages(received)).to.deep.equal(['everything']);
    });
  });

  describe('scopes', () => {
    it('never leaks one concurrent scope\'s lines into another\'s trail', async () => {
      const received = listen();
      const logger = createLogger();
      const run = (id: string, fails: boolean) => Logger.runInScope(async () => {
        logger.debug(`${id} step 1`);
        await wait(5);
        logger.debug(`${id} step 2`);
        await wait(5);
        if (fails) logger.error(`${id} failed`);
      }, { id });
      await Promise.all([run('tenant-a', true), run('tenant-b', false)]);
      expect(messages(received)).to.deep.equal(['tenant-a step 1', 'tenant-a step 2', 'tenant-a failed']);
    });

    it('reports the current scope id inside a scope and none outside', () => {
      expect(Logger.getCurrentScopeId()).to.be.undefined;
      Logger.runInScope(() => { expect(Logger.getCurrentScopeId()).to.equal('abc'); }, { id: 'abc' });
      Logger.runInScope(() => { expect(Logger.getCurrentScopeId()).to.be.a('string'); });
    });

    it('uses a small shared buffer outside any scope', () => {
      Logger.configureFlightRecorder({ sharedBufferSize: 2 });
      const received = listen();
      const logger = createLogger();
      logger.debug('one');
      logger.debug('two');
      logger.debug('three');
      logger.error('boom');
      expect(messages(received)).to.deep.equal(['three', 'boom']);
      expect(received[0]!.scopeId).to.be.undefined;
    });
  });

  describe('storm guard', () => {
    it('ships a second error inside the interval alone', () => {
      const received = listen({ flushIntervalMs: 60_000 });
      const logger = createLogger();
      Logger.runInScope(() => {
        logger.debug('context');
        logger.error('first');
        logger.debug('more context');
        logger.error('second');
      });
      expect(messages(received)).to.deep.equal(['context', 'first', 'second']);
    });

    it('flushes again once the interval has passed, with only what came since', async () => {
      const received = listen({ flushIntervalMs: 20 });
      const logger = createLogger();
      await Logger.runInScope(async () => {
        logger.debug('context');
        logger.error('first');
        logger.debug('ignored while guarded');
        logger.error('second');
        await wait(40);
        logger.debug('fresh context');
        logger.error('third');
      });
      expect(messages(received)).to.deep.equal(['context', 'first', 'second', 'ignored while guarded', 'fresh context', 'third']);
    });
  });

  describe('a minimum level decided per entry', () => {
    it('asks for the level for each entry, with its level, logger names and scope id', () => {
      const asked: unknown[] = [];
      listen({ minLevel: ({ level, names, scopeId }) => { asked.push({ level, names, scopeId }); return LogLevels.info; } });
      const logger = createLogger('per-entry');
      Logger.runInScope(() => logger.debug('hello'), { id: 'scope-a' });
      expect(asked).to.deep.equal([{ level: LogLevels.debug, names: ['per-entry'], scopeId: 'scope-a' }]);
    });

    it('delivers an entry only when it is at or above the level decided for it', () => {
      const received = listen({ minLevel: ({ names }) => (names.includes('chatty') ? LogLevels.debug : LogLevels.info) });
      createLogger('chatty').debug('kept');
      createLogger('quiet').debug('held back');
      expect(messages(received)).to.deep.equal(['kept']);
    });

    it('asks in the logging caller\'s async context, so a level can follow request state', async () => {
      const received = listen({ minLevel: () => (Logger.getCurrentScopeId() === 'raised' ? LogLevels.debug : LogLevels.info) });
      const logger = createLogger();
      await Promise.all([
        Logger.runInScope(async () => { await wait(1); logger.debug('raised scope'); }, { id: 'raised' }),
        Logger.runInScope(async () => { await wait(1); logger.debug('normal scope'); }, { id: 'normal' }),
      ]);
      expect(messages(received)).to.deep.equal(['raised scope']);
    });

    it('flushes the trail below the level decided for the error', () => {
      const received = listen({ minLevel: () => LogLevels.warn });
      const logger = createLogger();
      Logger.runInScope(() => { logger.info('context'); logger.error('boom'); });
      expect(messages(received)).to.deep.equal(['context', 'boom']);
      expect(received[0].preceding).to.be.true;
    });

    it('treats a level function that throws as every entry delivered, so a broken resolver never loses logs', () => {
      const received = listen({ minLevel: () => { throw new Error('resolver broke'); } });
      createLogger().debug('still delivered');
      expect(messages(received)).to.deep.equal(['still delivered']);
    });
  });

  describe('lazy messages', () => {
    it('does not build a message nothing delivers', () => {
      const received = listen();
      const logger = createLogger();
      let built = 0;
      Logger.runInScope(() => {
        logger.debug(() => { built++; return 'expensive'; }, () => { built++; return { big: 1 }; });
      });
      expect(built).to.equal(0);
      expect(received).to.have.length(0);
    });

    it('builds it once, when an error flushes it, however many listeners take it', () => {
      const first = listen();
      const second = listen();
      const logger = createLogger();
      let built = 0;
      Logger.runInScope(() => {
        logger.debug(() => { built++; return 'expensive'; }, () => ({ detail: 'x' }));
        logger.error('boom');
      });
      expect(built).to.equal(1);
      expect(messages(first)).to.deep.equal(['expensive', 'boom']);
      expect(first[0]!.meta).to.deep.equal({ detail: 'x' });
      expect(messages(second)).to.deep.equal(['expensive', 'boom']);
    });

    it('survives a lazy message that throws', () => {
      const received = listen();
      const logger = createLogger();
      Logger.runInScope(() => {
        logger.info(() => { throw new Error('nope'); });
      });
      expect(received[0]!.message).to.equal('[log message failed: nope]');
    });
  });

  describe('redaction', () => {
    it('redacts secrets before the entry is buffered, leaving the caller\'s object alone', () => {
      const received = listen();
      const logger = createLogger();
      const meta = { user: 'sam', password: 'hunter2', nested: { accessToken: 'abc', credentialId: 'keep-me' }, list: [{ authorization: 'Bearer x' }] };
      Logger.runInScope(() => {
        logger.debug('signing in', meta);
        logger.error('boom');
      });
      expect(received[0]!.meta).to.deep.equal({
        user: 'sam',
        password: '[redacted]',
        nested: { accessToken: '[redacted]', credentialId: 'keep-me' },
        list: [{ authorization: '[redacted]' }],
      });
      expect(meta.password).to.equal('hunter2');
    });

    it('redacts the meta an info line delivers at once, and lazy meta when it is built', () => {
      const received = listen();
      const logger = createLogger();
      logger.info('now', { cookie: 'c' });
      logger.info('lazy', () => ({ privateKey: 'k', prf: 'p', secret: 's' }));
      expect(received[0]!.meta).to.deep.equal({ cookie: '[redacted]' });
      expect(received[1]!.meta).to.deep.equal({ privateKey: '[redacted]', prf: '[redacted]', secret: '[redacted]' });
    });

    it('uses configured keys instead of the defaults', () => {
      Logger.configureFlightRecorder({ redactedKeys: ['pin'] });
      const received = listen();
      createLogger().info('x', { pin: '1234', password: 'visible now' });
      expect(received[0]!.meta).to.deep.equal({ pin: '[redacted]', password: 'visible now' });
    });

    it('survives a cyclic meta', () => {
      const received = listen();
      const meta: Record<string, unknown> = { name: 'loop' };
      meta['self'] = meta;
      createLogger().info('x', meta);
      expect(received[0]!.meta).to.deep.equal({ name: 'loop', self: '[circular]' });
    });
  });

  describe('without async context (the browser)', () => {
    const originalGetBuiltinModule = process.getBuiltinModule;
    beforeEach(() => { (process as { getBuiltinModule: unknown }).getBuiltinModule = undefined; });
    afterEach(() => { process.getBuiltinModule = originalGetBuiltinModule; });

    it('runs a scope as a plain call and keeps one buffer per root logger', () => {
      const received = listen();
      const rootA = createLogger('browser-a');
      const rootB = createLogger('browser-b');
      const subOfA = rootA.createSubLogger('child');
      const result = Logger.runInScope(() => {
        rootA.debug('a debug');
        rootB.debug('b debug');
        subOfA.debug('a child debug');
        rootA.error('a failed');
        return 'ran';
      });
      expect(result).to.equal('ran');
      expect(messages(received)).to.deep.equal(['a debug', 'a child debug', 'a failed']);
      expect(Logger.getCurrentScopeId()).to.be.undefined;
    });
  });
});
