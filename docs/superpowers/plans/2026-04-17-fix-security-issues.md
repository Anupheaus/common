# Fix Security Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security vulnerabilities identified in the QA review, in priority order.

**Architecture:** Each fix is isolated to a single file/function. No new abstractions are introduced. Tests are written first (TDD), then the fix, verified with `pnpm run test-ci`.

**Tech Stack:** TypeScript, Mocha 10 + Chai 4, `pnpm run test-ci`

---

## Files Modified

- `src/extensions/object.ts` — block dangerous prototype-pollution keys in `parseObject()`
- `src/extensions/is.ts` — fix GUID regex stateful `g` flag; replace `new Function()` in `browser()`/`node()`
- `src/extensions/stringExtensions.ts` — remove/sandbox `asTemplate()` code-injection risk
- `src/auditor/auditor.ts` — validate diff op paths against prototype-pollution keys
- `src/errors/BaseError.ts` — strip `stack` from `toJSON()` output
- `src/settings/createSettings.ts` — wrap `JSON.parse()` in try-catch
- `src/extensions/to/serialisation.ts` — wrap `JSON.parse()` in try-catch

### Test files (co-located, modified alongside source):
- `src/extensions/object.tests.ts`
- `src/extensions/is.tests.ts`
- `src/extensions/string.tests.ts`
- `src/auditor/auditor.tests.ts`
- `src/errors/BaseError.tests.ts`
- `src/settings/createSettings.tests.ts`
- `src/extensions/to/serialisation.tests.ts` (or `src/extensions/to.tests.ts`)

---

## Task 1: Block prototype-pollution keys in `parseObject()`

**Files:**
- Modify: `src/extensions/object.ts:93-113`
- Modify (tests): `src/extensions/object.tests.ts`

The `parseObject()` function (used by `Object.merge`) iterates `Reflect.ownKeys(newObject)` and calls `Object.defineProperty` without blocking `__proto__`, `constructor`, or `prototype` keys. This allows an attacker to pollute `Object.prototype` through any code path that calls `Object.merge()`.

- [ ] **Step 1: Locate the existing object tests**

Run:
```bash
grep -n "describe\|merge\|parseObject" src/extensions/object.tests.ts | head -40
```

This shows what describe blocks already exist so you can add your tests without duplication.

- [ ] **Step 2: Write failing tests for prototype-pollution protection**

Add to `src/extensions/object.tests.ts` inside a `describe('merge')` block (or create one if absent):

```typescript
describe('prototype pollution protection', () => {
  it('should ignore __proto__ key', () => {
    const target = { a: 1 };
    const source = JSON.parse('{"__proto__": {"polluted": true}}');
    Object.merge(target, source as any);
    expect((Object.prototype as any).polluted).to.be.undefined;
    expect((target as any).polluted).to.be.undefined;
  });

  it('should ignore constructor key', () => {
    const target = { a: 1 };
    const source = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}');
    Object.merge(target, source as any);
    expect((Object.prototype as any).polluted).to.be.undefined;
  });

  it('should ignore prototype key', () => {
    const target = { a: 1 };
    const source = { prototype: { polluted: true } } as any;
    Object.merge(target, source);
    expect((Object.prototype as any).polluted).to.be.undefined;
    expect(Object.getPrototypeOf(target)).to.equal(Object.prototype);
  });

  it('should still merge normal keys', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    const result = Object.merge(target, source);
    expect(result).to.eql({ a: 1, b: 2 });
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

Run: `pnpm run test-ci 2>&1 | grep -A3 "prototype pollution"`
Expected: The tests fail (merge currently allows `__proto__`).

- [ ] **Step 4: Add the dangerous-key blocklist to `parseObject()`**

In `src/extensions/object.ts`, modify `parseObject()` at line 95 to skip dangerous keys:

```typescript
const DANGEROUS_KEYS = new Set<string | symbol>(['__proto__', 'constructor', 'prototype']);

function parseObject<T extends object>(existingObject: T, newObject: T, checkForOverridableItems: boolean, replacer: (value: unknown) => unknown): T {
  if (newObject === undefined) return existingObject;
  Reflect.ownKeys(newObject).forEach(key => {
    if (DANGEROUS_KEYS.has(key as string)) return;
    let { get: existingGet, value: existingValue } = Object.getOwnPropertyDescriptor(existingObject, key) ?? {};
    existingValue = existingGet ? existingGet.call(existingObject) : (typeof (existingValue) !== 'function' ? existingValue : undefined);
    const { get: newGet, set: newSet, value: newValue, ...otherProps } = Object.getOwnPropertyDescriptor(newObject, key) ?? {};
    const get = newGet ? () => {
      return newGet.call(existingObject);
    } : undefined;
    const set = newSet ? (...args: any[]) => newSet.call(existingObject, args) : undefined;
    const value = newValue !== undefined ? (typeof (newValue) === 'function' ? (...args: any[]) => newValue.apply(existingObject, args) :
      parseValue(existingValue, newValue, checkForOverridableItems, replacer)) : undefined;
    Object.defineProperty(existingObject, key, {
      ...otherProps,
      ...(get ? { get } : {}),
      ...(set ? { set } : {}),
      ...(value !== undefined ? { value } : {}),
    });
  });
  return existingObject;
}
```

Place the `DANGEROUS_KEYS` constant at module level, above `parseObject`.

- [ ] **Step 5: Run tests to confirm they pass**

Run: `pnpm run test-ci`
Expected: All tests pass (including the new prototype pollution tests).

- [ ] **Step 6: Commit**

```bash
git add src/extensions/object.ts src/extensions/object.tests.ts
git commit -m "fix: block prototype pollution keys in Object.merge"
```

---

## Task 2: Fix GUID regex stateful `g` flag

**Files:**
- Modify: `src/extensions/is.ts:71`
- Modify (tests): `src/extensions/is.tests.ts`

`is.guid()` uses a regex with the `g` flag (global) and calls `.test()` on it. When a regex literal with `g` is defined on a method that is called multiple times, the regex is shared across calls and `lastIndex` advances, causing alternating pass/fail results.

- [ ] **Step 1: Write failing tests that demonstrate the flicker**

Add to `src/extensions/is.tests.ts` inside `describe('guid')` (create if absent):

```typescript
describe('guid', () => {
  it('should return true for a valid uppercase GUID', () => {
    expect(is.guid('6BA7B810-9DAD-11D1-80B4-00C04FD430C8')).to.be.true;
  });

  it('should return true on repeated calls with the same valid GUID', () => {
    const guid = '6BA7B810-9DAD-11D1-80B4-00C04FD430C8';
    expect(is.guid(guid)).to.be.true;
    expect(is.guid(guid)).to.be.true;
    expect(is.guid(guid)).to.be.true;
  });

  it('should return false for a non-GUID string on repeated calls', () => {
    expect(is.guid('not-a-guid')).to.be.false;
    expect(is.guid('not-a-guid')).to.be.false;
  });

  it('should return false for non-string values', () => {
    expect(is.guid(null)).to.be.false;
    expect(is.guid(123)).to.be.false;
    expect(is.guid(undefined)).to.be.false;
  });
});
```

- [ ] **Step 2: Run tests to confirm the repeated-call test fails**

Run: `pnpm run test-ci 2>&1 | grep -A5 "repeated calls"`
Expected: The "repeated calls" test fails (alternates true/false due to lastIndex).

- [ ] **Step 3: Remove the `g` flag from the GUID regex**

In `src/extensions/is.ts` at line 71, change:

```typescript
// Before:
return /^[{(]?[0-9A-F]{8}[-]?(?:[0-9A-F]{4}[-]?){3}[0-9A-F]{12}[)}]?$/gmi.test(value);

// After:
return /^[{(]?[0-9A-F]{8}[-]?(?:[0-9A-F]{4}[-]?){3}[0-9A-F]{12}[)}]?$/mi.test(value);
```

(Remove only the `g` flag; keep `m` and `i`.)

- [ ] **Step 4: Run tests to confirm they pass**

Run: `pnpm run test-ci`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/extensions/is.ts src/extensions/is.tests.ts
git commit -m "fix: remove stateful g flag from GUID regex"
```

---

## Task 3: Replace `new Function()` in `is.browser()` and `is.node()`

**Files:**
- Modify: `src/extensions/is.ts:185-191`
- Modify (tests): `src/extensions/is.tests.ts`

`is.browser()` and `is.node()` use `new Function(...)()` to check the global object. This is unnecessary and classified as a code-injection vector (CSP-violating in browsers). Both can be replaced with safe `typeof` checks.

- [ ] **Step 1: Write tests for browser() and node()**

Add to `src/extensions/is.tests.ts`:

```typescript
describe('browser', () => {
  it('should return false in a Node.js test environment', () => {
    expect(is.browser()).to.be.false;
  });
});

describe('node', () => {
  it('should return true in a Node.js test environment', () => {
    expect(is.node()).to.be.true;
  });
});
```

- [ ] **Step 2: Run tests to confirm they pass already (or fail due to CSP)**

Run: `pnpm run test-ci 2>&1 | grep -A3 "browser\|node"`
Expected: Tests pass with the current `new Function` approach (in Node there's no CSP, but it's still insecure code).

- [ ] **Step 3: Replace `new Function()` with `typeof` checks**

In `src/extensions/is.ts`, replace lines 185-191:

```typescript
// Before:
public browser(): boolean {
  return (new Function('try {return this===window;}catch(e){ return false;}'))();
}

public node(): boolean {
  return (new Function('try {return this===global;}catch(e){return false;}'))();
}

// After:
public browser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

public node(): boolean {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `pnpm run test-ci`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/extensions/is.ts src/extensions/is.tests.ts
git commit -m "fix: replace new Function() with safe typeof checks in is.browser/is.node"
```

---

## Task 4: Remove code-injection risk from `String.asTemplate()`

**Files:**
- Modify: `src/extensions/stringExtensions.ts:16-20`
- Modify (tests): `src/extensions/string.tests.ts`

`String.asTemplate()` uses `new Function(...keys, \`return \`${this}\`;\`)`. The template string `this` is directly embedded in the function body — if user-controlled, this is remote code execution. The fix is a safe `replace()`-based interpolation that does not evaluate code.

- [ ] **Step 1: Write tests**

Add to `src/extensions/string.tests.ts` inside or after existing `describe` blocks:

```typescript
describe('asTemplate', () => {
  it('should replace named placeholders with values', () => {
    expect('Hello, ${name}!'.asTemplate({ name: 'World' })).to.equal('Hello, World!');
  });

  it('should replace multiple placeholders', () => {
    expect('${a} + ${b} = ${c}'.asTemplate({ a: '1', b: '2', c: '3' })).to.equal('1 + 2 = 3');
  });

  it('should leave unmatched placeholders as-is', () => {
    expect('Hello, ${name}!'.asTemplate({})).to.equal('Hello, ${name}!');
  });

  it('should not execute injected code', () => {
    // With the old new Function approach this would throw or execute code
    const result = 'Value: ${x}'.asTemplate({ x: '${y}' });
    expect(result).to.equal('Value: ${y}');
  });

  it('should handle numeric values', () => {
    expect('Count: ${n}'.asTemplate({ n: 42 as any })).to.equal('Count: 42');
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail (because old impl uses eval)**

Run: `pnpm run test-ci 2>&1 | grep -A5 "asTemplate"`
Expected: Tests run (some may pass, but behavior with injection should be unsafe with old code).

- [ ] **Step 3: Replace the `new Function` body with a safe regex replace**

In `src/extensions/stringExtensions.ts`, replace lines 15-20:

```typescript
// Before:
public asTemplate(values: object): string;
public asTemplate(this: string, values: object): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = Reflect.ownKeys(values).map(key => [key, (values as any)[key]]);
  return new Function(...mapped.map(item => item[0]), `return \`${this}\`;`)(...mapped.map(item => item[1]));
}

// After:
public asTemplate(values: object): string;
public asTemplate(this: string, values: object): string {
  return this.replace(/\$\{(\w+)\}/g, (_, key) => {
    const val = (values as Record<string, unknown>)[key];
    return val !== undefined ? String(val) : `\${${key}}`;
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `pnpm run test-ci`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/extensions/stringExtensions.ts src/extensions/string.tests.ts
git commit -m "fix: replace new Function code injection in String.asTemplate with safe regex replace"
```

---

## Task 5: Validate diff op paths in auditor history replay

**Files:**
- Modify: `src/auditor/auditor.ts` — `performOperation()` function, around line 58-70
- Modify (tests): `src/auditor/auditor.tests.ts`

In `performOperation()`, `diffApply(record, ops)` applies stored diff ops without validating that `path` segments don't contain `__proto__`, `constructor`, or `prototype`. A crafted audit record could pollute `Object.prototype`.

- [ ] **Step 1: Find the exact location of performOperation**

Run:
```bash
grep -n "performOperation\|diffApply\|\.ops" src/auditor/auditor.ts | head -20
```

- [ ] **Step 2: Write a failing test for path validation**

Add to `src/auditor/auditor.tests.ts` (find the existing `describe` block and add inside):

```typescript
describe('prototype pollution via diff ops', () => {
  it('should not pollute Object.prototype when audit ops contain dangerous paths', () => {
    const record = { id: '1', name: 'Alice' };
    let audit = auditor.createFrom(record, 'user1');

    // Directly manipulate the audit to inject a poisoned op
    const poisonedOp = { type: 'updated', timestamp: audit.history[0].timestamp, userId: 'user1', ops: [{ type: 'add', path: ['__proto__', 'polluted'], value: true }] };
    (audit as any).history.push(poisonedOp);

    // Should not throw, but also should not pollute prototype
    const result = auditor.createRecordFrom(audit);
    expect((Object.prototype as any).polluted).to.be.undefined;
    delete (Object.prototype as any).polluted; // cleanup just in case
  });
});
```

- [ ] **Step 3: Run test to confirm it fails (or prototype gets polluted)**

Run: `pnpm run test-ci 2>&1 | grep -A5 "prototype pollution via diff"`
Expected: Test fails — prototype gets polluted or the assertion triggers.

- [ ] **Step 4: Add path validation in `performOperation()` before calling diffApply**

In `src/auditor/auditor.ts`, find the `performOperation` function and locate the `diffApply` call (around line 61). Add path validation before it:

```typescript
const DANGEROUS_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function hasDangerousPath(ops: Array<{ path?: (string | number)[] }>): boolean {
  return ops.some(op => op.path?.some(segment => DANGEROUS_PATH_SEGMENTS.has(String(segment))));
}
```

Then in the `case 'updated':` branch (around line 58-70), add the check:

```typescript
case 'updated': {
  const safeDiffOps = operation.ops.map(({ type, ...rest }) => ({ ...rest, op: type }));
  if (hasDangerousPath(operation.ops as any)) break; // skip poisoned ops
  try {
    diffApply(record, safeDiffOps);
  } catch (err) {
    const error = new InternalError('Audit operation failed on record', { meta: { error: err, operation, record } });
    if (typeof onError === 'function') {
      onError(error);
    } else {
      throw error;
    }
  }
  break;
}
```

Place `DANGEROUS_PATH_SEGMENTS` and `hasDangerousPath` at module level, near the top of the file (after imports).

- [ ] **Step 5: Run tests to confirm they pass**

Run: `pnpm run test-ci`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/auditor/auditor.ts src/auditor/auditor.tests.ts
git commit -m "fix: validate diff op paths against prototype-pollution keys in auditor"
```

---

## Task 6: Remove stack trace from `BaseError.toJSON()`

**Files:**
- Modify: `src/errors/BaseError.ts:95`
- Modify (tests): `src/errors/BaseError.tests.ts` (create if absent)

`toJSON()` includes `stack: this.stack`. Stack traces expose internal file paths and line numbers to API consumers, which is an information-disclosure risk.

- [ ] **Step 1: Check if BaseError.tests.ts exists**

Run:
```bash
ls src/errors/
```

- [ ] **Step 2: Write tests for toJSON()**

If `src/errors/BaseError.tests.ts` exists, add to it. If not, create it:

```typescript
import '../extensions';
import { expect } from 'chai';
import { Error as BaseError } from './BaseError';

describe('BaseError', () => {
  describe('toJSON', () => {
    it('should include standard error fields', () => {
      const err = new BaseError({ message: 'test error', title: 'Test' });
      const json = err.toJSON();
      expect(json).to.have.property('message', 'test error');
      expect(json).to.have.property('name');
      expect(json).to.have.property('@error');
    });

    it('should not include stack trace', () => {
      const err = new BaseError({ message: 'test error' });
      const json = err.toJSON();
      expect(json).to.not.have.property('stack');
    });

    it('should include statusCode when provided', () => {
      const err = new BaseError({ message: 'test', statusCode: 400 });
      const json = err.toJSON();
      expect(json).to.have.property('statusCode', 400);
    });
  });
});
```

- [ ] **Step 3: Run tests to confirm the stack test fails**

Run: `pnpm run test-ci 2>&1 | grep -A3 "stack trace"`
Expected: "should not include stack trace" fails because `stack` is currently included.

- [ ] **Step 4: Remove `stack` from `toJSON()`**

In `src/errors/BaseError.ts`, remove the `stack` line from `toJSON()`:

```typescript
// Before:
return {
  '@error': this.name,
  name: this.name,
  title: this.#props.title,
  message: this.#props.message,
  hasBeenHandled: this.#hasBeenHandled,
  isAsync: this.#props.isAsync,
  meta: this.#props.meta,
  statusCode: this.#props.statusCode,
  code: this.#props.code,
  stack: this.stack,
};

// After:
return {
  '@error': this.name,
  name: this.name,
  title: this.#props.title,
  message: this.#props.message,
  hasBeenHandled: this.#hasBeenHandled,
  isAsync: this.#props.isAsync,
  meta: this.#props.meta,
  statusCode: this.#props.statusCode,
  code: this.#props.code,
};
```

- [ ] **Step 5: Run tests to confirm they pass**

Run: `pnpm run test-ci`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/errors/BaseError.ts src/errors/BaseError.tests.ts
git commit -m "fix: remove stack trace from BaseError.toJSON to prevent information disclosure"
```

---

## Task 7: Wrap JSON.parse in try-catch in `createSettings` and `serialisation`

**Files:**
- Modify: `src/settings/createSettings.ts:34`
- Modify: `src/extensions/to/serialisation.ts:53`
- Modify (tests): `src/settings/createSettings.tests.ts`
- Modify (tests): find serialisation tests with `grep -rn "describe.*serial" src/`

Both locations call `JSON.parse()` on values without error handling. Malformed JSON throws synchronously and would crash the caller unexpectedly. These should throw a descriptive error or return a safe fallback.

- [ ] **Step 1: Find where serialisation tests live**

Run:
```bash
grep -rn "describe.*serial\|deseriali" src/ --include="*.tests.ts" -l
```

- [ ] **Step 2: Write failing tests for createSettings JSON parse**

Add to `src/settings/createSettings.tests.ts` (find the existing test structure first with `grep -n "describe\|it(" src/settings/createSettings.tests.ts | head -20`):

```typescript
describe('env with object defaultValue', () => {
  it('should throw a descriptive error when env var contains invalid JSON', () => {
    process.env['TEST_OBJ_SETTING'] = 'not-valid-json{';
    expect(() => createSettings(from => ({
      obj: from.env('TEST_OBJ_SETTING', { defaultValue: {} }),
    }))).to.throw(/invalid json/i);
    delete process.env['TEST_OBJ_SETTING'];
  });
});
```

- [ ] **Step 3: Write failing tests for serialisation JSON parse**

In the serialisation test file (found in Step 1), add:

```typescript
describe('deserialise with malformed JSON string', () => {
  it('should throw a descriptive error for malformed JSON', () => {
    expect(() => to.deserialise('{not valid json')).to.throw();
  });
});
```

- [ ] **Step 4: Run tests to confirm they fail or produce unexpected errors**

Run: `pnpm run test-ci 2>&1 | grep -A5 "invalid json\|malformed"`

- [ ] **Step 5: Fix `createSettings.ts` — wrap JSON.parse in try-catch**

In `src/settings/createSettings.ts` at line 34:

```typescript
// Before:
if (defaultType === 'object') { return JSON.parse(value); }

// After:
if (defaultType === 'object') {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`The setting "${key}" could not be parsed as JSON: ${value}`);
  }
}
```

- [ ] **Step 6: Fix `serialisation.ts` — wrap JSON.parse in try-catch**

In `src/extensions/to/serialisation.ts` at line 53:

```typescript
// Before:
if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) return JSON.parse(trimmedValue, innerReviver(true));

// After:
if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
  try {
    return JSON.parse(trimmedValue, innerReviver(true));
  } catch {
    throw new Error(`Failed to deserialise value: invalid JSON`);
  }
}
```

- [ ] **Step 7: Run tests to confirm they pass**

Run: `pnpm run test-ci`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/settings/createSettings.ts src/settings/createSettings.tests.ts src/extensions/to/serialisation.ts
git commit -m "fix: wrap JSON.parse calls in try-catch with descriptive errors"
```

---

## Self-Review

**Spec coverage check:**
1. ✅ Task 1 — prototype pollution in `parseObject()` / `Object.merge()`
2. ✅ Task 2 — GUID regex stateful `g` flag
3. ✅ Task 3 — `is.browser()` / `is.node()` `new Function()` replaced
4. ✅ Task 4 — `String.asTemplate()` code injection removed
5. ✅ Task 5 — auditor diff op path validation
6. ✅ Task 6 — `BaseError.toJSON()` stack trace removed
7. ✅ Task 7 — `JSON.parse()` try-catch in both locations

**No placeholders found.** All steps contain complete code.

**Type consistency:** No cross-task type references — each task is fully self-contained.
