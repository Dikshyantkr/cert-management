'use strict';

// simple in memory cache, just a Map, no external dependencies here
// module level so its shared across all requests
const cache = new Map();

// keys: "all" for no params, "type:aadhar_card" for ?type=, "id:5" for ?id=

const get = (key) => {
  return cache.has(key) ? cache.get(key) : null;
};

const set = (key, value) => {
  cache.set(key, value);
};

// wiped after every POST /store so we never return stale data
const clear = () => {
  cache.clear();
};

const size =() => cache.size;

module.exports = {get,set,  clear, size };