/* globals caches, Request, Response, Promise */
'use strict';

var threads = require('threads');

/**
 * Constructor, we will pass a cache name to store the render cache content
 * inside Will create a threadjs server to listen to commands
 * @param cacheName Name of the cache to store the content
 * @constructor
 */
function RenderCache(cacheName) {
  this.cacheName = cacheName;
  this.createService();
}

/**
 * Utility method to return a reference to the cache handled by this
 * middleware
 * @returns {Promise} Promise resolved with the cache reference.
 * @private
 */
RenderCache.prototype._openCache = function _openCache() {
  return caches.open(this.cacheName);
};

/**
 * Respond to fetch event, check internally if our cache has a matching
 * url.
 * @param request (Request) the requested url
 * @returns {Promise} Promise resolved with the cached element or null
 * if this cache doesn't contain anything for the requested url.
 */
RenderCache.prototype.onFetch = function onFetch(request) {
  return this._openCache().then(function(cache) {
    return cache.match(request).then(function(response) {
      return response !== null ? Promise.resolve(response) : null;
    });
  });
};

/**
 * Build the service explicitly adding methods that will be handled
 * by this middleware.
 */
RenderCache.prototype.createService = function createService() {
  this.service = threads.service(this.getServiceName());
  // Append the contract
  this.service.contract({
    methods: {
      listContent: [],
      evict: [],
      remove: ['string'],
      add: ['string', 'object', 'object'],
      addHtml: ['string', 'string'],
      addPng: ['string', 'blob']
    }
  });
  // Add the methods
  ['listContent', 'evict', 'remove', 'add', 'addHtml', 'addPng'].forEach((
    function(methodName) {
    this.service.method(methodName, (this[methodName]).bind(this));
  }).bind(this));
};

/**
 * Returns the name of the service. Right now this method is dummy,
 * but we can add any extra logic to know this name.
 */
RenderCache.prototype.getServiceName = function getServiceName() {
  return 'RenderCacheService';
};

// Below you can find the implementation of the methods that
// the threadjs server exposes

/**
 * List all the keys, content by url, of the cache.
 * @returns {*} (Promise) Promise containing the list of keys on the cache.
 */
RenderCache.prototype.listContent = function listContent() {
  return this._openCache().then(function(cache) {
    return cache.keys();
  });
};

/**
 * Clean the cache.
 * @returns {*} (Promise) Promise that resolves to true if cache is cleaned.
 */
RenderCache.prototype.evict = function evict() {
  return this._openCache().then(function(cache) {
    return cache.delete();
  });
};

/**
 * Delete an element of this cache. No matter what kind of request, it will
 * remove the resource.
 * @param url (string) resource url
 */
RenderCache.prototype.remove = function remove(url) {
  return this._openCache().then(function(cache) {
    return cache.delete(new Request(url),
      {ignoreSearch: true, ignoreMethod: true});
  });
};

/**
 * Save any kind of content in the cache. User needs to specify the headers
 * to return later a valid response.
 * @param url (string) url to be saved
 * @param headers (object) contains the keys and values headers
 * @param content (mixed) depending on the content string, blob, etc.
 * @returns {*} (Promise) Promise to be resolved to true if correct.
 */
RenderCache.prototype.add = function add(url, headers, content) {
  return this._openCache().then(function(cache) {
    return cache.put(new Request(url), new Response(content, {
      headers: headers
    }));
  });
};

/**
 * Utility method to save an html document. It add extra information
 * like headers.
 * @param url (string) Url to save
 * @param content (string) Content to be saved
 * @returns {*} (Promise) Promise resolved to true if correct.
 */
RenderCache.prototype.addHtml = function addHtml(url, content) {
  return this.add(url, {
    'Content-Type': 'text/html'
  }, content);
};

/**
 * Utility method to save png images in this cache.
 * @param url The url of the resource
 * @param content (blob) a blob containing the resource
 * @returns {*} (Promise) Promise resovled to true if correct.
 */
RenderCache.prototype.addPng = function addPng(url, content) {
  return this.add(url, {
    'Content-Type': 'image/png'
  }, content);
};

RenderCache.prototype.version = '0.0.1';

module.exports = RenderCache;
