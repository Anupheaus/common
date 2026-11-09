import {
  Error as BaseError,
  ValidationError,
  ArgumentInvalidError,
  InternalError,
  NotImplementedError,
  AuthenticationError,
  ObjectDisposedError,
  ApiError,
  ServerError,
} from './index';

describe('errors', () => {

  describe('BaseError', () => {
    it('creates error with message and title', () => {
      const err = new BaseError({ message: 'test msg', title: 'Test Title' });
      expect(err.message).to.equal('test msg');
      expect(err.title).to.equal('Test Title');
      expect(err.name).to.equal('Error');
    });

    it('supports meta and statusCode', () => {
      const err = new BaseError({ message: 'x', title: 'T', meta: { foo: 1 }, statusCode: 400 });
      expect(err.meta).to.deep.equal({ foo: 1 });
      expect(err.toJSON().statusCode).to.equal(400);
    });

    it('toJSON includes @error for serialisation', () => {
      const err = new ValidationError('invalid', 'path');
      const json = err.toJSON();
      expect(json['@error']).to.equal('ValidationError');
      expect(json.message).to.equal('invalid');
      expect(json.meta).to.deep.equal({ path: 'path' });
    });

    it('isErrorObject detects serialised errors', () => {
      expect(BaseError.isErrorObject({ '@error': 'ValidationError' })).to.be.true;
      expect(BaseError.isErrorObject({})).to.be.false;
      expect(BaseError.isErrorObject(null)).to.be.false;
    });

    it('markAsHandled and hasBeenHandled', () => {
      const err = new BaseError({ message: 'x', title: 'T' });
      expect(err.hasBeenHandled).to.be.false;
      err.markAsHandled();
      expect(err.hasBeenHandled).to.be.true;
      expect(err.toJSON().hasBeenHandled).to.be.true;
    });

    it('should not include stack trace in toJSON output', () => {
      const err = new BaseError({ message: 'test error', title: 'Test Title' });
      const json = err.toJSON();
      expect(json).to.not.have.property('stack');
    });

    it('handles error prop by propagating message from Error instance', () => {
      const inner = new Error('inner message');
      const result = new BaseError({ error: inner });
      expect(result.message).to.equal('inner message');
      expect(result).to.be.instanceOf(Error);
    });

    it('extracts message when a native Error is passed directly as props', () => {
      const native = new Error('direct native message');
      const result = new BaseError(native as unknown as Parameters<typeof BaseError>[0]);
      expect(result.message).to.equal('direct native message');
    });

    it('uses the native Error name as the title when passed directly', () => {
      const native = new TypeError('type mismatch');
      const result = new BaseError(native as unknown as Parameters<typeof BaseError>[0]);
      expect(result.title).to.equal('TypeError');
    });

    it('deserialises via @error to correct type', () => {
      const json = { '@error': 'InternalError', message: 'bad', title: 'Internal Error' };
      const err = new BaseError(json);
      expect(err).to.be.instanceOf(InternalError);
      expect(err.message).to.equal('bad');
    });
  });

  describe('ValidationError', () => {
    it('creates with message and path in meta', () => {
      const err = new ValidationError('field required', 'user.name');
      expect(err.message).to.equal('field required');
      expect(err.meta).to.deep.equal({ path: 'user.name' });
    });
  });

  describe('ArgumentInvalidError', () => {
    it('creates with argument name and optional value', () => {
      const err = new ArgumentInvalidError('userId', 'bad');
      expect(err.message).to.include('userId');
      expect(err.meta).to.deep.equal({ value: 'bad' });
    });
  });

  describe('InternalError', () => {
    it('creates with message', () => {
      const err = new InternalError('something broke');
      expect(err.message).to.equal('something broke');
    });
  });

  describe('NotImplementedError', () => {
    it('creates with message', () => {
      const err = new NotImplementedError('not done yet');
      expect(err.message).to.equal('not done yet');
    });
  });

  describe('AuthenticationError', () => {
    it('creates with a string message', () => {
      const err = new AuthenticationError('You must sign in');
      expect(err.message).to.equal('You must sign in');
      expect(err.statusCode).to.equal(401);
    });

    it('creates with a props object', () => {
      const err = new AuthenticationError({ message: 'Token expired', url: '/api/data' });
      expect(err.message).to.equal('Token expired');
      expect(err.statusCode).to.equal(401);
    });
  });

  describe('ObjectDisposedError', () => {
    it('creates with message', () => {
      const err = new ObjectDisposedError('object');
      expect(err.message).to.include('object');
    });
  });

  describe('ApiError', () => {
    it('creates with url, method, statusCode', () => {
      const err = new ApiError({ url: '/api', method: 'GET', statusCode: 404, message: 'Not found' });
      expect(err.message).to.equal('Not found');
      expect(err.statusCode).to.equal(404);
    });
  });

  describe('ServerError', () => {
    it('creates with default message', () => {
      const err = new ServerError({});
      expect(err.message).to.include('server error');
      expect(err.statusCode).to.equal(500);
    });

    it('creates with a custom message', () => {
      const err = new ServerError({ message: 'Database unavailable' });
      expect(err.message).to.equal('Database unavailable');
      expect(err.statusCode).to.equal(500);
    });

    it('accepts no arguments and uses defaults', () => {
      const err = new ServerError();
      expect(err.statusCode).to.equal(500);
      expect(err.message).to.be.a('string').with.length.above(0);
    });
  });

  describe('ApiError', () => {
    it('creates with url, method, statusCode', () => {
      const err = new ApiError({ url: '/api', method: 'GET', statusCode: 404, message: 'Not found' });
      expect(err.message).to.equal('Not found');
      expect(err.statusCode).to.equal(404);
    });

    it('uses a default message when none is provided', () => {
      const err = new ApiError({ statusCode: 400 });
      expect(err.message).to.be.a('string').with.length.above(0);
    });

    it('defaults statusCode to 500 when not provided', () => {
      const err = new ApiError({});
      expect(err.statusCode).to.equal(500);
    });

    it('stores url and method in meta', () => {
      const err = new ApiError({ url: '/things', method: 'POST', statusCode: 201 });
      expect(err.meta?.url).to.equal('/things');
      expect(err.meta?.method).to.equal('POST');
    });
  });

  // sc-3993: a refusal the server sends travels as `error.toJSON()` and is rebuilt on the client by `new Error(...)`. A typed
  // error whose own constructor takes (message, path) instead of props used to be handed the whole object as its message, so
  // the screen showed "[object Object]" or failed with "message.startsWith is not a function".
  describe('rebuilding an error that was sent from the server', () => {
    const SENT: Array<[string, () => BaseError]> = [
      ['ValidationError', () => new ValidationError('Say why you are correcting it.', 'reason')],
      ['ArgumentInvalidError', () => new ArgumentInvalidError('userId', 'bad')],
      ['NotImplementedError', () => new NotImplementedError('That is not available yet.', { feature: 'x' })],
      ['ObjectDisposedError', () => new ObjectDisposedError('This visit is already closed.')],
      ['InternalError', () => new InternalError('something broke')],
      ['AuthenticationError', () => new AuthenticationError('You must sign in')],
      ['ServerError', () => new ServerError({ message: 'The server fell over.' })],
      ['ApiError', () => new ApiError({ message: 'The request failed.', url: '/things' })],
    ];

    /** What the client receives: the error as JSON, through the wire. */
    const throughTheWire = (error: BaseError) => JSON.parse(JSON.stringify(error)) as ReturnType<BaseError['toJSON']>;

    for (const [name, make] of SENT) {
      describe(name, () => {
        it('comes back as the same kind of error with its message as text', () => {
          const original = make();

          const rebuilt = new BaseError(throughTheWire(original));

          expect(rebuilt.constructor.name).to.equal(name);
          expect(rebuilt.message).to.be.a('string').and.to.equal(original.message);
          expect(rebuilt.message.startsWith(original.message.slice(0, 5))).to.be.true;
          expect(rebuilt.title).to.equal(original.title);
          expect(rebuilt.meta).to.deep.equal(throughTheWire(original).meta);
        });

        it('comes back the same when the sent error is carried in { error } (how nexus hands it over)', () => {
          const original = make();

          const rebuilt = new BaseError({ error: throughTheWire(original) });

          expect(rebuilt.constructor.name).to.equal(name);
          expect(rebuilt.message).to.be.a('string').and.to.equal(original.message);
        });
      });
    }

    it('keeps the plain words a screen shows: a ValidationError is not "[object Object]"', () => {
      const rebuilt = new BaseError(throughTheWire(new ValidationError('Say why you are correcting it.', 'reason')));

      expect(rebuilt).to.be.instanceOf(ValidationError);
      expect(`${rebuilt.message}`).to.equal('Say why you are correcting it.');
      expect(rebuilt.meta).to.deep.equal({ path: 'reason' });
    });

    it('keeps the status code of an API error so a screen can tell a sign-in refusal from a not-valid one', () => {
      const rebuilt = new BaseError(throughTheWire(new AuthenticationError('You must sign in'))) as AuthenticationError;

      expect(rebuilt).to.be.instanceOf(AuthenticationError);
      expect(rebuilt.statusCode).to.equal(401);
    });

    it('still rebuilds a plain error of a type nobody registered as an ordinary error with the message', () => {
      const rebuilt = new BaseError({ '@error': 'NotARegisteredType', message: 'odd', title: 'Odd' } as never);

      expect(rebuilt.message).to.equal('odd');
    });
  });
});
