'use strict';

// this is like an interface as JS doesnt have real interfaces so we fake it
// by throwing an error if a subclass doesnt override the method
// that way you get a clear message like this "FooProcessor.validate() is not implemented"
// instead of some confusing typeerror later
class BaseProcessor {

  // every processor must implement this
  // takes the request body (without document_type), returns { valid: boolean, errors: string[] }
  // should never throw — always return the errors array instead
  validate(payload) {
    throw new Error(`${this.constructor.name}.validate() is not implemented`);
  }

  // every processor must implement this too
  // called only after validate() passes cleans up the data before saving
  process(payload) {
    throw new Error(`${this.constructor.name}.process() is not implemented`);
  }
}

module.exports = BaseProcessor;
