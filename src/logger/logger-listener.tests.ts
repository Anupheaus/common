import { DateTime } from 'luxon';
import { LoggerListener } from './logger-listener';
import type { LoggerEntry } from './logger-listener';

function makeEntry(message = 'test', level = 3): LoggerEntry {
  return { timestamp: DateTime.now(), level, names: ['test'], message };
}

describe('logger > LoggerListener', () => {

  describe('maxEntries threshold', () => {

    it('does not trigger onTrigger before maxEntries is reached', () => {
      let triggered = false;
      const listener = new LoggerListener({ maxEntries: 3, onTrigger: () => { triggered = true; } });
      listener.addEntry(makeEntry('a'));
      listener.addEntry(makeEntry('b'));
      expect(triggered).to.be.false;
    });

    it('triggers onTrigger exactly when maxEntries is reached', () => {
      const received: LoggerEntry[][] = [];
      const listener = new LoggerListener({ maxEntries: 2, onTrigger: entries => received.push(entries) });
      listener.addEntry(makeEntry('a'));
      listener.addEntry(makeEntry('b'));
      expect(received).to.have.length(1);
      expect(received[0]).to.have.length(2);
    });

    it('sends all accumulated entries in a single batch when threshold is hit', () => {
      const received: LoggerEntry[][] = [];
      const listener = new LoggerListener({ maxEntries: 3, onTrigger: entries => received.push(entries) });
      listener.addEntry(makeEntry('x'));
      listener.addEntry(makeEntry('y'));
      listener.addEntry(makeEntry('z'));
      expect(received[0].map(e => e.message)).to.deep.equal(['x', 'y', 'z']);
    });

    it('clears the internal buffer after sending so subsequent entries start fresh', () => {
      const received: LoggerEntry[][] = [];
      const listener = new LoggerListener({ maxEntries: 2, onTrigger: entries => received.push(entries) });
      listener.addEntry(makeEntry('1'));
      listener.addEntry(makeEntry('2'));
      listener.addEntry(makeEntry('3'));
      listener.addEntry(makeEntry('4'));
      expect(received).to.have.length(2);
      expect(received[1].map(e => e.message)).to.deep.equal(['3', '4']);
    });

    it('does not call onTrigger when there are no entries at threshold check', () => {
      let count = 0;
      const listener = new LoggerListener({ maxEntries: 0, onTrigger: () => count++ });
      listener.addEntry(makeEntry());
      expect(count).to.equal(0);
    });

  });

  describe('preserves entry data', () => {

    it('forwards the exact entry objects passed to addEntry', () => {
      const received: LoggerEntry[] = [];
      const listener = new LoggerListener({ maxEntries: 1, onTrigger: entries => received.push(...entries) });
      const entry = makeEntry('precise message', 5);
      listener.addEntry(entry);
      expect(received[0]).to.equal(entry);
    });

    it('preserves level and names in forwarded entries', () => {
      const received: LoggerEntry[] = [];
      const listener = new LoggerListener({ maxEntries: 1, onTrigger: entries => received.push(...entries) });
      const entry: LoggerEntry = { timestamp: DateTime.now(), level: 6, names: ['svc', 'sub'], message: 'hello', meta: { code: 42 } };
      listener.addEntry(entry);
      expect(received[0].level).to.equal(6);
      expect(received[0].names).to.deep.equal(['svc', 'sub']);
      expect(received[0].meta).to.deep.equal({ code: 42 });
    });

  });

});
