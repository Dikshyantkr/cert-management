'use strict';

// using a map instead of a plain object to avoid weird prototype chain issues
// and a key like '__proto__' could break a plain object but not a map
const registry = new Map(); // type string → processor class

// each processor file calls this when it loads to add itself to the registry
const register = (type, ProcessorClass) => {
  if (!type || typeof type !== 'string') {
    throw new Error(`ProcessorFactory.register: type must be a non-empty string, got: ${JSON.stringify(type)}`);
  }
  if (typeof ProcessorClass !== 'function') {
    throw new Error(`ProcessorFactory.register: ProcessorClass must be a class (constructor function)`);
  }
  registry.set(type, ProcessorClass);
  console.log(`[Factory] Registered processor for document_type: "${type}"`);
};

// returns the processor class for a given type, or null if its not registered
// returning null instead of throwing lets the handler send a proper 400 response
const resolve = (type) => {
  return registry.get(type) || null;
};

// used in error messages so the client knows what types are actually valid
const listTypes = () => {
  return Array.from(registry.keys());
};

// not exporting the registry itself and callers should only use register/resolve/listTypes
module.exports = { register, resolve, listTypes };
