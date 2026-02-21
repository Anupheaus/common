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

    it('handles error prop by propagating message from Error instance', () => {
      const inner = new Error('inner message');
      const result = new BaseError({ error: inner });
      expect(result.message).to.equal('inner message');
      expect(result).to.be.instanceOf(Error);
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
    it('creates with default message when none provided', () => {
      const err = new AuthenticationError({});
      expect(err.message).to.include('sign in');
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
  });
});
