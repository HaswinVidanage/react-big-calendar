;(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(
        exports,
        require('domain'),
        require('react'),
        require('react-dom')
      )
    : typeof define === 'function' && define.amd
    ? define(['exports', 'domain', 'react', 'react-dom'], factory)
    : ((global = global || self),
      factory(
        (global.ReactBigCalendar = {}),
        global.domain$1,
        global.React,
        global.ReactDOM
      ))
})(this, function(exports, domain$1, React, ReactDOM) {
  'use strict'

  domain$1 =
    domain$1 && domain$1.hasOwnProperty('default')
      ? domain$1['default']
      : domain$1
  var React__default = 'default' in React ? React['default'] : React
  var ReactDOM__default = 'default' in ReactDOM ? ReactDOM['default'] : ReactDOM

  var domain // The domain module is executed on demand
  var hasSetImmediate = typeof setImmediate === 'function'

  // Use the fastest means possible to execute a task in its own turn, with
  // priority over other events including network IO events in Node.js.
  //
  // An exception thrown by a task will permanently interrupt the processing of
  // subsequent tasks. The higher level `asap` function ensures that if an
  // exception is thrown by a task, that the task queue will continue flushing as
  // soon as possible, but if you use `rawAsap` directly, you are responsible to
  // either ensure that no exceptions are thrown from your task, or to manually
  // call `rawAsap.requestFlush` if an exception is thrown.
  var raw = rawAsap
  function rawAsap(task) {
    if (!queue.length) {
      requestFlush()
      flushing = true
    }
    // Avoids a function call
    queue[queue.length] = task
  }

  var queue = []
  // Once a flush has been requested, no further calls to `requestFlush` are
  // necessary until the next `flush` completes.
  var flushing = false
  // The position of the next task to execute in the task queue. This is
  // preserved between calls to `flush` so that it can be resumed if
  // a task throws an exception.
  var index = 0
  // If a task schedules additional tasks recursively, the task queue can grow
  // unbounded. To prevent memory excaustion, the task queue will periodically
  // truncate already-completed tasks.
  var capacity = 1024

  // The flush function processes all tasks that have been scheduled with
  // `rawAsap` unless and until one of those tasks throws an exception.
  // If a task throws an exception, `flush` ensures that its state will remain
  // consistent and will resume where it left off when called again.
  // However, `flush` does not make any arrangements to be called again if an
  // exception is thrown.
  function flush() {
    while (index < queue.length) {
      var currentIndex = index
      // Advance the index before calling the task. This ensures that we will
      // begin flushing on the next task the task throws an error.
      index = index + 1
      queue[currentIndex].call()
      // Prevent leaking memory for long chains of recursive calls to `asap`.
      // If we call `asap` within tasks scheduled by `asap`, the queue will
      // grow, but to avoid an O(n) walk for every task we execute, we don't
      // shift tasks off the queue after they have been executed.
      // Instead, we periodically shift 1024 tasks off the queue.
      if (index > capacity) {
        // Manually shift all values starting at the index back to the
        // beginning of the queue.
        for (
          var scan = 0, newLength = queue.length - index;
          scan < newLength;
          scan++
        ) {
          queue[scan] = queue[scan + index]
        }
        queue.length -= index
        index = 0
      }
    }
    queue.length = 0
    index = 0
    flushing = false
  }

  rawAsap.requestFlush = requestFlush
  function requestFlush() {
    // Ensure flushing is not bound to any domain.
    // It is not sufficient to exit the domain, because domains exist on a stack.
    // To execute code outside of any domain, the following dance is necessary.
    var parentDomain = process.domain
    if (parentDomain) {
      if (!domain) {
        // Lazy execute the domain module.
        // Only employed if the user elects to use domains.
        domain = domain$1
      }
      domain.active = process.domain = null
    }

    // `setImmediate` is slower that `process.nextTick`, but `process.nextTick`
    // cannot handle recursion.
    // `requestFlush` will only be called recursively from `asap.js`, to resume
    // flushing after an error is thrown into a domain.
    // Conveniently, `setImmediate` was introduced in the same version
    // `process.nextTick` started throwing recursion errors.
    if (flushing && hasSetImmediate) {
      setImmediate(flush)
    } else {
      process.nextTick(flush)
    }

    if (parentDomain) {
      domain.active = process.domain = parentDomain
    }
  }

  function noop() {}

  // States:
  //
  // 0 - pending
  // 1 - fulfilled with _value
  // 2 - rejected with _value
  // 3 - adopted the state of another promise, _value
  //
  // once the state is no longer pending (0) it is immutable

  // All `_` prefixed properties will be reduced to `_{random number}`
  // at build time to obfuscate them and discourage their use.
  // We don't use symbols or Object.defineProperty to fully hide them
  // because the performance isn't good enough.

  // to avoid using try/catch inside critical functions, we
  // extract them to here.
  var LAST_ERROR = null
  var IS_ERROR = {}
  function getThen(obj) {
    try {
      return obj.then
    } catch (ex) {
      LAST_ERROR = ex
      return IS_ERROR
    }
  }

  function tryCallOne(fn, a) {
    try {
      return fn(a)
    } catch (ex) {
      LAST_ERROR = ex
      return IS_ERROR
    }
  }
  function tryCallTwo(fn, a, b) {
    try {
      fn(a, b)
    } catch (ex) {
      LAST_ERROR = ex
      return IS_ERROR
    }
  }

  var core = Promise$1

  function Promise$1(fn) {
    if (typeof this !== 'object') {
      throw new TypeError('Promises must be constructed via new')
    }
    if (typeof fn !== 'function') {
      throw new TypeError("Promise constructor's argument is not a function")
    }
    this._h = 0
    this._i = 0
    this._j = null
    this._k = null
    if (fn === noop) return
    doResolve(fn, this)
  }
  Promise$1._l = null
  Promise$1._m = null
  Promise$1._n = noop

  Promise$1.prototype.then = function(onFulfilled, onRejected) {
    if (this.constructor !== Promise$1) {
      return safeThen(this, onFulfilled, onRejected)
    }
    var res = new Promise$1(noop)
    handle(this, new Handler(onFulfilled, onRejected, res))
    return res
  }

  function safeThen(self, onFulfilled, onRejected) {
    return new self.constructor(function(resolve, reject) {
      var res = new Promise$1(noop)
      res.then(resolve, reject)
      handle(self, new Handler(onFulfilled, onRejected, res))
    })
  }
  function handle(self, deferred) {
    while (self._i === 3) {
      self = self._j
    }
    if (Promise$1._l) {
      Promise$1._l(self)
    }
    if (self._i === 0) {
      if (self._h === 0) {
        self._h = 1
        self._k = deferred
        return
      }
      if (self._h === 1) {
        self._h = 2
        self._k = [self._k, deferred]
        return
      }
      self._k.push(deferred)
      return
    }
    handleResolved(self, deferred)
  }

  function handleResolved(self, deferred) {
    raw(function() {
      var cb = self._i === 1 ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        if (self._i === 1) {
          resolve(deferred.promise, self._j)
        } else {
          reject(deferred.promise, self._j)
        }
        return
      }
      var ret = tryCallOne(cb, self._j)
      if (ret === IS_ERROR) {
        reject(deferred.promise, LAST_ERROR)
      } else {
        resolve(deferred.promise, ret)
      }
    })
  }
  function resolve(self, newValue) {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self) {
      return reject(
        self,
        new TypeError('A promise cannot be resolved with itself.')
      )
    }
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = getThen(newValue)
      if (then === IS_ERROR) {
        return reject(self, LAST_ERROR)
      }
      if (then === self.then && newValue instanceof Promise$1) {
        self._i = 3
        self._j = newValue
        finale(self)
        return
      } else if (typeof then === 'function') {
        doResolve(then.bind(newValue), self)
        return
      }
    }
    self._i = 1
    self._j = newValue
    finale(self)
  }

  function reject(self, newValue) {
    self._i = 2
    self._j = newValue
    if (Promise$1._m) {
      Promise$1._m(self, newValue)
    }
    finale(self)
  }
  function finale(self) {
    if (self._h === 1) {
      handle(self, self._k)
      self._k = null
    }
    if (self._h === 2) {
      for (var i = 0; i < self._k.length; i++) {
        handle(self, self._k[i])
      }
      self._k = null
    }
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
    this.onRejected = typeof onRejected === 'function' ? onRejected : null
    this.promise = promise
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, promise) {
    var done = false
    var res = tryCallTwo(
      fn,
      function(value) {
        if (done) return
        done = true
        resolve(promise, value)
      },
      function(reason) {
        if (done) return
        done = true
        reject(promise, reason)
      }
    )
    if (!done && res === IS_ERROR) {
      done = true
      reject(promise, LAST_ERROR)
    }
  }

  var DEFAULT_WHITELIST = [ReferenceError, TypeError, RangeError]

  var enabled = false
  var disable_1 = disable
  function disable() {
    enabled = false
    core._l = null
    core._m = null
  }

  var enable_1 = enable
  function enable(options) {
    options = options || {}
    if (enabled) disable()
    enabled = true
    var id = 0
    var displayId = 0
    var rejections = {}
    core._l = function(promise) {
      if (
        promise._i === 2 && // IS REJECTED
        rejections[promise._o]
      ) {
        if (rejections[promise._o].logged) {
          onHandled(promise._o)
        } else {
          clearTimeout(rejections[promise._o].timeout)
        }
        delete rejections[promise._o]
      }
    }
    core._m = function(promise, err) {
      if (promise._h === 0) {
        // not yet handled
        promise._o = id++
        rejections[promise._o] = {
          displayId: null,
          error: err,
          timeout: setTimeout(
            onUnhandled.bind(null, promise._o),
            // For reference errors and type errors, this almost always
            // means the programmer made a mistake, so log them after just
            // 100ms
            // otherwise, wait 2 seconds to see if they get handled
            matchWhitelist(err, DEFAULT_WHITELIST) ? 100 : 2000
          ),
          logged: false,
        }
      }
    }
    function onUnhandled(id) {
      if (
        options.allRejections ||
        matchWhitelist(
          rejections[id].error,
          options.whitelist || DEFAULT_WHITELIST
        )
      ) {
        rejections[id].displayId = displayId++
        if (options.onUnhandled) {
          rejections[id].logged = true
          options.onUnhandled(rejections[id].displayId, rejections[id].error)
        } else {
          rejections[id].logged = true
          logError(rejections[id].displayId, rejections[id].error)
        }
      }
    }
    function onHandled(id) {
      if (rejections[id].logged) {
        if (options.onHandled) {
          options.onHandled(rejections[id].displayId, rejections[id].error)
        } else if (!rejections[id].onUnhandled) {
          console.warn(
            'Promise Rejection Handled (id: ' + rejections[id].displayId + '):'
          )
          console.warn(
            '  This means you can ignore any previous messages of the form "Possible Unhandled Promise Rejection" with id ' +
              rejections[id].displayId +
              '.'
          )
        }
      }
    }
  }

  function logError(id, error) {
    console.warn('Possible Unhandled Promise Rejection (id: ' + id + '):')
    var errStr = (error && (error.stack || error)) + ''
    errStr.split('\n').forEach(function(line) {
      console.warn('  ' + line)
    })
  }

  function matchWhitelist(error, list) {
    return list.some(function(cls) {
      return error instanceof cls
    })
  }

  var rejectionTracking = {
    disable: disable_1,
    enable: enable_1,
  }

  //This file contains the ES6 extensions to the core Promises/A+ API

  var es6Extensions = core

  /* Static Functions */

  var TRUE = valuePromise(true)
  var FALSE = valuePromise(false)
  var NULL = valuePromise(null)
  var UNDEFINED = valuePromise(undefined)
  var ZERO = valuePromise(0)
  var EMPTYSTRING = valuePromise('')

  function valuePromise(value) {
    var p = new core(core._n)
    p._i = 1
    p._j = value
    return p
  }
  core.resolve = function(value) {
    if (value instanceof core) return value

    if (value === null) return NULL
    if (value === undefined) return UNDEFINED
    if (value === true) return TRUE
    if (value === false) return FALSE
    if (value === 0) return ZERO
    if (value === '') return EMPTYSTRING

    if (typeof value === 'object' || typeof value === 'function') {
      try {
        var then = value.then
        if (typeof then === 'function') {
          return new core(then.bind(value))
        }
      } catch (ex) {
        return new core(function(resolve, reject) {
          reject(ex)
        })
      }
    }
    return valuePromise(value)
  }

  core.all = function(arr) {
    var args = Array.prototype.slice.call(arr)

    return new core(function(resolve, reject) {
      if (args.length === 0) return resolve([])
      var remaining = args.length
      function res(i, val) {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          if (val instanceof core && val.then === core.prototype.then) {
            while (val._i === 3) {
              val = val._j
            }
            if (val._i === 1) return res(i, val._j)
            if (val._i === 2) reject(val._j)
            val.then(function(val) {
              res(i, val)
            }, reject)
            return
          } else {
            var then = val.then
            if (typeof then === 'function') {
              var p = new core(then.bind(val))
              p.then(function(val) {
                res(i, val)
              }, reject)
              return
            }
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args)
        }
      }
      for (var i = 0; i < args.length; i++) {
        res(i, args[i])
      }
    })
  }

  core.reject = function(value) {
    return new core(function(resolve, reject) {
      reject(value)
    })
  }

  core.race = function(values) {
    return new core(function(resolve, reject) {
      values.forEach(function(value) {
        core.resolve(value).then(resolve, reject)
      })
    })
  }

  /* Prototype Methods */

  core.prototype['catch'] = function(onRejected) {
    return this.then(null, onRejected)
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob()
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self,
  }

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]',
    ]

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return (
          obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
        )
      }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return { done: value === undefined, value: value }
      },
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue + ', ' + value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) {
      items.push(name)
    })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) {
      items.push(value)
    })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) {
      items.push([name, value])
    })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (
        support.searchParams &&
        URLSearchParams.prototype.isPrototypeOf(body)
      ) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (
        support.arrayBuffer &&
        (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))
      ) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        this._bodyText = body = Object.prototype.toString.call(body)
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (
          support.searchParams &&
          URLSearchParams.prototype.isPrototypeOf(body)
        ) {
          this.headers.set(
            'content-type',
            'application/x-www-form-urlencoded;charset=UTF-8'
          )
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      this.signal = input.signal
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'same-origin'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.signal = options.signal || this.signal
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=')
          var name = split.shift().replace(/\+/g, ' ')
          var value = split.join('=').replace(/\+/g, ' ')
          form.append(decodeURIComponent(name), decodeURIComponent(value))
        }
      })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status === undefined ? 200 : options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url,
    })
  }

  Response.error = function() {
    var response = new Response(null, { status: 0, statusText: '' })
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, { status: status, headers: { location: url } })
  }

  var DOMException = self.DOMException
  try {
    new DOMException()
  } catch (err) {
    DOMException = function(message, name) {
      this.message = message
      this.name = name
      var error = Error(message)
      this.stack = error.stack
    }
    DOMException.prototype = Object.create(Error.prototype)
    DOMException.prototype.constructor = DOMException
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)

      if (request.signal && request.signal.aborted) {
        return reject(new DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest()

      function abortXhr() {
        xhr.abort()
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || ''),
        }
        options.url =
          'responseURL' in xhr
            ? xhr.responseURL
            : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.onabort = function() {
        reject(new DOMException('Aborted', 'AbortError'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr)

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr)
          }
        }
      }

      xhr.send(
        typeof request._bodyInit === 'undefined' ? null : request._bodyInit
      )
    })
  }

  fetch.polyfill = true

  if (!self.fetch) {
    self.fetch = fetch
    self.Headers = Headers
    self.Request = Request
    self.Response = Response
  }

  /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
  /* eslint-disable no-unused-vars */
  var getOwnPropertySymbols = Object.getOwnPropertySymbols
  var hasOwnProperty = Object.prototype.hasOwnProperty
  var propIsEnumerable = Object.prototype.propertyIsEnumerable

  function toObject(val) {
    if (val === null || val === undefined) {
      throw new TypeError(
        'Object.assign cannot be called with null or undefined'
      )
    }

    return Object(val)
  }

  function shouldUseNative() {
    try {
      if (!Object.assign) {
        return false
      }

      // Detect buggy property enumeration order in older V8 versions.

      // https://bugs.chromium.org/p/v8/issues/detail?id=4118
      var test1 = new String('abc') // eslint-disable-line no-new-wrappers
      test1[5] = 'de'
      if (Object.getOwnPropertyNames(test1)[0] === '5') {
        return false
      }

      // https://bugs.chromium.org/p/v8/issues/detail?id=3056
      var test2 = {}
      for (var i = 0; i < 10; i++) {
        test2['_' + String.fromCharCode(i)] = i
      }
      var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
        return test2[n]
      })
      if (order2.join('') !== '0123456789') {
        return false
      }

      // https://bugs.chromium.org/p/v8/issues/detail?id=3056
      var test3 = {}
      'abcdefghijklmnopqrst'.split('').forEach(function(letter) {
        test3[letter] = letter
      })
      if (
        Object.keys(Object.assign({}, test3)).join('') !==
        'abcdefghijklmnopqrst'
      ) {
        return false
      }

      return true
    } catch (err) {
      // We don't expect any of the above to throw, but better to be safe.
      return false
    }
  }

  var objectAssign = shouldUseNative()
    ? Object.assign
    : function(target, source) {
        var from
        var to = toObject(target)
        var symbols

        for (var s = 1; s < arguments.length; s++) {
          from = Object(arguments[s])

          for (var key in from) {
            if (hasOwnProperty.call(from, key)) {
              to[key] = from[key]
            }
          }

          if (getOwnPropertySymbols) {
            symbols = getOwnPropertySymbols(from)
            for (var i = 0; i < symbols.length; i++) {
              if (propIsEnumerable.call(from, symbols[i])) {
                to[symbols[i]] = from[symbols[i]]
              }
            }
          }
        }

        return to
      }

  var commonjsGlobal =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : typeof self !== 'undefined'
      ? self
      : {}

  function unwrapExports(x) {
    return x &&
      x.__esModule &&
      Object.prototype.hasOwnProperty.call(x, 'default')
      ? x['default']
      : x
  }

  function createCommonjsModule(fn, module) {
    return (
      (module = { exports: {} }), fn(module, module.exports), module.exports
    )
  }

  var check = function(it) {
    return it && it.Math == Math && it
  }

  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global_1 =
    // eslint-disable-next-line no-undef
    check(typeof globalThis == 'object' && globalThis) ||
    check(typeof window == 'object' && window) ||
    check(typeof self == 'object' && self) ||
    check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
    // eslint-disable-next-line no-new-func
    Function('return this')()

  var fails = function(exec) {
    try {
      return !!exec()
    } catch (error) {
      return true
    }
  }

  // Thank's IE8 for his funny defineProperty
  var descriptors = !fails(function() {
    return (
      Object.defineProperty({}, 1, {
        get: function() {
          return 7
        },
      })[1] != 7
    )
  })

  var nativePropertyIsEnumerable = {}.propertyIsEnumerable
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor

  // Nashorn ~ JDK8 bug
  var NASHORN_BUG =
    getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1)

  // `Object.prototype.propertyIsEnumerable` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
  var f = NASHORN_BUG
    ? function propertyIsEnumerable(V) {
        var descriptor = getOwnPropertyDescriptor(this, V)
        return !!descriptor && descriptor.enumerable
      }
    : nativePropertyIsEnumerable

  var objectPropertyIsEnumerable = {
    f: f,
  }

  var createPropertyDescriptor = function(bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value,
    }
  }

  var toString = {}.toString

  var classofRaw = function(it) {
    return toString.call(it).slice(8, -1)
  }

  var split = ''.split

  // fallback for non-array-like ES3 and non-enumerable old V8 strings
  var indexedObject = fails(function() {
    // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
    // eslint-disable-next-line no-prototype-builtins
    return !Object('z').propertyIsEnumerable(0)
  })
    ? function(it) {
        return classofRaw(it) == 'String' ? split.call(it, '') : Object(it)
      }
    : Object

  // `RequireObjectCoercible` abstract operation
  // https://tc39.github.io/ecma262/#sec-requireobjectcoercible
  var requireObjectCoercible = function(it) {
    if (it == undefined) throw TypeError("Can't call method on " + it)
    return it
  }

  // toObject with fallback for non-array-like ES3 strings

  var toIndexedObject = function(it) {
    return indexedObject(requireObjectCoercible(it))
  }

  var isObject = function(it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function'
  }

  // `ToPrimitive` abstract operation
  // https://tc39.github.io/ecma262/#sec-toprimitive
  // instead of the ES6 spec version, we didn't implement @@toPrimitive case
  // and the second argument - flag - preferred type is a string
  var toPrimitive = function(input, PREFERRED_STRING) {
    if (!isObject(input)) return input
    var fn, val
    if (
      PREFERRED_STRING &&
      typeof (fn = input.toString) == 'function' &&
      !isObject((val = fn.call(input)))
    )
      return val
    if (
      typeof (fn = input.valueOf) == 'function' &&
      !isObject((val = fn.call(input)))
    )
      return val
    if (
      !PREFERRED_STRING &&
      typeof (fn = input.toString) == 'function' &&
      !isObject((val = fn.call(input)))
    )
      return val
    throw TypeError("Can't convert object to primitive value")
  }

  var hasOwnProperty$1 = {}.hasOwnProperty

  var has = function(it, key) {
    return hasOwnProperty$1.call(it, key)
  }

  var document$1 = global_1.document
  // typeof document.createElement is 'object' in old IE
  var EXISTS = isObject(document$1) && isObject(document$1.createElement)

  var documentCreateElement = function(it) {
    return EXISTS ? document$1.createElement(it) : {}
  }

  // Thank's IE8 for his funny defineProperty
  var ie8DomDefine =
    !descriptors &&
    !fails(function() {
      return (
        Object.defineProperty(documentCreateElement('div'), 'a', {
          get: function() {
            return 7
          },
        }).a != 7
      )
    })

  var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
  var f$1 = descriptors
    ? nativeGetOwnPropertyDescriptor
    : function getOwnPropertyDescriptor(O, P) {
        O = toIndexedObject(O)
        P = toPrimitive(P, true)
        if (ie8DomDefine)
          try {
            return nativeGetOwnPropertyDescriptor(O, P)
          } catch (error) {
            /* empty */
          }
        if (has(O, P))
          return createPropertyDescriptor(
            !objectPropertyIsEnumerable.f.call(O, P),
            O[P]
          )
      }

  var objectGetOwnPropertyDescriptor = {
    f: f$1,
  }

  var anObject = function(it) {
    if (!isObject(it)) {
      throw TypeError(String(it) + ' is not an object')
    }
    return it
  }

  var nativeDefineProperty = Object.defineProperty

  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  var f$2 = descriptors
    ? nativeDefineProperty
    : function defineProperty(O, P, Attributes) {
        anObject(O)
        P = toPrimitive(P, true)
        anObject(Attributes)
        if (ie8DomDefine)
          try {
            return nativeDefineProperty(O, P, Attributes)
          } catch (error) {
            /* empty */
          }
        if ('get' in Attributes || 'set' in Attributes)
          throw TypeError('Accessors not supported')
        if ('value' in Attributes) O[P] = Attributes.value
        return O
      }

  var objectDefineProperty = {
    f: f$2,
  }

  var createNonEnumerableProperty = descriptors
    ? function(object, key, value) {
        return objectDefineProperty.f(
          object,
          key,
          createPropertyDescriptor(1, value)
        )
      }
    : function(object, key, value) {
        object[key] = value
        return object
      }

  var setGlobal = function(key, value) {
    try {
      createNonEnumerableProperty(global_1, key, value)
    } catch (error) {
      global_1[key] = value
    }
    return value
  }

  var SHARED = '__core-js_shared__'
  var store = global_1[SHARED] || setGlobal(SHARED, {})

  var sharedStore = store

  var functionToString = Function.toString

  // this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
  if (typeof sharedStore.inspectSource != 'function') {
    sharedStore.inspectSource = function(it) {
      return functionToString.call(it)
    }
  }

  var inspectSource = sharedStore.inspectSource

  var WeakMap = global_1.WeakMap

  var nativeWeakMap =
    typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap))

  var isPure = false

  var shared = createCommonjsModule(function(module) {
    ;(module.exports = function(key, value) {
      return (
        sharedStore[key] ||
        (sharedStore[key] = value !== undefined ? value : {})
      )
    })('versions', []).push({
      version: '3.6.4',
      mode: 'global',
      copyright: '© 2020 Denis Pushkarev (zloirock.ru)',
    })
  })

  var id = 0
  var postfix = Math.random()

  var uid = function(key) {
    return (
      'Symbol(' +
      String(key === undefined ? '' : key) +
      ')_' +
      (++id + postfix).toString(36)
    )
  }

  var keys = shared('keys')

  var sharedKey = function(key) {
    return keys[key] || (keys[key] = uid(key))
  }

  var hiddenKeys = {}

  var WeakMap$1 = global_1.WeakMap
  var set, get, has$1

  var enforce = function(it) {
    return has$1(it) ? get(it) : set(it, {})
  }

  var getterFor = function(TYPE) {
    return function(it) {
      var state
      if (!isObject(it) || (state = get(it)).type !== TYPE) {
        throw TypeError('Incompatible receiver, ' + TYPE + ' required')
      }
      return state
    }
  }

  if (nativeWeakMap) {
    var store$1 = new WeakMap$1()
    var wmget = store$1.get
    var wmhas = store$1.has
    var wmset = store$1.set
    set = function(it, metadata) {
      wmset.call(store$1, it, metadata)
      return metadata
    }
    get = function(it) {
      return wmget.call(store$1, it) || {}
    }
    has$1 = function(it) {
      return wmhas.call(store$1, it)
    }
  } else {
    var STATE = sharedKey('state')
    hiddenKeys[STATE] = true
    set = function(it, metadata) {
      createNonEnumerableProperty(it, STATE, metadata)
      return metadata
    }
    get = function(it) {
      return has(it, STATE) ? it[STATE] : {}
    }
    has$1 = function(it) {
      return has(it, STATE)
    }
  }

  var internalState = {
    set: set,
    get: get,
    has: has$1,
    enforce: enforce,
    getterFor: getterFor,
  }

  var redefine = createCommonjsModule(function(module) {
    var getInternalState = internalState.get
    var enforceInternalState = internalState.enforce
    var TEMPLATE = String(String).split('String')

    ;(module.exports = function(O, key, value, options) {
      var unsafe = options ? !!options.unsafe : false
      var simple = options ? !!options.enumerable : false
      var noTargetGet = options ? !!options.noTargetGet : false
      if (typeof value == 'function') {
        if (typeof key == 'string' && !has(value, 'name'))
          createNonEnumerableProperty(value, 'name', key)
        enforceInternalState(value).source = TEMPLATE.join(
          typeof key == 'string' ? key : ''
        )
      }
      if (O === global_1) {
        if (simple) O[key] = value
        else setGlobal(key, value)
        return
      } else if (!unsafe) {
        delete O[key]
      } else if (!noTargetGet && O[key]) {
        simple = true
      }
      if (simple) O[key] = value
      else createNonEnumerableProperty(O, key, value)
      // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
    })(Function.prototype, 'toString', function toString() {
      return (
        (typeof this == 'function' && getInternalState(this).source) ||
        inspectSource(this)
      )
    })
  })

  var path = global_1

  var aFunction = function(variable) {
    return typeof variable == 'function' ? variable : undefined
  }

  var getBuiltIn = function(namespace, method) {
    return arguments.length < 2
      ? aFunction(path[namespace]) || aFunction(global_1[namespace])
      : (path[namespace] && path[namespace][method]) ||
          (global_1[namespace] && global_1[namespace][method])
  }

  var ceil = Math.ceil
  var floor = Math.floor

  // `ToInteger` abstract operation
  // https://tc39.github.io/ecma262/#sec-tointeger
  var toInteger = function(argument) {
    return isNaN((argument = +argument))
      ? 0
      : (argument > 0 ? floor : ceil)(argument)
  }

  var min = Math.min

  // `ToLength` abstract operation
  // https://tc39.github.io/ecma262/#sec-tolength
  var toLength = function(argument) {
    return argument > 0 ? min(toInteger(argument), 0x1fffffffffffff) : 0 // 2 ** 53 - 1 == 9007199254740991
  }

  var max = Math.max
  var min$1 = Math.min

  // Helper for a popular repeating case of the spec:
  // Let integer be ? ToInteger(index).
  // If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
  var toAbsoluteIndex = function(index, length) {
    var integer = toInteger(index)
    return integer < 0 ? max(integer + length, 0) : min$1(integer, length)
  }

  // `Array.prototype.{ indexOf, includes }` methods implementation
  var createMethod = function(IS_INCLUDES) {
    return function($this, el, fromIndex) {
      var O = toIndexedObject($this)
      var length = toLength(O.length)
      var index = toAbsoluteIndex(fromIndex, length)
      var value
      // Array#includes uses SameValueZero equality algorithm
      // eslint-disable-next-line no-self-compare
      if (IS_INCLUDES && el != el)
        while (length > index) {
          value = O[index++]
          // eslint-disable-next-line no-self-compare
          if (value != value) return true
          // Array#indexOf ignores holes, Array#includes - not
        }
      else
        for (; length > index; index++) {
          if ((IS_INCLUDES || index in O) && O[index] === el)
            return IS_INCLUDES || index || 0
        }
      return !IS_INCLUDES && -1
    }
  }

  var arrayIncludes = {
    // `Array.prototype.includes` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.includes
    includes: createMethod(true),
    // `Array.prototype.indexOf` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
    indexOf: createMethod(false),
  }

  var indexOf = arrayIncludes.indexOf

  var objectKeysInternal = function(object, names) {
    var O = toIndexedObject(object)
    var i = 0
    var result = []
    var key
    for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key)
    // Don't enum bug & hidden keys
    while (names.length > i)
      if (has(O, (key = names[i++]))) {
        ~indexOf(result, key) || result.push(key)
      }
    return result
  }

  // IE8- don't enum bug keys
  var enumBugKeys = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf',
  ]

  var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype')

  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  var f$3 =
    Object.getOwnPropertyNames ||
    function getOwnPropertyNames(O) {
      return objectKeysInternal(O, hiddenKeys$1)
    }

  var objectGetOwnPropertyNames = {
    f: f$3,
  }

  var f$4 = Object.getOwnPropertySymbols

  var objectGetOwnPropertySymbols = {
    f: f$4,
  }

  // all object keys, includes non-enumerable and symbols
  var ownKeys =
    getBuiltIn('Reflect', 'ownKeys') ||
    function ownKeys(it) {
      var keys = objectGetOwnPropertyNames.f(anObject(it))
      var getOwnPropertySymbols = objectGetOwnPropertySymbols.f
      return getOwnPropertySymbols
        ? keys.concat(getOwnPropertySymbols(it))
        : keys
    }

  var copyConstructorProperties = function(target, source) {
    var keys = ownKeys(source)
    var defineProperty = objectDefineProperty.f
    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      if (!has(target, key))
        defineProperty(target, key, getOwnPropertyDescriptor(source, key))
    }
  }

  var replacement = /#|\.prototype\./

  var isForced = function(feature, detection) {
    var value = data[normalize(feature)]
    return value == POLYFILL
      ? true
      : value == NATIVE
      ? false
      : typeof detection == 'function'
      ? fails(detection)
      : !!detection
  }

  var normalize = (isForced.normalize = function(string) {
    return String(string)
      .replace(replacement, '.')
      .toLowerCase()
  })

  var data = (isForced.data = {})
  var NATIVE = (isForced.NATIVE = 'N')
  var POLYFILL = (isForced.POLYFILL = 'P')

  var isForced_1 = isForced

  var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f

  /*
      options.target      - name of the target object
      options.global      - target is the global object
      options.stat        - export as static methods of target
      options.proto       - export as prototype methods of target
      options.real        - real prototype method for the `pure` version
      options.forced      - export even if the native feature is available
      options.bind        - bind methods to the target, required for the `pure` version
      options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
      options.unsafe      - use the simple assignment of property instead of delete + defineProperty
      options.sham        - add a flag to not completely full polyfills
      options.enumerable  - export as enumerable property
      options.noTargetGet - prevent calling a getter on target
    */
  var _export = function(options, source) {
    var TARGET = options.target
    var GLOBAL = options.global
    var STATIC = options.stat
    var FORCED, target, key, targetProperty, sourceProperty, descriptor
    if (GLOBAL) {
      target = global_1
    } else if (STATIC) {
      target = global_1[TARGET] || setGlobal(TARGET, {})
    } else {
      target = (global_1[TARGET] || {}).prototype
    }
    if (target)
      for (key in source) {
        sourceProperty = source[key]
        if (options.noTargetGet) {
          descriptor = getOwnPropertyDescriptor$1(target, key)
          targetProperty = descriptor && descriptor.value
        } else targetProperty = target[key]
        FORCED = isForced_1(
          GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key,
          options.forced
        )
        // contained in target
        if (!FORCED && targetProperty !== undefined) {
          if (typeof sourceProperty === typeof targetProperty) continue
          copyConstructorProperties(sourceProperty, targetProperty)
        }
        // add a flag to not completely full polyfills
        if (options.sham || (targetProperty && targetProperty.sham)) {
          createNonEnumerableProperty(sourceProperty, 'sham', true)
        }
        // extend global
        redefine(target, key, sourceProperty, options)
      }
  }

  // `IsArray` abstract operation
  // https://tc39.github.io/ecma262/#sec-isarray
  var isArray =
    Array.isArray ||
    function isArray(arg) {
      return classofRaw(arg) == 'Array'
    }

  // `ToObject` abstract operation
  // https://tc39.github.io/ecma262/#sec-toobject
  var toObject$1 = function(argument) {
    return Object(requireObjectCoercible(argument))
  }

  var createProperty = function(object, key, value) {
    var propertyKey = toPrimitive(key)
    if (propertyKey in object)
      objectDefineProperty.f(
        object,
        propertyKey,
        createPropertyDescriptor(0, value)
      )
    else object[propertyKey] = value
  }

  var nativeSymbol =
    !!Object.getOwnPropertySymbols &&
    !fails(function() {
      // Chrome 38 Symbol has incorrect toString conversion
      // eslint-disable-next-line no-undef
      return !String(Symbol())
    })

  var useSymbolAsUid =
    nativeSymbol &&
    // eslint-disable-next-line no-undef
    !Symbol.sham &&
    // eslint-disable-next-line no-undef
    typeof Symbol.iterator == 'symbol'

  var WellKnownSymbolsStore = shared('wks')
  var Symbol$1 = global_1.Symbol
  var createWellKnownSymbol = useSymbolAsUid
    ? Symbol$1
    : (Symbol$1 && Symbol$1.withoutSetter) || uid

  var wellKnownSymbol = function(name) {
    if (!has(WellKnownSymbolsStore, name)) {
      if (nativeSymbol && has(Symbol$1, name))
        WellKnownSymbolsStore[name] = Symbol$1[name]
      else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name)
    }
    return WellKnownSymbolsStore[name]
  }

  var SPECIES = wellKnownSymbol('species')

  // `ArraySpeciesCreate` abstract operation
  // https://tc39.github.io/ecma262/#sec-arrayspeciescreate
  var arraySpeciesCreate = function(originalArray, length) {
    var C
    if (isArray(originalArray)) {
      C = originalArray.constructor
      // cross-realm fallback
      if (typeof C == 'function' && (C === Array || isArray(C.prototype)))
        C = undefined
      else if (isObject(C)) {
        C = C[SPECIES]
        if (C === null) C = undefined
      }
    }
    return new (C === undefined ? Array : C)(length === 0 ? 0 : length)
  }

  var engineUserAgent = getBuiltIn('navigator', 'userAgent') || ''

  var process$1 = global_1.process
  var versions = process$1 && process$1.versions
  var v8 = versions && versions.v8
  var match, version

  if (v8) {
    match = v8.split('.')
    version = match[0] + match[1]
  } else if (engineUserAgent) {
    match = engineUserAgent.match(/Edge\/(\d+)/)
    if (!match || match[1] >= 74) {
      match = engineUserAgent.match(/Chrome\/(\d+)/)
      if (match) version = match[1]
    }
  }

  var engineV8Version = version && +version

  var SPECIES$1 = wellKnownSymbol('species')

  var arrayMethodHasSpeciesSupport = function(METHOD_NAME) {
    // We can't use this feature detection in V8 since it causes
    // deoptimization and serious performance degradation
    // https://github.com/zloirock/core-js/issues/677
    return (
      engineV8Version >= 51 ||
      !fails(function() {
        var array = []
        var constructor = (array.constructor = {})
        constructor[SPECIES$1] = function() {
          return { foo: 1 }
        }
        return array[METHOD_NAME](Boolean).foo !== 1
      })
    )
  }

  var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable')
  var MAX_SAFE_INTEGER = 0x1fffffffffffff
  var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded'

  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/679
  var IS_CONCAT_SPREADABLE_SUPPORT =
    engineV8Version >= 51 ||
    !fails(function() {
      var array = []
      array[IS_CONCAT_SPREADABLE] = false
      return array.concat()[0] !== array
    })

  var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat')

  var isConcatSpreadable = function(O) {
    if (!isObject(O)) return false
    var spreadable = O[IS_CONCAT_SPREADABLE]
    return spreadable !== undefined ? !!spreadable : isArray(O)
  }

  var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT

  // `Array.prototype.concat` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.concat
  // with adding support of @@isConcatSpreadable and @@species
  _export(
    { target: 'Array', proto: true, forced: FORCED },
    {
      concat: function concat(arg) {
        // eslint-disable-line no-unused-vars
        var O = toObject$1(this)
        var A = arraySpeciesCreate(O, 0)
        var n = 0
        var i, k, length, len, E
        for (i = -1, length = arguments.length; i < length; i++) {
          E = i === -1 ? O : arguments[i]
          if (isConcatSpreadable(E)) {
            len = toLength(E.length)
            if (n + len > MAX_SAFE_INTEGER)
              throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED)
            for (k = 0; k < len; k++, n++)
              if (k in E) createProperty(A, n, E[k])
          } else {
            if (n >= MAX_SAFE_INTEGER)
              throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED)
            createProperty(A, n++, E)
          }
        }
        A.length = n
        return A
      },
    }
  )

  var TO_STRING_TAG = wellKnownSymbol('toStringTag')
  var test = {}

  test[TO_STRING_TAG] = 'z'

  var toStringTagSupport = String(test) === '[object z]'

  var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag')
  // ES3 wrong here
  var CORRECT_ARGUMENTS =
    classofRaw(
      (function() {
        return arguments
      })()
    ) == 'Arguments'

  // fallback for IE11 Script Access Denied error
  var tryGet = function(it, key) {
    try {
      return it[key]
    } catch (error) {
      /* empty */
    }
  }

  // getting tag from ES6+ `Object.prototype.toString`
  var classof = toStringTagSupport
    ? classofRaw
    : function(it) {
        var O, tag, result
        return it === undefined
          ? 'Undefined'
          : it === null
          ? 'Null'
          : // @@toStringTag case
          typeof (tag = tryGet((O = Object(it)), TO_STRING_TAG$1)) == 'string'
          ? tag
          : // builtinTag case
          CORRECT_ARGUMENTS
          ? classofRaw(O)
          : // ES3 arguments fallback
          (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function'
          ? 'Arguments'
          : result
      }

  // `Object.prototype.toString` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  var objectToString = toStringTagSupport
    ? {}.toString
    : function toString() {
        return '[object ' + classof(this) + ']'
      }

  // `Object.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  if (!toStringTagSupport) {
    redefine(Object.prototype, 'toString', objectToString, { unsafe: true })
  }

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  var objectKeys =
    Object.keys ||
    function keys(O) {
      return objectKeysInternal(O, enumBugKeys)
    }

  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  var objectDefineProperties = descriptors
    ? Object.defineProperties
    : function defineProperties(O, Properties) {
        anObject(O)
        var keys = objectKeys(Properties)
        var length = keys.length
        var index = 0
        var key
        while (length > index)
          objectDefineProperty.f(O, (key = keys[index++]), Properties[key])
        return O
      }

  var html = getBuiltIn('document', 'documentElement')

  var GT = '>'
  var LT = '<'
  var PROTOTYPE = 'prototype'
  var SCRIPT = 'script'
  var IE_PROTO = sharedKey('IE_PROTO')

  var EmptyConstructor = function() {
    /* empty */
  }

  var scriptTag = function(content) {
    return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT
  }

  // Create object with fake `null` prototype: use ActiveX Object with cleared prototype
  var NullProtoObjectViaActiveX = function(activeXDocument) {
    activeXDocument.write(scriptTag(''))
    activeXDocument.close()
    var temp = activeXDocument.parentWindow.Object
    activeXDocument = null // avoid memory leak
    return temp
  }

  // Create object with fake `null` prototype: use iframe Object with cleared prototype
  var NullProtoObjectViaIFrame = function() {
    // Thrash, waste and sodomy: IE GC bug
    var iframe = documentCreateElement('iframe')
    var JS = 'java' + SCRIPT + ':'
    var iframeDocument
    iframe.style.display = 'none'
    html.appendChild(iframe)
    // https://github.com/zloirock/core-js/issues/475
    iframe.src = String(JS)
    iframeDocument = iframe.contentWindow.document
    iframeDocument.open()
    iframeDocument.write(scriptTag('document.F=Object'))
    iframeDocument.close()
    return iframeDocument.F
  }

  // Check for document.domain and active x support
  // No need to use active x approach when document.domain is not set
  // see https://github.com/es-shims/es5-shim/issues/150
  // variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
  // avoid IE GC bug
  var activeXDocument
  var NullProtoObject = function() {
    try {
      /* global ActiveXObject */
      activeXDocument = document.domain && new ActiveXObject('htmlfile')
    } catch (error) {
      /* ignore */
    }
    NullProtoObject = activeXDocument
      ? NullProtoObjectViaActiveX(activeXDocument)
      : NullProtoObjectViaIFrame()
    var length = enumBugKeys.length
    while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]]
    return NullProtoObject()
  }

  hiddenKeys[IE_PROTO] = true

  // `Object.create` method
  // https://tc39.github.io/ecma262/#sec-object.create
  var objectCreate =
    Object.create ||
    function create(O, Properties) {
      var result
      if (O !== null) {
        EmptyConstructor[PROTOTYPE] = anObject(O)
        result = new EmptyConstructor()
        EmptyConstructor[PROTOTYPE] = null
        // add "__proto__" for Object.getPrototypeOf polyfill
        result[IE_PROTO] = O
      } else result = NullProtoObject()
      return Properties === undefined
        ? result
        : objectDefineProperties(result, Properties)
    }

  var nativeGetOwnPropertyNames = objectGetOwnPropertyNames.f

  var toString$1 = {}.toString

  var windowNames =
    typeof window == 'object' && window && Object.getOwnPropertyNames
      ? Object.getOwnPropertyNames(window)
      : []

  var getWindowNames = function(it) {
    try {
      return nativeGetOwnPropertyNames(it)
    } catch (error) {
      return windowNames.slice()
    }
  }

  // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
  var f$5 = function getOwnPropertyNames(it) {
    return windowNames && toString$1.call(it) == '[object Window]'
      ? getWindowNames(it)
      : nativeGetOwnPropertyNames(toIndexedObject(it))
  }

  var objectGetOwnPropertyNamesExternal = {
    f: f$5,
  }

  var f$6 = wellKnownSymbol

  var wellKnownSymbolWrapped = {
    f: f$6,
  }

  var defineProperty = objectDefineProperty.f

  var defineWellKnownSymbol = function(NAME) {
    var Symbol = path.Symbol || (path.Symbol = {})
    if (!has(Symbol, NAME))
      defineProperty(Symbol, NAME, {
        value: wellKnownSymbolWrapped.f(NAME),
      })
  }

  var defineProperty$1 = objectDefineProperty.f

  var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag')

  var setToStringTag = function(it, TAG, STATIC) {
    if (it && !has((it = STATIC ? it : it.prototype), TO_STRING_TAG$2)) {
      defineProperty$1(it, TO_STRING_TAG$2, { configurable: true, value: TAG })
    }
  }

  var aFunction$1 = function(it) {
    if (typeof it != 'function') {
      throw TypeError(String(it) + ' is not a function')
    }
    return it
  }

  // optional / simple context binding
  var functionBindContext = function(fn, that, length) {
    aFunction$1(fn)
    if (that === undefined) return fn
    switch (length) {
      case 0:
        return function() {
          return fn.call(that)
        }
      case 1:
        return function(a) {
          return fn.call(that, a)
        }
      case 2:
        return function(a, b) {
          return fn.call(that, a, b)
        }
      case 3:
        return function(a, b, c) {
          return fn.call(that, a, b, c)
        }
    }
    return function(/* ...args */) {
      return fn.apply(that, arguments)
    }
  }

  var push = [].push

  // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
  var createMethod$1 = function(TYPE) {
    var IS_MAP = TYPE == 1
    var IS_FILTER = TYPE == 2
    var IS_SOME = TYPE == 3
    var IS_EVERY = TYPE == 4
    var IS_FIND_INDEX = TYPE == 6
    var NO_HOLES = TYPE == 5 || IS_FIND_INDEX
    return function($this, callbackfn, that, specificCreate) {
      var O = toObject$1($this)
      var self = indexedObject(O)
      var boundFunction = functionBindContext(callbackfn, that, 3)
      var length = toLength(self.length)
      var index = 0
      var create = specificCreate || arraySpeciesCreate
      var target = IS_MAP
        ? create($this, length)
        : IS_FILTER
        ? create($this, 0)
        : undefined
      var value, result
      for (; length > index; index++)
        if (NO_HOLES || index in self) {
          value = self[index]
          result = boundFunction(value, index, O)
          if (TYPE) {
            if (IS_MAP) target[index] = result
            // map
            else if (result)
              switch (TYPE) {
                case 3:
                  return true // some
                case 5:
                  return value // find
                case 6:
                  return index // findIndex
                case 2:
                  push.call(target, value) // filter
              }
            else if (IS_EVERY) return false // every
          }
        }
      return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target
    }
  }

  var arrayIteration = {
    // `Array.prototype.forEach` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
    forEach: createMethod$1(0),
    // `Array.prototype.map` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.map
    map: createMethod$1(1),
    // `Array.prototype.filter` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.filter
    filter: createMethod$1(2),
    // `Array.prototype.some` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.some
    some: createMethod$1(3),
    // `Array.prototype.every` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.every
    every: createMethod$1(4),
    // `Array.prototype.find` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    find: createMethod$1(5),
    // `Array.prototype.findIndex` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
    findIndex: createMethod$1(6),
  }

  var $forEach = arrayIteration.forEach

  var HIDDEN = sharedKey('hidden')
  var SYMBOL = 'Symbol'
  var PROTOTYPE$1 = 'prototype'
  var TO_PRIMITIVE = wellKnownSymbol('toPrimitive')
  var setInternalState = internalState.set
  var getInternalState = internalState.getterFor(SYMBOL)
  var ObjectPrototype = Object[PROTOTYPE$1]
  var $Symbol = global_1.Symbol
  var $stringify = getBuiltIn('JSON', 'stringify')
  var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f
  var nativeDefineProperty$1 = objectDefineProperty.f
  var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f
  var nativePropertyIsEnumerable$1 = objectPropertyIsEnumerable.f
  var AllSymbols = shared('symbols')
  var ObjectPrototypeSymbols = shared('op-symbols')
  var StringToSymbolRegistry = shared('string-to-symbol-registry')
  var SymbolToStringRegistry = shared('symbol-to-string-registry')
  var WellKnownSymbolsStore$1 = shared('wks')
  var QObject = global_1.QObject
  // Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
  var USE_SETTER =
    !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild

  // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
  var setSymbolDescriptor =
    descriptors &&
    fails(function() {
      return (
        objectCreate(
          nativeDefineProperty$1({}, 'a', {
            get: function() {
              return nativeDefineProperty$1(this, 'a', { value: 7 }).a
            },
          })
        ).a != 7
      )
    })
      ? function(O, P, Attributes) {
          var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1(
            ObjectPrototype,
            P
          )
          if (ObjectPrototypeDescriptor) delete ObjectPrototype[P]
          nativeDefineProperty$1(O, P, Attributes)
          if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
            nativeDefineProperty$1(
              ObjectPrototype,
              P,
              ObjectPrototypeDescriptor
            )
          }
        }
      : nativeDefineProperty$1

  var wrap = function(tag, description) {
    var symbol = (AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]))
    setInternalState(symbol, {
      type: SYMBOL,
      tag: tag,
      description: description,
    })
    if (!descriptors) symbol.description = description
    return symbol
  }

  var isSymbol = useSymbolAsUid
    ? function(it) {
        return typeof it == 'symbol'
      }
    : function(it) {
        return Object(it) instanceof $Symbol
      }

  var $defineProperty = function defineProperty(O, P, Attributes) {
    if (O === ObjectPrototype)
      $defineProperty(ObjectPrototypeSymbols, P, Attributes)
    anObject(O)
    var key = toPrimitive(P, true)
    anObject(Attributes)
    if (has(AllSymbols, key)) {
      if (!Attributes.enumerable) {
        if (!has(O, HIDDEN))
          nativeDefineProperty$1(O, HIDDEN, createPropertyDescriptor(1, {}))
        O[HIDDEN][key] = true
      } else {
        if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false
        Attributes = objectCreate(Attributes, {
          enumerable: createPropertyDescriptor(0, false),
        })
      }
      return setSymbolDescriptor(O, key, Attributes)
    }
    return nativeDefineProperty$1(O, key, Attributes)
  }

  var $defineProperties = function defineProperties(O, Properties) {
    anObject(O)
    var properties = toIndexedObject(Properties)
    var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties))
    $forEach(keys, function(key) {
      if (!descriptors || $propertyIsEnumerable.call(properties, key))
        $defineProperty(O, key, properties[key])
    })
    return O
  }

  var $create = function create(O, Properties) {
    return Properties === undefined
      ? objectCreate(O)
      : $defineProperties(objectCreate(O), Properties)
  }

  var $propertyIsEnumerable = function propertyIsEnumerable(V) {
    var P = toPrimitive(V, true)
    var enumerable = nativePropertyIsEnumerable$1.call(this, P)
    if (
      this === ObjectPrototype &&
      has(AllSymbols, P) &&
      !has(ObjectPrototypeSymbols, P)
    )
      return false
    return enumerable ||
      !has(this, P) ||
      !has(AllSymbols, P) ||
      (has(this, HIDDEN) && this[HIDDEN][P])
      ? enumerable
      : true
  }

  var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
    var it = toIndexedObject(O)
    var key = toPrimitive(P, true)
    if (
      it === ObjectPrototype &&
      has(AllSymbols, key) &&
      !has(ObjectPrototypeSymbols, key)
    )
      return
    var descriptor = nativeGetOwnPropertyDescriptor$1(it, key)
    if (
      descriptor &&
      has(AllSymbols, key) &&
      !(has(it, HIDDEN) && it[HIDDEN][key])
    ) {
      descriptor.enumerable = true
    }
    return descriptor
  }

  var $getOwnPropertyNames = function getOwnPropertyNames(O) {
    var names = nativeGetOwnPropertyNames$1(toIndexedObject(O))
    var result = []
    $forEach(names, function(key) {
      if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key)
    })
    return result
  }

  var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
    var IS_OBJECT_PROTOTYPE = O === ObjectPrototype
    var names = nativeGetOwnPropertyNames$1(
      IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O)
    )
    var result = []
    $forEach(names, function(key) {
      if (
        has(AllSymbols, key) &&
        (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))
      ) {
        result.push(AllSymbols[key])
      }
    })
    return result
  }

  // `Symbol` constructor
  // https://tc39.github.io/ecma262/#sec-symbol-constructor
  if (!nativeSymbol) {
    $Symbol = function Symbol() {
      if (this instanceof $Symbol)
        throw TypeError('Symbol is not a constructor')
      var description =
        !arguments.length || arguments[0] === undefined
          ? undefined
          : String(arguments[0])
      var tag = uid(description)
      var setter = function(value) {
        if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value)
        if (has(this, HIDDEN) && has(this[HIDDEN], tag))
          this[HIDDEN][tag] = false
        setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value))
      }
      if (descriptors && USE_SETTER)
        setSymbolDescriptor(ObjectPrototype, tag, {
          configurable: true,
          set: setter,
        })
      return wrap(tag, description)
    }

    redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
      return getInternalState(this).tag
    })

    redefine($Symbol, 'withoutSetter', function(description) {
      return wrap(uid(description), description)
    })

    objectPropertyIsEnumerable.f = $propertyIsEnumerable
    objectDefineProperty.f = $defineProperty
    objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor
    objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames
    objectGetOwnPropertySymbols.f = $getOwnPropertySymbols

    wellKnownSymbolWrapped.f = function(name) {
      return wrap(wellKnownSymbol(name), name)
    }

    if (descriptors) {
      // https://github.com/tc39/proposal-Symbol-description
      nativeDefineProperty$1($Symbol[PROTOTYPE$1], 'description', {
        configurable: true,
        get: function description() {
          return getInternalState(this).description
        },
      })
      {
        redefine(
          ObjectPrototype,
          'propertyIsEnumerable',
          $propertyIsEnumerable,
          { unsafe: true }
        )
      }
    }
  }

  _export(
    { global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol },
    {
      Symbol: $Symbol,
    }
  )

  $forEach(objectKeys(WellKnownSymbolsStore$1), function(name) {
    defineWellKnownSymbol(name)
  })

  _export(
    { target: SYMBOL, stat: true, forced: !nativeSymbol },
    {
      // `Symbol.for` method
      // https://tc39.github.io/ecma262/#sec-symbol.for
      for: function(key) {
        var string = String(key)
        if (has(StringToSymbolRegistry, string))
          return StringToSymbolRegistry[string]
        var symbol = $Symbol(string)
        StringToSymbolRegistry[string] = symbol
        SymbolToStringRegistry[symbol] = string
        return symbol
      },
      // `Symbol.keyFor` method
      // https://tc39.github.io/ecma262/#sec-symbol.keyfor
      keyFor: function keyFor(sym) {
        if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol')
        if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym]
      },
      useSetter: function() {
        USE_SETTER = true
      },
      useSimple: function() {
        USE_SETTER = false
      },
    }
  )

  _export(
    { target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors },
    {
      // `Object.create` method
      // https://tc39.github.io/ecma262/#sec-object.create
      create: $create,
      // `Object.defineProperty` method
      // https://tc39.github.io/ecma262/#sec-object.defineproperty
      defineProperty: $defineProperty,
      // `Object.defineProperties` method
      // https://tc39.github.io/ecma262/#sec-object.defineproperties
      defineProperties: $defineProperties,
      // `Object.getOwnPropertyDescriptor` method
      // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
      getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
    }
  )

  _export(
    { target: 'Object', stat: true, forced: !nativeSymbol },
    {
      // `Object.getOwnPropertyNames` method
      // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
      getOwnPropertyNames: $getOwnPropertyNames,
      // `Object.getOwnPropertySymbols` method
      // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
      getOwnPropertySymbols: $getOwnPropertySymbols,
    }
  )

  // Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
  // https://bugs.chromium.org/p/v8/issues/detail?id=3443
  _export(
    {
      target: 'Object',
      stat: true,
      forced: fails(function() {
        objectGetOwnPropertySymbols.f(1)
      }),
    },
    {
      getOwnPropertySymbols: function getOwnPropertySymbols(it) {
        return objectGetOwnPropertySymbols.f(toObject$1(it))
      },
    }
  )

  // `JSON.stringify` method behavior with symbols
  // https://tc39.github.io/ecma262/#sec-json.stringify
  if ($stringify) {
    var FORCED_JSON_STRINGIFY =
      !nativeSymbol ||
      fails(function() {
        var symbol = $Symbol()
        // MS Edge converts symbol values to JSON as {}
        return (
          $stringify([symbol]) != '[null]' ||
          // WebKit converts symbol values to JSON as null
          $stringify({ a: symbol }) != '{}' ||
          // V8 throws on boxed symbols
          $stringify(Object(symbol)) != '{}'
        )
      })

    _export(
      { target: 'JSON', stat: true, forced: FORCED_JSON_STRINGIFY },
      {
        // eslint-disable-next-line no-unused-vars
        stringify: function stringify(it, replacer, space) {
          var args = [it]
          var index = 1
          var $replacer
          while (arguments.length > index) args.push(arguments[index++])
          $replacer = replacer
          if ((!isObject(replacer) && it === undefined) || isSymbol(it)) return // IE8 returns string on undefined
          if (!isArray(replacer))
            replacer = function(key, value) {
              if (typeof $replacer == 'function')
                value = $replacer.call(this, key, value)
              if (!isSymbol(value)) return value
            }
          args[1] = replacer
          return $stringify.apply(null, args)
        },
      }
    )
  }

  // `Symbol.prototype[@@toPrimitive]` method
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
  if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) {
    createNonEnumerableProperty(
      $Symbol[PROTOTYPE$1],
      TO_PRIMITIVE,
      $Symbol[PROTOTYPE$1].valueOf
    )
  }
  // `Symbol.prototype[@@toStringTag]` property
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
  setToStringTag($Symbol, SYMBOL)

  hiddenKeys[HIDDEN] = true

  // `Symbol.asyncIterator` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.asynciterator
  defineWellKnownSymbol('asyncIterator')

  var defineProperty$2 = objectDefineProperty.f

  var NativeSymbol = global_1.Symbol

  if (
    descriptors &&
    typeof NativeSymbol == 'function' &&
    (!('description' in NativeSymbol.prototype) ||
      // Safari 12 bug
      NativeSymbol().description !== undefined)
  ) {
    var EmptyStringDescriptionStore = {}
    // wrap Symbol constructor for correct work with undefined description
    var SymbolWrapper = function Symbol() {
      var description =
        arguments.length < 1 || arguments[0] === undefined
          ? undefined
          : String(arguments[0])
      var result =
        this instanceof SymbolWrapper
          ? new NativeSymbol(description)
          : // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
          description === undefined
          ? NativeSymbol()
          : NativeSymbol(description)
      if (description === '') EmptyStringDescriptionStore[result] = true
      return result
    }
    copyConstructorProperties(SymbolWrapper, NativeSymbol)
    var symbolPrototype = (SymbolWrapper.prototype = NativeSymbol.prototype)
    symbolPrototype.constructor = SymbolWrapper

    var symbolToString = symbolPrototype.toString
    var native = String(NativeSymbol('test')) == 'Symbol(test)'
    var regexp = /^Symbol\((.*)\)[^)]+$/
    defineProperty$2(symbolPrototype, 'description', {
      configurable: true,
      get: function description() {
        var symbol = isObject(this) ? this.valueOf() : this
        var string = symbolToString.call(symbol)
        if (has(EmptyStringDescriptionStore, symbol)) return ''
        var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1')
        return desc === '' ? undefined : desc
      },
    })

    _export(
      { global: true, forced: true },
      {
        Symbol: SymbolWrapper,
      }
    )
  }

  // `Symbol.hasInstance` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.hasinstance
  defineWellKnownSymbol('hasInstance')

  // `Symbol.isConcatSpreadable` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.isconcatspreadable
  defineWellKnownSymbol('isConcatSpreadable')

  // `Symbol.iterator` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.iterator
  defineWellKnownSymbol('iterator')

  // `Symbol.match` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.match
  defineWellKnownSymbol('match')

  // `Symbol.matchAll` well-known symbol
  defineWellKnownSymbol('matchAll')

  // `Symbol.replace` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.replace
  defineWellKnownSymbol('replace')

  // `Symbol.search` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.search
  defineWellKnownSymbol('search')

  // `Symbol.species` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.species
  defineWellKnownSymbol('species')

  // `Symbol.split` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.split
  defineWellKnownSymbol('split')

  // `Symbol.toPrimitive` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.toprimitive
  defineWellKnownSymbol('toPrimitive')

  // `Symbol.toStringTag` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.tostringtag
  defineWellKnownSymbol('toStringTag')

  // `Symbol.unscopables` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.unscopables
  defineWellKnownSymbol('unscopables')

  // Math[@@toStringTag] property
  // https://tc39.github.io/ecma262/#sec-math-@@tostringtag
  setToStringTag(Math, 'Math', true)

  // JSON[@@toStringTag] property
  // https://tc39.github.io/ecma262/#sec-json-@@tostringtag
  setToStringTag(global_1.JSON, 'JSON', true)

  var symbol = path.Symbol

  // `Symbol.asyncDispose` well-known symbol
  // https://github.com/tc39/proposal-using-statement
  defineWellKnownSymbol('asyncDispose')

  // `Symbol.dispose` well-known symbol
  // https://github.com/tc39/proposal-using-statement
  defineWellKnownSymbol('dispose')

  // `Symbol.observable` well-known symbol
  // https://github.com/tc39/proposal-observable
  defineWellKnownSymbol('observable')

  // `Symbol.patternMatch` well-known symbol
  // https://github.com/tc39/proposal-pattern-matching
  defineWellKnownSymbol('patternMatch')

  // TODO: remove from `core-js@4`

  defineWellKnownSymbol('replaceAll')

  // `String.prototype.{ codePointAt, at }` methods implementation
  var createMethod$2 = function(CONVERT_TO_STRING) {
    return function($this, pos) {
      var S = String(requireObjectCoercible($this))
      var position = toInteger(pos)
      var size = S.length
      var first, second
      if (position < 0 || position >= size)
        return CONVERT_TO_STRING ? '' : undefined
      first = S.charCodeAt(position)
      return first < 0xd800 ||
        first > 0xdbff ||
        position + 1 === size ||
        (second = S.charCodeAt(position + 1)) < 0xdc00 ||
        second > 0xdfff
        ? CONVERT_TO_STRING
          ? S.charAt(position)
          : first
        : CONVERT_TO_STRING
        ? S.slice(position, position + 2)
        : ((first - 0xd800) << 10) + (second - 0xdc00) + 0x10000
    }
  }

  var stringMultibyte = {
    // `String.prototype.codePointAt` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
    codeAt: createMethod$2(false),
    // `String.prototype.at` method
    // https://github.com/mathiasbynens/String.prototype.at
    charAt: createMethod$2(true),
  }

  var correctPrototypeGetter = !fails(function() {
    function F() {
      /* empty */
    }
    F.prototype.constructor = null
    return Object.getPrototypeOf(new F()) !== F.prototype
  })

  var IE_PROTO$1 = sharedKey('IE_PROTO')
  var ObjectPrototype$1 = Object.prototype

  // `Object.getPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.getprototypeof
  var objectGetPrototypeOf = correctPrototypeGetter
    ? Object.getPrototypeOf
    : function(O) {
        O = toObject$1(O)
        if (has(O, IE_PROTO$1)) return O[IE_PROTO$1]
        if (typeof O.constructor == 'function' && O instanceof O.constructor) {
          return O.constructor.prototype
        }
        return O instanceof Object ? ObjectPrototype$1 : null
      }

  var ITERATOR = wellKnownSymbol('iterator')
  var BUGGY_SAFARI_ITERATORS = false

  var returnThis = function() {
    return this
  }

  // `%IteratorPrototype%` object
  // https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
  var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator

  if ([].keys) {
    arrayIterator = [].keys()
    // Safari 8 has buggy iterators w/o `next`
    if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true
    else {
      PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(
        objectGetPrototypeOf(arrayIterator)
      )
      if (PrototypeOfArrayIteratorPrototype !== Object.prototype)
        IteratorPrototype = PrototypeOfArrayIteratorPrototype
    }
  }

  if (IteratorPrototype == undefined) IteratorPrototype = {}

  // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
  if (!has(IteratorPrototype, ITERATOR)) {
    createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis)
  }

  var iteratorsCore = {
    IteratorPrototype: IteratorPrototype,
    BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS,
  }

  var iterators = {}

  var IteratorPrototype$1 = iteratorsCore.IteratorPrototype

  var returnThis$1 = function() {
    return this
  }

  var createIteratorConstructor = function(IteratorConstructor, NAME, next) {
    var TO_STRING_TAG = NAME + ' Iterator'
    IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, {
      next: createPropertyDescriptor(1, next),
    })
    setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true)
    iterators[TO_STRING_TAG] = returnThis$1
    return IteratorConstructor
  }

  var aPossiblePrototype = function(it) {
    if (!isObject(it) && it !== null) {
      throw TypeError("Can't set " + String(it) + ' as a prototype')
    }
    return it
  }

  // `Object.setPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.setprototypeof
  // Works with __proto__ only. Old v8 can't work with null proto objects.
  /* eslint-disable no-proto */
  var objectSetPrototypeOf =
    Object.setPrototypeOf ||
    ('__proto__' in {}
      ? (function() {
          var CORRECT_SETTER = false
          var test = {}
          var setter
          try {
            setter = Object.getOwnPropertyDescriptor(
              Object.prototype,
              '__proto__'
            ).set
            setter.call(test, [])
            CORRECT_SETTER = test instanceof Array
          } catch (error) {
            /* empty */
          }
          return function setPrototypeOf(O, proto) {
            anObject(O)
            aPossiblePrototype(proto)
            if (CORRECT_SETTER) setter.call(O, proto)
            else O.__proto__ = proto
            return O
          }
        })()
      : undefined)

  var IteratorPrototype$2 = iteratorsCore.IteratorPrototype
  var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS
  var ITERATOR$1 = wellKnownSymbol('iterator')
  var KEYS = 'keys'
  var VALUES = 'values'
  var ENTRIES = 'entries'

  var returnThis$2 = function() {
    return this
  }

  var defineIterator = function(
    Iterable,
    NAME,
    IteratorConstructor,
    next,
    DEFAULT,
    IS_SET,
    FORCED
  ) {
    createIteratorConstructor(IteratorConstructor, NAME, next)

    var getIterationMethod = function(KIND) {
      if (KIND === DEFAULT && defaultIterator) return defaultIterator
      if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype)
        return IterablePrototype[KIND]
      switch (KIND) {
        case KEYS:
          return function keys() {
            return new IteratorConstructor(this, KIND)
          }
        case VALUES:
          return function values() {
            return new IteratorConstructor(this, KIND)
          }
        case ENTRIES:
          return function entries() {
            return new IteratorConstructor(this, KIND)
          }
      }
      return function() {
        return new IteratorConstructor(this)
      }
    }

    var TO_STRING_TAG = NAME + ' Iterator'
    var INCORRECT_VALUES_NAME = false
    var IterablePrototype = Iterable.prototype
    var nativeIterator =
      IterablePrototype[ITERATOR$1] ||
      IterablePrototype['@@iterator'] ||
      (DEFAULT && IterablePrototype[DEFAULT])
    var defaultIterator =
      (!BUGGY_SAFARI_ITERATORS$1 && nativeIterator) ||
      getIterationMethod(DEFAULT)
    var anyNativeIterator =
      NAME == 'Array'
        ? IterablePrototype.entries || nativeIterator
        : nativeIterator
    var CurrentIteratorPrototype, methods, KEY

    // fix native
    if (anyNativeIterator) {
      CurrentIteratorPrototype = objectGetPrototypeOf(
        anyNativeIterator.call(new Iterable())
      )
      if (
        IteratorPrototype$2 !== Object.prototype &&
        CurrentIteratorPrototype.next
      ) {
        if (
          objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2
        ) {
          if (objectSetPrototypeOf) {
            objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2)
          } else if (
            typeof CurrentIteratorPrototype[ITERATOR$1] != 'function'
          ) {
            createNonEnumerableProperty(
              CurrentIteratorPrototype,
              ITERATOR$1,
              returnThis$2
            )
          }
        }
        // Set @@toStringTag to native iterators
        setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true)
      }
    }

    // fix Array#{values, @@iterator}.name in V8 / FF
    if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
      INCORRECT_VALUES_NAME = true
      defaultIterator = function values() {
        return nativeIterator.call(this)
      }
    }

    // define iterator
    if (IterablePrototype[ITERATOR$1] !== defaultIterator) {
      createNonEnumerableProperty(
        IterablePrototype,
        ITERATOR$1,
        defaultIterator
      )
    }
    iterators[NAME] = defaultIterator

    // export additional methods
    if (DEFAULT) {
      methods = {
        values: getIterationMethod(VALUES),
        keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
        entries: getIterationMethod(ENTRIES),
      }
      if (FORCED)
        for (KEY in methods) {
          if (
            BUGGY_SAFARI_ITERATORS$1 ||
            INCORRECT_VALUES_NAME ||
            !(KEY in IterablePrototype)
          ) {
            redefine(IterablePrototype, KEY, methods[KEY])
          }
        }
      else
        _export(
          {
            target: NAME,
            proto: true,
            forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME,
          },
          methods
        )
    }

    return methods
  }

  var charAt = stringMultibyte.charAt

  var STRING_ITERATOR = 'String Iterator'
  var setInternalState$1 = internalState.set
  var getInternalState$1 = internalState.getterFor(STRING_ITERATOR)

  // `String.prototype[@@iterator]` method
  // https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
  defineIterator(
    String,
    'String',
    function(iterated) {
      setInternalState$1(this, {
        type: STRING_ITERATOR,
        string: String(iterated),
        index: 0,
      })
      // `%StringIteratorPrototype%.next` method
      // https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
    },
    function next() {
      var state = getInternalState$1(this)
      var string = state.string
      var index = state.index
      var point
      if (index >= string.length) return { value: undefined, done: true }
      point = charAt(string, index)
      state.index += point.length
      return { value: point, done: false }
    }
  )

  // call something on iterator step with safe closing on error
  var callWithSafeIterationClosing = function(iterator, fn, value, ENTRIES) {
    try {
      return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value)
      // 7.4.6 IteratorClose(iterator, completion)
    } catch (error) {
      var returnMethod = iterator['return']
      if (returnMethod !== undefined) anObject(returnMethod.call(iterator))
      throw error
    }
  }

  var ITERATOR$2 = wellKnownSymbol('iterator')
  var ArrayPrototype = Array.prototype

  // check on default Array iterator
  var isArrayIteratorMethod = function(it) {
    return (
      it !== undefined &&
      (iterators.Array === it || ArrayPrototype[ITERATOR$2] === it)
    )
  }

  var ITERATOR$3 = wellKnownSymbol('iterator')

  var getIteratorMethod = function(it) {
    if (it != undefined)
      return it[ITERATOR$3] || it['@@iterator'] || iterators[classof(it)]
  }

  // `Array.from` method implementation
  // https://tc39.github.io/ecma262/#sec-array.from
  var arrayFrom = function from(
    arrayLike /* , mapfn = undefined, thisArg = undefined */
  ) {
    var O = toObject$1(arrayLike)
    var C = typeof this == 'function' ? this : Array
    var argumentsLength = arguments.length
    var mapfn = argumentsLength > 1 ? arguments[1] : undefined
    var mapping = mapfn !== undefined
    var iteratorMethod = getIteratorMethod(O)
    var index = 0
    var length, result, step, iterator, next, value
    if (mapping)
      mapfn = functionBindContext(
        mapfn,
        argumentsLength > 2 ? arguments[2] : undefined,
        2
      )
    // if the target is not iterable or it's an array with the default iterator - use a simple case
    if (
      iteratorMethod != undefined &&
      !(C == Array && isArrayIteratorMethod(iteratorMethod))
    ) {
      iterator = iteratorMethod.call(O)
      next = iterator.next
      result = new C()
      for (; !(step = next.call(iterator)).done; index++) {
        value = mapping
          ? callWithSafeIterationClosing(
              iterator,
              mapfn,
              [step.value, index],
              true
            )
          : step.value
        createProperty(result, index, value)
      }
    } else {
      length = toLength(O.length)
      result = new C(length)
      for (; length > index; index++) {
        value = mapping ? mapfn(O[index], index) : O[index]
        createProperty(result, index, value)
      }
    }
    result.length = index
    return result
  }

  var ITERATOR$4 = wellKnownSymbol('iterator')
  var SAFE_CLOSING = false

  try {
    var called = 0
    var iteratorWithReturn = {
      next: function() {
        return { done: !!called++ }
      },
      return: function() {
        SAFE_CLOSING = true
      },
    }
    iteratorWithReturn[ITERATOR$4] = function() {
      return this
    }
  } catch (error) {
    /* empty */
  }

  var checkCorrectnessOfIteration = function(exec, SKIP_CLOSING) {
    if (!SKIP_CLOSING && !SAFE_CLOSING) return false
    var ITERATION_SUPPORT = false
    try {
      var object = {}
      object[ITERATOR$4] = function() {
        return {
          next: function() {
            return { done: (ITERATION_SUPPORT = true) }
          },
        }
      }
      exec(object)
    } catch (error) {
      /* empty */
    }
    return ITERATION_SUPPORT
  }

  var INCORRECT_ITERATION = !checkCorrectnessOfIteration(function(iterable) {})

  // `Array.from` method
  // https://tc39.github.io/ecma262/#sec-array.from
  _export(
    { target: 'Array', stat: true, forced: INCORRECT_ITERATION },
    {
      from: arrayFrom,
    }
  )

  var from_1 = path.Array.from

  if (typeof Promise === 'undefined') {
    // Rejection tracking prevents a common issue where React gets into an
    // inconsistent state due to an error, but it gets swallowed by a Promise,
    // and the user has no idea what causes React's erratic future behavior.
    rejectionTracking.enable()
    self.Promise = es6Extensions
  }

  // Object.assign() is commonly used with React.
  // It will use the native implementation if it's present and isn't buggy.
  Object.assign = objectAssign

  var freezing = !fails(function() {
    return Object.isExtensible(Object.preventExtensions({}))
  })

  var internalMetadata = createCommonjsModule(function(module) {
    var defineProperty = objectDefineProperty.f

    var METADATA = uid('meta')
    var id = 0

    var isExtensible =
      Object.isExtensible ||
      function() {
        return true
      }

    var setMetadata = function(it) {
      defineProperty(it, METADATA, {
        value: {
          objectID: 'O' + ++id, // object ID
          weakData: {}, // weak collections IDs
        },
      })
    }

    var fastKey = function(it, create) {
      // return a primitive with prefix
      if (!isObject(it))
        return typeof it == 'symbol'
          ? it
          : (typeof it == 'string' ? 'S' : 'P') + it
      if (!has(it, METADATA)) {
        // can't set metadata to uncaught frozen object
        if (!isExtensible(it)) return 'F'
        // not necessary to add metadata
        if (!create) return 'E'
        // add missing metadata
        setMetadata(it)
        // return object ID
      }
      return it[METADATA].objectID
    }

    var getWeakData = function(it, create) {
      if (!has(it, METADATA)) {
        // can't set metadata to uncaught frozen object
        if (!isExtensible(it)) return true
        // not necessary to add metadata
        if (!create) return false
        // add missing metadata
        setMetadata(it)
        // return the store of weak collections IDs
      }
      return it[METADATA].weakData
    }

    // add metadata on freeze-family methods calling
    var onFreeze = function(it) {
      if (freezing && meta.REQUIRED && isExtensible(it) && !has(it, METADATA))
        setMetadata(it)
      return it
    }

    var meta = (module.exports = {
      REQUIRED: false,
      fastKey: fastKey,
      getWeakData: getWeakData,
      onFreeze: onFreeze,
    })

    hiddenKeys[METADATA] = true
  })
  var internalMetadata_1 = internalMetadata.REQUIRED
  var internalMetadata_2 = internalMetadata.fastKey
  var internalMetadata_3 = internalMetadata.getWeakData
  var internalMetadata_4 = internalMetadata.onFreeze

  var iterate_1 = createCommonjsModule(function(module) {
    var Result = function(stopped, result) {
      this.stopped = stopped
      this.result = result
    }

    var iterate = (module.exports = function(
      iterable,
      fn,
      that,
      AS_ENTRIES,
      IS_ITERATOR
    ) {
      var boundFunction = functionBindContext(fn, that, AS_ENTRIES ? 2 : 1)
      var iterator, iterFn, index, length, result, next, step

      if (IS_ITERATOR) {
        iterator = iterable
      } else {
        iterFn = getIteratorMethod(iterable)
        if (typeof iterFn != 'function')
          throw TypeError('Target is not iterable')
        // optimisation for array iterators
        if (isArrayIteratorMethod(iterFn)) {
          for (
            index = 0, length = toLength(iterable.length);
            length > index;
            index++
          ) {
            result = AS_ENTRIES
              ? boundFunction(anObject((step = iterable[index]))[0], step[1])
              : boundFunction(iterable[index])
            if (result && result instanceof Result) return result
          }
          return new Result(false)
        }
        iterator = iterFn.call(iterable)
      }

      next = iterator.next
      while (!(step = next.call(iterator)).done) {
        result = callWithSafeIterationClosing(
          iterator,
          boundFunction,
          step.value,
          AS_ENTRIES
        )
        if (typeof result == 'object' && result && result instanceof Result)
          return result
      }
      return new Result(false)
    })

    iterate.stop = function(result) {
      return new Result(true, result)
    }
  })

  var anInstance = function(it, Constructor, name) {
    if (!(it instanceof Constructor)) {
      throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation')
    }
    return it
  }

  // makes subclassing work correct for wrapped built-ins
  var inheritIfRequired = function($this, dummy, Wrapper) {
    var NewTarget, NewTargetPrototype
    if (
      // it can work only with native `setPrototypeOf`
      objectSetPrototypeOf &&
      // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
      typeof (NewTarget = dummy.constructor) == 'function' &&
      NewTarget !== Wrapper &&
      isObject((NewTargetPrototype = NewTarget.prototype)) &&
      NewTargetPrototype !== Wrapper.prototype
    )
      objectSetPrototypeOf($this, NewTargetPrototype)
    return $this
  }

  var collection = function(CONSTRUCTOR_NAME, wrapper, common) {
    var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1
    var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1
    var ADDER = IS_MAP ? 'set' : 'add'
    var NativeConstructor = global_1[CONSTRUCTOR_NAME]
    var NativePrototype = NativeConstructor && NativeConstructor.prototype
    var Constructor = NativeConstructor
    var exported = {}

    var fixMethod = function(KEY) {
      var nativeMethod = NativePrototype[KEY]
      redefine(
        NativePrototype,
        KEY,
        KEY == 'add'
          ? function add(value) {
              nativeMethod.call(this, value === 0 ? 0 : value)
              return this
            }
          : KEY == 'delete'
          ? function(key) {
              return IS_WEAK && !isObject(key)
                ? false
                : nativeMethod.call(this, key === 0 ? 0 : key)
            }
          : KEY == 'get'
          ? function get(key) {
              return IS_WEAK && !isObject(key)
                ? undefined
                : nativeMethod.call(this, key === 0 ? 0 : key)
            }
          : KEY == 'has'
          ? function has(key) {
              return IS_WEAK && !isObject(key)
                ? false
                : nativeMethod.call(this, key === 0 ? 0 : key)
            }
          : function set(key, value) {
              nativeMethod.call(this, key === 0 ? 0 : key, value)
              return this
            }
      )
    }

    // eslint-disable-next-line max-len
    if (
      isForced_1(
        CONSTRUCTOR_NAME,
        typeof NativeConstructor != 'function' ||
          !(
            IS_WEAK ||
            (NativePrototype.forEach &&
              !fails(function() {
                new NativeConstructor().entries().next()
              }))
          )
      )
    ) {
      // create collection constructor
      Constructor = common.getConstructor(
        wrapper,
        CONSTRUCTOR_NAME,
        IS_MAP,
        ADDER
      )
      internalMetadata.REQUIRED = true
    } else if (isForced_1(CONSTRUCTOR_NAME, true)) {
      var instance = new Constructor()
      // early implementations not supports chaining
      var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance
      // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
      var THROWS_ON_PRIMITIVES = fails(function() {
        instance.has(1)
      })
      // most early implementations doesn't supports iterables, most modern - not close it correctly
      // eslint-disable-next-line no-new
      var ACCEPT_ITERABLES = checkCorrectnessOfIteration(function(iterable) {
        new NativeConstructor(iterable)
      })
      // for early implementations -0 and +0 not the same
      var BUGGY_ZERO =
        !IS_WEAK &&
        fails(function() {
          // V8 ~ Chromium 42- fails only with 5+ elements
          var $instance = new NativeConstructor()
          var index = 5
          while (index--) $instance[ADDER](index, index)
          return !$instance.has(-0)
        })

      if (!ACCEPT_ITERABLES) {
        Constructor = wrapper(function(dummy, iterable) {
          anInstance(dummy, Constructor, CONSTRUCTOR_NAME)
          var that = inheritIfRequired(
            new NativeConstructor(),
            dummy,
            Constructor
          )
          if (iterable != undefined)
            iterate_1(iterable, that[ADDER], that, IS_MAP)
          return that
        })
        Constructor.prototype = NativePrototype
        NativePrototype.constructor = Constructor
      }

      if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
        fixMethod('delete')
        fixMethod('has')
        IS_MAP && fixMethod('get')
      }

      if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER)

      // weak collections should not contains .clear method
      if (IS_WEAK && NativePrototype.clear) delete NativePrototype.clear
    }

    exported[CONSTRUCTOR_NAME] = Constructor
    _export(
      { global: true, forced: Constructor != NativeConstructor },
      exported
    )

    setToStringTag(Constructor, CONSTRUCTOR_NAME)

    if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP)

    return Constructor
  }

  var redefineAll = function(target, src, options) {
    for (var key in src) redefine(target, key, src[key], options)
    return target
  }

  var SPECIES$2 = wellKnownSymbol('species')

  var setSpecies = function(CONSTRUCTOR_NAME) {
    var Constructor = getBuiltIn(CONSTRUCTOR_NAME)
    var defineProperty = objectDefineProperty.f

    if (descriptors && Constructor && !Constructor[SPECIES$2]) {
      defineProperty(Constructor, SPECIES$2, {
        configurable: true,
        get: function() {
          return this
        },
      })
    }
  }

  var defineProperty$3 = objectDefineProperty.f

  var fastKey = internalMetadata.fastKey

  var setInternalState$2 = internalState.set
  var internalStateGetterFor = internalState.getterFor

  var collectionStrong = {
    getConstructor: function(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
      var C = wrapper(function(that, iterable) {
        anInstance(that, C, CONSTRUCTOR_NAME)
        setInternalState$2(that, {
          type: CONSTRUCTOR_NAME,
          index: objectCreate(null),
          first: undefined,
          last: undefined,
          size: 0,
        })
        if (!descriptors) that.size = 0
        if (iterable != undefined)
          iterate_1(iterable, that[ADDER], that, IS_MAP)
      })

      var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME)

      var define = function(that, key, value) {
        var state = getInternalState(that)
        var entry = getEntry(that, key)
        var previous, index
        // change existing entry
        if (entry) {
          entry.value = value
          // create new entry
        } else {
          state.last = entry = {
            index: (index = fastKey(key, true)),
            key: key,
            value: value,
            previous: (previous = state.last),
            next: undefined,
            removed: false,
          }
          if (!state.first) state.first = entry
          if (previous) previous.next = entry
          if (descriptors) state.size++
          else that.size++
          // add to index
          if (index !== 'F') state.index[index] = entry
        }
        return that
      }

      var getEntry = function(that, key) {
        var state = getInternalState(that)
        // fast case
        var index = fastKey(key)
        var entry
        if (index !== 'F') return state.index[index]
        // frozen object case
        for (entry = state.first; entry; entry = entry.next) {
          if (entry.key == key) return entry
        }
      }

      redefineAll(C.prototype, {
        // 23.1.3.1 Map.prototype.clear()
        // 23.2.3.2 Set.prototype.clear()
        clear: function clear() {
          var that = this
          var state = getInternalState(that)
          var data = state.index
          var entry = state.first
          while (entry) {
            entry.removed = true
            if (entry.previous) entry.previous = entry.previous.next = undefined
            delete data[entry.index]
            entry = entry.next
          }
          state.first = state.last = undefined
          if (descriptors) state.size = 0
          else that.size = 0
        },
        // 23.1.3.3 Map.prototype.delete(key)
        // 23.2.3.4 Set.prototype.delete(value)
        delete: function(key) {
          var that = this
          var state = getInternalState(that)
          var entry = getEntry(that, key)
          if (entry) {
            var next = entry.next
            var prev = entry.previous
            delete state.index[entry.index]
            entry.removed = true
            if (prev) prev.next = next
            if (next) next.previous = prev
            if (state.first == entry) state.first = next
            if (state.last == entry) state.last = prev
            if (descriptors) state.size--
            else that.size--
          }
          return !!entry
        },
        // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
        // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
        forEach: function forEach(callbackfn /* , that = undefined */) {
          var state = getInternalState(this)
          var boundFunction = functionBindContext(
            callbackfn,
            arguments.length > 1 ? arguments[1] : undefined,
            3
          )
          var entry
          while ((entry = entry ? entry.next : state.first)) {
            boundFunction(entry.value, entry.key, this)
            // revert to the last existing entry
            while (entry && entry.removed) entry = entry.previous
          }
        },
        // 23.1.3.7 Map.prototype.has(key)
        // 23.2.3.7 Set.prototype.has(value)
        has: function has(key) {
          return !!getEntry(this, key)
        },
      })

      redefineAll(
        C.prototype,
        IS_MAP
          ? {
              // 23.1.3.6 Map.prototype.get(key)
              get: function get(key) {
                var entry = getEntry(this, key)
                return entry && entry.value
              },
              // 23.1.3.9 Map.prototype.set(key, value)
              set: function set(key, value) {
                return define(this, key === 0 ? 0 : key, value)
              },
            }
          : {
              // 23.2.3.1 Set.prototype.add(value)
              add: function add(value) {
                return define(this, (value = value === 0 ? 0 : value), value)
              },
            }
      )
      if (descriptors)
        defineProperty$3(C.prototype, 'size', {
          get: function() {
            return getInternalState(this).size
          },
        })
      return C
    },
    setStrong: function(C, CONSTRUCTOR_NAME, IS_MAP) {
      var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator'
      var getInternalCollectionState = internalStateGetterFor(CONSTRUCTOR_NAME)
      var getInternalIteratorState = internalStateGetterFor(ITERATOR_NAME)
      // add .keys, .values, .entries, [@@iterator]
      // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
      defineIterator(
        C,
        CONSTRUCTOR_NAME,
        function(iterated, kind) {
          setInternalState$2(this, {
            type: ITERATOR_NAME,
            target: iterated,
            state: getInternalCollectionState(iterated),
            kind: kind,
            last: undefined,
          })
        },
        function() {
          var state = getInternalIteratorState(this)
          var kind = state.kind
          var entry = state.last
          // revert to the last existing entry
          while (entry && entry.removed) entry = entry.previous
          // get next entry
          if (
            !state.target ||
            !(state.last = entry = entry ? entry.next : state.state.first)
          ) {
            // or finish the iteration
            state.target = undefined
            return { value: undefined, done: true }
          }
          // return step by kind
          if (kind == 'keys') return { value: entry.key, done: false }
          if (kind == 'values') return { value: entry.value, done: false }
          return { value: [entry.key, entry.value], done: false }
        },
        IS_MAP ? 'entries' : 'values',
        !IS_MAP,
        true
      )

      // add [@@species], 23.1.2.2, 23.2.2.2
      setSpecies(CONSTRUCTOR_NAME)
    },
  }

  // `Map` constructor
  // https://tc39.github.io/ecma262/#sec-map-objects
  var es_map = collection(
    'Map',
    function(init) {
      return function Map() {
        return init(this, arguments.length ? arguments[0] : undefined)
      }
    },
    collectionStrong
  )

  // iterable DOM collections
  // flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
  var domIterables = {
    CSSRuleList: 0,
    CSSStyleDeclaration: 0,
    CSSValueList: 0,
    ClientRectList: 0,
    DOMRectList: 0,
    DOMStringList: 0,
    DOMTokenList: 1,
    DataTransferItemList: 0,
    FileList: 0,
    HTMLAllCollection: 0,
    HTMLCollection: 0,
    HTMLFormElement: 0,
    HTMLSelectElement: 0,
    MediaList: 0,
    MimeTypeArray: 0,
    NamedNodeMap: 0,
    NodeList: 1,
    PaintRequestList: 0,
    Plugin: 0,
    PluginArray: 0,
    SVGLengthList: 0,
    SVGNumberList: 0,
    SVGPathSegList: 0,
    SVGPointList: 0,
    SVGStringList: 0,
    SVGTransformList: 0,
    SourceBufferList: 0,
    StyleSheetList: 0,
    TextTrackCueList: 0,
    TextTrackList: 0,
    TouchList: 0,
  }

  var UNSCOPABLES = wellKnownSymbol('unscopables')
  var ArrayPrototype$1 = Array.prototype

  // Array.prototype[@@unscopables]
  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  if (ArrayPrototype$1[UNSCOPABLES] == undefined) {
    objectDefineProperty.f(ArrayPrototype$1, UNSCOPABLES, {
      configurable: true,
      value: objectCreate(null),
    })
  }

  // add a key to Array.prototype[@@unscopables]
  var addToUnscopables = function(key) {
    ArrayPrototype$1[UNSCOPABLES][key] = true
  }

  var ARRAY_ITERATOR = 'Array Iterator'
  var setInternalState$3 = internalState.set
  var getInternalState$2 = internalState.getterFor(ARRAY_ITERATOR)

  // `Array.prototype.entries` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.entries
  // `Array.prototype.keys` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.keys
  // `Array.prototype.values` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.values
  // `Array.prototype[@@iterator]` method
  // https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
  // `CreateArrayIterator` internal method
  // https://tc39.github.io/ecma262/#sec-createarrayiterator
  var es_array_iterator = defineIterator(
    Array,
    'Array',
    function(iterated, kind) {
      setInternalState$3(this, {
        type: ARRAY_ITERATOR,
        target: toIndexedObject(iterated), // target
        index: 0, // next index
        kind: kind, // kind
      })
      // `%ArrayIteratorPrototype%.next` method
      // https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
    },
    function() {
      var state = getInternalState$2(this)
      var target = state.target
      var kind = state.kind
      var index = state.index++
      if (!target || index >= target.length) {
        state.target = undefined
        return { value: undefined, done: true }
      }
      if (kind == 'keys') return { value: index, done: false }
      if (kind == 'values') return { value: target[index], done: false }
      return { value: [index, target[index]], done: false }
    },
    'values'
  )

  // argumentsList[@@iterator] is %ArrayProto_values%
  // https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
  // https://tc39.github.io/ecma262/#sec-createmappedargumentsobject
  iterators.Arguments = iterators.Array

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables('keys')
  addToUnscopables('values')
  addToUnscopables('entries')

  var ITERATOR$5 = wellKnownSymbol('iterator')
  var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag')
  var ArrayValues = es_array_iterator.values

  for (var COLLECTION_NAME in domIterables) {
    var Collection = global_1[COLLECTION_NAME]
    var CollectionPrototype = Collection && Collection.prototype
    if (CollectionPrototype) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[ITERATOR$5] !== ArrayValues)
        try {
          createNonEnumerableProperty(
            CollectionPrototype,
            ITERATOR$5,
            ArrayValues
          )
        } catch (error) {
          CollectionPrototype[ITERATOR$5] = ArrayValues
        }
      if (!CollectionPrototype[TO_STRING_TAG$3]) {
        createNonEnumerableProperty(
          CollectionPrototype,
          TO_STRING_TAG$3,
          COLLECTION_NAME
        )
      }
      if (domIterables[COLLECTION_NAME])
        for (var METHOD_NAME in es_array_iterator) {
          // some Chrome versions have non-configurable methods on DOMTokenList
          if (
            CollectionPrototype[METHOD_NAME] !== es_array_iterator[METHOD_NAME]
          )
            try {
              createNonEnumerableProperty(
                CollectionPrototype,
                METHOD_NAME,
                es_array_iterator[METHOD_NAME]
              )
            } catch (error) {
              CollectionPrototype[METHOD_NAME] = es_array_iterator[METHOD_NAME]
            }
        }
    }
  }

  var map = path.Map

  // https://tc39.github.io/proposal-setmap-offrom/

  var collectionFrom = function from(source /* , mapFn, thisArg */) {
    var length = arguments.length
    var mapFn = length > 1 ? arguments[1] : undefined
    var mapping, A, n, boundFunction
    aFunction$1(this)
    mapping = mapFn !== undefined
    if (mapping) aFunction$1(mapFn)
    if (source == undefined) return new this()
    A = []
    if (mapping) {
      n = 0
      boundFunction = functionBindContext(
        mapFn,
        length > 2 ? arguments[2] : undefined,
        2
      )
      iterate_1(source, function(nextItem) {
        A.push(boundFunction(nextItem, n++))
      })
    } else {
      iterate_1(source, A.push, A)
    }
    return new this(A)
  }

  // `Map.from` method
  // https://tc39.github.io/proposal-setmap-offrom/#sec-map.from
  _export(
    { target: 'Map', stat: true },
    {
      from: collectionFrom,
    }
  )

  // https://tc39.github.io/proposal-setmap-offrom/
  var collectionOf = function of() {
    var length = arguments.length
    var A = new Array(length)
    while (length--) A[length] = arguments[length]
    return new this(A)
  }

  // `Map.of` method
  // https://tc39.github.io/proposal-setmap-offrom/#sec-map.of
  _export(
    { target: 'Map', stat: true },
    {
      of: collectionOf,
    }
  )

  // https://github.com/tc39/collection-methods
  var collectionDeleteAll = function(/* ...elements */) {
    var collection = anObject(this)
    var remover = aFunction$1(collection['delete'])
    var allDeleted = true
    var wasDeleted
    for (var k = 0, len = arguments.length; k < len; k++) {
      wasDeleted = remover.call(collection, arguments[k])
      allDeleted = allDeleted && wasDeleted
    }
    return !!allDeleted
  }

  // `Map.prototype.deleteAll` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      deleteAll: function deleteAll(/* ...elements */) {
        return collectionDeleteAll.apply(this, arguments)
      },
    }
  )

  var getIterator = function(it) {
    var iteratorMethod = getIteratorMethod(it)
    if (typeof iteratorMethod != 'function') {
      throw TypeError(String(it) + ' is not iterable')
    }
    return anObject(iteratorMethod.call(it))
  }

  var getMapIterator = function(it) {
    // eslint-disable-next-line no-undef
    return Map.prototype.entries.call(it)
  }

  // `Map.prototype.every` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      every: function every(callbackfn /* , thisArg */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        return !iterate_1(
          iterator,
          function(key, value) {
            if (!boundFunction(value, key, map)) return iterate_1.stop()
          },
          undefined,
          true,
          true
        ).stopped
      },
    }
  )

  var SPECIES$3 = wellKnownSymbol('species')

  // `SpeciesConstructor` abstract operation
  // https://tc39.github.io/ecma262/#sec-speciesconstructor
  var speciesConstructor = function(O, defaultConstructor) {
    var C = anObject(O).constructor
    var S
    return C === undefined || (S = anObject(C)[SPECIES$3]) == undefined
      ? defaultConstructor
      : aFunction$1(S)
  }

  // `Map.prototype.filter` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      filter: function filter(callbackfn /* , thisArg */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        var newMap = new (speciesConstructor(map, getBuiltIn('Map')))()
        var setter = aFunction$1(newMap.set)
        iterate_1(
          iterator,
          function(key, value) {
            if (boundFunction(value, key, map)) setter.call(newMap, key, value)
          },
          undefined,
          true,
          true
        )
        return newMap
      },
    }
  )

  // `Map.prototype.find` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      find: function find(callbackfn /* , thisArg */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        return iterate_1(
          iterator,
          function(key, value) {
            if (boundFunction(value, key, map)) return iterate_1.stop(value)
          },
          undefined,
          true,
          true
        ).result
      },
    }
  )

  // `Map.prototype.findKey` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      findKey: function findKey(callbackfn /* , thisArg */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        return iterate_1(
          iterator,
          function(key, value) {
            if (boundFunction(value, key, map)) return iterate_1.stop(key)
          },
          undefined,
          true,
          true
        ).result
      },
    }
  )

  // `Map.groupBy` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', stat: true },
    {
      groupBy: function groupBy(iterable, keyDerivative) {
        var newMap = new this()
        aFunction$1(keyDerivative)
        var has = aFunction$1(newMap.has)
        var get = aFunction$1(newMap.get)
        var set = aFunction$1(newMap.set)
        iterate_1(iterable, function(element) {
          var derivedKey = keyDerivative(element)
          if (!has.call(newMap, derivedKey))
            set.call(newMap, derivedKey, [element])
          else get.call(newMap, derivedKey).push(element)
        })
        return newMap
      },
    }
  )

  // `SameValueZero` abstract operation
  // https://tc39.github.io/ecma262/#sec-samevaluezero
  var sameValueZero = function(x, y) {
    // eslint-disable-next-line no-self-compare
    return x === y || (x != x && y != y)
  }

  // `Map.prototype.includes` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      includes: function includes(searchElement) {
        return iterate_1(
          getMapIterator(anObject(this)),
          function(key, value) {
            if (sameValueZero(value, searchElement)) return iterate_1.stop()
          },
          undefined,
          true,
          true
        ).stopped
      },
    }
  )

  // `Map.keyBy` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', stat: true },
    {
      keyBy: function keyBy(iterable, keyDerivative) {
        var newMap = new this()
        aFunction$1(keyDerivative)
        var setter = aFunction$1(newMap.set)
        iterate_1(iterable, function(element) {
          setter.call(newMap, keyDerivative(element), element)
        })
        return newMap
      },
    }
  )

  // `Map.prototype.includes` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      keyOf: function keyOf(searchElement) {
        return iterate_1(
          getMapIterator(anObject(this)),
          function(key, value) {
            if (value === searchElement) return iterate_1.stop(key)
          },
          undefined,
          true,
          true
        ).result
      },
    }
  )

  // `Map.prototype.mapKeys` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      mapKeys: function mapKeys(callbackfn /* , thisArg */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        var newMap = new (speciesConstructor(map, getBuiltIn('Map')))()
        var setter = aFunction$1(newMap.set)
        iterate_1(
          iterator,
          function(key, value) {
            setter.call(newMap, boundFunction(value, key, map), value)
          },
          undefined,
          true,
          true
        )
        return newMap
      },
    }
  )

  // `Map.prototype.mapValues` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      mapValues: function mapValues(callbackfn /* , thisArg */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        var newMap = new (speciesConstructor(map, getBuiltIn('Map')))()
        var setter = aFunction$1(newMap.set)
        iterate_1(
          iterator,
          function(key, value) {
            setter.call(newMap, key, boundFunction(value, key, map))
          },
          undefined,
          true,
          true
        )
        return newMap
      },
    }
  )

  // `Map.prototype.merge` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      // eslint-disable-next-line no-unused-vars
      merge: function merge(iterable /* ...iterbles */) {
        var map = anObject(this)
        var setter = aFunction$1(map.set)
        var i = 0
        while (i < arguments.length) {
          iterate_1(arguments[i++], setter, map, true)
        }
        return map
      },
    }
  )

  // `Map.prototype.reduce` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      reduce: function reduce(callbackfn /* , initialValue */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var noInitial = arguments.length < 2
        var accumulator = noInitial ? undefined : arguments[1]
        aFunction$1(callbackfn)
        iterate_1(
          iterator,
          function(key, value) {
            if (noInitial) {
              noInitial = false
              accumulator = value
            } else {
              accumulator = callbackfn(accumulator, value, key, map)
            }
          },
          undefined,
          true,
          true
        )
        if (noInitial)
          throw TypeError('Reduce of empty map with no initial value')
        return accumulator
      },
    }
  )

  // `Set.prototype.some` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      some: function some(callbackfn /* , thisArg */) {
        var map = anObject(this)
        var iterator = getMapIterator(map)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        return iterate_1(
          iterator,
          function(key, value) {
            if (boundFunction(value, key, map)) return iterate_1.stop()
          },
          undefined,
          true,
          true
        ).stopped
      },
    }
  )

  // `Set.prototype.update` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      update: function update(key, callback /* , thunk */) {
        var map = anObject(this)
        var length = arguments.length
        aFunction$1(callback)
        var isPresentInMap = map.has(key)
        if (!isPresentInMap && length < 3) {
          throw TypeError('Updating absent value')
        }
        var value = isPresentInMap
          ? map.get(key)
          : aFunction$1(length > 2 ? arguments[2] : undefined)(key, map)
        map.set(key, callback(value, key, map))
        return map
      },
    }
  )

  // `Map.prototype.upsert` method
  // https://github.com/thumbsupep/proposal-upsert
  var mapUpsert = function upsert(key, updateFn /* , insertFn */) {
    var map = anObject(this)
    var insertFn = arguments.length > 2 ? arguments[2] : undefined
    var value
    if (typeof updateFn != 'function' && typeof insertFn != 'function') {
      throw TypeError('At least one callback required')
    }
    if (map.has(key)) {
      value = map.get(key)
      if (typeof updateFn == 'function') {
        value = updateFn(value)
        map.set(key, value)
      }
    } else if (typeof insertFn == 'function') {
      value = insertFn()
      map.set(key, value)
    }
    return value
  }

  // `Map.prototype.upsert` method
  // https://github.com/thumbsupep/proposal-upsert
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      upsert: mapUpsert,
    }
  )

  // TODO: remove from `core-js@4`

  // `Map.prototype.updateOrInsert` method (replaced by `Map.prototype.upsert`)
  // https://github.com/thumbsupep/proposal-upsert
  _export(
    { target: 'Map', proto: true, real: true, forced: isPure },
    {
      updateOrInsert: mapUpsert,
    }
  )

  // `Set` constructor
  // https://tc39.github.io/ecma262/#sec-set-objects
  var es_set = collection(
    'Set',
    function(init) {
      return function Set() {
        return init(this, arguments.length ? arguments[0] : undefined)
      }
    },
    collectionStrong
  )

  var set$1 = path.Set

  // `Set.from` method
  // https://tc39.github.io/proposal-setmap-offrom/#sec-set.from
  _export(
    { target: 'Set', stat: true },
    {
      from: collectionFrom,
    }
  )

  // `Set.of` method
  // https://tc39.github.io/proposal-setmap-offrom/#sec-set.of
  _export(
    { target: 'Set', stat: true },
    {
      of: collectionOf,
    }
  )

  // https://github.com/tc39/collection-methods
  var collectionAddAll = function(/* ...elements */) {
    var set = anObject(this)
    var adder = aFunction$1(set.add)
    for (var k = 0, len = arguments.length; k < len; k++) {
      adder.call(set, arguments[k])
    }
    return set
  }

  // `Set.prototype.addAll` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      addAll: function addAll(/* ...elements */) {
        return collectionAddAll.apply(this, arguments)
      },
    }
  )

  // `Set.prototype.deleteAll` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      deleteAll: function deleteAll(/* ...elements */) {
        return collectionDeleteAll.apply(this, arguments)
      },
    }
  )

  var getSetIterator = function(it) {
    // eslint-disable-next-line no-undef
    return Set.prototype.values.call(it)
  }

  // `Set.prototype.every` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      every: function every(callbackfn /* , thisArg */) {
        var set = anObject(this)
        var iterator = getSetIterator(set)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        return !iterate_1(
          iterator,
          function(value) {
            if (!boundFunction(value, value, set)) return iterate_1.stop()
          },
          undefined,
          false,
          true
        ).stopped
      },
    }
  )

  // `Set.prototype.difference` method
  // https://github.com/tc39/proposal-set-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      difference: function difference(iterable) {
        var set = anObject(this)
        var newSet = new (speciesConstructor(set, getBuiltIn('Set')))(set)
        var remover = aFunction$1(newSet['delete'])
        iterate_1(iterable, function(value) {
          remover.call(newSet, value)
        })
        return newSet
      },
    }
  )

  // `Set.prototype.filter` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      filter: function filter(callbackfn /* , thisArg */) {
        var set = anObject(this)
        var iterator = getSetIterator(set)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        var newSet = new (speciesConstructor(set, getBuiltIn('Set')))()
        var adder = aFunction$1(newSet.add)
        iterate_1(
          iterator,
          function(value) {
            if (boundFunction(value, value, set)) adder.call(newSet, value)
          },
          undefined,
          false,
          true
        )
        return newSet
      },
    }
  )

  // `Set.prototype.find` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      find: function find(callbackfn /* , thisArg */) {
        var set = anObject(this)
        var iterator = getSetIterator(set)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        return iterate_1(
          iterator,
          function(value) {
            if (boundFunction(value, value, set)) return iterate_1.stop(value)
          },
          undefined,
          false,
          true
        ).result
      },
    }
  )

  // `Set.prototype.intersection` method
  // https://github.com/tc39/proposal-set-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      intersection: function intersection(iterable) {
        var set = anObject(this)
        var newSet = new (speciesConstructor(set, getBuiltIn('Set')))()
        var hasCheck = aFunction$1(set.has)
        var adder = aFunction$1(newSet.add)
        iterate_1(iterable, function(value) {
          if (hasCheck.call(set, value)) adder.call(newSet, value)
        })
        return newSet
      },
    }
  )

  // `Set.prototype.isDisjointFrom` method
  // https://tc39.github.io/proposal-set-methods/#Set.prototype.isDisjointFrom
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      isDisjointFrom: function isDisjointFrom(iterable) {
        var set = anObject(this)
        var hasCheck = aFunction$1(set.has)
        return !iterate_1(iterable, function(value) {
          if (hasCheck.call(set, value) === true) return iterate_1.stop()
        }).stopped
      },
    }
  )

  // `Set.prototype.isSubsetOf` method
  // https://tc39.github.io/proposal-set-methods/#Set.prototype.isSubsetOf
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      isSubsetOf: function isSubsetOf(iterable) {
        var iterator = getIterator(this)
        var otherSet = anObject(iterable)
        var hasCheck = otherSet.has
        if (typeof hasCheck != 'function') {
          otherSet = new (getBuiltIn('Set'))(iterable)
          hasCheck = aFunction$1(otherSet.has)
        }
        return !iterate_1(
          iterator,
          function(value) {
            if (hasCheck.call(otherSet, value) === false)
              return iterate_1.stop()
          },
          undefined,
          false,
          true
        ).stopped
      },
    }
  )

  // `Set.prototype.isSupersetOf` method
  // https://tc39.github.io/proposal-set-methods/#Set.prototype.isSupersetOf
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      isSupersetOf: function isSupersetOf(iterable) {
        var set = anObject(this)
        var hasCheck = aFunction$1(set.has)
        return !iterate_1(iterable, function(value) {
          if (hasCheck.call(set, value) === false) return iterate_1.stop()
        }).stopped
      },
    }
  )

  // `Set.prototype.join` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      join: function join(separator) {
        var set = anObject(this)
        var iterator = getSetIterator(set)
        var sep = separator === undefined ? ',' : String(separator)
        var result = []
        iterate_1(iterator, result.push, result, false, true)
        return result.join(sep)
      },
    }
  )

  // `Set.prototype.map` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      map: function map(callbackfn /* , thisArg */) {
        var set = anObject(this)
        var iterator = getSetIterator(set)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        var newSet = new (speciesConstructor(set, getBuiltIn('Set')))()
        var adder = aFunction$1(newSet.add)
        iterate_1(
          iterator,
          function(value) {
            adder.call(newSet, boundFunction(value, value, set))
          },
          undefined,
          false,
          true
        )
        return newSet
      },
    }
  )

  // `Set.prototype.reduce` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      reduce: function reduce(callbackfn /* , initialValue */) {
        var set = anObject(this)
        var iterator = getSetIterator(set)
        var noInitial = arguments.length < 2
        var accumulator = noInitial ? undefined : arguments[1]
        aFunction$1(callbackfn)
        iterate_1(
          iterator,
          function(value) {
            if (noInitial) {
              noInitial = false
              accumulator = value
            } else {
              accumulator = callbackfn(accumulator, value, value, set)
            }
          },
          undefined,
          false,
          true
        )
        if (noInitial)
          throw TypeError('Reduce of empty set with no initial value')
        return accumulator
      },
    }
  )

  // `Set.prototype.some` method
  // https://github.com/tc39/proposal-collection-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      some: function some(callbackfn /* , thisArg */) {
        var set = anObject(this)
        var iterator = getSetIterator(set)
        var boundFunction = functionBindContext(
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        return iterate_1(
          iterator,
          function(value) {
            if (boundFunction(value, value, set)) return iterate_1.stop()
          },
          undefined,
          false,
          true
        ).stopped
      },
    }
  )

  // `Set.prototype.symmetricDifference` method
  // https://github.com/tc39/proposal-set-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      symmetricDifference: function symmetricDifference(iterable) {
        var set = anObject(this)
        var newSet = new (speciesConstructor(set, getBuiltIn('Set')))(set)
        var remover = aFunction$1(newSet['delete'])
        var adder = aFunction$1(newSet.add)
        iterate_1(iterable, function(value) {
          remover.call(newSet, value) || adder.call(newSet, value)
        })
        return newSet
      },
    }
  )

  // `Set.prototype.union` method
  // https://github.com/tc39/proposal-set-methods
  _export(
    { target: 'Set', proto: true, real: true, forced: isPure },
    {
      union: function union(iterable) {
        var set = anObject(this)
        var newSet = new (speciesConstructor(set, getBuiltIn('Set')))(set)
        iterate_1(iterable, aFunction$1(newSet.add), newSet)
        return newSet
      },
    }
  )

  var performanceNow = createCommonjsModule(function(module) {
    // Generated by CoffeeScript 1.12.2
    ;(function() {
      var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime

      if (
        typeof performance !== 'undefined' &&
        performance !== null &&
        performance.now
      ) {
        module.exports = function() {
          return performance.now()
        }
      } else if (
        typeof process !== 'undefined' &&
        process !== null &&
        process.hrtime
      ) {
        module.exports = function() {
          return (getNanoSeconds() - nodeLoadTime) / 1e6
        }
        hrtime = process.hrtime
        getNanoSeconds = function() {
          var hr
          hr = hrtime()
          return hr[0] * 1e9 + hr[1]
        }
        moduleLoadTime = getNanoSeconds()
        upTime = process.uptime() * 1e9
        nodeLoadTime = moduleLoadTime - upTime
      } else if (Date.now) {
        module.exports = function() {
          return Date.now() - loadTime
        }
        loadTime = Date.now()
      } else {
        module.exports = function() {
          return new Date().getTime() - loadTime
        }
        loadTime = new Date().getTime()
      }
    }.call(commonjsGlobal))
  })

  var root = typeof window === 'undefined' ? commonjsGlobal : window,
    vendors = ['moz', 'webkit'],
    suffix = 'AnimationFrame',
    raf = root['request' + suffix],
    caf = root['cancel' + suffix] || root['cancelRequest' + suffix]

  for (var i = 0; !raf && i < vendors.length; i++) {
    raf = root[vendors[i] + 'Request' + suffix]
    caf =
      root[vendors[i] + 'Cancel' + suffix] ||
      root[vendors[i] + 'CancelRequest' + suffix]
  }

  // Some versions of FF have rAF but not cAF
  if (!raf || !caf) {
    var last = 0,
      id$1 = 0,
      queue$1 = [],
      frameDuration = 1000 / 60

    raf = function(callback) {
      if (queue$1.length === 0) {
        var _now = performanceNow(),
          next = Math.max(0, frameDuration - (_now - last))
        last = next + _now
        setTimeout(function() {
          var cp = queue$1.slice(0)
          // Clear queue here to prevent
          // callbacks from appending listeners
          // to the current frame's queue
          queue$1.length = 0
          for (var i = 0; i < cp.length; i++) {
            if (!cp[i].cancelled) {
              try {
                cp[i].callback(last)
              } catch (e) {
                setTimeout(function() {
                  throw e
                }, 0)
              }
            }
          }
        }, Math.round(next))
      }
      queue$1.push({
        handle: ++id$1,
        callback: callback,
        cancelled: false,
      })
      return id$1
    }

    caf = function(handle) {
      for (var i = 0; i < queue$1.length; i++) {
        if (queue$1[i].handle === handle) {
          queue$1[i].cancelled = true
        }
      }
    }
  }

  var raf_1 = function(fn) {
    // Wrap in a new function to prevent
    // `cancel` potentially being assigned
    // to the native rAF function
    return raf.call(root, fn)
  }
  var cancel = function() {
    caf.apply(root, arguments)
  }
  var polyfill = function(object) {
    if (!object) {
      object = root
    }
    object.requestAnimationFrame = raf
    object.cancelAnimationFrame = caf
  }
  raf_1.cancel = cancel
  raf_1.polyfill = polyfill

  // React 16+ relies on Map, Set, and requestAnimationFrame

  raf_1.polyfill()

  var nativeAssign = Object.assign
  var defineProperty$4 = Object.defineProperty

  // `Object.assign` method
  // https://tc39.github.io/ecma262/#sec-object.assign
  var objectAssign$1 =
    !nativeAssign ||
    fails(function() {
      // should have correct order of operations (Edge bug)
      if (
        descriptors &&
        nativeAssign(
          { b: 1 },
          nativeAssign(
            defineProperty$4({}, 'a', {
              enumerable: true,
              get: function() {
                defineProperty$4(this, 'b', {
                  value: 3,
                  enumerable: false,
                })
              },
            }),
            { b: 2 }
          )
        ).b !== 1
      )
        return true
      // should work with symbols and should have deterministic property order (V8 bug)
      var A = {}
      var B = {}
      // eslint-disable-next-line no-undef
      var symbol = Symbol()
      var alphabet = 'abcdefghijklmnopqrst'
      A[symbol] = 7
      alphabet.split('').forEach(function(chr) {
        B[chr] = chr
      })
      return (
        nativeAssign({}, A)[symbol] != 7 ||
        objectKeys(nativeAssign({}, B)).join('') != alphabet
      )
    })
      ? function assign(target, source) {
          // eslint-disable-line no-unused-vars
          var T = toObject$1(target)
          var argumentsLength = arguments.length
          var index = 1
          var getOwnPropertySymbols = objectGetOwnPropertySymbols.f
          var propertyIsEnumerable = objectPropertyIsEnumerable.f
          while (argumentsLength > index) {
            var S = indexedObject(arguments[index++])
            var keys = getOwnPropertySymbols
              ? objectKeys(S).concat(getOwnPropertySymbols(S))
              : objectKeys(S)
            var length = keys.length
            var j = 0
            var key
            while (length > j) {
              key = keys[j++]
              if (!descriptors || propertyIsEnumerable.call(S, key))
                T[key] = S[key]
            }
          }
          return T
        }
      : nativeAssign

  // `Object.assign` method
  // https://tc39.github.io/ecma262/#sec-object.assign
  _export(
    { target: 'Object', stat: true, forced: Object.assign !== objectAssign$1 },
    {
      assign: objectAssign$1,
    }
  )

  // `Object.create` method
  // https://tc39.github.io/ecma262/#sec-object.create
  _export(
    { target: 'Object', stat: true, sham: !descriptors },
    {
      create: objectCreate,
    }
  )

  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  _export(
    { target: 'Object', stat: true, forced: !descriptors, sham: !descriptors },
    {
      defineProperty: objectDefineProperty.f,
    }
  )

  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  _export(
    { target: 'Object', stat: true, forced: !descriptors, sham: !descriptors },
    {
      defineProperties: objectDefineProperties,
    }
  )

  var propertyIsEnumerable = objectPropertyIsEnumerable.f

  // `Object.{ entries, values }` methods implementation
  var createMethod$3 = function(TO_ENTRIES) {
    return function(it) {
      var O = toIndexedObject(it)
      var keys = objectKeys(O)
      var length = keys.length
      var i = 0
      var result = []
      var key
      while (length > i) {
        key = keys[i++]
        if (!descriptors || propertyIsEnumerable.call(O, key)) {
          result.push(TO_ENTRIES ? [key, O[key]] : O[key])
        }
      }
      return result
    }
  }

  var objectToArray = {
    // `Object.entries` method
    // https://tc39.github.io/ecma262/#sec-object.entries
    entries: createMethod$3(true),
    // `Object.values` method
    // https://tc39.github.io/ecma262/#sec-object.values
    values: createMethod$3(false),
  }

  var $entries = objectToArray.entries

  // `Object.entries` method
  // https://tc39.github.io/ecma262/#sec-object.entries
  _export(
    { target: 'Object', stat: true },
    {
      entries: function entries(O) {
        return $entries(O)
      },
    }
  )

  var onFreeze = internalMetadata.onFreeze

  var nativeFreeze = Object.freeze
  var FAILS_ON_PRIMITIVES = fails(function() {
    nativeFreeze(1)
  })

  // `Object.freeze` method
  // https://tc39.github.io/ecma262/#sec-object.freeze
  _export(
    {
      target: 'Object',
      stat: true,
      forced: FAILS_ON_PRIMITIVES,
      sham: !freezing,
    },
    {
      freeze: function freeze(it) {
        return nativeFreeze && isObject(it) ? nativeFreeze(onFreeze(it)) : it
      },
    }
  )

  // `Object.fromEntries` method
  // https://github.com/tc39/proposal-object-from-entries
  _export(
    { target: 'Object', stat: true },
    {
      fromEntries: function fromEntries(iterable) {
        var obj = {}
        iterate_1(
          iterable,
          function(k, v) {
            createProperty(obj, k, v)
          },
          undefined,
          true
        )
        return obj
      },
    }
  )

  var nativeGetOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f

  var FAILS_ON_PRIMITIVES$1 = fails(function() {
    nativeGetOwnPropertyDescriptor$2(1)
  })
  var FORCED$1 = !descriptors || FAILS_ON_PRIMITIVES$1

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
  _export(
    { target: 'Object', stat: true, forced: FORCED$1, sham: !descriptors },
    {
      getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
        return nativeGetOwnPropertyDescriptor$2(toIndexedObject(it), key)
      },
    }
  )

  // `Object.getOwnPropertyDescriptors` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
  _export(
    { target: 'Object', stat: true, sham: !descriptors },
    {
      getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
        var O = toIndexedObject(object)
        var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f
        var keys = ownKeys(O)
        var result = {}
        var index = 0
        var key, descriptor
        while (keys.length > index) {
          descriptor = getOwnPropertyDescriptor(O, (key = keys[index++]))
          if (descriptor !== undefined) createProperty(result, key, descriptor)
        }
        return result
      },
    }
  )

  var nativeGetOwnPropertyNames$2 = objectGetOwnPropertyNamesExternal.f

  var FAILS_ON_PRIMITIVES$2 = fails(function() {
    return !Object.getOwnPropertyNames(1)
  })

  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  _export(
    { target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$2 },
    {
      getOwnPropertyNames: nativeGetOwnPropertyNames$2,
    }
  )

  var FAILS_ON_PRIMITIVES$3 = fails(function() {
    objectGetPrototypeOf(1)
  })

  // `Object.getPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.getprototypeof
  _export(
    {
      target: 'Object',
      stat: true,
      forced: FAILS_ON_PRIMITIVES$3,
      sham: !correctPrototypeGetter,
    },
    {
      getPrototypeOf: function getPrototypeOf(it) {
        return objectGetPrototypeOf(toObject$1(it))
      },
    }
  )

  // `SameValue` abstract operation
  // https://tc39.github.io/ecma262/#sec-samevalue
  var sameValue =
    Object.is ||
    function is(x, y) {
      // eslint-disable-next-line no-self-compare
      return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y
    }

  // `Object.is` method
  // https://tc39.github.io/ecma262/#sec-object.is
  _export(
    { target: 'Object', stat: true },
    {
      is: sameValue,
    }
  )

  var nativeIsExtensible = Object.isExtensible
  var FAILS_ON_PRIMITIVES$4 = fails(function() {})

  // `Object.isExtensible` method
  // https://tc39.github.io/ecma262/#sec-object.isextensible
  _export(
    { target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$4 },
    {
      isExtensible: function isExtensible(it) {
        return isObject(it)
          ? nativeIsExtensible
            ? nativeIsExtensible(it)
            : true
          : false
      },
    }
  )

  var nativeIsFrozen = Object.isFrozen
  var FAILS_ON_PRIMITIVES$5 = fails(function() {})

  // `Object.isFrozen` method
  // https://tc39.github.io/ecma262/#sec-object.isfrozen
  _export(
    { target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$5 },
    {
      isFrozen: function isFrozen(it) {
        return isObject(it)
          ? nativeIsFrozen
            ? nativeIsFrozen(it)
            : false
          : true
      },
    }
  )

  var nativeIsSealed = Object.isSealed
  var FAILS_ON_PRIMITIVES$6 = fails(function() {})

  // `Object.isSealed` method
  // https://tc39.github.io/ecma262/#sec-object.issealed
  _export(
    { target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$6 },
    {
      isSealed: function isSealed(it) {
        return isObject(it)
          ? nativeIsSealed
            ? nativeIsSealed(it)
            : false
          : true
      },
    }
  )

  var FAILS_ON_PRIMITIVES$7 = fails(function() {
    objectKeys(1)
  })

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  _export(
    { target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$7 },
    {
      keys: function keys(it) {
        return objectKeys(toObject$1(it))
      },
    }
  )

  var onFreeze$1 = internalMetadata.onFreeze

  var nativePreventExtensions = Object.preventExtensions
  var FAILS_ON_PRIMITIVES$8 = fails(function() {
    nativePreventExtensions(1)
  })

  // `Object.preventExtensions` method
  // https://tc39.github.io/ecma262/#sec-object.preventextensions
  _export(
    {
      target: 'Object',
      stat: true,
      forced: FAILS_ON_PRIMITIVES$8,
      sham: !freezing,
    },
    {
      preventExtensions: function preventExtensions(it) {
        return nativePreventExtensions && isObject(it)
          ? nativePreventExtensions(onFreeze$1(it))
          : it
      },
    }
  )

  var onFreeze$2 = internalMetadata.onFreeze

  var nativeSeal = Object.seal
  var FAILS_ON_PRIMITIVES$9 = fails(function() {
    nativeSeal(1)
  })

  // `Object.seal` method
  // https://tc39.github.io/ecma262/#sec-object.seal
  _export(
    {
      target: 'Object',
      stat: true,
      forced: FAILS_ON_PRIMITIVES$9,
      sham: !freezing,
    },
    {
      seal: function seal(it) {
        return nativeSeal && isObject(it) ? nativeSeal(onFreeze$2(it)) : it
      },
    }
  )

  // `Object.setPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.setprototypeof
  _export(
    { target: 'Object', stat: true },
    {
      setPrototypeOf: objectSetPrototypeOf,
    }
  )

  var $values = objectToArray.values

  // `Object.values` method
  // https://tc39.github.io/ecma262/#sec-object.values
  _export(
    { target: 'Object', stat: true },
    {
      values: function values(O) {
        return $values(O)
      },
    }
  )

  // Forced replacement object prototype accessors methods
  var objectPrototypeAccessorsForced = !fails(function() {
    var key = Math.random()
    // In FF throws only define methods
    // eslint-disable-next-line no-undef, no-useless-call
    __defineSetter__.call(null, key, function() {
      /* empty */
    })
    delete global_1[key]
  })

  // `Object.prototype.__defineGetter__` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.__defineGetter__
  if (descriptors) {
    _export(
      { target: 'Object', proto: true, forced: objectPrototypeAccessorsForced },
      {
        __defineGetter__: function __defineGetter__(P, getter) {
          objectDefineProperty.f(toObject$1(this), P, {
            get: aFunction$1(getter),
            enumerable: true,
            configurable: true,
          })
        },
      }
    )
  }

  // `Object.prototype.__defineSetter__` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.__defineSetter__
  if (descriptors) {
    _export(
      { target: 'Object', proto: true, forced: objectPrototypeAccessorsForced },
      {
        __defineSetter__: function __defineSetter__(P, setter) {
          objectDefineProperty.f(toObject$1(this), P, {
            set: aFunction$1(setter),
            enumerable: true,
            configurable: true,
          })
        },
      }
    )
  }

  var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f

  // `Object.prototype.__lookupGetter__` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.__lookupGetter__
  if (descriptors) {
    _export(
      { target: 'Object', proto: true, forced: objectPrototypeAccessorsForced },
      {
        __lookupGetter__: function __lookupGetter__(P) {
          var O = toObject$1(this)
          var key = toPrimitive(P, true)
          var desc
          do {
            if ((desc = getOwnPropertyDescriptor$2(O, key))) return desc.get
          } while ((O = objectGetPrototypeOf(O)))
        },
      }
    )
  }

  var getOwnPropertyDescriptor$3 = objectGetOwnPropertyDescriptor.f

  // `Object.prototype.__lookupSetter__` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.__lookupSetter__
  if (descriptors) {
    _export(
      { target: 'Object', proto: true, forced: objectPrototypeAccessorsForced },
      {
        __lookupSetter__: function __lookupSetter__(P) {
          var O = toObject$1(this)
          var key = toPrimitive(P, true)
          var desc
          do {
            if ((desc = getOwnPropertyDescriptor$3(O, key))) return desc.set
          } while ((O = objectGetPrototypeOf(O)))
        },
      }
    )
  }

  var slice = [].slice
  var factories = {}

  var construct = function(C, argsLength, args) {
    if (!(argsLength in factories)) {
      for (var list = [], i = 0; i < argsLength; i++) list[i] = 'a[' + i + ']'
      // eslint-disable-next-line no-new-func
      factories[argsLength] = Function(
        'C,a',
        'return new C(' + list.join(',') + ')'
      )
    }
    return factories[argsLength](C, args)
  }

  // `Function.prototype.bind` method implementation
  // https://tc39.github.io/ecma262/#sec-function.prototype.bind
  var functionBind =
    Function.bind ||
    function bind(that /* , ...args */) {
      var fn = aFunction$1(this)
      var partArgs = slice.call(arguments, 1)
      var boundFunction = function bound(/* args... */) {
        var args = partArgs.concat(slice.call(arguments))
        return this instanceof boundFunction
          ? construct(fn, args.length, args)
          : fn.apply(that, args)
      }
      if (isObject(fn.prototype)) boundFunction.prototype = fn.prototype
      return boundFunction
    }

  // `Function.prototype.bind` method
  // https://tc39.github.io/ecma262/#sec-function.prototype.bind
  _export(
    { target: 'Function', proto: true },
    {
      bind: functionBind,
    }
  )

  var defineProperty$5 = objectDefineProperty.f

  var FunctionPrototype = Function.prototype
  var FunctionPrototypeToString = FunctionPrototype.toString
  var nameRE = /^\s*function ([^ (]*)/
  var NAME = 'name'

  // Function instances `.name` property
  // https://tc39.github.io/ecma262/#sec-function-instances-name
  if (descriptors && !(NAME in FunctionPrototype)) {
    defineProperty$5(FunctionPrototype, NAME, {
      configurable: true,
      get: function() {
        try {
          return FunctionPrototypeToString.call(this).match(nameRE)[1]
        } catch (error) {
          return ''
        }
      },
    })
  }

  var HAS_INSTANCE = wellKnownSymbol('hasInstance')
  var FunctionPrototype$1 = Function.prototype

  // `Function.prototype[@@hasInstance]` method
  // https://tc39.github.io/ecma262/#sec-function.prototype-@@hasinstance
  if (!(HAS_INSTANCE in FunctionPrototype$1)) {
    objectDefineProperty.f(FunctionPrototype$1, HAS_INSTANCE, {
      value: function(O) {
        if (typeof this != 'function' || !isObject(O)) return false
        if (!isObject(this.prototype)) return O instanceof this
        // for environment w/o native `@@hasInstance` logic enough `instanceof`, but add this:
        while ((O = objectGetPrototypeOf(O)))
          if (this.prototype === O) return true
        return false
      },
    })
  }

  // `globalThis` object
  // https://github.com/tc39/proposal-global
  _export(
    { global: true },
    {
      globalThis: global_1,
    }
  )

  // `Array.isArray` method
  // https://tc39.github.io/ecma262/#sec-array.isarray
  _export(
    { target: 'Array', stat: true },
    {
      isArray: isArray,
    }
  )

  var ISNT_GENERIC = fails(function() {
    function F() {
      /* empty */
    }
    return !(Array.of.call(F) instanceof F)
  })

  // `Array.of` method
  // https://tc39.github.io/ecma262/#sec-array.of
  // WebKit Array.of isn't generic
  _export(
    { target: 'Array', stat: true, forced: ISNT_GENERIC },
    {
      of: function of(/* ...args */) {
        var index = 0
        var argumentsLength = arguments.length
        var result = new (typeof this == 'function' ? this : Array)(
          argumentsLength
        )
        while (argumentsLength > index)
          createProperty(result, index, arguments[index++])
        result.length = argumentsLength
        return result
      },
    }
  )

  var min$2 = Math.min

  // `Array.prototype.copyWithin` method implementation
  // https://tc39.github.io/ecma262/#sec-array.prototype.copywithin
  var arrayCopyWithin =
    [].copyWithin ||
    function copyWithin(target /* = 0 */, start /* = 0, end = @length */) {
      var O = toObject$1(this)
      var len = toLength(O.length)
      var to = toAbsoluteIndex(target, len)
      var from = toAbsoluteIndex(start, len)
      var end = arguments.length > 2 ? arguments[2] : undefined
      var count = min$2(
        (end === undefined ? len : toAbsoluteIndex(end, len)) - from,
        len - to
      )
      var inc = 1
      if (from < to && to < from + count) {
        inc = -1
        from += count - 1
        to += count - 1
      }
      while (count-- > 0) {
        if (from in O) O[to] = O[from]
        else delete O[to]
        to += inc
        from += inc
      }
      return O
    }

  // `Array.prototype.copyWithin` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.copywithin
  _export(
    { target: 'Array', proto: true },
    {
      copyWithin: arrayCopyWithin,
    }
  )

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables('copyWithin')

  var arrayMethodIsStrict = function(METHOD_NAME, argument) {
    var method = [][METHOD_NAME]
    return (
      !!method &&
      fails(function() {
        // eslint-disable-next-line no-useless-call,no-throw-literal
        method.call(
          null,
          argument ||
            function() {
              throw 1
            },
          1
        )
      })
    )
  }

  var defineProperty$6 = Object.defineProperty
  var cache = {}

  var thrower = function(it) {
    throw it
  }

  var arrayMethodUsesToLength = function(METHOD_NAME, options) {
    if (has(cache, METHOD_NAME)) return cache[METHOD_NAME]
    if (!options) options = {}
    var method = [][METHOD_NAME]
    var ACCESSORS = has(options, 'ACCESSORS') ? options.ACCESSORS : false
    var argument0 = has(options, 0) ? options[0] : thrower
    var argument1 = has(options, 1) ? options[1] : undefined

    return (cache[METHOD_NAME] =
      !!method &&
      !fails(function() {
        if (ACCESSORS && !descriptors) return true
        var O = { length: -1 }

        if (ACCESSORS)
          defineProperty$6(O, 1, { enumerable: true, get: thrower })
        else O[1] = 1

        method.call(O, argument0, argument1)
      }))
  }

  var $every = arrayIteration.every

  var STRICT_METHOD = arrayMethodIsStrict('every')
  var USES_TO_LENGTH = arrayMethodUsesToLength('every')

  // `Array.prototype.every` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.every
  _export(
    { target: 'Array', proto: true, forced: !STRICT_METHOD || !USES_TO_LENGTH },
    {
      every: function every(callbackfn /* , thisArg */) {
        return $every(
          this,
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  // `Array.prototype.fill` method implementation
  // https://tc39.github.io/ecma262/#sec-array.prototype.fill
  var arrayFill = function fill(value /* , start = 0, end = @length */) {
    var O = toObject$1(this)
    var length = toLength(O.length)
    var argumentsLength = arguments.length
    var index = toAbsoluteIndex(
      argumentsLength > 1 ? arguments[1] : undefined,
      length
    )
    var end = argumentsLength > 2 ? arguments[2] : undefined
    var endPos = end === undefined ? length : toAbsoluteIndex(end, length)
    while (endPos > index) O[index++] = value
    return O
  }

  // `Array.prototype.fill` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.fill
  _export(
    { target: 'Array', proto: true },
    {
      fill: arrayFill,
    }
  )

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables('fill')

  var $filter = arrayIteration.filter

  var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter')
  // Edge 14- issue
  var USES_TO_LENGTH$1 = arrayMethodUsesToLength('filter')

  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  // with adding support of @@species
  _export(
    {
      target: 'Array',
      proto: true,
      forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH$1,
    },
    {
      filter: function filter(callbackfn /* , thisArg */) {
        return $filter(
          this,
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  var $find = arrayIteration.find

  var FIND = 'find'
  var SKIPS_HOLES = true

  var USES_TO_LENGTH$2 = arrayMethodUsesToLength(FIND)

  // Shouldn't skip holes
  if (FIND in [])
    Array(1)[FIND](function() {
      SKIPS_HOLES = false
    })

  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  _export(
    { target: 'Array', proto: true, forced: SKIPS_HOLES || !USES_TO_LENGTH$2 },
    {
      find: function find(callbackfn /* , that = undefined */) {
        return $find(
          this,
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables(FIND)

  var $findIndex = arrayIteration.findIndex

  var FIND_INDEX = 'findIndex'
  var SKIPS_HOLES$1 = true

  var USES_TO_LENGTH$3 = arrayMethodUsesToLength(FIND_INDEX)

  // Shouldn't skip holes
  if (FIND_INDEX in [])
    Array(1)[FIND_INDEX](function() {
      SKIPS_HOLES$1 = false
    })

  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findindex
  _export(
    {
      target: 'Array',
      proto: true,
      forced: SKIPS_HOLES$1 || !USES_TO_LENGTH$3,
    },
    {
      findIndex: function findIndex(callbackfn /* , that = undefined */) {
        return $findIndex(
          this,
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables(FIND_INDEX)

  // `FlattenIntoArray` abstract operation
  // https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray
  var flattenIntoArray = function(
    target,
    original,
    source,
    sourceLen,
    start,
    depth,
    mapper,
    thisArg
  ) {
    var targetIndex = start
    var sourceIndex = 0
    var mapFn = mapper ? functionBindContext(mapper, thisArg, 3) : false
    var element

    while (sourceIndex < sourceLen) {
      if (sourceIndex in source) {
        element = mapFn
          ? mapFn(source[sourceIndex], sourceIndex, original)
          : source[sourceIndex]

        if (depth > 0 && isArray(element)) {
          targetIndex =
            flattenIntoArray(
              target,
              original,
              element,
              toLength(element.length),
              targetIndex,
              depth - 1
            ) - 1
        } else {
          if (targetIndex >= 0x1fffffffffffff)
            throw TypeError('Exceed the acceptable array length')
          target[targetIndex] = element
        }

        targetIndex++
      }
      sourceIndex++
    }
    return targetIndex
  }

  var flattenIntoArray_1 = flattenIntoArray

  // `Array.prototype.flat` method
  // https://github.com/tc39/proposal-flatMap
  _export(
    { target: 'Array', proto: true },
    {
      flat: function flat(/* depthArg = 1 */) {
        var depthArg = arguments.length ? arguments[0] : undefined
        var O = toObject$1(this)
        var sourceLen = toLength(O.length)
        var A = arraySpeciesCreate(O, 0)
        A.length = flattenIntoArray_1(
          A,
          O,
          O,
          sourceLen,
          0,
          depthArg === undefined ? 1 : toInteger(depthArg)
        )
        return A
      },
    }
  )

  // `Array.prototype.flatMap` method
  // https://github.com/tc39/proposal-flatMap
  _export(
    { target: 'Array', proto: true },
    {
      flatMap: function flatMap(callbackfn /* , thisArg */) {
        var O = toObject$1(this)
        var sourceLen = toLength(O.length)
        var A
        aFunction$1(callbackfn)
        A = arraySpeciesCreate(O, 0)
        A.length = flattenIntoArray_1(
          A,
          O,
          O,
          sourceLen,
          0,
          1,
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined
        )
        return A
      },
    }
  )

  var $forEach$1 = arrayIteration.forEach

  var STRICT_METHOD$1 = arrayMethodIsStrict('forEach')
  var USES_TO_LENGTH$4 = arrayMethodUsesToLength('forEach')

  // `Array.prototype.forEach` method implementation
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  var arrayForEach =
    !STRICT_METHOD$1 || !USES_TO_LENGTH$4
      ? function forEach(callbackfn /* , thisArg */) {
          return $forEach$1(
            this,
            callbackfn,
            arguments.length > 1 ? arguments[1] : undefined
          )
        }
      : [].forEach

  // `Array.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  _export(
    { target: 'Array', proto: true, forced: [].forEach != arrayForEach },
    {
      forEach: arrayForEach,
    }
  )

  var $includes = arrayIncludes.includes

  var USES_TO_LENGTH$5 = arrayMethodUsesToLength('indexOf', {
    ACCESSORS: true,
    1: 0,
  })

  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  _export(
    { target: 'Array', proto: true, forced: !USES_TO_LENGTH$5 },
    {
      includes: function includes(el /* , fromIndex = 0 */) {
        return $includes(
          this,
          el,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables('includes')

  var $indexOf = arrayIncludes.indexOf

  var nativeIndexOf = [].indexOf

  var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0
  var STRICT_METHOD$2 = arrayMethodIsStrict('indexOf')
  var USES_TO_LENGTH$6 = arrayMethodUsesToLength('indexOf', {
    ACCESSORS: true,
    1: 0,
  })

  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  _export(
    {
      target: 'Array',
      proto: true,
      forced: NEGATIVE_ZERO || !STRICT_METHOD$2 || !USES_TO_LENGTH$6,
    },
    {
      indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
        return NEGATIVE_ZERO
          ? // convert -0 to +0
            nativeIndexOf.apply(this, arguments) || 0
          : $indexOf(
              this,
              searchElement,
              arguments.length > 1 ? arguments[1] : undefined
            )
      },
    }
  )

  var nativeJoin = [].join

  var ES3_STRINGS = indexedObject != Object
  var STRICT_METHOD$3 = arrayMethodIsStrict('join', ',')

  // `Array.prototype.join` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.join
  _export(
    { target: 'Array', proto: true, forced: ES3_STRINGS || !STRICT_METHOD$3 },
    {
      join: function join(separator) {
        return nativeJoin.call(
          toIndexedObject(this),
          separator === undefined ? ',' : separator
        )
      },
    }
  )

  var min$3 = Math.min
  var nativeLastIndexOf = [].lastIndexOf
  var NEGATIVE_ZERO$1 = !!nativeLastIndexOf && 1 / [1].lastIndexOf(1, -0) < 0
  var STRICT_METHOD$4 = arrayMethodIsStrict('lastIndexOf')
  // For preventing possible almost infinite loop in non-standard implementations, test the forward version of the method
  var USES_TO_LENGTH$7 = arrayMethodUsesToLength('indexOf', {
    ACCESSORS: true,
    1: 0,
  })
  var FORCED$2 = NEGATIVE_ZERO$1 || !STRICT_METHOD$4 || !USES_TO_LENGTH$7

  // `Array.prototype.lastIndexOf` method implementation
  // https://tc39.github.io/ecma262/#sec-array.prototype.lastindexof
  var arrayLastIndexOf = FORCED$2
    ? function lastIndexOf(searchElement /* , fromIndex = @[*-1] */) {
        // convert -0 to +0
        if (NEGATIVE_ZERO$1)
          return nativeLastIndexOf.apply(this, arguments) || 0
        var O = toIndexedObject(this)
        var length = toLength(O.length)
        var index = length - 1
        if (arguments.length > 1) index = min$3(index, toInteger(arguments[1]))
        if (index < 0) index = length + index
        for (; index >= 0; index--)
          if (index in O && O[index] === searchElement) return index || 0
        return -1
      }
    : nativeLastIndexOf

  // `Array.prototype.lastIndexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.lastindexof
  _export(
    {
      target: 'Array',
      proto: true,
      forced: arrayLastIndexOf !== [].lastIndexOf,
    },
    {
      lastIndexOf: arrayLastIndexOf,
    }
  )

  var $map = arrayIteration.map

  var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('map')
  // FF49- issue
  var USES_TO_LENGTH$8 = arrayMethodUsesToLength('map')

  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  // with adding support of @@species
  _export(
    {
      target: 'Array',
      proto: true,
      forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$8,
    },
    {
      map: function map(callbackfn /* , thisArg */) {
        return $map(
          this,
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  // `Array.prototype.{ reduce, reduceRight }` methods implementation
  var createMethod$4 = function(IS_RIGHT) {
    return function(that, callbackfn, argumentsLength, memo) {
      aFunction$1(callbackfn)
      var O = toObject$1(that)
      var self = indexedObject(O)
      var length = toLength(O.length)
      var index = IS_RIGHT ? length - 1 : 0
      var i = IS_RIGHT ? -1 : 1
      if (argumentsLength < 2)
        while (true) {
          if (index in self) {
            memo = self[index]
            index += i
            break
          }
          index += i
          if (IS_RIGHT ? index < 0 : length <= index) {
            throw TypeError('Reduce of empty array with no initial value')
          }
        }
      for (; IS_RIGHT ? index >= 0 : length > index; index += i)
        if (index in self) {
          memo = callbackfn(memo, self[index], index, O)
        }
      return memo
    }
  }

  var arrayReduce = {
    // `Array.prototype.reduce` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
    left: createMethod$4(false),
    // `Array.prototype.reduceRight` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
    right: createMethod$4(true),
  }

  var $reduce = arrayReduce.left

  var STRICT_METHOD$5 = arrayMethodIsStrict('reduce')
  var USES_TO_LENGTH$9 = arrayMethodUsesToLength('reduce', { 1: 0 })

  // `Array.prototype.reduce` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  _export(
    {
      target: 'Array',
      proto: true,
      forced: !STRICT_METHOD$5 || !USES_TO_LENGTH$9,
    },
    {
      reduce: function reduce(callbackfn /* , initialValue */) {
        return $reduce(
          this,
          callbackfn,
          arguments.length,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  var $reduceRight = arrayReduce.right

  var STRICT_METHOD$6 = arrayMethodIsStrict('reduceRight')
  // For preventing possible almost infinite loop in non-standard implementations, test the forward version of the method
  var USES_TO_LENGTH$a = arrayMethodUsesToLength('reduce', { 1: 0 })

  // `Array.prototype.reduceRight` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
  _export(
    {
      target: 'Array',
      proto: true,
      forced: !STRICT_METHOD$6 || !USES_TO_LENGTH$a,
    },
    {
      reduceRight: function reduceRight(callbackfn /* , initialValue */) {
        return $reduceRight(
          this,
          callbackfn,
          arguments.length,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  var nativeReverse = [].reverse
  var test$1 = [1, 2]

  // `Array.prototype.reverse` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reverse
  // fix for Safari 12.0 bug
  // https://bugs.webkit.org/show_bug.cgi?id=188794
  _export(
    {
      target: 'Array',
      proto: true,
      forced: String(test$1) === String(test$1.reverse()),
    },
    {
      reverse: function reverse() {
        // eslint-disable-next-line no-self-assign
        if (isArray(this)) this.length = this.length
        return nativeReverse.call(this)
      },
    }
  )

  var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('slice')
  var USES_TO_LENGTH$b = arrayMethodUsesToLength('slice', {
    ACCESSORS: true,
    0: 0,
    1: 2,
  })

  var SPECIES$4 = wellKnownSymbol('species')
  var nativeSlice = [].slice
  var max$1 = Math.max

  // `Array.prototype.slice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.slice
  // fallback for not array-like ES3 strings and DOM objects
  _export(
    {
      target: 'Array',
      proto: true,
      forced: !HAS_SPECIES_SUPPORT$2 || !USES_TO_LENGTH$b,
    },
    {
      slice: function slice(start, end) {
        var O = toIndexedObject(this)
        var length = toLength(O.length)
        var k = toAbsoluteIndex(start, length)
        var fin = toAbsoluteIndex(end === undefined ? length : end, length)
        // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
        var Constructor, result, n
        if (isArray(O)) {
          Constructor = O.constructor
          // cross-realm fallback
          if (
            typeof Constructor == 'function' &&
            (Constructor === Array || isArray(Constructor.prototype))
          ) {
            Constructor = undefined
          } else if (isObject(Constructor)) {
            Constructor = Constructor[SPECIES$4]
            if (Constructor === null) Constructor = undefined
          }
          if (Constructor === Array || Constructor === undefined) {
            return nativeSlice.call(O, k, fin)
          }
        }
        result = new (Constructor === undefined ? Array : Constructor)(
          max$1(fin - k, 0)
        )
        for (n = 0; k < fin; k++, n++)
          if (k in O) createProperty(result, n, O[k])
        result.length = n
        return result
      },
    }
  )

  var $some = arrayIteration.some

  var STRICT_METHOD$7 = arrayMethodIsStrict('some')
  var USES_TO_LENGTH$c = arrayMethodUsesToLength('some')

  // `Array.prototype.some` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.some
  _export(
    {
      target: 'Array',
      proto: true,
      forced: !STRICT_METHOD$7 || !USES_TO_LENGTH$c,
    },
    {
      some: function some(callbackfn /* , thisArg */) {
        return $some(
          this,
          callbackfn,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  var test$2 = []
  var nativeSort = test$2.sort

  // IE8-
  var FAILS_ON_UNDEFINED = fails(function() {
    test$2.sort(undefined)
  })
  // V8 bug
  var FAILS_ON_NULL = fails(function() {
    test$2.sort(null)
  })
  // Old WebKit
  var STRICT_METHOD$8 = arrayMethodIsStrict('sort')

  var FORCED$3 = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || !STRICT_METHOD$8

  // `Array.prototype.sort` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.sort
  _export(
    { target: 'Array', proto: true, forced: FORCED$3 },
    {
      sort: function sort(comparefn) {
        return comparefn === undefined
          ? nativeSort.call(toObject$1(this))
          : nativeSort.call(toObject$1(this), aFunction$1(comparefn))
      },
    }
  )

  var HAS_SPECIES_SUPPORT$3 = arrayMethodHasSpeciesSupport('splice')
  var USES_TO_LENGTH$d = arrayMethodUsesToLength('splice', {
    ACCESSORS: true,
    0: 0,
    1: 2,
  })

  var max$2 = Math.max
  var min$4 = Math.min
  var MAX_SAFE_INTEGER$1 = 0x1fffffffffffff
  var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded'

  // `Array.prototype.splice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.splice
  // with adding support of @@species
  _export(
    {
      target: 'Array',
      proto: true,
      forced: !HAS_SPECIES_SUPPORT$3 || !USES_TO_LENGTH$d,
    },
    {
      splice: function splice(start, deleteCount /* , ...items */) {
        var O = toObject$1(this)
        var len = toLength(O.length)
        var actualStart = toAbsoluteIndex(start, len)
        var argumentsLength = arguments.length
        var insertCount, actualDeleteCount, A, k, from, to
        if (argumentsLength === 0) {
          insertCount = actualDeleteCount = 0
        } else if (argumentsLength === 1) {
          insertCount = 0
          actualDeleteCount = len - actualStart
        } else {
          insertCount = argumentsLength - 2
          actualDeleteCount = min$4(
            max$2(toInteger(deleteCount), 0),
            len - actualStart
          )
        }
        if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER$1) {
          throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED)
        }
        A = arraySpeciesCreate(O, actualDeleteCount)
        for (k = 0; k < actualDeleteCount; k++) {
          from = actualStart + k
          if (from in O) createProperty(A, k, O[from])
        }
        A.length = actualDeleteCount
        if (insertCount < actualDeleteCount) {
          for (k = actualStart; k < len - actualDeleteCount; k++) {
            from = k + actualDeleteCount
            to = k + insertCount
            if (from in O) O[to] = O[from]
            else delete O[to]
          }
          for (k = len; k > len - actualDeleteCount + insertCount; k--)
            delete O[k - 1]
        } else if (insertCount > actualDeleteCount) {
          for (k = len - actualDeleteCount; k > actualStart; k--) {
            from = k + actualDeleteCount - 1
            to = k + insertCount - 1
            if (from in O) O[to] = O[from]
            else delete O[to]
          }
        }
        for (k = 0; k < insertCount; k++) {
          O[k + actualStart] = arguments[k + 2]
        }
        O.length = len - actualDeleteCount + insertCount
        return A
      },
    }
  )

  // `Array[@@species]` getter
  // https://tc39.github.io/ecma262/#sec-get-array-@@species
  setSpecies('Array')

  // this method was added to unscopables after implementation
  // in popular engines, so it's moved to a separate module

  addToUnscopables('flat')

  // this method was added to unscopables after implementation
  // in popular engines, so it's moved to a separate module

  addToUnscopables('flatMap')

  var fromCharCode = String.fromCharCode
  var nativeFromCodePoint = String.fromCodePoint

  // length should be 1, old FF problem
  var INCORRECT_LENGTH =
    !!nativeFromCodePoint && nativeFromCodePoint.length != 1

  // `String.fromCodePoint` method
  // https://tc39.github.io/ecma262/#sec-string.fromcodepoint
  _export(
    { target: 'String', stat: true, forced: INCORRECT_LENGTH },
    {
      fromCodePoint: function fromCodePoint(x) {
        // eslint-disable-line no-unused-vars
        var elements = []
        var length = arguments.length
        var i = 0
        var code
        while (length > i) {
          code = +arguments[i++]
          if (toAbsoluteIndex(code, 0x10ffff) !== code)
            throw RangeError(code + ' is not a valid code point')
          elements.push(
            code < 0x10000
              ? fromCharCode(code)
              : fromCharCode(
                  ((code -= 0x10000) >> 10) + 0xd800,
                  (code % 0x400) + 0xdc00
                )
          )
        }
        return elements.join('')
      },
    }
  )

  // `String.raw` method
  // https://tc39.github.io/ecma262/#sec-string.raw
  _export(
    { target: 'String', stat: true },
    {
      raw: function raw(template) {
        var rawTemplate = toIndexedObject(template.raw)
        var literalSegments = toLength(rawTemplate.length)
        var argumentsLength = arguments.length
        var elements = []
        var i = 0
        while (literalSegments > i) {
          elements.push(String(rawTemplate[i++]))
          if (i < argumentsLength) elements.push(String(arguments[i]))
        }
        return elements.join('')
      },
    }
  )

  var codeAt = stringMultibyte.codeAt

  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  _export(
    { target: 'String', proto: true },
    {
      codePointAt: function codePointAt(pos) {
        return codeAt(this, pos)
      },
    }
  )

  var MATCH = wellKnownSymbol('match')

  // `IsRegExp` abstract operation
  // https://tc39.github.io/ecma262/#sec-isregexp
  var isRegexp = function(it) {
    var isRegExp
    return (
      isObject(it) &&
      ((isRegExp = it[MATCH]) !== undefined
        ? !!isRegExp
        : classofRaw(it) == 'RegExp')
    )
  }

  var notARegexp = function(it) {
    if (isRegexp(it)) {
      throw TypeError("The method doesn't accept regular expressions")
    }
    return it
  }

  var MATCH$1 = wellKnownSymbol('match')

  var correctIsRegexpLogic = function(METHOD_NAME) {
    var regexp = /./
    try {
      '/./'[METHOD_NAME](regexp)
    } catch (e) {
      try {
        regexp[MATCH$1] = false
        return '/./'[METHOD_NAME](regexp)
      } catch (f) {
        /* empty */
      }
    }
    return false
  }

  var getOwnPropertyDescriptor$4 = objectGetOwnPropertyDescriptor.f

  var nativeEndsWith = ''.endsWith
  var min$5 = Math.min

  var CORRECT_IS_REGEXP_LOGIC = correctIsRegexpLogic('endsWith')
  // https://github.com/zloirock/core-js/pull/702
  var MDN_POLYFILL_BUG =
    !CORRECT_IS_REGEXP_LOGIC &&
    !!(function() {
      var descriptor = getOwnPropertyDescriptor$4(String.prototype, 'endsWith')
      return descriptor && !descriptor.writable
    })()

  // `String.prototype.endsWith` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.endswith
  _export(
    {
      target: 'String',
      proto: true,
      forced: !MDN_POLYFILL_BUG && !CORRECT_IS_REGEXP_LOGIC,
    },
    {
      endsWith: function endsWith(searchString /* , endPosition = @length */) {
        var that = String(requireObjectCoercible(this))
        notARegexp(searchString)
        var endPosition = arguments.length > 1 ? arguments[1] : undefined
        var len = toLength(that.length)
        var end =
          endPosition === undefined ? len : min$5(toLength(endPosition), len)
        var search = String(searchString)
        return nativeEndsWith
          ? nativeEndsWith.call(that, search, end)
          : that.slice(end - search.length, end) === search
      },
    }
  )

  // `String.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.includes
  _export(
    {
      target: 'String',
      proto: true,
      forced: !correctIsRegexpLogic('includes'),
    },
    {
      includes: function includes(searchString /* , position = 0 */) {
        return !!~String(requireObjectCoercible(this)).indexOf(
          notARegexp(searchString),
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  // `RegExp.prototype.flags` getter implementation
  // https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
  var regexpFlags = function() {
    var that = anObject(this)
    var result = ''
    if (that.global) result += 'g'
    if (that.ignoreCase) result += 'i'
    if (that.multiline) result += 'm'
    if (that.dotAll) result += 's'
    if (that.unicode) result += 'u'
    if (that.sticky) result += 'y'
    return result
  }

  // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError,
  // so we use an intermediate function.
  function RE(s, f) {
    return RegExp(s, f)
  }

  var UNSUPPORTED_Y = fails(function() {
    // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
    var re = RE('a', 'y')
    re.lastIndex = 2
    return re.exec('abcd') != null
  })

  var BROKEN_CARET = fails(function() {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
    var re = RE('^r', 'gy')
    re.lastIndex = 2
    return re.exec('str') != null
  })

  var regexpStickyHelpers = {
    UNSUPPORTED_Y: UNSUPPORTED_Y,
    BROKEN_CARET: BROKEN_CARET,
  }

  var nativeExec = RegExp.prototype.exec
  // This always refers to the native implementation, because the
  // String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
  // which loads this file before patching the method.
  var nativeReplace = String.prototype.replace

  var patchedExec = nativeExec

  var UPDATES_LAST_INDEX_WRONG = (function() {
    var re1 = /a/
    var re2 = /b*/g
    nativeExec.call(re1, 'a')
    nativeExec.call(re2, 'a')
    return re1.lastIndex !== 0 || re2.lastIndex !== 0
  })()

  var UNSUPPORTED_Y$1 =
    regexpStickyHelpers.UNSUPPORTED_Y || regexpStickyHelpers.BROKEN_CARET

  // nonparticipating capturing group, copied from es5-shim's String#split patch.
  var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined

  var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y$1

  if (PATCH) {
    patchedExec = function exec(str) {
      var re = this
      var lastIndex, reCopy, match, i
      var sticky = UNSUPPORTED_Y$1 && re.sticky
      var flags = regexpFlags.call(re)
      var source = re.source
      var charsAdded = 0
      var strCopy = str

      if (sticky) {
        flags = flags.replace('y', '')
        if (flags.indexOf('g') === -1) {
          flags += 'g'
        }

        strCopy = String(str).slice(re.lastIndex)
        // Support anchored sticky behavior.
        if (
          re.lastIndex > 0 &&
          (!re.multiline || (re.multiline && str[re.lastIndex - 1] !== '\n'))
        ) {
          source = '(?: ' + source + ')'
          strCopy = ' ' + strCopy
          charsAdded++
        }
        // ^(? + rx + ) is needed, in combination with some str slicing, to
        // simulate the 'y' flag.
        reCopy = new RegExp('^(?:' + source + ')', flags)
      }

      if (NPCG_INCLUDED) {
        reCopy = new RegExp('^' + source + '$(?!\\s)', flags)
      }
      if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex

      match = nativeExec.call(sticky ? reCopy : re, strCopy)

      if (sticky) {
        if (match) {
          match.input = match.input.slice(charsAdded)
          match[0] = match[0].slice(charsAdded)
          match.index = re.lastIndex
          re.lastIndex += match[0].length
        } else re.lastIndex = 0
      } else if (UPDATES_LAST_INDEX_WRONG && match) {
        re.lastIndex = re.global ? match.index + match[0].length : lastIndex
      }
      if (NPCG_INCLUDED && match && match.length > 1) {
        // Fix browsers whose `exec` methods don't consistently return `undefined`
        // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
        nativeReplace.call(match[0], reCopy, function() {
          for (i = 1; i < arguments.length - 2; i++) {
            if (arguments[i] === undefined) match[i] = undefined
          }
        })
      }

      return match
    }
  }

  var regexpExec = patchedExec

  _export(
    { target: 'RegExp', proto: true, forced: /./.exec !== regexpExec },
    {
      exec: regexpExec,
    }
  )

  // TODO: Remove from `core-js@4` since it's moved to entry points

  var SPECIES$5 = wellKnownSymbol('species')

  var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function() {
    // #replace needs built-in support for named groups.
    // #match works fine because it just return the exec results, even if it has
    // a "grops" property.
    var re = /./
    re.exec = function() {
      var result = []
      result.groups = { a: '7' }
      return result
    }
    return ''.replace(re, '$<a>') !== '7'
  })

  // IE <= 11 replaces $0 with the whole match, as if it was $&
  // https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
  var REPLACE_KEEPS_$0 = (function() {
    return 'a'.replace(/./, '$0') === '$0'
  })()

  var REPLACE = wellKnownSymbol('replace')
  // Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
  var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function() {
    if (/./[REPLACE]) {
      return /./[REPLACE]('a', '$0') === ''
    }
    return false
  })()

  // Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
  // Weex JS has frozen built-in prototypes, so use try / catch wrapper
  var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function() {
    var re = /(?:)/
    var originalExec = re.exec
    re.exec = function() {
      return originalExec.apply(this, arguments)
    }
    var result = 'ab'.split(re)
    return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b'
  })

  var fixRegexpWellKnownSymbolLogic = function(KEY, length, exec, sham) {
    var SYMBOL = wellKnownSymbol(KEY)

    var DELEGATES_TO_SYMBOL = !fails(function() {
      // String methods call symbol-named RegEp methods
      var O = {}
      O[SYMBOL] = function() {
        return 7
      }
      return ''[KEY](O) != 7
    })

    var DELEGATES_TO_EXEC =
      DELEGATES_TO_SYMBOL &&
      !fails(function() {
        // Symbol-named RegExp methods call .exec
        var execCalled = false
        var re = /a/

        if (KEY === 'split') {
          // We can't use real regex here since it causes deoptimization
          // and serious performance degradation in V8
          // https://github.com/zloirock/core-js/issues/306
          re = {}
          // RegExp[@@split] doesn't call the regex's exec method, but first creates
          // a new one. We need to return the patched regex when creating the new one.
          re.constructor = {}
          re.constructor[SPECIES$5] = function() {
            return re
          }
          re.flags = ''
          re[SYMBOL] = /./[SYMBOL]
        }

        re.exec = function() {
          execCalled = true
          return null
        }

        re[SYMBOL]('')
        return !execCalled
      })

    if (
      !DELEGATES_TO_SYMBOL ||
      !DELEGATES_TO_EXEC ||
      (KEY === 'replace' &&
        !(
          REPLACE_SUPPORTS_NAMED_GROUPS &&
          REPLACE_KEEPS_$0 &&
          !REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
        )) ||
      (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
    ) {
      var nativeRegExpMethod = /./[SYMBOL]
      var methods = exec(
        SYMBOL,
        ''[KEY],
        function(nativeMethod, regexp, str, arg2, forceStringMethod) {
          if (regexp.exec === regexpExec) {
            if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
              // The native String method already delegates to @@method (this
              // polyfilled function), leasing to infinite recursion.
              // We avoid it by directly calling the native @@method method.
              return {
                done: true,
                value: nativeRegExpMethod.call(regexp, str, arg2),
              }
            }
            return { done: true, value: nativeMethod.call(str, regexp, arg2) }
          }
          return { done: false }
        },
        {
          REPLACE_KEEPS_$0: REPLACE_KEEPS_$0,
          REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE: REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE,
        }
      )
      var stringMethod = methods[0]
      var regexMethod = methods[1]

      redefine(String.prototype, KEY, stringMethod)
      redefine(
        RegExp.prototype,
        SYMBOL,
        length == 2
          ? // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
            // 21.2.5.11 RegExp.prototype[@@split](string, limit)
            function(string, arg) {
              return regexMethod.call(string, this, arg)
            }
          : // 21.2.5.6 RegExp.prototype[@@match](string)
            // 21.2.5.9 RegExp.prototype[@@search](string)
            function(string) {
              return regexMethod.call(string, this)
            }
      )
    }

    if (sham)
      createNonEnumerableProperty(RegExp.prototype[SYMBOL], 'sham', true)
  }

  var charAt$1 = stringMultibyte.charAt

  // `AdvanceStringIndex` abstract operation
  // https://tc39.github.io/ecma262/#sec-advancestringindex
  var advanceStringIndex = function(S, index, unicode) {
    return index + (unicode ? charAt$1(S, index).length : 1)
  }

  // `RegExpExec` abstract operation
  // https://tc39.github.io/ecma262/#sec-regexpexec
  var regexpExecAbstract = function(R, S) {
    var exec = R.exec
    if (typeof exec === 'function') {
      var result = exec.call(R, S)
      if (typeof result !== 'object') {
        throw TypeError(
          'RegExp exec method returned something other than an Object or null'
        )
      }
      return result
    }

    if (classofRaw(R) !== 'RegExp') {
      throw TypeError('RegExp#exec called on incompatible receiver')
    }

    return regexpExec.call(R, S)
  }

  // @@match logic
  fixRegexpWellKnownSymbolLogic('match', 1, function(
    MATCH,
    nativeMatch,
    maybeCallNative
  ) {
    return [
      // `String.prototype.match` method
      // https://tc39.github.io/ecma262/#sec-string.prototype.match
      function match(regexp) {
        var O = requireObjectCoercible(this)
        var matcher = regexp == undefined ? undefined : regexp[MATCH]
        return matcher !== undefined
          ? matcher.call(regexp, O)
          : new RegExp(regexp)[MATCH](String(O))
      },
      // `RegExp.prototype[@@match]` method
      // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@match
      function(regexp) {
        var res = maybeCallNative(nativeMatch, regexp, this)
        if (res.done) return res.value

        var rx = anObject(regexp)
        var S = String(this)

        if (!rx.global) return regexpExecAbstract(rx, S)

        var fullUnicode = rx.unicode
        rx.lastIndex = 0
        var A = []
        var n = 0
        var result
        while ((result = regexpExecAbstract(rx, S)) !== null) {
          var matchStr = String(result[0])
          A[n] = matchStr
          if (matchStr === '')
            rx.lastIndex = advanceStringIndex(
              S,
              toLength(rx.lastIndex),
              fullUnicode
            )
          n++
        }
        return n === 0 ? null : A
      },
    ]
  })

  var MATCH_ALL = wellKnownSymbol('matchAll')
  var REGEXP_STRING = 'RegExp String'
  var REGEXP_STRING_ITERATOR = REGEXP_STRING + ' Iterator'
  var setInternalState$4 = internalState.set
  var getInternalState$3 = internalState.getterFor(REGEXP_STRING_ITERATOR)
  var RegExpPrototype = RegExp.prototype
  var regExpBuiltinExec = RegExpPrototype.exec
  var nativeMatchAll = ''.matchAll

  var WORKS_WITH_NON_GLOBAL_REGEX =
    !!nativeMatchAll &&
    !fails(function() {
      'a'.matchAll(/./)
    })

  var regExpExec = function(R, S) {
    var exec = R.exec
    var result
    if (typeof exec == 'function') {
      result = exec.call(R, S)
      if (typeof result != 'object') throw TypeError('Incorrect exec result')
      return result
    }
    return regExpBuiltinExec.call(R, S)
  }

  // eslint-disable-next-line max-len
  var $RegExpStringIterator = createIteratorConstructor(
    function RegExpStringIterator(regexp, string, global, fullUnicode) {
      setInternalState$4(this, {
        type: REGEXP_STRING_ITERATOR,
        regexp: regexp,
        string: string,
        global: global,
        unicode: fullUnicode,
        done: false,
      })
    },
    REGEXP_STRING,
    function next() {
      var state = getInternalState$3(this)
      if (state.done) return { value: undefined, done: true }
      var R = state.regexp
      var S = state.string
      var match = regExpExec(R, S)
      if (match === null) return { value: undefined, done: (state.done = true) }
      if (state.global) {
        if (String(match[0]) == '')
          R.lastIndex = advanceStringIndex(
            S,
            toLength(R.lastIndex),
            state.unicode
          )
        return { value: match, done: false }
      }
      state.done = true
      return { value: match, done: false }
    }
  )

  var $matchAll = function(string) {
    var R = anObject(this)
    var S = String(string)
    var C, flagsValue, flags, matcher, global, fullUnicode
    C = speciesConstructor(R, RegExp)
    flagsValue = R.flags
    if (
      flagsValue === undefined &&
      R instanceof RegExp &&
      !('flags' in RegExpPrototype)
    ) {
      flagsValue = regexpFlags.call(R)
    }
    flags = flagsValue === undefined ? '' : String(flagsValue)
    matcher = new C(C === RegExp ? R.source : R, flags)
    global = !!~flags.indexOf('g')
    fullUnicode = !!~flags.indexOf('u')
    matcher.lastIndex = toLength(R.lastIndex)
    return new $RegExpStringIterator(matcher, S, global, fullUnicode)
  }

  // `String.prototype.matchAll` method
  // https://github.com/tc39/proposal-string-matchall
  _export(
    { target: 'String', proto: true, forced: WORKS_WITH_NON_GLOBAL_REGEX },
    {
      matchAll: function matchAll(regexp) {
        var O = requireObjectCoercible(this)
        var flags, S, matcher, rx
        if (regexp != null) {
          if (isRegexp(regexp)) {
            flags = String(
              requireObjectCoercible(
                'flags' in RegExpPrototype
                  ? regexp.flags
                  : regexpFlags.call(regexp)
              )
            )
            if (!~flags.indexOf('g'))
              throw TypeError('`.matchAll` does not allow non-global regexes')
          }
          if (WORKS_WITH_NON_GLOBAL_REGEX)
            return nativeMatchAll.apply(O, arguments)
          matcher = regexp[MATCH_ALL]
          if (matcher === undefined && isPure && classofRaw(regexp) == 'RegExp')
            matcher = $matchAll
          if (matcher != null) return aFunction$1(matcher).call(regexp, O)
        } else if (WORKS_WITH_NON_GLOBAL_REGEX)
          return nativeMatchAll.apply(O, arguments)
        S = String(O)
        rx = new RegExp(regexp, 'g')
        return rx[MATCH_ALL](S)
      },
    }
  )

  MATCH_ALL in RegExpPrototype ||
    createNonEnumerableProperty(RegExpPrototype, MATCH_ALL, $matchAll)

  // `String.prototype.repeat` method implementation
  // https://tc39.github.io/ecma262/#sec-string.prototype.repeat
  var stringRepeat =
    ''.repeat ||
    function repeat(count) {
      var str = String(requireObjectCoercible(this))
      var result = ''
      var n = toInteger(count)
      if (n < 0 || n == Infinity)
        throw RangeError('Wrong number of repetitions')
      for (; n > 0; (n >>>= 1) && (str += str)) if (n & 1) result += str
      return result
    }

  // https://github.com/tc39/proposal-string-pad-start-end

  var ceil$1 = Math.ceil

  // `String.prototype.{ padStart, padEnd }` methods implementation
  var createMethod$5 = function(IS_END) {
    return function($this, maxLength, fillString) {
      var S = String(requireObjectCoercible($this))
      var stringLength = S.length
      var fillStr = fillString === undefined ? ' ' : String(fillString)
      var intMaxLength = toLength(maxLength)
      var fillLen, stringFiller
      if (intMaxLength <= stringLength || fillStr == '') return S
      fillLen = intMaxLength - stringLength
      stringFiller = stringRepeat.call(
        fillStr,
        ceil$1(fillLen / fillStr.length)
      )
      if (stringFiller.length > fillLen)
        stringFiller = stringFiller.slice(0, fillLen)
      return IS_END ? S + stringFiller : stringFiller + S
    }
  }

  var stringPad = {
    // `String.prototype.padStart` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.padstart
    start: createMethod$5(false),
    // `String.prototype.padEnd` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.padend
    end: createMethod$5(true),
  }

  // https://github.com/zloirock/core-js/issues/280

  // eslint-disable-next-line unicorn/no-unsafe-regex
  var stringPadWebkitBug = /Version\/10\.\d+(\.\d+)?( Mobile\/\w+)? Safari\//.test(
    engineUserAgent
  )

  var $padEnd = stringPad.end

  // `String.prototype.padEnd` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.padend
  _export(
    { target: 'String', proto: true, forced: stringPadWebkitBug },
    {
      padEnd: function padEnd(maxLength /* , fillString = ' ' */) {
        return $padEnd(
          this,
          maxLength,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  var $padStart = stringPad.start

  // `String.prototype.padStart` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.padstart
  _export(
    { target: 'String', proto: true, forced: stringPadWebkitBug },
    {
      padStart: function padStart(maxLength /* , fillString = ' ' */) {
        return $padStart(
          this,
          maxLength,
          arguments.length > 1 ? arguments[1] : undefined
        )
      },
    }
  )

  // `String.prototype.repeat` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.repeat
  _export(
    { target: 'String', proto: true },
    {
      repeat: stringRepeat,
    }
  )

  var max$3 = Math.max
  var min$6 = Math.min
  var floor$1 = Math.floor
  var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g
  var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g

  var maybeToString = function(it) {
    return it === undefined ? it : String(it)
  }

  // @@replace logic
  fixRegexpWellKnownSymbolLogic('replace', 2, function(
    REPLACE,
    nativeReplace,
    maybeCallNative,
    reason
  ) {
    var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE =
      reason.REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
    var REPLACE_KEEPS_$0 = reason.REPLACE_KEEPS_$0
    var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
      ? '$'
      : '$0'

    return [
      // `String.prototype.replace` method
      // https://tc39.github.io/ecma262/#sec-string.prototype.replace
      function replace(searchValue, replaceValue) {
        var O = requireObjectCoercible(this)
        var replacer =
          searchValue == undefined ? undefined : searchValue[REPLACE]
        return replacer !== undefined
          ? replacer.call(searchValue, O, replaceValue)
          : nativeReplace.call(String(O), searchValue, replaceValue)
      },
      // `RegExp.prototype[@@replace]` method
      // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
      function(regexp, replaceValue) {
        if (
          (!REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE && REPLACE_KEEPS_$0) ||
          (typeof replaceValue === 'string' &&
            replaceValue.indexOf(UNSAFE_SUBSTITUTE) === -1)
        ) {
          var res = maybeCallNative(nativeReplace, regexp, this, replaceValue)
          if (res.done) return res.value
        }

        var rx = anObject(regexp)
        var S = String(this)

        var functionalReplace = typeof replaceValue === 'function'
        if (!functionalReplace) replaceValue = String(replaceValue)

        var global = rx.global
        if (global) {
          var fullUnicode = rx.unicode
          rx.lastIndex = 0
        }
        var results = []
        while (true) {
          var result = regexpExecAbstract(rx, S)
          if (result === null) break

          results.push(result)
          if (!global) break

          var matchStr = String(result[0])
          if (matchStr === '')
            rx.lastIndex = advanceStringIndex(
              S,
              toLength(rx.lastIndex),
              fullUnicode
            )
        }

        var accumulatedResult = ''
        var nextSourcePosition = 0
        for (var i = 0; i < results.length; i++) {
          result = results[i]

          var matched = String(result[0])
          var position = max$3(min$6(toInteger(result.index), S.length), 0)
          var captures = []
          // NOTE: This is equivalent to
          //   captures = result.slice(1).map(maybeToString)
          // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
          // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
          // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
          for (var j = 1; j < result.length; j++)
            captures.push(maybeToString(result[j]))
          var namedCaptures = result.groups
          if (functionalReplace) {
            var replacerArgs = [matched].concat(captures, position, S)
            if (namedCaptures !== undefined) replacerArgs.push(namedCaptures)
            var replacement = String(
              replaceValue.apply(undefined, replacerArgs)
            )
          } else {
            replacement = getSubstitution(
              matched,
              S,
              position,
              captures,
              namedCaptures,
              replaceValue
            )
          }
          if (position >= nextSourcePosition) {
            accumulatedResult +=
              S.slice(nextSourcePosition, position) + replacement
            nextSourcePosition = position + matched.length
          }
        }
        return accumulatedResult + S.slice(nextSourcePosition)
      },
    ]

    // https://tc39.github.io/ecma262/#sec-getsubstitution
    function getSubstitution(
      matched,
      str,
      position,
      captures,
      namedCaptures,
      replacement
    ) {
      var tailPos = position + matched.length
      var m = captures.length
      var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED
      if (namedCaptures !== undefined) {
        namedCaptures = toObject$1(namedCaptures)
        symbols = SUBSTITUTION_SYMBOLS
      }
      return nativeReplace.call(replacement, symbols, function(match, ch) {
        var capture
        switch (ch.charAt(0)) {
          case '$':
            return '$'
          case '&':
            return matched
          case '`':
            return str.slice(0, position)
          case "'":
            return str.slice(tailPos)
          case '<':
            capture = namedCaptures[ch.slice(1, -1)]
            break
          default:
            // \d\d?
            var n = +ch
            if (n === 0) return match
            if (n > m) {
              var f = floor$1(n / 10)
              if (f === 0) return match
              if (f <= m)
                return captures[f - 1] === undefined
                  ? ch.charAt(1)
                  : captures[f - 1] + ch.charAt(1)
              return match
            }
            capture = captures[n - 1]
        }
        return capture === undefined ? '' : capture
      })
    }
  })

  // @@search logic
  fixRegexpWellKnownSymbolLogic('search', 1, function(
    SEARCH,
    nativeSearch,
    maybeCallNative
  ) {
    return [
      // `String.prototype.search` method
      // https://tc39.github.io/ecma262/#sec-string.prototype.search
      function search(regexp) {
        var O = requireObjectCoercible(this)
        var searcher = regexp == undefined ? undefined : regexp[SEARCH]
        return searcher !== undefined
          ? searcher.call(regexp, O)
          : new RegExp(regexp)[SEARCH](String(O))
      },
      // `RegExp.prototype[@@search]` method
      // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@search
      function(regexp) {
        var res = maybeCallNative(nativeSearch, regexp, this)
        if (res.done) return res.value

        var rx = anObject(regexp)
        var S = String(this)

        var previousLastIndex = rx.lastIndex
        if (!sameValue(previousLastIndex, 0)) rx.lastIndex = 0
        var result = regexpExecAbstract(rx, S)
        if (!sameValue(rx.lastIndex, previousLastIndex))
          rx.lastIndex = previousLastIndex
        return result === null ? -1 : result.index
      },
    ]
  })

  var arrayPush = [].push
  var min$7 = Math.min
  var MAX_UINT32 = 0xffffffff

  // babel-minify transpiles RegExp('x', 'y') -> /x/y and it causes SyntaxError
  var SUPPORTS_Y = !fails(function() {
    return !RegExp(MAX_UINT32, 'y')
  })

  // @@split logic
  fixRegexpWellKnownSymbolLogic(
    'split',
    2,
    function(SPLIT, nativeSplit, maybeCallNative) {
      var internalSplit
      if (
        'abbc'.split(/(b)*/)[1] == 'c' ||
        'test'.split(/(?:)/, -1).length != 4 ||
        'ab'.split(/(?:ab)*/).length != 2 ||
        '.'.split(/(.?)(.?)/).length != 4 ||
        '.'.split(/()()/).length > 1 ||
        ''.split(/.?/).length
      ) {
        // based on es5-shim implementation, need to rework it
        internalSplit = function(separator, limit) {
          var string = String(requireObjectCoercible(this))
          var lim = limit === undefined ? MAX_UINT32 : limit >>> 0
          if (lim === 0) return []
          if (separator === undefined) return [string]
          // If `separator` is not a regex, use native split
          if (!isRegexp(separator)) {
            return nativeSplit.call(string, separator, lim)
          }
          var output = []
          var flags =
            (separator.ignoreCase ? 'i' : '') +
            (separator.multiline ? 'm' : '') +
            (separator.unicode ? 'u' : '') +
            (separator.sticky ? 'y' : '')
          var lastLastIndex = 0
          // Make `global` and avoid `lastIndex` issues by working with a copy
          var separatorCopy = new RegExp(separator.source, flags + 'g')
          var match, lastIndex, lastLength
          while ((match = regexpExec.call(separatorCopy, string))) {
            lastIndex = separatorCopy.lastIndex
            if (lastIndex > lastLastIndex) {
              output.push(string.slice(lastLastIndex, match.index))
              if (match.length > 1 && match.index < string.length)
                arrayPush.apply(output, match.slice(1))
              lastLength = match[0].length
              lastLastIndex = lastIndex
              if (output.length >= lim) break
            }
            if (separatorCopy.lastIndex === match.index)
              separatorCopy.lastIndex++ // Avoid an infinite loop
          }
          if (lastLastIndex === string.length) {
            if (lastLength || !separatorCopy.test('')) output.push('')
          } else output.push(string.slice(lastLastIndex))
          return output.length > lim ? output.slice(0, lim) : output
        }
        // Chakra, V8
      } else if ('0'.split(undefined, 0).length) {
        internalSplit = function(separator, limit) {
          return separator === undefined && limit === 0
            ? []
            : nativeSplit.call(this, separator, limit)
        }
      } else internalSplit = nativeSplit

      return [
        // `String.prototype.split` method
        // https://tc39.github.io/ecma262/#sec-string.prototype.split
        function split(separator, limit) {
          var O = requireObjectCoercible(this)
          var splitter = separator == undefined ? undefined : separator[SPLIT]
          return splitter !== undefined
            ? splitter.call(separator, O, limit)
            : internalSplit.call(String(O), separator, limit)
        },
        // `RegExp.prototype[@@split]` method
        // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@split
        //
        // NOTE: This cannot be properly polyfilled in engines that don't support
        // the 'y' flag.
        function(regexp, limit) {
          var res = maybeCallNative(
            internalSplit,
            regexp,
            this,
            limit,
            internalSplit !== nativeSplit
          )
          if (res.done) return res.value

          var rx = anObject(regexp)
          var S = String(this)
          var C = speciesConstructor(rx, RegExp)

          var unicodeMatching = rx.unicode
          var flags =
            (rx.ignoreCase ? 'i' : '') +
            (rx.multiline ? 'm' : '') +
            (rx.unicode ? 'u' : '') +
            (SUPPORTS_Y ? 'y' : 'g')

          // ^(? + rx + ) is needed, in combination with some S slicing, to
          // simulate the 'y' flag.
          var splitter = new C(
            SUPPORTS_Y ? rx : '^(?:' + rx.source + ')',
            flags
          )
          var lim = limit === undefined ? MAX_UINT32 : limit >>> 0
          if (lim === 0) return []
          if (S.length === 0)
            return regexpExecAbstract(splitter, S) === null ? [S] : []
          var p = 0
          var q = 0
          var A = []
          while (q < S.length) {
            splitter.lastIndex = SUPPORTS_Y ? q : 0
            var z = regexpExecAbstract(splitter, SUPPORTS_Y ? S : S.slice(q))
            var e
            if (
              z === null ||
              (e = min$7(
                toLength(splitter.lastIndex + (SUPPORTS_Y ? 0 : q)),
                S.length
              )) === p
            ) {
              q = advanceStringIndex(S, q, unicodeMatching)
            } else {
              A.push(S.slice(p, q))
              if (A.length === lim) return A
              for (var i = 1; i <= z.length - 1; i++) {
                A.push(z[i])
                if (A.length === lim) return A
              }
              q = p = e
            }
          }
          A.push(S.slice(p))
          return A
        },
      ]
    },
    !SUPPORTS_Y
  )

  var getOwnPropertyDescriptor$5 = objectGetOwnPropertyDescriptor.f

  var nativeStartsWith = ''.startsWith
  var min$8 = Math.min

  var CORRECT_IS_REGEXP_LOGIC$1 = correctIsRegexpLogic('startsWith')
  // https://github.com/zloirock/core-js/pull/702
  var MDN_POLYFILL_BUG$1 =
    !CORRECT_IS_REGEXP_LOGIC$1 &&
    !!(function() {
      var descriptor = getOwnPropertyDescriptor$5(
        String.prototype,
        'startsWith'
      )
      return descriptor && !descriptor.writable
    })()

  // `String.prototype.startsWith` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.startswith
  _export(
    {
      target: 'String',
      proto: true,
      forced: !MDN_POLYFILL_BUG$1 && !CORRECT_IS_REGEXP_LOGIC$1,
    },
    {
      startsWith: function startsWith(searchString /* , position = 0 */) {
        var that = String(requireObjectCoercible(this))
        notARegexp(searchString)
        var index = toLength(
          min$8(arguments.length > 1 ? arguments[1] : undefined, that.length)
        )
        var search = String(searchString)
        return nativeStartsWith
          ? nativeStartsWith.call(that, search, index)
          : that.slice(index, index + search.length) === search
      },
    }
  )

  // a string of all valid unicode whitespaces
  // eslint-disable-next-line max-len
  var whitespaces =
    '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF'

  var whitespace = '[' + whitespaces + ']'
  var ltrim = RegExp('^' + whitespace + whitespace + '*')
  var rtrim = RegExp(whitespace + whitespace + '*$')

  // `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
  var createMethod$6 = function(TYPE) {
    return function($this) {
      var string = String(requireObjectCoercible($this))
      if (TYPE & 1) string = string.replace(ltrim, '')
      if (TYPE & 2) string = string.replace(rtrim, '')
      return string
    }
  }

  var stringTrim = {
    // `String.prototype.{ trimLeft, trimStart }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
    start: createMethod$6(1),
    // `String.prototype.{ trimRight, trimEnd }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
    end: createMethod$6(2),
    // `String.prototype.trim` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.trim
    trim: createMethod$6(3),
  }

  var non = '\u200B\u0085\u180E'

  // check that a method works with the correct list
  // of whitespaces and has a correct name
  var stringTrimForced = function(METHOD_NAME) {
    return fails(function() {
      return (
        !!whitespaces[METHOD_NAME]() ||
        non[METHOD_NAME]() != non ||
        whitespaces[METHOD_NAME].name !== METHOD_NAME
      )
    })
  }

  var $trim = stringTrim.trim

  // `String.prototype.trim` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.trim
  _export(
    { target: 'String', proto: true, forced: stringTrimForced('trim') },
    {
      trim: function trim() {
        return $trim(this)
      },
    }
  )

  var $trimStart = stringTrim.start

  var FORCED$4 = stringTrimForced('trimStart')

  var trimStart = FORCED$4
    ? function trimStart() {
        return $trimStart(this)
      }
    : ''.trimStart

  // `String.prototype.{ trimStart, trimLeft }` methods
  // https://github.com/tc39/ecmascript-string-left-right-trim
  _export(
    { target: 'String', proto: true, forced: FORCED$4 },
    {
      trimStart: trimStart,
      trimLeft: trimStart,
    }
  )

  var $trimEnd = stringTrim.end

  var FORCED$5 = stringTrimForced('trimEnd')

  var trimEnd = FORCED$5
    ? function trimEnd() {
        return $trimEnd(this)
      }
    : ''.trimEnd

  // `String.prototype.{ trimEnd, trimRight }` methods
  // https://github.com/tc39/ecmascript-string-left-right-trim
  _export(
    { target: 'String', proto: true, forced: FORCED$5 },
    {
      trimEnd: trimEnd,
      trimRight: trimEnd,
    }
  )

  var quot = /"/g

  // B.2.3.2.1 CreateHTML(string, tag, attribute, value)
  // https://tc39.github.io/ecma262/#sec-createhtml
  var createHtml = function(string, tag, attribute, value) {
    var S = String(requireObjectCoercible(string))
    var p1 = '<' + tag
    if (attribute !== '')
      p1 += ' ' + attribute + '="' + String(value).replace(quot, '&quot;') + '"'
    return p1 + '>' + S + '</' + tag + '>'
  }

  // check the existence of a method, lowercase
  // of a tag and escaping quotes in arguments
  var stringHtmlForced = function(METHOD_NAME) {
    return fails(function() {
      var test = ''[METHOD_NAME]('"')
      return test !== test.toLowerCase() || test.split('"').length > 3
    })
  }

  // `String.prototype.anchor` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.anchor
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('anchor') },
    {
      anchor: function anchor(name) {
        return createHtml(this, 'a', 'name', name)
      },
    }
  )

  // `String.prototype.big` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.big
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('big') },
    {
      big: function big() {
        return createHtml(this, 'big', '', '')
      },
    }
  )

  // `String.prototype.blink` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.blink
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('blink') },
    {
      blink: function blink() {
        return createHtml(this, 'blink', '', '')
      },
    }
  )

  // `String.prototype.bold` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.bold
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('bold') },
    {
      bold: function bold() {
        return createHtml(this, 'b', '', '')
      },
    }
  )

  // `String.prototype.fixed` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.fixed
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('fixed') },
    {
      fixed: function fixed() {
        return createHtml(this, 'tt', '', '')
      },
    }
  )

  // `String.prototype.fontcolor` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.fontcolor
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('fontcolor') },
    {
      fontcolor: function fontcolor(color) {
        return createHtml(this, 'font', 'color', color)
      },
    }
  )

  // `String.prototype.fontsize` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.fontsize
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('fontsize') },
    {
      fontsize: function fontsize(size) {
        return createHtml(this, 'font', 'size', size)
      },
    }
  )

  // `String.prototype.italics` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.italics
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('italics') },
    {
      italics: function italics() {
        return createHtml(this, 'i', '', '')
      },
    }
  )

  // `String.prototype.link` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.link
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('link') },
    {
      link: function link(url) {
        return createHtml(this, 'a', 'href', url)
      },
    }
  )

  // `String.prototype.small` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.small
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('small') },
    {
      small: function small() {
        return createHtml(this, 'small', '', '')
      },
    }
  )

  // `String.prototype.strike` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.strike
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('strike') },
    {
      strike: function strike() {
        return createHtml(this, 'strike', '', '')
      },
    }
  )

  // `String.prototype.sub` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.sub
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('sub') },
    {
      sub: function sub() {
        return createHtml(this, 'sub', '', '')
      },
    }
  )

  // `String.prototype.sup` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.sup
  _export(
    { target: 'String', proto: true, forced: stringHtmlForced('sup') },
    {
      sup: function sup() {
        return createHtml(this, 'sup', '', '')
      },
    }
  )

  var defineProperty$7 = objectDefineProperty.f
  var getOwnPropertyNames = objectGetOwnPropertyNames.f

  var setInternalState$5 = internalState.set

  var MATCH$2 = wellKnownSymbol('match')
  var NativeRegExp = global_1.RegExp
  var RegExpPrototype$1 = NativeRegExp.prototype
  var re1 = /a/g
  var re2 = /a/g

  // "new" should create a new object, old webkit bug
  var CORRECT_NEW = new NativeRegExp(re1) !== re1

  var UNSUPPORTED_Y$2 = regexpStickyHelpers.UNSUPPORTED_Y

  var FORCED$6 =
    descriptors &&
    isForced_1(
      'RegExp',
      !CORRECT_NEW ||
        UNSUPPORTED_Y$2 ||
        fails(function() {
          re2[MATCH$2] = false
          // RegExp constructor can alter flags and IsRegExp works correct with @@match
          return (
            NativeRegExp(re1) != re1 ||
            NativeRegExp(re2) == re2 ||
            NativeRegExp(re1, 'i') != '/a/i'
          )
        })
    )

  // `RegExp` constructor
  // https://tc39.github.io/ecma262/#sec-regexp-constructor
  if (FORCED$6) {
    var RegExpWrapper = function RegExp(pattern, flags) {
      var thisIsRegExp = this instanceof RegExpWrapper
      var patternIsRegExp = isRegexp(pattern)
      var flagsAreUndefined = flags === undefined
      var sticky

      if (
        !thisIsRegExp &&
        patternIsRegExp &&
        pattern.constructor === RegExpWrapper &&
        flagsAreUndefined
      ) {
        return pattern
      }

      if (CORRECT_NEW) {
        if (patternIsRegExp && !flagsAreUndefined) pattern = pattern.source
      } else if (pattern instanceof RegExpWrapper) {
        if (flagsAreUndefined) flags = regexpFlags.call(pattern)
        pattern = pattern.source
      }

      if (UNSUPPORTED_Y$2) {
        sticky = !!flags && flags.indexOf('y') > -1
        if (sticky) flags = flags.replace(/y/g, '')
      }

      var result = inheritIfRequired(
        CORRECT_NEW
          ? new NativeRegExp(pattern, flags)
          : NativeRegExp(pattern, flags),
        thisIsRegExp ? this : RegExpPrototype$1,
        RegExpWrapper
      )

      if (UNSUPPORTED_Y$2 && sticky)
        setInternalState$5(result, { sticky: sticky })

      return result
    }
    var proxy = function(key) {
      key in RegExpWrapper ||
        defineProperty$7(RegExpWrapper, key, {
          configurable: true,
          get: function() {
            return NativeRegExp[key]
          },
          set: function(it) {
            NativeRegExp[key] = it
          },
        })
    }
    var keys$1 = getOwnPropertyNames(NativeRegExp)
    var index$1 = 0
    while (keys$1.length > index$1) proxy(keys$1[index$1++])
    RegExpPrototype$1.constructor = RegExpWrapper
    RegExpWrapper.prototype = RegExpPrototype$1
    redefine(global_1, 'RegExp', RegExpWrapper)
  }

  // https://tc39.github.io/ecma262/#sec-get-regexp-@@species
  setSpecies('RegExp')

  var UNSUPPORTED_Y$3 = regexpStickyHelpers.UNSUPPORTED_Y

  // `RegExp.prototype.flags` getter
  // https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
  if (descriptors && (/./g.flags != 'g' || UNSUPPORTED_Y$3)) {
    objectDefineProperty.f(RegExp.prototype, 'flags', {
      configurable: true,
      get: regexpFlags,
    })
  }

  var UNSUPPORTED_Y$4 = regexpStickyHelpers.UNSUPPORTED_Y
  var defineProperty$8 = objectDefineProperty.f
  var getInternalState$4 = internalState.get
  var RegExpPrototype$2 = RegExp.prototype

  // `RegExp.prototype.sticky` getter
  if (descriptors && UNSUPPORTED_Y$4) {
    defineProperty$8(RegExp.prototype, 'sticky', {
      configurable: true,
      get: function() {
        if (this === RegExpPrototype$2) return undefined
        // We can't use InternalStateModule.getterFor because
        // we don't add metadata for regexps created by a literal.
        if (this instanceof RegExp) {
          return !!getInternalState$4(this).sticky
        }
        throw TypeError('Incompatible receiver, RegExp required')
      },
    })
  }

  // TODO: Remove from `core-js@4` since it's moved to entry points

  var DELEGATES_TO_EXEC = (function() {
    var execCalled = false
    var re = /[ac]/
    re.exec = function() {
      execCalled = true
      return /./.exec.apply(this, arguments)
    }
    return re.test('abc') === true && execCalled
  })()

  var nativeTest = /./.test

  _export(
    { target: 'RegExp', proto: true, forced: !DELEGATES_TO_EXEC },
    {
      test: function(str) {
        if (typeof this.exec !== 'function') {
          return nativeTest.call(this, str)
        }
        var result = this.exec(str)
        if (result !== null && !isObject(result)) {
          throw new Error(
            'RegExp exec method returned something other than an Object or null'
          )
        }
        return !!result
      },
    }
  )

  var TO_STRING = 'toString'
  var RegExpPrototype$3 = RegExp.prototype
  var nativeToString = RegExpPrototype$3[TO_STRING]

  var NOT_GENERIC = fails(function() {
    return nativeToString.call({ source: 'a', flags: 'b' }) != '/a/b'
  })
  // FF44- RegExp#toString has a wrong name
  var INCORRECT_NAME = nativeToString.name != TO_STRING

  // `RegExp.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
  if (NOT_GENERIC || INCORRECT_NAME) {
    redefine(
      RegExp.prototype,
      TO_STRING,
      function toString() {
        var R = anObject(this)
        var p = String(R.source)
        var rf = R.flags
        var f = String(
          rf === undefined &&
            R instanceof RegExp &&
            !('flags' in RegExpPrototype$3)
            ? regexpFlags.call(R)
            : rf
        )
        return '/' + p + '/' + f
      },
      { unsafe: true }
    )
  }

  var trim = stringTrim.trim

  var $parseInt = global_1.parseInt
  var hex = /^[+-]?0[Xx]/
  var FORCED$7 =
    $parseInt(whitespaces + '08') !== 8 ||
    $parseInt(whitespaces + '0x16') !== 22

  // `parseInt` method
  // https://tc39.github.io/ecma262/#sec-parseint-string-radix
  var numberParseInt = FORCED$7
    ? function parseInt(string, radix) {
        var S = trim(String(string))
        return $parseInt(S, radix >>> 0 || (hex.test(S) ? 16 : 10))
      }
    : $parseInt

  // `parseInt` method
  // https://tc39.github.io/ecma262/#sec-parseint-string-radix
  _export(
    { global: true, forced: parseInt != numberParseInt },
    {
      parseInt: numberParseInt,
    }
  )

  var trim$1 = stringTrim.trim

  var $parseFloat = global_1.parseFloat
  var FORCED$8 = 1 / $parseFloat(whitespaces + '-0') !== -Infinity

  // `parseFloat` method
  // https://tc39.github.io/ecma262/#sec-parsefloat-string
  var numberParseFloat = FORCED$8
    ? function parseFloat(string) {
        var trimmedString = trim$1(String(string))
        var result = $parseFloat(trimmedString)
        return result === 0 && trimmedString.charAt(0) == '-' ? -0 : result
      }
    : $parseFloat

  // `parseFloat` method
  // https://tc39.github.io/ecma262/#sec-parsefloat-string
  _export(
    { global: true, forced: parseFloat != numberParseFloat },
    {
      parseFloat: numberParseFloat,
    }
  )

  var getOwnPropertyNames$1 = objectGetOwnPropertyNames.f
  var getOwnPropertyDescriptor$6 = objectGetOwnPropertyDescriptor.f
  var defineProperty$9 = objectDefineProperty.f
  var trim$2 = stringTrim.trim

  var NUMBER = 'Number'
  var NativeNumber = global_1[NUMBER]
  var NumberPrototype = NativeNumber.prototype

  // Opera ~12 has broken Object#toString
  var BROKEN_CLASSOF = classofRaw(objectCreate(NumberPrototype)) == NUMBER

  // `ToNumber` abstract operation
  // https://tc39.github.io/ecma262/#sec-tonumber
  var toNumber = function(argument) {
    var it = toPrimitive(argument, false)
    var first, third, radix, maxCode, digits, length, index, code
    if (typeof it == 'string' && it.length > 2) {
      it = trim$2(it)
      first = it.charCodeAt(0)
      if (first === 43 || first === 45) {
        third = it.charCodeAt(2)
        if (third === 88 || third === 120) return NaN // Number('+0x1') should be NaN, old V8 fix
      } else if (first === 48) {
        switch (it.charCodeAt(1)) {
          case 66:
          case 98:
            radix = 2
            maxCode = 49
            break // fast equal of /^0b[01]+$/i
          case 79:
          case 111:
            radix = 8
            maxCode = 55
            break // fast equal of /^0o[0-7]+$/i
          default:
            return +it
        }
        digits = it.slice(2)
        length = digits.length
        for (index = 0; index < length; index++) {
          code = digits.charCodeAt(index)
          // parseInt parses a string to a first unavailable symbol
          // but ToNumber should return NaN if a string contains unavailable symbols
          if (code < 48 || code > maxCode) return NaN
        }
        return parseInt(digits, radix)
      }
    }
    return +it
  }

  // `Number` constructor
  // https://tc39.github.io/ecma262/#sec-number-constructor
  if (
    isForced_1(
      NUMBER,
      !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1')
    )
  ) {
    var NumberWrapper = function Number(value) {
      var it = arguments.length < 1 ? 0 : value
      var dummy = this
      return dummy instanceof NumberWrapper &&
        // check on 1..constructor(foo) case
        (BROKEN_CLASSOF
          ? fails(function() {
              NumberPrototype.valueOf.call(dummy)
            })
          : classofRaw(dummy) != NUMBER)
        ? inheritIfRequired(
            new NativeNumber(toNumber(it)),
            dummy,
            NumberWrapper
          )
        : toNumber(it)
    }
    for (
      var keys$2 = descriptors
          ? getOwnPropertyNames$1(NativeNumber)
          : // ES3:
            (
              'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
              // ES2015 (in case, if modules with ES2015 Number statics required before):
              'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
              'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
            ).split(','),
        j = 0,
        key;
      keys$2.length > j;
      j++
    ) {
      if (has(NativeNumber, (key = keys$2[j])) && !has(NumberWrapper, key)) {
        defineProperty$9(
          NumberWrapper,
          key,
          getOwnPropertyDescriptor$6(NativeNumber, key)
        )
      }
    }
    NumberWrapper.prototype = NumberPrototype
    NumberPrototype.constructor = NumberWrapper
    redefine(global_1, NUMBER, NumberWrapper)
  }

  // `Number.EPSILON` constant
  // https://tc39.github.io/ecma262/#sec-number.epsilon
  _export(
    { target: 'Number', stat: true },
    {
      EPSILON: Math.pow(2, -52),
    }
  )

  var globalIsFinite = global_1.isFinite

  // `Number.isFinite` method
  // https://tc39.github.io/ecma262/#sec-number.isfinite
  var numberIsFinite =
    Number.isFinite ||
    function isFinite(it) {
      return typeof it == 'number' && globalIsFinite(it)
    }

  // `Number.isFinite` method
  // https://tc39.github.io/ecma262/#sec-number.isfinite
  _export({ target: 'Number', stat: true }, { isFinite: numberIsFinite })

  var floor$2 = Math.floor

  // `Number.isInteger` method implementation
  // https://tc39.github.io/ecma262/#sec-number.isinteger
  var isInteger = function isInteger(it) {
    return !isObject(it) && isFinite(it) && floor$2(it) === it
  }

  // `Number.isInteger` method
  // https://tc39.github.io/ecma262/#sec-number.isinteger
  _export(
    { target: 'Number', stat: true },
    {
      isInteger: isInteger,
    }
  )

  // `Number.isNaN` method
  // https://tc39.github.io/ecma262/#sec-number.isnan
  _export(
    { target: 'Number', stat: true },
    {
      isNaN: function isNaN(number) {
        // eslint-disable-next-line no-self-compare
        return number != number
      },
    }
  )

  var abs = Math.abs

  // `Number.isSafeInteger` method
  // https://tc39.github.io/ecma262/#sec-number.issafeinteger
  _export(
    { target: 'Number', stat: true },
    {
      isSafeInteger: function isSafeInteger(number) {
        return isInteger(number) && abs(number) <= 0x1fffffffffffff
      },
    }
  )

  // `Number.MAX_SAFE_INTEGER` constant
  // https://tc39.github.io/ecma262/#sec-number.max_safe_integer
  _export(
    { target: 'Number', stat: true },
    {
      MAX_SAFE_INTEGER: 0x1fffffffffffff,
    }
  )

  // `Number.MIN_SAFE_INTEGER` constant
  // https://tc39.github.io/ecma262/#sec-number.min_safe_integer
  _export(
    { target: 'Number', stat: true },
    {
      MIN_SAFE_INTEGER: -0x1fffffffffffff,
    }
  )

  // `Number.parseFloat` method
  // https://tc39.github.io/ecma262/#sec-number.parseFloat
  _export(
    {
      target: 'Number',
      stat: true,
      forced: Number.parseFloat != numberParseFloat,
    },
    {
      parseFloat: numberParseFloat,
    }
  )

  // `Number.parseInt` method
  // https://tc39.github.io/ecma262/#sec-number.parseint
  _export(
    { target: 'Number', stat: true, forced: Number.parseInt != numberParseInt },
    {
      parseInt: numberParseInt,
    }
  )

  // `thisNumberValue` abstract operation
  // https://tc39.github.io/ecma262/#sec-thisnumbervalue
  var thisNumberValue = function(value) {
    if (typeof value != 'number' && classofRaw(value) != 'Number') {
      throw TypeError('Incorrect invocation')
    }
    return +value
  }

  var nativeToFixed = (1.0).toFixed
  var floor$3 = Math.floor

  var pow = function(x, n, acc) {
    return n === 0
      ? acc
      : n % 2 === 1
      ? pow(x, n - 1, acc * x)
      : pow(x * x, n / 2, acc)
  }

  var log = function(x) {
    var n = 0
    var x2 = x
    while (x2 >= 4096) {
      n += 12
      x2 /= 4096
    }
    while (x2 >= 2) {
      n += 1
      x2 /= 2
    }
    return n
  }

  var FORCED$9 =
    (nativeToFixed &&
      ((0.00008).toFixed(3) !== '0.000' ||
        (0.9).toFixed(0) !== '1' ||
        (1.255).toFixed(2) !== '1.25' ||
        (1000000000000000128.0).toFixed(0) !== '1000000000000000128')) ||
    !fails(function() {
      // V8 ~ Android 4.3-
      nativeToFixed.call({})
    })

  // `Number.prototype.toFixed` method
  // https://tc39.github.io/ecma262/#sec-number.prototype.tofixed
  _export(
    { target: 'Number', proto: true, forced: FORCED$9 },
    {
      // eslint-disable-next-line max-statements
      toFixed: function toFixed(fractionDigits) {
        var number = thisNumberValue(this)
        var fractDigits = toInteger(fractionDigits)
        var data = [0, 0, 0, 0, 0, 0]
        var sign = ''
        var result = '0'
        var e, z, j, k

        var multiply = function(n, c) {
          var index = -1
          var c2 = c
          while (++index < 6) {
            c2 += n * data[index]
            data[index] = c2 % 1e7
            c2 = floor$3(c2 / 1e7)
          }
        }

        var divide = function(n) {
          var index = 6
          var c = 0
          while (--index >= 0) {
            c += data[index]
            data[index] = floor$3(c / n)
            c = (c % n) * 1e7
          }
        }

        var dataToString = function() {
          var index = 6
          var s = ''
          while (--index >= 0) {
            if (s !== '' || index === 0 || data[index] !== 0) {
              var t = String(data[index])
              s = s === '' ? t : s + stringRepeat.call('0', 7 - t.length) + t
            }
          }
          return s
        }

        if (fractDigits < 0 || fractDigits > 20)
          throw RangeError('Incorrect fraction digits')
        // eslint-disable-next-line no-self-compare
        if (number != number) return 'NaN'
        if (number <= -1e21 || number >= 1e21) return String(number)
        if (number < 0) {
          sign = '-'
          number = -number
        }
        if (number > 1e-21) {
          e = log(number * pow(2, 69, 1)) - 69
          z = e < 0 ? number * pow(2, -e, 1) : number / pow(2, e, 1)
          z *= 0x10000000000000
          e = 52 - e
          if (e > 0) {
            multiply(0, z)
            j = fractDigits
            while (j >= 7) {
              multiply(1e7, 0)
              j -= 7
            }
            multiply(pow(10, j, 1), 0)
            j = e - 1
            while (j >= 23) {
              divide(1 << 23)
              j -= 23
            }
            divide(1 << j)
            multiply(1, 1)
            divide(2)
            result = dataToString()
          } else {
            multiply(0, z)
            multiply(1 << -e, 0)
            result = dataToString() + stringRepeat.call('0', fractDigits)
          }
        }
        if (fractDigits > 0) {
          k = result.length
          result =
            sign +
            (k <= fractDigits
              ? '0.' + stringRepeat.call('0', fractDigits - k) + result
              : result.slice(0, k - fractDigits) +
                '.' +
                result.slice(k - fractDigits))
        } else {
          result = sign + result
        }
        return result
      },
    }
  )

  var nativeToPrecision = (1.0).toPrecision

  var FORCED$a =
    fails(function() {
      // IE7-
      return nativeToPrecision.call(1, undefined) !== '1'
    }) ||
    !fails(function() {
      // V8 ~ Android 4.3-
      nativeToPrecision.call({})
    })

  // `Number.prototype.toPrecision` method
  // https://tc39.github.io/ecma262/#sec-number.prototype.toprecision
  _export(
    { target: 'Number', proto: true, forced: FORCED$a },
    {
      toPrecision: function toPrecision(precision) {
        return precision === undefined
          ? nativeToPrecision.call(thisNumberValue(this))
          : nativeToPrecision.call(thisNumberValue(this), precision)
      },
    }
  )

  var log$1 = Math.log

  // `Math.log1p` method implementation
  // https://tc39.github.io/ecma262/#sec-math.log1p
  var mathLog1p =
    Math.log1p ||
    function log1p(x) {
      return (x = +x) > -1e-8 && x < 1e-8 ? x - (x * x) / 2 : log$1(1 + x)
    }

  var nativeAcosh = Math.acosh
  var log$2 = Math.log
  var sqrt = Math.sqrt
  var LN2 = Math.LN2

  var FORCED$b =
    !nativeAcosh ||
    // V8 bug: https://code.google.com/p/v8/issues/detail?id=3509
    Math.floor(nativeAcosh(Number.MAX_VALUE)) != 710 ||
    // Tor Browser bug: Math.acosh(Infinity) -> NaN
    nativeAcosh(Infinity) != Infinity

  // `Math.acosh` method
  // https://tc39.github.io/ecma262/#sec-math.acosh
  _export(
    { target: 'Math', stat: true, forced: FORCED$b },
    {
      acosh: function acosh(x) {
        return (x = +x) < 1
          ? NaN
          : x > 94906265.62425156
          ? log$2(x) + LN2
          : mathLog1p(x - 1 + sqrt(x - 1) * sqrt(x + 1))
      },
    }
  )

  var nativeAsinh = Math.asinh
  var log$3 = Math.log
  var sqrt$1 = Math.sqrt

  function asinh(x) {
    return !isFinite((x = +x)) || x == 0
      ? x
      : x < 0
      ? -asinh(-x)
      : log$3(x + sqrt$1(x * x + 1))
  }

  // `Math.asinh` method
  // https://tc39.github.io/ecma262/#sec-math.asinh
  // Tor Browser bug: Math.asinh(0) -> -0
  _export(
    {
      target: 'Math',
      stat: true,
      forced: !(nativeAsinh && 1 / nativeAsinh(0) > 0),
    },
    {
      asinh: asinh,
    }
  )

  var nativeAtanh = Math.atanh
  var log$4 = Math.log

  // `Math.atanh` method
  // https://tc39.github.io/ecma262/#sec-math.atanh
  // Tor Browser bug: Math.atanh(-0) -> 0
  _export(
    {
      target: 'Math',
      stat: true,
      forced: !(nativeAtanh && 1 / nativeAtanh(-0) < 0),
    },
    {
      atanh: function atanh(x) {
        return (x = +x) == 0 ? x : log$4((1 + x) / (1 - x)) / 2
      },
    }
  )

  // `Math.sign` method implementation
  // https://tc39.github.io/ecma262/#sec-math.sign
  var mathSign =
    Math.sign ||
    function sign(x) {
      // eslint-disable-next-line no-self-compare
      return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1
    }

  var abs$1 = Math.abs
  var pow$1 = Math.pow

  // `Math.cbrt` method
  // https://tc39.github.io/ecma262/#sec-math.cbrt
  _export(
    { target: 'Math', stat: true },
    {
      cbrt: function cbrt(x) {
        return mathSign((x = +x)) * pow$1(abs$1(x), 1 / 3)
      },
    }
  )

  var floor$4 = Math.floor
  var log$5 = Math.log
  var LOG2E = Math.LOG2E

  // `Math.clz32` method
  // https://tc39.github.io/ecma262/#sec-math.clz32
  _export(
    { target: 'Math', stat: true },
    {
      clz32: function clz32(x) {
        return (x >>>= 0) ? 31 - floor$4(log$5(x + 0.5) * LOG2E) : 32
      },
    }
  )

  var nativeExpm1 = Math.expm1
  var exp = Math.exp

  // `Math.expm1` method implementation
  // https://tc39.github.io/ecma262/#sec-math.expm1
  var mathExpm1 =
    !nativeExpm1 ||
    // Old FF bug
    nativeExpm1(10) > 22025.465794806719 ||
    nativeExpm1(10) < 22025.4657948067165168 ||
    // Tor Browser bug
    nativeExpm1(-2e-17) != -2e-17
      ? function expm1(x) {
          return (x = +x) == 0
            ? x
            : x > -1e-6 && x < 1e-6
            ? x + (x * x) / 2
            : exp(x) - 1
        }
      : nativeExpm1

  var nativeCosh = Math.cosh
  var abs$2 = Math.abs
  var E = Math.E

  // `Math.cosh` method
  // https://tc39.github.io/ecma262/#sec-math.cosh
  _export(
    {
      target: 'Math',
      stat: true,
      forced: !nativeCosh || nativeCosh(710) === Infinity,
    },
    {
      cosh: function cosh(x) {
        var t = mathExpm1(abs$2(x) - 1) + 1
        return (t + 1 / (t * E * E)) * (E / 2)
      },
    }
  )

  // `Math.expm1` method
  // https://tc39.github.io/ecma262/#sec-math.expm1
  _export(
    { target: 'Math', stat: true, forced: mathExpm1 != Math.expm1 },
    { expm1: mathExpm1 }
  )

  var abs$3 = Math.abs
  var pow$2 = Math.pow
  var EPSILON = pow$2(2, -52)
  var EPSILON32 = pow$2(2, -23)
  var MAX32 = pow$2(2, 127) * (2 - EPSILON32)
  var MIN32 = pow$2(2, -126)

  var roundTiesToEven = function(n) {
    return n + 1 / EPSILON - 1 / EPSILON
  }

  // `Math.fround` method implementation
  // https://tc39.github.io/ecma262/#sec-math.fround
  var mathFround =
    Math.fround ||
    function fround(x) {
      var $abs = abs$3(x)
      var $sign = mathSign(x)
      var a, result
      if ($abs < MIN32)
        return (
          $sign * roundTiesToEven($abs / MIN32 / EPSILON32) * MIN32 * EPSILON32
        )
      a = (1 + EPSILON32 / EPSILON) * $abs
      result = a - (a - $abs)
      // eslint-disable-next-line no-self-compare
      if (result > MAX32 || result != result) return $sign * Infinity
      return $sign * result
    }

  // `Math.fround` method
  // https://tc39.github.io/ecma262/#sec-math.fround
  _export({ target: 'Math', stat: true }, { fround: mathFround })

  var $hypot = Math.hypot
  var abs$4 = Math.abs
  var sqrt$2 = Math.sqrt

  // Chrome 77 bug
  // https://bugs.chromium.org/p/v8/issues/detail?id=9546
  var BUGGY = !!$hypot && $hypot(Infinity, NaN) !== Infinity

  // `Math.hypot` method
  // https://tc39.github.io/ecma262/#sec-math.hypot
  _export(
    { target: 'Math', stat: true, forced: BUGGY },
    {
      hypot: function hypot(value1, value2) {
        // eslint-disable-line no-unused-vars
        var sum = 0
        var i = 0
        var aLen = arguments.length
        var larg = 0
        var arg, div
        while (i < aLen) {
          arg = abs$4(arguments[i++])
          if (larg < arg) {
            div = larg / arg
            sum = sum * div * div + 1
            larg = arg
          } else if (arg > 0) {
            div = arg / larg
            sum += div * div
          } else sum += arg
        }
        return larg === Infinity ? Infinity : larg * sqrt$2(sum)
      },
    }
  )

  var nativeImul = Math.imul

  var FORCED$c = fails(function() {
    return nativeImul(0xffffffff, 5) != -5 || nativeImul.length != 2
  })

  // `Math.imul` method
  // https://tc39.github.io/ecma262/#sec-math.imul
  // some WebKit versions fails with big numbers, some has wrong arity
  _export(
    { target: 'Math', stat: true, forced: FORCED$c },
    {
      imul: function imul(x, y) {
        var UINT16 = 0xffff
        var xn = +x
        var yn = +y
        var xl = UINT16 & xn
        var yl = UINT16 & yn
        return (
          0 |
          (xl * yl +
            ((((UINT16 & (xn >>> 16)) * yl + xl * (UINT16 & (yn >>> 16))) <<
              16) >>>
              0))
        )
      },
    }
  )

  var log$6 = Math.log
  var LOG10E = Math.LOG10E

  // `Math.log10` method
  // https://tc39.github.io/ecma262/#sec-math.log10
  _export(
    { target: 'Math', stat: true },
    {
      log10: function log10(x) {
        return log$6(x) * LOG10E
      },
    }
  )

  // `Math.log1p` method
  // https://tc39.github.io/ecma262/#sec-math.log1p
  _export({ target: 'Math', stat: true }, { log1p: mathLog1p })

  var log$7 = Math.log
  var LN2$1 = Math.LN2

  // `Math.log2` method
  // https://tc39.github.io/ecma262/#sec-math.log2
  _export(
    { target: 'Math', stat: true },
    {
      log2: function log2(x) {
        return log$7(x) / LN2$1
      },
    }
  )

  // `Math.sign` method
  // https://tc39.github.io/ecma262/#sec-math.sign
  _export(
    { target: 'Math', stat: true },
    {
      sign: mathSign,
    }
  )

  var abs$5 = Math.abs
  var exp$1 = Math.exp
  var E$1 = Math.E

  var FORCED$d = fails(function() {
    return Math.sinh(-2e-17) != -2e-17
  })

  // `Math.sinh` method
  // https://tc39.github.io/ecma262/#sec-math.sinh
  // V8 near Chromium 38 has a problem with very small numbers
  _export(
    { target: 'Math', stat: true, forced: FORCED$d },
    {
      sinh: function sinh(x) {
        return abs$5((x = +x)) < 1
          ? (mathExpm1(x) - mathExpm1(-x)) / 2
          : (exp$1(x - 1) - exp$1(-x - 1)) * (E$1 / 2)
      },
    }
  )

  var exp$2 = Math.exp

  // `Math.tanh` method
  // https://tc39.github.io/ecma262/#sec-math.tanh
  _export(
    { target: 'Math', stat: true },
    {
      tanh: function tanh(x) {
        var a = mathExpm1((x = +x))
        var b = mathExpm1(-x)
        return a == Infinity
          ? 1
          : b == Infinity
          ? -1
          : (a - b) / (exp$2(x) + exp$2(-x))
      },
    }
  )

  var ceil$2 = Math.ceil
  var floor$5 = Math.floor

  // `Math.trunc` method
  // https://tc39.github.io/ecma262/#sec-math.trunc
  _export(
    { target: 'Math', stat: true },
    {
      trunc: function trunc(it) {
        return (it > 0 ? floor$5 : ceil$2)(it)
      },
    }
  )

  // `Date.now` method
  // https://tc39.github.io/ecma262/#sec-date.now
  _export(
    { target: 'Date', stat: true },
    {
      now: function now() {
        return new Date().getTime()
      },
    }
  )

  var FORCED$e = fails(function() {
    return (
      new Date(NaN).toJSON() !== null ||
      Date.prototype.toJSON.call({
        toISOString: function() {
          return 1
        },
      }) !== 1
    )
  })

  // `Date.prototype.toJSON` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.tojson
  _export(
    { target: 'Date', proto: true, forced: FORCED$e },
    {
      // eslint-disable-next-line no-unused-vars
      toJSON: function toJSON(key) {
        var O = toObject$1(this)
        var pv = toPrimitive(O)
        return typeof pv == 'number' && !isFinite(pv) ? null : O.toISOString()
      },
    }
  )

  var padStart = stringPad.start

  var abs$6 = Math.abs
  var DatePrototype = Date.prototype
  var getTime = DatePrototype.getTime
  var nativeDateToISOString = DatePrototype.toISOString

  // `Date.prototype.toISOString` method implementation
  // https://tc39.github.io/ecma262/#sec-date.prototype.toisostring
  // PhantomJS / old WebKit fails here:
  var dateToIsoString =
    fails(function() {
      return (
        nativeDateToISOString.call(new Date(-5e13 - 1)) !=
        '0385-07-25T07:06:39.999Z'
      )
    }) ||
    !fails(function() {
      nativeDateToISOString.call(new Date(NaN))
    })
      ? function toISOString() {
          if (!isFinite(getTime.call(this)))
            throw RangeError('Invalid time value')
          var date = this
          var year = date.getUTCFullYear()
          var milliseconds = date.getUTCMilliseconds()
          var sign = year < 0 ? '-' : year > 9999 ? '+' : ''
          return (
            sign +
            padStart(abs$6(year), sign ? 6 : 4, 0) +
            '-' +
            padStart(date.getUTCMonth() + 1, 2, 0) +
            '-' +
            padStart(date.getUTCDate(), 2, 0) +
            'T' +
            padStart(date.getUTCHours(), 2, 0) +
            ':' +
            padStart(date.getUTCMinutes(), 2, 0) +
            ':' +
            padStart(date.getUTCSeconds(), 2, 0) +
            '.' +
            padStart(milliseconds, 3, 0) +
            'Z'
          )
        }
      : nativeDateToISOString

  // `Date.prototype.toISOString` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.toisostring
  // PhantomJS / old WebKit has a broken implementations
  _export(
    {
      target: 'Date',
      proto: true,
      forced: Date.prototype.toISOString !== dateToIsoString,
    },
    {
      toISOString: dateToIsoString,
    }
  )

  var DatePrototype$1 = Date.prototype
  var INVALID_DATE = 'Invalid Date'
  var TO_STRING$1 = 'toString'
  var nativeDateToString = DatePrototype$1[TO_STRING$1]
  var getTime$1 = DatePrototype$1.getTime

  // `Date.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.tostring
  if (new Date(NaN) + '' != INVALID_DATE) {
    redefine(DatePrototype$1, TO_STRING$1, function toString() {
      var value = getTime$1.call(this)
      // eslint-disable-next-line no-self-compare
      return value === value ? nativeDateToString.call(this) : INVALID_DATE
    })
  }

  var dateToPrimitive = function(hint) {
    if (hint !== 'string' && hint !== 'number' && hint !== 'default') {
      throw TypeError('Incorrect hint')
    }
    return toPrimitive(anObject(this), hint !== 'number')
  }

  var TO_PRIMITIVE$1 = wellKnownSymbol('toPrimitive')
  var DatePrototype$2 = Date.prototype

  // `Date.prototype[@@toPrimitive]` method
  // https://tc39.github.io/ecma262/#sec-date.prototype-@@toprimitive
  if (!(TO_PRIMITIVE$1 in DatePrototype$2)) {
    createNonEnumerableProperty(
      DatePrototype$2,
      TO_PRIMITIVE$1,
      dateToPrimitive
    )
  }

  var $stringify$1 = getBuiltIn('JSON', 'stringify')
  var re = /[\uD800-\uDFFF]/g
  var low = /^[\uD800-\uDBFF]$/
  var hi = /^[\uDC00-\uDFFF]$/

  var fix = function(match, offset, string) {
    var prev = string.charAt(offset - 1)
    var next = string.charAt(offset + 1)
    if (
      (low.test(match) && !hi.test(next)) ||
      (hi.test(match) && !low.test(prev))
    ) {
      return '\\u' + match.charCodeAt(0).toString(16)
    }
    return match
  }

  var FORCED$f = fails(function() {
    return (
      $stringify$1('\uDF06\uD834') !== '"\\udf06\\ud834"' ||
      $stringify$1('\uDEAD') !== '"\\udead"'
    )
  })

  if ($stringify$1) {
    // https://github.com/tc39/proposal-well-formed-stringify
    _export(
      { target: 'JSON', stat: true, forced: FORCED$f },
      {
        // eslint-disable-next-line no-unused-vars
        stringify: function stringify(it, replacer, space) {
          var result = $stringify$1.apply(null, arguments)
          return typeof result == 'string' ? result.replace(re, fix) : result
        },
      }
    )
  }

  var nativePromiseConstructor = global_1.Promise

  var engineIsIos = /(iphone|ipod|ipad).*applewebkit/i.test(engineUserAgent)

  var location = global_1.location
  var set$2 = global_1.setImmediate
  var clear = global_1.clearImmediate
  var process$2 = global_1.process
  var MessageChannel = global_1.MessageChannel
  var Dispatch = global_1.Dispatch
  var counter = 0
  var queue$2 = {}
  var ONREADYSTATECHANGE = 'onreadystatechange'
  var defer, channel, port

  var run = function(id) {
    // eslint-disable-next-line no-prototype-builtins
    if (queue$2.hasOwnProperty(id)) {
      var fn = queue$2[id]
      delete queue$2[id]
      fn()
    }
  }

  var runner = function(id) {
    return function() {
      run(id)
    }
  }

  var listener = function(event) {
    run(event.data)
  }

  var post = function(id) {
    // old engines have not location.origin
    global_1.postMessage(id + '', location.protocol + '//' + location.host)
  }

  // Node.js 0.9+ & IE10+ has setImmediate, otherwise:
  if (!set$2 || !clear) {
    set$2 = function setImmediate(fn) {
      var args = []
      var i = 1
      while (arguments.length > i) args.push(arguments[i++])
      queue$2[++counter] = function() {
        // eslint-disable-next-line no-new-func
        ;(typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args)
      }
      defer(counter)
      return counter
    }
    clear = function clearImmediate(id) {
      delete queue$2[id]
    }
    // Node.js 0.8-
    if (classofRaw(process$2) == 'process') {
      defer = function(id) {
        process$2.nextTick(runner(id))
      }
      // Sphere (JS game engine) Dispatch API
    } else if (Dispatch && Dispatch.now) {
      defer = function(id) {
        Dispatch.now(runner(id))
      }
      // Browsers with MessageChannel, includes WebWorkers
      // except iOS - https://github.com/zloirock/core-js/issues/624
    } else if (MessageChannel && !engineIsIos) {
      channel = new MessageChannel()
      port = channel.port2
      channel.port1.onmessage = listener
      defer = functionBindContext(port.postMessage, port, 1)
      // Browsers with postMessage, skip WebWorkers
      // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
    } else if (
      global_1.addEventListener &&
      typeof postMessage == 'function' &&
      !global_1.importScripts &&
      !fails(post)
    ) {
      defer = post
      global_1.addEventListener('message', listener, false)
      // IE8-
    } else if (ONREADYSTATECHANGE in documentCreateElement('script')) {
      defer = function(id) {
        html.appendChild(documentCreateElement('script'))[
          ONREADYSTATECHANGE
        ] = function() {
          html.removeChild(this)
          run(id)
        }
      }
      // Rest old browsers
    } else {
      defer = function(id) {
        setTimeout(runner(id), 0)
      }
    }
  }

  var task = {
    set: set$2,
    clear: clear,
  }

  var getOwnPropertyDescriptor$7 = objectGetOwnPropertyDescriptor.f

  var macrotask = task.set

  var MutationObserver =
    global_1.MutationObserver || global_1.WebKitMutationObserver
  var process$3 = global_1.process
  var Promise$2 = global_1.Promise
  var IS_NODE = classofRaw(process$3) == 'process'
  // Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
  var queueMicrotaskDescriptor = getOwnPropertyDescriptor$7(
    global_1,
    'queueMicrotask'
  )
  var queueMicrotask =
    queueMicrotaskDescriptor && queueMicrotaskDescriptor.value

  var flush$1, head, last$1, notify, toggle, node, promise, then

  // modern engines have queueMicrotask method
  if (!queueMicrotask) {
    flush$1 = function() {
      var parent, fn
      if (IS_NODE && (parent = process$3.domain)) parent.exit()
      while (head) {
        fn = head.fn
        head = head.next
        try {
          fn()
        } catch (error) {
          if (head) notify()
          else last$1 = undefined
          throw error
        }
      }
      last$1 = undefined
      if (parent) parent.enter()
    }

    // Node.js
    if (IS_NODE) {
      notify = function() {
        process$3.nextTick(flush$1)
      }
      // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
    } else if (MutationObserver && !engineIsIos) {
      toggle = true
      node = document.createTextNode('')
      new MutationObserver(flush$1).observe(node, { characterData: true })
      notify = function() {
        node.data = toggle = !toggle
      }
      // environments with maybe non-completely correct, but existent Promise
    } else if (Promise$2 && Promise$2.resolve) {
      // Promise.resolve without an argument throws an error in LG WebOS 2
      promise = Promise$2.resolve(undefined)
      then = promise.then
      notify = function() {
        then.call(promise, flush$1)
      }
      // for other environments - macrotask based on:
      // - setImmediate
      // - MessageChannel
      // - window.postMessag
      // - onreadystatechange
      // - setTimeout
    } else {
      notify = function() {
        // strange IE + webpack dev server bug - use .call(global)
        macrotask.call(global_1, flush$1)
      }
    }
  }

  var microtask =
    queueMicrotask ||
    function(fn) {
      var task = { fn: fn, next: undefined }
      if (last$1) last$1.next = task
      if (!head) {
        head = task
        notify()
      }
      last$1 = task
    }

  var PromiseCapability = function(C) {
    var resolve, reject
    this.promise = new C(function($$resolve, $$reject) {
      if (resolve !== undefined || reject !== undefined)
        throw TypeError('Bad Promise constructor')
      resolve = $$resolve
      reject = $$reject
    })
    this.resolve = aFunction$1(resolve)
    this.reject = aFunction$1(reject)
  }

  // 25.4.1.5 NewPromiseCapability(C)
  var f$7 = function(C) {
    return new PromiseCapability(C)
  }

  var newPromiseCapability = {
    f: f$7,
  }

  var promiseResolve = function(C, x) {
    anObject(C)
    if (isObject(x) && x.constructor === C) return x
    var promiseCapability = newPromiseCapability.f(C)
    var resolve = promiseCapability.resolve
    resolve(x)
    return promiseCapability.promise
  }

  var hostReportErrors = function(a, b) {
    var console = global_1.console
    if (console && console.error) {
      arguments.length === 1 ? console.error(a) : console.error(a, b)
    }
  }

  var perform = function(exec) {
    try {
      return { error: false, value: exec() }
    } catch (error) {
      return { error: true, value: error }
    }
  }

  var task$1 = task.set

  var SPECIES$6 = wellKnownSymbol('species')
  var PROMISE = 'Promise'
  var getInternalState$5 = internalState.get
  var setInternalState$6 = internalState.set
  var getInternalPromiseState = internalState.getterFor(PROMISE)
  var PromiseConstructor = nativePromiseConstructor
  var TypeError$1 = global_1.TypeError
  var document$2 = global_1.document
  var process$4 = global_1.process
  var $fetch = getBuiltIn('fetch')
  var newPromiseCapability$1 = newPromiseCapability.f
  var newGenericPromiseCapability = newPromiseCapability$1
  var IS_NODE$1 = classofRaw(process$4) == 'process'
  var DISPATCH_EVENT = !!(
    document$2 &&
    document$2.createEvent &&
    global_1.dispatchEvent
  )
  var UNHANDLED_REJECTION = 'unhandledrejection'
  var REJECTION_HANDLED = 'rejectionhandled'
  var PENDING = 0
  var FULFILLED = 1
  var REJECTED = 2
  var HANDLED = 1
  var UNHANDLED = 2
  var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen

  var FORCED$g = isForced_1(PROMISE, function() {
    var GLOBAL_CORE_JS_PROMISE =
      inspectSource(PromiseConstructor) !== String(PromiseConstructor)
    if (!GLOBAL_CORE_JS_PROMISE) {
      // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
      // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
      // We can't detect it synchronously, so just check versions
      if (engineV8Version === 66) return true
      // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
      if (!IS_NODE$1 && typeof PromiseRejectionEvent != 'function') return true
    }
    // We can't use @@species feature detection in V8 since it causes
    // deoptimization and performance degradation
    // https://github.com/zloirock/core-js/issues/679
    if (engineV8Version >= 51 && /native code/.test(PromiseConstructor))
      return false
    // Detect correctness of subclassing with @@species support
    var promise = PromiseConstructor.resolve(1)
    var FakePromise = function(exec) {
      exec(
        function() {
          /* empty */
        },
        function() {
          /* empty */
        }
      )
    }
    var constructor = (promise.constructor = {})
    constructor[SPECIES$6] = FakePromise
    return !(
      promise.then(function() {
        /* empty */
      }) instanceof FakePromise
    )
  })

  var INCORRECT_ITERATION$1 =
    FORCED$g ||
    !checkCorrectnessOfIteration(function(iterable) {
      PromiseConstructor.all(iterable)['catch'](function() {
        /* empty */
      })
    })

  // helpers
  var isThenable = function(it) {
    var then
    return isObject(it) && typeof (then = it.then) == 'function' ? then : false
  }

  var notify$1 = function(promise, state, isReject) {
    if (state.notified) return
    state.notified = true
    var chain = state.reactions
    microtask(function() {
      var value = state.value
      var ok = state.state == FULFILLED
      var index = 0
      // variable length - can't use forEach
      while (chain.length > index) {
        var reaction = chain[index++]
        var handler = ok ? reaction.ok : reaction.fail
        var resolve = reaction.resolve
        var reject = reaction.reject
        var domain = reaction.domain
        var result, then, exited
        try {
          if (handler) {
            if (!ok) {
              if (state.rejection === UNHANDLED)
                onHandleUnhandled(promise, state)
              state.rejection = HANDLED
            }
            if (handler === true) result = value
            else {
              if (domain) domain.enter()
              result = handler(value) // can throw
              if (domain) {
                domain.exit()
                exited = true
              }
            }
            if (result === reaction.promise) {
              reject(TypeError$1('Promise-chain cycle'))
            } else if ((then = isThenable(result))) {
              then.call(result, resolve, reject)
            } else resolve(result)
          } else reject(value)
        } catch (error) {
          if (domain && !exited) domain.exit()
          reject(error)
        }
      }
      state.reactions = []
      state.notified = false
      if (isReject && !state.rejection) onUnhandled(promise, state)
    })
  }

  var dispatchEvent = function(name, promise, reason) {
    var event, handler
    if (DISPATCH_EVENT) {
      event = document$2.createEvent('Event')
      event.promise = promise
      event.reason = reason
      event.initEvent(name, false, true)
      global_1.dispatchEvent(event)
    } else event = { promise: promise, reason: reason }
    if ((handler = global_1['on' + name])) handler(event)
    else if (name === UNHANDLED_REJECTION)
      hostReportErrors('Unhandled promise rejection', reason)
  }

  var onUnhandled = function(promise, state) {
    task$1.call(global_1, function() {
      var value = state.value
      var IS_UNHANDLED = isUnhandled(state)
      var result
      if (IS_UNHANDLED) {
        result = perform(function() {
          if (IS_NODE$1) {
            process$4.emit('unhandledRejection', value, promise)
          } else dispatchEvent(UNHANDLED_REJECTION, promise, value)
        })
        // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
        state.rejection = IS_NODE$1 || isUnhandled(state) ? UNHANDLED : HANDLED
        if (result.error) throw result.value
      }
    })
  }

  var isUnhandled = function(state) {
    return state.rejection !== HANDLED && !state.parent
  }

  var onHandleUnhandled = function(promise, state) {
    task$1.call(global_1, function() {
      if (IS_NODE$1) {
        process$4.emit('rejectionHandled', promise)
      } else dispatchEvent(REJECTION_HANDLED, promise, state.value)
    })
  }

  var bind = function(fn, promise, state, unwrap) {
    return function(value) {
      fn(promise, state, value, unwrap)
    }
  }

  var internalReject = function(promise, state, value, unwrap) {
    if (state.done) return
    state.done = true
    if (unwrap) state = unwrap
    state.value = value
    state.state = REJECTED
    notify$1(promise, state, true)
  }

  var internalResolve = function(promise, state, value, unwrap) {
    if (state.done) return
    state.done = true
    if (unwrap) state = unwrap
    try {
      if (promise === value)
        throw TypeError$1("Promise can't be resolved itself")
      var then = isThenable(value)
      if (then) {
        microtask(function() {
          var wrapper = { done: false }
          try {
            then.call(
              value,
              bind(internalResolve, promise, wrapper, state),
              bind(internalReject, promise, wrapper, state)
            )
          } catch (error) {
            internalReject(promise, wrapper, error, state)
          }
        })
      } else {
        state.value = value
        state.state = FULFILLED
        notify$1(promise, state, false)
      }
    } catch (error) {
      internalReject(promise, { done: false }, error, state)
    }
  }

  // constructor polyfill
  if (FORCED$g) {
    // 25.4.3.1 Promise(executor)
    PromiseConstructor = function Promise(executor) {
      anInstance(this, PromiseConstructor, PROMISE)
      aFunction$1(executor)
      Internal.call(this)
      var state = getInternalState$5(this)
      try {
        executor(
          bind(internalResolve, this, state),
          bind(internalReject, this, state)
        )
      } catch (error) {
        internalReject(this, state, error)
      }
    }
    // eslint-disable-next-line no-unused-vars
    Internal = function Promise(executor) {
      setInternalState$6(this, {
        type: PROMISE,
        done: false,
        notified: false,
        parent: false,
        reactions: [],
        rejection: false,
        state: PENDING,
        value: undefined,
      })
    }
    Internal.prototype = redefineAll(PromiseConstructor.prototype, {
      // `Promise.prototype.then` method
      // https://tc39.github.io/ecma262/#sec-promise.prototype.then
      then: function then(onFulfilled, onRejected) {
        var state = getInternalPromiseState(this)
        var reaction = newPromiseCapability$1(
          speciesConstructor(this, PromiseConstructor)
        )
        reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true
        reaction.fail = typeof onRejected == 'function' && onRejected
        reaction.domain = IS_NODE$1 ? process$4.domain : undefined
        state.parent = true
        state.reactions.push(reaction)
        if (state.state != PENDING) notify$1(this, state, false)
        return reaction.promise
      },
      // `Promise.prototype.catch` method
      // https://tc39.github.io/ecma262/#sec-promise.prototype.catch
      catch: function(onRejected) {
        return this.then(undefined, onRejected)
      },
    })
    OwnPromiseCapability = function() {
      var promise = new Internal()
      var state = getInternalState$5(promise)
      this.promise = promise
      this.resolve = bind(internalResolve, promise, state)
      this.reject = bind(internalReject, promise, state)
    }
    newPromiseCapability.f = newPromiseCapability$1 = function(C) {
      return C === PromiseConstructor || C === PromiseWrapper
        ? new OwnPromiseCapability(C)
        : newGenericPromiseCapability(C)
    }

    if (typeof nativePromiseConstructor == 'function') {
      nativeThen = nativePromiseConstructor.prototype.then

      // wrap native Promise#then for native async functions
      redefine(
        nativePromiseConstructor.prototype,
        'then',
        function then(onFulfilled, onRejected) {
          var that = this
          return new PromiseConstructor(function(resolve, reject) {
            nativeThen.call(that, resolve, reject)
          }).then(onFulfilled, onRejected)
          // https://github.com/zloirock/core-js/issues/640
        },
        { unsafe: true }
      )

      // wrap fetch result
      if (typeof $fetch == 'function')
        _export(
          { global: true, enumerable: true, forced: true },
          {
            // eslint-disable-next-line no-unused-vars
            fetch: function fetch(input /* , init */) {
              return promiseResolve(
                PromiseConstructor,
                $fetch.apply(global_1, arguments)
              )
            },
          }
        )
    }
  }

  _export(
    { global: true, wrap: true, forced: FORCED$g },
    {
      Promise: PromiseConstructor,
    }
  )

  setToStringTag(PromiseConstructor, PROMISE, false, true)
  setSpecies(PROMISE)

  PromiseWrapper = getBuiltIn(PROMISE)

  // statics
  _export(
    { target: PROMISE, stat: true, forced: FORCED$g },
    {
      // `Promise.reject` method
      // https://tc39.github.io/ecma262/#sec-promise.reject
      reject: function reject(r) {
        var capability = newPromiseCapability$1(this)
        capability.reject.call(undefined, r)
        return capability.promise
      },
    }
  )

  _export(
    { target: PROMISE, stat: true, forced: FORCED$g },
    {
      // `Promise.resolve` method
      // https://tc39.github.io/ecma262/#sec-promise.resolve
      resolve: function resolve(x) {
        return promiseResolve(this, x)
      },
    }
  )

  _export(
    { target: PROMISE, stat: true, forced: INCORRECT_ITERATION$1 },
    {
      // `Promise.all` method
      // https://tc39.github.io/ecma262/#sec-promise.all
      all: function all(iterable) {
        var C = this
        var capability = newPromiseCapability$1(C)
        var resolve = capability.resolve
        var reject = capability.reject
        var result = perform(function() {
          var $promiseResolve = aFunction$1(C.resolve)
          var values = []
          var counter = 0
          var remaining = 1
          iterate_1(iterable, function(promise) {
            var index = counter++
            var alreadyCalled = false
            values.push(undefined)
            remaining++
            $promiseResolve.call(C, promise).then(function(value) {
              if (alreadyCalled) return
              alreadyCalled = true
              values[index] = value
              --remaining || resolve(values)
            }, reject)
          })
          --remaining || resolve(values)
        })
        if (result.error) reject(result.value)
        return capability.promise
      },
      // `Promise.race` method
      // https://tc39.github.io/ecma262/#sec-promise.race
      race: function race(iterable) {
        var C = this
        var capability = newPromiseCapability$1(C)
        var reject = capability.reject
        var result = perform(function() {
          var $promiseResolve = aFunction$1(C.resolve)
          iterate_1(iterable, function(promise) {
            $promiseResolve.call(C, promise).then(capability.resolve, reject)
          })
        })
        if (result.error) reject(result.value)
        return capability.promise
      },
    }
  )

  // `Promise.allSettled` method
  // https://github.com/tc39/proposal-promise-allSettled
  _export(
    { target: 'Promise', stat: true },
    {
      allSettled: function allSettled(iterable) {
        var C = this
        var capability = newPromiseCapability.f(C)
        var resolve = capability.resolve
        var reject = capability.reject
        var result = perform(function() {
          var promiseResolve = aFunction$1(C.resolve)
          var values = []
          var counter = 0
          var remaining = 1
          iterate_1(iterable, function(promise) {
            var index = counter++
            var alreadyCalled = false
            values.push(undefined)
            remaining++
            promiseResolve.call(C, promise).then(
              function(value) {
                if (alreadyCalled) return
                alreadyCalled = true
                values[index] = { status: 'fulfilled', value: value }
                --remaining || resolve(values)
              },
              function(e) {
                if (alreadyCalled) return
                alreadyCalled = true
                values[index] = { status: 'rejected', reason: e }
                --remaining || resolve(values)
              }
            )
          })
          --remaining || resolve(values)
        })
        if (result.error) reject(result.value)
        return capability.promise
      },
    }
  )

  // Safari bug https://bugs.webkit.org/show_bug.cgi?id=200829
  var NON_GENERIC =
    !!nativePromiseConstructor &&
    fails(function() {
      nativePromiseConstructor.prototype['finally'].call(
        {
          then: function() {
            /* empty */
          },
        },
        function() {
          /* empty */
        }
      )
    })

  // `Promise.prototype.finally` method
  // https://tc39.github.io/ecma262/#sec-promise.prototype.finally
  _export(
    { target: 'Promise', proto: true, real: true, forced: NON_GENERIC },
    {
      finally: function(onFinally) {
        var C = speciesConstructor(this, getBuiltIn('Promise'))
        var isFunction = typeof onFinally == 'function'
        return this.then(
          isFunction
            ? function(x) {
                return promiseResolve(C, onFinally()).then(function() {
                  return x
                })
              }
            : onFinally,
          isFunction
            ? function(e) {
                return promiseResolve(C, onFinally()).then(function() {
                  throw e
                })
              }
            : onFinally
        )
      },
    }
  )

  // patch native Promise.prototype for native async functions
  if (
    typeof nativePromiseConstructor == 'function' &&
    !nativePromiseConstructor.prototype['finally']
  ) {
    redefine(
      nativePromiseConstructor.prototype,
      'finally',
      getBuiltIn('Promise').prototype['finally']
    )
  }

  var getWeakData = internalMetadata.getWeakData

  var setInternalState$7 = internalState.set
  var internalStateGetterFor$1 = internalState.getterFor
  var find = arrayIteration.find
  var findIndex = arrayIteration.findIndex
  var id$2 = 0

  // fallback for uncaught frozen keys
  var uncaughtFrozenStore = function(store) {
    return store.frozen || (store.frozen = new UncaughtFrozenStore())
  }

  var UncaughtFrozenStore = function() {
    this.entries = []
  }

  var findUncaughtFrozen = function(store, key) {
    return find(store.entries, function(it) {
      return it[0] === key
    })
  }

  UncaughtFrozenStore.prototype = {
    get: function(key) {
      var entry = findUncaughtFrozen(this, key)
      if (entry) return entry[1]
    },
    has: function(key) {
      return !!findUncaughtFrozen(this, key)
    },
    set: function(key, value) {
      var entry = findUncaughtFrozen(this, key)
      if (entry) entry[1] = value
      else this.entries.push([key, value])
    },
    delete: function(key) {
      var index = findIndex(this.entries, function(it) {
        return it[0] === key
      })
      if (~index) this.entries.splice(index, 1)
      return !!~index
    },
  }

  var collectionWeak = {
    getConstructor: function(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
      var C = wrapper(function(that, iterable) {
        anInstance(that, C, CONSTRUCTOR_NAME)
        setInternalState$7(that, {
          type: CONSTRUCTOR_NAME,
          id: id$2++,
          frozen: undefined,
        })
        if (iterable != undefined)
          iterate_1(iterable, that[ADDER], that, IS_MAP)
      })

      var getInternalState = internalStateGetterFor$1(CONSTRUCTOR_NAME)

      var define = function(that, key, value) {
        var state = getInternalState(that)
        var data = getWeakData(anObject(key), true)
        if (data === true) uncaughtFrozenStore(state).set(key, value)
        else data[state.id] = value
        return that
      }

      redefineAll(C.prototype, {
        // 23.3.3.2 WeakMap.prototype.delete(key)
        // 23.4.3.3 WeakSet.prototype.delete(value)
        delete: function(key) {
          var state = getInternalState(this)
          if (!isObject(key)) return false
          var data = getWeakData(key)
          if (data === true) return uncaughtFrozenStore(state)['delete'](key)
          return data && has(data, state.id) && delete data[state.id]
        },
        // 23.3.3.4 WeakMap.prototype.has(key)
        // 23.4.3.4 WeakSet.prototype.has(value)
        has: function has$1(key) {
          var state = getInternalState(this)
          if (!isObject(key)) return false
          var data = getWeakData(key)
          if (data === true) return uncaughtFrozenStore(state).has(key)
          return data && has(data, state.id)
        },
      })

      redefineAll(
        C.prototype,
        IS_MAP
          ? {
              // 23.3.3.3 WeakMap.prototype.get(key)
              get: function get(key) {
                var state = getInternalState(this)
                if (isObject(key)) {
                  var data = getWeakData(key)
                  if (data === true) return uncaughtFrozenStore(state).get(key)
                  return data ? data[state.id] : undefined
                }
              },
              // 23.3.3.5 WeakMap.prototype.set(key, value)
              set: function set(key, value) {
                return define(this, key, value)
              },
            }
          : {
              // 23.4.3.1 WeakSet.prototype.add(value)
              add: function add(value) {
                return define(this, value, true)
              },
            }
      )

      return C
    },
  }

  var es_weakMap = createCommonjsModule(function(module) {
    var enforceIternalState = internalState.enforce

    var IS_IE11 = !global_1.ActiveXObject && 'ActiveXObject' in global_1
    var isExtensible = Object.isExtensible
    var InternalWeakMap

    var wrapper = function(init) {
      return function WeakMap() {
        return init(this, arguments.length ? arguments[0] : undefined)
      }
    }

    // `WeakMap` constructor
    // https://tc39.github.io/ecma262/#sec-weakmap-constructor
    var $WeakMap = (module.exports = collection(
      'WeakMap',
      wrapper,
      collectionWeak
    ))

    // IE11 WeakMap frozen keys fix
    // We can't use feature detection because it crash some old IE builds
    // https://github.com/zloirock/core-js/issues/485
    if (nativeWeakMap && IS_IE11) {
      InternalWeakMap = collectionWeak.getConstructor(wrapper, 'WeakMap', true)
      internalMetadata.REQUIRED = true
      var WeakMapPrototype = $WeakMap.prototype
      var nativeDelete = WeakMapPrototype['delete']
      var nativeHas = WeakMapPrototype.has
      var nativeGet = WeakMapPrototype.get
      var nativeSet = WeakMapPrototype.set
      redefineAll(WeakMapPrototype, {
        delete: function(key) {
          if (isObject(key) && !isExtensible(key)) {
            var state = enforceIternalState(this)
            if (!state.frozen) state.frozen = new InternalWeakMap()
            return nativeDelete.call(this, key) || state.frozen['delete'](key)
          }
          return nativeDelete.call(this, key)
        },
        has: function has(key) {
          if (isObject(key) && !isExtensible(key)) {
            var state = enforceIternalState(this)
            if (!state.frozen) state.frozen = new InternalWeakMap()
            return nativeHas.call(this, key) || state.frozen.has(key)
          }
          return nativeHas.call(this, key)
        },
        get: function get(key) {
          if (isObject(key) && !isExtensible(key)) {
            var state = enforceIternalState(this)
            if (!state.frozen) state.frozen = new InternalWeakMap()
            return nativeHas.call(this, key)
              ? nativeGet.call(this, key)
              : state.frozen.get(key)
          }
          return nativeGet.call(this, key)
        },
        set: function set(key, value) {
          if (isObject(key) && !isExtensible(key)) {
            var state = enforceIternalState(this)
            if (!state.frozen) state.frozen = new InternalWeakMap()
            nativeHas.call(this, key)
              ? nativeSet.call(this, key, value)
              : state.frozen.set(key, value)
          } else nativeSet.call(this, key, value)
          return this
        },
      })
    }
  })

  // `WeakSet` constructor
  // https://tc39.github.io/ecma262/#sec-weakset-constructor
  collection(
    'WeakSet',
    function(init) {
      return function WeakSet() {
        return init(this, arguments.length ? arguments[0] : undefined)
      }
    },
    collectionWeak
  )

  var arrayBufferNative =
    typeof ArrayBuffer !== 'undefined' && typeof DataView !== 'undefined'

  // `ToIndex` abstract operation
  // https://tc39.github.io/ecma262/#sec-toindex
  var toIndex = function(it) {
    if (it === undefined) return 0
    var number = toInteger(it)
    var length = toLength(number)
    if (number !== length) throw RangeError('Wrong length or index')
    return length
  }

  // IEEE754 conversions based on https://github.com/feross/ieee754
  // eslint-disable-next-line no-shadow-restricted-names
  var Infinity$1 = 1 / 0
  var abs$7 = Math.abs
  var pow$3 = Math.pow
  var floor$6 = Math.floor
  var log$8 = Math.log
  var LN2$2 = Math.LN2

  var pack = function(number, mantissaLength, bytes) {
    var buffer = new Array(bytes)
    var exponentLength = bytes * 8 - mantissaLength - 1
    var eMax = (1 << exponentLength) - 1
    var eBias = eMax >> 1
    var rt = mantissaLength === 23 ? pow$3(2, -24) - pow$3(2, -77) : 0
    var sign = number < 0 || (number === 0 && 1 / number < 0) ? 1 : 0
    var index = 0
    var exponent, mantissa, c
    number = abs$7(number)
    // eslint-disable-next-line no-self-compare
    if (number != number || number === Infinity$1) {
      // eslint-disable-next-line no-self-compare
      mantissa = number != number ? 1 : 0
      exponent = eMax
    } else {
      exponent = floor$6(log$8(number) / LN2$2)
      if (number * (c = pow$3(2, -exponent)) < 1) {
        exponent--
        c *= 2
      }
      if (exponent + eBias >= 1) {
        number += rt / c
      } else {
        number += rt * pow$3(2, 1 - eBias)
      }
      if (number * c >= 2) {
        exponent++
        c /= 2
      }
      if (exponent + eBias >= eMax) {
        mantissa = 0
        exponent = eMax
      } else if (exponent + eBias >= 1) {
        mantissa = (number * c - 1) * pow$3(2, mantissaLength)
        exponent = exponent + eBias
      } else {
        mantissa = number * pow$3(2, eBias - 1) * pow$3(2, mantissaLength)
        exponent = 0
      }
    }
    for (
      ;
      mantissaLength >= 8;
      buffer[index++] = mantissa & 255, mantissa /= 256, mantissaLength -= 8
    );
    exponent = (exponent << mantissaLength) | mantissa
    exponentLength += mantissaLength
    for (
      ;
      exponentLength > 0;
      buffer[index++] = exponent & 255, exponent /= 256, exponentLength -= 8
    );
    buffer[--index] |= sign * 128
    return buffer
  }

  var unpack = function(buffer, mantissaLength) {
    var bytes = buffer.length
    var exponentLength = bytes * 8 - mantissaLength - 1
    var eMax = (1 << exponentLength) - 1
    var eBias = eMax >> 1
    var nBits = exponentLength - 7
    var index = bytes - 1
    var sign = buffer[index--]
    var exponent = sign & 127
    var mantissa
    sign >>= 7
    for (
      ;
      nBits > 0;
      exponent = exponent * 256 + buffer[index], index--, nBits -= 8
    );
    mantissa = exponent & ((1 << -nBits) - 1)
    exponent >>= -nBits
    nBits += mantissaLength
    for (
      ;
      nBits > 0;
      mantissa = mantissa * 256 + buffer[index], index--, nBits -= 8
    );
    if (exponent === 0) {
      exponent = 1 - eBias
    } else if (exponent === eMax) {
      return mantissa ? NaN : sign ? -Infinity$1 : Infinity$1
    } else {
      mantissa = mantissa + pow$3(2, mantissaLength)
      exponent = exponent - eBias
    }
    return (sign ? -1 : 1) * mantissa * pow$3(2, exponent - mantissaLength)
  }

  var ieee754 = {
    pack: pack,
    unpack: unpack,
  }

  var getOwnPropertyNames$2 = objectGetOwnPropertyNames.f
  var defineProperty$a = objectDefineProperty.f

  var getInternalState$6 = internalState.get
  var setInternalState$8 = internalState.set
  var ARRAY_BUFFER = 'ArrayBuffer'
  var DATA_VIEW = 'DataView'
  var PROTOTYPE$2 = 'prototype'
  var WRONG_LENGTH = 'Wrong length'
  var WRONG_INDEX = 'Wrong index'
  var NativeArrayBuffer = global_1[ARRAY_BUFFER]
  var $ArrayBuffer = NativeArrayBuffer
  var $DataView = global_1[DATA_VIEW]
  var $DataViewPrototype = $DataView && $DataView[PROTOTYPE$2]
  var ObjectPrototype$2 = Object.prototype
  var RangeError$1 = global_1.RangeError

  var packIEEE754 = ieee754.pack
  var unpackIEEE754 = ieee754.unpack

  var packInt8 = function(number) {
    return [number & 0xff]
  }

  var packInt16 = function(number) {
    return [number & 0xff, (number >> 8) & 0xff]
  }

  var packInt32 = function(number) {
    return [
      number & 0xff,
      (number >> 8) & 0xff,
      (number >> 16) & 0xff,
      (number >> 24) & 0xff,
    ]
  }

  var unpackInt32 = function(buffer) {
    return (buffer[3] << 24) | (buffer[2] << 16) | (buffer[1] << 8) | buffer[0]
  }

  var packFloat32 = function(number) {
    return packIEEE754(number, 23, 4)
  }

  var packFloat64 = function(number) {
    return packIEEE754(number, 52, 8)
  }

  var addGetter = function(Constructor, key) {
    defineProperty$a(Constructor[PROTOTYPE$2], key, {
      get: function() {
        return getInternalState$6(this)[key]
      },
    })
  }

  var get$1 = function(view, count, index, isLittleEndian) {
    var intIndex = toIndex(index)
    var store = getInternalState$6(view)
    if (intIndex + count > store.byteLength) throw RangeError$1(WRONG_INDEX)
    var bytes = getInternalState$6(store.buffer).bytes
    var start = intIndex + store.byteOffset
    var pack = bytes.slice(start, start + count)
    return isLittleEndian ? pack : pack.reverse()
  }

  var set$3 = function(view, count, index, conversion, value, isLittleEndian) {
    var intIndex = toIndex(index)
    var store = getInternalState$6(view)
    if (intIndex + count > store.byteLength) throw RangeError$1(WRONG_INDEX)
    var bytes = getInternalState$6(store.buffer).bytes
    var start = intIndex + store.byteOffset
    var pack = conversion(+value)
    for (var i = 0; i < count; i++)
      bytes[start + i] = pack[isLittleEndian ? i : count - i - 1]
  }

  if (!arrayBufferNative) {
    $ArrayBuffer = function ArrayBuffer(length) {
      anInstance(this, $ArrayBuffer, ARRAY_BUFFER)
      var byteLength = toIndex(length)
      setInternalState$8(this, {
        bytes: arrayFill.call(new Array(byteLength), 0),
        byteLength: byteLength,
      })
      if (!descriptors) this.byteLength = byteLength
    }

    $DataView = function DataView(buffer, byteOffset, byteLength) {
      anInstance(this, $DataView, DATA_VIEW)
      anInstance(buffer, $ArrayBuffer, DATA_VIEW)
      var bufferLength = getInternalState$6(buffer).byteLength
      var offset = toInteger(byteOffset)
      if (offset < 0 || offset > bufferLength)
        throw RangeError$1('Wrong offset')
      byteLength =
        byteLength === undefined ? bufferLength - offset : toLength(byteLength)
      if (offset + byteLength > bufferLength) throw RangeError$1(WRONG_LENGTH)
      setInternalState$8(this, {
        buffer: buffer,
        byteLength: byteLength,
        byteOffset: offset,
      })
      if (!descriptors) {
        this.buffer = buffer
        this.byteLength = byteLength
        this.byteOffset = offset
      }
    }

    if (descriptors) {
      addGetter($ArrayBuffer, 'byteLength')
      addGetter($DataView, 'buffer')
      addGetter($DataView, 'byteLength')
      addGetter($DataView, 'byteOffset')
    }

    redefineAll($DataView[PROTOTYPE$2], {
      getInt8: function getInt8(byteOffset) {
        return (get$1(this, 1, byteOffset)[0] << 24) >> 24
      },
      getUint8: function getUint8(byteOffset) {
        return get$1(this, 1, byteOffset)[0]
      },
      getInt16: function getInt16(byteOffset /* , littleEndian */) {
        var bytes = get$1(
          this,
          2,
          byteOffset,
          arguments.length > 1 ? arguments[1] : undefined
        )
        return (((bytes[1] << 8) | bytes[0]) << 16) >> 16
      },
      getUint16: function getUint16(byteOffset /* , littleEndian */) {
        var bytes = get$1(
          this,
          2,
          byteOffset,
          arguments.length > 1 ? arguments[1] : undefined
        )
        return (bytes[1] << 8) | bytes[0]
      },
      getInt32: function getInt32(byteOffset /* , littleEndian */) {
        return unpackInt32(
          get$1(
            this,
            4,
            byteOffset,
            arguments.length > 1 ? arguments[1] : undefined
          )
        )
      },
      getUint32: function getUint32(byteOffset /* , littleEndian */) {
        return (
          unpackInt32(
            get$1(
              this,
              4,
              byteOffset,
              arguments.length > 1 ? arguments[1] : undefined
            )
          ) >>> 0
        )
      },
      getFloat32: function getFloat32(byteOffset /* , littleEndian */) {
        return unpackIEEE754(
          get$1(
            this,
            4,
            byteOffset,
            arguments.length > 1 ? arguments[1] : undefined
          ),
          23
        )
      },
      getFloat64: function getFloat64(byteOffset /* , littleEndian */) {
        return unpackIEEE754(
          get$1(
            this,
            8,
            byteOffset,
            arguments.length > 1 ? arguments[1] : undefined
          ),
          52
        )
      },
      setInt8: function setInt8(byteOffset, value) {
        set$3(this, 1, byteOffset, packInt8, value)
      },
      setUint8: function setUint8(byteOffset, value) {
        set$3(this, 1, byteOffset, packInt8, value)
      },
      setInt16: function setInt16(byteOffset, value /* , littleEndian */) {
        set$3(
          this,
          2,
          byteOffset,
          packInt16,
          value,
          arguments.length > 2 ? arguments[2] : undefined
        )
      },
      setUint16: function setUint16(byteOffset, value /* , littleEndian */) {
        set$3(
          this,
          2,
          byteOffset,
          packInt16,
          value,
          arguments.length > 2 ? arguments[2] : undefined
        )
      },
      setInt32: function setInt32(byteOffset, value /* , littleEndian */) {
        set$3(
          this,
          4,
          byteOffset,
          packInt32,
          value,
          arguments.length > 2 ? arguments[2] : undefined
        )
      },
      setUint32: function setUint32(byteOffset, value /* , littleEndian */) {
        set$3(
          this,
          4,
          byteOffset,
          packInt32,
          value,
          arguments.length > 2 ? arguments[2] : undefined
        )
      },
      setFloat32: function setFloat32(byteOffset, value /* , littleEndian */) {
        set$3(
          this,
          4,
          byteOffset,
          packFloat32,
          value,
          arguments.length > 2 ? arguments[2] : undefined
        )
      },
      setFloat64: function setFloat64(byteOffset, value /* , littleEndian */) {
        set$3(
          this,
          8,
          byteOffset,
          packFloat64,
          value,
          arguments.length > 2 ? arguments[2] : undefined
        )
      },
    })
  } else {
    if (
      !fails(function() {
        NativeArrayBuffer(1)
      }) ||
      !fails(function() {
        new NativeArrayBuffer(-1) // eslint-disable-line no-new
      }) ||
      fails(function() {
        new NativeArrayBuffer() // eslint-disable-line no-new
        new NativeArrayBuffer(1.5) // eslint-disable-line no-new
        new NativeArrayBuffer(NaN) // eslint-disable-line no-new
        return NativeArrayBuffer.name != ARRAY_BUFFER
      })
    ) {
      $ArrayBuffer = function ArrayBuffer(length) {
        anInstance(this, $ArrayBuffer)
        return new NativeArrayBuffer(toIndex(length))
      }
      var ArrayBufferPrototype = ($ArrayBuffer[PROTOTYPE$2] =
        NativeArrayBuffer[PROTOTYPE$2])
      for (
        var keys$3 = getOwnPropertyNames$2(NativeArrayBuffer), j$1 = 0, key$1;
        keys$3.length > j$1;

      ) {
        if (!((key$1 = keys$3[j$1++]) in $ArrayBuffer)) {
          createNonEnumerableProperty(
            $ArrayBuffer,
            key$1,
            NativeArrayBuffer[key$1]
          )
        }
      }
      ArrayBufferPrototype.constructor = $ArrayBuffer
    }

    // WebKit bug - the same parent prototype for typed arrays and data view
    if (
      objectSetPrototypeOf &&
      objectGetPrototypeOf($DataViewPrototype) !== ObjectPrototype$2
    ) {
      objectSetPrototypeOf($DataViewPrototype, ObjectPrototype$2)
    }

    // iOS Safari 7.x bug
    var testView = new $DataView(new $ArrayBuffer(2))
    var nativeSetInt8 = $DataViewPrototype.setInt8
    testView.setInt8(0, 2147483648)
    testView.setInt8(1, 2147483649)
    if (testView.getInt8(0) || !testView.getInt8(1))
      redefineAll(
        $DataViewPrototype,
        {
          setInt8: function setInt8(byteOffset, value) {
            nativeSetInt8.call(this, byteOffset, (value << 24) >> 24)
          },
          setUint8: function setUint8(byteOffset, value) {
            nativeSetInt8.call(this, byteOffset, (value << 24) >> 24)
          },
        },
        { unsafe: true }
      )
  }

  setToStringTag($ArrayBuffer, ARRAY_BUFFER)
  setToStringTag($DataView, DATA_VIEW)

  var arrayBuffer = {
    ArrayBuffer: $ArrayBuffer,
    DataView: $DataView,
  }

  var ARRAY_BUFFER$1 = 'ArrayBuffer'
  var ArrayBuffer$1 = arrayBuffer[ARRAY_BUFFER$1]
  var NativeArrayBuffer$1 = global_1[ARRAY_BUFFER$1]

  // `ArrayBuffer` constructor
  // https://tc39.github.io/ecma262/#sec-arraybuffer-constructor
  _export(
    { global: true, forced: NativeArrayBuffer$1 !== ArrayBuffer$1 },
    {
      ArrayBuffer: ArrayBuffer$1,
    }
  )

  setSpecies(ARRAY_BUFFER$1)

  var defineProperty$b = objectDefineProperty.f

  var Int8Array$1 = global_1.Int8Array
  var Int8ArrayPrototype = Int8Array$1 && Int8Array$1.prototype
  var Uint8ClampedArray = global_1.Uint8ClampedArray
  var Uint8ClampedArrayPrototype =
    Uint8ClampedArray && Uint8ClampedArray.prototype
  var TypedArray = Int8Array$1 && objectGetPrototypeOf(Int8Array$1)
  var TypedArrayPrototype =
    Int8ArrayPrototype && objectGetPrototypeOf(Int8ArrayPrototype)
  var ObjectPrototype$3 = Object.prototype
  var isPrototypeOf = ObjectPrototype$3.isPrototypeOf

  var TO_STRING_TAG$4 = wellKnownSymbol('toStringTag')
  var TYPED_ARRAY_TAG = uid('TYPED_ARRAY_TAG')
  // Fixing native typed arrays in Opera Presto crashes the browser, see #595
  var NATIVE_ARRAY_BUFFER_VIEWS =
    arrayBufferNative &&
    !!objectSetPrototypeOf &&
    classof(global_1.opera) !== 'Opera'
  var TYPED_ARRAY_TAG_REQIRED = false
  var NAME$1

  var TypedArrayConstructorsList = {
    Int8Array: 1,
    Uint8Array: 1,
    Uint8ClampedArray: 1,
    Int16Array: 2,
    Uint16Array: 2,
    Int32Array: 4,
    Uint32Array: 4,
    Float32Array: 4,
    Float64Array: 8,
  }

  var isView = function isView(it) {
    var klass = classof(it)
    return klass === 'DataView' || has(TypedArrayConstructorsList, klass)
  }

  var isTypedArray = function(it) {
    return isObject(it) && has(TypedArrayConstructorsList, classof(it))
  }

  var aTypedArray = function(it) {
    if (isTypedArray(it)) return it
    throw TypeError('Target is not a typed array')
  }

  var aTypedArrayConstructor = function(C) {
    if (objectSetPrototypeOf) {
      if (isPrototypeOf.call(TypedArray, C)) return C
    } else
      for (var ARRAY in TypedArrayConstructorsList)
        if (has(TypedArrayConstructorsList, NAME$1)) {
          var TypedArrayConstructor = global_1[ARRAY]
          if (
            TypedArrayConstructor &&
            (C === TypedArrayConstructor ||
              isPrototypeOf.call(TypedArrayConstructor, C))
          ) {
            return C
          }
        }
    throw TypeError('Target is not a typed array constructor')
  }

  var exportTypedArrayMethod = function(KEY, property, forced) {
    if (!descriptors) return
    if (forced)
      for (var ARRAY in TypedArrayConstructorsList) {
        var TypedArrayConstructor = global_1[ARRAY]
        if (
          TypedArrayConstructor &&
          has(TypedArrayConstructor.prototype, KEY)
        ) {
          delete TypedArrayConstructor.prototype[KEY]
        }
      }
    if (!TypedArrayPrototype[KEY] || forced) {
      redefine(
        TypedArrayPrototype,
        KEY,
        forced
          ? property
          : (NATIVE_ARRAY_BUFFER_VIEWS && Int8ArrayPrototype[KEY]) || property
      )
    }
  }

  var exportTypedArrayStaticMethod = function(KEY, property, forced) {
    var ARRAY, TypedArrayConstructor
    if (!descriptors) return
    if (objectSetPrototypeOf) {
      if (forced)
        for (ARRAY in TypedArrayConstructorsList) {
          TypedArrayConstructor = global_1[ARRAY]
          if (TypedArrayConstructor && has(TypedArrayConstructor, KEY)) {
            delete TypedArrayConstructor[KEY]
          }
        }
      if (!TypedArray[KEY] || forced) {
        // V8 ~ Chrome 49-50 `%TypedArray%` methods are non-writable non-configurable
        try {
          return redefine(
            TypedArray,
            KEY,
            forced
              ? property
              : (NATIVE_ARRAY_BUFFER_VIEWS && Int8Array$1[KEY]) || property
          )
        } catch (error) {
          /* empty */
        }
      } else return
    }
    for (ARRAY in TypedArrayConstructorsList) {
      TypedArrayConstructor = global_1[ARRAY]
      if (TypedArrayConstructor && (!TypedArrayConstructor[KEY] || forced)) {
        redefine(TypedArrayConstructor, KEY, property)
      }
    }
  }

  for (NAME$1 in TypedArrayConstructorsList) {
    if (!global_1[NAME$1]) NATIVE_ARRAY_BUFFER_VIEWS = false
  }

  // WebKit bug - typed arrays constructors prototype is Object.prototype
  if (
    !NATIVE_ARRAY_BUFFER_VIEWS ||
    typeof TypedArray != 'function' ||
    TypedArray === Function.prototype
  ) {
    // eslint-disable-next-line no-shadow
    TypedArray = function TypedArray() {
      throw TypeError('Incorrect invocation')
    }
    if (NATIVE_ARRAY_BUFFER_VIEWS)
      for (NAME$1 in TypedArrayConstructorsList) {
        if (global_1[NAME$1]) objectSetPrototypeOf(global_1[NAME$1], TypedArray)
      }
  }

  if (
    !NATIVE_ARRAY_BUFFER_VIEWS ||
    !TypedArrayPrototype ||
    TypedArrayPrototype === ObjectPrototype$3
  ) {
    TypedArrayPrototype = TypedArray.prototype
    if (NATIVE_ARRAY_BUFFER_VIEWS)
      for (NAME$1 in TypedArrayConstructorsList) {
        if (global_1[NAME$1])
          objectSetPrototypeOf(global_1[NAME$1].prototype, TypedArrayPrototype)
      }
  }

  // WebKit bug - one more object in Uint8ClampedArray prototype chain
  if (
    NATIVE_ARRAY_BUFFER_VIEWS &&
    objectGetPrototypeOf(Uint8ClampedArrayPrototype) !== TypedArrayPrototype
  ) {
    objectSetPrototypeOf(Uint8ClampedArrayPrototype, TypedArrayPrototype)
  }

  if (descriptors && !has(TypedArrayPrototype, TO_STRING_TAG$4)) {
    TYPED_ARRAY_TAG_REQIRED = true
    defineProperty$b(TypedArrayPrototype, TO_STRING_TAG$4, {
      get: function() {
        return isObject(this) ? this[TYPED_ARRAY_TAG] : undefined
      },
    })
    for (NAME$1 in TypedArrayConstructorsList)
      if (global_1[NAME$1]) {
        createNonEnumerableProperty(global_1[NAME$1], TYPED_ARRAY_TAG, NAME$1)
      }
  }

  var arrayBufferViewCore = {
    NATIVE_ARRAY_BUFFER_VIEWS: NATIVE_ARRAY_BUFFER_VIEWS,
    TYPED_ARRAY_TAG: TYPED_ARRAY_TAG_REQIRED && TYPED_ARRAY_TAG,
    aTypedArray: aTypedArray,
    aTypedArrayConstructor: aTypedArrayConstructor,
    exportTypedArrayMethod: exportTypedArrayMethod,
    exportTypedArrayStaticMethod: exportTypedArrayStaticMethod,
    isView: isView,
    isTypedArray: isTypedArray,
    TypedArray: TypedArray,
    TypedArrayPrototype: TypedArrayPrototype,
  }

  var NATIVE_ARRAY_BUFFER_VIEWS$1 =
    arrayBufferViewCore.NATIVE_ARRAY_BUFFER_VIEWS

  // `ArrayBuffer.isView` method
  // https://tc39.github.io/ecma262/#sec-arraybuffer.isview
  _export(
    { target: 'ArrayBuffer', stat: true, forced: !NATIVE_ARRAY_BUFFER_VIEWS$1 },
    {
      isView: arrayBufferViewCore.isView,
    }
  )

  var ArrayBuffer$2 = arrayBuffer.ArrayBuffer
  var DataView$1 = arrayBuffer.DataView
  var nativeArrayBufferSlice = ArrayBuffer$2.prototype.slice

  var INCORRECT_SLICE = fails(function() {
    return !new ArrayBuffer$2(2).slice(1, undefined).byteLength
  })

  // `ArrayBuffer.prototype.slice` method
  // https://tc39.github.io/ecma262/#sec-arraybuffer.prototype.slice
  _export(
    {
      target: 'ArrayBuffer',
      proto: true,
      unsafe: true,
      forced: INCORRECT_SLICE,
    },
    {
      slice: function slice(start, end) {
        if (nativeArrayBufferSlice !== undefined && end === undefined) {
          return nativeArrayBufferSlice.call(anObject(this), start) // FF fix
        }
        var length = anObject(this).byteLength
        var first = toAbsoluteIndex(start, length)
        var fin = toAbsoluteIndex(end === undefined ? length : end, length)
        var result = new (speciesConstructor(this, ArrayBuffer$2))(
          toLength(fin - first)
        )
        var viewSource = new DataView$1(this)
        var viewTarget = new DataView$1(result)
        var index = 0
        while (first < fin) {
          viewTarget.setUint8(index++, viewSource.getUint8(first++))
        }
        return result
      },
    }
  )

  // `DataView` constructor
  // https://tc39.github.io/ecma262/#sec-dataview-constructor
  _export(
    { global: true, forced: !arrayBufferNative },
    {
      DataView: arrayBuffer.DataView,
    }
  )

  /* eslint-disable no-new */

  var NATIVE_ARRAY_BUFFER_VIEWS$2 =
    arrayBufferViewCore.NATIVE_ARRAY_BUFFER_VIEWS

  var ArrayBuffer$3 = global_1.ArrayBuffer
  var Int8Array$2 = global_1.Int8Array

  var typedArrayConstructorsRequireWrappers =
    !NATIVE_ARRAY_BUFFER_VIEWS$2 ||
    !fails(function() {
      Int8Array$2(1)
    }) ||
    !fails(function() {
      new Int8Array$2(-1)
    }) ||
    !checkCorrectnessOfIteration(function(iterable) {
      new Int8Array$2()
      new Int8Array$2(null)
      new Int8Array$2(1.5)
      new Int8Array$2(iterable)
    }, true) ||
    fails(function() {
      // Safari (11+) bug - a reason why even Safari 13 should load a typed array polyfill
      return new Int8Array$2(new ArrayBuffer$3(2), 1, undefined).length !== 1
    })

  var toPositiveInteger = function(it) {
    var result = toInteger(it)
    if (result < 0) throw RangeError("The argument can't be less than 0")
    return result
  }

  var toOffset = function(it, BYTES) {
    var offset = toPositiveInteger(it)
    if (offset % BYTES) throw RangeError('Wrong offset')
    return offset
  }

  var aTypedArrayConstructor$1 = arrayBufferViewCore.aTypedArrayConstructor

  var typedArrayFrom = function from(source /* , mapfn, thisArg */) {
    var O = toObject$1(source)
    var argumentsLength = arguments.length
    var mapfn = argumentsLength > 1 ? arguments[1] : undefined
    var mapping = mapfn !== undefined
    var iteratorMethod = getIteratorMethod(O)
    var i, length, result, step, iterator, next
    if (iteratorMethod != undefined && !isArrayIteratorMethod(iteratorMethod)) {
      iterator = iteratorMethod.call(O)
      next = iterator.next
      O = []
      while (!(step = next.call(iterator)).done) {
        O.push(step.value)
      }
    }
    if (mapping && argumentsLength > 2) {
      mapfn = functionBindContext(mapfn, arguments[2], 2)
    }
    length = toLength(O.length)
    result = new (aTypedArrayConstructor$1(this))(length)
    for (i = 0; length > i; i++) {
      result[i] = mapping ? mapfn(O[i], i) : O[i]
    }
    return result
  }

  var typedArrayConstructor = createCommonjsModule(function(module) {
    var getOwnPropertyNames = objectGetOwnPropertyNames.f

    var forEach = arrayIteration.forEach

    var getInternalState = internalState.get
    var setInternalState = internalState.set
    var nativeDefineProperty = objectDefineProperty.f
    var nativeGetOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f
    var round = Math.round
    var RangeError = global_1.RangeError
    var ArrayBuffer = arrayBuffer.ArrayBuffer
    var DataView = arrayBuffer.DataView
    var NATIVE_ARRAY_BUFFER_VIEWS =
      arrayBufferViewCore.NATIVE_ARRAY_BUFFER_VIEWS
    var TYPED_ARRAY_TAG = arrayBufferViewCore.TYPED_ARRAY_TAG
    var TypedArray = arrayBufferViewCore.TypedArray
    var TypedArrayPrototype = arrayBufferViewCore.TypedArrayPrototype
    var aTypedArrayConstructor = arrayBufferViewCore.aTypedArrayConstructor
    var isTypedArray = arrayBufferViewCore.isTypedArray
    var BYTES_PER_ELEMENT = 'BYTES_PER_ELEMENT'
    var WRONG_LENGTH = 'Wrong length'

    var fromList = function(C, list) {
      var index = 0
      var length = list.length
      var result = new (aTypedArrayConstructor(C))(length)
      while (length > index) result[index] = list[index++]
      return result
    }

    var addGetter = function(it, key) {
      nativeDefineProperty(it, key, {
        get: function() {
          return getInternalState(this)[key]
        },
      })
    }

    var isArrayBuffer = function(it) {
      var klass
      return (
        it instanceof ArrayBuffer ||
        (klass = classof(it)) == 'ArrayBuffer' ||
        klass == 'SharedArrayBuffer'
      )
    }

    var isTypedArrayIndex = function(target, key) {
      return (
        isTypedArray(target) &&
        typeof key != 'symbol' &&
        key in target &&
        String(+key) == String(key)
      )
    }

    var wrappedGetOwnPropertyDescriptor = function getOwnPropertyDescriptor(
      target,
      key
    ) {
      return isTypedArrayIndex(target, (key = toPrimitive(key, true)))
        ? createPropertyDescriptor(2, target[key])
        : nativeGetOwnPropertyDescriptor(target, key)
    }

    var wrappedDefineProperty = function defineProperty(
      target,
      key,
      descriptor
    ) {
      if (
        isTypedArrayIndex(target, (key = toPrimitive(key, true))) &&
        isObject(descriptor) &&
        has(descriptor, 'value') &&
        !has(descriptor, 'get') &&
        !has(descriptor, 'set') &&
        // TODO: add validation descriptor w/o calling accessors
        !descriptor.configurable &&
        (!has(descriptor, 'writable') || descriptor.writable) &&
        (!has(descriptor, 'enumerable') || descriptor.enumerable)
      ) {
        target[key] = descriptor.value
        return target
      }
      return nativeDefineProperty(target, key, descriptor)
    }

    if (descriptors) {
      if (!NATIVE_ARRAY_BUFFER_VIEWS) {
        objectGetOwnPropertyDescriptor.f = wrappedGetOwnPropertyDescriptor
        objectDefineProperty.f = wrappedDefineProperty
        addGetter(TypedArrayPrototype, 'buffer')
        addGetter(TypedArrayPrototype, 'byteOffset')
        addGetter(TypedArrayPrototype, 'byteLength')
        addGetter(TypedArrayPrototype, 'length')
      }

      _export(
        { target: 'Object', stat: true, forced: !NATIVE_ARRAY_BUFFER_VIEWS },
        {
          getOwnPropertyDescriptor: wrappedGetOwnPropertyDescriptor,
          defineProperty: wrappedDefineProperty,
        }
      )

      module.exports = function(TYPE, wrapper, CLAMPED) {
        var BYTES = TYPE.match(/\d+$/)[0] / 8
        var CONSTRUCTOR_NAME = TYPE + (CLAMPED ? 'Clamped' : '') + 'Array'
        var GETTER = 'get' + TYPE
        var SETTER = 'set' + TYPE
        var NativeTypedArrayConstructor = global_1[CONSTRUCTOR_NAME]
        var TypedArrayConstructor = NativeTypedArrayConstructor
        var TypedArrayConstructorPrototype =
          TypedArrayConstructor && TypedArrayConstructor.prototype
        var exported = {}

        var getter = function(that, index) {
          var data = getInternalState(that)
          return data.view[GETTER](index * BYTES + data.byteOffset, true)
        }

        var setter = function(that, index, value) {
          var data = getInternalState(that)
          if (CLAMPED)
            value =
              (value = round(value)) < 0
                ? 0
                : value > 0xff
                ? 0xff
                : value & 0xff
          data.view[SETTER](index * BYTES + data.byteOffset, value, true)
        }

        var addElement = function(that, index) {
          nativeDefineProperty(that, index, {
            get: function() {
              return getter(this, index)
            },
            set: function(value) {
              return setter(this, index, value)
            },
            enumerable: true,
          })
        }

        if (!NATIVE_ARRAY_BUFFER_VIEWS) {
          TypedArrayConstructor = wrapper(function(
            that,
            data,
            offset,
            $length
          ) {
            anInstance(that, TypedArrayConstructor, CONSTRUCTOR_NAME)
            var index = 0
            var byteOffset = 0
            var buffer, byteLength, length
            if (!isObject(data)) {
              length = toIndex(data)
              byteLength = length * BYTES
              buffer = new ArrayBuffer(byteLength)
            } else if (isArrayBuffer(data)) {
              buffer = data
              byteOffset = toOffset(offset, BYTES)
              var $len = data.byteLength
              if ($length === undefined) {
                if ($len % BYTES) throw RangeError(WRONG_LENGTH)
                byteLength = $len - byteOffset
                if (byteLength < 0) throw RangeError(WRONG_LENGTH)
              } else {
                byteLength = toLength($length) * BYTES
                if (byteLength + byteOffset > $len)
                  throw RangeError(WRONG_LENGTH)
              }
              length = byteLength / BYTES
            } else if (isTypedArray(data)) {
              return fromList(TypedArrayConstructor, data)
            } else {
              return typedArrayFrom.call(TypedArrayConstructor, data)
            }
            setInternalState(that, {
              buffer: buffer,
              byteOffset: byteOffset,
              byteLength: byteLength,
              length: length,
              view: new DataView(buffer),
            })
            while (index < length) addElement(that, index++)
          })

          if (objectSetPrototypeOf)
            objectSetPrototypeOf(TypedArrayConstructor, TypedArray)
          TypedArrayConstructorPrototype = TypedArrayConstructor.prototype = objectCreate(
            TypedArrayPrototype
          )
        } else if (typedArrayConstructorsRequireWrappers) {
          TypedArrayConstructor = wrapper(function(
            dummy,
            data,
            typedArrayOffset,
            $length
          ) {
            anInstance(dummy, TypedArrayConstructor, CONSTRUCTOR_NAME)
            return inheritIfRequired(
              (function() {
                if (!isObject(data))
                  return new NativeTypedArrayConstructor(toIndex(data))
                if (isArrayBuffer(data))
                  return $length !== undefined
                    ? new NativeTypedArrayConstructor(
                        data,
                        toOffset(typedArrayOffset, BYTES),
                        $length
                      )
                    : typedArrayOffset !== undefined
                    ? new NativeTypedArrayConstructor(
                        data,
                        toOffset(typedArrayOffset, BYTES)
                      )
                    : new NativeTypedArrayConstructor(data)
                if (isTypedArray(data))
                  return fromList(TypedArrayConstructor, data)
                return typedArrayFrom.call(TypedArrayConstructor, data)
              })(),
              dummy,
              TypedArrayConstructor
            )
          })

          if (objectSetPrototypeOf)
            objectSetPrototypeOf(TypedArrayConstructor, TypedArray)
          forEach(getOwnPropertyNames(NativeTypedArrayConstructor), function(
            key
          ) {
            if (!(key in TypedArrayConstructor)) {
              createNonEnumerableProperty(
                TypedArrayConstructor,
                key,
                NativeTypedArrayConstructor[key]
              )
            }
          })
          TypedArrayConstructor.prototype = TypedArrayConstructorPrototype
        }

        if (
          TypedArrayConstructorPrototype.constructor !== TypedArrayConstructor
        ) {
          createNonEnumerableProperty(
            TypedArrayConstructorPrototype,
            'constructor',
            TypedArrayConstructor
          )
        }

        if (TYPED_ARRAY_TAG) {
          createNonEnumerableProperty(
            TypedArrayConstructorPrototype,
            TYPED_ARRAY_TAG,
            CONSTRUCTOR_NAME
          )
        }

        exported[CONSTRUCTOR_NAME] = TypedArrayConstructor

        _export(
          {
            global: true,
            forced: TypedArrayConstructor != NativeTypedArrayConstructor,
            sham: !NATIVE_ARRAY_BUFFER_VIEWS,
          },
          exported
        )

        if (!(BYTES_PER_ELEMENT in TypedArrayConstructor)) {
          createNonEnumerableProperty(
            TypedArrayConstructor,
            BYTES_PER_ELEMENT,
            BYTES
          )
        }

        if (!(BYTES_PER_ELEMENT in TypedArrayConstructorPrototype)) {
          createNonEnumerableProperty(
            TypedArrayConstructorPrototype,
            BYTES_PER_ELEMENT,
            BYTES
          )
        }

        setSpecies(CONSTRUCTOR_NAME)
      }
    } else
      module.exports = function() {
        /* empty */
      }
  })

  // `Int8Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Int8', function(init) {
    return function Int8Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  // `Uint8Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Uint8', function(init) {
    return function Uint8Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  // `Uint8ClampedArray` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor(
    'Uint8',
    function(init) {
      return function Uint8ClampedArray(data, byteOffset, length) {
        return init(this, data, byteOffset, length)
      }
    },
    true
  )

  // `Int16Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Int16', function(init) {
    return function Int16Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  // `Uint16Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Uint16', function(init) {
    return function Uint16Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  // `Int32Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Int32', function(init) {
    return function Int32Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  // `Uint32Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Uint32', function(init) {
    return function Uint32Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  // `Float32Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Float32', function(init) {
    return function Float32Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  // `Float64Array` constructor
  // https://tc39.github.io/ecma262/#sec-typedarray-objects
  typedArrayConstructor('Float64', function(init) {
    return function Float64Array(data, byteOffset, length) {
      return init(this, data, byteOffset, length)
    }
  })

  var exportTypedArrayStaticMethod$1 =
    arrayBufferViewCore.exportTypedArrayStaticMethod

  // `%TypedArray%.from` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.from
  exportTypedArrayStaticMethod$1(
    'from',
    typedArrayFrom,
    typedArrayConstructorsRequireWrappers
  )

  var aTypedArrayConstructor$2 = arrayBufferViewCore.aTypedArrayConstructor
  var exportTypedArrayStaticMethod$2 =
    arrayBufferViewCore.exportTypedArrayStaticMethod

  // `%TypedArray%.of` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.of
  exportTypedArrayStaticMethod$2(
    'of',
    function of(/* ...items */) {
      var index = 0
      var length = arguments.length
      var result = new (aTypedArrayConstructor$2(this))(length)
      while (length > index) result[index] = arguments[index++]
      return result
    },
    typedArrayConstructorsRequireWrappers
  )

  var aTypedArray$1 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$1 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.copyWithin` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.copywithin
  exportTypedArrayMethod$1('copyWithin', function copyWithin(
    target,
    start /* , end */
  ) {
    return arrayCopyWithin.call(
      aTypedArray$1(this),
      target,
      start,
      arguments.length > 2 ? arguments[2] : undefined
    )
  })

  var $every$1 = arrayIteration.every

  var aTypedArray$2 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$2 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.every` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.every
  exportTypedArrayMethod$2('every', function every(callbackfn /* , thisArg */) {
    return $every$1(
      aTypedArray$2(this),
      callbackfn,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var aTypedArray$3 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$3 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.fill` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.fill
  // eslint-disable-next-line no-unused-vars
  exportTypedArrayMethod$3('fill', function fill(value /* , start, end */) {
    return arrayFill.apply(aTypedArray$3(this), arguments)
  })

  var $filter$1 = arrayIteration.filter

  var aTypedArray$4 = arrayBufferViewCore.aTypedArray
  var aTypedArrayConstructor$3 = arrayBufferViewCore.aTypedArrayConstructor
  var exportTypedArrayMethod$4 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.filter
  exportTypedArrayMethod$4('filter', function filter(
    callbackfn /* , thisArg */
  ) {
    var list = $filter$1(
      aTypedArray$4(this),
      callbackfn,
      arguments.length > 1 ? arguments[1] : undefined
    )
    var C = speciesConstructor(this, this.constructor)
    var index = 0
    var length = list.length
    var result = new (aTypedArrayConstructor$3(C))(length)
    while (length > index) result[index] = list[index++]
    return result
  })

  var $find$1 = arrayIteration.find

  var aTypedArray$5 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$5 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.find
  exportTypedArrayMethod$5('find', function find(predicate /* , thisArg */) {
    return $find$1(
      aTypedArray$5(this),
      predicate,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var $findIndex$1 = arrayIteration.findIndex

  var aTypedArray$6 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$6 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.findindex
  exportTypedArrayMethod$6('findIndex', function findIndex(
    predicate /* , thisArg */
  ) {
    return $findIndex$1(
      aTypedArray$6(this),
      predicate,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var $forEach$2 = arrayIteration.forEach

  var aTypedArray$7 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$7 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.foreach
  exportTypedArrayMethod$7('forEach', function forEach(
    callbackfn /* , thisArg */
  ) {
    $forEach$2(
      aTypedArray$7(this),
      callbackfn,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var $includes$1 = arrayIncludes.includes

  var aTypedArray$8 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$8 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.includes
  exportTypedArrayMethod$8('includes', function includes(
    searchElement /* , fromIndex */
  ) {
    return $includes$1(
      aTypedArray$8(this),
      searchElement,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var $indexOf$1 = arrayIncludes.indexOf

  var aTypedArray$9 = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$9 = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.indexof
  exportTypedArrayMethod$9('indexOf', function indexOf(
    searchElement /* , fromIndex */
  ) {
    return $indexOf$1(
      aTypedArray$9(this),
      searchElement,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var ITERATOR$6 = wellKnownSymbol('iterator')
  var Uint8Array$1 = global_1.Uint8Array
  var arrayValues = es_array_iterator.values
  var arrayKeys = es_array_iterator.keys
  var arrayEntries = es_array_iterator.entries
  var aTypedArray$a = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$a = arrayBufferViewCore.exportTypedArrayMethod
  var nativeTypedArrayIterator =
    Uint8Array$1 && Uint8Array$1.prototype[ITERATOR$6]

  var CORRECT_ITER_NAME =
    !!nativeTypedArrayIterator &&
    (nativeTypedArrayIterator.name == 'values' ||
      nativeTypedArrayIterator.name == undefined)

  var typedArrayValues = function values() {
    return arrayValues.call(aTypedArray$a(this))
  }

  // `%TypedArray%.prototype.entries` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.entries
  exportTypedArrayMethod$a('entries', function entries() {
    return arrayEntries.call(aTypedArray$a(this))
  })
  // `%TypedArray%.prototype.keys` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.keys
  exportTypedArrayMethod$a('keys', function keys() {
    return arrayKeys.call(aTypedArray$a(this))
  })
  // `%TypedArray%.prototype.values` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.values
  exportTypedArrayMethod$a('values', typedArrayValues, !CORRECT_ITER_NAME)
  // `%TypedArray%.prototype[@@iterator]` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype-@@iterator
  exportTypedArrayMethod$a(ITERATOR$6, typedArrayValues, !CORRECT_ITER_NAME)

  var aTypedArray$b = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$b = arrayBufferViewCore.exportTypedArrayMethod
  var $join = [].join

  // `%TypedArray%.prototype.join` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.join
  // eslint-disable-next-line no-unused-vars
  exportTypedArrayMethod$b('join', function join(separator) {
    return $join.apply(aTypedArray$b(this), arguments)
  })

  var aTypedArray$c = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$c = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.lastIndexOf` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.lastindexof
  // eslint-disable-next-line no-unused-vars
  exportTypedArrayMethod$c('lastIndexOf', function lastIndexOf(
    searchElement /* , fromIndex */
  ) {
    return arrayLastIndexOf.apply(aTypedArray$c(this), arguments)
  })

  var $map$1 = arrayIteration.map

  var aTypedArray$d = arrayBufferViewCore.aTypedArray
  var aTypedArrayConstructor$4 = arrayBufferViewCore.aTypedArrayConstructor
  var exportTypedArrayMethod$d = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.map
  exportTypedArrayMethod$d('map', function map(mapfn /* , thisArg */) {
    return $map$1(
      aTypedArray$d(this),
      mapfn,
      arguments.length > 1 ? arguments[1] : undefined,
      function(O, length) {
        return new (aTypedArrayConstructor$4(
          speciesConstructor(O, O.constructor)
        ))(length)
      }
    )
  })

  var $reduce$1 = arrayReduce.left

  var aTypedArray$e = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$e = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.reduce` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.reduce
  exportTypedArrayMethod$e('reduce', function reduce(
    callbackfn /* , initialValue */
  ) {
    return $reduce$1(
      aTypedArray$e(this),
      callbackfn,
      arguments.length,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var $reduceRight$1 = arrayReduce.right

  var aTypedArray$f = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$f = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.reduceRicht` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.reduceright
  exportTypedArrayMethod$f('reduceRight', function reduceRight(
    callbackfn /* , initialValue */
  ) {
    return $reduceRight$1(
      aTypedArray$f(this),
      callbackfn,
      arguments.length,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var aTypedArray$g = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$g = arrayBufferViewCore.exportTypedArrayMethod
  var floor$7 = Math.floor

  // `%TypedArray%.prototype.reverse` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.reverse
  exportTypedArrayMethod$g('reverse', function reverse() {
    var that = this
    var length = aTypedArray$g(that).length
    var middle = floor$7(length / 2)
    var index = 0
    var value
    while (index < middle) {
      value = that[index]
      that[index++] = that[--length]
      that[length] = value
    }
    return that
  })

  var aTypedArray$h = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$h = arrayBufferViewCore.exportTypedArrayMethod

  var FORCED$h = fails(function() {
    // eslint-disable-next-line no-undef
    new Int8Array(1).set({})
  })

  // `%TypedArray%.prototype.set` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.set
  exportTypedArrayMethod$h(
    'set',
    function set(arrayLike /* , offset */) {
      aTypedArray$h(this)
      var offset = toOffset(arguments.length > 1 ? arguments[1] : undefined, 1)
      var length = this.length
      var src = toObject$1(arrayLike)
      var len = toLength(src.length)
      var index = 0
      if (len + offset > length) throw RangeError('Wrong length')
      while (index < len) this[offset + index] = src[index++]
    },
    FORCED$h
  )

  var aTypedArray$i = arrayBufferViewCore.aTypedArray
  var aTypedArrayConstructor$5 = arrayBufferViewCore.aTypedArrayConstructor
  var exportTypedArrayMethod$i = arrayBufferViewCore.exportTypedArrayMethod
  var $slice = [].slice

  var FORCED$i = fails(function() {
    // eslint-disable-next-line no-undef
    new Int8Array(1).slice()
  })

  // `%TypedArray%.prototype.slice` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.slice
  exportTypedArrayMethod$i(
    'slice',
    function slice(start, end) {
      var list = $slice.call(aTypedArray$i(this), start, end)
      var C = speciesConstructor(this, this.constructor)
      var index = 0
      var length = list.length
      var result = new (aTypedArrayConstructor$5(C))(length)
      while (length > index) result[index] = list[index++]
      return result
    },
    FORCED$i
  )

  var $some$1 = arrayIteration.some

  var aTypedArray$j = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$j = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.some` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.some
  exportTypedArrayMethod$j('some', function some(callbackfn /* , thisArg */) {
    return $some$1(
      aTypedArray$j(this),
      callbackfn,
      arguments.length > 1 ? arguments[1] : undefined
    )
  })

  var aTypedArray$k = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$k = arrayBufferViewCore.exportTypedArrayMethod
  var $sort = [].sort

  // `%TypedArray%.prototype.sort` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.sort
  exportTypedArrayMethod$k('sort', function sort(comparefn) {
    return $sort.call(aTypedArray$k(this), comparefn)
  })

  var aTypedArray$l = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$l = arrayBufferViewCore.exportTypedArrayMethod

  // `%TypedArray%.prototype.subarray` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.subarray
  exportTypedArrayMethod$l('subarray', function subarray(begin, end) {
    var O = aTypedArray$l(this)
    var length = O.length
    var beginIndex = toAbsoluteIndex(begin, length)
    return new (speciesConstructor(
      O,
      O.constructor
    ))(O.buffer, O.byteOffset + beginIndex * O.BYTES_PER_ELEMENT, toLength((end === undefined ? length : toAbsoluteIndex(end, length)) - beginIndex))
  })

  var Int8Array$3 = global_1.Int8Array
  var aTypedArray$m = arrayBufferViewCore.aTypedArray
  var exportTypedArrayMethod$m = arrayBufferViewCore.exportTypedArrayMethod
  var $toLocaleString = [].toLocaleString
  var $slice$1 = [].slice

  // iOS Safari 6.x fails here
  var TO_LOCALE_STRING_BUG =
    !!Int8Array$3 &&
    fails(function() {
      $toLocaleString.call(new Int8Array$3(1))
    })

  var FORCED$j =
    fails(function() {
      return [1, 2].toLocaleString() != new Int8Array$3([1, 2]).toLocaleString()
    }) ||
    !fails(function() {
      Int8Array$3.prototype.toLocaleString.call([1, 2])
    })

  // `%TypedArray%.prototype.toLocaleString` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.tolocalestring
  exportTypedArrayMethod$m(
    'toLocaleString',
    function toLocaleString() {
      return $toLocaleString.apply(
        TO_LOCALE_STRING_BUG
          ? $slice$1.call(aTypedArray$m(this))
          : aTypedArray$m(this),
        arguments
      )
    },
    FORCED$j
  )

  var exportTypedArrayMethod$n = arrayBufferViewCore.exportTypedArrayMethod

  var Uint8Array$2 = global_1.Uint8Array
  var Uint8ArrayPrototype = (Uint8Array$2 && Uint8Array$2.prototype) || {}
  var arrayToString = [].toString
  var arrayJoin = [].join

  if (
    fails(function() {
      arrayToString.call({})
    })
  ) {
    arrayToString = function toString() {
      return arrayJoin.call(this)
    }
  }

  var IS_NOT_ARRAY_METHOD = Uint8ArrayPrototype.toString != arrayToString

  // `%TypedArray%.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.tostring
  exportTypedArrayMethod$n('toString', arrayToString, IS_NOT_ARRAY_METHOD)

  var nativeApply = getBuiltIn('Reflect', 'apply')
  var functionApply = Function.apply

  // MS Edge argumentsList argument is optional
  var OPTIONAL_ARGUMENTS_LIST = !fails(function() {
    nativeApply(function() {
      /* empty */
    })
  })

  // `Reflect.apply` method
  // https://tc39.github.io/ecma262/#sec-reflect.apply
  _export(
    { target: 'Reflect', stat: true, forced: OPTIONAL_ARGUMENTS_LIST },
    {
      apply: function apply(target, thisArgument, argumentsList) {
        aFunction$1(target)
        anObject(argumentsList)
        return nativeApply
          ? nativeApply(target, thisArgument, argumentsList)
          : functionApply.call(target, thisArgument, argumentsList)
      },
    }
  )

  var nativeConstruct = getBuiltIn('Reflect', 'construct')

  // `Reflect.construct` method
  // https://tc39.github.io/ecma262/#sec-reflect.construct
  // MS Edge supports only 2 arguments and argumentsList argument is optional
  // FF Nightly sets third argument as `new.target`, but does not create `this` from it
  var NEW_TARGET_BUG = fails(function() {
    function F() {
      /* empty */
    }
    return !(
      nativeConstruct(
        function() {
          /* empty */
        },
        [],
        F
      ) instanceof F
    )
  })
  var ARGS_BUG = !fails(function() {
    nativeConstruct(function() {
      /* empty */
    })
  })
  var FORCED$k = NEW_TARGET_BUG || ARGS_BUG

  _export(
    { target: 'Reflect', stat: true, forced: FORCED$k, sham: FORCED$k },
    {
      construct: function construct(Target, args /* , newTarget */) {
        aFunction$1(Target)
        anObject(args)
        var newTarget =
          arguments.length < 3 ? Target : aFunction$1(arguments[2])
        if (ARGS_BUG && !NEW_TARGET_BUG)
          return nativeConstruct(Target, args, newTarget)
        if (Target == newTarget) {
          // w/o altered newTarget, optimization for 0-4 arguments
          switch (args.length) {
            case 0:
              return new Target()
            case 1:
              return new Target(args[0])
            case 2:
              return new Target(args[0], args[1])
            case 3:
              return new Target(args[0], args[1], args[2])
            case 4:
              return new Target(args[0], args[1], args[2], args[3])
          }
          // w/o altered newTarget, lot of arguments case
          var $args = [null]
          $args.push.apply($args, args)
          return new (functionBind.apply(Target, $args))()
        }
        // with altered newTarget, not support built-in constructors
        var proto = newTarget.prototype
        var instance = objectCreate(isObject(proto) ? proto : Object.prototype)
        var result = Function.apply.call(Target, instance, args)
        return isObject(result) ? result : instance
      },
    }
  )

  // MS Edge has broken Reflect.defineProperty - throwing instead of returning false
  var ERROR_INSTEAD_OF_FALSE = fails(function() {
    // eslint-disable-next-line no-undef
    Reflect.defineProperty(objectDefineProperty.f({}, 1, { value: 1 }), 1, {
      value: 2,
    })
  })

  // `Reflect.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-reflect.defineproperty
  _export(
    {
      target: 'Reflect',
      stat: true,
      forced: ERROR_INSTEAD_OF_FALSE,
      sham: !descriptors,
    },
    {
      defineProperty: function defineProperty(target, propertyKey, attributes) {
        anObject(target)
        var key = toPrimitive(propertyKey, true)
        anObject(attributes)
        try {
          objectDefineProperty.f(target, key, attributes)
          return true
        } catch (error) {
          return false
        }
      },
    }
  )

  var getOwnPropertyDescriptor$8 = objectGetOwnPropertyDescriptor.f

  // `Reflect.deleteProperty` method
  // https://tc39.github.io/ecma262/#sec-reflect.deleteproperty
  _export(
    { target: 'Reflect', stat: true },
    {
      deleteProperty: function deleteProperty(target, propertyKey) {
        var descriptor = getOwnPropertyDescriptor$8(
          anObject(target),
          propertyKey
        )
        return descriptor && !descriptor.configurable
          ? false
          : delete target[propertyKey]
      },
    }
  )

  // `Reflect.get` method
  // https://tc39.github.io/ecma262/#sec-reflect.get
  function get$2(target, propertyKey /* , receiver */) {
    var receiver = arguments.length < 3 ? target : arguments[2]
    var descriptor, prototype
    if (anObject(target) === receiver) return target[propertyKey]
    if ((descriptor = objectGetOwnPropertyDescriptor.f(target, propertyKey)))
      return has(descriptor, 'value')
        ? descriptor.value
        : descriptor.get === undefined
        ? undefined
        : descriptor.get.call(receiver)
    if (isObject((prototype = objectGetPrototypeOf(target))))
      return get$2(prototype, propertyKey, receiver)
  }

  _export(
    { target: 'Reflect', stat: true },
    {
      get: get$2,
    }
  )

  // `Reflect.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-reflect.getownpropertydescriptor
  _export(
    { target: 'Reflect', stat: true, sham: !descriptors },
    {
      getOwnPropertyDescriptor: function getOwnPropertyDescriptor(
        target,
        propertyKey
      ) {
        return objectGetOwnPropertyDescriptor.f(anObject(target), propertyKey)
      },
    }
  )

  // `Reflect.getPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-reflect.getprototypeof
  _export(
    { target: 'Reflect', stat: true, sham: !correctPrototypeGetter },
    {
      getPrototypeOf: function getPrototypeOf(target) {
        return objectGetPrototypeOf(anObject(target))
      },
    }
  )

  // `Reflect.has` method
  // https://tc39.github.io/ecma262/#sec-reflect.has
  _export(
    { target: 'Reflect', stat: true },
    {
      has: function has(target, propertyKey) {
        return propertyKey in target
      },
    }
  )

  var objectIsExtensible = Object.isExtensible

  // `Reflect.isExtensible` method
  // https://tc39.github.io/ecma262/#sec-reflect.isextensible
  _export(
    { target: 'Reflect', stat: true },
    {
      isExtensible: function isExtensible(target) {
        anObject(target)
        return objectIsExtensible ? objectIsExtensible(target) : true
      },
    }
  )

  // `Reflect.ownKeys` method
  // https://tc39.github.io/ecma262/#sec-reflect.ownkeys
  _export(
    { target: 'Reflect', stat: true },
    {
      ownKeys: ownKeys,
    }
  )

  // `Reflect.preventExtensions` method
  // https://tc39.github.io/ecma262/#sec-reflect.preventextensions
  _export(
    { target: 'Reflect', stat: true, sham: !freezing },
    {
      preventExtensions: function preventExtensions(target) {
        anObject(target)
        try {
          var objectPreventExtensions = getBuiltIn(
            'Object',
            'preventExtensions'
          )
          if (objectPreventExtensions) objectPreventExtensions(target)
          return true
        } catch (error) {
          return false
        }
      },
    }
  )

  // `Reflect.set` method
  // https://tc39.github.io/ecma262/#sec-reflect.set
  function set$4(target, propertyKey, V /* , receiver */) {
    var receiver = arguments.length < 4 ? target : arguments[3]
    var ownDescriptor = objectGetOwnPropertyDescriptor.f(
      anObject(target),
      propertyKey
    )
    var existingDescriptor, prototype
    if (!ownDescriptor) {
      if (isObject((prototype = objectGetPrototypeOf(target)))) {
        return set$4(prototype, propertyKey, V, receiver)
      }
      ownDescriptor = createPropertyDescriptor(0)
    }
    if (has(ownDescriptor, 'value')) {
      if (ownDescriptor.writable === false || !isObject(receiver)) return false
      if (
        (existingDescriptor = objectGetOwnPropertyDescriptor.f(
          receiver,
          propertyKey
        ))
      ) {
        if (
          existingDescriptor.get ||
          existingDescriptor.set ||
          existingDescriptor.writable === false
        )
          return false
        existingDescriptor.value = V
        objectDefineProperty.f(receiver, propertyKey, existingDescriptor)
      } else
        objectDefineProperty.f(
          receiver,
          propertyKey,
          createPropertyDescriptor(0, V)
        )
      return true
    }
    return ownDescriptor.set === undefined
      ? false
      : (ownDescriptor.set.call(receiver, V), true)
  }

  // MS Edge 17-18 Reflect.set allows setting the property to object
  // with non-writable property on the prototype
  var MS_EDGE_BUG = fails(function() {
    var object = objectDefineProperty.f({}, 'a', { configurable: true })
    // eslint-disable-next-line no-undef
    return Reflect.set(objectGetPrototypeOf(object), 'a', 1, object) !== false
  })

  _export(
    { target: 'Reflect', stat: true, forced: MS_EDGE_BUG },
    {
      set: set$4,
    }
  )

  // `Reflect.setPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-reflect.setprototypeof
  if (objectSetPrototypeOf)
    _export(
      { target: 'Reflect', stat: true },
      {
        setPrototypeOf: function setPrototypeOf(target, proto) {
          anObject(target)
          aPossiblePrototype(proto)
          try {
            objectSetPrototypeOf(target, proto)
            return true
          } catch (error) {
            return false
          }
        },
      }
    )

  for (var COLLECTION_NAME$1 in domIterables) {
    var Collection$1 = global_1[COLLECTION_NAME$1]
    var CollectionPrototype$1 = Collection$1 && Collection$1.prototype
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype$1 && CollectionPrototype$1.forEach !== arrayForEach)
      try {
        createNonEnumerableProperty(
          CollectionPrototype$1,
          'forEach',
          arrayForEach
        )
      } catch (error) {
        CollectionPrototype$1.forEach = arrayForEach
      }
  }

  var FORCED$l = !global_1.setImmediate || !global_1.clearImmediate

  // http://w3c.github.io/setImmediate/
  _export(
    { global: true, bind: true, enumerable: true, forced: FORCED$l },
    {
      // `setImmediate` method
      // http://w3c.github.io/setImmediate/#si-setImmediate
      setImmediate: task.set,
      // `clearImmediate` method
      // http://w3c.github.io/setImmediate/#si-clearImmediate
      clearImmediate: task.clear,
    }
  )

  var process$5 = global_1.process
  var isNode = classofRaw(process$5) == 'process'

  // `queueMicrotask` method
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-queuemicrotask
  _export(
    { global: true, enumerable: true, noTargetGet: true },
    {
      queueMicrotask: function queueMicrotask(fn) {
        var domain = isNode && process$5.domain
        microtask(domain ? domain.bind(fn) : fn)
      },
    }
  )

  var slice$1 = [].slice
  var MSIE = /MSIE .\./.test(engineUserAgent) // <- dirty ie9- check

  var wrap$1 = function(scheduler) {
    return function(handler, timeout /* , ...arguments */) {
      var boundArgs = arguments.length > 2
      var args = boundArgs ? slice$1.call(arguments, 2) : undefined
      return scheduler(
        boundArgs
          ? function() {
              // eslint-disable-next-line no-new-func
              ;(typeof handler == 'function'
                ? handler
                : Function(handler)
              ).apply(this, args)
            }
          : handler,
        timeout
      )
    }
  }

  // ie9- setTimeout & setInterval additional parameters fix
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
  _export(
    { global: true, bind: true, forced: MSIE },
    {
      // `setTimeout` method
      // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
      setTimeout: wrap$1(global_1.setTimeout),
      // `setInterval` method
      // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
      setInterval: wrap$1(global_1.setInterval),
    }
  )

  var ITERATOR$7 = wellKnownSymbol('iterator')

  var nativeUrl = !fails(function() {
    var url = new URL('b?a=1&b=2&c=3', 'http://a')
    var searchParams = url.searchParams
    var result = ''
    url.pathname = 'c%20d'
    searchParams.forEach(function(value, key) {
      searchParams['delete']('b')
      result += key + value
    })
    return (
      !searchParams.sort ||
      url.href !== 'http://a/c%20d?a=1&c=3' ||
      searchParams.get('c') !== '3' ||
      String(new URLSearchParams('?a=1')) !== 'a=1' ||
      !searchParams[ITERATOR$7] ||
      // throws in Edge
      new URL('https://a@b').username !== 'a' ||
      new URLSearchParams(new URLSearchParams('a=b')).get('a') !== 'b' ||
      // not punycoded in Edge
      new URL('http://тест').host !== 'xn--e1aybc' ||
      // not escaped in Chrome 62-
      new URL('http://a#б').hash !== '#%D0%B1' ||
      // fails in Chrome 66-
      result !== 'a1c3' ||
      // throws in Safari
      new URL('http://x', undefined).host !== 'x'
    )
  })

  // based on https://github.com/bestiejs/punycode.js/blob/master/punycode.js
  var maxInt = 2147483647 // aka. 0x7FFFFFFF or 2^31-1
  var base = 36
  var tMin = 1
  var tMax = 26
  var skew = 38
  var damp = 700
  var initialBias = 72
  var initialN = 128 // 0x80
  var delimiter = '-' // '\x2D'
  var regexNonASCII = /[^\0-\u007E]/ // non-ASCII chars
  var regexSeparators = /[.\u3002\uFF0E\uFF61]/g // RFC 3490 separators
  var OVERFLOW_ERROR = 'Overflow: input needs wider integers to process'
  var baseMinusTMin = base - tMin
  var floor$8 = Math.floor
  var stringFromCharCode = String.fromCharCode

  /**
   * Creates an array containing the numeric code points of each Unicode
   * character in the string. While JavaScript uses UCS-2 internally,
   * this function will convert a pair of surrogate halves (each of which
   * UCS-2 exposes as separate characters) into a single code point,
   * matching UTF-16.
   */
  var ucs2decode = function(string) {
    var output = []
    var counter = 0
    var length = string.length
    while (counter < length) {
      var value = string.charCodeAt(counter++)
      if (value >= 0xd800 && value <= 0xdbff && counter < length) {
        // It's a high surrogate, and there is a next character.
        var extra = string.charCodeAt(counter++)
        if ((extra & 0xfc00) == 0xdc00) {
          // Low surrogate.
          output.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000)
        } else {
          // It's an unmatched surrogate; only append this code unit, in case the
          // next code unit is the high surrogate of a surrogate pair.
          output.push(value)
          counter--
        }
      } else {
        output.push(value)
      }
    }
    return output
  }

  /**
   * Converts a digit/integer into a basic code point.
   */
  var digitToBasic = function(digit) {
    //  0..25 map to ASCII a..z or A..Z
    // 26..35 map to ASCII 0..9
    return digit + 22 + 75 * (digit < 26)
  }

  /**
   * Bias adaptation function as per section 3.4 of RFC 3492.
   * https://tools.ietf.org/html/rfc3492#section-3.4
   */
  var adapt = function(delta, numPoints, firstTime) {
    var k = 0
    delta = firstTime ? floor$8(delta / damp) : delta >> 1
    delta += floor$8(delta / numPoints)
    for (; delta > (baseMinusTMin * tMax) >> 1; k += base) {
      delta = floor$8(delta / baseMinusTMin)
    }
    return floor$8(k + ((baseMinusTMin + 1) * delta) / (delta + skew))
  }

  /**
   * Converts a string of Unicode symbols (e.g. a domain name label) to a
   * Punycode string of ASCII-only symbols.
   */
  // eslint-disable-next-line  max-statements
  var encode = function(input) {
    var output = []

    // Convert the input in UCS-2 to an array of Unicode code points.
    input = ucs2decode(input)

    // Cache the length.
    var inputLength = input.length

    // Initialize the state.
    var n = initialN
    var delta = 0
    var bias = initialBias
    var i, currentValue

    // Handle the basic code points.
    for (i = 0; i < input.length; i++) {
      currentValue = input[i]
      if (currentValue < 0x80) {
        output.push(stringFromCharCode(currentValue))
      }
    }

    var basicLength = output.length // number of basic code points.
    var handledCPCount = basicLength // number of code points that have been handled;

    // Finish the basic string with a delimiter unless it's empty.
    if (basicLength) {
      output.push(delimiter)
    }

    // Main encoding loop:
    while (handledCPCount < inputLength) {
      // All non-basic code points < n have been handled already. Find the next larger one:
      var m = maxInt
      for (i = 0; i < input.length; i++) {
        currentValue = input[i]
        if (currentValue >= n && currentValue < m) {
          m = currentValue
        }
      }

      // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>, but guard against overflow.
      var handledCPCountPlusOne = handledCPCount + 1
      if (m - n > floor$8((maxInt - delta) / handledCPCountPlusOne)) {
        throw RangeError(OVERFLOW_ERROR)
      }

      delta += (m - n) * handledCPCountPlusOne
      n = m

      for (i = 0; i < input.length; i++) {
        currentValue = input[i]
        if (currentValue < n && ++delta > maxInt) {
          throw RangeError(OVERFLOW_ERROR)
        }
        if (currentValue == n) {
          // Represent delta as a generalized variable-length integer.
          var q = delta
          for (var k = base /* no condition */; ; k += base) {
            var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias
            if (q < t) break
            var qMinusT = q - t
            var baseMinusT = base - t
            output.push(
              stringFromCharCode(digitToBasic(t + (qMinusT % baseMinusT)))
            )
            q = floor$8(qMinusT / baseMinusT)
          }

          output.push(stringFromCharCode(digitToBasic(q)))
          bias = adapt(
            delta,
            handledCPCountPlusOne,
            handledCPCount == basicLength
          )
          delta = 0
          ++handledCPCount
        }
      }

      ++delta
      ++n
    }
    return output.join('')
  }

  var stringPunycodeToAscii = function(input) {
    var encoded = []
    var labels = input
      .toLowerCase()
      .replace(regexSeparators, '\u002E')
      .split('.')
    var i, label
    for (i = 0; i < labels.length; i++) {
      label = labels[i]
      encoded.push(regexNonASCII.test(label) ? 'xn--' + encode(label) : label)
    }
    return encoded.join('.')
  }

  // TODO: in core-js@4, move /modules/ dependencies to public entries for better optimization by tools like `preset-env`

  var $fetch$1 = getBuiltIn('fetch')
  var Headers$1 = getBuiltIn('Headers')
  var ITERATOR$8 = wellKnownSymbol('iterator')
  var URL_SEARCH_PARAMS = 'URLSearchParams'
  var URL_SEARCH_PARAMS_ITERATOR = URL_SEARCH_PARAMS + 'Iterator'
  var setInternalState$9 = internalState.set
  var getInternalParamsState = internalState.getterFor(URL_SEARCH_PARAMS)
  var getInternalIteratorState = internalState.getterFor(
    URL_SEARCH_PARAMS_ITERATOR
  )

  var plus = /\+/g
  var sequences = Array(4)

  var percentSequence = function(bytes) {
    return (
      sequences[bytes - 1] ||
      (sequences[bytes - 1] = RegExp('((?:%[\\da-f]{2}){' + bytes + '})', 'gi'))
    )
  }

  var percentDecode = function(sequence) {
    try {
      return decodeURIComponent(sequence)
    } catch (error) {
      return sequence
    }
  }

  var deserialize = function(it) {
    var result = it.replace(plus, ' ')
    var bytes = 4
    try {
      return decodeURIComponent(result)
    } catch (error) {
      while (bytes) {
        result = result.replace(percentSequence(bytes--), percentDecode)
      }
      return result
    }
  }

  var find$1 = /[!'()~]|%20/g

  var replace = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
  }

  var replacer = function(match) {
    return replace[match]
  }

  var serialize = function(it) {
    return encodeURIComponent(it).replace(find$1, replacer)
  }

  var parseSearchParams = function(result, query) {
    if (query) {
      var attributes = query.split('&')
      var index = 0
      var attribute, entry
      while (index < attributes.length) {
        attribute = attributes[index++]
        if (attribute.length) {
          entry = attribute.split('=')
          result.push({
            key: deserialize(entry.shift()),
            value: deserialize(entry.join('=')),
          })
        }
      }
    }
  }

  var updateSearchParams = function(query) {
    this.entries.length = 0
    parseSearchParams(this.entries, query)
  }

  var validateArgumentsLength = function(passed, required) {
    if (passed < required) throw TypeError('Not enough arguments')
  }

  var URLSearchParamsIterator = createIteratorConstructor(
    function Iterator(params, kind) {
      setInternalState$9(this, {
        type: URL_SEARCH_PARAMS_ITERATOR,
        iterator: getIterator(getInternalParamsState(params).entries),
        kind: kind,
      })
    },
    'Iterator',
    function next() {
      var state = getInternalIteratorState(this)
      var kind = state.kind
      var step = state.iterator.next()
      var entry = step.value
      if (!step.done) {
        step.value =
          kind === 'keys'
            ? entry.key
            : kind === 'values'
            ? entry.value
            : [entry.key, entry.value]
      }
      return step
    }
  )

  // `URLSearchParams` constructor
  // https://url.spec.whatwg.org/#interface-urlsearchparams
  var URLSearchParamsConstructor = function URLSearchParams(/* init */) {
    anInstance(this, URLSearchParamsConstructor, URL_SEARCH_PARAMS)
    var init = arguments.length > 0 ? arguments[0] : undefined
    var that = this
    var entries = []
    var iteratorMethod,
      iterator,
      next,
      step,
      entryIterator,
      entryNext,
      first,
      second,
      key

    setInternalState$9(that, {
      type: URL_SEARCH_PARAMS,
      entries: entries,
      updateURL: function() {
        /* empty */
      },
      updateSearchParams: updateSearchParams,
    })

    if (init !== undefined) {
      if (isObject(init)) {
        iteratorMethod = getIteratorMethod(init)
        if (typeof iteratorMethod === 'function') {
          iterator = iteratorMethod.call(init)
          next = iterator.next
          while (!(step = next.call(iterator)).done) {
            entryIterator = getIterator(anObject(step.value))
            entryNext = entryIterator.next
            if (
              (first = entryNext.call(entryIterator)).done ||
              (second = entryNext.call(entryIterator)).done ||
              !entryNext.call(entryIterator).done
            )
              throw TypeError('Expected sequence with length 2')
            entries.push({ key: first.value + '', value: second.value + '' })
          }
        } else
          for (key in init)
            if (has(init, key))
              entries.push({ key: key, value: init[key] + '' })
      } else {
        parseSearchParams(
          entries,
          typeof init === 'string'
            ? init.charAt(0) === '?'
              ? init.slice(1)
              : init
            : init + ''
        )
      }
    }
  }

  var URLSearchParamsPrototype = URLSearchParamsConstructor.prototype

  redefineAll(
    URLSearchParamsPrototype,
    {
      // `URLSearchParams.prototype.appent` method
      // https://url.spec.whatwg.org/#dom-urlsearchparams-append
      append: function append(name, value) {
        validateArgumentsLength(arguments.length, 2)
        var state = getInternalParamsState(this)
        state.entries.push({ key: name + '', value: value + '' })
        state.updateURL()
      },
      // `URLSearchParams.prototype.delete` method
      // https://url.spec.whatwg.org/#dom-urlsearchparams-delete
      delete: function(name) {
        validateArgumentsLength(arguments.length, 1)
        var state = getInternalParamsState(this)
        var entries = state.entries
        var key = name + ''
        var index = 0
        while (index < entries.length) {
          if (entries[index].key === key) entries.splice(index, 1)
          else index++
        }
        state.updateURL()
      },
      // `URLSearchParams.prototype.get` method
      // https://url.spec.whatwg.org/#dom-urlsearchparams-get
      get: function get(name) {
        validateArgumentsLength(arguments.length, 1)
        var entries = getInternalParamsState(this).entries
        var key = name + ''
        var index = 0
        for (; index < entries.length; index++) {
          if (entries[index].key === key) return entries[index].value
        }
        return null
      },
      // `URLSearchParams.prototype.getAll` method
      // https://url.spec.whatwg.org/#dom-urlsearchparams-getall
      getAll: function getAll(name) {
        validateArgumentsLength(arguments.length, 1)
        var entries = getInternalParamsState(this).entries
        var key = name + ''
        var result = []
        var index = 0
        for (; index < entries.length; index++) {
          if (entries[index].key === key) result.push(entries[index].value)
        }
        return result
      },
      // `URLSearchParams.prototype.has` method
      // https://url.spec.whatwg.org/#dom-urlsearchparams-has
      has: function has(name) {
        validateArgumentsLength(arguments.length, 1)
        var entries = getInternalParamsState(this).entries
        var key = name + ''
        var index = 0
        while (index < entries.length) {
          if (entries[index++].key === key) return true
        }
        return false
      },
      // `URLSearchParams.prototype.set` method
      // https://url.spec.whatwg.org/#dom-urlsearchparams-set
      set: function set(name, value) {
        validateArgumentsLength(arguments.length, 1)
        var state = getInternalParamsState(this)
        var entries = state.entries
        var found = false
        var key = name + ''
        var val = value + ''
        var index = 0
        var entry
        for (; index < entries.length; index++) {
          entry = entries[index]
          if (entry.key === key) {
            if (found) entries.splice(index--, 1)
            else {
              found = true
              entry.value = val
            }
          }
        }
        if (!found) entries.push({ key: key, value: val })
        state.updateURL()
      },
      // `URLSearchParams.prototype.sort` method
      // https://url.spec.whatwg.org/#dom-urlsearchparams-sort
      sort: function sort() {
        var state = getInternalParamsState(this)
        var entries = state.entries
        // Array#sort is not stable in some engines
        var slice = entries.slice()
        var entry, entriesIndex, sliceIndex
        entries.length = 0
        for (sliceIndex = 0; sliceIndex < slice.length; sliceIndex++) {
          entry = slice[sliceIndex]
          for (entriesIndex = 0; entriesIndex < sliceIndex; entriesIndex++) {
            if (entries[entriesIndex].key > entry.key) {
              entries.splice(entriesIndex, 0, entry)
              break
            }
          }
          if (entriesIndex === sliceIndex) entries.push(entry)
        }
        state.updateURL()
      },
      // `URLSearchParams.prototype.forEach` method
      forEach: function forEach(callback /* , thisArg */) {
        var entries = getInternalParamsState(this).entries
        var boundFunction = functionBindContext(
          callback,
          arguments.length > 1 ? arguments[1] : undefined,
          3
        )
        var index = 0
        var entry
        while (index < entries.length) {
          entry = entries[index++]
          boundFunction(entry.value, entry.key, this)
        }
      },
      // `URLSearchParams.prototype.keys` method
      keys: function keys() {
        return new URLSearchParamsIterator(this, 'keys')
      },
      // `URLSearchParams.prototype.values` method
      values: function values() {
        return new URLSearchParamsIterator(this, 'values')
      },
      // `URLSearchParams.prototype.entries` method
      entries: function entries() {
        return new URLSearchParamsIterator(this, 'entries')
      },
    },
    { enumerable: true }
  )

  // `URLSearchParams.prototype[@@iterator]` method
  redefine(
    URLSearchParamsPrototype,
    ITERATOR$8,
    URLSearchParamsPrototype.entries
  )

  // `URLSearchParams.prototype.toString` method
  // https://url.spec.whatwg.org/#urlsearchparams-stringification-behavior
  redefine(
    URLSearchParamsPrototype,
    'toString',
    function toString() {
      var entries = getInternalParamsState(this).entries
      var result = []
      var index = 0
      var entry
      while (index < entries.length) {
        entry = entries[index++]
        result.push(serialize(entry.key) + '=' + serialize(entry.value))
      }
      return result.join('&')
    },
    { enumerable: true }
  )

  setToStringTag(URLSearchParamsConstructor, URL_SEARCH_PARAMS)

  _export(
    { global: true, forced: !nativeUrl },
    {
      URLSearchParams: URLSearchParamsConstructor,
    }
  )

  // Wrap `fetch` for correct work with polyfilled `URLSearchParams`
  // https://github.com/zloirock/core-js/issues/674
  if (
    !nativeUrl &&
    typeof $fetch$1 == 'function' &&
    typeof Headers$1 == 'function'
  ) {
    _export(
      { global: true, enumerable: true, forced: true },
      {
        fetch: function fetch(input /* , init */) {
          var args = [input]
          var init, body, headers
          if (arguments.length > 1) {
            init = arguments[1]
            if (isObject(init)) {
              body = init.body
              if (classof(body) === URL_SEARCH_PARAMS) {
                headers = init.headers
                  ? new Headers$1(init.headers)
                  : new Headers$1()
                if (!headers.has('content-type')) {
                  headers.set(
                    'content-type',
                    'application/x-www-form-urlencoded;charset=UTF-8'
                  )
                }
                init = objectCreate(init, {
                  body: createPropertyDescriptor(0, String(body)),
                  headers: createPropertyDescriptor(0, headers),
                })
              }
            }
            args.push(init)
          }
          return $fetch$1.apply(this, args)
        },
      }
    )
  }

  var web_urlSearchParams = {
    URLSearchParams: URLSearchParamsConstructor,
    getState: getInternalParamsState,
  }

  // TODO: in core-js@4, move /modules/ dependencies to public entries for better optimization by tools like `preset-env`

  var codeAt$1 = stringMultibyte.codeAt

  var NativeURL = global_1.URL
  var URLSearchParams$1 = web_urlSearchParams.URLSearchParams
  var getInternalSearchParamsState = web_urlSearchParams.getState
  var setInternalState$a = internalState.set
  var getInternalURLState = internalState.getterFor('URL')
  var floor$9 = Math.floor
  var pow$4 = Math.pow

  var INVALID_AUTHORITY = 'Invalid authority'
  var INVALID_SCHEME = 'Invalid scheme'
  var INVALID_HOST = 'Invalid host'
  var INVALID_PORT = 'Invalid port'

  var ALPHA = /[A-Za-z]/
  var ALPHANUMERIC = /[\d+\-.A-Za-z]/
  var DIGIT = /\d/
  var HEX_START = /^(0x|0X)/
  var OCT = /^[0-7]+$/
  var DEC = /^\d+$/
  var HEX = /^[\dA-Fa-f]+$/
  // eslint-disable-next-line no-control-regex
  var FORBIDDEN_HOST_CODE_POINT = /[\u0000\u0009\u000A\u000D #%/:?@[\\]]/
  // eslint-disable-next-line no-control-regex
  var FORBIDDEN_HOST_CODE_POINT_EXCLUDING_PERCENT = /[\u0000\u0009\u000A\u000D #/:?@[\\]]/
  // eslint-disable-next-line no-control-regex
  var LEADING_AND_TRAILING_C0_CONTROL_OR_SPACE = /^[\u0000-\u001F ]+|[\u0000-\u001F ]+$/g
  // eslint-disable-next-line no-control-regex
  var TAB_AND_NEW_LINE = /[\u0009\u000A\u000D]/g
  var EOF

  var parseHost = function(url, input) {
    var result, codePoints, index
    if (input.charAt(0) == '[') {
      if (input.charAt(input.length - 1) != ']') return INVALID_HOST
      result = parseIPv6(input.slice(1, -1))
      if (!result) return INVALID_HOST
      url.host = result
      // opaque host
    } else if (!isSpecial(url)) {
      if (FORBIDDEN_HOST_CODE_POINT_EXCLUDING_PERCENT.test(input))
        return INVALID_HOST
      result = ''
      codePoints = arrayFrom(input)
      for (index = 0; index < codePoints.length; index++) {
        result += percentEncode(codePoints[index], C0ControlPercentEncodeSet)
      }
      url.host = result
    } else {
      input = stringPunycodeToAscii(input)
      if (FORBIDDEN_HOST_CODE_POINT.test(input)) return INVALID_HOST
      result = parseIPv4(input)
      if (result === null) return INVALID_HOST
      url.host = result
    }
  }

  var parseIPv4 = function(input) {
    var parts = input.split('.')
    var partsLength, numbers, index, part, radix, number, ipv4
    if (parts.length && parts[parts.length - 1] == '') {
      parts.pop()
    }
    partsLength = parts.length
    if (partsLength > 4) return input
    numbers = []
    for (index = 0; index < partsLength; index++) {
      part = parts[index]
      if (part == '') return input
      radix = 10
      if (part.length > 1 && part.charAt(0) == '0') {
        radix = HEX_START.test(part) ? 16 : 8
        part = part.slice(radix == 8 ? 1 : 2)
      }
      if (part === '') {
        number = 0
      } else {
        if (!(radix == 10 ? DEC : radix == 8 ? OCT : HEX).test(part))
          return input
        number = parseInt(part, radix)
      }
      numbers.push(number)
    }
    for (index = 0; index < partsLength; index++) {
      number = numbers[index]
      if (index == partsLength - 1) {
        if (number >= pow$4(256, 5 - partsLength)) return null
      } else if (number > 255) return null
    }
    ipv4 = numbers.pop()
    for (index = 0; index < numbers.length; index++) {
      ipv4 += numbers[index] * pow$4(256, 3 - index)
    }
    return ipv4
  }

  // eslint-disable-next-line max-statements
  var parseIPv6 = function(input) {
    var address = [0, 0, 0, 0, 0, 0, 0, 0]
    var pieceIndex = 0
    var compress = null
    var pointer = 0
    var value, length, numbersSeen, ipv4Piece, number, swaps, swap

    var char = function() {
      return input.charAt(pointer)
    }

    if (char() == ':') {
      if (input.charAt(1) != ':') return
      pointer += 2
      pieceIndex++
      compress = pieceIndex
    }
    while (char()) {
      if (pieceIndex == 8) return
      if (char() == ':') {
        if (compress !== null) return
        pointer++
        pieceIndex++
        compress = pieceIndex
        continue
      }
      value = length = 0
      while (length < 4 && HEX.test(char())) {
        value = value * 16 + parseInt(char(), 16)
        pointer++
        length++
      }
      if (char() == '.') {
        if (length == 0) return
        pointer -= length
        if (pieceIndex > 6) return
        numbersSeen = 0
        while (char()) {
          ipv4Piece = null
          if (numbersSeen > 0) {
            if (char() == '.' && numbersSeen < 4) pointer++
            else return
          }
          if (!DIGIT.test(char())) return
          while (DIGIT.test(char())) {
            number = parseInt(char(), 10)
            if (ipv4Piece === null) ipv4Piece = number
            else if (ipv4Piece == 0) return
            else ipv4Piece = ipv4Piece * 10 + number
            if (ipv4Piece > 255) return
            pointer++
          }
          address[pieceIndex] = address[pieceIndex] * 256 + ipv4Piece
          numbersSeen++
          if (numbersSeen == 2 || numbersSeen == 4) pieceIndex++
        }
        if (numbersSeen != 4) return
        break
      } else if (char() == ':') {
        pointer++
        if (!char()) return
      } else if (char()) return
      address[pieceIndex++] = value
    }
    if (compress !== null) {
      swaps = pieceIndex - compress
      pieceIndex = 7
      while (pieceIndex != 0 && swaps > 0) {
        swap = address[pieceIndex]
        address[pieceIndex--] = address[compress + swaps - 1]
        address[compress + --swaps] = swap
      }
    } else if (pieceIndex != 8) return
    return address
  }

  var findLongestZeroSequence = function(ipv6) {
    var maxIndex = null
    var maxLength = 1
    var currStart = null
    var currLength = 0
    var index = 0
    for (; index < 8; index++) {
      if (ipv6[index] !== 0) {
        if (currLength > maxLength) {
          maxIndex = currStart
          maxLength = currLength
        }
        currStart = null
        currLength = 0
      } else {
        if (currStart === null) currStart = index
        ++currLength
      }
    }
    if (currLength > maxLength) {
      maxIndex = currStart
      maxLength = currLength
    }
    return maxIndex
  }

  var serializeHost = function(host) {
    var result, index, compress, ignore0
    // ipv4
    if (typeof host == 'number') {
      result = []
      for (index = 0; index < 4; index++) {
        result.unshift(host % 256)
        host = floor$9(host / 256)
      }
      return result.join('.')
      // ipv6
    } else if (typeof host == 'object') {
      result = ''
      compress = findLongestZeroSequence(host)
      for (index = 0; index < 8; index++) {
        if (ignore0 && host[index] === 0) continue
        if (ignore0) ignore0 = false
        if (compress === index) {
          result += index ? ':' : '::'
          ignore0 = true
        } else {
          result += host[index].toString(16)
          if (index < 7) result += ':'
        }
      }
      return '[' + result + ']'
    }
    return host
  }

  var C0ControlPercentEncodeSet = {}
  var fragmentPercentEncodeSet = objectAssign$1({}, C0ControlPercentEncodeSet, {
    ' ': 1,
    '"': 1,
    '<': 1,
    '>': 1,
    '`': 1,
  })
  var pathPercentEncodeSet = objectAssign$1({}, fragmentPercentEncodeSet, {
    '#': 1,
    '?': 1,
    '{': 1,
    '}': 1,
  })
  var userinfoPercentEncodeSet = objectAssign$1({}, pathPercentEncodeSet, {
    '/': 1,
    ':': 1,
    ';': 1,
    '=': 1,
    '@': 1,
    '[': 1,
    '\\': 1,
    ']': 1,
    '^': 1,
    '|': 1,
  })

  var percentEncode = function(char, set) {
    var code = codeAt$1(char, 0)
    return code > 0x20 && code < 0x7f && !has(set, char)
      ? char
      : encodeURIComponent(char)
  }

  var specialSchemes = {
    ftp: 21,
    file: null,
    http: 80,
    https: 443,
    ws: 80,
    wss: 443,
  }

  var isSpecial = function(url) {
    return has(specialSchemes, url.scheme)
  }

  var includesCredentials = function(url) {
    return url.username != '' || url.password != ''
  }

  var cannotHaveUsernamePasswordPort = function(url) {
    return !url.host || url.cannotBeABaseURL || url.scheme == 'file'
  }

  var isWindowsDriveLetter = function(string, normalized) {
    var second
    return (
      string.length == 2 &&
      ALPHA.test(string.charAt(0)) &&
      ((second = string.charAt(1)) == ':' || (!normalized && second == '|'))
    )
  }

  var startsWithWindowsDriveLetter = function(string) {
    var third
    return (
      string.length > 1 &&
      isWindowsDriveLetter(string.slice(0, 2)) &&
      (string.length == 2 ||
        ((third = string.charAt(2)) === '/' ||
          third === '\\' ||
          third === '?' ||
          third === '#'))
    )
  }

  var shortenURLsPath = function(url) {
    var path = url.path
    var pathSize = path.length
    if (
      pathSize &&
      (url.scheme != 'file' ||
        pathSize != 1 ||
        !isWindowsDriveLetter(path[0], true))
    ) {
      path.pop()
    }
  }

  var isSingleDot = function(segment) {
    return segment === '.' || segment.toLowerCase() === '%2e'
  }

  var isDoubleDot = function(segment) {
    segment = segment.toLowerCase()
    return (
      segment === '..' ||
      segment === '%2e.' ||
      segment === '.%2e' ||
      segment === '%2e%2e'
    )
  }

  // States:
  var SCHEME_START = {}
  var SCHEME = {}
  var NO_SCHEME = {}
  var SPECIAL_RELATIVE_OR_AUTHORITY = {}
  var PATH_OR_AUTHORITY = {}
  var RELATIVE = {}
  var RELATIVE_SLASH = {}
  var SPECIAL_AUTHORITY_SLASHES = {}
  var SPECIAL_AUTHORITY_IGNORE_SLASHES = {}
  var AUTHORITY = {}
  var HOST = {}
  var HOSTNAME = {}
  var PORT = {}
  var FILE = {}
  var FILE_SLASH = {}
  var FILE_HOST = {}
  var PATH_START = {}
  var PATH = {}
  var CANNOT_BE_A_BASE_URL_PATH = {}
  var QUERY = {}
  var FRAGMENT = {}

  // eslint-disable-next-line max-statements
  var parseURL = function(url, input, stateOverride, base) {
    var state = stateOverride || SCHEME_START
    var pointer = 0
    var buffer = ''
    var seenAt = false
    var seenBracket = false
    var seenPasswordToken = false
    var codePoints, char, bufferCodePoints, failure

    if (!stateOverride) {
      url.scheme = ''
      url.username = ''
      url.password = ''
      url.host = null
      url.port = null
      url.path = []
      url.query = null
      url.fragment = null
      url.cannotBeABaseURL = false
      input = input.replace(LEADING_AND_TRAILING_C0_CONTROL_OR_SPACE, '')
    }

    input = input.replace(TAB_AND_NEW_LINE, '')

    codePoints = arrayFrom(input)

    while (pointer <= codePoints.length) {
      char = codePoints[pointer]
      switch (state) {
        case SCHEME_START:
          if (char && ALPHA.test(char)) {
            buffer += char.toLowerCase()
            state = SCHEME
          } else if (!stateOverride) {
            state = NO_SCHEME
            continue
          } else return INVALID_SCHEME
          break

        case SCHEME:
          if (
            char &&
            (ALPHANUMERIC.test(char) ||
              char == '+' ||
              char == '-' ||
              char == '.')
          ) {
            buffer += char.toLowerCase()
          } else if (char == ':') {
            if (
              stateOverride &&
              (isSpecial(url) != has(specialSchemes, buffer) ||
                (buffer == 'file' &&
                  (includesCredentials(url) || url.port !== null)) ||
                (url.scheme == 'file' && !url.host))
            )
              return
            url.scheme = buffer
            if (stateOverride) {
              if (isSpecial(url) && specialSchemes[url.scheme] == url.port)
                url.port = null
              return
            }
            buffer = ''
            if (url.scheme == 'file') {
              state = FILE
            } else if (isSpecial(url) && base && base.scheme == url.scheme) {
              state = SPECIAL_RELATIVE_OR_AUTHORITY
            } else if (isSpecial(url)) {
              state = SPECIAL_AUTHORITY_SLASHES
            } else if (codePoints[pointer + 1] == '/') {
              state = PATH_OR_AUTHORITY
              pointer++
            } else {
              url.cannotBeABaseURL = true
              url.path.push('')
              state = CANNOT_BE_A_BASE_URL_PATH
            }
          } else if (!stateOverride) {
            buffer = ''
            state = NO_SCHEME
            pointer = 0
            continue
          } else return INVALID_SCHEME
          break

        case NO_SCHEME:
          if (!base || (base.cannotBeABaseURL && char != '#'))
            return INVALID_SCHEME
          if (base.cannotBeABaseURL && char == '#') {
            url.scheme = base.scheme
            url.path = base.path.slice()
            url.query = base.query
            url.fragment = ''
            url.cannotBeABaseURL = true
            state = FRAGMENT
            break
          }
          state = base.scheme == 'file' ? FILE : RELATIVE
          continue

        case SPECIAL_RELATIVE_OR_AUTHORITY:
          if (char == '/' && codePoints[pointer + 1] == '/') {
            state = SPECIAL_AUTHORITY_IGNORE_SLASHES
            pointer++
          } else {
            state = RELATIVE
            continue
          }
          break

        case PATH_OR_AUTHORITY:
          if (char == '/') {
            state = AUTHORITY
            break
          } else {
            state = PATH
            continue
          }

        case RELATIVE:
          url.scheme = base.scheme
          if (char == EOF) {
            url.username = base.username
            url.password = base.password
            url.host = base.host
            url.port = base.port
            url.path = base.path.slice()
            url.query = base.query
          } else if (char == '/' || (char == '\\' && isSpecial(url))) {
            state = RELATIVE_SLASH
          } else if (char == '?') {
            url.username = base.username
            url.password = base.password
            url.host = base.host
            url.port = base.port
            url.path = base.path.slice()
            url.query = ''
            state = QUERY
          } else if (char == '#') {
            url.username = base.username
            url.password = base.password
            url.host = base.host
            url.port = base.port
            url.path = base.path.slice()
            url.query = base.query
            url.fragment = ''
            state = FRAGMENT
          } else {
            url.username = base.username
            url.password = base.password
            url.host = base.host
            url.port = base.port
            url.path = base.path.slice()
            url.path.pop()
            state = PATH
            continue
          }
          break

        case RELATIVE_SLASH:
          if (isSpecial(url) && (char == '/' || char == '\\')) {
            state = SPECIAL_AUTHORITY_IGNORE_SLASHES
          } else if (char == '/') {
            state = AUTHORITY
          } else {
            url.username = base.username
            url.password = base.password
            url.host = base.host
            url.port = base.port
            state = PATH
            continue
          }
          break

        case SPECIAL_AUTHORITY_SLASHES:
          state = SPECIAL_AUTHORITY_IGNORE_SLASHES
          if (char != '/' || buffer.charAt(pointer + 1) != '/') continue
          pointer++
          break

        case SPECIAL_AUTHORITY_IGNORE_SLASHES:
          if (char != '/' && char != '\\') {
            state = AUTHORITY
            continue
          }
          break

        case AUTHORITY:
          if (char == '@') {
            if (seenAt) buffer = '%40' + buffer
            seenAt = true
            bufferCodePoints = arrayFrom(buffer)
            for (var i = 0; i < bufferCodePoints.length; i++) {
              var codePoint = bufferCodePoints[i]
              if (codePoint == ':' && !seenPasswordToken) {
                seenPasswordToken = true
                continue
              }
              var encodedCodePoints = percentEncode(
                codePoint,
                userinfoPercentEncodeSet
              )
              if (seenPasswordToken) url.password += encodedCodePoints
              else url.username += encodedCodePoints
            }
            buffer = ''
          } else if (
            char == EOF ||
            char == '/' ||
            char == '?' ||
            char == '#' ||
            (char == '\\' && isSpecial(url))
          ) {
            if (seenAt && buffer == '') return INVALID_AUTHORITY
            pointer -= arrayFrom(buffer).length + 1
            buffer = ''
            state = HOST
          } else buffer += char
          break

        case HOST:
        case HOSTNAME:
          if (stateOverride && url.scheme == 'file') {
            state = FILE_HOST
            continue
          } else if (char == ':' && !seenBracket) {
            if (buffer == '') return INVALID_HOST
            failure = parseHost(url, buffer)
            if (failure) return failure
            buffer = ''
            state = PORT
            if (stateOverride == HOSTNAME) return
          } else if (
            char == EOF ||
            char == '/' ||
            char == '?' ||
            char == '#' ||
            (char == '\\' && isSpecial(url))
          ) {
            if (isSpecial(url) && buffer == '') return INVALID_HOST
            if (
              stateOverride &&
              buffer == '' &&
              (includesCredentials(url) || url.port !== null)
            )
              return
            failure = parseHost(url, buffer)
            if (failure) return failure
            buffer = ''
            state = PATH_START
            if (stateOverride) return
            continue
          } else {
            if (char == '[') seenBracket = true
            else if (char == ']') seenBracket = false
            buffer += char
          }
          break

        case PORT:
          if (DIGIT.test(char)) {
            buffer += char
          } else if (
            char == EOF ||
            char == '/' ||
            char == '?' ||
            char == '#' ||
            (char == '\\' && isSpecial(url)) ||
            stateOverride
          ) {
            if (buffer != '') {
              var port = parseInt(buffer, 10)
              if (port > 0xffff) return INVALID_PORT
              url.port =
                isSpecial(url) && port === specialSchemes[url.scheme]
                  ? null
                  : port
              buffer = ''
            }
            if (stateOverride) return
            state = PATH_START
            continue
          } else return INVALID_PORT
          break

        case FILE:
          url.scheme = 'file'
          if (char == '/' || char == '\\') state = FILE_SLASH
          else if (base && base.scheme == 'file') {
            if (char == EOF) {
              url.host = base.host
              url.path = base.path.slice()
              url.query = base.query
            } else if (char == '?') {
              url.host = base.host
              url.path = base.path.slice()
              url.query = ''
              state = QUERY
            } else if (char == '#') {
              url.host = base.host
              url.path = base.path.slice()
              url.query = base.query
              url.fragment = ''
              state = FRAGMENT
            } else {
              if (
                !startsWithWindowsDriveLetter(
                  codePoints.slice(pointer).join('')
                )
              ) {
                url.host = base.host
                url.path = base.path.slice()
                shortenURLsPath(url)
              }
              state = PATH
              continue
            }
          } else {
            state = PATH
            continue
          }
          break

        case FILE_SLASH:
          if (char == '/' || char == '\\') {
            state = FILE_HOST
            break
          }
          if (
            base &&
            base.scheme == 'file' &&
            !startsWithWindowsDriveLetter(codePoints.slice(pointer).join(''))
          ) {
            if (isWindowsDriveLetter(base.path[0], true))
              url.path.push(base.path[0])
            else url.host = base.host
          }
          state = PATH
          continue

        case FILE_HOST:
          if (
            char == EOF ||
            char == '/' ||
            char == '\\' ||
            char == '?' ||
            char == '#'
          ) {
            if (!stateOverride && isWindowsDriveLetter(buffer)) {
              state = PATH
            } else if (buffer == '') {
              url.host = ''
              if (stateOverride) return
              state = PATH_START
            } else {
              failure = parseHost(url, buffer)
              if (failure) return failure
              if (url.host == 'localhost') url.host = ''
              if (stateOverride) return
              buffer = ''
              state = PATH_START
            }
            continue
          } else buffer += char
          break

        case PATH_START:
          if (isSpecial(url)) {
            state = PATH
            if (char != '/' && char != '\\') continue
          } else if (!stateOverride && char == '?') {
            url.query = ''
            state = QUERY
          } else if (!stateOverride && char == '#') {
            url.fragment = ''
            state = FRAGMENT
          } else if (char != EOF) {
            state = PATH
            if (char != '/') continue
          }
          break

        case PATH:
          if (
            char == EOF ||
            char == '/' ||
            (char == '\\' && isSpecial(url)) ||
            (!stateOverride && (char == '?' || char == '#'))
          ) {
            if (isDoubleDot(buffer)) {
              shortenURLsPath(url)
              if (char != '/' && !(char == '\\' && isSpecial(url))) {
                url.path.push('')
              }
            } else if (isSingleDot(buffer)) {
              if (char != '/' && !(char == '\\' && isSpecial(url))) {
                url.path.push('')
              }
            } else {
              if (
                url.scheme == 'file' &&
                !url.path.length &&
                isWindowsDriveLetter(buffer)
              ) {
                if (url.host) url.host = ''
                buffer = buffer.charAt(0) + ':' // normalize windows drive letter
              }
              url.path.push(buffer)
            }
            buffer = ''
            if (
              url.scheme == 'file' &&
              (char == EOF || char == '?' || char == '#')
            ) {
              while (url.path.length > 1 && url.path[0] === '') {
                url.path.shift()
              }
            }
            if (char == '?') {
              url.query = ''
              state = QUERY
            } else if (char == '#') {
              url.fragment = ''
              state = FRAGMENT
            }
          } else {
            buffer += percentEncode(char, pathPercentEncodeSet)
          }
          break

        case CANNOT_BE_A_BASE_URL_PATH:
          if (char == '?') {
            url.query = ''
            state = QUERY
          } else if (char == '#') {
            url.fragment = ''
            state = FRAGMENT
          } else if (char != EOF) {
            url.path[0] += percentEncode(char, C0ControlPercentEncodeSet)
          }
          break

        case QUERY:
          if (!stateOverride && char == '#') {
            url.fragment = ''
            state = FRAGMENT
          } else if (char != EOF) {
            if (char == "'" && isSpecial(url)) url.query += '%27'
            else if (char == '#') url.query += '%23'
            else url.query += percentEncode(char, C0ControlPercentEncodeSet)
          }
          break

        case FRAGMENT:
          if (char != EOF)
            url.fragment += percentEncode(char, fragmentPercentEncodeSet)
          break
      }

      pointer++
    }
  }

  // `URL` constructor
  // https://url.spec.whatwg.org/#url-class
  var URLConstructor = function URL(url /* , base */) {
    var that = anInstance(this, URLConstructor, 'URL')
    var base = arguments.length > 1 ? arguments[1] : undefined
    var urlString = String(url)
    var state = setInternalState$a(that, { type: 'URL' })
    var baseState, failure
    if (base !== undefined) {
      if (base instanceof URLConstructor) baseState = getInternalURLState(base)
      else {
        failure = parseURL((baseState = {}), String(base))
        if (failure) throw TypeError(failure)
      }
    }
    failure = parseURL(state, urlString, null, baseState)
    if (failure) throw TypeError(failure)
    var searchParams = (state.searchParams = new URLSearchParams$1())
    var searchParamsState = getInternalSearchParamsState(searchParams)
    searchParamsState.updateSearchParams(state.query)
    searchParamsState.updateURL = function() {
      state.query = String(searchParams) || null
    }
    if (!descriptors) {
      that.href = serializeURL.call(that)
      that.origin = getOrigin.call(that)
      that.protocol = getProtocol.call(that)
      that.username = getUsername.call(that)
      that.password = getPassword.call(that)
      that.host = getHost.call(that)
      that.hostname = getHostname.call(that)
      that.port = getPort.call(that)
      that.pathname = getPathname.call(that)
      that.search = getSearch.call(that)
      that.searchParams = getSearchParams.call(that)
      that.hash = getHash.call(that)
    }
  }

  var URLPrototype = URLConstructor.prototype

  var serializeURL = function() {
    var url = getInternalURLState(this)
    var scheme = url.scheme
    var username = url.username
    var password = url.password
    var host = url.host
    var port = url.port
    var path = url.path
    var query = url.query
    var fragment = url.fragment
    var output = scheme + ':'
    if (host !== null) {
      output += '//'
      if (includesCredentials(url)) {
        output += username + (password ? ':' + password : '') + '@'
      }
      output += serializeHost(host)
      if (port !== null) output += ':' + port
    } else if (scheme == 'file') output += '//'
    output += url.cannotBeABaseURL
      ? path[0]
      : path.length
      ? '/' + path.join('/')
      : ''
    if (query !== null) output += '?' + query
    if (fragment !== null) output += '#' + fragment
    return output
  }

  var getOrigin = function() {
    var url = getInternalURLState(this)
    var scheme = url.scheme
    var port = url.port
    if (scheme == 'blob')
      try {
        return new URL(scheme.path[0]).origin
      } catch (error) {
        return 'null'
      }
    if (scheme == 'file' || !isSpecial(url)) return 'null'
    return (
      scheme +
      '://' +
      serializeHost(url.host) +
      (port !== null ? ':' + port : '')
    )
  }

  var getProtocol = function() {
    return getInternalURLState(this).scheme + ':'
  }

  var getUsername = function() {
    return getInternalURLState(this).username
  }

  var getPassword = function() {
    return getInternalURLState(this).password
  }

  var getHost = function() {
    var url = getInternalURLState(this)
    var host = url.host
    var port = url.port
    return host === null
      ? ''
      : port === null
      ? serializeHost(host)
      : serializeHost(host) + ':' + port
  }

  var getHostname = function() {
    var host = getInternalURLState(this).host
    return host === null ? '' : serializeHost(host)
  }

  var getPort = function() {
    var port = getInternalURLState(this).port
    return port === null ? '' : String(port)
  }

  var getPathname = function() {
    var url = getInternalURLState(this)
    var path = url.path
    return url.cannotBeABaseURL
      ? path[0]
      : path.length
      ? '/' + path.join('/')
      : ''
  }

  var getSearch = function() {
    var query = getInternalURLState(this).query
    return query ? '?' + query : ''
  }

  var getSearchParams = function() {
    return getInternalURLState(this).searchParams
  }

  var getHash = function() {
    var fragment = getInternalURLState(this).fragment
    return fragment ? '#' + fragment : ''
  }

  var accessorDescriptor = function(getter, setter) {
    return { get: getter, set: setter, configurable: true, enumerable: true }
  }

  if (descriptors) {
    objectDefineProperties(URLPrototype, {
      // `URL.prototype.href` accessors pair
      // https://url.spec.whatwg.org/#dom-url-href
      href: accessorDescriptor(serializeURL, function(href) {
        var url = getInternalURLState(this)
        var urlString = String(href)
        var failure = parseURL(url, urlString)
        if (failure) throw TypeError(failure)
        getInternalSearchParamsState(url.searchParams).updateSearchParams(
          url.query
        )
      }),
      // `URL.prototype.origin` getter
      // https://url.spec.whatwg.org/#dom-url-origin
      origin: accessorDescriptor(getOrigin),
      // `URL.prototype.protocol` accessors pair
      // https://url.spec.whatwg.org/#dom-url-protocol
      protocol: accessorDescriptor(getProtocol, function(protocol) {
        var url = getInternalURLState(this)
        parseURL(url, String(protocol) + ':', SCHEME_START)
      }),
      // `URL.prototype.username` accessors pair
      // https://url.spec.whatwg.org/#dom-url-username
      username: accessorDescriptor(getUsername, function(username) {
        var url = getInternalURLState(this)
        var codePoints = arrayFrom(String(username))
        if (cannotHaveUsernamePasswordPort(url)) return
        url.username = ''
        for (var i = 0; i < codePoints.length; i++) {
          url.username += percentEncode(codePoints[i], userinfoPercentEncodeSet)
        }
      }),
      // `URL.prototype.password` accessors pair
      // https://url.spec.whatwg.org/#dom-url-password
      password: accessorDescriptor(getPassword, function(password) {
        var url = getInternalURLState(this)
        var codePoints = arrayFrom(String(password))
        if (cannotHaveUsernamePasswordPort(url)) return
        url.password = ''
        for (var i = 0; i < codePoints.length; i++) {
          url.password += percentEncode(codePoints[i], userinfoPercentEncodeSet)
        }
      }),
      // `URL.prototype.host` accessors pair
      // https://url.spec.whatwg.org/#dom-url-host
      host: accessorDescriptor(getHost, function(host) {
        var url = getInternalURLState(this)
        if (url.cannotBeABaseURL) return
        parseURL(url, String(host), HOST)
      }),
      // `URL.prototype.hostname` accessors pair
      // https://url.spec.whatwg.org/#dom-url-hostname
      hostname: accessorDescriptor(getHostname, function(hostname) {
        var url = getInternalURLState(this)
        if (url.cannotBeABaseURL) return
        parseURL(url, String(hostname), HOSTNAME)
      }),
      // `URL.prototype.port` accessors pair
      // https://url.spec.whatwg.org/#dom-url-port
      port: accessorDescriptor(getPort, function(port) {
        var url = getInternalURLState(this)
        if (cannotHaveUsernamePasswordPort(url)) return
        port = String(port)
        if (port == '') url.port = null
        else parseURL(url, port, PORT)
      }),
      // `URL.prototype.pathname` accessors pair
      // https://url.spec.whatwg.org/#dom-url-pathname
      pathname: accessorDescriptor(getPathname, function(pathname) {
        var url = getInternalURLState(this)
        if (url.cannotBeABaseURL) return
        url.path = []
        parseURL(url, pathname + '', PATH_START)
      }),
      // `URL.prototype.search` accessors pair
      // https://url.spec.whatwg.org/#dom-url-search
      search: accessorDescriptor(getSearch, function(search) {
        var url = getInternalURLState(this)
        search = String(search)
        if (search == '') {
          url.query = null
        } else {
          if ('?' == search.charAt(0)) search = search.slice(1)
          url.query = ''
          parseURL(url, search, QUERY)
        }
        getInternalSearchParamsState(url.searchParams).updateSearchParams(
          url.query
        )
      }),
      // `URL.prototype.searchParams` getter
      // https://url.spec.whatwg.org/#dom-url-searchparams
      searchParams: accessorDescriptor(getSearchParams),
      // `URL.prototype.hash` accessors pair
      // https://url.spec.whatwg.org/#dom-url-hash
      hash: accessorDescriptor(getHash, function(hash) {
        var url = getInternalURLState(this)
        hash = String(hash)
        if (hash == '') {
          url.fragment = null
          return
        }
        if ('#' == hash.charAt(0)) hash = hash.slice(1)
        url.fragment = ''
        parseURL(url, hash, FRAGMENT)
      }),
    })
  }

  // `URL.prototype.toJSON` method
  // https://url.spec.whatwg.org/#dom-url-tojson
  redefine(
    URLPrototype,
    'toJSON',
    function toJSON() {
      return serializeURL.call(this)
    },
    { enumerable: true }
  )

  // `URL.prototype.toString` method
  // https://url.spec.whatwg.org/#URL-stringification-behavior
  redefine(
    URLPrototype,
    'toString',
    function toString() {
      return serializeURL.call(this)
    },
    { enumerable: true }
  )

  if (NativeURL) {
    var nativeCreateObjectURL = NativeURL.createObjectURL
    var nativeRevokeObjectURL = NativeURL.revokeObjectURL
    // `URL.createObjectURL` method
    // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
    // eslint-disable-next-line no-unused-vars
    if (nativeCreateObjectURL)
      redefine(URLConstructor, 'createObjectURL', function createObjectURL(
        blob
      ) {
        return nativeCreateObjectURL.apply(NativeURL, arguments)
      })
    // `URL.revokeObjectURL` method
    // https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
    // eslint-disable-next-line no-unused-vars
    if (nativeRevokeObjectURL)
      redefine(URLConstructor, 'revokeObjectURL', function revokeObjectURL(
        url
      ) {
        return nativeRevokeObjectURL.apply(NativeURL, arguments)
      })
  }

  setToStringTag(URLConstructor, 'URL')

  _export(
    { global: true, forced: !nativeUrl, sham: !descriptors },
    {
      URL: URLConstructor,
    }
  )

  // `URL.prototype.toJSON` method
  // https://url.spec.whatwg.org/#dom-url-tojson
  _export(
    { target: 'URL', proto: true, enumerable: true },
    {
      toJSON: function toJSON() {
        return URL.prototype.toString.call(this)
      },
    }
  )

  var runtime_1 = createCommonjsModule(function(module) {
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */

    var runtime = (function(exports) {
      var Op = Object.prototype
      var hasOwn = Op.hasOwnProperty
      var undefined$1 // More compressible than void 0.
      var $Symbol = typeof Symbol === 'function' ? Symbol : {}
      var iteratorSymbol = $Symbol.iterator || '@@iterator'
      var asyncIteratorSymbol = $Symbol.asyncIterator || '@@asyncIterator'
      var toStringTagSymbol = $Symbol.toStringTag || '@@toStringTag'

      function wrap(innerFn, outerFn, self, tryLocsList) {
        // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
        var protoGenerator =
          outerFn && outerFn.prototype instanceof Generator
            ? outerFn
            : Generator
        var generator = Object.create(protoGenerator.prototype)
        var context = new Context(tryLocsList || [])

        // The ._invoke method unifies the implementations of the .next,
        // .throw, and .return methods.
        generator._invoke = makeInvokeMethod(innerFn, self, context)

        return generator
      }
      exports.wrap = wrap

      // Try/catch helper to minimize deoptimizations. Returns a completion
      // record like context.tryEntries[i].completion. This interface could
      // have been (and was previously) designed to take a closure to be
      // invoked without arguments, but in all the cases we care about we
      // already have an existing method we want to call, so there's no need
      // to create a new function object. We can even get away with assuming
      // the method takes exactly one argument, since that happens to be true
      // in every case, so we don't have to touch the arguments object. The
      // only additional allocation required is the completion record, which
      // has a stable shape and so hopefully should be cheap to allocate.
      function tryCatch(fn, obj, arg) {
        try {
          return { type: 'normal', arg: fn.call(obj, arg) }
        } catch (err) {
          return { type: 'throw', arg: err }
        }
      }

      var GenStateSuspendedStart = 'suspendedStart'
      var GenStateSuspendedYield = 'suspendedYield'
      var GenStateExecuting = 'executing'
      var GenStateCompleted = 'completed'

      // Returning this object from the innerFn has the same effect as
      // breaking out of the dispatch switch statement.
      var ContinueSentinel = {}

      // Dummy constructor functions that we use as the .constructor and
      // .constructor.prototype properties for functions that return Generator
      // objects. For full spec compliance, you may wish to configure your
      // minifier not to mangle the names of these two functions.
      function Generator() {}
      function GeneratorFunction() {}
      function GeneratorFunctionPrototype() {}

      // This is a polyfill for %IteratorPrototype% for environments that
      // don't natively support it.
      var IteratorPrototype = {}
      IteratorPrototype[iteratorSymbol] = function() {
        return this
      }

      var getProto = Object.getPrototypeOf
      var NativeIteratorPrototype = getProto && getProto(getProto(values([])))
      if (
        NativeIteratorPrototype &&
        NativeIteratorPrototype !== Op &&
        hasOwn.call(NativeIteratorPrototype, iteratorSymbol)
      ) {
        // This environment has a native %IteratorPrototype%; use it instead
        // of the polyfill.
        IteratorPrototype = NativeIteratorPrototype
      }

      var Gp = (GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(
        IteratorPrototype
      ))
      GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype
      GeneratorFunctionPrototype.constructor = GeneratorFunction
      GeneratorFunctionPrototype[
        toStringTagSymbol
      ] = GeneratorFunction.displayName = 'GeneratorFunction'

      // Helper for defining the .next, .throw, and .return methods of the
      // Iterator interface in terms of a single ._invoke method.
      function defineIteratorMethods(prototype) {
        ;['next', 'throw', 'return'].forEach(function(method) {
          prototype[method] = function(arg) {
            return this._invoke(method, arg)
          }
        })
      }

      exports.isGeneratorFunction = function(genFun) {
        var ctor = typeof genFun === 'function' && genFun.constructor
        return ctor
          ? ctor === GeneratorFunction ||
              // For the native GeneratorFunction constructor, the best we can
              // do is to check its .name property.
              (ctor.displayName || ctor.name) === 'GeneratorFunction'
          : false
      }

      exports.mark = function(genFun) {
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(genFun, GeneratorFunctionPrototype)
        } else {
          genFun.__proto__ = GeneratorFunctionPrototype
          if (!(toStringTagSymbol in genFun)) {
            genFun[toStringTagSymbol] = 'GeneratorFunction'
          }
        }
        genFun.prototype = Object.create(Gp)
        return genFun
      }

      // Within the body of any async function, `await x` is transformed to
      // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
      // `hasOwn.call(value, "__await")` to determine if the yielded value is
      // meant to be awaited.
      exports.awrap = function(arg) {
        return { __await: arg }
      }

      function AsyncIterator(generator) {
        function invoke(method, arg, resolve, reject) {
          var record = tryCatch(generator[method], generator, arg)
          if (record.type === 'throw') {
            reject(record.arg)
          } else {
            var result = record.arg
            var value = result.value
            if (
              value &&
              typeof value === 'object' &&
              hasOwn.call(value, '__await')
            ) {
              return Promise.resolve(value.__await).then(
                function(value) {
                  invoke('next', value, resolve, reject)
                },
                function(err) {
                  invoke('throw', err, resolve, reject)
                }
              )
            }

            return Promise.resolve(value).then(
              function(unwrapped) {
                // When a yielded Promise is resolved, its final value becomes
                // the .value of the Promise<{value,done}> result for the
                // current iteration.
                result.value = unwrapped
                resolve(result)
              },
              function(error) {
                // If a rejected Promise was yielded, throw the rejection back
                // into the async generator function so it can be handled there.
                return invoke('throw', error, resolve, reject)
              }
            )
          }
        }

        var previousPromise

        function enqueue(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new Promise(function(resolve, reject) {
              invoke(method, arg, resolve, reject)
            })
          }

          return (previousPromise =
            // If enqueue has been called before, then we want to wait until
            // all previous Promises have been resolved before calling invoke,
            // so that results are always delivered in the correct order. If
            // enqueue has not been called before, then it is important to
            // call invoke immediately, without waiting on a callback to fire,
            // so that the async generator function has the opportunity to do
            // any necessary setup in a predictable way. This predictability
            // is why the Promise constructor synchronously invokes its
            // executor callback, and why async functions synchronously
            // execute code before the first await. Since we implement simple
            // async functions in terms of async generators, it is especially
            // important to get this right, even though it requires care.
            previousPromise
              ? previousPromise.then(
                  callInvokeWithMethodAndArg,
                  // Avoid propagating failures to Promises returned by later
                  // invocations of the iterator.
                  callInvokeWithMethodAndArg
                )
              : callInvokeWithMethodAndArg())
        }

        // Define the unified helper method that is used to implement .next,
        // .throw, and .return (see defineIteratorMethods).
        this._invoke = enqueue
      }

      defineIteratorMethods(AsyncIterator.prototype)
      AsyncIterator.prototype[asyncIteratorSymbol] = function() {
        return this
      }
      exports.AsyncIterator = AsyncIterator

      // Note that simple async functions are implemented on top of
      // AsyncIterator objects; they just return a Promise for the value of
      // the final result produced by the iterator.
      exports.async = function(innerFn, outerFn, self, tryLocsList) {
        var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList))

        return exports.isGeneratorFunction(outerFn)
          ? iter // If outerFn is a generator, return the full iterator.
          : iter.next().then(function(result) {
              return result.done ? result.value : iter.next()
            })
      }

      function makeInvokeMethod(innerFn, self, context) {
        var state = GenStateSuspendedStart

        return function invoke(method, arg) {
          if (state === GenStateExecuting) {
            throw new Error('Generator is already running')
          }

          if (state === GenStateCompleted) {
            if (method === 'throw') {
              throw arg
            }

            // Be forgiving, per 25.3.3.3.3 of the spec:
            // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
            return doneResult()
          }

          context.method = method
          context.arg = arg

          while (true) {
            var delegate = context.delegate
            if (delegate) {
              var delegateResult = maybeInvokeDelegate(delegate, context)
              if (delegateResult) {
                if (delegateResult === ContinueSentinel) continue
                return delegateResult
              }
            }

            if (context.method === 'next') {
              // Setting context._sent for legacy support of Babel's
              // function.sent implementation.
              context.sent = context._sent = context.arg
            } else if (context.method === 'throw') {
              if (state === GenStateSuspendedStart) {
                state = GenStateCompleted
                throw context.arg
              }

              context.dispatchException(context.arg)
            } else if (context.method === 'return') {
              context.abrupt('return', context.arg)
            }

            state = GenStateExecuting

            var record = tryCatch(innerFn, self, context)
            if (record.type === 'normal') {
              // If an exception is thrown from innerFn, we leave state ===
              // GenStateExecuting and loop back for another invocation.
              state = context.done ? GenStateCompleted : GenStateSuspendedYield

              if (record.arg === ContinueSentinel) {
                continue
              }

              return {
                value: record.arg,
                done: context.done,
              }
            } else if (record.type === 'throw') {
              state = GenStateCompleted
              // Dispatch the exception by looping back around to the
              // context.dispatchException(context.arg) call above.
              context.method = 'throw'
              context.arg = record.arg
            }
          }
        }
      }

      // Call delegate.iterator[context.method](context.arg) and handle the
      // result, either by returning a { value, done } result from the
      // delegate iterator, or by modifying context.method and context.arg,
      // setting context.delegate to null, and returning the ContinueSentinel.
      function maybeInvokeDelegate(delegate, context) {
        var method = delegate.iterator[context.method]
        if (method === undefined$1) {
          // A .throw or .return when the delegate iterator has no .throw
          // method always terminates the yield* loop.
          context.delegate = null

          if (context.method === 'throw') {
            // Note: ["return"] must be used for ES3 parsing compatibility.
            if (delegate.iterator['return']) {
              // If the delegate iterator has a return method, give it a
              // chance to clean up.
              context.method = 'return'
              context.arg = undefined$1
              maybeInvokeDelegate(delegate, context)

              if (context.method === 'throw') {
                // If maybeInvokeDelegate(context) changed context.method from
                // "return" to "throw", let that override the TypeError below.
                return ContinueSentinel
              }
            }

            context.method = 'throw'
            context.arg = new TypeError(
              "The iterator does not provide a 'throw' method"
            )
          }

          return ContinueSentinel
        }

        var record = tryCatch(method, delegate.iterator, context.arg)

        if (record.type === 'throw') {
          context.method = 'throw'
          context.arg = record.arg
          context.delegate = null
          return ContinueSentinel
        }

        var info = record.arg

        if (!info) {
          context.method = 'throw'
          context.arg = new TypeError('iterator result is not an object')
          context.delegate = null
          return ContinueSentinel
        }

        if (info.done) {
          // Assign the result of the finished delegate to the temporary
          // variable specified by delegate.resultName (see delegateYield).
          context[delegate.resultName] = info.value

          // Resume execution at the desired location (see delegateYield).
          context.next = delegate.nextLoc

          // If context.method was "throw" but the delegate handled the
          // exception, let the outer generator proceed normally. If
          // context.method was "next", forget context.arg since it has been
          // "consumed" by the delegate iterator. If context.method was
          // "return", allow the original .return call to continue in the
          // outer generator.
          if (context.method !== 'return') {
            context.method = 'next'
            context.arg = undefined$1
          }
        } else {
          // Re-yield the result returned by the delegate method.
          return info
        }

        // The delegate iterator is finished, so forget it and continue with
        // the outer generator.
        context.delegate = null
        return ContinueSentinel
      }

      // Define Generator.prototype.{next,throw,return} in terms of the
      // unified ._invoke helper method.
      defineIteratorMethods(Gp)

      Gp[toStringTagSymbol] = 'Generator'

      // A Generator should always return itself as the iterator object when the
      // @@iterator function is called on it. Some browsers' implementations of the
      // iterator prototype chain incorrectly implement this, causing the Generator
      // object to not be returned from this call. This ensures that doesn't happen.
      // See https://github.com/facebook/regenerator/issues/274 for more details.
      Gp[iteratorSymbol] = function() {
        return this
      }

      Gp.toString = function() {
        return '[object Generator]'
      }

      function pushTryEntry(locs) {
        var entry = { tryLoc: locs[0] }

        if (1 in locs) {
          entry.catchLoc = locs[1]
        }

        if (2 in locs) {
          entry.finallyLoc = locs[2]
          entry.afterLoc = locs[3]
        }

        this.tryEntries.push(entry)
      }

      function resetTryEntry(entry) {
        var record = entry.completion || {}
        record.type = 'normal'
        delete record.arg
        entry.completion = record
      }

      function Context(tryLocsList) {
        // The root entry object (effectively a try statement without a catch
        // or a finally block) gives us a place to store values thrown from
        // locations where there is no enclosing try statement.
        this.tryEntries = [{ tryLoc: 'root' }]
        tryLocsList.forEach(pushTryEntry, this)
        this.reset(true)
      }

      exports.keys = function(object) {
        var keys = []
        for (var key in object) {
          keys.push(key)
        }
        keys.reverse()

        // Rather than returning an object with a next method, we keep
        // things simple and return the next function itself.
        return function next() {
          while (keys.length) {
            var key = keys.pop()
            if (key in object) {
              next.value = key
              next.done = false
              return next
            }
          }

          // To avoid creating an additional object, we just hang the .value
          // and .done properties off the next function object itself. This
          // also ensures that the minifier will not anonymize the function.
          next.done = true
          return next
        }
      }

      function values(iterable) {
        if (iterable) {
          var iteratorMethod = iterable[iteratorSymbol]
          if (iteratorMethod) {
            return iteratorMethod.call(iterable)
          }

          if (typeof iterable.next === 'function') {
            return iterable
          }

          if (!isNaN(iterable.length)) {
            var i = -1,
              next = function next() {
                while (++i < iterable.length) {
                  if (hasOwn.call(iterable, i)) {
                    next.value = iterable[i]
                    next.done = false
                    return next
                  }
                }

                next.value = undefined$1
                next.done = true

                return next
              }

            return (next.next = next)
          }
        }

        // Return an iterator with no values.
        return { next: doneResult }
      }
      exports.values = values

      function doneResult() {
        return { value: undefined$1, done: true }
      }

      Context.prototype = {
        constructor: Context,

        reset: function(skipTempReset) {
          this.prev = 0
          this.next = 0
          // Resetting context._sent for legacy support of Babel's
          // function.sent implementation.
          this.sent = this._sent = undefined$1
          this.done = false
          this.delegate = null

          this.method = 'next'
          this.arg = undefined$1

          this.tryEntries.forEach(resetTryEntry)

          if (!skipTempReset) {
            for (var name in this) {
              // Not sure about the optimal order of these conditions:
              if (
                name.charAt(0) === 't' &&
                hasOwn.call(this, name) &&
                !isNaN(+name.slice(1))
              ) {
                this[name] = undefined$1
              }
            }
          }
        },

        stop: function() {
          this.done = true

          var rootEntry = this.tryEntries[0]
          var rootRecord = rootEntry.completion
          if (rootRecord.type === 'throw') {
            throw rootRecord.arg
          }

          return this.rval
        },

        dispatchException: function(exception) {
          if (this.done) {
            throw exception
          }

          var context = this
          function handle(loc, caught) {
            record.type = 'throw'
            record.arg = exception
            context.next = loc

            if (caught) {
              // If the dispatched exception was caught by a catch block,
              // then let that catch block handle the exception normally.
              context.method = 'next'
              context.arg = undefined$1
            }

            return !!caught
          }

          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i]
            var record = entry.completion

            if (entry.tryLoc === 'root') {
              // Exception thrown outside of any try block that could handle
              // it, so set the completion value of the entire function to
              // throw the exception.
              return handle('end')
            }

            if (entry.tryLoc <= this.prev) {
              var hasCatch = hasOwn.call(entry, 'catchLoc')
              var hasFinally = hasOwn.call(entry, 'finallyLoc')

              if (hasCatch && hasFinally) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true)
                } else if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc)
                }
              } else if (hasCatch) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true)
                }
              } else if (hasFinally) {
                if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc)
                }
              } else {
                throw new Error('try statement without catch or finally')
              }
            }
          }
        },

        abrupt: function(type, arg) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i]
            if (
              entry.tryLoc <= this.prev &&
              hasOwn.call(entry, 'finallyLoc') &&
              this.prev < entry.finallyLoc
            ) {
              var finallyEntry = entry
              break
            }
          }

          if (
            finallyEntry &&
            (type === 'break' || type === 'continue') &&
            finallyEntry.tryLoc <= arg &&
            arg <= finallyEntry.finallyLoc
          ) {
            // Ignore the finally entry if control is not jumping to a
            // location outside the try/catch block.
            finallyEntry = null
          }

          var record = finallyEntry ? finallyEntry.completion : {}
          record.type = type
          record.arg = arg

          if (finallyEntry) {
            this.method = 'next'
            this.next = finallyEntry.finallyLoc
            return ContinueSentinel
          }

          return this.complete(record)
        },

        complete: function(record, afterLoc) {
          if (record.type === 'throw') {
            throw record.arg
          }

          if (record.type === 'break' || record.type === 'continue') {
            this.next = record.arg
          } else if (record.type === 'return') {
            this.rval = this.arg = record.arg
            this.method = 'return'
            this.next = 'end'
          } else if (record.type === 'normal' && afterLoc) {
            this.next = afterLoc
          }

          return ContinueSentinel
        },

        finish: function(finallyLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i]
            if (entry.finallyLoc === finallyLoc) {
              this.complete(entry.completion, entry.afterLoc)
              resetTryEntry(entry)
              return ContinueSentinel
            }
          }
        },

        catch: function(tryLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i]
            if (entry.tryLoc === tryLoc) {
              var record = entry.completion
              if (record.type === 'throw') {
                var thrown = record.arg
                resetTryEntry(entry)
              }
              return thrown
            }
          }

          // The context.catch method must only be called with a location
          // argument that corresponds to a known catch block.
          throw new Error('illegal catch attempt')
        },

        delegateYield: function(iterable, resultName, nextLoc) {
          this.delegate = {
            iterator: values(iterable),
            resultName: resultName,
            nextLoc: nextLoc,
          }

          if (this.method === 'next') {
            // Deliberately forget the last sent value so that we don't
            // accidentally pass it on to the delegate.
            this.arg = undefined$1
          }

          return ContinueSentinel
        },
      }

      // Regardless of whether this script is executing as a CommonJS module
      // or not, return the runtime object so that we can declare the variable
      // regeneratorRuntime in the outer scope, which allows this module to be
      // injected easily by `bin/regenerator --include-runtime script.js`.
      return exports
    })(
      // If this script is executing as a CommonJS module, use module.exports
      // as the regeneratorRuntime namespace. Otherwise create a new empty
      // object. Either way, the resulting object will be used to initialize
      // the regeneratorRuntime variable at the top of this file.
      module.exports
    )

    try {
      regeneratorRuntime = runtime
    } catch (accidentalStrictMode) {
      // This module should not be running in strict mode, so the above
      // assignment should always work unless something is misconfigured. Just
      // in case runtime.js accidentally runs in strict mode, we can escape
      // strict mode using a global Function call. This could conceivably fail
      // if a Content Security Policy forbids using Function, but in that case
      // the proper solution is to fix the accidental strict mode problem. If
      // you've misconfigured your bundler to force strict mode and applied a
      // CSP to forbid Function, and you're not willing to fix either of those
      // problems, please detail your unique predicament in a GitHub issue.
      Function('r', 'regeneratorRuntime = r')(runtime)
    }
  })

  function NoopWrapper(props) {
    return props.children
  }

  function _extends() {
    _extends =
      Object.assign ||
      function(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i]

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key]
            }
          }
        }

        return target
      }

    return _extends.apply(this, arguments)
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {}
    var target = {}
    var sourceKeys = Object.keys(source)
    var key, i

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i]
      if (excluded.indexOf(key) >= 0) continue
      target[key] = source[key]
    }

    return target
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype)
    subClass.prototype.constructor = subClass
    subClass.__proto__ = superClass
  }

  var reactIs_production_min = createCommonjsModule(function(module, exports) {
    Object.defineProperty(exports, '__esModule', { value: !0 })
    var b = 'function' === typeof Symbol && Symbol.for,
      c = b ? Symbol.for('react.element') : 60103,
      d = b ? Symbol.for('react.portal') : 60106,
      e = b ? Symbol.for('react.fragment') : 60107,
      f = b ? Symbol.for('react.strict_mode') : 60108,
      g = b ? Symbol.for('react.profiler') : 60114,
      h = b ? Symbol.for('react.provider') : 60109,
      k = b ? Symbol.for('react.context') : 60110,
      l = b ? Symbol.for('react.async_mode') : 60111,
      m = b ? Symbol.for('react.concurrent_mode') : 60111,
      n = b ? Symbol.for('react.forward_ref') : 60112,
      p = b ? Symbol.for('react.suspense') : 60113,
      q = b ? Symbol.for('react.memo') : 60115,
      r = b ? Symbol.for('react.lazy') : 60116
    function t(a) {
      if ('object' === typeof a && null !== a) {
        var u = a.$$typeof
        switch (u) {
          case c:
            switch (((a = a.type), a)) {
              case l:
              case m:
              case e:
              case g:
              case f:
              case p:
                return a
              default:
                switch (((a = a && a.$$typeof), a)) {
                  case k:
                  case n:
                  case h:
                    return a
                  default:
                    return u
                }
            }
          case r:
          case q:
          case d:
            return u
        }
      }
    }
    function v(a) {
      return t(a) === m
    }
    exports.typeOf = t
    exports.AsyncMode = l
    exports.ConcurrentMode = m
    exports.ContextConsumer = k
    exports.ContextProvider = h
    exports.Element = c
    exports.ForwardRef = n
    exports.Fragment = e
    exports.Lazy = r
    exports.Memo = q
    exports.Portal = d
    exports.Profiler = g
    exports.StrictMode = f
    exports.Suspense = p
    exports.isValidElementType = function(a) {
      return (
        'string' === typeof a ||
        'function' === typeof a ||
        a === e ||
        a === m ||
        a === g ||
        a === f ||
        a === p ||
        ('object' === typeof a &&
          null !== a &&
          (a.$$typeof === r ||
            a.$$typeof === q ||
            a.$$typeof === h ||
            a.$$typeof === k ||
            a.$$typeof === n))
      )
    }
    exports.isAsyncMode = function(a) {
      return v(a) || t(a) === l
    }
    exports.isConcurrentMode = v
    exports.isContextConsumer = function(a) {
      return t(a) === k
    }
    exports.isContextProvider = function(a) {
      return t(a) === h
    }
    exports.isElement = function(a) {
      return 'object' === typeof a && null !== a && a.$$typeof === c
    }
    exports.isForwardRef = function(a) {
      return t(a) === n
    }
    exports.isFragment = function(a) {
      return t(a) === e
    }
    exports.isLazy = function(a) {
      return t(a) === r
    }
    exports.isMemo = function(a) {
      return t(a) === q
    }
    exports.isPortal = function(a) {
      return t(a) === d
    }
    exports.isProfiler = function(a) {
      return t(a) === g
    }
    exports.isStrictMode = function(a) {
      return t(a) === f
    }
    exports.isSuspense = function(a) {
      return t(a) === p
    }
  })

  unwrapExports(reactIs_production_min)
  var reactIs_production_min_1 = reactIs_production_min.typeOf
  var reactIs_production_min_2 = reactIs_production_min.AsyncMode
  var reactIs_production_min_3 = reactIs_production_min.ConcurrentMode
  var reactIs_production_min_4 = reactIs_production_min.ContextConsumer
  var reactIs_production_min_5 = reactIs_production_min.ContextProvider
  var reactIs_production_min_6 = reactIs_production_min.Element
  var reactIs_production_min_7 = reactIs_production_min.ForwardRef
  var reactIs_production_min_8 = reactIs_production_min.Fragment
  var reactIs_production_min_9 = reactIs_production_min.Lazy
  var reactIs_production_min_10 = reactIs_production_min.Memo
  var reactIs_production_min_11 = reactIs_production_min.Portal
  var reactIs_production_min_12 = reactIs_production_min.Profiler
  var reactIs_production_min_13 = reactIs_production_min.StrictMode
  var reactIs_production_min_14 = reactIs_production_min.Suspense
  var reactIs_production_min_15 = reactIs_production_min.isValidElementType
  var reactIs_production_min_16 = reactIs_production_min.isAsyncMode
  var reactIs_production_min_17 = reactIs_production_min.isConcurrentMode
  var reactIs_production_min_18 = reactIs_production_min.isContextConsumer
  var reactIs_production_min_19 = reactIs_production_min.isContextProvider
  var reactIs_production_min_20 = reactIs_production_min.isElement
  var reactIs_production_min_21 = reactIs_production_min.isForwardRef
  var reactIs_production_min_22 = reactIs_production_min.isFragment
  var reactIs_production_min_23 = reactIs_production_min.isLazy
  var reactIs_production_min_24 = reactIs_production_min.isMemo
  var reactIs_production_min_25 = reactIs_production_min.isPortal
  var reactIs_production_min_26 = reactIs_production_min.isProfiler
  var reactIs_production_min_27 = reactIs_production_min.isStrictMode
  var reactIs_production_min_28 = reactIs_production_min.isSuspense

  var reactIs_development = createCommonjsModule(function(module, exports) {
    {
      ;(function() {
        Object.defineProperty(exports, '__esModule', { value: true })

        // The Symbol used to tag the ReactElement-like types. If there is no native Symbol
        // nor polyfill, then a plain number is used for performance.
        var hasSymbol = typeof Symbol === 'function' && Symbol.for

        var REACT_ELEMENT_TYPE = hasSymbol
          ? Symbol.for('react.element')
          : 0xeac7
        var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca
        var REACT_FRAGMENT_TYPE = hasSymbol
          ? Symbol.for('react.fragment')
          : 0xeacb
        var REACT_STRICT_MODE_TYPE = hasSymbol
          ? Symbol.for('react.strict_mode')
          : 0xeacc
        var REACT_PROFILER_TYPE = hasSymbol
          ? Symbol.for('react.profiler')
          : 0xead2
        var REACT_PROVIDER_TYPE = hasSymbol
          ? Symbol.for('react.provider')
          : 0xeacd
        var REACT_CONTEXT_TYPE = hasSymbol
          ? Symbol.for('react.context')
          : 0xeace
        var REACT_ASYNC_MODE_TYPE = hasSymbol
          ? Symbol.for('react.async_mode')
          : 0xeacf
        var REACT_CONCURRENT_MODE_TYPE = hasSymbol
          ? Symbol.for('react.concurrent_mode')
          : 0xeacf
        var REACT_FORWARD_REF_TYPE = hasSymbol
          ? Symbol.for('react.forward_ref')
          : 0xead0
        var REACT_SUSPENSE_TYPE = hasSymbol
          ? Symbol.for('react.suspense')
          : 0xead1
        var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3
        var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4

        function isValidElementType(type) {
          return (
            typeof type === 'string' ||
            typeof type === 'function' ||
            // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
            type === REACT_FRAGMENT_TYPE ||
            type === REACT_CONCURRENT_MODE_TYPE ||
            type === REACT_PROFILER_TYPE ||
            type === REACT_STRICT_MODE_TYPE ||
            type === REACT_SUSPENSE_TYPE ||
            (typeof type === 'object' &&
              type !== null &&
              (type.$$typeof === REACT_LAZY_TYPE ||
                type.$$typeof === REACT_MEMO_TYPE ||
                type.$$typeof === REACT_PROVIDER_TYPE ||
                type.$$typeof === REACT_CONTEXT_TYPE ||
                type.$$typeof === REACT_FORWARD_REF_TYPE))
          )
        }

        /**
         * Forked from fbjs/warning:
         * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
         *
         * Only change is we use console.warn instead of console.error,
         * and do nothing when 'console' is not supported.
         * This really simplifies the code.
         * ---
         * Similar to invariant but only logs a warning if the condition is not met.
         * This can be used to log issues in development environments in critical
         * paths. Removing the logging code for production environments will keep the
         * same logic and follow the same code paths.
         */

        var lowPriorityWarning = function() {}

        {
          var printWarning = function(format) {
            for (
              var _len = arguments.length,
                args = Array(_len > 1 ? _len - 1 : 0),
                _key = 1;
              _key < _len;
              _key++
            ) {
              args[_key - 1] = arguments[_key]
            }

            var argIndex = 0
            var message =
              'Warning: ' +
              format.replace(/%s/g, function() {
                return args[argIndex++]
              })
            if (typeof console !== 'undefined') {
              console.warn(message)
            }
            try {
              // --- Welcome to debugging React ---
              // This error was thrown as a convenience so that you can use this stack
              // to find the callsite that caused this warning to fire.
              throw new Error(message)
            } catch (x) {}
          }

          lowPriorityWarning = function(condition, format) {
            if (format === undefined) {
              throw new Error(
                '`lowPriorityWarning(condition, format, ...args)` requires a warning ' +
                  'message argument'
              )
            }
            if (!condition) {
              for (
                var _len2 = arguments.length,
                  args = Array(_len2 > 2 ? _len2 - 2 : 0),
                  _key2 = 2;
                _key2 < _len2;
                _key2++
              ) {
                args[_key2 - 2] = arguments[_key2]
              }

              printWarning.apply(undefined, [format].concat(args))
            }
          }
        }

        var lowPriorityWarning$1 = lowPriorityWarning

        function typeOf(object) {
          if (typeof object === 'object' && object !== null) {
            var $$typeof = object.$$typeof
            switch ($$typeof) {
              case REACT_ELEMENT_TYPE:
                var type = object.type

                switch (type) {
                  case REACT_ASYNC_MODE_TYPE:
                  case REACT_CONCURRENT_MODE_TYPE:
                  case REACT_FRAGMENT_TYPE:
                  case REACT_PROFILER_TYPE:
                  case REACT_STRICT_MODE_TYPE:
                  case REACT_SUSPENSE_TYPE:
                    return type
                  default:
                    var $$typeofType = type && type.$$typeof

                    switch ($$typeofType) {
                      case REACT_CONTEXT_TYPE:
                      case REACT_FORWARD_REF_TYPE:
                      case REACT_PROVIDER_TYPE:
                        return $$typeofType
                      default:
                        return $$typeof
                    }
                }
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PORTAL_TYPE:
                return $$typeof
            }
          }

          return undefined
        }

        // AsyncMode is deprecated along with isAsyncMode
        var AsyncMode = REACT_ASYNC_MODE_TYPE
        var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE
        var ContextConsumer = REACT_CONTEXT_TYPE
        var ContextProvider = REACT_PROVIDER_TYPE
        var Element = REACT_ELEMENT_TYPE
        var ForwardRef = REACT_FORWARD_REF_TYPE
        var Fragment = REACT_FRAGMENT_TYPE
        var Lazy = REACT_LAZY_TYPE
        var Memo = REACT_MEMO_TYPE
        var Portal = REACT_PORTAL_TYPE
        var Profiler = REACT_PROFILER_TYPE
        var StrictMode = REACT_STRICT_MODE_TYPE
        var Suspense = REACT_SUSPENSE_TYPE

        var hasWarnedAboutDeprecatedIsAsyncMode = false

        // AsyncMode should be deprecated
        function isAsyncMode(object) {
          {
            if (!hasWarnedAboutDeprecatedIsAsyncMode) {
              hasWarnedAboutDeprecatedIsAsyncMode = true
              lowPriorityWarning$1(
                false,
                'The ReactIs.isAsyncMode() alias has been deprecated, ' +
                  'and will be removed in React 17+. Update your code to use ' +
                  'ReactIs.isConcurrentMode() instead. It has the exact same API.'
              )
            }
          }
          return (
            isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE
          )
        }
        function isConcurrentMode(object) {
          return typeOf(object) === REACT_CONCURRENT_MODE_TYPE
        }
        function isContextConsumer(object) {
          return typeOf(object) === REACT_CONTEXT_TYPE
        }
        function isContextProvider(object) {
          return typeOf(object) === REACT_PROVIDER_TYPE
        }
        function isElement(object) {
          return (
            typeof object === 'object' &&
            object !== null &&
            object.$$typeof === REACT_ELEMENT_TYPE
          )
        }
        function isForwardRef(object) {
          return typeOf(object) === REACT_FORWARD_REF_TYPE
        }
        function isFragment(object) {
          return typeOf(object) === REACT_FRAGMENT_TYPE
        }
        function isLazy(object) {
          return typeOf(object) === REACT_LAZY_TYPE
        }
        function isMemo(object) {
          return typeOf(object) === REACT_MEMO_TYPE
        }
        function isPortal(object) {
          return typeOf(object) === REACT_PORTAL_TYPE
        }
        function isProfiler(object) {
          return typeOf(object) === REACT_PROFILER_TYPE
        }
        function isStrictMode(object) {
          return typeOf(object) === REACT_STRICT_MODE_TYPE
        }
        function isSuspense(object) {
          return typeOf(object) === REACT_SUSPENSE_TYPE
        }

        exports.typeOf = typeOf
        exports.AsyncMode = AsyncMode
        exports.ConcurrentMode = ConcurrentMode
        exports.ContextConsumer = ContextConsumer
        exports.ContextProvider = ContextProvider
        exports.Element = Element
        exports.ForwardRef = ForwardRef
        exports.Fragment = Fragment
        exports.Lazy = Lazy
        exports.Memo = Memo
        exports.Portal = Portal
        exports.Profiler = Profiler
        exports.StrictMode = StrictMode
        exports.Suspense = Suspense
        exports.isValidElementType = isValidElementType
        exports.isAsyncMode = isAsyncMode
        exports.isConcurrentMode = isConcurrentMode
        exports.isContextConsumer = isContextConsumer
        exports.isContextProvider = isContextProvider
        exports.isElement = isElement
        exports.isForwardRef = isForwardRef
        exports.isFragment = isFragment
        exports.isLazy = isLazy
        exports.isMemo = isMemo
        exports.isPortal = isPortal
        exports.isProfiler = isProfiler
        exports.isStrictMode = isStrictMode
        exports.isSuspense = isSuspense
      })()
    }
  })

  unwrapExports(reactIs_development)
  var reactIs_development_1 = reactIs_development.typeOf
  var reactIs_development_2 = reactIs_development.AsyncMode
  var reactIs_development_3 = reactIs_development.ConcurrentMode
  var reactIs_development_4 = reactIs_development.ContextConsumer
  var reactIs_development_5 = reactIs_development.ContextProvider
  var reactIs_development_6 = reactIs_development.Element
  var reactIs_development_7 = reactIs_development.ForwardRef
  var reactIs_development_8 = reactIs_development.Fragment
  var reactIs_development_9 = reactIs_development.Lazy
  var reactIs_development_10 = reactIs_development.Memo
  var reactIs_development_11 = reactIs_development.Portal
  var reactIs_development_12 = reactIs_development.Profiler
  var reactIs_development_13 = reactIs_development.StrictMode
  var reactIs_development_14 = reactIs_development.Suspense
  var reactIs_development_15 = reactIs_development.isValidElementType
  var reactIs_development_16 = reactIs_development.isAsyncMode
  var reactIs_development_17 = reactIs_development.isConcurrentMode
  var reactIs_development_18 = reactIs_development.isContextConsumer
  var reactIs_development_19 = reactIs_development.isContextProvider
  var reactIs_development_20 = reactIs_development.isElement
  var reactIs_development_21 = reactIs_development.isForwardRef
  var reactIs_development_22 = reactIs_development.isFragment
  var reactIs_development_23 = reactIs_development.isLazy
  var reactIs_development_24 = reactIs_development.isMemo
  var reactIs_development_25 = reactIs_development.isPortal
  var reactIs_development_26 = reactIs_development.isProfiler
  var reactIs_development_27 = reactIs_development.isStrictMode
  var reactIs_development_28 = reactIs_development.isSuspense

  var reactIs = createCommonjsModule(function(module) {
    {
      module.exports = reactIs_development
    }
  })

  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED'

  var ReactPropTypesSecret_1 = ReactPropTypesSecret

  var printWarning = function() {}

  {
    var ReactPropTypesSecret$1 = ReactPropTypesSecret_1
    var loggedTypeFailures = {}
    var has$2 = Function.call.bind(Object.prototype.hasOwnProperty)

    printWarning = function(text) {
      var message = 'Warning: ' + text
      if (typeof console !== 'undefined') {
        console.error(message)
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message)
      } catch (x) {}
    }
  }

  /**
   * Assert that the values match with the type specs.
   * Error messages are memorized and will only be shown once.
   *
   * @param {object} typeSpecs Map of name to a ReactPropType
   * @param {object} values Runtime values that need to be type-checked
   * @param {string} location e.g. "prop", "context", "child context"
   * @param {string} componentName Name of the component for error messages.
   * @param {?Function} getStack Returns the component stack.
   * @private
   */
  function checkPropTypes(
    typeSpecs,
    values,
    location,
    componentName,
    getStack
  ) {
    {
      for (var typeSpecName in typeSpecs) {
        if (has$2(typeSpecs, typeSpecName)) {
          var error
          // Prop type validation may throw. In case they do, we don't want to
          // fail the render phase where it didn't fail before. So we log it.
          // After these have been cleaned up, we'll let them throw.
          try {
            // This is intentionally an invariant that gets caught. It's the same
            // behavior as without this statement except with a better message.
            if (typeof typeSpecs[typeSpecName] !== 'function') {
              var err = Error(
                (componentName || 'React class') +
                  ': ' +
                  location +
                  ' type `' +
                  typeSpecName +
                  '` is invalid; ' +
                  'it must be a function, usually from the `prop-types` package, but received `' +
                  typeof typeSpecs[typeSpecName] +
                  '`.'
              )
              err.name = 'Invariant Violation'
              throw err
            }
            error = typeSpecs[typeSpecName](
              values,
              typeSpecName,
              componentName,
              location,
              null,
              ReactPropTypesSecret$1
            )
          } catch (ex) {
            error = ex
          }
          if (error && !(error instanceof Error)) {
            printWarning(
              (componentName || 'React class') +
                ': type specification of ' +
                location +
                ' `' +
                typeSpecName +
                '` is invalid; the type checker ' +
                'function must return `null` or an `Error` but returned a ' +
                typeof error +
                '. ' +
                'You may have forgotten to pass an argument to the type checker ' +
                'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
                'shape all require an argument).'
            )
          }
          if (
            error instanceof Error &&
            !(error.message in loggedTypeFailures)
          ) {
            // Only monitor this failure once because there tends to be a lot of the
            // same error.
            loggedTypeFailures[error.message] = true

            var stack = getStack ? getStack() : ''

            printWarning(
              'Failed ' +
                location +
                ' type: ' +
                error.message +
                (stack != null ? stack : '')
            )
          }
        }
      }
    }
  }

  /**
   * Resets warning cache when testing.
   *
   * @private
   */
  checkPropTypes.resetWarningCache = function() {
    {
      loggedTypeFailures = {}
    }
  }

  var checkPropTypes_1 = checkPropTypes

  var has$3 = Function.call.bind(Object.prototype.hasOwnProperty)
  var printWarning$1 = function() {}

  {
    printWarning$1 = function(text) {
      var message = 'Warning: ' + text
      if (typeof console !== 'undefined') {
        console.error(message)
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message)
      } catch (x) {}
    }
  }

  function emptyFunctionThatReturnsNull() {
    return null
  }

  var factoryWithTypeCheckers = function(isValidElement, throwOnDirectAccess) {
    /* global Symbol */
    var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator
    var FAUX_ITERATOR_SYMBOL = '@@iterator' // Before Symbol spec.

    /**
     * Returns the iterator method function contained on the iterable object.
     *
     * Be sure to invoke the function with the iterable as context:
     *
     *     var iteratorFn = getIteratorFn(myIterable);
     *     if (iteratorFn) {
     *       var iterator = iteratorFn.call(myIterable);
     *       ...
     *     }
     *
     * @param {?object} maybeIterable
     * @return {?function}
     */
    function getIteratorFn(maybeIterable) {
      var iteratorFn =
        maybeIterable &&
        ((ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL]) ||
          maybeIterable[FAUX_ITERATOR_SYMBOL])
      if (typeof iteratorFn === 'function') {
        return iteratorFn
      }
    }

    /**
     * Collection of methods that allow declaration and validation of props that are
     * supplied to React components. Example usage:
     *
     *   var Props = require('ReactPropTypes');
     *   var MyArticle = React.createClass({
     *     propTypes: {
     *       // An optional string prop named "description".
     *       description: Props.string,
     *
     *       // A required enum prop named "category".
     *       category: Props.oneOf(['News','Photos']).isRequired,
     *
     *       // A prop named "dialog" that requires an instance of Dialog.
     *       dialog: Props.instanceOf(Dialog).isRequired
     *     },
     *     render: function() { ... }
     *   });
     *
     * A more formal specification of how these methods are used:
     *
     *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
     *   decl := ReactPropTypes.{type}(.isRequired)?
     *
     * Each and every declaration produces a function with the same signature. This
     * allows the creation of custom validation functions. For example:
     *
     *  var MyLink = React.createClass({
     *    propTypes: {
     *      // An optional string or URI prop named "href".
     *      href: function(props, propName, componentName) {
     *        var propValue = props[propName];
     *        if (propValue != null && typeof propValue !== 'string' &&
     *            !(propValue instanceof URI)) {
     *          return new Error(
     *            'Expected a string or an URI for ' + propName + ' in ' +
     *            componentName
     *          );
     *        }
     *      }
     *    },
     *    render: function() {...}
     *  });
     *
     * @internal
     */

    var ANONYMOUS = '<<anonymous>>'

    // Important!
    // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
    var ReactPropTypes = {
      array: createPrimitiveTypeChecker('array'),
      bool: createPrimitiveTypeChecker('boolean'),
      func: createPrimitiveTypeChecker('function'),
      number: createPrimitiveTypeChecker('number'),
      object: createPrimitiveTypeChecker('object'),
      string: createPrimitiveTypeChecker('string'),
      symbol: createPrimitiveTypeChecker('symbol'),

      any: createAnyTypeChecker(),
      arrayOf: createArrayOfTypeChecker,
      element: createElementTypeChecker(),
      elementType: createElementTypeTypeChecker(),
      instanceOf: createInstanceTypeChecker,
      node: createNodeChecker(),
      objectOf: createObjectOfTypeChecker,
      oneOf: createEnumTypeChecker,
      oneOfType: createUnionTypeChecker,
      shape: createShapeTypeChecker,
      exact: createStrictShapeTypeChecker,
    }

    /**
     * inlined Object.is polyfill to avoid requiring consumers ship their own
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
     */
    /*eslint-disable no-self-compare*/
    function is(x, y) {
      // SameValue algorithm
      if (x === y) {
        // Steps 1-5, 7-10
        // Steps 6.b-6.e: +0 != -0
        return x !== 0 || 1 / x === 1 / y
      } else {
        // Step 6.a: NaN == NaN
        return x !== x && y !== y
      }
    }
    /*eslint-enable no-self-compare*/

    /**
     * We use an Error-like object for backward compatibility as people may call
     * PropTypes directly and inspect their output. However, we don't use real
     * Errors anymore. We don't inspect their stack anyway, and creating them
     * is prohibitively expensive if they are created too often, such as what
     * happens in oneOfType() for any type before the one that matched.
     */
    function PropTypeError(message) {
      this.message = message
      this.stack = ''
    }
    // Make `instanceof Error` still work for returned errors.
    PropTypeError.prototype = Error.prototype

    function createChainableTypeChecker(validate) {
      {
        var manualPropTypeCallCache = {}
        var manualPropTypeWarningCount = 0
      }
      function checkType(
        isRequired,
        props,
        propName,
        componentName,
        location,
        propFullName,
        secret
      ) {
        componentName = componentName || ANONYMOUS
        propFullName = propFullName || propName

        if (secret !== ReactPropTypesSecret_1) {
          if (throwOnDirectAccess) {
            // New behavior only for users of `prop-types` package
            var err = new Error(
              'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
                'Use `PropTypes.checkPropTypes()` to call them. ' +
                'Read more at http://fb.me/use-check-prop-types'
            )
            err.name = 'Invariant Violation'
            throw err
          } else if (typeof console !== 'undefined') {
            // Old behavior for people using React.PropTypes
            var cacheKey = componentName + ':' + propName
            if (
              !manualPropTypeCallCache[cacheKey] &&
              // Avoid spamming the console because they are often not actionable except for lib authors
              manualPropTypeWarningCount < 3
            ) {
              printWarning$1(
                'You are manually calling a React.PropTypes validation ' +
                  'function for the `' +
                  propFullName +
                  '` prop on `' +
                  componentName +
                  '`. This is deprecated ' +
                  'and will throw in the standalone `prop-types` package. ' +
                  'You may be seeing this warning due to a third-party PropTypes ' +
                  'library. See https://fb.me/react-warning-dont-call-proptypes ' +
                  'for details.'
              )
              manualPropTypeCallCache[cacheKey] = true
              manualPropTypeWarningCount++
            }
          }
        }
        if (props[propName] == null) {
          if (isRequired) {
            if (props[propName] === null) {
              return new PropTypeError(
                'The ' +
                  location +
                  ' `' +
                  propFullName +
                  '` is marked as required ' +
                  ('in `' + componentName + '`, but its value is `null`.')
              )
            }
            return new PropTypeError(
              'The ' +
                location +
                ' `' +
                propFullName +
                '` is marked as required in ' +
                ('`' + componentName + '`, but its value is `undefined`.')
            )
          }
          return null
        } else {
          return validate(
            props,
            propName,
            componentName,
            location,
            propFullName
          )
        }
      }

      var chainedCheckType = checkType.bind(null, false)
      chainedCheckType.isRequired = checkType.bind(null, true)

      return chainedCheckType
    }

    function createPrimitiveTypeChecker(expectedType) {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName,
        secret
      ) {
        var propValue = props[propName]
        var propType = getPropType(propValue)
        if (propType !== expectedType) {
          // `propValue` being instance of, say, date/regexp, pass the 'object'
          // check, but we can offer a more precise error message here rather than
          // 'of type `object`'.
          var preciseType = getPreciseType(propValue)

          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type ' +
              ('`' +
                preciseType +
                '` supplied to `' +
                componentName +
                '`, expected ') +
              ('`' + expectedType + '`.')
          )
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createAnyTypeChecker() {
      return createChainableTypeChecker(emptyFunctionThatReturnsNull)
    }

    function createArrayOfTypeChecker(typeChecker) {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        if (typeof typeChecker !== 'function') {
          return new PropTypeError(
            'Property `' +
              propFullName +
              '` of component `' +
              componentName +
              '` has invalid PropType notation inside arrayOf.'
          )
        }
        var propValue = props[propName]
        if (!Array.isArray(propValue)) {
          var propType = getPropType(propValue)
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type ' +
              ('`' +
                propType +
                '` supplied to `' +
                componentName +
                '`, expected an array.')
          )
        }
        for (var i = 0; i < propValue.length; i++) {
          var error = typeChecker(
            propValue,
            i,
            componentName,
            location,
            propFullName + '[' + i + ']',
            ReactPropTypesSecret_1
          )
          if (error instanceof Error) {
            return error
          }
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createElementTypeChecker() {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        var propValue = props[propName]
        if (!isValidElement(propValue)) {
          var propType = getPropType(propValue)
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type ' +
              ('`' +
                propType +
                '` supplied to `' +
                componentName +
                '`, expected a single ReactElement.')
          )
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createElementTypeTypeChecker() {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        var propValue = props[propName]
        if (!reactIs.isValidElementType(propValue)) {
          var propType = getPropType(propValue)
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type ' +
              ('`' +
                propType +
                '` supplied to `' +
                componentName +
                '`, expected a single ReactElement type.')
          )
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createInstanceTypeChecker(expectedClass) {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        if (!(props[propName] instanceof expectedClass)) {
          var expectedClassName = expectedClass.name || ANONYMOUS
          var actualClassName = getClassName(props[propName])
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type ' +
              ('`' +
                actualClassName +
                '` supplied to `' +
                componentName +
                '`, expected ') +
              ('instance of `' + expectedClassName + '`.')
          )
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createEnumTypeChecker(expectedValues) {
      if (!Array.isArray(expectedValues)) {
        {
          if (arguments.length > 1) {
            printWarning$1(
              'Invalid arguments supplied to oneOf, expected an array, got ' +
                arguments.length +
                ' arguments. ' +
                'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).'
            )
          } else {
            printWarning$1(
              'Invalid argument supplied to oneOf, expected an array.'
            )
          }
        }
        return emptyFunctionThatReturnsNull
      }

      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        var propValue = props[propName]
        for (var i = 0; i < expectedValues.length; i++) {
          if (is(propValue, expectedValues[i])) {
            return null
          }
        }

        var valuesString = JSON.stringify(expectedValues, function replacer(
          key,
          value
        ) {
          var type = getPreciseType(value)
          if (type === 'symbol') {
            return String(value)
          }
          return value
        })
        return new PropTypeError(
          'Invalid ' +
            location +
            ' `' +
            propFullName +
            '` of value `' +
            String(propValue) +
            '` ' +
            ('supplied to `' +
              componentName +
              '`, expected one of ' +
              valuesString +
              '.')
        )
      }
      return createChainableTypeChecker(validate)
    }

    function createObjectOfTypeChecker(typeChecker) {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        if (typeof typeChecker !== 'function') {
          return new PropTypeError(
            'Property `' +
              propFullName +
              '` of component `' +
              componentName +
              '` has invalid PropType notation inside objectOf.'
          )
        }
        var propValue = props[propName]
        var propType = getPropType(propValue)
        if (propType !== 'object') {
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type ' +
              ('`' +
                propType +
                '` supplied to `' +
                componentName +
                '`, expected an object.')
          )
        }
        for (var key in propValue) {
          if (has$3(propValue, key)) {
            var error = typeChecker(
              propValue,
              key,
              componentName,
              location,
              propFullName + '.' + key,
              ReactPropTypesSecret_1
            )
            if (error instanceof Error) {
              return error
            }
          }
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createUnionTypeChecker(arrayOfTypeCheckers) {
      if (!Array.isArray(arrayOfTypeCheckers)) {
        printWarning$1(
          'Invalid argument supplied to oneOfType, expected an instance of array.'
        )
        return emptyFunctionThatReturnsNull
      }

      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i]
        if (typeof checker !== 'function') {
          printWarning$1(
            'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
              'received ' +
              getPostfixForTypeWarning(checker) +
              ' at index ' +
              i +
              '.'
          )
          return emptyFunctionThatReturnsNull
        }
      }

      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
          var checker = arrayOfTypeCheckers[i]
          if (
            checker(
              props,
              propName,
              componentName,
              location,
              propFullName,
              ReactPropTypesSecret_1
            ) == null
          ) {
            return null
          }
        }

        return new PropTypeError(
          'Invalid ' +
            location +
            ' `' +
            propFullName +
            '` supplied to ' +
            ('`' + componentName + '`.')
        )
      }
      return createChainableTypeChecker(validate)
    }

    function createNodeChecker() {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        if (!isNode(props[propName])) {
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` supplied to ' +
              ('`' + componentName + '`, expected a ReactNode.')
          )
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createShapeTypeChecker(shapeTypes) {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        var propValue = props[propName]
        var propType = getPropType(propValue)
        if (propType !== 'object') {
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type `' +
              propType +
              '` ' +
              ('supplied to `' + componentName + '`, expected `object`.')
          )
        }
        for (var key in shapeTypes) {
          var checker = shapeTypes[key]
          if (!checker) {
            continue
          }
          var error = checker(
            propValue,
            key,
            componentName,
            location,
            propFullName + '.' + key,
            ReactPropTypesSecret_1
          )
          if (error) {
            return error
          }
        }
        return null
      }
      return createChainableTypeChecker(validate)
    }

    function createStrictShapeTypeChecker(shapeTypes) {
      function validate(
        props,
        propName,
        componentName,
        location,
        propFullName
      ) {
        var propValue = props[propName]
        var propType = getPropType(propValue)
        if (propType !== 'object') {
          return new PropTypeError(
            'Invalid ' +
              location +
              ' `' +
              propFullName +
              '` of type `' +
              propType +
              '` ' +
              ('supplied to `' + componentName + '`, expected `object`.')
          )
        }
        // We need to check all keys in case some are required but missing from
        // props.
        var allKeys = objectAssign({}, props[propName], shapeTypes)
        for (var key in allKeys) {
          var checker = shapeTypes[key]
          if (!checker) {
            return new PropTypeError(
              'Invalid ' +
                location +
                ' `' +
                propFullName +
                '` key `' +
                key +
                '` supplied to `' +
                componentName +
                '`.' +
                '\nBad object: ' +
                JSON.stringify(props[propName], null, '  ') +
                '\nValid keys: ' +
                JSON.stringify(Object.keys(shapeTypes), null, '  ')
            )
          }
          var error = checker(
            propValue,
            key,
            componentName,
            location,
            propFullName + '.' + key,
            ReactPropTypesSecret_1
          )
          if (error) {
            return error
          }
        }
        return null
      }

      return createChainableTypeChecker(validate)
    }

    function isNode(propValue) {
      switch (typeof propValue) {
        case 'number':
        case 'string':
        case 'undefined':
          return true
        case 'boolean':
          return !propValue
        case 'object':
          if (Array.isArray(propValue)) {
            return propValue.every(isNode)
          }
          if (propValue === null || isValidElement(propValue)) {
            return true
          }

          var iteratorFn = getIteratorFn(propValue)
          if (iteratorFn) {
            var iterator = iteratorFn.call(propValue)
            var step
            if (iteratorFn !== propValue.entries) {
              while (!(step = iterator.next()).done) {
                if (!isNode(step.value)) {
                  return false
                }
              }
            } else {
              // Iterator will provide entry [k,v] tuples rather than values.
              while (!(step = iterator.next()).done) {
                var entry = step.value
                if (entry) {
                  if (!isNode(entry[1])) {
                    return false
                  }
                }
              }
            }
          } else {
            return false
          }

          return true
        default:
          return false
      }
    }

    function isSymbol(propType, propValue) {
      // Native Symbol.
      if (propType === 'symbol') {
        return true
      }

      // falsy value can't be a Symbol
      if (!propValue) {
        return false
      }

      // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
      if (propValue['@@toStringTag'] === 'Symbol') {
        return true
      }

      // Fallback for non-spec compliant Symbols which are polyfilled.
      if (typeof Symbol === 'function' && propValue instanceof Symbol) {
        return true
      }

      return false
    }

    // Equivalent of `typeof` but with special handling for array and regexp.
    function getPropType(propValue) {
      var propType = typeof propValue
      if (Array.isArray(propValue)) {
        return 'array'
      }
      if (propValue instanceof RegExp) {
        // Old webkits (at least until Android 4.0) return 'function' rather than
        // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
        // passes PropTypes.object.
        return 'object'
      }
      if (isSymbol(propType, propValue)) {
        return 'symbol'
      }
      return propType
    }

    // This handles more types than `getPropType`. Only used for error messages.
    // See `createPrimitiveTypeChecker`.
    function getPreciseType(propValue) {
      if (typeof propValue === 'undefined' || propValue === null) {
        return '' + propValue
      }
      var propType = getPropType(propValue)
      if (propType === 'object') {
        if (propValue instanceof Date) {
          return 'date'
        } else if (propValue instanceof RegExp) {
          return 'regexp'
        }
      }
      return propType
    }

    // Returns a string that is postfixed to a warning about an invalid type.
    // For example, "undefined" or "of type array"
    function getPostfixForTypeWarning(value) {
      var type = getPreciseType(value)
      switch (type) {
        case 'array':
        case 'object':
          return 'an ' + type
        case 'boolean':
        case 'date':
        case 'regexp':
          return 'a ' + type
        default:
          return type
      }
    }

    // Returns class name of the object, if any.
    function getClassName(propValue) {
      if (!propValue.constructor || !propValue.constructor.name) {
        return ANONYMOUS
      }
      return propValue.constructor.name
    }

    ReactPropTypes.checkPropTypes = checkPropTypes_1
    ReactPropTypes.resetWarningCache = checkPropTypes_1.resetWarningCache
    ReactPropTypes.PropTypes = ReactPropTypes

    return ReactPropTypes
  }

  var propTypes = createCommonjsModule(function(module) {
    /**
     * Copyright (c) 2013-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */

    {
      var ReactIs = reactIs

      // By explicitly using `prop-types` you are opting into new development behavior.
      // http://fb.me/prop-types-in-prod
      var throwOnDirectAccess = true
      module.exports = factoryWithTypeCheckers(
        ReactIs.isElement,
        throwOnDirectAccess
      )
    }
  })

  function _extends$1() {
    _extends$1 =
      Object.assign ||
      function(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i]

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key]
            }
          }
        }

        return target
      }

    return _extends$1.apply(this, arguments)
  }

  function _objectWithoutPropertiesLoose$1(source, excluded) {
    if (source == null) return {}
    var target = {}
    var sourceKeys = Object.keys(source)
    var key, i

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i]
      if (excluded.indexOf(key) >= 0) continue
      target[key] = source[key]
    }

    return target
  }

  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var invariant = function(condition, format, a, b, c, d, e, f) {
    {
      if (format === undefined) {
        throw new Error('invariant requires an error message argument')
      }
    }

    if (!condition) {
      var error
      if (format === undefined) {
        error = new Error(
          'Minified exception occurred; use the non-minified dev environment ' +
            'for the full error message and additional helpful warnings.'
        )
      } else {
        var args = [a, b, c, d, e, f]
        var argIndex = 0
        error = new Error(
          format.replace(/%s/g, function() {
            return args[argIndex++]
          })
        )
        error.name = 'Invariant Violation'
      }

      error.framesToPop = 1 // we don't care about invariant's own frame
      throw error
    }
  }

  var invariant_1 = invariant

  var noop$1 = function noop() {}

  function readOnlyPropType(handler, name) {
    return function(props, propName) {
      if (props[propName] !== undefined) {
        if (!props[handler]) {
          return new Error(
            'You have provided a `' +
              propName +
              '` prop to `' +
              name +
              '` ' +
              ('without an `' +
                handler +
                '` handler prop. This will render a read-only field. ') +
              ('If the field should be mutable use `' +
                defaultKey(propName) +
                '`. ') +
              ('Otherwise, set `' + handler + '`.')
          )
        }
      }
    }
  }

  function uncontrolledPropTypes(controlledValues, displayName) {
    var propTypes = {}
    Object.keys(controlledValues).forEach(function(prop) {
      // add default propTypes for folks that use runtime checks
      propTypes[defaultKey(prop)] = noop$1

      {
        var handler = controlledValues[prop]
        !(typeof handler === 'string' && handler.trim().length)
          ? invariant_1(
              false,
              'Uncontrollable - [%s]: the prop `%s` needs a valid handler key name in order to make it uncontrollable',
              displayName,
              prop
            )
          : void 0
        propTypes[prop] = readOnlyPropType(handler, displayName)
      }
    })
    return propTypes
  }
  function isProp(props, prop) {
    return props[prop] !== undefined
  }
  function defaultKey(key) {
    return 'default' + key.charAt(0).toUpperCase() + key.substr(1)
  }
  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree. An additional grant
   * of patent rights can be found in the PATENTS file in the same directory.
   */

  function canAcceptRef(component) {
    return (
      !!component &&
      (typeof component !== 'function' ||
        (component.prototype && component.prototype.isReactComponent))
    )
  }

  function _inheritsLoose$1(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype)
    subClass.prototype.constructor = subClass
    subClass.__proto__ = superClass
  }

  function uncontrollable(Component, controlledValues, methods) {
    if (methods === void 0) {
      methods = []
    }

    var displayName = Component.displayName || Component.name || 'Component'
    var canAcceptRef$1 = canAcceptRef(Component)
    var controlledProps = Object.keys(controlledValues)
    var PROPS_TO_OMIT = controlledProps.map(defaultKey)
    !(canAcceptRef$1 || !methods.length)
      ? invariant_1(
          false,
          '[uncontrollable] stateless function components cannot pass through methods ' +
            'because they have no associated instances. Check component: ' +
            displayName +
            ', ' +
            'attempting to pass through methods: ' +
            methods.join(', ')
        )
      : void 0

    var UncontrolledComponent =
      /*#__PURE__*/
      (function(_React$Component) {
        _inheritsLoose$1(UncontrolledComponent, _React$Component)

        function UncontrolledComponent() {
          var _this

          for (
            var _len = arguments.length, args = new Array(_len), _key = 0;
            _key < _len;
            _key++
          ) {
            args[_key] = arguments[_key]
          }

          _this =
            _React$Component.call.apply(
              _React$Component,
              [this].concat(args)
            ) || this
          _this.handlers = Object.create(null)
          controlledProps.forEach(function(propName) {
            var handlerName = controlledValues[propName]

            var handleChange = function handleChange(value) {
              if (_this.props[handlerName]) {
                var _this$props

                _this._notifying = true

                for (
                  var _len2 = arguments.length,
                    args = new Array(_len2 > 1 ? _len2 - 1 : 0),
                    _key2 = 1;
                  _key2 < _len2;
                  _key2++
                ) {
                  args[_key2 - 1] = arguments[_key2]
                }

                ;(_this$props = _this.props)[handlerName].apply(
                  _this$props,
                  [value].concat(args)
                )

                _this._notifying = false
              }

              _this._values[propName] = value
              if (!_this.unmounted) _this.forceUpdate()
            }

            _this.handlers[handlerName] = handleChange
          })
          if (methods.length)
            _this.attachRef = function(ref) {
              _this.inner = ref
            }
          return _this
        }

        var _proto = UncontrolledComponent.prototype

        _proto.shouldComponentUpdate = function shouldComponentUpdate() {
          //let the forceUpdate trigger the update
          return !this._notifying
        }

        _proto.componentWillMount = function componentWillMount() {
          var _this2 = this

          var props = this.props
          this._values = Object.create(null)
          controlledProps.forEach(function(key) {
            _this2._values[key] = props[defaultKey(key)]
          })
        }

        _proto.componentWillReceiveProps = function componentWillReceiveProps(
          nextProps
        ) {
          var _this3 = this

          var props = this.props
          controlledProps.forEach(function(key) {
            /**
             * If a prop switches from controlled to Uncontrolled
             * reset its value to the defaultValue
             */
            if (!isProp(nextProps, key) && isProp(props, key)) {
              _this3._values[key] = nextProps[defaultKey(key)]
            }
          })
        }

        _proto.componentWillUnmount = function componentWillUnmount() {
          this.unmounted = true
        }

        _proto.render = function render() {
          var _this4 = this

          var _this$props2 = this.props,
            innerRef = _this$props2.innerRef,
            props = _objectWithoutPropertiesLoose$1(_this$props2, ['innerRef'])

          PROPS_TO_OMIT.forEach(function(prop) {
            delete props[prop]
          })
          var newProps = {}
          controlledProps.forEach(function(propName) {
            var propValue = _this4.props[propName]
            newProps[propName] =
              propValue !== undefined ? propValue : _this4._values[propName]
          })
          return React__default.createElement(
            Component,
            _extends$1({}, props, newProps, this.handlers, {
              ref: innerRef || this.attachRef,
            })
          )
        }

        return UncontrolledComponent
      })(React__default.Component)

    UncontrolledComponent.displayName = 'Uncontrolled(' + displayName + ')'
    UncontrolledComponent.propTypes = _extends$1(
      {
        innerRef: function innerRef() {},
      },
      uncontrolledPropTypes(controlledValues, displayName)
    )
    methods.forEach(function(method) {
      UncontrolledComponent.prototype[method] = function $proxiedMethod() {
        var _this$inner

        return (_this$inner = this.inner)[method].apply(_this$inner, arguments)
      }
    })
    var WrappedComponent = UncontrolledComponent

    if (React__default.forwardRef) {
      WrappedComponent = React__default.forwardRef(function(props, ref) {
        return React__default.createElement(
          UncontrolledComponent,
          _extends$1({}, props, {
            innerRef: ref,
          })
        )
      })
      WrappedComponent.propTypes = UncontrolledComponent.propTypes
    }

    WrappedComponent.ControlledComponent = Component
    /**
     * useful when wrapping a Component and you want to control
     * everything
     */

    WrappedComponent.deferControlTo = function(
      newComponent,
      additions,
      nextMethods
    ) {
      if (additions === void 0) {
        additions = {}
      }

      return uncontrollable(
        newComponent,
        _extends$1({}, controlledValues, additions),
        nextMethods
      )
    }

    return WrappedComponent
  }

  function toVal(mix) {
    var k,
      y,
      str = ''
    if (mix) {
      if (typeof mix === 'object') {
        if (!!mix.push) {
          for (k = 0; k < mix.length; k++) {
            if (mix[k] && (y = toVal(mix[k]))) {
              str && (str += ' ')
              str += y
            }
          }
        } else {
          for (k in mix) {
            if (mix[k] && (y = toVal(k))) {
              str && (str += ' ')
              str += y
            }
          }
        }
      } else if (typeof mix !== 'boolean' && !mix.call) {
        str && (str += ' ')
        str += mix
      }
    }
    return str
  }

  function clsx() {
    var i = 0,
      x,
      str = ''
    while (i < arguments.length) {
      if ((x = toVal(arguments[i++]))) {
        str && (str += ' ')
        str += x
      }
    }
    return str
  }

  var navigate = {
    PREVIOUS: 'PREV',
    NEXT: 'NEXT',
    TODAY: 'TODAY',
    DATE: 'DATE',
  }
  var views = {
    MONTH: 'month',
    WEEK: 'week',
    WORK_WEEK: 'work_week',
    DAY: 'day',
    AGENDA: 'agenda',
  }

  var viewNames = Object.keys(views).map(function(k) {
    return views[k]
  })
  var accessor = propTypes.oneOfType([propTypes.string, propTypes.func])
  var dateFormat = propTypes.any
  var dateRangeFormat = propTypes.func
  /**
   * accepts either an array of builtin view names:
   *
   * ```
   * views={['month', 'day', 'agenda']}
   * ```
   *
   * or an object hash of the view name and the component (or boolean for builtin)
   *
   * ```
   * views={{
   *   month: true,
   *   week: false,
   *   workweek: WorkWeekViewComponent,
   * }}
   * ```
   */

  var views$1 = propTypes.oneOfType([
    propTypes.arrayOf(propTypes.oneOf(viewNames)),
    propTypes.objectOf(function(prop, key) {
      var isBuiltinView =
        viewNames.indexOf(key) !== -1 && typeof prop[key] === 'boolean'

      if (isBuiltinView) {
        return null
      } else {
        for (
          var _len = arguments.length,
            args = new Array(_len > 2 ? _len - 2 : 0),
            _key = 2;
          _key < _len;
          _key++
        ) {
          args[_key - 2] = arguments[_key]
        }

        return propTypes.elementType.apply(propTypes, [prop, key].concat(args))
      }
    }),
  ])
  var DayLayoutAlgorithmPropType = propTypes.oneOfType([
    propTypes.oneOf(['overlap', 'no-overlap']),
    propTypes.func,
  ])

  function notify$2(handler, args) {
    handler && handler.apply(null, [].concat(args))
  }

  var localePropType = propTypes.oneOfType([propTypes.string, propTypes.func])

  function _format(localizer, formatter, value, format, culture) {
    var result =
      typeof format === 'function'
        ? format(value, culture, localizer)
        : formatter.call(localizer, value, format, culture)
    !(result == null || typeof result === 'string')
      ? invariant_1(
          false,
          '`localizer format(..)` must return a string, null, or undefined'
        )
      : void 0
    return result
  }

  var DateLocalizer = function DateLocalizer(spec) {
    var _this = this

    !(typeof spec.format === 'function')
      ? invariant_1(false, 'date localizer `format(..)` must be a function')
      : void 0
    !(typeof spec.firstOfWeek === 'function')
      ? invariant_1(
          false,
          'date localizer `firstOfWeek(..)` must be a function'
        )
      : void 0
    this.propType = spec.propType || localePropType
    this.startOfWeek = spec.firstOfWeek
    this.formats = spec.formats

    this.format = function() {
      for (
        var _len = arguments.length, args = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        args[_key] = arguments[_key]
      }

      return _format.apply(void 0, [_this, spec.format].concat(args))
    }
  }
  function mergeWithDefaults(localizer, culture, formatOverrides, messages) {
    var formats = _extends({}, localizer.formats, formatOverrides)

    return _extends({}, localizer, {
      messages: messages,
      startOfWeek: function startOfWeek() {
        return localizer.startOfWeek(culture)
      },
      format: function format(value, _format2) {
        return localizer.format(value, formats[_format2] || _format2, culture)
      },
    })
  }

  var defaultMessages = {
    date: 'Date',
    time: 'Time',
    event: 'Event',
    allDay: 'All Day',
    week: 'Week',
    work_week: 'Work Week',
    day: 'Day',
    month: 'Month',
    previous: 'Back',
    next: 'Next',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    today: 'Today',
    agenda: 'Agenda',
    noEventsInRange: 'There are no events in this range.',
    showMore: function showMore(total) {
      return '+' + total + ' more'
    },
  }
  function messages(msgs) {
    return _extends({}, defaultMessages, msgs)
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError(
        "this hasn't been initialised - super() hasn't been called"
      )
    }

    return self
  }

  var MILI = 'milliseconds',
    SECONDS = 'seconds',
    MINUTES = 'minutes',
    HOURS = 'hours',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
    DECADE = 'decade',
    CENTURY = 'century'

  function add(d, num, unit) {
    d = new Date(d)

    switch (unit) {
      case MILI:
        return milliseconds(d, milliseconds(d) + num)
      case SECONDS:
        return seconds(d, seconds(d) + num)
      case MINUTES:
        return minutes(d, minutes(d) + num)
      case HOURS:
        return hours(d, hours(d) + num)
      case YEAR:
        return year(d, year(d) + num)
      case DAY:
        return date(d, date(d) + num)
      case WEEK:
        return date(d, date(d) + 7 * num)
      case MONTH:
        return monthMath(d, num)
      case DECADE:
        return year(d, year(d) + num * 10)
      case CENTURY:
        return year(d, year(d) + num * 100)
    }

    throw new TypeError('Invalid units: "' + unit + '"')
  }

  function subtract(d, num, unit) {
    return add(d, -num, unit)
  }

  function startOf(d, unit, firstOfWeek) {
    d = new Date(d)

    switch (unit) {
      case CENTURY:
      case DECADE:
      case YEAR:
        d = month(d, 0)
      case MONTH:
        d = date(d, 1)
      case WEEK:
      case DAY:
        d = hours(d, 0)
      case HOURS:
        d = minutes(d, 0)
      case MINUTES:
        d = seconds(d, 0)
      case SECONDS:
        d = milliseconds(d, 0)
    }

    if (unit === DECADE) d = subtract(d, year(d) % 10, 'year')

    if (unit === CENTURY) d = subtract(d, year(d) % 100, 'year')

    if (unit === WEEK) d = weekday(d, 0, firstOfWeek)

    return d
  }

  function endOf(d, unit, firstOfWeek) {
    d = new Date(d)
    d = startOf(d, unit, firstOfWeek)
    d = add(d, 1, unit)
    d = subtract(d, 1, MILI)
    return d
  }

  var eq = createComparer(function(a, b) {
    return a === b
  })
  var gt = createComparer(function(a, b) {
    return a > b
  })
  var gte = createComparer(function(a, b) {
    return a >= b
  })
  var lt = createComparer(function(a, b) {
    return a < b
  })
  var lte = createComparer(function(a, b) {
    return a <= b
  })

  function min$9() {
    return new Date(Math.min.apply(Math, arguments))
  }

  function max$4() {
    return new Date(Math.max.apply(Math, arguments))
  }

  function inRange(day, min, max, unit) {
    unit = unit || 'day'

    return (!min || gte(day, min, unit)) && (!max || lte(day, max, unit))
  }

  var milliseconds = createAccessor('Milliseconds')
  var seconds = createAccessor('Seconds')
  var minutes = createAccessor('Minutes')
  var hours = createAccessor('Hours')
  var day = createAccessor('Day')
  var date = createAccessor('Date')
  var month = createAccessor('Month')
  var year = createAccessor('FullYear')

  function weekday(d, val, firstDay) {
    var w = (day(d) + 7 - (firstDay || 0)) % 7

    return val === undefined ? w : add(d, val - w, DAY)
  }

  function monthMath(d, val) {
    var current = month(d),
      newMonth = current + val

    d = month(d, newMonth)

    while (newMonth < 0) newMonth = 12 + newMonth

    //month rollover
    if (month(d) !== newMonth % 12) d = date(d, 0) //move to last of month

    return d
  }

  function createAccessor(method) {
    var hourLength = (function(method) {
      switch (method) {
        case 'Milliseconds':
          return 3600000
        case 'Seconds':
          return 3600
        case 'Minutes':
          return 60
        case 'Hours':
          return 1
        default:
          return null
      }
    })(method)

    return function(d, val) {
      if (val === undefined) return d['get' + method]()

      var dateOut = new Date(d)
      dateOut['set' + method](val)

      if (
        hourLength &&
        dateOut['get' + method]() != val &&
        (method === 'Hours' ||
          (val >= hourLength &&
            dateOut.getHours() - d.getHours() < Math.floor(val / hourLength)))
      ) {
        //Skip DST hour, if it occurs
        dateOut['set' + method](val + hourLength)
      }

      return dateOut
    }
  }

  function createComparer(operator) {
    return function(a, b, unit) {
      return operator(+startOf(a, unit), +startOf(b, unit))
    }
  }

  /* eslint no-fallthrough: off */
  var MILLI = {
    seconds: 1000,
    minutes: 1000 * 60,
    hours: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
  }
  function firstVisibleDay(date, localizer) {
    var firstOfMonth = startOf(date, 'month')
    return startOf(firstOfMonth, 'week', localizer.startOfWeek())
  }
  function lastVisibleDay(date, localizer) {
    var endOfMonth = endOf(date, 'month')
    return endOf(endOfMonth, 'week', localizer.startOfWeek())
  }
  function visibleDays(date, localizer) {
    var current = firstVisibleDay(date, localizer),
      last = lastVisibleDay(date, localizer),
      days = []

    while (lte(current, last, 'day')) {
      days.push(current)
      current = add(current, 1, 'day')
    }

    return days
  }
  function ceil$3(date, unit) {
    var floor = startOf(date, unit)
    return eq(floor, date) ? floor : add(floor, 1, unit)
  }
  function range(start, end, unit) {
    if (unit === void 0) {
      unit = 'day'
    }

    var current = start,
      days = []

    while (lte(current, end, unit)) {
      days.push(current)
      current = add(current, 1, unit)
    }

    return days
  }
  function merge(date, time) {
    if (time == null && date == null) return null
    if (time == null) time = new Date()
    if (date == null) date = new Date()
    date = startOf(date, 'day')
    date = hours(date, hours(time))
    date = minutes(date, minutes(time))
    date = seconds(date, seconds(time))
    return milliseconds(date, milliseconds(time))
  }
  function isJustDate(date) {
    return (
      hours(date) === 0 &&
      minutes(date) === 0 &&
      seconds(date) === 0 &&
      milliseconds(date) === 0
    )
  }
  function diff(dateA, dateB, unit) {
    if (!unit || unit === 'milliseconds') return Math.abs(+dateA - +dateB) // the .round() handles an edge case
    // with DST where the total won't be exact
    // since one day in the range may be shorter/longer by an hour

    return Math.round(
      Math.abs(
        +startOf(dateA, unit) / MILLI[unit] -
          +startOf(dateB, unit) / MILLI[unit]
      )
    )
  }

  /**
   * The base implementation of `_.slice` without an iteratee call guard.
   *
   * @private
   * @param {Array} array The array to slice.
   * @param {number} [start=0] The start position.
   * @param {number} [end=array.length] The end position.
   * @returns {Array} Returns the slice of `array`.
   */
  function baseSlice(array, start, end) {
    var index = -1,
      length = array.length

    if (start < 0) {
      start = -start > length ? 0 : length + start
    }
    end = end > length ? length : end
    if (end < 0) {
      end += length
    }
    length = start > end ? 0 : (end - start) >>> 0
    start >>>= 0

    var result = Array(length)
    while (++index < length) {
      result[index] = array[index + start]
    }
    return result
  }

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq$1(value, other) {
    return value === other || (value !== value && other !== other)
  }

  /** Detect free variable `global` from Node.js. */
  var freeGlobal =
    typeof global == 'object' && global && global.Object === Object && global

  /** Detect free variable `self`. */
  var freeSelf =
    typeof self == 'object' && self && self.Object === Object && self

  /** Used as a reference to the global object. */
  var root$1 = freeGlobal || freeSelf || Function('return this')()

  /** Built-in value references. */
  var Symbol$2 = root$1.Symbol

  /** Used for built-in method references. */
  var objectProto = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto.hasOwnProperty

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString

  /** Built-in value references. */
  var symToStringTag = Symbol$2 ? Symbol$2.toStringTag : undefined

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty$2.call(value, symToStringTag),
      tag = value[symToStringTag]

    try {
      value[symToStringTag] = undefined
      var unmasked = true
    } catch (e) {}

    var result = nativeObjectToString.call(value)
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag
      } else {
        delete value[symToStringTag]
      }
    }
    return result
  }

  /** Used for built-in method references. */
  var objectProto$1 = Object.prototype

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString$1 = objectProto$1.toString

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString$1(value) {
    return nativeObjectToString$1.call(value)
  }

  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]'

  /** Built-in value references. */
  var symToStringTag$1 = Symbol$2 ? Symbol$2.toStringTag : undefined

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag
    }
    return symToStringTag$1 && symToStringTag$1 in Object(value)
      ? getRawTag(value)
      : objectToString$1(value)
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject$1(value) {
    var type = typeof value
    return value != null && (type == 'object' || type == 'function')
  }

  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]'

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject$1(value)) {
      return false
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value)
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag
  }

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$2 = 9007199254740991

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return (
      typeof value == 'number' &&
      value > -1 &&
      value % 1 == 0 &&
      value <= MAX_SAFE_INTEGER$2
    )
  }

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value)
  }

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$3 = 9007199254740991

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value
    length = length == null ? MAX_SAFE_INTEGER$3 : length

    return (
      !!length &&
      (type == 'number' || (type != 'symbol' && reIsUint.test(value))) &&
      (value > -1 && value % 1 == 0 && value < length)
    )
  }

  /**
   * Checks if the given arguments are from an iteratee call.
   *
   * @private
   * @param {*} value The potential iteratee value argument.
   * @param {*} index The potential iteratee index or key argument.
   * @param {*} object The potential iteratee object argument.
   * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
   *  else `false`.
   */
  function isIterateeCall(value, index, object) {
    if (!isObject$1(object)) {
      return false
    }
    var type = typeof index
    if (
      type == 'number'
        ? isArrayLike(object) && isIndex(index, object.length)
        : type == 'string' && index in object
    ) {
      return eq$1(object[index], value)
    }
    return false
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object'
  }

  /** `Object#toString` result references. */
  var symbolTag = '[object Symbol]'

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol$1(value) {
    return (
      typeof value == 'symbol' ||
      (isObjectLike(value) && baseGetTag(value) == symbolTag)
    )
  }

  /** Used as references for various `Number` constants. */
  var NAN = 0 / 0

  /** Used to match leading and trailing whitespace. */
  var reTrim = /^\s+|\s+$/g

  /** Used to detect bad signed hexadecimal string values. */
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i

  /** Used to detect binary string values. */
  var reIsBinary = /^0b[01]+$/i

  /** Used to detect octal string values. */
  var reIsOctal = /^0o[0-7]+$/i

  /** Built-in method references without a dependency on `root`. */
  var freeParseInt = parseInt

  /**
   * Converts `value` to a number.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to process.
   * @returns {number} Returns the number.
   * @example
   *
   * _.toNumber(3.2);
   * // => 3.2
   *
   * _.toNumber(Number.MIN_VALUE);
   * // => 5e-324
   *
   * _.toNumber(Infinity);
   * // => Infinity
   *
   * _.toNumber('3.2');
   * // => 3.2
   */
  function toNumber$1(value) {
    if (typeof value == 'number') {
      return value
    }
    if (isSymbol$1(value)) {
      return NAN
    }
    if (isObject$1(value)) {
      var other = typeof value.valueOf == 'function' ? value.valueOf() : value
      value = isObject$1(other) ? other + '' : other
    }
    if (typeof value != 'string') {
      return value === 0 ? value : +value
    }
    value = value.replace(reTrim, '')
    var isBinary = reIsBinary.test(value)
    return isBinary || reIsOctal.test(value)
      ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
      : reIsBadHex.test(value)
      ? NAN
      : +value
  }

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e308

  /**
   * Converts `value` to a finite number.
   *
   * @static
   * @memberOf _
   * @since 4.12.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {number} Returns the converted number.
   * @example
   *
   * _.toFinite(3.2);
   * // => 3.2
   *
   * _.toFinite(Number.MIN_VALUE);
   * // => 5e-324
   *
   * _.toFinite(Infinity);
   * // => 1.7976931348623157e+308
   *
   * _.toFinite('3.2');
   * // => 3.2
   */
  function toFinite(value) {
    if (!value) {
      return value === 0 ? value : 0
    }
    value = toNumber$1(value)
    if (value === INFINITY || value === -INFINITY) {
      var sign = value < 0 ? -1 : 1
      return sign * MAX_INTEGER
    }
    return value === value ? value : 0
  }

  /**
   * Converts `value` to an integer.
   *
   * **Note:** This method is loosely based on
   * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {number} Returns the converted integer.
   * @example
   *
   * _.toInteger(3.2);
   * // => 3
   *
   * _.toInteger(Number.MIN_VALUE);
   * // => 0
   *
   * _.toInteger(Infinity);
   * // => 1.7976931348623157e+308
   *
   * _.toInteger('3.2');
   * // => 3
   */
  function toInteger$1(value) {
    var result = toFinite(value),
      remainder = result % 1

    return result === result ? (remainder ? result - remainder : result) : 0
  }

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeCeil = Math.ceil,
    nativeMax = Math.max

  /**
   * Creates an array of elements split into groups the length of `size`.
   * If `array` can't be split evenly, the final chunk will be the remaining
   * elements.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Array
   * @param {Array} array The array to process.
   * @param {number} [size=1] The length of each chunk
   * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
   * @returns {Array} Returns the new array of chunks.
   * @example
   *
   * _.chunk(['a', 'b', 'c', 'd'], 2);
   * // => [['a', 'b'], ['c', 'd']]
   *
   * _.chunk(['a', 'b', 'c', 'd'], 3);
   * // => [['a', 'b', 'c'], ['d']]
   */
  function chunk(array, size, guard) {
    if (guard ? isIterateeCall(array, size, guard) : size === undefined) {
      size = 1
    } else {
      size = nativeMax(toInteger$1(size), 0)
    }
    var length = array == null ? 0 : array.length
    if (!length || size < 1) {
      return []
    }
    var index = 0,
      resIndex = 0,
      result = Array(nativeCeil(length / size))

    while (index < length) {
      result[resIndex++] = baseSlice(array, index, (index += size))
    }
    return result
  }

  function _extends$2() {
    _extends$2 =
      Object.assign ||
      function(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i]

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key]
            }
          }
        }

        return target
      }

    return _extends$2.apply(this, arguments)
  }

  function ownerDocument(node) {
    return (node && node.ownerDocument) || document
  }

  function ownerWindow(node) {
    var doc = ownerDocument(node)
    return (doc && doc.defaultView) || window
  }

  function getComputedStyle$1(node, psuedoElement) {
    return ownerWindow(node).getComputedStyle(node, psuedoElement)
  }

  var rUpper = /([A-Z])/g
  function hyphenate(string) {
    return string.replace(rUpper, '-$1').toLowerCase()
  }

  /**
   * Copyright 2013-2014, Facebook, Inc.
   * All rights reserved.
   * https://github.com/facebook/react/blob/2aeb8a2a6beb00617a4217f7f8284924fa2ad819/src/vendor/core/hyphenateStyleName.js
   */
  var msPattern = /^ms-/
  function hyphenateStyleName(string) {
    return hyphenate(string).replace(msPattern, '-ms-')
  }

  var supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i
  function isTransform(value) {
    return !!(value && supportedTransforms.test(value))
  }

  function style(node, property) {
    var css = ''
    var transforms = ''

    if (typeof property === 'string') {
      return (
        node.style.getPropertyValue(hyphenateStyleName(property)) ||
        getComputedStyle$1(node).getPropertyValue(hyphenateStyleName(property))
      )
    }

    Object.keys(property).forEach(function(key) {
      var value = property[key]

      if (!value && value !== 0) {
        node.style.removeProperty(hyphenateStyleName(key))
      } else if (isTransform(key)) {
        transforms += key + '(' + value + ') '
      } else {
        css += hyphenateStyleName(key) + ': ' + value + ';'
      }
    })

    if (transforms) {
      css += 'transform: ' + transforms + ';'
    }

    node.style.cssText += ';' + css
  }

  /* eslint-disable no-bitwise, no-cond-assign */
  // HTML DOM and SVG DOM may have different support levels,
  // so we need to check on context instead of a document root element.
  function contains(context, node) {
    if (context.contains) return context.contains(node)
    if (context.compareDocumentPosition)
      return context === node || !!(context.compareDocumentPosition(node) & 16)
  }

  function isDocument(element) {
    return 'nodeType' in element && element.nodeType === document.DOCUMENT_NODE
  }

  function isWindow(node) {
    if ('window' in node && node.window === node) return node
    if (isDocument(node)) return node.defaultView || false
    return false
  }

  function getscrollAccessor(offset) {
    var prop = offset === 'pageXOffset' ? 'scrollLeft' : 'scrollTop'

    function scrollAccessor(node, val) {
      var win = isWindow(node)

      if (val === undefined) {
        return win ? win[offset] : node[prop]
      }

      if (win) {
        win.scrollTo(val, win[offset])
      } else {
        node[prop] = val
      }
    }

    return scrollAccessor
  }

  var getScrollLeft = getscrollAccessor('pageXOffset')

  var getScrollTop = getscrollAccessor('pageYOffset')

  function offset(node) {
    var doc = ownerDocument(node)
    var box = {
      top: 0,
      left: 0,
      height: 0,
      width: 0,
    }
    var docElem = doc && doc.documentElement // Make sure it's not a disconnected DOM node

    if (!docElem || !contains(docElem, node)) return box
    if (node.getBoundingClientRect !== undefined)
      box = node.getBoundingClientRect()
    box = {
      top: box.top + getScrollTop(node) - (docElem.clientTop || 0),
      left: box.left + getScrollLeft(node) - (docElem.clientLeft || 0),
      width: box.width,
      height: box.height,
    }
    return box
  }

  var isHTMLElement = function isHTMLElement(e) {
    return !!e && 'offsetParent' in e
  }

  function offsetParent(node) {
    var doc = ownerDocument(node)
    var parent = node && node.offsetParent

    while (
      isHTMLElement(parent) &&
      parent.nodeName !== 'HTML' &&
      style(parent, 'position') === 'static'
    ) {
      parent = parent.offsetParent
    }

    return parent || doc.documentElement
  }

  var nodeName = function nodeName(node) {
    return node.nodeName && node.nodeName.toLowerCase()
  }

  function position(node, offsetParent$1) {
    var parentOffset = {
      top: 0,
      left: 0,
    }
    var offset$1 // Fixed elements are offset from window (parentOffset = {top:0, left: 0},
    // because it is its only offset parent

    if (style(node, 'position') === 'fixed') {
      offset$1 = node.getBoundingClientRect()
    } else {
      var parent = offsetParent$1 || offsetParent(node)
      offset$1 = offset(node)
      if (nodeName(parent) !== 'html') parentOffset = offset(parent)
      var borderTop = String(style(parent, 'borderTopWidth') || 0)
      parentOffset.top += parseInt(borderTop, 10) - getScrollTop(parent) || 0
      var borderLeft = String(style(parent, 'borderLeftWidth') || 0)
      parentOffset.left += parseInt(borderLeft, 10) - getScrollLeft(parent) || 0
    }

    var marginTop = String(style(node, 'marginTop') || 0)
    var marginLeft = String(style(node, 'marginLeft') || 0) // Subtract parent offsets and node margins

    return _extends$2({}, offset$1, {
      top: offset$1.top - parentOffset.top - (parseInt(marginTop, 10) || 0),
      left: offset$1.left - parentOffset.left - (parseInt(marginLeft, 10) || 0),
    })
  }

  var canUseDOM = !!(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
  )

  /* https://github.com/component/raf */
  var prev = new Date().getTime()

  function fallback(fn) {
    var curr = new Date().getTime()
    var ms = Math.max(0, 16 - (curr - prev))
    var handle = setTimeout(fn, ms)
    prev = curr
    return handle
  }

  var vendors$1 = ['', 'webkit', 'moz', 'o', 'ms']
  var cancelMethod = 'clearTimeout'
  var rafImpl = fallback // eslint-disable-next-line import/no-mutable-exports

  var getKey = function getKey(vendor, k) {
    return (
      vendor +
      (!vendor ? k : k[0].toUpperCase() + k.substr(1)) +
      'AnimationFrame'
    )
  }

  if (canUseDOM) {
    vendors$1.some(function(vendor) {
      var rafMethod = getKey(vendor, 'request')

      if (rafMethod in window) {
        cancelMethod = getKey(vendor, 'cancel') // @ts-ignore

        rafImpl = function rafImpl(cb) {
          return window[rafMethod](cb)
        }
      }

      return !!rafImpl
    })
  }

  var cancel$1 = function cancel(id) {
    // @ts-ignore
    if (typeof window[cancelMethod] === 'function') window[cancelMethod](id)
  }
  var request = rafImpl

  var EventCell =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(EventCell, _React$Component)

      function EventCell() {
        return _React$Component.apply(this, arguments) || this
      }

      var _proto = EventCell.prototype

      _proto.render = function render() {
        var _this$props = this.props,
          style = _this$props.style,
          className = _this$props.className,
          event = _this$props.event,
          selected = _this$props.selected,
          isAllDay = _this$props.isAllDay,
          onSelect = _this$props.onSelect,
          _onDoubleClick = _this$props.onDoubleClick,
          localizer = _this$props.localizer,
          continuesPrior = _this$props.continuesPrior,
          continuesAfter = _this$props.continuesAfter,
          accessors = _this$props.accessors,
          getters = _this$props.getters,
          children = _this$props.children,
          _this$props$component = _this$props.components,
          Event = _this$props$component.event,
          EventWrapper = _this$props$component.eventWrapper,
          slotStart = _this$props.slotStart,
          slotEnd = _this$props.slotEnd,
          props = _objectWithoutPropertiesLoose(_this$props, [
            'style',
            'className',
            'event',
            'selected',
            'isAllDay',
            'onSelect',
            'onDoubleClick',
            'localizer',
            'continuesPrior',
            'continuesAfter',
            'accessors',
            'getters',
            'children',
            'components',
            'slotStart',
            'slotEnd',
          ])

        var title = accessors.title(event)
        var tooltip = accessors.tooltip(event)
        var end = accessors.end(event)
        var start = accessors.start(event)
        var allDay = accessors.allDay(event)
        var showAsAllDay =
          isAllDay || allDay || diff(start, ceil$3(end, 'day'), 'day') > 1
        var userProps = getters.eventProp(event, start, end, selected)
        var content = React__default.createElement(
          'div',
          {
            className: 'rbc-event-content',
            title: tooltip || undefined,
          },
          Event
            ? React__default.createElement(Event, {
                event: event,
                continuesPrior: continuesPrior,
                continuesAfter: continuesAfter,
                title: title,
                isAllDay: allDay,
                localizer: localizer,
                slotStart: slotStart,
                slotEnd: slotEnd,
              })
            : title
        )
        return React__default.createElement(
          EventWrapper,
          _extends({}, this.props, {
            type: 'date',
          }),
          React__default.createElement(
            'div',
            _extends({}, props, {
              tabIndex: 0,
              style: _extends({}, userProps.style, style),
              className: clsx('rbc-event', className, userProps.className, {
                'rbc-selected': selected,
                'rbc-event-allday': showAsAllDay,
                'rbc-event-continues-prior': continuesPrior,
                'rbc-event-continues-after': continuesAfter,
              }),
              onClick: function onClick(e) {
                return onSelect && onSelect(event, e)
              },
              onDoubleClick: function onDoubleClick(e) {
                return _onDoubleClick && _onDoubleClick(event, e)
              },
            }),
            typeof children === 'function' ? children(content) : content
          )
        )
      }

      return EventCell
    })(React__default.Component)

  EventCell.propTypes = {
    event: propTypes.object.isRequired,
    slotStart: propTypes.instanceOf(Date),
    slotEnd: propTypes.instanceOf(Date),
    selected: propTypes.bool,
    isAllDay: propTypes.bool,
    continuesPrior: propTypes.bool,
    continuesAfter: propTypes.bool,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    localizer: propTypes.object,
    onSelect: propTypes.func,
    onDoubleClick: propTypes.func,
  }

  function isSelected(event, selected) {
    if (!event || selected == null) return false
    return [].concat(selected).indexOf(event) !== -1
  }
  function slotWidth(rowBox, slots) {
    var rowWidth = rowBox.right - rowBox.left
    var cellWidth = rowWidth / slots
    return cellWidth
  }
  function getSlotAtX(rowBox, x, rtl, slots) {
    var cellWidth = slotWidth(rowBox, slots)
    return rtl
      ? slots - 1 - Math.floor((x - rowBox.left) / cellWidth)
      : Math.floor((x - rowBox.left) / cellWidth)
  }
  function pointInBox(box, _ref) {
    var x = _ref.x,
      y = _ref.y
    return y >= box.top && y <= box.bottom && x >= box.left && x <= box.right
  }
  function dateCellSelection(start, rowBox, box, slots, rtl) {
    var startIdx = -1
    var endIdx = -1
    var lastSlotIdx = slots - 1
    var cellWidth = slotWidth(rowBox, slots) // cell under the mouse

    var currentSlot = getSlotAtX(rowBox, box.x, rtl, slots) // Identify row as either the initial row
    // or the row under the current mouse point

    var isCurrentRow = rowBox.top < box.y && rowBox.bottom > box.y
    var isStartRow = rowBox.top < start.y && rowBox.bottom > start.y // this row's position relative to the start point

    var isAboveStart = start.y > rowBox.bottom
    var isBelowStart = rowBox.top > start.y
    var isBetween = box.top < rowBox.top && box.bottom > rowBox.bottom // this row is between the current and start rows, so entirely selected

    if (isBetween) {
      startIdx = 0
      endIdx = lastSlotIdx
    }

    if (isCurrentRow) {
      if (isBelowStart) {
        startIdx = 0
        endIdx = currentSlot
      } else if (isAboveStart) {
        startIdx = currentSlot
        endIdx = lastSlotIdx
      }
    }

    if (isStartRow) {
      // select the cell under the initial point
      startIdx = endIdx = rtl
        ? lastSlotIdx - Math.floor((start.x - rowBox.left) / cellWidth)
        : Math.floor((start.x - rowBox.left) / cellWidth)

      if (isCurrentRow) {
        if (currentSlot < startIdx) startIdx = currentSlot
        else endIdx = currentSlot //select current range
      } else if (start.y < box.y) {
        // the current row is below start row
        // select cells to the right of the start cell
        endIdx = lastSlotIdx
      } else {
        // select cells to the left of the start cell
        startIdx = 0
      }
    }

    return {
      startIdx: startIdx,
      endIdx: endIdx,
    }
  }

  var Popup =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(Popup, _React$Component)

      function Popup() {
        return _React$Component.apply(this, arguments) || this
      }

      var _proto = Popup.prototype

      _proto.componentDidMount = function componentDidMount() {
        var _this$props = this.props,
          _this$props$popupOffs = _this$props.popupOffset,
          popupOffset =
            _this$props$popupOffs === void 0 ? 5 : _this$props$popupOffs,
          popperRef = _this$props.popperRef,
          _getOffset = offset(popperRef.current),
          top = _getOffset.top,
          left = _getOffset.left,
          width = _getOffset.width,
          height = _getOffset.height,
          viewBottom = window.innerHeight + getScrollTop(window),
          viewRight = window.innerWidth + getScrollLeft(window),
          bottom = top + height,
          right = left + width

        if (bottom > viewBottom || right > viewRight) {
          var topOffset, leftOffset
          if (bottom > viewBottom)
            topOffset =
              bottom - viewBottom + (popupOffset.y || +popupOffset || 0)
          if (right > viewRight)
            leftOffset =
              right - viewRight + (popupOffset.x || +popupOffset || 0)
          this.setState({
            topOffset: topOffset,
            leftOffset: leftOffset,
          }) //eslint-disable-line
        }
      }

      _proto.render = function render() {
        var _this$props2 = this.props,
          events = _this$props2.events,
          selected = _this$props2.selected,
          getters = _this$props2.getters,
          accessors = _this$props2.accessors,
          components = _this$props2.components,
          onSelect = _this$props2.onSelect,
          onDoubleClick = _this$props2.onDoubleClick,
          slotStart = _this$props2.slotStart,
          slotEnd = _this$props2.slotEnd,
          localizer = _this$props2.localizer,
          popperRef = _this$props2.popperRef
        var width = this.props.position.width,
          topOffset = (this.state || {}).topOffset || 0,
          leftOffset = (this.state || {}).leftOffset || 0
        var style = {
          top: -topOffset,
          left: -leftOffset,
          minWidth: width + width / 2,
        }
        return React__default.createElement(
          'div',
          {
            style: _extends({}, this.props.style, style),
            className: 'rbc-overlay',
            ref: popperRef,
          },
          React__default.createElement(
            'div',
            {
              className: 'rbc-overlay-header',
            },
            localizer.format(slotStart, 'dayHeaderFormat')
          ),
          events.map(function(event, idx) {
            return React__default.createElement(EventCell, {
              key: idx,
              type: 'popup',
              event: event,
              getters: getters,
              onSelect: onSelect,
              accessors: accessors,
              components: components,
              onDoubleClick: onDoubleClick,
              continuesPrior: lt(accessors.end(event), slotStart, 'day'),
              continuesAfter: gte(accessors.start(event), slotEnd, 'day'),
              slotStart: slotStart,
              slotEnd: slotEnd,
              selected: isSelected(event, selected),
            })
          })
        )
      }

      return Popup
    })(React__default.Component)

  Popup.propTypes = {
    position: propTypes.object,
    popupOffset: propTypes.oneOfType([
      propTypes.number,
      propTypes.shape({
        x: propTypes.number,
        y: propTypes.number,
      }),
    ]),
    events: propTypes.array,
    selected: propTypes.object,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    localizer: propTypes.object.isRequired,
    onSelect: propTypes.func,
    onDoubleClick: propTypes.func,
    slotStart: propTypes.instanceOf(Date),
    slotEnd: propTypes.number,
    popperRef: propTypes.oneOfType([
      propTypes.func,
      propTypes.shape({
        current: propTypes.Element,
      }),
    ]),
    /**
     * The Overlay component, of react-overlays, creates a ref that is passed to the Popup, and
     * requires proper ref forwarding to be used without error
     */
  }
  var Popup$1 = React__default.forwardRef(function(props, ref) {
    return React__default.createElement(
      Popup,
      _extends(
        {
          popperRef: ref,
        },
        props
      )
    )
  })

  function _extends$3() {
    _extends$3 =
      Object.assign ||
      function(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i]

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key]
            }
          }
        }

        return target
      }

    return _extends$3.apply(this, arguments)
  }

  function _objectWithoutPropertiesLoose$2(source, excluded) {
    if (source == null) return {}
    var target = {}
    var sourceKeys = Object.keys(source)
    var key, i

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i]
      if (excluded.indexOf(key) >= 0) continue
      target[key] = source[key]
    }

    return target
  }

  /**!
   * @fileOverview Kickass library to create and place poppers near their reference elements.
   * @version 1.15.0
   * @license
   * Copyright (c) 2016 Federico Zivolo and contributors
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   */
  var isBrowser =
    typeof window !== 'undefined' && typeof document !== 'undefined'

  var longerTimeoutBrowsers = ['Edge', 'Trident', 'Firefox']
  var timeoutDuration = 0
  for (var i$1 = 0; i$1 < longerTimeoutBrowsers.length; i$1 += 1) {
    if (
      isBrowser &&
      navigator.userAgent.indexOf(longerTimeoutBrowsers[i$1]) >= 0
    ) {
      timeoutDuration = 1
      break
    }
  }

  function microtaskDebounce(fn) {
    var called = false
    return function() {
      if (called) {
        return
      }
      called = true
      window.Promise.resolve().then(function() {
        called = false
        fn()
      })
    }
  }

  function taskDebounce(fn) {
    var scheduled = false
    return function() {
      if (!scheduled) {
        scheduled = true
        setTimeout(function() {
          scheduled = false
          fn()
        }, timeoutDuration)
      }
    }
  }

  var supportsMicroTasks = isBrowser && window.Promise

  /**
   * Create a debounced version of a method, that's asynchronously deferred
   * but called in the minimum time possible.
   *
   * @method
   * @memberof Popper.Utils
   * @argument {Function} fn
   * @returns {Function}
   */
  var debounce = supportsMicroTasks ? microtaskDebounce : taskDebounce

  /**
   * Check if the given variable is a function
   * @method
   * @memberof Popper.Utils
   * @argument {Any} functionToCheck - variable to check
   * @returns {Boolean} answer to: is a function?
   */
  function isFunction$1(functionToCheck) {
    var getType = {}
    return (
      functionToCheck &&
      getType.toString.call(functionToCheck) === '[object Function]'
    )
  }

  /**
   * Get CSS computed property of the given element
   * @method
   * @memberof Popper.Utils
   * @argument {Eement} element
   * @argument {String} property
   */
  function getStyleComputedProperty(element, property) {
    if (element.nodeType !== 1) {
      return []
    }
    // NOTE: 1 DOM access here
    var window = element.ownerDocument.defaultView
    var css = window.getComputedStyle(element, null)
    return property ? css[property] : css
  }

  /**
   * Returns the parentNode or the host of the element
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element
   * @returns {Element} parent
   */
  function getParentNode(element) {
    if (element.nodeName === 'HTML') {
      return element
    }
    return element.parentNode || element.host
  }

  /**
   * Returns the scrolling parent of the given element
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element
   * @returns {Element} scroll parent
   */
  function getScrollParent(element) {
    // Return body, `getScroll` will take care to get the correct `scrollTop` from it
    if (!element) {
      return document.body
    }

    switch (element.nodeName) {
      case 'HTML':
      case 'BODY':
        return element.ownerDocument.body
      case '#document':
        return element.body
    }

    // Firefox want us to check `-x` and `-y` variations as well

    var _getStyleComputedProp = getStyleComputedProperty(element),
      overflow = _getStyleComputedProp.overflow,
      overflowX = _getStyleComputedProp.overflowX,
      overflowY = _getStyleComputedProp.overflowY

    if (/(auto|scroll|overlay)/.test(overflow + overflowY + overflowX)) {
      return element
    }

    return getScrollParent(getParentNode(element))
  }

  var isIE11 =
    isBrowser && !!(window.MSInputMethodContext && document.documentMode)
  var isIE10 = isBrowser && /MSIE 10/.test(navigator.userAgent)

  /**
   * Determines if the browser is Internet Explorer
   * @method
   * @memberof Popper.Utils
   * @param {Number} version to check
   * @returns {Boolean} isIE
   */
  function isIE(version) {
    if (version === 11) {
      return isIE11
    }
    if (version === 10) {
      return isIE10
    }
    return isIE11 || isIE10
  }

  /**
   * Returns the offset parent of the given element
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element
   * @returns {Element} offset parent
   */
  function getOffsetParent(element) {
    if (!element) {
      return document.documentElement
    }

    var noOffsetParent = isIE(10) ? document.body : null

    // NOTE: 1 DOM access here
    var offsetParent = element.offsetParent || null
    // Skip hidden elements which don't have an offsetParent
    while (offsetParent === noOffsetParent && element.nextElementSibling) {
      offsetParent = (element = element.nextElementSibling).offsetParent
    }

    var nodeName = offsetParent && offsetParent.nodeName

    if (!nodeName || nodeName === 'BODY' || nodeName === 'HTML') {
      return element
        ? element.ownerDocument.documentElement
        : document.documentElement
    }

    // .offsetParent will return the closest TH, TD or TABLE in case
    // no offsetParent is present, I hate this job...
    if (
      ['TH', 'TD', 'TABLE'].indexOf(offsetParent.nodeName) !== -1 &&
      getStyleComputedProperty(offsetParent, 'position') === 'static'
    ) {
      return getOffsetParent(offsetParent)
    }

    return offsetParent
  }

  function isOffsetContainer(element) {
    var nodeName = element.nodeName

    if (nodeName === 'BODY') {
      return false
    }
    return (
      nodeName === 'HTML' ||
      getOffsetParent(element.firstElementChild) === element
    )
  }

  /**
   * Finds the root node (document, shadowDOM root) of the given element
   * @method
   * @memberof Popper.Utils
   * @argument {Element} node
   * @returns {Element} root node
   */
  function getRoot(node) {
    if (node.parentNode !== null) {
      return getRoot(node.parentNode)
    }

    return node
  }

  /**
   * Finds the offset parent common to the two provided nodes
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element1
   * @argument {Element} element2
   * @returns {Element} common offset parent
   */
  function findCommonOffsetParent(element1, element2) {
    // This check is needed to avoid errors in case one of the elements isn't defined for any reason
    if (!element1 || !element1.nodeType || !element2 || !element2.nodeType) {
      return document.documentElement
    }

    // Here we make sure to give as "start" the element that comes first in the DOM
    var order =
      element1.compareDocumentPosition(element2) &
      Node.DOCUMENT_POSITION_FOLLOWING
    var start = order ? element1 : element2
    var end = order ? element2 : element1

    // Get common ancestor container
    var range = document.createRange()
    range.setStart(start, 0)
    range.setEnd(end, 0)
    var commonAncestorContainer = range.commonAncestorContainer

    // Both nodes are inside #document

    if (
      (element1 !== commonAncestorContainer &&
        element2 !== commonAncestorContainer) ||
      start.contains(end)
    ) {
      if (isOffsetContainer(commonAncestorContainer)) {
        return commonAncestorContainer
      }

      return getOffsetParent(commonAncestorContainer)
    }

    // one of the nodes is inside shadowDOM, find which one
    var element1root = getRoot(element1)
    if (element1root.host) {
      return findCommonOffsetParent(element1root.host, element2)
    } else {
      return findCommonOffsetParent(element1, getRoot(element2).host)
    }
  }

  /**
   * Gets the scroll value of the given element in the given side (top and left)
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element
   * @argument {String} side `top` or `left`
   * @returns {number} amount of scrolled pixels
   */
  function getScroll(element) {
    var side =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'top'

    var upperSide = side === 'top' ? 'scrollTop' : 'scrollLeft'
    var nodeName = element.nodeName

    if (nodeName === 'BODY' || nodeName === 'HTML') {
      var html = element.ownerDocument.documentElement
      var scrollingElement = element.ownerDocument.scrollingElement || html
      return scrollingElement[upperSide]
    }

    return element[upperSide]
  }

  /*
   * Sum or subtract the element scroll values (left and top) from a given rect object
   * @method
   * @memberof Popper.Utils
   * @param {Object} rect - Rect object you want to change
   * @param {HTMLElement} element - The element from the function reads the scroll values
   * @param {Boolean} subtract - set to true if you want to subtract the scroll values
   * @return {Object} rect - The modifier rect object
   */
  function includeScroll(rect, element) {
    var subtract =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false

    var scrollTop = getScroll(element, 'top')
    var scrollLeft = getScroll(element, 'left')
    var modifier = subtract ? -1 : 1
    rect.top += scrollTop * modifier
    rect.bottom += scrollTop * modifier
    rect.left += scrollLeft * modifier
    rect.right += scrollLeft * modifier
    return rect
  }

  /*
   * Helper to detect borders of a given element
   * @method
   * @memberof Popper.Utils
   * @param {CSSStyleDeclaration} styles
   * Result of `getStyleComputedProperty` on the given element
   * @param {String} axis - `x` or `y`
   * @return {number} borders - The borders size of the given axis
   */

  function getBordersSize(styles, axis) {
    var sideA = axis === 'x' ? 'Left' : 'Top'
    var sideB = sideA === 'Left' ? 'Right' : 'Bottom'

    return (
      parseFloat(styles['border' + sideA + 'Width'], 10) +
      parseFloat(styles['border' + sideB + 'Width'], 10)
    )
  }

  function getSize(axis, body, html, computedStyle) {
    return Math.max(
      body['offset' + axis],
      body['scroll' + axis],
      html['client' + axis],
      html['offset' + axis],
      html['scroll' + axis],
      isIE(10)
        ? parseInt(html['offset' + axis]) +
            parseInt(
              computedStyle['margin' + (axis === 'Height' ? 'Top' : 'Left')]
            ) +
            parseInt(
              computedStyle['margin' + (axis === 'Height' ? 'Bottom' : 'Right')]
            )
        : 0
    )
  }

  function getWindowSizes(document) {
    var body = document.body
    var html = document.documentElement
    var computedStyle = isIE(10) && getComputedStyle(html)

    return {
      height: getSize('Height', body, html, computedStyle),
      width: getSize('Width', body, html, computedStyle),
    }
  }

  var classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function')
    }
  }

  var createClass = (function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i]
        descriptor.enumerable = descriptor.enumerable || false
        descriptor.configurable = true
        if ('value' in descriptor) descriptor.writable = true
        Object.defineProperty(target, descriptor.key, descriptor)
      }
    }

    return function(Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps)
      if (staticProps) defineProperties(Constructor, staticProps)
      return Constructor
    }
  })()

  var defineProperty$c = function(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    } else {
      obj[key] = value
    }

    return obj
  }

  var _extends$4 =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key]
          }
        }
      }

      return target
    }

  /**
   * Given element offsets, generate an output similar to getBoundingClientRect
   * @method
   * @memberof Popper.Utils
   * @argument {Object} offsets
   * @returns {Object} ClientRect like output
   */
  function getClientRect(offsets) {
    return _extends$4({}, offsets, {
      right: offsets.left + offsets.width,
      bottom: offsets.top + offsets.height,
    })
  }

  /**
   * Get bounding client rect of given element
   * @method
   * @memberof Popper.Utils
   * @param {HTMLElement} element
   * @return {Object} client rect
   */
  function getBoundingClientRect(element) {
    var rect = {}

    // IE10 10 FIX: Please, don't ask, the element isn't
    // considered in DOM in some circumstances...
    // This isn't reproducible in IE10 compatibility mode of IE11
    try {
      if (isIE(10)) {
        rect = element.getBoundingClientRect()
        var scrollTop = getScroll(element, 'top')
        var scrollLeft = getScroll(element, 'left')
        rect.top += scrollTop
        rect.left += scrollLeft
        rect.bottom += scrollTop
        rect.right += scrollLeft
      } else {
        rect = element.getBoundingClientRect()
      }
    } catch (e) {}

    var result = {
      left: rect.left,
      top: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    }

    // subtract scrollbar size from sizes
    var sizes =
      element.nodeName === 'HTML' ? getWindowSizes(element.ownerDocument) : {}
    var width = sizes.width || element.clientWidth || result.right - result.left
    var height =
      sizes.height || element.clientHeight || result.bottom - result.top

    var horizScrollbar = element.offsetWidth - width
    var vertScrollbar = element.offsetHeight - height

    // if an hypothetical scrollbar is detected, we must be sure it's not a `border`
    // we make this check conditional for performance reasons
    if (horizScrollbar || vertScrollbar) {
      var styles = getStyleComputedProperty(element)
      horizScrollbar -= getBordersSize(styles, 'x')
      vertScrollbar -= getBordersSize(styles, 'y')

      result.width -= horizScrollbar
      result.height -= vertScrollbar
    }

    return getClientRect(result)
  }

  function getOffsetRectRelativeToArbitraryNode(children, parent) {
    var fixedPosition =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false

    var isIE10 = isIE(10)
    var isHTML = parent.nodeName === 'HTML'
    var childrenRect = getBoundingClientRect(children)
    var parentRect = getBoundingClientRect(parent)
    var scrollParent = getScrollParent(children)

    var styles = getStyleComputedProperty(parent)
    var borderTopWidth = parseFloat(styles.borderTopWidth, 10)
    var borderLeftWidth = parseFloat(styles.borderLeftWidth, 10)

    // In cases where the parent is fixed, we must ignore negative scroll in offset calc
    if (fixedPosition && isHTML) {
      parentRect.top = Math.max(parentRect.top, 0)
      parentRect.left = Math.max(parentRect.left, 0)
    }
    var offsets = getClientRect({
      top: childrenRect.top - parentRect.top - borderTopWidth,
      left: childrenRect.left - parentRect.left - borderLeftWidth,
      width: childrenRect.width,
      height: childrenRect.height,
    })
    offsets.marginTop = 0
    offsets.marginLeft = 0

    // Subtract margins of documentElement in case it's being used as parent
    // we do this only on HTML because it's the only element that behaves
    // differently when margins are applied to it. The margins are included in
    // the box of the documentElement, in the other cases not.
    if (!isIE10 && isHTML) {
      var marginTop = parseFloat(styles.marginTop, 10)
      var marginLeft = parseFloat(styles.marginLeft, 10)

      offsets.top -= borderTopWidth - marginTop
      offsets.bottom -= borderTopWidth - marginTop
      offsets.left -= borderLeftWidth - marginLeft
      offsets.right -= borderLeftWidth - marginLeft

      // Attach marginTop and marginLeft because in some circumstances we may need them
      offsets.marginTop = marginTop
      offsets.marginLeft = marginLeft
    }

    if (
      isIE10 && !fixedPosition
        ? parent.contains(scrollParent)
        : parent === scrollParent && scrollParent.nodeName !== 'BODY'
    ) {
      offsets = includeScroll(offsets, parent)
    }

    return offsets
  }

  function getViewportOffsetRectRelativeToArtbitraryNode(element) {
    var excludeScroll =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false

    var html = element.ownerDocument.documentElement
    var relativeOffset = getOffsetRectRelativeToArbitraryNode(element, html)
    var width = Math.max(html.clientWidth, window.innerWidth || 0)
    var height = Math.max(html.clientHeight, window.innerHeight || 0)

    var scrollTop = !excludeScroll ? getScroll(html) : 0
    var scrollLeft = !excludeScroll ? getScroll(html, 'left') : 0

    var offset = {
      top: scrollTop - relativeOffset.top + relativeOffset.marginTop,
      left: scrollLeft - relativeOffset.left + relativeOffset.marginLeft,
      width: width,
      height: height,
    }

    return getClientRect(offset)
  }

  /**
   * Check if the given element is fixed or is inside a fixed parent
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element
   * @argument {Element} customContainer
   * @returns {Boolean} answer to "isFixed?"
   */
  function isFixed(element) {
    var nodeName = element.nodeName
    if (nodeName === 'BODY' || nodeName === 'HTML') {
      return false
    }
    if (getStyleComputedProperty(element, 'position') === 'fixed') {
      return true
    }
    var parentNode = getParentNode(element)
    if (!parentNode) {
      return false
    }
    return isFixed(parentNode)
  }

  /**
   * Finds the first parent of an element that has a transformed property defined
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element
   * @returns {Element} first transformed parent or documentElement
   */

  function getFixedPositionOffsetParent(element) {
    // This check is needed to avoid errors in case one of the elements isn't defined for any reason
    if (!element || !element.parentElement || isIE()) {
      return document.documentElement
    }
    var el = element.parentElement
    while (el && getStyleComputedProperty(el, 'transform') === 'none') {
      el = el.parentElement
    }
    return el || document.documentElement
  }

  /**
   * Computed the boundaries limits and return them
   * @method
   * @memberof Popper.Utils
   * @param {HTMLElement} popper
   * @param {HTMLElement} reference
   * @param {number} padding
   * @param {HTMLElement} boundariesElement - Element used to define the boundaries
   * @param {Boolean} fixedPosition - Is in fixed position mode
   * @returns {Object} Coordinates of the boundaries
   */
  function getBoundaries(popper, reference, padding, boundariesElement) {
    var fixedPosition =
      arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false

    // NOTE: 1 DOM access here

    var boundaries = { top: 0, left: 0 }
    var offsetParent = fixedPosition
      ? getFixedPositionOffsetParent(popper)
      : findCommonOffsetParent(popper, reference)

    // Handle viewport case
    if (boundariesElement === 'viewport') {
      boundaries = getViewportOffsetRectRelativeToArtbitraryNode(
        offsetParent,
        fixedPosition
      )
    } else {
      // Handle other cases based on DOM element used as boundaries
      var boundariesNode = void 0
      if (boundariesElement === 'scrollParent') {
        boundariesNode = getScrollParent(getParentNode(reference))
        if (boundariesNode.nodeName === 'BODY') {
          boundariesNode = popper.ownerDocument.documentElement
        }
      } else if (boundariesElement === 'window') {
        boundariesNode = popper.ownerDocument.documentElement
      } else {
        boundariesNode = boundariesElement
      }

      var offsets = getOffsetRectRelativeToArbitraryNode(
        boundariesNode,
        offsetParent,
        fixedPosition
      )

      // In case of HTML, we need a different computation
      if (boundariesNode.nodeName === 'HTML' && !isFixed(offsetParent)) {
        var _getWindowSizes = getWindowSizes(popper.ownerDocument),
          height = _getWindowSizes.height,
          width = _getWindowSizes.width

        boundaries.top += offsets.top - offsets.marginTop
        boundaries.bottom = height + offsets.top
        boundaries.left += offsets.left - offsets.marginLeft
        boundaries.right = width + offsets.left
      } else {
        // for all the other DOM elements, this one is good
        boundaries = offsets
      }
    }

    // Add paddings
    padding = padding || 0
    var isPaddingNumber = typeof padding === 'number'
    boundaries.left += isPaddingNumber ? padding : padding.left || 0
    boundaries.top += isPaddingNumber ? padding : padding.top || 0
    boundaries.right -= isPaddingNumber ? padding : padding.right || 0
    boundaries.bottom -= isPaddingNumber ? padding : padding.bottom || 0

    return boundaries
  }

  function getArea(_ref) {
    var width = _ref.width,
      height = _ref.height

    return width * height
  }

  /**
   * Utility used to transform the `auto` placement to the placement with more
   * available space.
   * @method
   * @memberof Popper.Utils
   * @argument {Object} data - The data object generated by update method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function computeAutoPlacement(
    placement,
    refRect,
    popper,
    reference,
    boundariesElement
  ) {
    var padding =
      arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0

    if (placement.indexOf('auto') === -1) {
      return placement
    }

    var boundaries = getBoundaries(
      popper,
      reference,
      padding,
      boundariesElement
    )

    var rects = {
      top: {
        width: boundaries.width,
        height: refRect.top - boundaries.top,
      },
      right: {
        width: boundaries.right - refRect.right,
        height: boundaries.height,
      },
      bottom: {
        width: boundaries.width,
        height: boundaries.bottom - refRect.bottom,
      },
      left: {
        width: refRect.left - boundaries.left,
        height: boundaries.height,
      },
    }

    var sortedAreas = Object.keys(rects)
      .map(function(key) {
        return _extends$4(
          {
            key: key,
          },
          rects[key],
          {
            area: getArea(rects[key]),
          }
        )
      })
      .sort(function(a, b) {
        return b.area - a.area
      })

    var filteredAreas = sortedAreas.filter(function(_ref2) {
      var width = _ref2.width,
        height = _ref2.height
      return width >= popper.clientWidth && height >= popper.clientHeight
    })

    var computedPlacement =
      filteredAreas.length > 0 ? filteredAreas[0].key : sortedAreas[0].key

    var variation = placement.split('-')[1]

    return computedPlacement + (variation ? '-' + variation : '')
  }

  /**
   * Get offsets to the reference element
   * @method
   * @memberof Popper.Utils
   * @param {Object} state
   * @param {Element} popper - the popper element
   * @param {Element} reference - the reference element (the popper will be relative to this)
   * @param {Element} fixedPosition - is in fixed position mode
   * @returns {Object} An object containing the offsets which will be applied to the popper
   */
  function getReferenceOffsets(state, popper, reference) {
    var fixedPosition =
      arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null

    var commonOffsetParent = fixedPosition
      ? getFixedPositionOffsetParent(popper)
      : findCommonOffsetParent(popper, reference)
    return getOffsetRectRelativeToArbitraryNode(
      reference,
      commonOffsetParent,
      fixedPosition
    )
  }

  /**
   * Get the outer sizes of the given element (offset size + margins)
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element
   * @returns {Object} object containing width and height properties
   */
  function getOuterSizes(element) {
    var window = element.ownerDocument.defaultView
    var styles = window.getComputedStyle(element)
    var x =
      parseFloat(styles.marginTop || 0) + parseFloat(styles.marginBottom || 0)
    var y =
      parseFloat(styles.marginLeft || 0) + parseFloat(styles.marginRight || 0)
    var result = {
      width: element.offsetWidth + y,
      height: element.offsetHeight + x,
    }
    return result
  }

  /**
   * Get the opposite placement of the given one
   * @method
   * @memberof Popper.Utils
   * @argument {String} placement
   * @returns {String} flipped placement
   */
  function getOppositePlacement(placement) {
    var hash = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' }
    return placement.replace(/left|right|bottom|top/g, function(matched) {
      return hash[matched]
    })
  }

  /**
   * Get offsets to the popper
   * @method
   * @memberof Popper.Utils
   * @param {Object} position - CSS position the Popper will get applied
   * @param {HTMLElement} popper - the popper element
   * @param {Object} referenceOffsets - the reference offsets (the popper will be relative to this)
   * @param {String} placement - one of the valid placement options
   * @returns {Object} popperOffsets - An object containing the offsets which will be applied to the popper
   */
  function getPopperOffsets(popper, referenceOffsets, placement) {
    placement = placement.split('-')[0]

    // Get popper node sizes
    var popperRect = getOuterSizes(popper)

    // Add position, width and height to our offsets object
    var popperOffsets = {
      width: popperRect.width,
      height: popperRect.height,
    }

    // depending by the popper placement we have to compute its offsets slightly differently
    var isHoriz = ['right', 'left'].indexOf(placement) !== -1
    var mainSide = isHoriz ? 'top' : 'left'
    var secondarySide = isHoriz ? 'left' : 'top'
    var measurement = isHoriz ? 'height' : 'width'
    var secondaryMeasurement = !isHoriz ? 'height' : 'width'

    popperOffsets[mainSide] =
      referenceOffsets[mainSide] +
      referenceOffsets[measurement] / 2 -
      popperRect[measurement] / 2
    if (placement === secondarySide) {
      popperOffsets[secondarySide] =
        referenceOffsets[secondarySide] - popperRect[secondaryMeasurement]
    } else {
      popperOffsets[secondarySide] =
        referenceOffsets[getOppositePlacement(secondarySide)]
    }

    return popperOffsets
  }

  /**
   * Mimics the `find` method of Array
   * @method
   * @memberof Popper.Utils
   * @argument {Array} arr
   * @argument prop
   * @argument value
   * @returns index or -1
   */
  function find$2(arr, check) {
    // use native find if supported
    if (Array.prototype.find) {
      return arr.find(check)
    }

    // use `filter` to obtain the same behavior of `find`
    return arr.filter(check)[0]
  }

  /**
   * Return the index of the matching object
   * @method
   * @memberof Popper.Utils
   * @argument {Array} arr
   * @argument prop
   * @argument value
   * @returns index or -1
   */
  function findIndex$1(arr, prop, value) {
    // use native findIndex if supported
    if (Array.prototype.findIndex) {
      return arr.findIndex(function(cur) {
        return cur[prop] === value
      })
    }

    // use `find` + `indexOf` if `findIndex` isn't supported
    var match = find$2(arr, function(obj) {
      return obj[prop] === value
    })
    return arr.indexOf(match)
  }

  /**
   * Loop trough the list of modifiers and run them in order,
   * each of them will then edit the data object.
   * @method
   * @memberof Popper.Utils
   * @param {dataObject} data
   * @param {Array} modifiers
   * @param {String} ends - Optional modifier name used as stopper
   * @returns {dataObject}
   */
  function runModifiers(modifiers, data, ends) {
    var modifiersToRun =
      ends === undefined
        ? modifiers
        : modifiers.slice(0, findIndex$1(modifiers, 'name', ends))

    modifiersToRun.forEach(function(modifier) {
      if (modifier['function']) {
        // eslint-disable-line dot-notation
        console.warn('`modifier.function` is deprecated, use `modifier.fn`!')
      }
      var fn = modifier['function'] || modifier.fn // eslint-disable-line dot-notation
      if (modifier.enabled && isFunction$1(fn)) {
        // Add properties to offsets to make them a complete clientRect object
        // we do this before each modifier to make sure the previous one doesn't
        // mess with these values
        data.offsets.popper = getClientRect(data.offsets.popper)
        data.offsets.reference = getClientRect(data.offsets.reference)

        data = fn(data, modifier)
      }
    })

    return data
  }

  /**
   * Updates the position of the popper, computing the new offsets and applying
   * the new style.<br />
   * Prefer `scheduleUpdate` over `update` because of performance reasons.
   * @method
   * @memberof Popper
   */
  function update() {
    // if popper is destroyed, don't perform any further update
    if (this.state.isDestroyed) {
      return
    }

    var data = {
      instance: this,
      styles: {},
      arrowStyles: {},
      attributes: {},
      flipped: false,
      offsets: {},
    }

    // compute reference element offsets
    data.offsets.reference = getReferenceOffsets(
      this.state,
      this.popper,
      this.reference,
      this.options.positionFixed
    )

    // compute auto placement, store placement inside the data object,
    // modifiers will be able to edit `placement` if needed
    // and refer to originalPlacement to know the original value
    data.placement = computeAutoPlacement(
      this.options.placement,
      data.offsets.reference,
      this.popper,
      this.reference,
      this.options.modifiers.flip.boundariesElement,
      this.options.modifiers.flip.padding
    )

    // store the computed placement inside `originalPlacement`
    data.originalPlacement = data.placement

    data.positionFixed = this.options.positionFixed

    // compute the popper offsets
    data.offsets.popper = getPopperOffsets(
      this.popper,
      data.offsets.reference,
      data.placement
    )

    data.offsets.popper.position = this.options.positionFixed
      ? 'fixed'
      : 'absolute'

    // run the modifiers
    data = runModifiers(this.modifiers, data)

    // the first `update` will call `onCreate` callback
    // the other ones will call `onUpdate` callback
    if (!this.state.isCreated) {
      this.state.isCreated = true
      this.options.onCreate(data)
    } else {
      this.options.onUpdate(data)
    }
  }

  /**
   * Helper used to know if the given modifier is enabled.
   * @method
   * @memberof Popper.Utils
   * @returns {Boolean}
   */
  function isModifierEnabled(modifiers, modifierName) {
    return modifiers.some(function(_ref) {
      var name = _ref.name,
        enabled = _ref.enabled
      return enabled && name === modifierName
    })
  }

  /**
   * Get the prefixed supported property name
   * @method
   * @memberof Popper.Utils
   * @argument {String} property (camelCase)
   * @returns {String} prefixed property (camelCase or PascalCase, depending on the vendor prefix)
   */
  function getSupportedPropertyName(property) {
    var prefixes = [false, 'ms', 'Webkit', 'Moz', 'O']
    var upperProp = property.charAt(0).toUpperCase() + property.slice(1)

    for (var i = 0; i < prefixes.length; i++) {
      var prefix = prefixes[i]
      var toCheck = prefix ? '' + prefix + upperProp : property
      if (typeof document.body.style[toCheck] !== 'undefined') {
        return toCheck
      }
    }
    return null
  }

  /**
   * Destroys the popper.
   * @method
   * @memberof Popper
   */
  function destroy() {
    this.state.isDestroyed = true

    // touch DOM only if `applyStyle` modifier is enabled
    if (isModifierEnabled(this.modifiers, 'applyStyle')) {
      this.popper.removeAttribute('x-placement')
      this.popper.style.position = ''
      this.popper.style.top = ''
      this.popper.style.left = ''
      this.popper.style.right = ''
      this.popper.style.bottom = ''
      this.popper.style.willChange = ''
      this.popper.style[getSupportedPropertyName('transform')] = ''
    }

    this.disableEventListeners()

    // remove the popper if user explicity asked for the deletion on destroy
    // do not use `remove` because IE11 doesn't support it
    if (this.options.removeOnDestroy) {
      this.popper.parentNode.removeChild(this.popper)
    }
    return this
  }

  /**
   * Get the window associated with the element
   * @argument {Element} element
   * @returns {Window}
   */
  function getWindow(element) {
    var ownerDocument = element.ownerDocument
    return ownerDocument ? ownerDocument.defaultView : window
  }

  function attachToScrollParents(scrollParent, event, callback, scrollParents) {
    var isBody = scrollParent.nodeName === 'BODY'
    var target = isBody ? scrollParent.ownerDocument.defaultView : scrollParent
    target.addEventListener(event, callback, { passive: true })

    if (!isBody) {
      attachToScrollParents(
        getScrollParent(target.parentNode),
        event,
        callback,
        scrollParents
      )
    }
    scrollParents.push(target)
  }

  /**
   * Setup needed event listeners used to update the popper position
   * @method
   * @memberof Popper.Utils
   * @private
   */
  function setupEventListeners(reference, options, state, updateBound) {
    // Resize event listener on window
    state.updateBound = updateBound
    getWindow(reference).addEventListener('resize', state.updateBound, {
      passive: true,
    })

    // Scroll event listener on scroll parents
    var scrollElement = getScrollParent(reference)
    attachToScrollParents(
      scrollElement,
      'scroll',
      state.updateBound,
      state.scrollParents
    )
    state.scrollElement = scrollElement
    state.eventsEnabled = true

    return state
  }

  /**
   * It will add resize/scroll events and start recalculating
   * position of the popper element when they are triggered.
   * @method
   * @memberof Popper
   */
  function enableEventListeners() {
    if (!this.state.eventsEnabled) {
      this.state = setupEventListeners(
        this.reference,
        this.options,
        this.state,
        this.scheduleUpdate
      )
    }
  }

  /**
   * Remove event listeners used to update the popper position
   * @method
   * @memberof Popper.Utils
   * @private
   */
  function removeEventListeners(reference, state) {
    // Remove resize event listener on window
    getWindow(reference).removeEventListener('resize', state.updateBound)

    // Remove scroll event listener on scroll parents
    state.scrollParents.forEach(function(target) {
      target.removeEventListener('scroll', state.updateBound)
    })

    // Reset state
    state.updateBound = null
    state.scrollParents = []
    state.scrollElement = null
    state.eventsEnabled = false
    return state
  }

  /**
   * It will remove resize/scroll events and won't recalculate popper position
   * when they are triggered. It also won't trigger `onUpdate` callback anymore,
   * unless you call `update` method manually.
   * @method
   * @memberof Popper
   */
  function disableEventListeners() {
    if (this.state.eventsEnabled) {
      cancelAnimationFrame(this.scheduleUpdate)
      this.state = removeEventListeners(this.reference, this.state)
    }
  }

  /**
   * Tells if a given input is a number
   * @method
   * @memberof Popper.Utils
   * @param {*} input to check
   * @return {Boolean}
   */
  function isNumeric(n) {
    return n !== '' && !isNaN(parseFloat(n)) && isFinite(n)
  }

  /**
   * Set the style to the given popper
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element - Element to apply the style to
   * @argument {Object} styles
   * Object with a list of properties and values which will be applied to the element
   */
  function setStyles(element, styles) {
    Object.keys(styles).forEach(function(prop) {
      var unit = ''
      // add unit if the value is numeric and is one of the following
      if (
        ['width', 'height', 'top', 'right', 'bottom', 'left'].indexOf(prop) !==
          -1 &&
        isNumeric(styles[prop])
      ) {
        unit = 'px'
      }
      element.style[prop] = styles[prop] + unit
    })
  }

  /**
   * Set the attributes to the given popper
   * @method
   * @memberof Popper.Utils
   * @argument {Element} element - Element to apply the attributes to
   * @argument {Object} styles
   * Object with a list of properties and values which will be applied to the element
   */
  function setAttributes(element, attributes) {
    Object.keys(attributes).forEach(function(prop) {
      var value = attributes[prop]
      if (value !== false) {
        element.setAttribute(prop, attributes[prop])
      } else {
        element.removeAttribute(prop)
      }
    })
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by `update` method
   * @argument {Object} data.styles - List of style properties - values to apply to popper element
   * @argument {Object} data.attributes - List of attribute properties - values to apply to popper element
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The same data object
   */
  function applyStyle(data) {
    // any property present in `data.styles` will be applied to the popper,
    // in this way we can make the 3rd party modifiers add custom styles to it
    // Be aware, modifiers could override the properties defined in the previous
    // lines of this modifier!
    setStyles(data.instance.popper, data.styles)

    // any property present in `data.attributes` will be applied to the popper,
    // they will be set as HTML attributes of the element
    setAttributes(data.instance.popper, data.attributes)

    // if arrowElement is defined and arrowStyles has some properties
    if (data.arrowElement && Object.keys(data.arrowStyles).length) {
      setStyles(data.arrowElement, data.arrowStyles)
    }

    return data
  }

  /**
   * Set the x-placement attribute before everything else because it could be used
   * to add margins to the popper margins needs to be calculated to get the
   * correct popper offsets.
   * @method
   * @memberof Popper.modifiers
   * @param {HTMLElement} reference - The reference element used to position the popper
   * @param {HTMLElement} popper - The HTML element used as popper
   * @param {Object} options - Popper.js options
   */
  function applyStyleOnLoad(
    reference,
    popper,
    options,
    modifierOptions,
    state
  ) {
    // compute reference element offsets
    var referenceOffsets = getReferenceOffsets(
      state,
      popper,
      reference,
      options.positionFixed
    )

    // compute auto placement, store placement inside the data object,
    // modifiers will be able to edit `placement` if needed
    // and refer to originalPlacement to know the original value
    var placement = computeAutoPlacement(
      options.placement,
      referenceOffsets,
      popper,
      reference,
      options.modifiers.flip.boundariesElement,
      options.modifiers.flip.padding
    )

    popper.setAttribute('x-placement', placement)

    // Apply `position` to popper before anything else because
    // without the position applied we can't guarantee correct computations
    setStyles(popper, {
      position: options.positionFixed ? 'fixed' : 'absolute',
    })

    return options
  }

  /**
   * @function
   * @memberof Popper.Utils
   * @argument {Object} data - The data object generated by `update` method
   * @argument {Boolean} shouldRound - If the offsets should be rounded at all
   * @returns {Object} The popper's position offsets rounded
   *
   * The tale of pixel-perfect positioning. It's still not 100% perfect, but as
   * good as it can be within reason.
   * Discussion here: https://github.com/FezVrasta/popper.js/pull/715
   *
   * Low DPI screens cause a popper to be blurry if not using full pixels (Safari
   * as well on High DPI screens).
   *
   * Firefox prefers no rounding for positioning and does not have blurriness on
   * high DPI screens.
   *
   * Only horizontal placement and left/right values need to be considered.
   */
  function getRoundedOffsets(data, shouldRound) {
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference
    var round = Math.round,
      floor = Math.floor

    var noRound = function noRound(v) {
      return v
    }

    var referenceWidth = round(reference.width)
    var popperWidth = round(popper.width)

    var isVertical = ['left', 'right'].indexOf(data.placement) !== -1
    var isVariation = data.placement.indexOf('-') !== -1
    var sameWidthParity = referenceWidth % 2 === popperWidth % 2
    var bothOddWidth = referenceWidth % 2 === 1 && popperWidth % 2 === 1

    var horizontalToInteger = !shouldRound
      ? noRound
      : isVertical || isVariation || sameWidthParity
      ? round
      : floor
    var verticalToInteger = !shouldRound ? noRound : round

    return {
      left: horizontalToInteger(
        bothOddWidth && !isVariation && shouldRound
          ? popper.left - 1
          : popper.left
      ),
      top: verticalToInteger(popper.top),
      bottom: verticalToInteger(popper.bottom),
      right: horizontalToInteger(popper.right),
    }
  }

  var isFirefox = isBrowser && /Firefox/i.test(navigator.userAgent)

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by `update` method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function computeStyle(data, options) {
    var x = options.x,
      y = options.y
    var popper = data.offsets.popper

    // Remove this legacy support in Popper.js v2

    var legacyGpuAccelerationOption = find$2(data.instance.modifiers, function(
      modifier
    ) {
      return modifier.name === 'applyStyle'
    }).gpuAcceleration
    if (legacyGpuAccelerationOption !== undefined) {
      console.warn(
        'WARNING: `gpuAcceleration` option moved to `computeStyle` modifier and will not be supported in future versions of Popper.js!'
      )
    }
    var gpuAcceleration =
      legacyGpuAccelerationOption !== undefined
        ? legacyGpuAccelerationOption
        : options.gpuAcceleration

    var offsetParent = getOffsetParent(data.instance.popper)
    var offsetParentRect = getBoundingClientRect(offsetParent)

    // Styles
    var styles = {
      position: popper.position,
    }

    var offsets = getRoundedOffsets(
      data,
      window.devicePixelRatio < 2 || !isFirefox
    )

    var sideA = x === 'bottom' ? 'top' : 'bottom'
    var sideB = y === 'right' ? 'left' : 'right'

    // if gpuAcceleration is set to `true` and transform is supported,
    //  we use `translate3d` to apply the position to the popper we
    // automatically use the supported prefixed version if needed
    var prefixedProperty = getSupportedPropertyName('transform')

    // now, let's make a step back and look at this code closely (wtf?)
    // If the content of the popper grows once it's been positioned, it
    // may happen that the popper gets misplaced because of the new content
    // overflowing its reference element
    // To avoid this problem, we provide two options (x and y), which allow
    // the consumer to define the offset origin.
    // If we position a popper on top of a reference element, we can set
    // `x` to `top` to make the popper grow towards its top instead of
    // its bottom.
    var left = void 0,
      top = void 0
    if (sideA === 'bottom') {
      // when offsetParent is <html> the positioning is relative to the bottom of the screen (excluding the scrollbar)
      // and not the bottom of the html element
      if (offsetParent.nodeName === 'HTML') {
        top = -offsetParent.clientHeight + offsets.bottom
      } else {
        top = -offsetParentRect.height + offsets.bottom
      }
    } else {
      top = offsets.top
    }
    if (sideB === 'right') {
      if (offsetParent.nodeName === 'HTML') {
        left = -offsetParent.clientWidth + offsets.right
      } else {
        left = -offsetParentRect.width + offsets.right
      }
    } else {
      left = offsets.left
    }
    if (gpuAcceleration && prefixedProperty) {
      styles[prefixedProperty] = 'translate3d(' + left + 'px, ' + top + 'px, 0)'
      styles[sideA] = 0
      styles[sideB] = 0
      styles.willChange = 'transform'
    } else {
      // othwerise, we use the standard `top`, `left`, `bottom` and `right` properties
      var invertTop = sideA === 'bottom' ? -1 : 1
      var invertLeft = sideB === 'right' ? -1 : 1
      styles[sideA] = top * invertTop
      styles[sideB] = left * invertLeft
      styles.willChange = sideA + ', ' + sideB
    }

    // Attributes
    var attributes = {
      'x-placement': data.placement,
    }

    // Update `data` attributes, styles and arrowStyles
    data.attributes = _extends$4({}, attributes, data.attributes)
    data.styles = _extends$4({}, styles, data.styles)
    data.arrowStyles = _extends$4({}, data.offsets.arrow, data.arrowStyles)

    return data
  }

  /**
   * Helper used to know if the given modifier depends from another one.<br />
   * It checks if the needed modifier is listed and enabled.
   * @method
   * @memberof Popper.Utils
   * @param {Array} modifiers - list of modifiers
   * @param {String} requestingName - name of requesting modifier
   * @param {String} requestedName - name of requested modifier
   * @returns {Boolean}
   */
  function isModifierRequired(modifiers, requestingName, requestedName) {
    var requesting = find$2(modifiers, function(_ref) {
      var name = _ref.name
      return name === requestingName
    })

    var isRequired =
      !!requesting &&
      modifiers.some(function(modifier) {
        return (
          modifier.name === requestedName &&
          modifier.enabled &&
          modifier.order < requesting.order
        )
      })

    if (!isRequired) {
      var _requesting = '`' + requestingName + '`'
      var requested = '`' + requestedName + '`'
      console.warn(
        requested +
          ' modifier is required by ' +
          _requesting +
          ' modifier in order to work, be sure to include it before ' +
          _requesting +
          '!'
      )
    }
    return isRequired
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by update method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function arrow(data, options) {
    var _data$offsets$arrow

    // arrow depends on keepTogether in order to work
    if (!isModifierRequired(data.instance.modifiers, 'arrow', 'keepTogether')) {
      return data
    }

    var arrowElement = options.element

    // if arrowElement is a string, suppose it's a CSS selector
    if (typeof arrowElement === 'string') {
      arrowElement = data.instance.popper.querySelector(arrowElement)

      // if arrowElement is not found, don't run the modifier
      if (!arrowElement) {
        return data
      }
    } else {
      // if the arrowElement isn't a query selector we must check that the
      // provided DOM node is child of its popper node
      if (!data.instance.popper.contains(arrowElement)) {
        console.warn(
          'WARNING: `arrow.element` must be child of its popper element!'
        )
        return data
      }
    }

    var placement = data.placement.split('-')[0]
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference

    var isVertical = ['left', 'right'].indexOf(placement) !== -1

    var len = isVertical ? 'height' : 'width'
    var sideCapitalized = isVertical ? 'Top' : 'Left'
    var side = sideCapitalized.toLowerCase()
    var altSide = isVertical ? 'left' : 'top'
    var opSide = isVertical ? 'bottom' : 'right'
    var arrowElementSize = getOuterSizes(arrowElement)[len]

    //
    // extends keepTogether behavior making sure the popper and its
    // reference have enough pixels in conjunction
    //

    // top/left side
    if (reference[opSide] - arrowElementSize < popper[side]) {
      data.offsets.popper[side] -=
        popper[side] - (reference[opSide] - arrowElementSize)
    }
    // bottom/right side
    if (reference[side] + arrowElementSize > popper[opSide]) {
      data.offsets.popper[side] +=
        reference[side] + arrowElementSize - popper[opSide]
    }
    data.offsets.popper = getClientRect(data.offsets.popper)

    // compute center of the popper
    var center = reference[side] + reference[len] / 2 - arrowElementSize / 2

    // Compute the sideValue using the updated popper offsets
    // take popper margin in account because we don't have this info available
    var css = getStyleComputedProperty(data.instance.popper)
    var popperMarginSide = parseFloat(css['margin' + sideCapitalized], 10)
    var popperBorderSide = parseFloat(
      css['border' + sideCapitalized + 'Width'],
      10
    )
    var sideValue =
      center - data.offsets.popper[side] - popperMarginSide - popperBorderSide

    // prevent arrowElement from being placed not contiguously to its popper
    sideValue = Math.max(Math.min(popper[len] - arrowElementSize, sideValue), 0)

    data.arrowElement = arrowElement
    data.offsets.arrow = ((_data$offsets$arrow = {}),
    defineProperty$c(_data$offsets$arrow, side, Math.round(sideValue)),
    defineProperty$c(_data$offsets$arrow, altSide, ''),
    _data$offsets$arrow)

    return data
  }

  /**
   * Get the opposite placement variation of the given one
   * @method
   * @memberof Popper.Utils
   * @argument {String} placement variation
   * @returns {String} flipped placement variation
   */
  function getOppositeVariation(variation) {
    if (variation === 'end') {
      return 'start'
    } else if (variation === 'start') {
      return 'end'
    }
    return variation
  }

  /**
   * List of accepted placements to use as values of the `placement` option.<br />
   * Valid placements are:
   * - `auto`
   * - `top`
   * - `right`
   * - `bottom`
   * - `left`
   *
   * Each placement can have a variation from this list:
   * - `-start`
   * - `-end`
   *
   * Variations are interpreted easily if you think of them as the left to right
   * written languages. Horizontally (`top` and `bottom`), `start` is left and `end`
   * is right.<br />
   * Vertically (`left` and `right`), `start` is top and `end` is bottom.
   *
   * Some valid examples are:
   * - `top-end` (on top of reference, right aligned)
   * - `right-start` (on right of reference, top aligned)
   * - `bottom` (on bottom, centered)
   * - `auto-end` (on the side with more space available, alignment depends by placement)
   *
   * @static
   * @type {Array}
   * @enum {String}
   * @readonly
   * @method placements
   * @memberof Popper
   */
  var placements = [
    'auto-start',
    'auto',
    'auto-end',
    'top-start',
    'top',
    'top-end',
    'right-start',
    'right',
    'right-end',
    'bottom-end',
    'bottom',
    'bottom-start',
    'left-end',
    'left',
    'left-start',
  ]

  // Get rid of `auto` `auto-start` and `auto-end`
  var validPlacements = placements.slice(3)

  /**
   * Given an initial placement, returns all the subsequent placements
   * clockwise (or counter-clockwise).
   *
   * @method
   * @memberof Popper.Utils
   * @argument {String} placement - A valid placement (it accepts variations)
   * @argument {Boolean} counter - Set to true to walk the placements counterclockwise
   * @returns {Array} placements including their variations
   */
  function clockwise(placement) {
    var counter =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false

    var index = validPlacements.indexOf(placement)
    var arr = validPlacements
      .slice(index + 1)
      .concat(validPlacements.slice(0, index))
    return counter ? arr.reverse() : arr
  }

  var BEHAVIORS = {
    FLIP: 'flip',
    CLOCKWISE: 'clockwise',
    COUNTERCLOCKWISE: 'counterclockwise',
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by update method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function flip(data, options) {
    // if `inner` modifier is enabled, we can't use the `flip` modifier
    if (isModifierEnabled(data.instance.modifiers, 'inner')) {
      return data
    }

    if (data.flipped && data.placement === data.originalPlacement) {
      // seems like flip is trying to loop, probably there's not enough space on any of the flippable sides
      return data
    }

    var boundaries = getBoundaries(
      data.instance.popper,
      data.instance.reference,
      options.padding,
      options.boundariesElement,
      data.positionFixed
    )

    var placement = data.placement.split('-')[0]
    var placementOpposite = getOppositePlacement(placement)
    var variation = data.placement.split('-')[1] || ''

    var flipOrder = []

    switch (options.behavior) {
      case BEHAVIORS.FLIP:
        flipOrder = [placement, placementOpposite]
        break
      case BEHAVIORS.CLOCKWISE:
        flipOrder = clockwise(placement)
        break
      case BEHAVIORS.COUNTERCLOCKWISE:
        flipOrder = clockwise(placement, true)
        break
      default:
        flipOrder = options.behavior
    }

    flipOrder.forEach(function(step, index) {
      if (placement !== step || flipOrder.length === index + 1) {
        return data
      }

      placement = data.placement.split('-')[0]
      placementOpposite = getOppositePlacement(placement)

      var popperOffsets = data.offsets.popper
      var refOffsets = data.offsets.reference

      // using floor because the reference offsets may contain decimals we are not going to consider here
      var floor = Math.floor
      var overlapsRef =
        (placement === 'left' &&
          floor(popperOffsets.right) > floor(refOffsets.left)) ||
        (placement === 'right' &&
          floor(popperOffsets.left) < floor(refOffsets.right)) ||
        (placement === 'top' &&
          floor(popperOffsets.bottom) > floor(refOffsets.top)) ||
        (placement === 'bottom' &&
          floor(popperOffsets.top) < floor(refOffsets.bottom))

      var overflowsLeft = floor(popperOffsets.left) < floor(boundaries.left)
      var overflowsRight = floor(popperOffsets.right) > floor(boundaries.right)
      var overflowsTop = floor(popperOffsets.top) < floor(boundaries.top)
      var overflowsBottom =
        floor(popperOffsets.bottom) > floor(boundaries.bottom)

      var overflowsBoundaries =
        (placement === 'left' && overflowsLeft) ||
        (placement === 'right' && overflowsRight) ||
        (placement === 'top' && overflowsTop) ||
        (placement === 'bottom' && overflowsBottom)

      // flip the variation if required
      var isVertical = ['top', 'bottom'].indexOf(placement) !== -1

      // flips variation if reference element overflows boundaries
      var flippedVariationByRef =
        !!options.flipVariations &&
        ((isVertical && variation === 'start' && overflowsLeft) ||
          (isVertical && variation === 'end' && overflowsRight) ||
          (!isVertical && variation === 'start' && overflowsTop) ||
          (!isVertical && variation === 'end' && overflowsBottom))

      // flips variation if popper content overflows boundaries
      var flippedVariationByContent =
        !!options.flipVariationsByContent &&
        ((isVertical && variation === 'start' && overflowsRight) ||
          (isVertical && variation === 'end' && overflowsLeft) ||
          (!isVertical && variation === 'start' && overflowsBottom) ||
          (!isVertical && variation === 'end' && overflowsTop))

      var flippedVariation = flippedVariationByRef || flippedVariationByContent

      if (overlapsRef || overflowsBoundaries || flippedVariation) {
        // this boolean to detect any flip loop
        data.flipped = true

        if (overlapsRef || overflowsBoundaries) {
          placement = flipOrder[index + 1]
        }

        if (flippedVariation) {
          variation = getOppositeVariation(variation)
        }

        data.placement = placement + (variation ? '-' + variation : '')

        // this object contains `position`, we want to preserve it along with
        // any additional property we may add in the future
        data.offsets.popper = _extends$4(
          {},
          data.offsets.popper,
          getPopperOffsets(
            data.instance.popper,
            data.offsets.reference,
            data.placement
          )
        )

        data = runModifiers(data.instance.modifiers, data, 'flip')
      }
    })
    return data
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by update method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function keepTogether(data) {
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference

    var placement = data.placement.split('-')[0]
    var floor = Math.floor
    var isVertical = ['top', 'bottom'].indexOf(placement) !== -1
    var side = isVertical ? 'right' : 'bottom'
    var opSide = isVertical ? 'left' : 'top'
    var measurement = isVertical ? 'width' : 'height'

    if (popper[side] < floor(reference[opSide])) {
      data.offsets.popper[opSide] =
        floor(reference[opSide]) - popper[measurement]
    }
    if (popper[opSide] > floor(reference[side])) {
      data.offsets.popper[opSide] = floor(reference[side])
    }

    return data
  }

  /**
   * Converts a string containing value + unit into a px value number
   * @function
   * @memberof {modifiers~offset}
   * @private
   * @argument {String} str - Value + unit string
   * @argument {String} measurement - `height` or `width`
   * @argument {Object} popperOffsets
   * @argument {Object} referenceOffsets
   * @returns {Number|String}
   * Value in pixels, or original string if no values were extracted
   */
  function toValue(str, measurement, popperOffsets, referenceOffsets) {
    // separate value from unit
    var split = str.match(/((?:\-|\+)?\d*\.?\d*)(.*)/)
    var value = +split[1]
    var unit = split[2]

    // If it's not a number it's an operator, I guess
    if (!value) {
      return str
    }

    if (unit.indexOf('%') === 0) {
      var element = void 0
      switch (unit) {
        case '%p':
          element = popperOffsets
          break
        case '%':
        case '%r':
        default:
          element = referenceOffsets
      }

      var rect = getClientRect(element)
      return (rect[measurement] / 100) * value
    } else if (unit === 'vh' || unit === 'vw') {
      // if is a vh or vw, we calculate the size based on the viewport
      var size = void 0
      if (unit === 'vh') {
        size = Math.max(
          document.documentElement.clientHeight,
          window.innerHeight || 0
        )
      } else {
        size = Math.max(
          document.documentElement.clientWidth,
          window.innerWidth || 0
        )
      }
      return (size / 100) * value
    } else {
      // if is an explicit pixel unit, we get rid of the unit and keep the value
      // if is an implicit unit, it's px, and we return just the value
      return value
    }
  }

  /**
   * Parse an `offset` string to extrapolate `x` and `y` numeric offsets.
   * @function
   * @memberof {modifiers~offset}
   * @private
   * @argument {String} offset
   * @argument {Object} popperOffsets
   * @argument {Object} referenceOffsets
   * @argument {String} basePlacement
   * @returns {Array} a two cells array with x and y offsets in numbers
   */
  function parseOffset(offset, popperOffsets, referenceOffsets, basePlacement) {
    var offsets = [0, 0]

    // Use height if placement is left or right and index is 0 otherwise use width
    // in this way the first offset will use an axis and the second one
    // will use the other one
    var useHeight = ['right', 'left'].indexOf(basePlacement) !== -1

    // Split the offset string to obtain a list of values and operands
    // The regex addresses values with the plus or minus sign in front (+10, -20, etc)
    var fragments = offset.split(/(\+|\-)/).map(function(frag) {
      return frag.trim()
    })

    // Detect if the offset string contains a pair of values or a single one
    // they could be separated by comma or space
    var divider = fragments.indexOf(
      find$2(fragments, function(frag) {
        return frag.search(/,|\s/) !== -1
      })
    )

    if (fragments[divider] && fragments[divider].indexOf(',') === -1) {
      console.warn(
        'Offsets separated by white space(s) are deprecated, use a comma (,) instead.'
      )
    }

    // If divider is found, we divide the list of values and operands to divide
    // them by ofset X and Y.
    var splitRegex = /\s*,\s*|\s+/
    var ops =
      divider !== -1
        ? [
            fragments
              .slice(0, divider)
              .concat([fragments[divider].split(splitRegex)[0]]),
            [fragments[divider].split(splitRegex)[1]].concat(
              fragments.slice(divider + 1)
            ),
          ]
        : [fragments]

    // Convert the values with units to absolute pixels to allow our computations
    ops = ops.map(function(op, index) {
      // Most of the units rely on the orientation of the popper
      var measurement = (index === 1
      ? !useHeight
      : useHeight)
        ? 'height'
        : 'width'
      var mergeWithPrevious = false
      return (
        op
          // This aggregates any `+` or `-` sign that aren't considered operators
          // e.g.: 10 + +5 => [10, +, +5]
          .reduce(function(a, b) {
            if (a[a.length - 1] === '' && ['+', '-'].indexOf(b) !== -1) {
              a[a.length - 1] = b
              mergeWithPrevious = true
              return a
            } else if (mergeWithPrevious) {
              a[a.length - 1] += b
              mergeWithPrevious = false
              return a
            } else {
              return a.concat(b)
            }
          }, [])
          // Here we convert the string values into number values (in px)
          .map(function(str) {
            return toValue(str, measurement, popperOffsets, referenceOffsets)
          })
      )
    })

    // Loop trough the offsets arrays and execute the operations
    ops.forEach(function(op, index) {
      op.forEach(function(frag, index2) {
        if (isNumeric(frag)) {
          offsets[index] += frag * (op[index2 - 1] === '-' ? -1 : 1)
        }
      })
    })
    return offsets
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by update method
   * @argument {Object} options - Modifiers configuration and options
   * @argument {Number|String} options.offset=0
   * The offset value as described in the modifier description
   * @returns {Object} The data object, properly modified
   */
  function offset$1(data, _ref) {
    var offset = _ref.offset
    var placement = data.placement,
      _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference

    var basePlacement = placement.split('-')[0]

    var offsets = void 0
    if (isNumeric(+offset)) {
      offsets = [+offset, 0]
    } else {
      offsets = parseOffset(offset, popper, reference, basePlacement)
    }

    if (basePlacement === 'left') {
      popper.top += offsets[0]
      popper.left -= offsets[1]
    } else if (basePlacement === 'right') {
      popper.top += offsets[0]
      popper.left += offsets[1]
    } else if (basePlacement === 'top') {
      popper.left += offsets[0]
      popper.top -= offsets[1]
    } else if (basePlacement === 'bottom') {
      popper.left += offsets[0]
      popper.top += offsets[1]
    }

    data.popper = popper
    return data
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by `update` method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function preventOverflow(data, options) {
    var boundariesElement =
      options.boundariesElement || getOffsetParent(data.instance.popper)

    // If offsetParent is the reference element, we really want to
    // go one step up and use the next offsetParent as reference to
    // avoid to make this modifier completely useless and look like broken
    if (data.instance.reference === boundariesElement) {
      boundariesElement = getOffsetParent(boundariesElement)
    }

    // NOTE: DOM access here
    // resets the popper's position so that the document size can be calculated excluding
    // the size of the popper element itself
    var transformProp = getSupportedPropertyName('transform')
    var popperStyles = data.instance.popper.style // assignment to help minification
    var top = popperStyles.top,
      left = popperStyles.left,
      transform = popperStyles[transformProp]

    popperStyles.top = ''
    popperStyles.left = ''
    popperStyles[transformProp] = ''

    var boundaries = getBoundaries(
      data.instance.popper,
      data.instance.reference,
      options.padding,
      boundariesElement,
      data.positionFixed
    )

    // NOTE: DOM access here
    // restores the original style properties after the offsets have been computed
    popperStyles.top = top
    popperStyles.left = left
    popperStyles[transformProp] = transform

    options.boundaries = boundaries

    var order = options.priority
    var popper = data.offsets.popper

    var check = {
      primary: function primary(placement) {
        var value = popper[placement]
        if (
          popper[placement] < boundaries[placement] &&
          !options.escapeWithReference
        ) {
          value = Math.max(popper[placement], boundaries[placement])
        }
        return defineProperty$c({}, placement, value)
      },
      secondary: function secondary(placement) {
        var mainSide = placement === 'right' ? 'left' : 'top'
        var value = popper[mainSide]
        if (
          popper[placement] > boundaries[placement] &&
          !options.escapeWithReference
        ) {
          value = Math.min(
            popper[mainSide],
            boundaries[placement] -
              (placement === 'right' ? popper.width : popper.height)
          )
        }
        return defineProperty$c({}, mainSide, value)
      },
    }

    order.forEach(function(placement) {
      var side =
        ['left', 'top'].indexOf(placement) !== -1 ? 'primary' : 'secondary'
      popper = _extends$4({}, popper, check[side](placement))
    })

    data.offsets.popper = popper

    return data
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by `update` method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function shift(data) {
    var placement = data.placement
    var basePlacement = placement.split('-')[0]
    var shiftvariation = placement.split('-')[1]

    // if shift shiftvariation is specified, run the modifier
    if (shiftvariation) {
      var _data$offsets = data.offsets,
        reference = _data$offsets.reference,
        popper = _data$offsets.popper

      var isVertical = ['bottom', 'top'].indexOf(basePlacement) !== -1
      var side = isVertical ? 'left' : 'top'
      var measurement = isVertical ? 'width' : 'height'

      var shiftOffsets = {
        start: defineProperty$c({}, side, reference[side]),
        end: defineProperty$c(
          {},
          side,
          reference[side] + reference[measurement] - popper[measurement]
        ),
      }

      data.offsets.popper = _extends$4({}, popper, shiftOffsets[shiftvariation])
    }

    return data
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by update method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function hide(data) {
    if (
      !isModifierRequired(data.instance.modifiers, 'hide', 'preventOverflow')
    ) {
      return data
    }

    var refRect = data.offsets.reference
    var bound = find$2(data.instance.modifiers, function(modifier) {
      return modifier.name === 'preventOverflow'
    }).boundaries

    if (
      refRect.bottom < bound.top ||
      refRect.left > bound.right ||
      refRect.top > bound.bottom ||
      refRect.right < bound.left
    ) {
      // Avoid unnecessary DOM access if visibility hasn't changed
      if (data.hide === true) {
        return data
      }

      data.hide = true
      data.attributes['x-out-of-boundaries'] = ''
    } else {
      // Avoid unnecessary DOM access if visibility hasn't changed
      if (data.hide === false) {
        return data
      }

      data.hide = false
      data.attributes['x-out-of-boundaries'] = false
    }

    return data
  }

  /**
   * @function
   * @memberof Modifiers
   * @argument {Object} data - The data object generated by `update` method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {Object} The data object, properly modified
   */
  function inner(data) {
    var placement = data.placement
    var basePlacement = placement.split('-')[0]
    var _data$offsets = data.offsets,
      popper = _data$offsets.popper,
      reference = _data$offsets.reference

    var isHoriz = ['left', 'right'].indexOf(basePlacement) !== -1

    var subtractLength = ['top', 'left'].indexOf(basePlacement) === -1

    popper[isHoriz ? 'left' : 'top'] =
      reference[basePlacement] -
      (subtractLength ? popper[isHoriz ? 'width' : 'height'] : 0)

    data.placement = getOppositePlacement(placement)
    data.offsets.popper = getClientRect(popper)

    return data
  }

  /**
   * Modifier function, each modifier can have a function of this type assigned
   * to its `fn` property.<br />
   * These functions will be called on each update, this means that you must
   * make sure they are performant enough to avoid performance bottlenecks.
   *
   * @function ModifierFn
   * @argument {dataObject} data - The data object generated by `update` method
   * @argument {Object} options - Modifiers configuration and options
   * @returns {dataObject} The data object, properly modified
   */

  /**
   * Modifiers are plugins used to alter the behavior of your poppers.<br />
   * Popper.js uses a set of 9 modifiers to provide all the basic functionalities
   * needed by the library.
   *
   * Usually you don't want to override the `order`, `fn` and `onLoad` props.
   * All the other properties are configurations that could be tweaked.
   * @namespace modifiers
   */
  var modifiers = {
    /**
     * Modifier used to shift the popper on the start or end of its reference
     * element.<br />
     * It will read the variation of the `placement` property.<br />
     * It can be one either `-end` or `-start`.
     * @memberof modifiers
     * @inner
     */
    shift: {
      /** @prop {number} order=100 - Index used to define the order of execution */
      order: 100,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: shift,
    },

    /**
     * The `offset` modifier can shift your popper on both its axis.
     *
     * It accepts the following units:
     * - `px` or unit-less, interpreted as pixels
     * - `%` or `%r`, percentage relative to the length of the reference element
     * - `%p`, percentage relative to the length of the popper element
     * - `vw`, CSS viewport width unit
     * - `vh`, CSS viewport height unit
     *
     * For length is intended the main axis relative to the placement of the popper.<br />
     * This means that if the placement is `top` or `bottom`, the length will be the
     * `width`. In case of `left` or `right`, it will be the `height`.
     *
     * You can provide a single value (as `Number` or `String`), or a pair of values
     * as `String` divided by a comma or one (or more) white spaces.<br />
     * The latter is a deprecated method because it leads to confusion and will be
     * removed in v2.<br />
     * Additionally, it accepts additions and subtractions between different units.
     * Note that multiplications and divisions aren't supported.
     *
     * Valid examples are:
     * ```
     * 10
     * '10%'
     * '10, 10'
     * '10%, 10'
     * '10 + 10%'
     * '10 - 5vh + 3%'
     * '-10px + 5vh, 5px - 6%'
     * ```
     * > **NB**: If you desire to apply offsets to your poppers in a way that may make them overlap
     * > with their reference element, unfortunately, you will have to disable the `flip` modifier.
     * > You can read more on this at this [issue](https://github.com/FezVrasta/popper.js/issues/373).
     *
     * @memberof modifiers
     * @inner
     */
    offset: {
      /** @prop {number} order=200 - Index used to define the order of execution */
      order: 200,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: offset$1,
      /** @prop {Number|String} offset=0
       * The offset value as described in the modifier description
       */
      offset: 0,
    },

    /**
     * Modifier used to prevent the popper from being positioned outside the boundary.
     *
     * A scenario exists where the reference itself is not within the boundaries.<br />
     * We can say it has "escaped the boundaries" — or just "escaped".<br />
     * In this case we need to decide whether the popper should either:
     *
     * - detach from the reference and remain "trapped" in the boundaries, or
     * - if it should ignore the boundary and "escape with its reference"
     *
     * When `escapeWithReference` is set to`true` and reference is completely
     * outside its boundaries, the popper will overflow (or completely leave)
     * the boundaries in order to remain attached to the edge of the reference.
     *
     * @memberof modifiers
     * @inner
     */
    preventOverflow: {
      /** @prop {number} order=300 - Index used to define the order of execution */
      order: 300,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: preventOverflow,
      /**
       * @prop {Array} [priority=['left','right','top','bottom']]
       * Popper will try to prevent overflow following these priorities by default,
       * then, it could overflow on the left and on top of the `boundariesElement`
       */
      priority: ['left', 'right', 'top', 'bottom'],
      /**
       * @prop {number} padding=5
       * Amount of pixel used to define a minimum distance between the boundaries
       * and the popper. This makes sure the popper always has a little padding
       * between the edges of its container
       */
      padding: 5,
      /**
       * @prop {String|HTMLElement} boundariesElement='scrollParent'
       * Boundaries used by the modifier. Can be `scrollParent`, `window`,
       * `viewport` or any DOM element.
       */
      boundariesElement: 'scrollParent',
    },

    /**
     * Modifier used to make sure the reference and its popper stay near each other
     * without leaving any gap between the two. Especially useful when the arrow is
     * enabled and you want to ensure that it points to its reference element.
     * It cares only about the first axis. You can still have poppers with margin
     * between the popper and its reference element.
     * @memberof modifiers
     * @inner
     */
    keepTogether: {
      /** @prop {number} order=400 - Index used to define the order of execution */
      order: 400,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: keepTogether,
    },

    /**
     * This modifier is used to move the `arrowElement` of the popper to make
     * sure it is positioned between the reference element and its popper element.
     * It will read the outer size of the `arrowElement` node to detect how many
     * pixels of conjunction are needed.
     *
     * It has no effect if no `arrowElement` is provided.
     * @memberof modifiers
     * @inner
     */
    arrow: {
      /** @prop {number} order=500 - Index used to define the order of execution */
      order: 500,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: arrow,
      /** @prop {String|HTMLElement} element='[x-arrow]' - Selector or node used as arrow */
      element: '[x-arrow]',
    },

    /**
     * Modifier used to flip the popper's placement when it starts to overlap its
     * reference element.
     *
     * Requires the `preventOverflow` modifier before it in order to work.
     *
     * **NOTE:** this modifier will interrupt the current update cycle and will
     * restart it if it detects the need to flip the placement.
     * @memberof modifiers
     * @inner
     */
    flip: {
      /** @prop {number} order=600 - Index used to define the order of execution */
      order: 600,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: flip,
      /**
       * @prop {String|Array} behavior='flip'
       * The behavior used to change the popper's placement. It can be one of
       * `flip`, `clockwise`, `counterclockwise` or an array with a list of valid
       * placements (with optional variations)
       */
      behavior: 'flip',
      /**
       * @prop {number} padding=5
       * The popper will flip if it hits the edges of the `boundariesElement`
       */
      padding: 5,
      /**
       * @prop {String|HTMLElement} boundariesElement='viewport'
       * The element which will define the boundaries of the popper position.
       * The popper will never be placed outside of the defined boundaries
       * (except if `keepTogether` is enabled)
       */
      boundariesElement: 'viewport',
      /**
       * @prop {Boolean} flipVariations=false
       * The popper will switch placement variation between `-start` and `-end` when
       * the reference element overlaps its boundaries.
       *
       * The original placement should have a set variation.
       */
      flipVariations: false,
      /**
       * @prop {Boolean} flipVariationsByContent=false
       * The popper will switch placement variation between `-start` and `-end` when
       * the popper element overlaps its reference boundaries.
       *
       * The original placement should have a set variation.
       */
      flipVariationsByContent: false,
    },

    /**
     * Modifier used to make the popper flow toward the inner of the reference element.
     * By default, when this modifier is disabled, the popper will be placed outside
     * the reference element.
     * @memberof modifiers
     * @inner
     */
    inner: {
      /** @prop {number} order=700 - Index used to define the order of execution */
      order: 700,
      /** @prop {Boolean} enabled=false - Whether the modifier is enabled or not */
      enabled: false,
      /** @prop {ModifierFn} */
      fn: inner,
    },

    /**
     * Modifier used to hide the popper when its reference element is outside of the
     * popper boundaries. It will set a `x-out-of-boundaries` attribute which can
     * be used to hide with a CSS selector the popper when its reference is
     * out of boundaries.
     *
     * Requires the `preventOverflow` modifier before it in order to work.
     * @memberof modifiers
     * @inner
     */
    hide: {
      /** @prop {number} order=800 - Index used to define the order of execution */
      order: 800,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: hide,
    },

    /**
     * Computes the style that will be applied to the popper element to gets
     * properly positioned.
     *
     * Note that this modifier will not touch the DOM, it just prepares the styles
     * so that `applyStyle` modifier can apply it. This separation is useful
     * in case you need to replace `applyStyle` with a custom implementation.
     *
     * This modifier has `850` as `order` value to maintain backward compatibility
     * with previous versions of Popper.js. Expect the modifiers ordering method
     * to change in future major versions of the library.
     *
     * @memberof modifiers
     * @inner
     */
    computeStyle: {
      /** @prop {number} order=850 - Index used to define the order of execution */
      order: 850,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: computeStyle,
      /**
       * @prop {Boolean} gpuAcceleration=true
       * If true, it uses the CSS 3D transformation to position the popper.
       * Otherwise, it will use the `top` and `left` properties
       */
      gpuAcceleration: true,
      /**
       * @prop {string} [x='bottom']
       * Where to anchor the X axis (`bottom` or `top`). AKA X offset origin.
       * Change this if your popper should grow in a direction different from `bottom`
       */
      x: 'bottom',
      /**
       * @prop {string} [x='left']
       * Where to anchor the Y axis (`left` or `right`). AKA Y offset origin.
       * Change this if your popper should grow in a direction different from `right`
       */
      y: 'right',
    },

    /**
     * Applies the computed styles to the popper element.
     *
     * All the DOM manipulations are limited to this modifier. This is useful in case
     * you want to integrate Popper.js inside a framework or view library and you
     * want to delegate all the DOM manipulations to it.
     *
     * Note that if you disable this modifier, you must make sure the popper element
     * has its position set to `absolute` before Popper.js can do its work!
     *
     * Just disable this modifier and define your own to achieve the desired effect.
     *
     * @memberof modifiers
     * @inner
     */
    applyStyle: {
      /** @prop {number} order=900 - Index used to define the order of execution */
      order: 900,
      /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
      enabled: true,
      /** @prop {ModifierFn} */
      fn: applyStyle,
      /** @prop {Function} */
      onLoad: applyStyleOnLoad,
      /**
       * @deprecated since version 1.10.0, the property moved to `computeStyle` modifier
       * @prop {Boolean} gpuAcceleration=true
       * If true, it uses the CSS 3D transformation to position the popper.
       * Otherwise, it will use the `top` and `left` properties
       */
      gpuAcceleration: undefined,
    },
  }

  /**
   * The `dataObject` is an object containing all the information used by Popper.js.
   * This object is passed to modifiers and to the `onCreate` and `onUpdate` callbacks.
   * @name dataObject
   * @property {Object} data.instance The Popper.js instance
   * @property {String} data.placement Placement applied to popper
   * @property {String} data.originalPlacement Placement originally defined on init
   * @property {Boolean} data.flipped True if popper has been flipped by flip modifier
   * @property {Boolean} data.hide True if the reference element is out of boundaries, useful to know when to hide the popper
   * @property {HTMLElement} data.arrowElement Node used as arrow by arrow modifier
   * @property {Object} data.styles Any CSS property defined here will be applied to the popper. It expects the JavaScript nomenclature (eg. `marginBottom`)
   * @property {Object} data.arrowStyles Any CSS property defined here will be applied to the popper arrow. It expects the JavaScript nomenclature (eg. `marginBottom`)
   * @property {Object} data.boundaries Offsets of the popper boundaries
   * @property {Object} data.offsets The measurements of popper, reference and arrow elements
   * @property {Object} data.offsets.popper `top`, `left`, `width`, `height` values
   * @property {Object} data.offsets.reference `top`, `left`, `width`, `height` values
   * @property {Object} data.offsets.arrow] `top` and `left` offsets, only one of them will be different from 0
   */

  /**
   * Default options provided to Popper.js constructor.<br />
   * These can be overridden using the `options` argument of Popper.js.<br />
   * To override an option, simply pass an object with the same
   * structure of the `options` object, as the 3rd argument. For example:
   * ```
   * new Popper(ref, pop, {
   *   modifiers: {
   *     preventOverflow: { enabled: false }
   *   }
   * })
   * ```
   * @type {Object}
   * @static
   * @memberof Popper
   */
  var Defaults = {
    /**
     * Popper's placement.
     * @prop {Popper.placements} placement='bottom'
     */
    placement: 'bottom',

    /**
     * Set this to true if you want popper to position it self in 'fixed' mode
     * @prop {Boolean} positionFixed=false
     */
    positionFixed: false,

    /**
     * Whether events (resize, scroll) are initially enabled.
     * @prop {Boolean} eventsEnabled=true
     */
    eventsEnabled: true,

    /**
     * Set to true if you want to automatically remove the popper when
     * you call the `destroy` method.
     * @prop {Boolean} removeOnDestroy=false
     */
    removeOnDestroy: false,

    /**
     * Callback called when the popper is created.<br />
     * By default, it is set to no-op.<br />
     * Access Popper.js instance with `data.instance`.
     * @prop {onCreate}
     */
    onCreate: function onCreate() {},

    /**
     * Callback called when the popper is updated. This callback is not called
     * on the initialization/creation of the popper, but only on subsequent
     * updates.<br />
     * By default, it is set to no-op.<br />
     * Access Popper.js instance with `data.instance`.
     * @prop {onUpdate}
     */
    onUpdate: function onUpdate() {},

    /**
     * List of modifiers used to modify the offsets before they are applied to the popper.
     * They provide most of the functionalities of Popper.js.
     * @prop {modifiers}
     */
    modifiers: modifiers,
  }

  /**
   * @callback onCreate
   * @param {dataObject} data
   */

  /**
   * @callback onUpdate
   * @param {dataObject} data
   */

  // Utils
  // Methods
  var Popper = (function() {
    /**
     * Creates a new Popper.js instance.
     * @class Popper
     * @param {Element|referenceObject} reference - The reference element used to position the popper
     * @param {Element} popper - The HTML / XML element used as the popper
     * @param {Object} options - Your custom options to override the ones defined in [Defaults](#defaults)
     * @return {Object} instance - The generated Popper.js instance
     */
    function Popper(reference, popper) {
      var _this = this

      var options =
        arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {}
      classCallCheck(this, Popper)

      this.scheduleUpdate = function() {
        return requestAnimationFrame(_this.update)
      }

      // make update() debounced, so that it only runs at most once-per-tick
      this.update = debounce(this.update.bind(this))

      // with {} we create a new object with the options inside it
      this.options = _extends$4({}, Popper.Defaults, options)

      // init state
      this.state = {
        isDestroyed: false,
        isCreated: false,
        scrollParents: [],
      }

      // get reference and popper elements (allow jQuery wrappers)
      this.reference = reference && reference.jquery ? reference[0] : reference
      this.popper = popper && popper.jquery ? popper[0] : popper

      // Deep merge modifiers options
      this.options.modifiers = {}
      Object.keys(
        _extends$4({}, Popper.Defaults.modifiers, options.modifiers)
      ).forEach(function(name) {
        _this.options.modifiers[name] = _extends$4(
          {},
          Popper.Defaults.modifiers[name] || {},
          options.modifiers ? options.modifiers[name] : {}
        )
      })

      // Refactoring modifiers' list (Object => Array)
      this.modifiers = Object.keys(this.options.modifiers)
        .map(function(name) {
          return _extends$4(
            {
              name: name,
            },
            _this.options.modifiers[name]
          )
        })
        // sort the modifiers by order
        .sort(function(a, b) {
          return a.order - b.order
        })

      // modifiers have the ability to execute arbitrary code when Popper.js get inited
      // such code is executed in the same order of its modifier
      // they could add new properties to their options configuration
      // BE AWARE: don't add options to `options.modifiers.name` but to `modifierOptions`!
      this.modifiers.forEach(function(modifierOptions) {
        if (modifierOptions.enabled && isFunction$1(modifierOptions.onLoad)) {
          modifierOptions.onLoad(
            _this.reference,
            _this.popper,
            _this.options,
            modifierOptions,
            _this.state
          )
        }
      })

      // fire the first update to position the popper in the right place
      this.update()

      var eventsEnabled = this.options.eventsEnabled
      if (eventsEnabled) {
        // setup event listeners, they will take care of update the position in specific situations
        this.enableEventListeners()
      }

      this.state.eventsEnabled = eventsEnabled
    }

    // We can't use class properties because they don't get listed in the
    // class prototype and break stuff like Sinon stubs

    createClass(Popper, [
      {
        key: 'update',
        value: function update$$1() {
          return update.call(this)
        },
      },
      {
        key: 'destroy',
        value: function destroy$$1() {
          return destroy.call(this)
        },
      },
      {
        key: 'enableEventListeners',
        value: function enableEventListeners$$1() {
          return enableEventListeners.call(this)
        },
      },
      {
        key: 'disableEventListeners',
        value: function disableEventListeners$$1() {
          return disableEventListeners.call(this)
        },

        /**
         * Schedules an update. It will run on the next UI update available.
         * @method scheduleUpdate
         * @memberof Popper
         */

        /**
         * Collection of utilities useful when writing custom modifiers.
         * Starting from version 1.7, this method is available only if you
         * include `popper-utils.js` before `popper.js`.
         *
         * **DEPRECATION**: This way to access PopperUtils is deprecated
         * and will be removed in v2! Use the PopperUtils module directly instead.
         * Due to the high instability of the methods contained in Utils, we can't
         * guarantee them to follow semver. Use them at your own risk!
         * @static
         * @private
         * @type {Object}
         * @deprecated since version 1.8
         * @member Utils
         * @memberof Popper
         */
      },
    ])
    return Popper
  })()

  /**
   * The `referenceObject` is an object that provides an interface compatible with Popper.js
   * and lets you use it as replacement of a real DOM node.<br />
   * You can use this method to position a popper relatively to a set of coordinates
   * in case you don't have a DOM node to use as reference.
   *
   * ```
   * new Popper(referenceObject, popperNode);
   * ```
   *
   * NB: This feature isn't supported in Internet Explorer 10.
   * @name referenceObject
   * @property {Function} data.getBoundingClientRect
   * A function that returns a set of coordinates compatible with the native `getBoundingClientRect` method.
   * @property {number} data.clientWidth
   * An ES6 getter that will return the width of the virtual reference element.
   * @property {number} data.clientHeight
   * An ES6 getter that will return the height of the virtual reference element.
   */

  Popper.Utils = (typeof window !== 'undefined' ? window : global).PopperUtils
  Popper.placements = placements
  Popper.Defaults = Defaults

  /**
   * A convenience hook around `useState` designed to be paired with
   * the component [callback ref](https://reactjs.org/docs/refs-and-the-dom.html#callback-refs) api.
   * Callback refs are useful over `useRef()` when you need to respond to the ref being set
   * instead of lazily accessing it in an effect.
   *
   * ```ts
   * const [element, attachRef] = useCallbackRef<HTMLDivElement>()
   *
   * useEffect(() => {
   *   if (!element) return
   *
   *   const calendar = new FullCalendar.Calendar(element)
   *
   *   return () => {
   *     calendar.destroy()
   *   }
   * }, [element])
   *
   * return <div ref={attachRef} />
   * ```
   */

  function useCallbackRef() {
    return React.useState(null)
  }

  var toFnRef = function toFnRef(ref) {
    return !ref || typeof ref === 'function'
      ? ref
      : function(value) {
          ref.current = value
        }
  }

  function mergeRefs(refA, refB) {
    var a = toFnRef(refA)
    var b = toFnRef(refB)
    return function(value) {
      if (a) a(value)
      if (b) b(value)
    }
  }
  /**
   * Create and returns a single callback ref composed from two other Refs.
   *
   * ```tsx
   * const Button = React.forwardRef((props, ref) => {
   *   const [element, attachRef] = useCallbackRef<HTMLButtonElement>();
   *   const mergedRef = useMergedRefs(ref, attachRef);
   *
   *   return <button ref={mergedRef} {...props}/>
   * })
   * ```
   *
   * @param refA A Callback or mutable Ref
   * @param refB A Callback or mutable Ref
   */

  function useMergedRefs(refA, refB) {
    return React.useMemo(
      function() {
        return mergeRefs(refA, refB)
      },
      [refA, refB]
    )
  }

  var initialPopperStyles = {
    position: 'absolute',
    top: '0',
    left: '0',
    opacity: '0',
    pointerEvents: 'none',
  }
  var initialArrowStyles = {}
  /**
   * Position an element relative some reference element using Popper.js
   *
   * @param {HTMLElement} referenceElement The element
   * @param {HTMLElement} popperElement
   * @param {Object}      options
   * @param {Object}      options.modifiers Popper.js modifiers
   * @param {Boolean}     options.enabled toggle the popper functionality on/off
   * @param {String}      options.placement The popper element placement relative to the reference element
   * @param {Boolean}     options.positionFixed use fixed positioning
   * @param {Boolean}     options.eventsEnabled have Popper listen on window resize events to reposition the element
   */

  function usePopper(referenceElement, popperElement, _temp) {
    var _ref = _temp === void 0 ? {} : _temp,
      _ref$enabled = _ref.enabled,
      enabled = _ref$enabled === void 0 ? true : _ref$enabled,
      _ref$placement = _ref.placement,
      placement = _ref$placement === void 0 ? 'bottom' : _ref$placement,
      _ref$positionFixed = _ref.positionFixed,
      positionFixed =
        _ref$positionFixed === void 0 ? false : _ref$positionFixed,
      _ref$eventsEnabled = _ref.eventsEnabled,
      eventsEnabled = _ref$eventsEnabled === void 0 ? true : _ref$eventsEnabled,
      _ref$modifiers = _ref.modifiers,
      modifiers = _ref$modifiers === void 0 ? {} : _ref$modifiers

    var popperInstanceRef = React.useRef()
    var hasArrow = !!(modifiers.arrow && modifiers.arrow.element)
    var scheduleUpdate = React.useCallback(function() {
      if (popperInstanceRef.current) {
        popperInstanceRef.current.scheduleUpdate()
      }
    }, [])

    var _useState = React.useState({
        placement: placement,
        scheduleUpdate: scheduleUpdate,
        outOfBoundaries: false,
        styles: initialPopperStyles,
        arrowStyles: initialArrowStyles,
      }),
      state = _useState[0],
      setState = _useState[1] // A placement difference in state means popper determined a new placement
    // apart from the props value. By the time the popper element is rendered with
    // the new position Popper has already measured it, if the place change triggers
    // a size change it will result in a misaligned popper. So we schedule an update to be sure.

    React.useEffect(
      function() {
        scheduleUpdate()
      },
      [state.placement, scheduleUpdate]
    )
    /** Toggle Events */

    React.useEffect(
      function() {
        if (popperInstanceRef.current) {
          // eslint-disable-next-line no-unused-expressions
          eventsEnabled
            ? popperInstanceRef.current.enableEventListeners()
            : popperInstanceRef.current.disableEventListeners()
        }
      },
      [eventsEnabled]
    )
    React.useEffect(
      function() {
        if (!enabled || referenceElement === null || popperElement === null) {
          return undefined
        }

        var arrow =
          modifiers.arrow &&
          _extends$3({}, modifiers.arrow, {
            element: modifiers.arrow.element,
          })

        popperInstanceRef.current = new Popper(
          referenceElement,
          popperElement,
          {
            placement: placement,
            positionFixed: positionFixed,
            modifiers: _extends$3({}, modifiers, {
              arrow: arrow,
              applyStyle: {
                enabled: false,
              },
              updateStateModifier: {
                enabled: true,
                order: 900,
                fn: function fn(data) {
                  setState({
                    scheduleUpdate: scheduleUpdate,
                    styles: _extends$3(
                      {
                        position: data.offsets.popper.position,
                      },
                      data.styles
                    ),
                    arrowStyles: data.arrowStyles,
                    outOfBoundaries: data.hide,
                    placement: data.placement,
                  })
                },
              },
            }),
          }
        )
        return function() {
          if (popperInstanceRef.current !== null) {
            popperInstanceRef.current.destroy()
            popperInstanceRef.current = null
          }
        } // intentionally NOT re-running on new modifiers
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [
        enabled,
        placement,
        positionFixed,
        referenceElement,
        popperElement,
        hasArrow,
      ]
    )
    return state
  }

  var interopRequireDefault = createCommonjsModule(function(module) {
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule
        ? obj
        : {
            default: obj,
          }
    }

    module.exports = _interopRequireDefault
  })

  unwrapExports(interopRequireDefault)

  var inDOM = createCommonjsModule(function(module, exports) {
    exports.__esModule = true
    exports.default = void 0

    var _default = !!(
      typeof window !== 'undefined' &&
      window.document &&
      window.document.createElement
    )

    exports.default = _default
    module.exports = exports['default']
  })

  unwrapExports(inDOM)

  var contains$1 = createCommonjsModule(function(module, exports) {
    exports.__esModule = true
    exports.default = void 0

    var _inDOM = interopRequireDefault(inDOM)

    var _default = (function() {
      // HTML DOM and SVG DOM may have different support levels,
      // so we need to check on context instead of a document root element.
      return _inDOM.default
        ? function(context, node) {
            if (context.contains) {
              return context.contains(node)
            } else if (context.compareDocumentPosition) {
              return (
                context === node ||
                !!(context.compareDocumentPosition(node) & 16)
              )
            } else {
              return fallback(context, node)
            }
          }
        : fallback
    })()

    exports.default = _default

    function fallback(context, node) {
      if (node)
        do {
          if (node === context) return true
        } while ((node = node.parentNode))
      return false
    }

    module.exports = exports['default']
  })

  var contains$2 = unwrapExports(contains$1)

  var on_1 = createCommonjsModule(function(module, exports) {
    exports.__esModule = true
    exports.default = void 0

    var _inDOM = interopRequireDefault(inDOM)

    var on = function on() {}

    if (_inDOM.default) {
      on = (function() {
        if (document.addEventListener)
          return function(node, eventName, handler, capture) {
            return node.addEventListener(eventName, handler, capture || false)
          }
        else if (document.attachEvent)
          return function(node, eventName, handler) {
            return node.attachEvent('on' + eventName, function(e) {
              e = e || window.event
              e.target = e.target || e.srcElement
              e.currentTarget = node
              handler.call(node, e)
            })
          }
      })()
    }

    var _default = on
    exports.default = _default
    module.exports = exports['default']
  })

  unwrapExports(on_1)

  var off_1 = createCommonjsModule(function(module, exports) {
    exports.__esModule = true
    exports.default = void 0

    var _inDOM = interopRequireDefault(inDOM)

    var off = function off() {}

    if (_inDOM.default) {
      off = (function() {
        if (document.addEventListener)
          return function(node, eventName, handler, capture) {
            return node.removeEventListener(
              eventName,
              handler,
              capture || false
            )
          }
        else if (document.attachEvent)
          return function(node, eventName, handler) {
            return node.detachEvent('on' + eventName, handler)
          }
      })()
    }

    var _default = off
    exports.default = _default
    module.exports = exports['default']
  })

  unwrapExports(off_1)

  var listen_1 = createCommonjsModule(function(module, exports) {
    exports.__esModule = true
    exports.default = void 0

    var _inDOM = interopRequireDefault(inDOM)

    var _on = interopRequireDefault(on_1)

    var _off = interopRequireDefault(off_1)

    var listen = function listen() {}

    if (_inDOM.default) {
      listen = function listen(node, eventName, handler, capture) {
        ;(0, _on.default)(node, eventName, handler, capture)
        return function() {
          ;(0, _off.default)(node, eventName, handler, capture)
        }
      }
    }

    var _default = listen
    exports.default = _default
    module.exports = exports['default']
  })

  var listen = unwrapExports(listen_1)

  /**
   * Creates a `Ref` whose value is updated in an effect, ensuring the most recent
   * value is the one rendered with. Generally only required for Concurrent mode usage
   * where previous work in `render()` may be discarded befor being used.
   *
   * This is safe to access in an event handler.
   *
   * @param value The `Ref` value
   */

  function useCommittedRef(value) {
    var ref = React.useRef(value)
    React.useEffect(
      function() {
        ref.current = value
      },
      [value]
    )
    return ref
  }

  function useEventCallback(fn) {
    var ref = useCommittedRef(fn)
    return React.useCallback(
      function() {
        return ref.current && ref.current.apply(ref, arguments)
      },
      [ref]
    )
  }

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var warning = function() {}

  {
    var printWarning$2 = function printWarning(format, args) {
      var len = arguments.length
      args = new Array(len > 1 ? len - 1 : 0)
      for (var key = 1; key < len; key++) {
        args[key - 1] = arguments[key]
      }
      var argIndex = 0
      var message =
        'Warning: ' +
        format.replace(/%s/g, function() {
          return args[argIndex++]
        })
      if (typeof console !== 'undefined') {
        console.error(message)
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message)
      } catch (x) {}
    }

    warning = function(condition, format, args) {
      var len = arguments.length
      args = new Array(len > 2 ? len - 2 : 0)
      for (var key = 2; key < len; key++) {
        args[key - 2] = arguments[key]
      }
      if (format === undefined) {
        throw new Error(
          '`warning(condition, format, ...args)` requires a warning ' +
            'message argument'
        )
      }
      if (!condition) {
        printWarning$2.apply(null, [format].concat(args))
      }
    }
  }

  var warning_1 = warning

  var escapeKeyCode = 27

  var noop$2 = function noop() {}

  function isLeftClickEvent(event) {
    return event.button === 0
  }

  function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
  }
  /**
   * The `useRootClose` hook registers your callback on the document
   * when rendered. Powers the `<Overlay/>` component. This is used achieve modal
   * style behavior where your callback is triggered when the user tries to
   * interact with the rest of the document or hits the `esc` key.
   *
   * @param {Ref<HTMLElement>|HTMLElement} ref  The element boundary
   * @param {function} onRootClose
   * @param {object}  options
   * @param {boolean} options.disabled
   * @param {string}  options.clickTrigger The DOM event name (click, mousedown, etc) to attach listeners on
   */

  function useRootClose(ref, onRootClose, _temp) {
    var _ref = _temp === void 0 ? {} : _temp,
      disabled = _ref.disabled,
      _ref$clickTrigger = _ref.clickTrigger,
      clickTrigger = _ref$clickTrigger === void 0 ? 'click' : _ref$clickTrigger

    var preventMouseRootCloseRef = React.useRef(false)
    var onClose = onRootClose || noop$2
    var handleMouseCapture = React.useCallback(
      function(e) {
        var currentTarget = ref && ('current' in ref ? ref.current : ref)
        warning_1(
          !!currentTarget,
          'RootClose captured a close event but does not have a ref to compare it to. ' +
            'useRootClose(), should be passed a ref that resolves to a DOM node'
        )
        preventMouseRootCloseRef.current =
          !currentTarget ||
          isModifiedEvent(e) ||
          !isLeftClickEvent(e) ||
          contains$2(currentTarget, e.target)
      },
      [ref]
    )
    var handleMouse = useEventCallback(function(e) {
      if (!preventMouseRootCloseRef.current) {
        onClose(e)
      }
    })
    var handleKeyUp = useEventCallback(function(e) {
      if (e.keyCode === escapeKeyCode) {
        onClose(e)
      }
    })
    React.useEffect(
      function() {
        if (disabled || ref == null) return undefined // Use capture for this listener so it fires before React's listener, to
        // avoid false positives in the contains() check below if the target DOM
        // element is removed in the React mouse callback.

        var removeMouseCaptureListener = listen(
          document,
          clickTrigger,
          handleMouseCapture,
          true
        )
        var removeMouseListener = listen(document, clickTrigger, handleMouse)
        var removeKeyupListener = listen(document, 'keyup', handleKeyUp)
        var mobileSafariHackListeners = []

        if ('ontouchstart' in document.documentElement) {
          mobileSafariHackListeners = [].slice
            .call(document.body.children)
            .map(function(el) {
              return listen(el, 'mousemove', noop$2)
            })
        }

        return function() {
          removeMouseCaptureListener()
          removeMouseListener()
          removeKeyupListener()
          mobileSafariHackListeners.forEach(function(remove) {
            return remove()
          })
        }
      },
      [
        ref,
        disabled,
        clickTrigger,
        handleMouseCapture,
        handleMouse,
        handleKeyUp,
      ]
    )
  }

  var ownerDocument_1 = createCommonjsModule(function(module, exports) {
    exports.__esModule = true
    exports.default = ownerDocument

    function ownerDocument(node) {
      return (node && node.ownerDocument) || document
    }

    module.exports = exports['default']
  })

  var ownerDocument$1 = unwrapExports(ownerDocument_1)

  var resolveRef = function resolveRef(ref) {
    if (ref == null) return ownerDocument$1().body
    if (typeof ref === 'function') ref = ref()
    if (ref && ref.current) ref = ref.current
    if (ref && ref.nodeType) return ref
    return null
  }

  function useWaitForDOMRef(ref, onResolved) {
    var _useState = React.useState(function() {
        return resolveRef(ref)
      }),
      resolvedRef = _useState[0],
      setRef = _useState[1]

    if (!resolvedRef) {
      var earlyRef = resolveRef(ref)
      if (earlyRef) setRef(earlyRef)
    }

    React.useEffect(
      function() {
        if (onResolved && resolvedRef) {
          onResolved(resolvedRef)
        }
      },
      [onResolved, resolvedRef]
    )
    React.useEffect(
      function() {
        var nextRef = resolveRef(ref)

        if (nextRef !== resolvedRef) {
          setRef(nextRef)
        }
      },
      [ref, resolvedRef]
    )
    return resolvedRef
  }

  /**
   * Built on top of `Popper.js`, the overlay component is
   * great for custom tooltip overlays.
   */

  var Overlay = React__default.forwardRef(function(props, outerRef) {
    var flip = props.flip,
      placement = props.placement,
      containerPadding = props.containerPadding,
      _props$popperConfig = props.popperConfig,
      popperConfig = _props$popperConfig === void 0 ? {} : _props$popperConfig,
      Transition = props.transition

    var _useCallbackRef = useCallbackRef(),
      rootElement = _useCallbackRef[0],
      attachRef = _useCallbackRef[1]

    var _useCallbackRef2 = useCallbackRef(),
      arrowElement = _useCallbackRef2[0],
      attachArrowRef = _useCallbackRef2[1]

    var mergedRef = useMergedRefs(attachRef, outerRef)
    var container = useWaitForDOMRef(props.container)
    var target = useWaitForDOMRef(props.target)

    var _useState = React.useState(!props.show),
      exited = _useState[0],
      setExited = _useState[1]

    var _popperConfig$modifie = popperConfig.modifiers,
      modifiers = _popperConfig$modifie === void 0 ? {} : _popperConfig$modifie

    var _usePopper = usePopper(
        target,
        rootElement,
        _extends$3({}, popperConfig, {
          placement: placement || 'bottom',
          enableEvents: props.show,
          modifiers: _extends$3({}, modifiers, {
            preventOverflow: _extends$3(
              {
                padding: containerPadding || 5,
              },
              modifiers.preventOverflow
            ),
            arrow: _extends$3({}, modifiers.arrow, {
              enabled: !!arrowElement,
              element: arrowElement,
            }),
            flip: _extends$3(
              {
                enabled: !!flip,
              },
              modifiers.preventOverflow
            ),
          }),
        })
      ),
      styles = _usePopper.styles,
      arrowStyles = _usePopper.arrowStyles,
      popper = _objectWithoutPropertiesLoose$2(_usePopper, [
        'styles',
        'arrowStyles',
      ])

    if (props.show) {
      if (exited) setExited(false)
    } else if (!props.transition && !exited) {
      setExited(true)
    }

    var handleHidden = function handleHidden() {
      setExited(true)

      if (props.onExited) {
        props.onExited.apply(props, arguments)
      }
    } // Don't un-render the overlay while it's transitioning out.

    var mountOverlay = props.show || (Transition && !exited)
    useRootClose(rootElement, props.onHide, {
      disabled: !props.rootClose || props.rootCloseDisabled,
      clickTrigger: props.rootCloseEvent,
    })

    if (!mountOverlay) {
      // Don't bother showing anything if we don't have to.
      return null
    }

    var child = props.children(
      _extends$3({}, popper, {
        show: props.show,
        props: {
          style: styles,
          ref: mergedRef,
        },
        arrowProps: {
          style: arrowStyles,
          ref: attachArrowRef,
        },
      })
    )

    if (Transition) {
      var onExit = props.onExit,
        onExiting = props.onExiting,
        onEnter = props.onEnter,
        onEntering = props.onEntering,
        onEntered = props.onEntered
      child = React__default.createElement(
        Transition,
        {
          in: props.show,
          appear: true,
          onExit: onExit,
          onExiting: onExiting,
          onExited: handleHidden,
          onEnter: onEnter,
          onEntering: onEntering,
          onEntered: onEntered,
        },
        child
      )
    }

    return container ? ReactDOM__default.createPortal(child, container) : null
  })
  Overlay.displayName = 'Overlay'
  Overlay.propTypes = {
    /**
     * Set the visibility of the Overlay
     */
    show: propTypes.bool,

    /** Specify where the overlay element is positioned in relation to the target element */
    placement: propTypes.oneOf(Popper.placements),

    /**
     * A DOM Element, Ref to an element, or function that returns either. The `target` element is where
     * the overlay is positioned relative to.
     */
    target: propTypes.any,

    /**
     * A DOM Element, Ref to an element, or function that returns either. The `container` will have the Portal children
     * appended to it.
     */
    container: propTypes.any,

    /**
     * Enables the Popper.js `flip` modifier, allowing the Overlay to
     * automatically adjust it's placement in case of overlap with the viewport or toggle.
     * Refer to the [flip docs](https://popper.js.org/popper-documentation.html#modifiers..flip.enabled) for more info
     */
    flip: propTypes.bool,

    /**
     * A render prop that returns an element to overlay and position. See
     * the [react-popper documentation](https://github.com/FezVrasta/react-popper#children) for more info.
     *
     * @type {Function ({
     *   show: boolean,
     *   placement: Placement,
     *   outOfBoundaries: ?boolean,
     *   scheduleUpdate: () => void,
     *   props: {
     *     ref: (?HTMLElement) => void,
     *     style: { [string]: string | number },
     *     aria-labelledby: ?string
     *   },
     *   arrowProps: {
     *     ref: (?HTMLElement) => void,
     *     style: { [string]: string | number },
     *   },
     * }) => React.Element}
     */
    children: propTypes.func.isRequired,

    /**
     * Control how much space there is between the edge of the boundary element and overlay.
     * A convenience shortcut to setting `popperConfig.modfiers.preventOverflow.padding`
     */
    containerPadding: propTypes.number,

    /**
     * A set of popper options and props passed directly to react-popper's Popper component.
     */
    popperConfig: propTypes.object,

    /**
     * Specify whether the overlay should trigger `onHide` when the user clicks outside the overlay
     */
    rootClose: propTypes.bool,

    /**
     * Specify event for toggling overlay
     */
    rootCloseEvent: propTypes.oneOf(['click', 'mousedown']),

    /**
     * Specify disabled for disable RootCloseWrapper
     */
    rootCloseDisabled: propTypes.bool,

    /**
     * A Callback fired by the Overlay when it wishes to be hidden.
     *
     * __required__ when `rootClose` is `true`.
     *
     * @type func
     */
    onHide: function onHide(props) {
      var propType = propTypes.func

      if (props.rootClose) {
        propType = propType.isRequired
      }

      for (
        var _len = arguments.length,
          args = new Array(_len > 1 ? _len - 1 : 0),
          _key = 1;
        _key < _len;
        _key++
      ) {
        args[_key - 1] = arguments[_key]
      }

      return propType.apply(void 0, [props].concat(args))
    },

    /**
     * A `react-transition-group@2.0.0` `<Transition/>` component
     * used to animate the overlay as it changes visibility.
     */
    transition: propTypes.elementType,

    /**
     * Callback fired before the Overlay transitions in
     */
    onEnter: propTypes.func,

    /**
     * Callback fired as the Overlay begins to transition in
     */
    onEntering: propTypes.func,

    /**
     * Callback fired after the Overlay finishes transitioning in
     */
    onEntered: propTypes.func,

    /**
     * Callback fired right before the Overlay transitions out
     */
    onExit: propTypes.func,

    /**
     * Callback fired as the Overlay begins to transition out
     */
    onExiting: propTypes.func,

    /**
     * Callback fired after the Overlay finishes transitioning out
     */
    onExited: propTypes.func,
  }
  Overlay.defaultProps = {
    containerPadding: 5,
  }

  function height(node, client) {
    var win = isWindow(node)
    return win
      ? win.innerHeight
      : client
      ? node.clientHeight
      : offset(node).height
  }

  var toArray = Function.prototype.bind.call(Function.prototype.call, [].slice)
  function qsa(element, selector) {
    return toArray(element.querySelectorAll(selector))
  }

  var matchesImpl
  function matches(node, selector) {
    if (!matchesImpl) {
      var body = document.body
      var nativeMatch =
        body.matches ||
        body.matchesSelector ||
        body.webkitMatchesSelector ||
        body.mozMatchesSelector ||
        body.msMatchesSelector

      matchesImpl = function matchesImpl(n, s) {
        return nativeMatch.call(n, s)
      }
    }

    return matchesImpl(node, selector)
  }

  function closest(node, selector, stopAt) {
    if (node.closest && !stopAt) node.closest(selector)
    var nextNode = node

    do {
      if (matches(nextNode, selector)) return nextNode
      nextNode = nextNode.parentElement
    } while (nextNode && nextNode !== stopAt && nextNode.nodeType === document.ELEMENT_NODE)

    return null
  }

  /* eslint-disable no-return-assign */
  var optionsSupported = false
  var onceSupported = false

  try {
    var options = {
      get passive() {
        return (optionsSupported = true)
      },

      get once() {
        // eslint-disable-next-line no-multi-assign
        return (onceSupported = optionsSupported = true)
      },
    }

    if (canUseDOM) {
      window.addEventListener('test', options, options)
      window.removeEventListener('test', options, true)
    }
  } catch (e) {
    /* */
  }

  /**
   * An `addEventListener` ponyfill, supports the `once` option
   */
  function addEventListener(node, eventName, handler, options) {
    if (options && typeof options !== 'boolean' && !onceSupported) {
      var once = options.once,
        capture = options.capture
      var wrappedHandler = handler

      if (!onceSupported && once) {
        wrappedHandler =
          handler.__once ||
          function onceHandler(event) {
            this.removeEventListener(eventName, onceHandler, capture)
            handler.call(this, event)
          }

        handler.__once = wrappedHandler
      }

      node.addEventListener(
        eventName,
        wrappedHandler,
        optionsSupported ? options : capture
      )
    }

    node.addEventListener(eventName, handler, options)
  }

  function removeEventListener(node, eventName, handler, options) {
    var capture =
      options && typeof options !== 'boolean' ? options.capture : options
    node.removeEventListener(eventName, handler, capture)

    if (handler.__once) {
      node.removeEventListener(eventName, handler.__once, capture)
    }
  }

  function listen$1(node, eventName, handler, options) {
    addEventListener(node, eventName, handler, options)
    return function() {
      removeEventListener(node, eventName, handler, options)
    }
  }

  function addEventListener$1(type, handler, target) {
    if (target === void 0) {
      target = document
    }

    return listen$1(target, type, handler, {
      passive: false,
    })
  }

  function isOverContainer(container, x, y) {
    return !container || contains(container, document.elementFromPoint(x, y))
  }

  function getEventNodeFromPoint(node, _ref) {
    var clientX = _ref.clientX,
      clientY = _ref.clientY
    var target = document.elementFromPoint(clientX, clientY)
    return closest(target, '.rbc-event', node)
  }
  function isEvent(node, bounds) {
    return !!getEventNodeFromPoint(node, bounds)
  }

  function getEventCoordinates(e) {
    var target = e

    if (e.touches && e.touches.length) {
      target = e.touches[0]
    }

    return {
      clientX: target.clientX,
      clientY: target.clientY,
      pageX: target.pageX,
      pageY: target.pageY,
    }
  }

  var clickTolerance = 5
  var clickInterval = 250

  var Selection =
    /*#__PURE__*/
    (function() {
      function Selection(node, _temp) {
        var _ref2 = _temp === void 0 ? {} : _temp,
          _ref2$global = _ref2.global,
          global = _ref2$global === void 0 ? false : _ref2$global,
          _ref2$longPressThresh = _ref2.longPressThreshold,
          longPressThreshold =
            _ref2$longPressThresh === void 0 ? 250 : _ref2$longPressThresh

        this.isDetached = false
        this.container = node
        this.globalMouse = !node || global
        this.longPressThreshold = longPressThreshold
        this._listeners = Object.create(null)
        this._handleInitialEvent = this._handleInitialEvent.bind(this)
        this._handleMoveEvent = this._handleMoveEvent.bind(this)
        this._handleTerminatingEvent = this._handleTerminatingEvent.bind(this)
        this._keyListener = this._keyListener.bind(this)
        this._dropFromOutsideListener = this._dropFromOutsideListener.bind(this)
        this._dragOverFromOutsideListener = this._dragOverFromOutsideListener.bind(
          this
        ) // Fixes an iOS 10 bug where scrolling could not be prevented on the window.
        // https://github.com/metafizzy/flickity/issues/457#issuecomment-254501356

        this._removeTouchMoveWindowListener = addEventListener$1(
          'touchmove',
          function() {},
          window
        )
        this._removeKeyDownListener = addEventListener$1(
          'keydown',
          this._keyListener
        )
        this._removeKeyUpListener = addEventListener$1(
          'keyup',
          this._keyListener
        )
        this._removeDropFromOutsideListener = addEventListener$1(
          'drop',
          this._dropFromOutsideListener
        )
        this._onDragOverfromOutisde = addEventListener$1(
          'dragover',
          this._dragOverFromOutsideListener
        )

        this._addInitialEventListener()
      }

      var _proto = Selection.prototype

      _proto.on = function on(type, handler) {
        var handlers = this._listeners[type] || (this._listeners[type] = [])
        handlers.push(handler)
        return {
          remove: function remove() {
            var idx = handlers.indexOf(handler)
            if (idx !== -1) handlers.splice(idx, 1)
          },
        }
      }

      _proto.emit = function emit(type) {
        for (
          var _len = arguments.length,
            args = new Array(_len > 1 ? _len - 1 : 0),
            _key = 1;
          _key < _len;
          _key++
        ) {
          args[_key - 1] = arguments[_key]
        }

        var result
        var handlers = this._listeners[type] || []
        handlers.forEach(function(fn) {
          if (result === undefined) result = fn.apply(void 0, args)
        })
        return result
      }

      _proto.teardown = function teardown() {
        this.isDetached = true
        this.listeners = Object.create(null)
        this._removeTouchMoveWindowListener &&
          this._removeTouchMoveWindowListener()
        this._removeInitialEventListener && this._removeInitialEventListener()
        this._removeEndListener && this._removeEndListener()
        this._onEscListener && this._onEscListener()
        this._removeMoveListener && this._removeMoveListener()
        this._removeKeyUpListener && this._removeKeyUpListener()
        this._removeKeyDownListener && this._removeKeyDownListener()
        this._removeDropFromOutsideListener &&
          this._removeDropFromOutsideListener()
      }

      _proto.isSelected = function isSelected(node) {
        var box = this._selectRect
        if (!box || !this.selecting) return false
        return objectsCollide(box, getBoundsForNode(node))
      }

      _proto.filter = function filter(items) {
        var box = this._selectRect //not selecting

        if (!box || !this.selecting) return []
        return items.filter(this.isSelected, this)
      } // Adds a listener that will call the handler only after the user has pressed on the screen
      // without moving their finger for 250ms.

      _proto._addLongPressListener = function _addLongPressListener(
        handler,
        initialEvent
      ) {
        var _this = this

        var timer = null
        var removeTouchMoveListener = null
        var removeTouchEndListener = null

        var handleTouchStart = function handleTouchStart(initialEvent) {
          timer = setTimeout(function() {
            cleanup()
            handler(initialEvent)
          }, _this.longPressThreshold)
          removeTouchMoveListener = addEventListener$1('touchmove', function() {
            return cleanup()
          })
          removeTouchEndListener = addEventListener$1('touchend', function() {
            return cleanup()
          })
        }

        var removeTouchStartListener = addEventListener$1(
          'touchstart',
          handleTouchStart
        )

        var cleanup = function cleanup() {
          if (timer) {
            clearTimeout(timer)
          }

          if (removeTouchMoveListener) {
            removeTouchMoveListener()
          }

          if (removeTouchEndListener) {
            removeTouchEndListener()
          }

          timer = null
          removeTouchMoveListener = null
          removeTouchEndListener = null
        }

        if (initialEvent) {
          handleTouchStart(initialEvent)
        }

        return function() {
          cleanup()
          removeTouchStartListener()
        }
      } // Listen for mousedown and touchstart events. When one is received, disable the other and setup
      // future event handling based on the type of event.

      _proto._addInitialEventListener = function _addInitialEventListener() {
        var _this2 = this

        var removeMouseDownListener = addEventListener$1('mousedown', function(
          e
        ) {
          _this2._removeInitialEventListener()

          _this2._handleInitialEvent(e)

          _this2._removeInitialEventListener = addEventListener$1(
            'mousedown',
            _this2._handleInitialEvent
          )
        })
        var removeTouchStartListener = addEventListener$1(
          'touchstart',
          function(e) {
            _this2._removeInitialEventListener()

            _this2._removeInitialEventListener = _this2._addLongPressListener(
              _this2._handleInitialEvent,
              e
            )
          }
        )

        this._removeInitialEventListener = function() {
          removeMouseDownListener()
          removeTouchStartListener()
        }
      }

      _proto._dropFromOutsideListener = function _dropFromOutsideListener(e) {
        var _getEventCoordinates = getEventCoordinates(e),
          pageX = _getEventCoordinates.pageX,
          pageY = _getEventCoordinates.pageY,
          clientX = _getEventCoordinates.clientX,
          clientY = _getEventCoordinates.clientY

        this.emit('dropFromOutside', {
          x: pageX,
          y: pageY,
          clientX: clientX,
          clientY: clientY,
        })
        e.preventDefault()
      }

      _proto._dragOverFromOutsideListener = function _dragOverFromOutsideListener(
        e
      ) {
        var _getEventCoordinates2 = getEventCoordinates(e),
          pageX = _getEventCoordinates2.pageX,
          pageY = _getEventCoordinates2.pageY,
          clientX = _getEventCoordinates2.clientX,
          clientY = _getEventCoordinates2.clientY

        this.emit('dragOverFromOutside', {
          x: pageX,
          y: pageY,
          clientX: clientX,
          clientY: clientY,
        })
        e.preventDefault()
      }

      _proto._handleInitialEvent = function _handleInitialEvent(e) {
        if (this.isDetached) {
          return
        }

        var _getEventCoordinates3 = getEventCoordinates(e),
          clientX = _getEventCoordinates3.clientX,
          clientY = _getEventCoordinates3.clientY,
          pageX = _getEventCoordinates3.pageX,
          pageY = _getEventCoordinates3.pageY

        var node = this.container(),
          collides,
          offsetData // Right clicks

        if (
          e.which === 3 ||
          e.button === 2 ||
          !isOverContainer(node, clientX, clientY)
        )
          return

        if (!this.globalMouse && node && !contains(node, e.target)) {
          var _normalizeDistance = normalizeDistance(0),
            top = _normalizeDistance.top,
            left = _normalizeDistance.left,
            bottom = _normalizeDistance.bottom,
            right = _normalizeDistance.right

          offsetData = getBoundsForNode(node)
          collides = objectsCollide(
            {
              top: offsetData.top - top,
              left: offsetData.left - left,
              bottom: offsetData.bottom + bottom,
              right: offsetData.right + right,
            },
            {
              top: pageY,
              left: pageX,
            }
          )
          if (!collides) return
        }

        var result = this.emit(
          'beforeSelect',
          (this._initialEventData = {
            isTouch: /^touch/.test(e.type),
            x: pageX,
            y: pageY,
            clientX: clientX,
            clientY: clientY,
          })
        )
        if (result === false) return

        switch (e.type) {
          case 'mousedown':
            this._removeEndListener = addEventListener$1(
              'mouseup',
              this._handleTerminatingEvent
            )
            this._onEscListener = addEventListener$1(
              'keydown',
              this._handleTerminatingEvent
            )
            this._removeMoveListener = addEventListener$1(
              'mousemove',
              this._handleMoveEvent
            )
            break

          case 'touchstart':
            this._handleMoveEvent(e)

            this._removeEndListener = addEventListener$1(
              'touchend',
              this._handleTerminatingEvent
            )
            this._removeMoveListener = addEventListener$1(
              'touchmove',
              this._handleMoveEvent
            )
            break

          default:
            break
        }
      }

      _proto._handleTerminatingEvent = function _handleTerminatingEvent(e) {
        var _getEventCoordinates4 = getEventCoordinates(e),
          pageX = _getEventCoordinates4.pageX,
          pageY = _getEventCoordinates4.pageY

        this.selecting = false
        this._removeEndListener && this._removeEndListener()
        this._removeMoveListener && this._removeMoveListener()
        if (!this._initialEventData) return
        var inRoot = !this.container || contains(this.container(), e.target)
        var bounds = this._selectRect
        var click = this.isClick(pageX, pageY)
        this._initialEventData = null

        if (e.key === 'Escape') {
          return this.emit('reset')
        }

        if (!inRoot) {
          return this.emit('reset')
        }

        if (click && inRoot) {
          return this._handleClickEvent(e)
        } // User drag-clicked in the Selectable area

        if (!click) return this.emit('select', bounds)
      }

      _proto._handleClickEvent = function _handleClickEvent(e) {
        var _getEventCoordinates5 = getEventCoordinates(e),
          pageX = _getEventCoordinates5.pageX,
          pageY = _getEventCoordinates5.pageY,
          clientX = _getEventCoordinates5.clientX,
          clientY = _getEventCoordinates5.clientY

        var now = new Date().getTime()

        if (
          this._lastClickData &&
          now - this._lastClickData.timestamp < clickInterval
        ) {
          // Double click event
          this._lastClickData = null
          return this.emit('doubleClick', {
            x: pageX,
            y: pageY,
            clientX: clientX,
            clientY: clientY,
          })
        } // Click event

        this._lastClickData = {
          timestamp: now,
        }
        return this.emit('click', {
          x: pageX,
          y: pageY,
          clientX: clientX,
          clientY: clientY,
        })
      }

      _proto._handleMoveEvent = function _handleMoveEvent(e) {
        if (this._initialEventData === null || this.isDetached) {
          return
        }

        var _this$_initialEventDa = this._initialEventData,
          x = _this$_initialEventDa.x,
          y = _this$_initialEventDa.y

        var _getEventCoordinates6 = getEventCoordinates(e),
          pageX = _getEventCoordinates6.pageX,
          pageY = _getEventCoordinates6.pageY

        var w = Math.abs(x - pageX)
        var h = Math.abs(y - pageY)
        var left = Math.min(pageX, x),
          top = Math.min(pageY, y),
          old = this.selecting // Prevent emitting selectStart event until mouse is moved.
        // in Chrome on Windows, mouseMove event may be fired just after mouseDown event.

        if (this.isClick(pageX, pageY) && !old && !(w || h)) {
          return
        }

        this.selecting = true
        this._selectRect = {
          top: top,
          left: left,
          x: pageX,
          y: pageY,
          right: left + w,
          bottom: top + h,
        }

        if (!old) {
          this.emit('selectStart', this._initialEventData)
        }

        if (!this.isClick(pageX, pageY))
          this.emit('selecting', this._selectRect)
        e.preventDefault()
      }

      _proto._keyListener = function _keyListener(e) {
        this.ctrl = e.metaKey || e.ctrlKey
      }

      _proto.isClick = function isClick(pageX, pageY) {
        var _this$_initialEventDa2 = this._initialEventData,
          x = _this$_initialEventDa2.x,
          y = _this$_initialEventDa2.y,
          isTouch = _this$_initialEventDa2.isTouch
        return (
          !isTouch &&
          Math.abs(pageX - x) <= clickTolerance &&
          Math.abs(pageY - y) <= clickTolerance
        )
      }

      return Selection
    })()
  /**
   * Resolve the disance prop from either an Int or an Object
   * @return {Object}
   */

  function normalizeDistance(distance) {
    if (distance === void 0) {
      distance = 0
    }

    if (typeof distance !== 'object')
      distance = {
        top: distance,
        left: distance,
        right: distance,
        bottom: distance,
      }
    return distance
  }
  /**
   * Given two objects containing "top", "left", "offsetWidth" and "offsetHeight"
   * properties, determine if they collide.
   * @param  {Object|HTMLElement} a
   * @param  {Object|HTMLElement} b
   * @return {bool}
   */

  function objectsCollide(nodeA, nodeB, tolerance) {
    if (tolerance === void 0) {
      tolerance = 0
    }

    var _getBoundsForNode = getBoundsForNode(nodeA),
      aTop = _getBoundsForNode.top,
      aLeft = _getBoundsForNode.left,
      _getBoundsForNode$rig = _getBoundsForNode.right,
      aRight = _getBoundsForNode$rig === void 0 ? aLeft : _getBoundsForNode$rig,
      _getBoundsForNode$bot = _getBoundsForNode.bottom,
      aBottom = _getBoundsForNode$bot === void 0 ? aTop : _getBoundsForNode$bot

    var _getBoundsForNode2 = getBoundsForNode(nodeB),
      bTop = _getBoundsForNode2.top,
      bLeft = _getBoundsForNode2.left,
      _getBoundsForNode2$ri = _getBoundsForNode2.right,
      bRight = _getBoundsForNode2$ri === void 0 ? bLeft : _getBoundsForNode2$ri,
      _getBoundsForNode2$bo = _getBoundsForNode2.bottom,
      bBottom = _getBoundsForNode2$bo === void 0 ? bTop : _getBoundsForNode2$bo

    return !// 'a' bottom doesn't touch 'b' top
    (
      aBottom - tolerance < bTop || // 'a' top doesn't touch 'b' bottom
      aTop + tolerance > bBottom || // 'a' right doesn't touch 'b' left
      aRight - tolerance < bLeft || // 'a' left doesn't touch 'b' right
      aLeft + tolerance > bRight
    )
  }
  /**
   * Given a node, get everything needed to calculate its boundaries
   * @param  {HTMLElement} node
   * @return {Object}
   */

  function getBoundsForNode(node) {
    if (!node.getBoundingClientRect) return node
    var rect = node.getBoundingClientRect(),
      left = rect.left + pageOffset('left'),
      top = rect.top + pageOffset('top')
    return {
      top: top,
      left: left,
      right: (node.offsetWidth || 0) + left,
      bottom: (node.offsetHeight || 0) + top,
    }
  }

  function pageOffset(dir) {
    if (dir === 'left')
      return window.pageXOffset || document.body.scrollLeft || 0
    if (dir === 'top') return window.pageYOffset || document.body.scrollTop || 0
  }

  var BackgroundCells =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(BackgroundCells, _React$Component)

      function BackgroundCells(props, context) {
        var _this

        _this = _React$Component.call(this, props, context) || this
        _this.state = {
          selecting: false,
        }
        return _this
      }

      var _proto = BackgroundCells.prototype

      _proto.componentDidMount = function componentDidMount() {
        this.props.selectable && this._selectable()
      }

      _proto.componentWillUnmount = function componentWillUnmount() {
        this._teardownSelectable()
      }

      _proto.UNSAFE_componentWillReceiveProps = function UNSAFE_componentWillReceiveProps(
        nextProps
      ) {
        if (nextProps.selectable && !this.props.selectable) this._selectable()
        if (!nextProps.selectable && this.props.selectable)
          this._teardownSelectable()
      }

      _proto.render = function render() {
        var _this$props = this.props,
          range = _this$props.range,
          getNow = _this$props.getNow,
          getters = _this$props.getters,
          currentDate = _this$props.date,
          Wrapper = _this$props.components.dateCellWrapper
        var _this$state = this.state,
          selecting = _this$state.selecting,
          startIdx = _this$state.startIdx,
          endIdx = _this$state.endIdx
        var current = getNow()
        return React__default.createElement(
          'div',
          {
            className: 'rbc-row-bg',
          },
          range.map(function(date, index) {
            var selected = selecting && index >= startIdx && index <= endIdx

            var _getters$dayProp = getters.dayProp(date),
              className = _getters$dayProp.className,
              style = _getters$dayProp.style

            return React__default.createElement(
              Wrapper,
              {
                key: index,
                value: date,
                range: range,
              },
              React__default.createElement('div', {
                style: style,
                className: clsx(
                  'rbc-day-bg',
                  className,
                  selected && 'rbc-selected-cell',
                  eq(date, current, 'day') && 'rbc-today',
                  currentDate &&
                    month(currentDate) !== month(date) &&
                    'rbc-off-range-bg'
                ),
              })
            )
          })
        )
      }

      _proto._selectable = function _selectable() {
        var _this2 = this

        var node = ReactDOM.findDOMNode(this)
        var selector = (this._selector = new Selection(this.props.container, {
          longPressThreshold: this.props.longPressThreshold,
        }))

        var selectorClicksHandler = function selectorClicksHandler(
          point,
          actionType
        ) {
          if (!isEvent(ReactDOM.findDOMNode(_this2), point)) {
            var rowBox = getBoundsForNode(node)
            var _this2$props = _this2.props,
              range = _this2$props.range,
              rtl = _this2$props.rtl

            if (pointInBox(rowBox, point)) {
              var currentCell = getSlotAtX(rowBox, point.x, rtl, range.length)

              _this2._selectSlot({
                startIdx: currentCell,
                endIdx: currentCell,
                action: actionType,
                box: point,
              })
            }
          }

          _this2._initial = {}

          _this2.setState({
            selecting: false,
          })
        }

        selector.on('selecting', function(box) {
          var _this2$props2 = _this2.props,
            range = _this2$props2.range,
            rtl = _this2$props2.rtl
          var startIdx = -1
          var endIdx = -1

          if (!_this2.state.selecting) {
            notify$2(_this2.props.onSelectStart, [box])
            _this2._initial = {
              x: box.x,
              y: box.y,
            }
          }

          if (selector.isSelected(node)) {
            var nodeBox = getBoundsForNode(node)

            var _dateCellSelection = dateCellSelection(
              _this2._initial,
              nodeBox,
              box,
              range.length,
              rtl
            )

            startIdx = _dateCellSelection.startIdx
            endIdx = _dateCellSelection.endIdx
          }

          _this2.setState({
            selecting: true,
            startIdx: startIdx,
            endIdx: endIdx,
          })
        })
        selector.on('beforeSelect', function(box) {
          if (_this2.props.selectable !== 'ignoreEvents') return
          return !isEvent(ReactDOM.findDOMNode(_this2), box)
        })
        selector.on('click', function(point) {
          return selectorClicksHandler(point, 'click')
        })
        selector.on('doubleClick', function(point) {
          return selectorClicksHandler(point, 'doubleClick')
        })
        selector.on('select', function(bounds) {
          _this2._selectSlot(
            _extends({}, _this2.state, {
              action: 'select',
              bounds: bounds,
            })
          )

          _this2._initial = {}

          _this2.setState({
            selecting: false,
          })

          notify$2(_this2.props.onSelectEnd, [_this2.state])
        })
      }

      _proto._teardownSelectable = function _teardownSelectable() {
        if (!this._selector) return

        this._selector.teardown()

        this._selector = null
      }

      _proto._selectSlot = function _selectSlot(_ref) {
        var endIdx = _ref.endIdx,
          startIdx = _ref.startIdx,
          action = _ref.action,
          bounds = _ref.bounds,
          box = _ref.box
        if (endIdx !== -1 && startIdx !== -1)
          this.props.onSelectSlot &&
            this.props.onSelectSlot({
              start: startIdx,
              end: endIdx,
              action: action,
              bounds: bounds,
              box: box,
            })
      }

      return BackgroundCells
    })(React__default.Component)

  BackgroundCells.propTypes = {
    date: propTypes.instanceOf(Date),
    getNow: propTypes.func.isRequired,
    getters: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    container: propTypes.func,
    dayPropGetter: propTypes.func,
    selectable: propTypes.oneOf([true, false, 'ignoreEvents']),
    longPressThreshold: propTypes.number,
    onSelectSlot: propTypes.func.isRequired,
    onSelectEnd: propTypes.func,
    onSelectStart: propTypes.func,
    range: propTypes.arrayOf(propTypes.instanceOf(Date)),
    rtl: propTypes.bool,
    type: propTypes.string,
  }

  /* eslint-disable react/prop-types */

  var EventRowMixin = {
    propTypes: {
      slotMetrics: propTypes.object.isRequired,
      selected: propTypes.object,
      isAllDay: propTypes.bool,
      accessors: propTypes.object.isRequired,
      localizer: propTypes.object.isRequired,
      components: propTypes.object.isRequired,
      getters: propTypes.object.isRequired,
      onSelect: propTypes.func,
      onDoubleClick: propTypes.func,
    },
    defaultProps: {
      segments: [],
      selected: {},
    },
    renderEvent: function renderEvent(props, event) {
      var selected = props.selected,
        _ = props.isAllDay,
        accessors = props.accessors,
        getters = props.getters,
        onSelect = props.onSelect,
        onDoubleClick = props.onDoubleClick,
        localizer = props.localizer,
        slotMetrics = props.slotMetrics,
        components = props.components
      var continuesPrior = slotMetrics.continuesPrior(event)
      var continuesAfter = slotMetrics.continuesAfter(event)
      return React__default.createElement(EventCell, {
        event: event,
        getters: getters,
        localizer: localizer,
        accessors: accessors,
        components: components,
        onSelect: onSelect,
        onDoubleClick: onDoubleClick,
        continuesPrior: continuesPrior,
        continuesAfter: continuesAfter,
        slotStart: slotMetrics.first,
        slotEnd: slotMetrics.last,
        selected: isSelected(event, selected),
      })
    },
    renderSpan: function renderSpan(slots, len, key, content) {
      if (content === void 0) {
        content = ' '
      }

      var per = (Math.abs(len) / slots) * 100 + '%'
      return React__default.createElement(
        'div',
        {
          key: key,
          className: 'rbc-row-segment', // IE10/11 need max-width. flex-basis doesn't respect box-sizing
          style: {
            WebkitFlexBasis: per,
            flexBasis: per,
            maxWidth: per,
          },
        },
        content
      )
    },
  }

  var EventRow =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(EventRow, _React$Component)

      function EventRow() {
        return _React$Component.apply(this, arguments) || this
      }

      var _proto = EventRow.prototype

      _proto.render = function render() {
        var _this = this

        var _this$props = this.props,
          segments = _this$props.segments,
          slots = _this$props.slotMetrics.slots,
          className = _this$props.className
        var lastEnd = 1
        return React__default.createElement(
          'div',
          {
            className: clsx(className, 'rbc-row'),
          },
          segments.reduce(function(row, _ref, li) {
            var event = _ref.event,
              left = _ref.left,
              right = _ref.right,
              span = _ref.span
            var key = '_lvl_' + li
            var gap = left - lastEnd
            var content = EventRowMixin.renderEvent(_this.props, event)
            if (gap)
              row.push(EventRowMixin.renderSpan(slots, gap, key + '_gap'))
            row.push(EventRowMixin.renderSpan(slots, span, key, content))
            lastEnd = right + 1
            return row
          }, [])
        )
      }

      return EventRow
    })(React__default.Component)

  EventRow.propTypes = _extends(
    {
      segments: propTypes.array,
    },
    EventRowMixin.propTypes
  )
  EventRow.defaultProps = _extends({}, EventRowMixin.defaultProps)

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1)

    while (fromRight ? index-- : ++index < length) {
      if (predicate(array[index], index, array)) {
        return index
      }
    }
    return -1
  }

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = []
    this.size = 0
  }

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length
    while (length--) {
      if (eq$1(array[length][0], key)) {
        return length
      }
    }
    return -1
  }

  /** Used for built-in method references. */
  var arrayProto = Array.prototype

  /** Built-in value references. */
  var splice = arrayProto.splice

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
      index = assocIndexOf(data, key)

    if (index < 0) {
      return false
    }
    var lastIndex = data.length - 1
    if (index == lastIndex) {
      data.pop()
    } else {
      splice.call(data, index, 1)
    }
    --this.size
    return true
  }

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
      index = assocIndexOf(data, key)

    return index < 0 ? undefined : data[index][1]
  }

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1
  }

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
      index = assocIndexOf(data, key)

    if (index < 0) {
      ++this.size
      data.push([key, value])
    } else {
      data[index][1] = value
    }
    return this
  }

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
      length = entries == null ? 0 : entries.length

    this.clear()
    while (++index < length) {
      var entry = entries[index]
      this.set(entry[0], entry[1])
    }
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear
  ListCache.prototype['delete'] = listCacheDelete
  ListCache.prototype.get = listCacheGet
  ListCache.prototype.has = listCacheHas
  ListCache.prototype.set = listCacheSet

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new ListCache()
    this.size = 0
  }

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
      result = data['delete'](key)

    this.size = data.size
    return result
  }

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key)
  }

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key)
  }

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root$1['__core-js_shared__']

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(
      (coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || ''
    )
    return uid ? 'Symbol(src)_1.' + uid : ''
  })()

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func
  }

  /** Used for built-in method references. */
  var funcProto = Function.prototype

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func)
      } catch (e) {}
      try {
        return func + ''
      } catch (e) {}
    }
    return ''
  }

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/

  /** Used for built-in method references. */
  var funcProto$1 = Function.prototype,
    objectProto$2 = Object.prototype

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$2.hasOwnProperty

  /** Used to detect if a method is native. */
  var reIsNative = RegExp(
    '^' +
      funcToString$1
        .call(hasOwnProperty$3)
        .replace(reRegExpChar, '\\$&')
        .replace(
          /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
          '$1.*?'
        ) +
      '$'
  )

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject$1(value) || isMasked(value)) {
      return false
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor
    return pattern.test(toSource(value))
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key]
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key)
    return baseIsNative(value) ? value : undefined
  }

  /* Built-in method references that are verified to be native. */
  var Map$1 = getNative(root$1, 'Map')

  /* Built-in method references that are verified to be native. */
  var nativeCreate = getNative(Object, 'create')

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {}
    this.size = 0
  }

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key]
    this.size -= result ? 1 : 0
    return result
  }

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__'

  /** Used for built-in method references. */
  var objectProto$3 = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$4 = objectProto$3.hasOwnProperty

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__
    if (nativeCreate) {
      var result = data[key]
      return result === HASH_UNDEFINED ? undefined : result
    }
    return hasOwnProperty$4.call(data, key) ? data[key] : undefined
  }

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$5 = objectProto$4.hasOwnProperty

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__
    return nativeCreate
      ? data[key] !== undefined
      : hasOwnProperty$5.call(data, key)
  }

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$1 = '__lodash_hash_undefined__'

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__
    this.size += this.has(key) ? 0 : 1
    data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED$1 : value
    return this
  }

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
      length = entries == null ? 0 : entries.length

    this.clear()
    while (++index < length) {
      var entry = entries[index]
      this.set(entry[0], entry[1])
    }
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear
  Hash.prototype['delete'] = hashDelete
  Hash.prototype.get = hashGet
  Hash.prototype.has = hashHas
  Hash.prototype.set = hashSet

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0
    this.__data__ = {
      hash: new Hash(),
      map: new (Map$1 || ListCache)(),
      string: new Hash(),
    }
  }

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value
    return type == 'string' ||
      type == 'number' ||
      type == 'symbol' ||
      type == 'boolean'
      ? value !== '__proto__'
      : value === null
  }

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__
    return isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map
  }

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = getMapData(this, key)['delete'](key)
    this.size -= result ? 1 : 0
    return result
  }

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key)
  }

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key)
  }

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = getMapData(this, key),
      size = data.size

    data.set(key, value)
    this.size += data.size == size ? 0 : 1
    return this
  }

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
      length = entries == null ? 0 : entries.length

    this.clear()
    while (++index < length) {
      var entry = entries[index]
      this.set(entry[0], entry[1])
    }
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear
  MapCache.prototype['delete'] = mapCacheDelete
  MapCache.prototype.get = mapCacheGet
  MapCache.prototype.has = mapCacheHas
  MapCache.prototype.set = mapCacheSet

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__
    if (data instanceof ListCache) {
      var pairs = data.__data__
      if (!Map$1 || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value])
        this.size = ++data.size
        return this
      }
      data = this.__data__ = new MapCache(pairs)
    }
    data.set(key, value)
    this.size = data.size
    return this
  }

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = (this.__data__ = new ListCache(entries))
    this.size = data.size
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = stackClear
  Stack.prototype['delete'] = stackDelete
  Stack.prototype.get = stackGet
  Stack.prototype.has = stackHas
  Stack.prototype.set = stackSet

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$2 = '__lodash_hash_undefined__'

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED$2)
    return this
  }

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value)
  }

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
      length = values == null ? 0 : values.length

    this.__data__ = new MapCache()
    while (++index < length) {
      this.add(values[index])
    }
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd
  SetCache.prototype.has = setCacheHas

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
      length = array == null ? 0 : array.length

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true
      }
    }
    return false
  }

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key)
  }

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array)
    if (stacked && stack.get(other)) {
      return stacked == other
    }
    var index = -1,
      result = true,
      seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined

    stack.set(array, other)
    stack.set(other, array)

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
        othValue = other[index]

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, arrValue, index, other, array, stack)
          : customizer(arrValue, othValue, index, array, other, stack)
      }
      if (compared !== undefined) {
        if (compared) {
          continue
        }
        result = false
        break
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (
          !arraySome(other, function(othValue, othIndex) {
            if (
              !cacheHas(seen, othIndex) &&
              (arrValue === othValue ||
                equalFunc(arrValue, othValue, bitmask, customizer, stack))
            ) {
              return seen.push(othIndex)
            }
          })
        ) {
          result = false
          break
        }
      } else if (
        !(
          arrValue === othValue ||
          equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )
      ) {
        result = false
        break
      }
    }
    stack['delete'](array)
    stack['delete'](other)
    return result
  }

  /** Built-in value references. */
  var Uint8Array$3 = root$1.Uint8Array

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
      result = Array(map.size)

    map.forEach(function(value, key) {
      result[++index] = [key, value]
    })
    return result
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
      result = Array(set.size)

    set.forEach(function(value) {
      result[++index] = value
    })
    return result
  }

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$1 = 1,
    COMPARE_UNORDERED_FLAG$1 = 2

  /** `Object#toString` result references. */
  var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag$1 = '[object Symbol]'

  var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]'

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = Symbol$2 ? Symbol$2.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(
    object,
    other,
    tag,
    bitmask,
    customizer,
    equalFunc,
    stack
  ) {
    switch (tag) {
      case dataViewTag:
        if (
          object.byteLength != other.byteLength ||
          object.byteOffset != other.byteOffset
        ) {
          return false
        }
        object = object.buffer
        other = other.buffer

      case arrayBufferTag:
        if (
          object.byteLength != other.byteLength ||
          !equalFunc(new Uint8Array$3(object), new Uint8Array$3(other))
        ) {
          return false
        }
        return true

      case boolTag:
      case dateTag:
      case numberTag:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq$1(+object, +other)

      case errorTag:
        return object.name == other.name && object.message == other.message

      case regexpTag:
      case stringTag:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == other + ''

      case mapTag:
        var convert = mapToArray

      case setTag:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1
        convert || (convert = setToArray)

        if (object.size != other.size && !isPartial) {
          return false
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object)
        if (stacked) {
          return stacked == other
        }
        bitmask |= COMPARE_UNORDERED_FLAG$1

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other)
        var result = equalArrays(
          convert(object),
          convert(other),
          bitmask,
          customizer,
          equalFunc,
          stack
        )
        stack['delete'](object)
        return result

      case symbolTag$1:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other)
        }
    }
    return false
  }

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush$1(array, values) {
    var index = -1,
      length = values.length,
      offset = array.length

    while (++index < length) {
      array[offset + index] = values[index]
    }
    return array
  }

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray$1 = Array.isArray

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object)
    return isArray$1(object) ? result : arrayPush$1(result, symbolsFunc(object))
  }

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = []

    while (++index < length) {
      var value = array[index]
      if (predicate(value, index, array)) {
        result[resIndex++] = value
      }
    }
    return result
  }

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return []
  }

  /** Used for built-in method references. */
  var objectProto$5 = Object.prototype

  /** Built-in value references. */
  var propertyIsEnumerable$1 = objectProto$5.propertyIsEnumerable

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols

  /**
   * Creates an array of the own enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = !nativeGetSymbols
    ? stubArray
    : function(object) {
        if (object == null) {
          return []
        }
        object = Object(object)
        return arrayFilter(nativeGetSymbols(object), function(symbol) {
          return propertyIsEnumerable$1.call(object, symbol)
        })
      }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
      result = Array(n)

    while (++index < n) {
      result[index] = iteratee(index)
    }
    return result
  }

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]'

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag
  }

  /** Used for built-in method references. */
  var objectProto$6 = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$6 = objectProto$6.hasOwnProperty

  /** Built-in value references. */
  var propertyIsEnumerable$2 = objectProto$6.propertyIsEnumerable

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = baseIsArguments(
    (function() {
      return arguments
    })()
  )
    ? baseIsArguments
    : function(value) {
        return (
          isObjectLike(value) &&
          hasOwnProperty$6.call(value, 'callee') &&
          !propertyIsEnumerable$2.call(value, 'callee')
        )
      }

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false
  }

  /** Detect free variable `exports`. */
  var freeExports =
    typeof exports == 'object' && exports && !exports.nodeType && exports

  /** Detect free variable `module`. */
  var freeModule =
    freeExports &&
    typeof module == 'object' &&
    module &&
    !module.nodeType &&
    module

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports

  /** Built-in value references. */
  var Buffer = moduleExports ? root$1.Buffer : undefined

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse

  /** `Object#toString` result references. */
  var argsTag$1 = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag$1 = '[object Boolean]',
    dateTag$1 = '[object Date]',
    errorTag$1 = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag$1 = '[object Map]',
    numberTag$1 = '[object Number]',
    objectTag = '[object Object]',
    regexpTag$1 = '[object RegExp]',
    setTag$1 = '[object Set]',
    stringTag$1 = '[object String]',
    weakMapTag = '[object WeakMap]'

  var arrayBufferTag$1 = '[object ArrayBuffer]',
    dataViewTag$1 = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]'

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {}
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[
    int8Tag
  ] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[
    uint8Tag
  ] = typedArrayTags[uint8ClampedTag] = typedArrayTags[
    uint16Tag
  ] = typedArrayTags[uint32Tag] = true
  typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] = typedArrayTags[
    arrayBufferTag$1
  ] = typedArrayTags[boolTag$1] = typedArrayTags[
    dataViewTag$1
  ] = typedArrayTags[dateTag$1] = typedArrayTags[errorTag$1] = typedArrayTags[
    funcTag$1
  ] = typedArrayTags[mapTag$1] = typedArrayTags[numberTag$1] = typedArrayTags[
    objectTag
  ] = typedArrayTags[regexpTag$1] = typedArrayTags[setTag$1] = typedArrayTags[
    stringTag$1
  ] = typedArrayTags[weakMapTag] = false

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return (
      isObjectLike(value) &&
      isLength(value.length) &&
      !!typedArrayTags[baseGetTag(value)]
    )
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value)
    }
  }

  /** Detect free variable `exports`. */
  var freeExports$1 =
    typeof exports == 'object' && exports && !exports.nodeType && exports

  /** Detect free variable `module`. */
  var freeModule$1 =
    freeExports$1 &&
    typeof module == 'object' &&
    module &&
    !module.nodeType &&
    module

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports$1 && freeGlobal.process

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types =
        freeModule$1 &&
        freeModule$1.require &&
        freeModule$1.require('util').types

      if (types) {
        return types
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util')
    } catch (e) {}
  })()

  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray$1 = nodeIsTypedArray
    ? baseUnary(nodeIsTypedArray)
    : baseIsTypedArray

  /** Used for built-in method references. */
  var objectProto$7 = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$7 = objectProto$7.hasOwnProperty

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray$1(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray$1(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length

    for (var key in value) {
      if (
        (inherited || hasOwnProperty$7.call(value, key)) &&
        !(
          skipIndexes &&
          // Safari 9 has enumerable `arguments.length` in strict mode.
          (key == 'length' ||
            // Node.js 0.10 has enumerable non-index properties on buffers.
            (isBuff && (key == 'offset' || key == 'parent')) ||
            // PhantomJS 2 has enumerable non-index properties on typed arrays.
            (isType &&
              (key == 'buffer' ||
                key == 'byteLength' ||
                key == 'byteOffset')) ||
            // Skip index properties.
            isIndex(key, length))
        )
      ) {
        result.push(key)
      }
    }
    return result
  }

  /** Used for built-in method references. */
  var objectProto$8 = Object.prototype

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8

    return value === proto
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg))
    }
  }

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = overArg(Object.keys, Object)

  /** Used for built-in method references. */
  var objectProto$9 = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$8 = objectProto$9.hasOwnProperty

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object)
    }
    var result = []
    for (var key in Object(object)) {
      if (hasOwnProperty$8.call(object, key) && key != 'constructor') {
        result.push(key)
      }
    }
    return result
  }

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys$4(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object)
  }

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys$4, getSymbols)
  }

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$2 = 1

  /** Used for built-in method references. */
  var objectProto$a = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$9 = objectProto$a.hasOwnProperty

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length

    if (objLength != othLength && !isPartial) {
      return false
    }
    var index = objLength
    while (index--) {
      var key = objProps[index]
      if (!(isPartial ? key in other : hasOwnProperty$9.call(other, key))) {
        return false
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object)
    if (stacked && stack.get(other)) {
      return stacked == other
    }
    var result = true
    stack.set(object, other)
    stack.set(other, object)

    var skipCtor = isPartial
    while (++index < objLength) {
      key = objProps[index]
      var objValue = object[key],
        othValue = other[key]

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, objValue, key, other, object, stack)
          : customizer(objValue, othValue, key, object, other, stack)
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (
        !(compared === undefined
          ? objValue === othValue ||
            equalFunc(objValue, othValue, bitmask, customizer, stack)
          : compared)
      ) {
        result = false
        break
      }
      skipCtor || (skipCtor = key == 'constructor')
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
        othCtor = other.constructor

      // Non `Object` object instances with different constructors are not equal.
      if (
        objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(
          typeof objCtor == 'function' &&
          objCtor instanceof objCtor &&
          typeof othCtor == 'function' &&
          othCtor instanceof othCtor
        )
      ) {
        result = false
      }
    }
    stack['delete'](object)
    stack['delete'](other)
    return result
  }

  /* Built-in method references that are verified to be native. */
  var DataView$2 = getNative(root$1, 'DataView')

  /* Built-in method references that are verified to be native. */
  var Promise$3 = getNative(root$1, 'Promise')

  /* Built-in method references that are verified to be native. */
  var Set$1 = getNative(root$1, 'Set')

  /* Built-in method references that are verified to be native. */
  var WeakMap$2 = getNative(root$1, 'WeakMap')

  /** `Object#toString` result references. */
  var mapTag$2 = '[object Map]',
    objectTag$1 = '[object Object]',
    promiseTag = '[object Promise]',
    setTag$2 = '[object Set]',
    weakMapTag$1 = '[object WeakMap]'

  var dataViewTag$2 = '[object DataView]'

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = toSource(DataView$2),
    mapCtorString = toSource(Map$1),
    promiseCtorString = toSource(Promise$3),
    setCtorString = toSource(Set$1),
    weakMapCtorString = toSource(WeakMap$2)

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = baseGetTag

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if (
    (DataView$2 &&
      getTag(new DataView$2(new ArrayBuffer(1))) != dataViewTag$2) ||
    (Map$1 && getTag(new Map$1()) != mapTag$2) ||
    (Promise$3 && getTag(Promise$3.resolve()) != promiseTag) ||
    (Set$1 && getTag(new Set$1()) != setTag$2) ||
    (WeakMap$2 && getTag(new WeakMap$2()) != weakMapTag$1)
  ) {
    getTag = function(value) {
      var result = baseGetTag(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : ''

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag$2
          case mapCtorString:
            return mapTag$2
          case promiseCtorString:
            return promiseTag
          case setCtorString:
            return setTag$2
          case weakMapCtorString:
            return weakMapTag$1
        }
      }
      return result
    }
  }

  var getTag$1 = getTag

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$3 = 1

  /** `Object#toString` result references. */
  var argsTag$2 = '[object Arguments]',
    arrayTag$1 = '[object Array]',
    objectTag$2 = '[object Object]'

  /** Used for built-in method references. */
  var objectProto$b = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$a = objectProto$b.hasOwnProperty

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(
    object,
    other,
    bitmask,
    customizer,
    equalFunc,
    stack
  ) {
    var objIsArr = isArray$1(object),
      othIsArr = isArray$1(other),
      objTag = objIsArr ? arrayTag$1 : getTag$1(object),
      othTag = othIsArr ? arrayTag$1 : getTag$1(other)

    objTag = objTag == argsTag$2 ? objectTag$2 : objTag
    othTag = othTag == argsTag$2 ? objectTag$2 : othTag

    var objIsObj = objTag == objectTag$2,
      othIsObj = othTag == objectTag$2,
      isSameTag = objTag == othTag

    if (isSameTag && isBuffer(object)) {
      if (!isBuffer(other)) {
        return false
      }
      objIsArr = true
      objIsObj = false
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack())
      return objIsArr || isTypedArray$1(object)
        ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
        : equalByTag(
            object,
            other,
            objTag,
            bitmask,
            customizer,
            equalFunc,
            stack
          )
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG$3)) {
      var objIsWrapped =
          objIsObj && hasOwnProperty$a.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty$a.call(other, '__wrapped__')

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other

        stack || (stack = new Stack())
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack)
      }
    }
    if (!isSameTag) {
      return false
    }
    stack || (stack = new Stack())
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack)
  }

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Unordered comparison
   *  2 - Partial comparison
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true
    }
    if (
      value == null ||
      other == null ||
      (!isObjectLike(value) && !isObjectLike(other))
    ) {
      return value !== value && other !== other
    }
    return baseIsEqualDeep(
      value,
      other,
      bitmask,
      customizer,
      baseIsEqual,
      stack
    )
  }

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$4 = 1,
    COMPARE_UNORDERED_FLAG$2 = 2

  /**
   * The base implementation of `_.isMatch` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @param {Object} source The object of property values to match.
   * @param {Array} matchData The property names, values, and compare flags to match.
   * @param {Function} [customizer] The function to customize comparisons.
   * @returns {boolean} Returns `true` if `object` is a match, else `false`.
   */
  function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
      length = index,
      noCustomizer = !customizer

    if (object == null) {
      return !length
    }
    object = Object(object)
    while (index--) {
      var data = matchData[index]
      if (
        noCustomizer && data[2]
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
      ) {
        return false
      }
    }
    while (++index < length) {
      data = matchData[index]
      var key = data[0],
        objValue = object[key],
        srcValue = data[1]

      if (noCustomizer && data[2]) {
        if (objValue === undefined && !(key in object)) {
          return false
        }
      } else {
        var stack = new Stack()
        if (customizer) {
          var result = customizer(
            objValue,
            srcValue,
            key,
            object,
            source,
            stack
          )
        }
        if (
          !(result === undefined
            ? baseIsEqual(
                srcValue,
                objValue,
                COMPARE_PARTIAL_FLAG$4 | COMPARE_UNORDERED_FLAG$2,
                customizer,
                stack
              )
            : result)
        ) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` if suitable for strict
   *  equality comparisons, else `false`.
   */
  function isStrictComparable(value) {
    return value === value && !isObject$1(value)
  }

  /**
   * Gets the property names, values, and compare flags of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the match data of `object`.
   */
  function getMatchData(object) {
    var result = keys$4(object),
      length = result.length

    while (length--) {
      var key = result[length],
        value = object[key]

      result[length] = [key, value, isStrictComparable(value)]
    }
    return result
  }

  /**
   * A specialized version of `matchesProperty` for source values suitable
   * for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function matchesStrictComparable(key, srcValue) {
    return function(object) {
      if (object == null) {
        return false
      }
      return (
        object[key] === srcValue &&
        (srcValue !== undefined || key in Object(object))
      )
    }
  }

  /**
   * The base implementation of `_.matches` which doesn't clone `source`.
   *
   * @private
   * @param {Object} source The object of property values to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatches(source) {
    var matchData = getMatchData(source)
    if (matchData.length == 1 && matchData[0][2]) {
      return matchesStrictComparable(matchData[0][0], matchData[0][1])
    }
    return function(object) {
      return object === source || baseIsMatch(object, source, matchData)
    }
  }

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray$1(value)) {
      return false
    }
    var type = typeof value
    if (
      type == 'number' ||
      type == 'symbol' ||
      type == 'boolean' ||
      value == null ||
      isSymbol$1(value)
    ) {
      return true
    }
    return (
      reIsPlainProp.test(value) ||
      !reIsDeepProp.test(value) ||
      (object != null && value in Object(object))
    )
  }

  /** Error message constants. */
  var FUNC_ERROR_TEXT = 'Expected a function'

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `clear`, `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (
      typeof func != 'function' ||
      (resolver != null && typeof resolver != 'function')
    ) {
      throw new TypeError(FUNC_ERROR_TEXT)
    }
    var memoized = function() {
      var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache

      if (cache.has(key)) {
        return cache.get(key)
      }
      var result = func.apply(this, args)
      memoized.cache = cache.set(key, result) || cache
      return result
    }
    memoized.cache = new (memoize.Cache || MapCache)()
    return memoized
  }

  // Expose `MapCache`.
  memoize.Cache = MapCache

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500

  /**
   * A specialized version of `_.memoize` which clears the memoized function's
   * cache when it exceeds `MAX_MEMOIZE_SIZE`.
   *
   * @private
   * @param {Function} func The function to have its output memoized.
   * @returns {Function} Returns the new memoized function.
   */
  function memoizeCapped(func) {
    var result = memoize(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear()
      }
      return key
    })

    var cache = result.cache
    return result
  }

  /** Used to match property names within property paths. */
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = memoizeCapped(function(string) {
    var result = []
    if (string.charCodeAt(0) === 46 /* . */) {
      result.push('')
    }
    string.replace(rePropName, function(match, number, quote, subString) {
      result.push(
        quote ? subString.replace(reEscapeChar, '$1') : number || match
      )
    })
    return result
  })

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length)

    while (++index < length) {
      result[index] = iteratee(array[index], index, array)
    }
    return result
  }

  /** Used as references for various `Number` constants. */
  var INFINITY$1 = 1 / 0

  /** Used to convert symbols to primitives and strings. */
  var symbolProto$1 = Symbol$2 ? Symbol$2.prototype : undefined,
    symbolToString$1 = symbolProto$1 ? symbolProto$1.toString : undefined

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value
    }
    if (isArray$1(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return arrayMap(value, baseToString) + ''
    }
    if (isSymbol$1(value)) {
      return symbolToString$1 ? symbolToString$1.call(value) : ''
    }
    var result = value + ''
    return result == '0' && 1 / value == -INFINITY$1 ? '-0' : result
  }

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString$2(value) {
    return value == null ? '' : baseToString(value)
  }

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {Object} [object] The object to query keys on.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value, object) {
    if (isArray$1(value)) {
      return value
    }
    return isKey(value, object) ? [value] : stringToPath(toString$2(value))
  }

  /** Used as references for various `Number` constants. */
  var INFINITY$2 = 1 / 0

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol$1(value)) {
      return value
    }
    var result = value + ''
    return result == '0' && 1 / value == -INFINITY$2 ? '-0' : result
  }

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = castPath(path, object)

    var index = 0,
      length = path.length

    while (object != null && index < length) {
      object = object[toKey(path[index++])]
    }
    return index && index == length ? object : undefined
  }

  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get$3(object, path, defaultValue) {
    var result = object == null ? undefined : baseGet(object, path)
    return result === undefined ? defaultValue : result
  }

  /**
   * The base implementation of `_.hasIn` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHasIn(object, key) {
    return object != null && key in Object(object)
  }

  /**
   * Checks if `path` exists on `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @param {Function} hasFunc The function to check properties.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   */
  function hasPath(object, path, hasFunc) {
    path = castPath(path, object)

    var index = -1,
      length = path.length,
      result = false

    while (++index < length) {
      var key = toKey(path[index])
      if (!(result = object != null && hasFunc(object, key))) {
        break
      }
      object = object[key]
    }
    if (result || ++index != length) {
      return result
    }
    length = object == null ? 0 : object.length
    return (
      !!length &&
      isLength(length) &&
      isIndex(key, length) &&
      (isArray$1(object) || isArguments(object))
    )
  }

  /**
   * Checks if `path` is a direct or inherited property of `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.hasIn(object, 'a');
   * // => true
   *
   * _.hasIn(object, 'a.b');
   * // => true
   *
   * _.hasIn(object, ['a', 'b']);
   * // => true
   *
   * _.hasIn(object, 'b');
   * // => false
   */
  function hasIn(object, path) {
    return object != null && hasPath(object, path, baseHasIn)
  }

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$5 = 1,
    COMPARE_UNORDERED_FLAG$3 = 2

  /**
   * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
   *
   * @private
   * @param {string} path The path of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatchesProperty(path, srcValue) {
    if (isKey(path) && isStrictComparable(srcValue)) {
      return matchesStrictComparable(toKey(path), srcValue)
    }
    return function(object) {
      var objValue = get$3(object, path)
      return objValue === undefined && objValue === srcValue
        ? hasIn(object, path)
        : baseIsEqual(
            srcValue,
            objValue,
            COMPARE_PARTIAL_FLAG$5 | COMPARE_UNORDERED_FLAG$3
          )
    }
  }

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value
  }

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function(object) {
      return object == null ? undefined : object[key]
    }
  }

  /**
   * A specialized version of `baseProperty` which supports deep paths.
   *
   * @private
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyDeep(path) {
    return function(object) {
      return baseGet(object, path)
    }
  }

  /**
   * Creates a function that returns the value at `path` of a given object.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   * @example
   *
   * var objects = [
   *   { 'a': { 'b': 2 } },
   *   { 'a': { 'b': 1 } }
   * ];
   *
   * _.map(objects, _.property('a.b'));
   * // => [2, 1]
   *
   * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
   * // => [1, 2]
   */
  function property(path) {
    return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path)
  }

  /**
   * The base implementation of `_.iteratee`.
   *
   * @private
   * @param {*} [value=_.identity] The value to convert to an iteratee.
   * @returns {Function} Returns the iteratee.
   */
  function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
      return value
    }
    if (value == null) {
      return identity
    }
    if (typeof value == 'object') {
      return isArray$1(value)
        ? baseMatchesProperty(value[0], value[1])
        : baseMatches(value)
    }
    return property(value)
  }

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax$1 = Math.max

  /**
   * This method is like `_.find` except that it returns the index of the first
   * element `predicate` returns truthy for instead of the element itself.
   *
   * @static
   * @memberOf _
   * @since 1.1.0
   * @category Array
   * @param {Array} array The array to inspect.
   * @param {Function} [predicate=_.identity] The function invoked per iteration.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the found element, else `-1`.
   * @example
   *
   * var users = [
   *   { 'user': 'barney',  'active': false },
   *   { 'user': 'fred',    'active': false },
   *   { 'user': 'pebbles', 'active': true }
   * ];
   *
   * _.findIndex(users, function(o) { return o.user == 'barney'; });
   * // => 0
   *
   * // The `_.matches` iteratee shorthand.
   * _.findIndex(users, { 'user': 'fred', 'active': false });
   * // => 1
   *
   * // The `_.matchesProperty` iteratee shorthand.
   * _.findIndex(users, ['active', false]);
   * // => 0
   *
   * // The `_.property` iteratee shorthand.
   * _.findIndex(users, 'active');
   * // => 2
   */
  function findIndex$2(array, predicate, fromIndex) {
    var length = array == null ? 0 : array.length
    if (!length) {
      return -1
    }
    var index = fromIndex == null ? 0 : toInteger$1(fromIndex)
    if (index < 0) {
      index = nativeMax$1(length + index, 0)
    }
    return baseFindIndex(array, baseIteratee(predicate, 3), index)
  }

  function endOfRange(dateRange, unit) {
    if (unit === void 0) {
      unit = 'day'
    }

    return {
      first: dateRange[0],
      last: add(dateRange[dateRange.length - 1], 1, unit),
    }
  }
  function eventSegments(event, range, accessors) {
    var _endOfRange = endOfRange(range),
      first = _endOfRange.first,
      last = _endOfRange.last

    var slots = diff(first, last, 'day')
    var start = max$4(startOf(accessors.start(event), 'day'), first)
    var end = min$9(ceil$3(accessors.end(event), 'day'), last)
    var padding = findIndex$2(range, function(x) {
      return eq(x, start, 'day')
    })
    var span = diff(start, end, 'day')
    span = Math.min(span, slots)
    span = Math.max(span, 1)
    return {
      event: event,
      span: span,
      left: padding + 1,
      right: Math.max(padding + span, 1),
    }
  }
  function eventLevels(rowSegments, limit) {
    if (limit === void 0) {
      limit = Infinity
    }

    var i,
      j,
      seg,
      levels = [],
      extra = []

    for (i = 0; i < rowSegments.length; i++) {
      seg = rowSegments[i]

      for (j = 0; j < levels.length; j++) {
        if (!segsOverlap(seg, levels[j])) break
      }

      if (j >= limit) {
        extra.push(seg)
      } else {
        ;(levels[j] || (levels[j] = [])).push(seg)
      }
    }

    for (i = 0; i < levels.length; i++) {
      levels[i].sort(function(a, b) {
        return a.left - b.left
      }) //eslint-disable-line
    }

    return {
      levels: levels,
      extra: extra,
    }
  }
  function inRange$1(e, start, end, accessors) {
    var eStart = startOf(accessors.start(e), 'day')
    var eEnd = accessors.end(e)
    var startsBeforeEnd = lte(eStart, end, 'day') // when the event is zero duration we need to handle a bit differently

    var endsAfterStart = !eq(eStart, eEnd, 'minutes')
      ? gt(eEnd, start, 'minutes')
      : gte(eEnd, start, 'minutes')
    return startsBeforeEnd && endsAfterStart
  }
  function segsOverlap(seg, otherSegs) {
    return otherSegs.some(function(otherSeg) {
      return otherSeg.left <= seg.right && otherSeg.right >= seg.left
    })
  }
  function sortEvents(evtA, evtB, accessors) {
    var startSort =
      +startOf(accessors.start(evtA), 'day') -
      +startOf(accessors.start(evtB), 'day')
    var durA = diff(
      accessors.start(evtA),
      ceil$3(accessors.end(evtA), 'day'),
      'day'
    )
    var durB = diff(
      accessors.start(evtB),
      ceil$3(accessors.end(evtB), 'day'),
      'day'
    )
    return (
      startSort || // sort by start Day first
      Math.max(durB, 1) - Math.max(durA, 1) || // events spanning multiple days go first
      !!accessors.allDay(evtB) - !!accessors.allDay(evtA) || // then allDay single day events
      +accessors.start(evtA) - +accessors.start(evtB)
    ) // then sort by start time
  }

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeCeil$1 = Math.ceil,
    nativeMax$2 = Math.max

  /**
   * The base implementation of `_.range` and `_.rangeRight` which doesn't
   * coerce arguments.
   *
   * @private
   * @param {number} start The start of the range.
   * @param {number} end The end of the range.
   * @param {number} step The value to increment or decrement by.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Array} Returns the range of numbers.
   */
  function baseRange(start, end, step, fromRight) {
    var index = -1,
      length = nativeMax$2(nativeCeil$1((end - start) / (step || 1)), 0),
      result = Array(length)

    while (length--) {
      result[fromRight ? length : ++index] = start
      start += step
    }
    return result
  }

  /**
   * Creates a `_.range` or `_.rangeRight` function.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new range function.
   */
  function createRange(fromRight) {
    return function(start, end, step) {
      if (step && typeof step != 'number' && isIterateeCall(start, end, step)) {
        end = step = undefined
      }
      // Ensure the sign of `-0` is preserved.
      start = toFinite(start)
      if (end === undefined) {
        end = start
        start = 0
      } else {
        end = toFinite(end)
      }
      step = step === undefined ? (start < end ? 1 : -1) : toFinite(step)
      return baseRange(start, end, step, fromRight)
    }
  }

  /**
   * Creates an array of numbers (positive and/or negative) progressing from
   * `start` up to, but not including, `end`. A step of `-1` is used if a negative
   * `start` is specified without an `end` or `step`. If `end` is not specified,
   * it's set to `start` with `start` then set to `0`.
   *
   * **Note:** JavaScript follows the IEEE-754 standard for resolving
   * floating-point values which can produce unexpected results.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {number} [start=0] The start of the range.
   * @param {number} end The end of the range.
   * @param {number} [step=1] The value to increment or decrement by.
   * @returns {Array} Returns the range of numbers.
   * @see _.inRange, _.rangeRight
   * @example
   *
   * _.range(4);
   * // => [0, 1, 2, 3]
   *
   * _.range(-4);
   * // => [0, -1, -2, -3]
   *
   * _.range(1, 5);
   * // => [1, 2, 3, 4]
   *
   * _.range(0, 20, 5);
   * // => [0, 5, 10, 15]
   *
   * _.range(0, -4, -1);
   * // => [0, -1, -2, -3]
   *
   * _.range(1, 4, 0);
   * // => [1, 1, 1]
   *
   * _.range(0);
   * // => []
   */
  var range$1 = createRange()

  var isSegmentInSlot = function isSegmentInSlot(seg, slot) {
    return seg.left <= slot && seg.right >= slot
  }

  var eventsInSlot = function eventsInSlot(segments, slot) {
    return segments.filter(function(seg) {
      return isSegmentInSlot(seg, slot)
    }).length
  }

  var EventEndingRow =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(EventEndingRow, _React$Component)

      function EventEndingRow() {
        return _React$Component.apply(this, arguments) || this
      }

      var _proto = EventEndingRow.prototype

      _proto.render = function render() {
        var _this$props = this.props,
          segments = _this$props.segments,
          slots = _this$props.slotMetrics.slots
        var rowSegments = eventLevels(segments).levels[0]
        var current = 1,
          lastEnd = 1,
          row = []

        while (current <= slots) {
          var key = '_lvl_' + current

          var _ref =
              rowSegments.filter(function(seg) {
                return isSegmentInSlot(seg, current)
              })[0] || {},
            event = _ref.event,
            left = _ref.left,
            right = _ref.right,
            span = _ref.span //eslint-disable-line

          if (!event) {
            current++
            continue
          }

          var gap = Math.max(0, left - lastEnd)

          if (this.canRenderSlotEvent(left, span)) {
            var content = EventRowMixin.renderEvent(this.props, event)

            if (gap) {
              row.push(EventRowMixin.renderSpan(slots, gap, key + '_gap'))
            }

            row.push(EventRowMixin.renderSpan(slots, span, key, content))
            lastEnd = current = right + 1
          } else {
            if (gap) {
              row.push(EventRowMixin.renderSpan(slots, gap, key + '_gap'))
            }

            row.push(
              EventRowMixin.renderSpan(
                slots,
                1,
                key,
                this.renderShowMore(segments, current)
              )
            )
            lastEnd = current = current + 1
          }
        }

        return React__default.createElement(
          'div',
          {
            className: 'rbc-row',
          },
          row
        )
      }

      _proto.canRenderSlotEvent = function canRenderSlotEvent(slot, span) {
        var segments = this.props.segments
        return range$1(slot, slot + span).every(function(s) {
          var count = eventsInSlot(segments, s)
          return count === 1
        })
      }

      _proto.renderShowMore = function renderShowMore(segments, slot) {
        var _this = this

        var localizer = this.props.localizer
        var count = eventsInSlot(segments, slot)
        return count
          ? React__default.createElement(
              'a',
              {
                key: 'sm_' + slot,
                href: '#',
                className: 'rbc-show-more',
                onClick: function onClick(e) {
                  return _this.showMore(slot, e)
                },
              },
              localizer.messages.showMore(count)
            )
          : false
      }

      _proto.showMore = function showMore(slot, e) {
        e.preventDefault()
        this.props.onShowMore(slot, e.target)
      }

      return EventEndingRow
    })(React__default.Component)

  EventEndingRow.propTypes = _extends(
    {
      segments: propTypes.array,
      slots: propTypes.number,
      onShowMore: propTypes.func,
    },
    EventRowMixin.propTypes
  )
  EventEndingRow.defaultProps = _extends({}, EventRowMixin.defaultProps)

  var simpleIsEqual = function simpleIsEqual(a, b) {
    return a === b
  }

  function index$2(resultFn, isEqual) {
    if (isEqual === void 0) {
      isEqual = simpleIsEqual
    }

    var lastThis
    var lastArgs = []
    var lastResult
    var calledOnce = false

    var isNewArgEqualToLast = function isNewArgEqualToLast(newArg, index) {
      return isEqual(newArg, lastArgs[index], index)
    }

    var result = function result() {
      for (
        var _len = arguments.length, newArgs = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        newArgs[_key] = arguments[_key]
      }

      if (
        calledOnce &&
        lastThis === this &&
        newArgs.length === lastArgs.length &&
        newArgs.every(isNewArgEqualToLast)
      ) {
        return lastResult
      }

      lastResult = resultFn.apply(this, newArgs)
      calledOnce = true
      lastThis = this
      lastArgs = newArgs
      return lastResult
    }

    return result
  }

  var isSegmentInSlot$1 = function isSegmentInSlot(seg, slot) {
    return seg.left <= slot && seg.right >= slot
  }

  var isEqual = function isEqual(a, b) {
    return a.range === b.range && a.events === b.events
  }

  function getSlotMetrics() {
    return index$2(function(options) {
      var range = options.range,
        events = options.events,
        maxRows = options.maxRows,
        minRows = options.minRows,
        accessors = options.accessors

      var _endOfRange = endOfRange(range),
        first = _endOfRange.first,
        last = _endOfRange.last

      var segments = events.map(function(evt) {
        return eventSegments(evt, range, accessors)
      })

      var _eventLevels = eventLevels(segments, Math.max(maxRows - 1, 1)),
        levels = _eventLevels.levels,
        extra = _eventLevels.extra

      while (levels.length < minRows) {
        levels.push([])
      }

      return {
        first: first,
        last: last,
        levels: levels,
        extra: extra,
        range: range,
        slots: range.length,
        clone: function clone(args) {
          var metrics = getSlotMetrics()
          return metrics(_extends({}, options, args))
        },
        getDateForSlot: function getDateForSlot(slotNumber) {
          return range[slotNumber]
        },
        getSlotForDate: function getSlotForDate(date) {
          return range.find(function(r) {
            return eq(r, date, 'day')
          })
        },
        getEventsForSlot: function getEventsForSlot(slot) {
          return segments
            .filter(function(seg) {
              return isSegmentInSlot$1(seg, slot)
            })
            .map(function(seg) {
              return seg.event
            })
        },
        continuesPrior: function continuesPrior(event) {
          return lt(accessors.start(event), first, 'day')
        },
        continuesAfter: function continuesAfter(event) {
          var eventEnd = accessors.end(event)
          var singleDayDuration = eq(
            accessors.start(event),
            eventEnd,
            'minutes'
          )
          return singleDayDuration
            ? gte(eventEnd, last, 'minutes')
            : gt(eventEnd, last, 'minutes')
        },
      }
    }, isEqual)
  }

  var DateContentRow =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(DateContentRow, _React$Component)

      function DateContentRow() {
        var _this

        for (
          var _len = arguments.length, args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          args[_key] = arguments[_key]
        }

        _this =
          _React$Component.call.apply(_React$Component, [this].concat(args)) ||
          this

        _this.handleSelectSlot = function(slot) {
          var _this$props = _this.props,
            range = _this$props.range,
            onSelectSlot = _this$props.onSelectSlot
          onSelectSlot(range.slice(slot.start, slot.end + 1), slot)
        }

        _this.handleShowMore = function(slot, target) {
          var _this$props2 = _this.props,
            range = _this$props2.range,
            onShowMore = _this$props2.onShowMore

          var metrics = _this.slotMetrics(_this.props)

          var row = qsa(
            ReactDOM.findDOMNode(_assertThisInitialized(_this)),
            '.rbc-row-bg'
          )[0]
          var cell
          if (row) cell = row.children[slot - 1]
          var events = metrics.getEventsForSlot(slot)
          onShowMore(events, range[slot - 1], cell, slot, target)
        }

        _this.createHeadingRef = function(r) {
          _this.headingRow = r
        }

        _this.createEventRef = function(r) {
          _this.eventRow = r
        }

        _this.getContainer = function() {
          var container = _this.props.container
          return container
            ? container()
            : ReactDOM.findDOMNode(_assertThisInitialized(_this))
        }

        _this.renderHeadingCell = function(date, index) {
          var _this$props3 = _this.props,
            renderHeader = _this$props3.renderHeader,
            getNow = _this$props3.getNow
          return renderHeader({
            date: date,
            key: 'header_' + index,
            className: clsx(
              'rbc-date-cell',
              eq(date, getNow(), 'day') && 'rbc-now'
            ),
          })
        }

        _this.renderDummy = function() {
          var _this$props4 = _this.props,
            className = _this$props4.className,
            range = _this$props4.range,
            renderHeader = _this$props4.renderHeader
          return React__default.createElement(
            'div',
            {
              className: className,
            },
            React__default.createElement(
              'div',
              {
                className: 'rbc-row-content',
              },
              renderHeader &&
                React__default.createElement(
                  'div',
                  {
                    className: 'rbc-row',
                    ref: _this.createHeadingRef,
                  },
                  range.map(_this.renderHeadingCell)
                ),
              React__default.createElement(
                'div',
                {
                  className: 'rbc-row',
                  ref: _this.createEventRef,
                },
                React__default.createElement(
                  'div',
                  {
                    className: 'rbc-row-segment',
                  },
                  React__default.createElement(
                    'div',
                    {
                      className: 'rbc-event',
                    },
                    React__default.createElement(
                      'div',
                      {
                        className: 'rbc-event-content',
                      },
                      '\xA0'
                    )
                  )
                )
              )
            )
          )
        }

        _this.slotMetrics = getSlotMetrics()
        return _this
      }

      var _proto = DateContentRow.prototype

      _proto.getRowLimit = function getRowLimit() {
        var eventHeight = height(this.eventRow)
        var headingHeight = this.headingRow ? height(this.headingRow) : 0
        var eventSpace = height(ReactDOM.findDOMNode(this)) - headingHeight
        return Math.max(Math.floor(eventSpace / eventHeight), 1)
      }

      _proto.render = function render() {
        var _this$props5 = this.props,
          date = _this$props5.date,
          rtl = _this$props5.rtl,
          range = _this$props5.range,
          className = _this$props5.className,
          selected = _this$props5.selected,
          selectable = _this$props5.selectable,
          renderForMeasure = _this$props5.renderForMeasure,
          accessors = _this$props5.accessors,
          getters = _this$props5.getters,
          components = _this$props5.components,
          getNow = _this$props5.getNow,
          renderHeader = _this$props5.renderHeader,
          onSelect = _this$props5.onSelect,
          localizer = _this$props5.localizer,
          onSelectStart = _this$props5.onSelectStart,
          onSelectEnd = _this$props5.onSelectEnd,
          onDoubleClick = _this$props5.onDoubleClick,
          resourceId = _this$props5.resourceId,
          longPressThreshold = _this$props5.longPressThreshold,
          isAllDay = _this$props5.isAllDay
        if (renderForMeasure) return this.renderDummy()
        var metrics = this.slotMetrics(this.props)
        var levels = metrics.levels,
          extra = metrics.extra
        var WeekWrapper = components.weekWrapper
        var eventRowProps = {
          selected: selected,
          accessors: accessors,
          getters: getters,
          localizer: localizer,
          components: components,
          onSelect: onSelect,
          onDoubleClick: onDoubleClick,
          resourceId: resourceId,
          slotMetrics: metrics,
        }
        return React__default.createElement(
          'div',
          {
            className: className,
          },
          React__default.createElement(BackgroundCells, {
            date: date,
            getNow: getNow,
            rtl: rtl,
            range: range,
            selectable: selectable,
            container: this.getContainer,
            getters: getters,
            onSelectStart: onSelectStart,
            onSelectEnd: onSelectEnd,
            onSelectSlot: this.handleSelectSlot,
            components: components,
            longPressThreshold: longPressThreshold,
          }),
          React__default.createElement(
            'div',
            {
              className: 'rbc-row-content',
            },
            renderHeader &&
              React__default.createElement(
                'div',
                {
                  className: 'rbc-row ',
                  ref: this.createHeadingRef,
                },
                range.map(this.renderHeadingCell)
              ),
            React__default.createElement(
              WeekWrapper,
              _extends(
                {
                  isAllDay: isAllDay,
                },
                eventRowProps
              ),
              levels.map(function(segs, idx) {
                return React__default.createElement(
                  EventRow,
                  _extends(
                    {
                      key: idx,
                      segments: segs,
                    },
                    eventRowProps
                  )
                )
              }),
              !!extra.length &&
                React__default.createElement(
                  EventEndingRow,
                  _extends(
                    {
                      segments: extra,
                      onShowMore: this.handleShowMore,
                    },
                    eventRowProps
                  )
                )
            )
          )
        )
      }

      return DateContentRow
    })(React__default.Component)

  DateContentRow.propTypes = {
    date: propTypes.instanceOf(Date),
    events: propTypes.array.isRequired,
    range: propTypes.array.isRequired,
    rtl: propTypes.bool,
    resourceId: propTypes.any,
    renderForMeasure: propTypes.bool,
    renderHeader: propTypes.func,
    container: propTypes.func,
    selected: propTypes.object,
    selectable: propTypes.oneOf([true, false, 'ignoreEvents']),
    longPressThreshold: propTypes.number,
    onShowMore: propTypes.func,
    onSelectSlot: propTypes.func,
    onSelect: propTypes.func,
    onSelectEnd: propTypes.func,
    onSelectStart: propTypes.func,
    onDoubleClick: propTypes.func,
    dayPropGetter: propTypes.func,
    getNow: propTypes.func.isRequired,
    isAllDay: propTypes.bool,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    localizer: propTypes.object.isRequired,
    minRows: propTypes.number.isRequired,
    maxRows: propTypes.number.isRequired,
  }
  DateContentRow.defaultProps = {
    minRows: 0,
    maxRows: Infinity,
  }

  var Header = function Header(_ref) {
    var label = _ref.label
    return React__default.createElement('span', null, label)
  }

  Header.propTypes = {
    label: propTypes.node,
  }

  var DateHeader = function DateHeader(_ref) {
    var label = _ref.label,
      drilldownView = _ref.drilldownView,
      onDrillDown = _ref.onDrillDown

    if (!drilldownView) {
      return React__default.createElement('span', null, label)
    }

    return React__default.createElement(
      'a',
      {
        href: '#',
        onClick: onDrillDown,
      },
      label
    )
  }

  DateHeader.propTypes = {
    label: propTypes.node,
    date: propTypes.instanceOf(Date),
    drilldownView: propTypes.string,
    onDrillDown: propTypes.func,
    isOffRange: propTypes.bool,
  }

  var eventsForWeek = function eventsForWeek(evts, start, end, accessors) {
    return evts.filter(function(e) {
      return inRange$1(e, start, end, accessors)
    })
  }

  var MonthView =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(MonthView, _React$Component)

      function MonthView() {
        var _this

        for (
          var _len = arguments.length, _args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          _args[_key] = arguments[_key]
        }

        _this =
          _React$Component.call.apply(_React$Component, [this].concat(_args)) ||
          this

        _this.getContainer = function() {
          return ReactDOM.findDOMNode(_assertThisInitialized(_this))
        }

        _this.renderWeek = function(week, weekIdx) {
          var _this$props = _this.props,
            events = _this$props.events,
            components = _this$props.components,
            selectable = _this$props.selectable,
            getNow = _this$props.getNow,
            selected = _this$props.selected,
            date = _this$props.date,
            localizer = _this$props.localizer,
            longPressThreshold = _this$props.longPressThreshold,
            accessors = _this$props.accessors,
            getters = _this$props.getters
          var _this$state = _this.state,
            needLimitMeasure = _this$state.needLimitMeasure,
            rowLimit = _this$state.rowLimit
          events = eventsForWeek(
            events,
            week[0],
            week[week.length - 1],
            accessors
          )
          events.sort(function(a, b) {
            return sortEvents(a, b, accessors)
          })
          return React__default.createElement(DateContentRow, {
            key: weekIdx,
            ref: weekIdx === 0 ? _this.slotRowRef : undefined,
            container: _this.getContainer,
            className: 'rbc-month-row',
            getNow: getNow,
            date: date,
            range: week,
            events: events,
            maxRows: rowLimit,
            selected: selected,
            selectable: selectable,
            components: components,
            accessors: accessors,
            getters: getters,
            localizer: localizer,
            renderHeader: _this.readerDateHeading,
            renderForMeasure: needLimitMeasure,
            onShowMore: _this.handleShowMore,
            onSelect: _this.handleSelectEvent,
            onDoubleClick: _this.handleDoubleClickEvent,
            onSelectSlot: _this.handleSelectSlot,
            longPressThreshold: longPressThreshold,
            rtl: _this.props.rtl,
          })
        }

        _this.readerDateHeading = function(_ref) {
          var date = _ref.date,
            className = _ref.className,
            props = _objectWithoutPropertiesLoose(_ref, ['date', 'className'])

          var _this$props2 = _this.props,
            currentDate = _this$props2.date,
            getDrilldownView = _this$props2.getDrilldownView,
            localizer = _this$props2.localizer
          var isOffRange = month(date) !== month(currentDate)
          var isCurrent = eq(date, currentDate, 'day')
          var drilldownView = getDrilldownView(date)
          var label = localizer.format(date, 'dateFormat')
          var DateHeaderComponent =
            _this.props.components.dateHeader || DateHeader
          return React__default.createElement(
            'div',
            _extends({}, props, {
              className: clsx(
                className,
                isOffRange && 'rbc-off-range',
                isCurrent && 'rbc-current'
              ),
            }),
            React__default.createElement(DateHeaderComponent, {
              label: label,
              date: date,
              drilldownView: drilldownView,
              isOffRange: isOffRange,
              onDrillDown: function onDrillDown(e) {
                return _this.handleHeadingClick(date, drilldownView, e)
              },
            })
          )
        }

        _this.handleSelectSlot = function(range, slotInfo) {
          _this._pendingSelection = _this._pendingSelection.concat(range)
          clearTimeout(_this._selectTimer)
          _this._selectTimer = setTimeout(function() {
            return _this.selectDates(slotInfo)
          })
        }

        _this.handleHeadingClick = function(date, view, e) {
          e.preventDefault()

          _this.clearSelection()

          notify$2(_this.props.onDrillDown, [date, view])
        }

        _this.handleSelectEvent = function() {
          _this.clearSelection()

          for (
            var _len2 = arguments.length, args = new Array(_len2), _key2 = 0;
            _key2 < _len2;
            _key2++
          ) {
            args[_key2] = arguments[_key2]
          }

          notify$2(_this.props.onSelectEvent, args)
        }

        _this.handleDoubleClickEvent = function() {
          _this.clearSelection()

          for (
            var _len3 = arguments.length, args = new Array(_len3), _key3 = 0;
            _key3 < _len3;
            _key3++
          ) {
            args[_key3] = arguments[_key3]
          }

          notify$2(_this.props.onDoubleClickEvent, args)
        }

        _this.handleShowMore = function(events, date, cell, slot, target) {
          var _this$props3 = _this.props,
            popup = _this$props3.popup,
            onDrillDown = _this$props3.onDrillDown,
            onShowMore = _this$props3.onShowMore,
            getDrilldownView = _this$props3.getDrilldownView //cancel any pending selections so only the event click goes through.

          _this.clearSelection()

          if (popup) {
            var position$1 = position(
              cell,
              ReactDOM.findDOMNode(_assertThisInitialized(_this))
            )

            _this.setState({
              overlay: {
                date: date,
                events: events,
                position: position$1,
                target: target,
              },
            })
          } else {
            notify$2(onDrillDown, [date, getDrilldownView(date) || views.DAY])
          }

          notify$2(onShowMore, [events, date, slot])
        }

        _this._bgRows = []
        _this._pendingSelection = []
        _this.slotRowRef = React__default.createRef()
        _this.state = {
          rowLimit: 5,
          needLimitMeasure: true,
        }
        return _this
      }

      var _proto = MonthView.prototype

      _proto.UNSAFE_componentWillReceiveProps = function UNSAFE_componentWillReceiveProps(
        _ref2
      ) {
        var date = _ref2.date
        this.setState({
          needLimitMeasure: !eq(date, this.props.date, 'month'),
        })
      }

      _proto.componentDidMount = function componentDidMount() {
        var _this2 = this

        var running
        if (this.state.needLimitMeasure) this.measureRowLimit(this.props)
        window.addEventListener(
          'resize',
          (this._resizeListener = function() {
            if (!running) {
              request(function() {
                running = false

                _this2.setState({
                  needLimitMeasure: true,
                }) //eslint-disable-line
              })
            }
          }),
          false
        )
      }

      _proto.componentDidUpdate = function componentDidUpdate() {
        if (this.state.needLimitMeasure) this.measureRowLimit(this.props)
      }

      _proto.componentWillUnmount = function componentWillUnmount() {
        window.removeEventListener('resize', this._resizeListener, false)
      }

      _proto.render = function render() {
        var _this$props4 = this.props,
          date = _this$props4.date,
          localizer = _this$props4.localizer,
          className = _this$props4.className,
          month = visibleDays(date, localizer),
          weeks = chunk(month, 7)
        this._weekCount = weeks.length
        return React__default.createElement(
          'div',
          {
            className: clsx('rbc-month-view', className),
          },
          React__default.createElement(
            'div',
            {
              className: 'rbc-row rbc-month-header',
            },
            this.renderHeaders(weeks[0])
          ),
          weeks.map(this.renderWeek),
          this.props.popup && this.renderOverlay()
        )
      }

      _proto.renderHeaders = function renderHeaders(row) {
        var _this$props5 = this.props,
          localizer = _this$props5.localizer,
          components = _this$props5.components
        var first = row[0]
        var last = row[row.length - 1]
        var HeaderComponent = components.header || Header
        return range(first, last, 'day').map(function(day, idx) {
          return React__default.createElement(
            'div',
            {
              key: 'header_' + idx,
              className: 'rbc-header',
            },
            React__default.createElement(HeaderComponent, {
              date: day,
              localizer: localizer,
              label: localizer.format(day, 'weekdayFormat'),
            })
          )
        })
      }

      _proto.renderOverlay = function renderOverlay() {
        var _this3 = this

        var overlay = (this.state && this.state.overlay) || {}
        var _this$props6 = this.props,
          accessors = _this$props6.accessors,
          localizer = _this$props6.localizer,
          components = _this$props6.components,
          getters = _this$props6.getters,
          selected = _this$props6.selected,
          popupOffset = _this$props6.popupOffset
        return React__default.createElement(
          Overlay,
          {
            rootClose: true,
            placement: 'bottom',
            show: !!overlay.position,
            onHide: function onHide() {
              return _this3.setState({
                overlay: null,
              })
            },
            target: function target() {
              return overlay.target
            },
          },
          function(_ref3) {
            var props = _ref3.props
            return React__default.createElement(
              Popup$1,
              _extends({}, props, {
                popupOffset: popupOffset,
                accessors: accessors,
                getters: getters,
                selected: selected,
                components: components,
                localizer: localizer,
                position: overlay.position,
                events: overlay.events,
                slotStart: overlay.date,
                slotEnd: overlay.end,
                onSelect: _this3.handleSelectEvent,
                onDoubleClick: _this3.handleDoubleClickEvent,
              })
            )
          }
        )
      }

      _proto.measureRowLimit = function measureRowLimit() {
        this.setState({
          needLimitMeasure: false,
          rowLimit: this.slotRowRef.current.getRowLimit(),
        })
      }

      _proto.selectDates = function selectDates(slotInfo) {
        var slots = this._pendingSelection.slice()

        this._pendingSelection = []
        slots.sort(function(a, b) {
          return +a - +b
        })
        notify$2(this.props.onSelectSlot, {
          slots: slots,
          start: slots[0],
          end: slots[slots.length - 1],
          action: slotInfo.action,
          bounds: slotInfo.bounds,
          box: slotInfo.box,
        })
      }

      _proto.clearSelection = function clearSelection() {
        clearTimeout(this._selectTimer)
        this._pendingSelection = []
      }

      return MonthView
    })(React__default.Component)

  MonthView.propTypes = {
    events: propTypes.array.isRequired,
    date: propTypes.instanceOf(Date),
    min: propTypes.instanceOf(Date),
    max: propTypes.instanceOf(Date),
    step: propTypes.number,
    getNow: propTypes.func.isRequired,
    scrollToTime: propTypes.instanceOf(Date),
    rtl: propTypes.bool,
    width: propTypes.number,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    localizer: propTypes.object.isRequired,
    selected: propTypes.object,
    selectable: propTypes.oneOf([true, false, 'ignoreEvents']),
    longPressThreshold: propTypes.number,
    onNavigate: propTypes.func,
    onSelectSlot: propTypes.func,
    onSelectEvent: propTypes.func,
    onDoubleClickEvent: propTypes.func,
    onShowMore: propTypes.func,
    onDrillDown: propTypes.func,
    getDrilldownView: propTypes.func.isRequired,
    popup: propTypes.bool,
    popupOffset: propTypes.oneOfType([
      propTypes.number,
      propTypes.shape({
        x: propTypes.number,
        y: propTypes.number,
      }),
    ]),
  }

  MonthView.range = function(date, _ref4) {
    var localizer = _ref4.localizer
    var start = firstVisibleDay(date, localizer)
    var end = lastVisibleDay(date, localizer)
    return {
      start: start,
      end: end,
    }
  }

  MonthView.navigate = function(date, action) {
    switch (action) {
      case navigate.PREVIOUS:
        return add(date, -1, 'month')

      case navigate.NEXT:
        return add(date, 1, 'month')

      default:
        return date
    }
  }

  MonthView.title = function(date, _ref5) {
    var localizer = _ref5.localizer
    return localizer.format(date, 'monthHeaderFormat')
  }

  var getDstOffset = function getDstOffset(start, end) {
    return start.getTimezoneOffset() - end.getTimezoneOffset()
  }

  var getKey$1 = function getKey(min, max, step, slots) {
    return (
      '' +
      +startOf(min, 'minutes') +
      ('' + +startOf(max, 'minutes')) +
      (step + '-' + slots)
    )
  }

  function getSlotMetrics$1(_ref) {
    var start = _ref.min,
      end = _ref.max,
      step = _ref.step,
      timeslots = _ref.timeslots
    var key = getKey$1(start, end, step, timeslots) // if the start is on a DST-changing day but *after* the moment of DST
    // transition we need to add those extra minutes to our minutesFromMidnight

    var daystart = startOf(start, 'day')
    var daystartdstoffset = getDstOffset(daystart, start)
    var totalMin = 1 + diff(start, end, 'minutes') + getDstOffset(start, end)
    var minutesFromMidnight =
      diff(daystart, start, 'minutes') + daystartdstoffset
    var numGroups = Math.ceil(totalMin / (step * timeslots))
    var numSlots = numGroups * timeslots
    var groups = new Array(numGroups)
    var slots = new Array(numSlots) // Each slot date is created from "zero", instead of adding `step` to
    // the previous one, in order to avoid DST oddities

    for (var grp = 0; grp < numGroups; grp++) {
      groups[grp] = new Array(timeslots)

      for (var slot = 0; slot < timeslots; slot++) {
        var slotIdx = grp * timeslots + slot
        var minFromStart = slotIdx * step // A date with total minutes calculated from the start of the day

        slots[slotIdx] = groups[grp][slot] = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
          0,
          minutesFromMidnight + minFromStart,
          0,
          0
        )
      }
    } // Necessary to be able to select up until the last timeslot in a day

    var lastSlotMinFromStart = slots.length * step
    slots.push(
      new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        minutesFromMidnight + lastSlotMinFromStart,
        0,
        0
      )
    )

    function positionFromDate(date) {
      var diff$1 = diff(start, date, 'minutes') + getDstOffset(start, date)
      return Math.min(diff$1, totalMin)
    }

    return {
      groups: groups,
      update: function update(args) {
        if (getKey$1(args) !== key) return getSlotMetrics$1(args)
        return this
      },
      dateIsInGroup: function dateIsInGroup(date, groupIndex) {
        var nextGroup = groups[groupIndex + 1]
        return inRange(
          date,
          groups[groupIndex][0],
          nextGroup ? nextGroup[0] : end,
          'minutes'
        )
      },
      nextSlot: function nextSlot(slot) {
        var next = slots[Math.min(slots.indexOf(slot) + 1, slots.length - 1)] // in the case of the last slot we won't a long enough range so manually get it

        if (next === slot) next = add(slot, step, 'minutes')
        return next
      },
      closestSlotToPosition: function closestSlotToPosition(percent) {
        var slot = Math.min(
          slots.length - 1,
          Math.max(0, Math.floor(percent * numSlots))
        )
        return slots[slot]
      },
      closestSlotFromPoint: function closestSlotFromPoint(point, boundaryRect) {
        var range = Math.abs(boundaryRect.top - boundaryRect.bottom)
        return this.closestSlotToPosition((point.y - boundaryRect.top) / range)
      },
      closestSlotFromDate: function closestSlotFromDate(date, offset) {
        if (offset === void 0) {
          offset = 0
        }

        if (lt(date, start, 'minutes')) return slots[0]
        var diffMins = diff(start, date, 'minutes')
        return slots[(diffMins - (diffMins % step)) / step + offset]
      },
      startsBeforeDay: function startsBeforeDay(date) {
        return lt(date, start, 'day')
      },
      startsAfterDay: function startsAfterDay(date) {
        return gt(date, end, 'day')
      },
      startsBefore: function startsBefore(date) {
        return lt(merge(start, date), start, 'minutes')
      },
      startsAfter: function startsAfter(date) {
        return gt(merge(end, date), end, 'minutes')
      },
      getRange: function getRange(rangeStart, rangeEnd, ignoreMin, ignoreMax) {
        if (!ignoreMin) rangeStart = min$9(end, max$4(start, rangeStart))
        if (!ignoreMax) rangeEnd = min$9(end, max$4(start, rangeEnd))
        var rangeStartMin = positionFromDate(rangeStart)
        var rangeEndMin = positionFromDate(rangeEnd)
        var top =
          rangeEndMin - rangeStartMin < step && !eq(end, rangeEnd)
            ? ((rangeStartMin - step) / (step * numSlots)) * 100
            : (rangeStartMin / (step * numSlots)) * 100
        return {
          top: top,
          height: (rangeEndMin / (step * numSlots)) * 100 - top,
          start: positionFromDate(rangeStart),
          startDate: rangeStart,
          end: positionFromDate(rangeEnd),
          endDate: rangeEnd,
        }
      },
      getCurrentTimePosition: function getCurrentTimePosition(rangeStart) {
        var rangeStartMin = positionFromDate(rangeStart)
        var top = (rangeStartMin / (step * numSlots)) * 100
        return top
      },
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i]
      descriptor.enumerable = descriptor.enumerable || false
      descriptor.configurable = true
      if ('value' in descriptor) descriptor.writable = true
      Object.defineProperty(target, descriptor.key, descriptor)
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps)
    if (staticProps) _defineProperties(Constructor, staticProps)
    return Constructor
  }

  /** Built-in value references. */
  var spreadableSymbol = Symbol$2 ? Symbol$2.isConcatSpreadable : undefined

  /**
   * Checks if `value` is a flattenable `arguments` object or array.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
   */
  function isFlattenable(value) {
    return (
      isArray$1(value) ||
      isArguments(value) ||
      !!(spreadableSymbol && value && value[spreadableSymbol])
    )
  }

  /**
   * The base implementation of `_.flatten` with support for restricting flattening.
   *
   * @private
   * @param {Array} array The array to flatten.
   * @param {number} depth The maximum recursion depth.
   * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
   * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
   * @param {Array} [result=[]] The initial result value.
   * @returns {Array} Returns the new flattened array.
   */
  function baseFlatten(array, depth, predicate, isStrict, result) {
    var index = -1,
      length = array.length

    predicate || (predicate = isFlattenable)
    result || (result = [])

    while (++index < length) {
      var value = array[index]
      if (depth > 0 && predicate(value)) {
        if (depth > 1) {
          // Recursively flatten arrays (susceptible to call stack limits).
          baseFlatten(value, depth - 1, predicate, isStrict, result)
        } else {
          arrayPush$1(result, value)
        }
      } else if (!isStrict) {
        result[result.length] = value
      }
    }
    return result
  }

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length

      while (length--) {
        var key = props[fromRight ? length : ++index]
        if (iteratee(iterable[key], key, iterable) === false) {
          break
        }
      }
      return object
    }
  }

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = createBaseFor()

  /**
   * The base implementation of `_.forOwn` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Object} Returns `object`.
   */
  function baseForOwn(object, iteratee) {
    return object && baseFor(object, iteratee, keys$4)
  }

  /**
   * Creates a `baseEach` or `baseEachRight` function.
   *
   * @private
   * @param {Function} eachFunc The function to iterate over a collection.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseEach(eachFunc, fromRight) {
    return function(collection, iteratee) {
      if (collection == null) {
        return collection
      }
      if (!isArrayLike(collection)) {
        return eachFunc(collection, iteratee)
      }
      var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection)

      while (fromRight ? index-- : ++index < length) {
        if (iteratee(iterable[index], index, iterable) === false) {
          break
        }
      }
      return collection
    }
  }

  /**
   * The base implementation of `_.forEach` without support for iteratee shorthands.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array|Object} Returns `collection`.
   */
  var baseEach = createBaseEach(baseForOwn)

  /**
   * The base implementation of `_.map` without support for iteratee shorthands.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function baseMap(collection, iteratee) {
    var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : []

    baseEach(collection, function(value, key, collection) {
      result[++index] = iteratee(value, key, collection)
    })
    return result
  }

  /**
   * The base implementation of `_.sortBy` which uses `comparer` to define the
   * sort order of `array` and replaces criteria objects with their corresponding
   * values.
   *
   * @private
   * @param {Array} array The array to sort.
   * @param {Function} comparer The function to define sort order.
   * @returns {Array} Returns `array`.
   */
  function baseSortBy(array, comparer) {
    var length = array.length

    array.sort(comparer)
    while (length--) {
      array[length] = array[length].value
    }
    return array
  }

  /**
   * Compares values to sort them in ascending order.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {number} Returns the sort order indicator for `value`.
   */
  function compareAscending(value, other) {
    if (value !== other) {
      var valIsDefined = value !== undefined,
        valIsNull = value === null,
        valIsReflexive = value === value,
        valIsSymbol = isSymbol$1(value)

      var othIsDefined = other !== undefined,
        othIsNull = other === null,
        othIsReflexive = other === other,
        othIsSymbol = isSymbol$1(other)

      if (
        (!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
        (valIsSymbol &&
          othIsDefined &&
          othIsReflexive &&
          !othIsNull &&
          !othIsSymbol) ||
        (valIsNull && othIsDefined && othIsReflexive) ||
        (!valIsDefined && othIsReflexive) ||
        !valIsReflexive
      ) {
        return 1
      }
      if (
        (!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
        (othIsSymbol &&
          valIsDefined &&
          valIsReflexive &&
          !valIsNull &&
          !valIsSymbol) ||
        (othIsNull && valIsDefined && valIsReflexive) ||
        (!othIsDefined && valIsReflexive) ||
        !othIsReflexive
      ) {
        return -1
      }
    }
    return 0
  }

  /**
   * Used by `_.orderBy` to compare multiple properties of a value to another
   * and stable sort them.
   *
   * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
   * specify an order of "desc" for descending or "asc" for ascending sort order
   * of corresponding values.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {boolean[]|string[]} orders The order to sort by for each property.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareMultiple(object, other, orders) {
    var index = -1,
      objCriteria = object.criteria,
      othCriteria = other.criteria,
      length = objCriteria.length,
      ordersLength = orders.length

    while (++index < length) {
      var result = compareAscending(objCriteria[index], othCriteria[index])
      if (result) {
        if (index >= ordersLength) {
          return result
        }
        var order = orders[index]
        return result * (order == 'desc' ? -1 : 1)
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to provide the same value for
    // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
    // for more details.
    //
    // This also ensures a stable sort in V8 and other engines.
    // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
    return object.index - other.index
  }

  /**
   * The base implementation of `_.orderBy` without param guards.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
   * @param {string[]} orders The sort orders of `iteratees`.
   * @returns {Array} Returns the new sorted array.
   */
  function baseOrderBy(collection, iteratees, orders) {
    var index = -1
    iteratees = arrayMap(
      iteratees.length ? iteratees : [identity],
      baseUnary(baseIteratee)
    )

    var result = baseMap(collection, function(value, key, collection) {
      var criteria = arrayMap(iteratees, function(iteratee) {
        return iteratee(value)
      })
      return { criteria: criteria, index: ++index, value: value }
    })

    return baseSortBy(result, function(object, other) {
      return compareMultiple(object, other, orders)
    })
  }

  /**
   * A faster alternative to `Function#apply`, this function invokes `func`
   * with the `this` binding of `thisArg` and the arguments of `args`.
   *
   * @private
   * @param {Function} func The function to invoke.
   * @param {*} thisArg The `this` binding of `func`.
   * @param {Array} args The arguments to invoke `func` with.
   * @returns {*} Returns the result of `func`.
   */
  function apply(func, thisArg, args) {
    switch (args.length) {
      case 0:
        return func.call(thisArg)
      case 1:
        return func.call(thisArg, args[0])
      case 2:
        return func.call(thisArg, args[0], args[1])
      case 3:
        return func.call(thisArg, args[0], args[1], args[2])
    }
    return func.apply(thisArg, args)
  }

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax$3 = Math.max

  /**
   * A specialized version of `baseRest` which transforms the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @param {Function} transform The rest array transform.
   * @returns {Function} Returns the new function.
   */
  function overRest(func, start, transform) {
    start = nativeMax$3(start === undefined ? func.length - 1 : start, 0)
    return function() {
      var args = arguments,
        index = -1,
        length = nativeMax$3(args.length - start, 0),
        array = Array(length)

      while (++index < length) {
        array[index] = args[start + index]
      }
      index = -1
      var otherArgs = Array(start + 1)
      while (++index < start) {
        otherArgs[index] = args[index]
      }
      otherArgs[start] = transform(array)
      return apply(func, this, otherArgs)
    }
  }

  /**
   * Creates a function that returns `value`.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {*} value The value to return from the new function.
   * @returns {Function} Returns the new constant function.
   * @example
   *
   * var objects = _.times(2, _.constant({ 'a': 1 }));
   *
   * console.log(objects);
   * // => [{ 'a': 1 }, { 'a': 1 }]
   *
   * console.log(objects[0] === objects[1]);
   * // => true
   */
  function constant(value) {
    return function() {
      return value
    }
  }

  var defineProperty$d = (function() {
    try {
      var func = getNative(Object, 'defineProperty')
      func({}, '', {})
      return func
    } catch (e) {}
  })()

  /**
   * The base implementation of `setToString` without support for hot loop shorting.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var baseSetToString = !defineProperty$d
    ? identity
    : function(func, string) {
        return defineProperty$d(func, 'toString', {
          configurable: true,
          enumerable: false,
          value: constant(string),
          writable: true,
        })
      }

  /** Used to detect hot functions by number of calls within a span of milliseconds. */
  var HOT_COUNT = 800,
    HOT_SPAN = 16

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeNow = Date.now

  /**
   * Creates a function that'll short out and invoke `identity` instead
   * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
   * milliseconds.
   *
   * @private
   * @param {Function} func The function to restrict.
   * @returns {Function} Returns the new shortable function.
   */
  function shortOut(func) {
    var count = 0,
      lastCalled = 0

    return function() {
      var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled)

      lastCalled = stamp
      if (remaining > 0) {
        if (++count >= HOT_COUNT) {
          return arguments[0]
        }
      } else {
        count = 0
      }
      return func.apply(undefined, arguments)
    }
  }

  /**
   * Sets the `toString` method of `func` to return `string`.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var setToString = shortOut(baseSetToString)

  /**
   * The base implementation of `_.rest` which doesn't validate or coerce arguments.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @returns {Function} Returns the new function.
   */
  function baseRest(func, start) {
    return setToString(overRest(func, start, identity), func + '')
  }

  /**
   * Creates an array of elements, sorted in ascending order by the results of
   * running each element in a collection thru each iteratee. This method
   * performs a stable sort, that is, it preserves the original sort order of
   * equal elements. The iteratees are invoked with one argument: (value).
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Collection
   * @param {Array|Object} collection The collection to iterate over.
   * @param {...(Function|Function[])} [iteratees=[_.identity]]
   *  The iteratees to sort by.
   * @returns {Array} Returns the new sorted array.
   * @example
   *
   * var users = [
   *   { 'user': 'fred',   'age': 48 },
   *   { 'user': 'barney', 'age': 36 },
   *   { 'user': 'fred',   'age': 40 },
   *   { 'user': 'barney', 'age': 34 }
   * ];
   *
   * _.sortBy(users, [function(o) { return o.user; }]);
   * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
   *
   * _.sortBy(users, ['user', 'age']);
   * // => objects for [['barney', 34], ['barney', 36], ['fred', 40], ['fred', 48]]
   */
  var sortBy = baseRest(function(collection, iteratees) {
    if (collection == null) {
      return []
    }
    var length = iteratees.length
    if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
      iteratees = []
    } else if (
      length > 2 &&
      isIterateeCall(iteratees[0], iteratees[1], iteratees[2])
    ) {
      iteratees = [iteratees[0]]
    }
    return baseOrderBy(collection, baseFlatten(iteratees, 1), [])
  })

  var Event =
    /*#__PURE__*/
    (function() {
      function Event(data, _ref) {
        var accessors = _ref.accessors,
          slotMetrics = _ref.slotMetrics

        var _slotMetrics$getRange = slotMetrics.getRange(
            accessors.start(data),
            accessors.end(data)
          ),
          start = _slotMetrics$getRange.start,
          startDate = _slotMetrics$getRange.startDate,
          end = _slotMetrics$getRange.end,
          endDate = _slotMetrics$getRange.endDate,
          top = _slotMetrics$getRange.top,
          height = _slotMetrics$getRange.height

        this.start = start
        this.end = end
        this.startMs = +startDate
        this.endMs = +endDate
        this.top = top
        this.height = height
        this.data = data
      }
      /**
       * The event's width without any overlap.
       */

      _createClass(Event, [
        {
          key: '_width',
          get: function get() {
            // The container event's width is determined by the maximum number of
            // events in any of its rows.
            if (this.rows) {
              var columns =
                this.rows.reduce(
                  function(max, row) {
                    return Math.max(max, row.leaves.length + 1)
                  }, // add itself
                  0
                ) + 1 // add the container

              return 100 / columns
            }

            var availableWidth = 100 - this.container._width // The row event's width is the space left by the container, divided
            // among itself and its leaves.

            if (this.leaves) {
              return availableWidth / (this.leaves.length + 1)
            } // The leaf event's width is determined by its row's width

            return this.row._width
          },
          /**
           * The event's calculated width, possibly with extra width added for
           * overlapping effect.
           */
        },
        {
          key: 'width',
          get: function get() {
            var noOverlap = this._width
            var overlap = Math.min(100, this._width * 1.7) // Containers can always grow.

            if (this.rows) {
              return overlap
            } // Rows can grow if they have leaves.

            if (this.leaves) {
              return this.leaves.length > 0 ? overlap : noOverlap
            } // Leaves can grow unless they're the last item in a row.

            var leaves = this.row.leaves
            var index = leaves.indexOf(this)
            return index === leaves.length - 1 ? noOverlap : overlap
          },
        },
        {
          key: 'xOffset',
          get: function get() {
            // Containers have no offset.
            if (this.rows) return 0 // Rows always start where their container ends.

            if (this.leaves) return this.container._width // Leaves are spread out evenly on the space left by its row.

            var _this$row = this.row,
              leaves = _this$row.leaves,
              xOffset = _this$row.xOffset,
              _width = _this$row._width
            var index = leaves.indexOf(this) + 1
            return xOffset + index * _width
          },
        },
      ])

      return Event
    })()
  /**
   * Return true if event a and b is considered to be on the same row.
   */

  function onSameRow(a, b, minimumStartDifference) {
    return (
      // Occupies the same start slot.
      Math.abs(b.start - a.start) < minimumStartDifference || // A's start slot overlaps with b's end slot.
      (b.start > a.start && b.start < a.end)
    )
  }

  function sortByRender(events) {
    var sortedByTime = sortBy(events, [
      'startMs',
      function(e) {
        return -e.endMs
      },
    ])
    var sorted = []

    while (sortedByTime.length > 0) {
      var event = sortedByTime.shift()
      sorted.push(event)

      for (var i = 0; i < sortedByTime.length; i++) {
        var test = sortedByTime[i] // Still inside this event, look for next.

        if (event.endMs > test.startMs) continue // We've found the first event of the next event group.
        // If that event is not right next to our current event, we have to
        // move it here.

        if (i > 0) {
          var _event = sortedByTime.splice(i, 1)[0]
          sorted.push(_event)
        } // We've already found the next event group, so stop looking.

        break
      }
    }

    return sorted
  }

  function getStyledEvents(_ref2) {
    var events = _ref2.events,
      minimumStartDifference = _ref2.minimumStartDifference,
      slotMetrics = _ref2.slotMetrics,
      accessors = _ref2.accessors
    // Create proxy events and order them so that we don't have
    // to fiddle with z-indexes.
    var proxies = events.map(function(event) {
      return new Event(event, {
        slotMetrics: slotMetrics,
        accessors: accessors,
      })
    })
    var eventsInRenderOrder = sortByRender(proxies) // Group overlapping events, while keeping order.
    // Every event is always one of: container, row or leaf.
    // Containers can contain rows, and rows can contain leaves.

    var containerEvents = []

    var _loop = function _loop(i) {
      var event = eventsInRenderOrder[i] // Check if this event can go into a container event.

      var container = containerEvents.find(function(c) {
        return (
          c.end > event.start ||
          Math.abs(event.start - c.start) < minimumStartDifference
        )
      }) // Couldn't find a container — that means this event is a container.

      if (!container) {
        event.rows = []
        containerEvents.push(event)
        return 'continue'
      } // Found a container for the event.

      event.container = container // Check if the event can be placed in an existing row.
      // Start looking from behind.

      var row = null

      for (var j = container.rows.length - 1; !row && j >= 0; j--) {
        if (onSameRow(container.rows[j], event, minimumStartDifference)) {
          row = container.rows[j]
        }
      }

      if (row) {
        // Found a row, so add it.
        row.leaves.push(event)
        event.row = row
      } else {
        // Couldn't find a row – that means this event is a row.
        event.leaves = []
        container.rows.push(event)
      }
    }

    for (var i = 0; i < eventsInRenderOrder.length; i++) {
      var _ret = _loop(i)

      if (_ret === 'continue') continue
    } // Return the original events, along with their styles.

    return eventsInRenderOrder.map(function(event) {
      return {
        event: event.data,
        style: {
          top: event.top,
          height: event.height,
          width: event.width,
          xOffset: Math.max(0, event.xOffset),
        },
      }
    })
  }

  function getMaxIdxDFS(node, maxIdx, visited) {
    for (var i = 0; i < node.friends.length; ++i) {
      if (visited.indexOf(node.friends[i]) > -1) continue
      maxIdx = maxIdx > node.friends[i].idx ? maxIdx : node.friends[i].idx // TODO : trace it by not object but kinda index or something for performance

      visited.push(node.friends[i])
      var newIdx = getMaxIdxDFS(node.friends[i], maxIdx, visited)
      maxIdx = maxIdx > newIdx ? maxIdx : newIdx
    }

    return maxIdx
  }

  function noOverlap(_ref) {
    var events = _ref.events,
      minimumStartDifference = _ref.minimumStartDifference,
      slotMetrics = _ref.slotMetrics,
      accessors = _ref.accessors
    var styledEvents = getStyledEvents({
      events: events,
      minimumStartDifference: minimumStartDifference,
      slotMetrics: slotMetrics,
      accessors: accessors,
    })
    styledEvents.sort(function(a, b) {
      a = a.style
      b = b.style
      if (a.top !== b.top) return a.top > b.top ? 1 : -1
      else return a.top + a.height < b.top + b.height ? 1 : -1
    })

    for (var i = 0; i < styledEvents.length; ++i) {
      styledEvents[i].friends = []
      delete styledEvents[i].style.left
      delete styledEvents[i].style.left
      delete styledEvents[i].idx
      delete styledEvents[i].size
    }

    for (var _i = 0; _i < styledEvents.length - 1; ++_i) {
      var se1 = styledEvents[_i]
      var y1 = se1.style.top
      var y2 = se1.style.top + se1.style.height

      for (var j = _i + 1; j < styledEvents.length; ++j) {
        var se2 = styledEvents[j]
        var y3 = se2.style.top
        var y4 = se2.style.top + se2.style.height // be friends when overlapped

        if ((y3 <= y1 && y1 < y4) || (y1 <= y3 && y3 < y2)) {
          // TODO : hashmap would be effective for performance
          se1.friends.push(se2)
          se2.friends.push(se1)
        }
      }
    }

    for (var _i2 = 0; _i2 < styledEvents.length; ++_i2) {
      var se = styledEvents[_i2]
      var bitmap = []

      for (var _j = 0; _j < 100; ++_j) {
        bitmap.push(1)
      } // 1 means available

      for (var _j2 = 0; _j2 < se.friends.length; ++_j2) {
        if (se.friends[_j2].idx !== undefined) bitmap[se.friends[_j2].idx] = 0
      } // 0 means reserved

      se.idx = bitmap.indexOf(1)
    }

    for (var _i3 = 0; _i3 < styledEvents.length; ++_i3) {
      var size = 0
      if (styledEvents[_i3].size) continue
      var allFriends = []
      var maxIdx = getMaxIdxDFS(styledEvents[_i3], 0, allFriends)
      size = 100 / (maxIdx + 1)
      styledEvents[_i3].size = size

      for (var _j3 = 0; _j3 < allFriends.length; ++_j3) {
        allFriends[_j3].size = size
      }
    }

    for (var _i4 = 0; _i4 < styledEvents.length; ++_i4) {
      var e = styledEvents[_i4]
      e.style.left = e.idx * e.size // stretch to maximum

      var _maxIdx = 0

      for (var _j4 = 0; _j4 < e.friends.length; ++_j4) {
        var idx = e.friends[_j4]
        _maxIdx = _maxIdx > idx ? _maxIdx : idx
      }

      if (_maxIdx <= e.idx) e.size = 100 - e.idx * e.size // padding between events
      // for this feature, `width` is not percentage based unit anymore
      // it will be used with calc()

      var padding = e.idx === 0 ? 0 : 3
      e.style.width = 'calc(' + e.size + '% - ' + padding + 'px)'
      e.style.height = 'calc(' + e.style.height + '% - 2px)'
      e.style.xOffset = 'calc(' + e.style.left + '% + ' + padding + 'px)'
    }

    return styledEvents
  }

  /*eslint no-unused-vars: "off"*/
  var DefaultAlgorithms = {
    overlap: getStyledEvents,
    'no-overlap': noOverlap,
  }

  function isFunction$2(a) {
    return !!(a && a.constructor && a.call && a.apply)
  } //

  function getStyledEvents$1(_ref) {
    var events = _ref.events,
      minimumStartDifference = _ref.minimumStartDifference,
      slotMetrics = _ref.slotMetrics,
      accessors = _ref.accessors,
      dayLayoutAlgorithm = _ref.dayLayoutAlgorithm
    var algorithm = null
    if (dayLayoutAlgorithm in DefaultAlgorithms)
      algorithm = DefaultAlgorithms[dayLayoutAlgorithm]

    if (!isFunction$2(algorithm)) {
      // invalid algorithm
      return []
    }

    return algorithm.apply(this, arguments)
  }

  var TimeSlotGroup =
    /*#__PURE__*/
    (function(_Component) {
      _inheritsLoose(TimeSlotGroup, _Component)

      function TimeSlotGroup() {
        return _Component.apply(this, arguments) || this
      }

      var _proto = TimeSlotGroup.prototype

      _proto.render = function render() {
        var _this$props = this.props,
          renderSlot = _this$props.renderSlot,
          resource = _this$props.resource,
          group = _this$props.group,
          getters = _this$props.getters,
          _this$props$component = _this$props.components
        _this$props$component =
          _this$props$component === void 0 ? {} : _this$props$component
        var _this$props$component2 = _this$props$component.timeSlotWrapper,
          Wrapper =
            _this$props$component2 === void 0
              ? NoopWrapper
              : _this$props$component2
        var groupProps = getters ? getters.slotGroupProp() : {}
        return React__default.createElement(
          'div',
          _extends(
            {
              className: 'rbc-timeslot-group',
            },
            groupProps
          ),
          group.map(function(value, idx) {
            var slotProps = getters ? getters.slotProp(value, resource) : {}
            return React__default.createElement(
              Wrapper,
              {
                key: idx,
                value: value,
                resource: resource,
              },
              React__default.createElement(
                'div',
                _extends({}, slotProps, {
                  className: clsx('rbc-time-slot', slotProps.className),
                }),
                renderSlot && renderSlot(value, idx)
              )
            )
          })
        )
      }

      return TimeSlotGroup
    })(React.Component)
  TimeSlotGroup.propTypes = {
    renderSlot: propTypes.func,
    group: propTypes.array.isRequired,
    resource: propTypes.any,
    components: propTypes.object,
    getters: propTypes.object,
  }

  function stringifyPercent(v) {
    return typeof v === 'string' ? v : v + '%'
  }
  /* eslint-disable react/prop-types */

  function TimeGridEvent(props) {
    var _extends2

    var style = props.style,
      className = props.className,
      event = props.event,
      accessors = props.accessors,
      rtl = props.rtl,
      selected = props.selected,
      label = props.label,
      continuesEarlier = props.continuesEarlier,
      continuesLater = props.continuesLater,
      getters = props.getters,
      onClick = props.onClick,
      onDoubleClick = props.onDoubleClick,
      _props$components = props.components,
      Event = _props$components.event,
      EventWrapper = _props$components.eventWrapper
    var title = accessors.title(event)
    var tooltip = accessors.tooltip(event)
    var end = accessors.end(event)
    var start = accessors.start(event)
    var userProps = getters.eventProp(event, start, end, selected)
    var height = style.height,
      top = style.top,
      width = style.width,
      xOffset = style.xOffset
    var inner = [
      React__default.createElement(
        'div',
        {
          key: '1',
          className: 'rbc-event-label',
        },
        label
      ),
      React__default.createElement(
        'div',
        {
          key: '2',
          className: 'rbc-event-content',
        },
        Event
          ? React__default.createElement(Event, {
              event: event,
              title: title,
            })
          : title
      ),
    ]
    return React__default.createElement(
      EventWrapper,
      _extends(
        {
          type: 'time',
        },
        props
      ),
      React__default.createElement(
        'div',
        {
          onClick: onClick,
          onDoubleClick: onDoubleClick,
          style: _extends(
            {},
            userProps.style,
            ((_extends2 = {
              top: stringifyPercent(top),
            }),
            (_extends2[rtl ? 'right' : 'left'] = stringifyPercent(xOffset)),
            (_extends2.width = stringifyPercent(width)),
            (_extends2.height = stringifyPercent(height)),
            _extends2)
          ),
          title: tooltip
            ? (typeof label === 'string' ? label + ': ' : '') + tooltip
            : undefined,
          className: clsx('rbc-event', className, userProps.className, {
            'rbc-selected': selected,
            'rbc-event-continues-earlier': continuesEarlier,
            'rbc-event-continues-later': continuesLater,
          }),
        },
        inner
      )
    )
  }

  var DayColumn =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(DayColumn, _React$Component)

      function DayColumn() {
        var _this

        for (
          var _len = arguments.length, _args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          _args[_key] = arguments[_key]
        }

        _this =
          _React$Component.call.apply(_React$Component, [this].concat(_args)) ||
          this
        _this.state = {
          selecting: false,
          timeIndicatorPosition: null,
        }
        _this.intervalTriggered = false

        _this.renderEvents = function() {
          var _this$props = _this.props,
            events = _this$props.events,
            rtl = _this$props.rtl,
            selected = _this$props.selected,
            accessors = _this$props.accessors,
            localizer = _this$props.localizer,
            getters = _this$props.getters,
            components = _this$props.components,
            step = _this$props.step,
            timeslots = _this$props.timeslots,
            dayLayoutAlgorithm = _this$props.dayLayoutAlgorithm

          var _assertThisInitialize = _assertThisInitialized(_this),
            slotMetrics = _assertThisInitialize.slotMetrics

          var messages = localizer.messages
          var styledEvents = getStyledEvents$1({
            events: events,
            accessors: accessors,
            slotMetrics: slotMetrics,
            minimumStartDifference: Math.ceil((step * timeslots) / 2),
            dayLayoutAlgorithm: dayLayoutAlgorithm,
          })
          return styledEvents.map(function(_ref, idx) {
            var event = _ref.event,
              style = _ref.style
            var end = accessors.end(event)
            var start = accessors.start(event)
            var format = 'eventTimeRangeFormat'
            var label
            var startsBeforeDay = slotMetrics.startsBeforeDay(start)
            var startsAfterDay = slotMetrics.startsAfterDay(end)
            if (startsBeforeDay) format = 'eventTimeRangeEndFormat'
            else if (startsAfterDay) format = 'eventTimeRangeStartFormat'
            if (startsBeforeDay && startsAfterDay) label = messages.allDay
            else
              label = localizer.format(
                {
                  start: start,
                  end: end,
                },
                format
              )
            var continuesEarlier =
              startsBeforeDay || slotMetrics.startsBefore(start)
            var continuesLater = startsAfterDay || slotMetrics.startsAfter(end)
            return React__default.createElement(TimeGridEvent, {
              style: style,
              event: event,
              label: label,
              key: 'evt_' + idx,
              getters: getters,
              rtl: rtl,
              components: components,
              continuesEarlier: continuesEarlier,
              continuesLater: continuesLater,
              accessors: accessors,
              selected: isSelected(event, selected),
              onClick: function onClick(e) {
                return _this._select(event, e)
              },
              onDoubleClick: function onDoubleClick(e) {
                return _this._doubleClick(event, e)
              },
            })
          })
        }

        _this._selectable = function() {
          var node = ReactDOM.findDOMNode(_assertThisInitialized(_this))
          var selector = (_this._selector = new Selection(
            function() {
              return ReactDOM.findDOMNode(_assertThisInitialized(_this))
            },
            {
              longPressThreshold: _this.props.longPressThreshold,
            }
          ))

          var maybeSelect = function maybeSelect(box) {
            var onSelecting = _this.props.onSelecting
            var current = _this.state || {}
            var state = selectionState(box)
            var start = state.startDate,
              end = state.endDate

            if (onSelecting) {
              if (
                (eq(current.startDate, start, 'minutes') &&
                  eq(current.endDate, end, 'minutes')) ||
                onSelecting({
                  start: start,
                  end: end,
                  resourceId: _this.props.resource,
                }) === false
              )
                return
            }

            if (
              _this.state.start !== state.start ||
              _this.state.end !== state.end ||
              _this.state.selecting !== state.selecting
            ) {
              _this.setState(state)
            }
          }

          var selectionState = function selectionState(point) {
            var currentSlot = _this.slotMetrics.closestSlotFromPoint(
              point,
              getBoundsForNode(node)
            )

            if (!_this.state.selecting) {
              _this._initialSlot = currentSlot
            }

            var initialSlot = _this._initialSlot

            if (lte(initialSlot, currentSlot)) {
              currentSlot = _this.slotMetrics.nextSlot(currentSlot)
            } else if (gt(initialSlot, currentSlot)) {
              initialSlot = _this.slotMetrics.nextSlot(initialSlot)
            }

            var selectRange = _this.slotMetrics.getRange(
              min$9(initialSlot, currentSlot),
              max$4(initialSlot, currentSlot)
            )

            return _extends({}, selectRange, {
              selecting: true,
              top: selectRange.top + '%',
              height: selectRange.height + '%',
            })
          }

          var selectorClicksHandler = function selectorClicksHandler(
            box,
            actionType
          ) {
            if (
              !isEvent(ReactDOM.findDOMNode(_assertThisInitialized(_this)), box)
            ) {
              var _selectionState = selectionState(box),
                startDate = _selectionState.startDate,
                endDate = _selectionState.endDate

              _this._selectSlot({
                startDate: startDate,
                endDate: endDate,
                action: actionType,
                box: box,
              })
            }

            _this.setState({
              selecting: false,
            })
          }

          selector.on('selecting', maybeSelect)
          selector.on('selectStart', maybeSelect)
          selector.on('beforeSelect', function(box) {
            if (_this.props.selectable !== 'ignoreEvents') return
            return !isEvent(
              ReactDOM.findDOMNode(_assertThisInitialized(_this)),
              box
            )
          })
          selector.on('click', function(box) {
            return selectorClicksHandler(box, 'click')
          })
          selector.on('doubleClick', function(box) {
            return selectorClicksHandler(box, 'doubleClick')
          })
          selector.on('select', function(bounds) {
            if (_this.state.selecting) {
              _this._selectSlot(
                _extends({}, _this.state, {
                  action: 'select',
                  bounds: bounds,
                })
              )

              _this.setState({
                selecting: false,
              })
            }
          })
          selector.on('reset', function() {
            if (_this.state.selecting) {
              _this.setState({
                selecting: false,
              })
            }
          })
        }

        _this._teardownSelectable = function() {
          if (!_this._selector) return

          _this._selector.teardown()

          _this._selector = null
        }

        _this._selectSlot = function(_ref2) {
          var startDate = _ref2.startDate,
            endDate = _ref2.endDate,
            action = _ref2.action,
            bounds = _ref2.bounds,
            box = _ref2.box
          var current = startDate,
            slots = []

          while (lte(current, endDate)) {
            slots.push(current)
            current = add(current, _this.props.step, 'minutes')
          }

          notify$2(_this.props.onSelectSlot, {
            slots: slots,
            start: startDate,
            end: endDate,
            resourceId: _this.props.resource,
            action: action,
            bounds: bounds,
            box: box,
          })
        }

        _this._select = function() {
          for (
            var _len2 = arguments.length, args = new Array(_len2), _key2 = 0;
            _key2 < _len2;
            _key2++
          ) {
            args[_key2] = arguments[_key2]
          }

          notify$2(_this.props.onSelectEvent, args)
        }

        _this._doubleClick = function() {
          for (
            var _len3 = arguments.length, args = new Array(_len3), _key3 = 0;
            _key3 < _len3;
            _key3++
          ) {
            args[_key3] = arguments[_key3]
          }

          notify$2(_this.props.onDoubleClickEvent, args)
        }

        _this.slotMetrics = getSlotMetrics$1(_this.props)
        return _this
      }

      var _proto = DayColumn.prototype

      _proto.componentDidMount = function componentDidMount() {
        this.props.selectable && this._selectable()

        if (this.props.isNow) {
          this.setTimeIndicatorPositionUpdateInterval()
        }
      }

      _proto.componentWillUnmount = function componentWillUnmount() {
        this._teardownSelectable()

        this.clearTimeIndicatorInterval()
      }

      _proto.UNSAFE_componentWillReceiveProps = function UNSAFE_componentWillReceiveProps(
        nextProps
      ) {
        if (nextProps.selectable && !this.props.selectable) this._selectable()
        if (!nextProps.selectable && this.props.selectable)
          this._teardownSelectable()
        this.slotMetrics = this.slotMetrics.update(nextProps)
      }

      _proto.componentDidUpdate = function componentDidUpdate(
        prevProps,
        prevState
      ) {
        var getNowChanged = !eq(
          prevProps.getNow(),
          this.props.getNow(),
          'minutes'
        )

        if (prevProps.isNow !== this.props.isNow || getNowChanged) {
          this.clearTimeIndicatorInterval()

          if (this.props.isNow) {
            var tail =
              !getNowChanged &&
              eq(prevProps.date, this.props.date, 'minutes') &&
              prevState.timeIndicatorPosition ===
                this.state.timeIndicatorPosition
            this.setTimeIndicatorPositionUpdateInterval(tail)
          }
        } else if (
          this.props.isNow &&
          (!eq(prevProps.min, this.props.min, 'minutes') ||
            !eq(prevProps.max, this.props.max, 'minutes'))
        ) {
          this.positionTimeIndicator()
        }
      }
      /**
       * @param tail {Boolean} - whether `positionTimeIndicator` call should be
       *   deferred or called upon setting interval (`true` - if deferred);
       */

      _proto.setTimeIndicatorPositionUpdateInterval = function setTimeIndicatorPositionUpdateInterval(
        tail
      ) {
        var _this2 = this

        if (tail === void 0) {
          tail = false
        }

        if (!this.intervalTriggered && !tail) {
          this.positionTimeIndicator()
        }

        this._timeIndicatorTimeout = window.setTimeout(function() {
          _this2.intervalTriggered = true

          _this2.positionTimeIndicator()

          _this2.setTimeIndicatorPositionUpdateInterval()
        }, 60000)
      }

      _proto.clearTimeIndicatorInterval = function clearTimeIndicatorInterval() {
        this.intervalTriggered = false
        window.clearTimeout(this._timeIndicatorTimeout)
      }

      _proto.positionTimeIndicator = function positionTimeIndicator() {
        var _this$props2 = this.props,
          min = _this$props2.min,
          max = _this$props2.max,
          getNow = _this$props2.getNow
        var current = getNow()

        if (current >= min && current <= max) {
          var top = this.slotMetrics.getCurrentTimePosition(current)
          this.setState({
            timeIndicatorPosition: top,
          })
        } else {
          this.clearTimeIndicatorInterval()
        }
      }

      _proto.render = function render() {
        var _this$props3 = this.props,
          max = _this$props3.max,
          rtl = _this$props3.rtl,
          isNow = _this$props3.isNow,
          resource = _this$props3.resource,
          accessors = _this$props3.accessors,
          localizer = _this$props3.localizer,
          _this$props3$getters = _this$props3.getters,
          dayProp = _this$props3$getters.dayProp,
          getters = _objectWithoutPropertiesLoose(_this$props3$getters, [
            'dayProp',
          ]),
          _this$props3$componen = _this$props3.components,
          EventContainer = _this$props3$componen.eventContainerWrapper,
          components = _objectWithoutPropertiesLoose(_this$props3$componen, [
            'eventContainerWrapper',
          ])

        var slotMetrics = this.slotMetrics
        var _this$state = this.state,
          selecting = _this$state.selecting,
          top = _this$state.top,
          height = _this$state.height,
          startDate = _this$state.startDate,
          endDate = _this$state.endDate
        var selectDates = {
          start: startDate,
          end: endDate,
        }

        var _dayProp = dayProp(max),
          className = _dayProp.className,
          style = _dayProp.style

        return React__default.createElement(
          'div',
          {
            style: style,
            className: clsx(
              className,
              'rbc-day-slot',
              'rbc-time-column',
              isNow && 'rbc-now',
              isNow && 'rbc-today', // WHY
              selecting && 'rbc-slot-selecting'
            ),
          },
          slotMetrics.groups.map(function(grp, idx) {
            return React__default.createElement(TimeSlotGroup, {
              key: idx,
              group: grp,
              resource: resource,
              getters: getters,
              components: components,
            })
          }),
          React__default.createElement(
            EventContainer,
            {
              localizer: localizer,
              resource: resource,
              accessors: accessors,
              getters: getters,
              components: components,
              slotMetrics: slotMetrics,
            },
            React__default.createElement(
              'div',
              {
                className: clsx('rbc-events-container', rtl && 'rtl'),
              },
              this.renderEvents()
            )
          ),
          selecting &&
            React__default.createElement(
              'div',
              {
                className: 'rbc-slot-selection',
                style: {
                  top: top,
                  height: height,
                },
              },
              React__default.createElement(
                'span',
                null,
                localizer.format(selectDates, 'selectRangeFormat')
              )
            ),
          isNow &&
            React__default.createElement('div', {
              className: 'rbc-current-time-indicator',
              style: {
                top: this.state.timeIndicatorPosition + '%',
              },
            })
        )
      }

      return DayColumn
    })(React__default.Component)

  DayColumn.propTypes = {
    events: propTypes.array.isRequired,
    step: propTypes.number.isRequired,
    date: propTypes.instanceOf(Date).isRequired,
    min: propTypes.instanceOf(Date).isRequired,
    max: propTypes.instanceOf(Date).isRequired,
    getNow: propTypes.func.isRequired,
    isNow: propTypes.bool,
    rtl: propTypes.bool,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    localizer: propTypes.object.isRequired,
    showMultiDayTimes: propTypes.bool,
    culture: propTypes.string,
    timeslots: propTypes.number,
    selected: propTypes.object,
    selectable: propTypes.oneOf([true, false, 'ignoreEvents']),
    eventOffset: propTypes.number,
    longPressThreshold: propTypes.number,
    onSelecting: propTypes.func,
    onSelectSlot: propTypes.func.isRequired,
    onSelectEvent: propTypes.func.isRequired,
    onDoubleClickEvent: propTypes.func.isRequired,
    className: propTypes.string,
    dragThroughEvents: propTypes.bool,
    resource: propTypes.any,
    dayLayoutAlgorithm: DayLayoutAlgorithmPropType,
  }
  DayColumn.defaultProps = {
    dragThroughEvents: true,
    timeslots: 2,
  }

  var TimeGutter =
    /*#__PURE__*/
    (function(_Component) {
      _inheritsLoose(TimeGutter, _Component)

      function TimeGutter() {
        var _this

        for (
          var _len = arguments.length, args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          args[_key] = arguments[_key]
        }

        _this = _Component.call.apply(_Component, [this].concat(args)) || this

        _this.renderSlot = function(value, idx) {
          if (idx !== 0) return null
          var _this$props = _this.props,
            localizer = _this$props.localizer,
            getNow = _this$props.getNow

          var isNow = _this.slotMetrics.dateIsInGroup(getNow(), idx)

          return React__default.createElement(
            'span',
            {
              className: clsx('rbc-label', isNow && 'rbc-now'),
            },
            localizer.format(value, 'timeGutterFormat')
          )
        }

        var _this$props2 = _this.props,
          min = _this$props2.min,
          max = _this$props2.max,
          timeslots = _this$props2.timeslots,
          step = _this$props2.step
        _this.slotMetrics = getSlotMetrics$1({
          min: min,
          max: max,
          timeslots: timeslots,
          step: step,
        })
        return _this
      }

      var _proto = TimeGutter.prototype

      _proto.UNSAFE_componentWillReceiveProps = function UNSAFE_componentWillReceiveProps(
        nextProps
      ) {
        var min = nextProps.min,
          max = nextProps.max,
          timeslots = nextProps.timeslots,
          step = nextProps.step
        this.slotMetrics = this.slotMetrics.update({
          min: min,
          max: max,
          timeslots: timeslots,
          step: step,
        })
      }

      _proto.render = function render() {
        var _this2 = this

        var _this$props3 = this.props,
          resource = _this$props3.resource,
          components = _this$props3.components,
          getters = _this$props3.getters
        return React__default.createElement(
          'div',
          {
            className: 'rbc-time-gutter rbc-time-column',
          },
          this.slotMetrics.groups.map(function(grp, idx) {
            return React__default.createElement(TimeSlotGroup, {
              key: idx,
              group: grp,
              resource: resource,
              components: components,
              renderSlot: _this2.renderSlot,
              getters: getters,
            })
          })
        )
      }

      return TimeGutter
    })(React.Component)
  TimeGutter.propTypes = {
    min: propTypes.instanceOf(Date).isRequired,
    max: propTypes.instanceOf(Date).isRequired,
    timeslots: propTypes.number.isRequired,
    step: propTypes.number.isRequired,
    getNow: propTypes.func.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object,
    localizer: propTypes.object.isRequired,
    resource: propTypes.string,
  }

  function getWidth(node, client) {
    var win = isWindow(node)
    return win ? win.innerWidth : client ? node.clientWidth : offset(node).width
  }

  var size
  function scrollbarSize(recalc) {
    if ((!size && size !== 0) || recalc) {
      if (canUseDOM) {
        var scrollDiv = document.createElement('div')
        scrollDiv.style.position = 'absolute'
        scrollDiv.style.top = '-9999px'
        scrollDiv.style.width = '50px'
        scrollDiv.style.height = '50px'
        scrollDiv.style.overflow = 'scroll'
        document.body.appendChild(scrollDiv)
        size = scrollDiv.offsetWidth - scrollDiv.clientWidth
        document.body.removeChild(scrollDiv)
      }
    }

    return size
  }

  var ResourceHeader = function ResourceHeader(_ref) {
    var label = _ref.label
    return React__default.createElement(React__default.Fragment, null, label)
  }

  ResourceHeader.propTypes = {
    label: propTypes.node,
    index: propTypes.number,
    resource: propTypes.object,
  }

  var TimeGridHeader =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(TimeGridHeader, _React$Component)

      function TimeGridHeader() {
        var _this

        for (
          var _len = arguments.length, args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          args[_key] = arguments[_key]
        }

        _this =
          _React$Component.call.apply(_React$Component, [this].concat(args)) ||
          this

        _this.handleHeaderClick = function(date, view, e) {
          e.preventDefault()
          notify$2(_this.props.onDrillDown, [date, view])
        }

        _this.renderRow = function(resource) {
          var _this$props = _this.props,
            events = _this$props.events,
            rtl = _this$props.rtl,
            selectable = _this$props.selectable,
            getNow = _this$props.getNow,
            range = _this$props.range,
            getters = _this$props.getters,
            localizer = _this$props.localizer,
            accessors = _this$props.accessors,
            components = _this$props.components
          var resourceId = accessors.resourceId(resource)
          var eventsToDisplay = resource
            ? events.filter(function(event) {
                return accessors.resource(event) === resourceId
              })
            : events
          return React__default.createElement(DateContentRow, {
            isAllDay: true,
            rtl: rtl,
            getNow: getNow,
            minRows: 2,
            range: range,
            events: eventsToDisplay,
            resourceId: resourceId,
            className: 'rbc-allday-cell',
            selectable: selectable,
            selected: _this.props.selected,
            components: components,
            accessors: accessors,
            getters: getters,
            localizer: localizer,
            onSelect: _this.props.onSelectEvent,
            onDoubleClick: _this.props.onDoubleClickEvent,
            onSelectSlot: _this.props.onSelectSlot,
            longPressThreshold: _this.props.longPressThreshold,
          })
        }

        return _this
      }

      var _proto = TimeGridHeader.prototype

      _proto.renderHeaderCells = function renderHeaderCells(range) {
        var _this2 = this

        var _this$props2 = this.props,
          localizer = _this$props2.localizer,
          getDrilldownView = _this$props2.getDrilldownView,
          getNow = _this$props2.getNow,
          dayProp = _this$props2.getters.dayProp,
          _this$props2$componen = _this$props2.components.header,
          HeaderComponent =
            _this$props2$componen === void 0 ? Header : _this$props2$componen
        var today = getNow()
        return range.map(function(date, i) {
          var drilldownView = getDrilldownView(date)
          var label = localizer.format(date, 'dayFormat')

          var _dayProp = dayProp(date),
            className = _dayProp.className,
            style = _dayProp.style

          var header = React__default.createElement(HeaderComponent, {
            date: date,
            label: label,
            localizer: localizer,
          })
          return React__default.createElement(
            'div',
            {
              key: i,
              style: style,
              className: clsx(
                'rbc-header',
                className,
                eq(date, today, 'day') && 'rbc-today'
              ),
            },
            drilldownView
              ? React__default.createElement(
                  'a',
                  {
                    href: '#',
                    onClick: function onClick(e) {
                      return _this2.handleHeaderClick(date, drilldownView, e)
                    },
                  },
                  header
                )
              : React__default.createElement('span', null, header)
          )
        })
      }

      _proto.render = function render() {
        var _this3 = this

        var _this$props3 = this.props,
          width = _this$props3.width,
          rtl = _this$props3.rtl,
          resources = _this$props3.resources,
          range = _this$props3.range,
          events = _this$props3.events,
          getNow = _this$props3.getNow,
          accessors = _this$props3.accessors,
          selectable = _this$props3.selectable,
          components = _this$props3.components,
          getters = _this$props3.getters,
          scrollRef = _this$props3.scrollRef,
          localizer = _this$props3.localizer,
          isOverflowing = _this$props3.isOverflowing,
          _this$props3$componen = _this$props3.components,
          TimeGutterHeader = _this$props3$componen.timeGutterHeader,
          _this$props3$componen2 = _this$props3$componen.resourceHeader,
          ResourceHeaderComponent =
            _this$props3$componen2 === void 0
              ? ResourceHeader
              : _this$props3$componen2
        var style = {}

        if (isOverflowing) {
          style[rtl ? 'marginLeft' : 'marginRight'] = scrollbarSize() + 'px'
        }

        var groupedEvents = resources.groupEvents(events)
        return React__default.createElement(
          'div',
          {
            style: style,
            ref: scrollRef,
            className: clsx(
              'rbc-time-header',
              isOverflowing && 'rbc-overflowing'
            ),
          },
          React__default.createElement(
            'div',
            {
              className: 'rbc-label rbc-time-header-gutter',
              style: {
                width: width,
                minWidth: width,
                maxWidth: width,
              },
            },
            TimeGutterHeader &&
              React__default.createElement(TimeGutterHeader, null)
          ),
          resources.map(function(_ref, idx) {
            var id = _ref[0],
              resource = _ref[1]
            return React__default.createElement(
              'div',
              {
                className: 'rbc-time-header-content',
                key: id || idx,
              },
              resource &&
                React__default.createElement(
                  'div',
                  {
                    className: 'rbc-row rbc-row-resource',
                    key: 'resource_' + idx,
                  },
                  React__default.createElement(
                    'div',
                    {
                      className: 'rbc-header',
                    },
                    React__default.createElement(ResourceHeaderComponent, {
                      index: idx,
                      label: accessors.resourceTitle(resource),
                      resource: resource,
                    })
                  )
                ),
              React__default.createElement(
                'div',
                {
                  className:
                    'rbc-row rbc-time-header-cell' +
                    (range.length <= 1
                      ? ' rbc-time-header-cell-single-day'
                      : ''),
                },
                _this3.renderHeaderCells(range)
              ),
              React__default.createElement(DateContentRow, {
                isAllDay: true,
                rtl: rtl,
                getNow: getNow,
                minRows: 2,
                range: range,
                events: groupedEvents.get(id) || [],
                resourceId: resource && id,
                className: 'rbc-allday-cell',
                selectable: selectable,
                selected: _this3.props.selected,
                components: components,
                accessors: accessors,
                getters: getters,
                localizer: localizer,
                onSelect: _this3.props.onSelectEvent,
                onDoubleClick: _this3.props.onDoubleClickEvent,
                onSelectSlot: _this3.props.onSelectSlot,
                longPressThreshold: _this3.props.longPressThreshold,
              })
            )
          })
        )
      }

      return TimeGridHeader
    })(React__default.Component)

  TimeGridHeader.propTypes = {
    range: propTypes.array.isRequired,
    events: propTypes.array.isRequired,
    resources: propTypes.object,
    getNow: propTypes.func.isRequired,
    isOverflowing: propTypes.bool,
    rtl: propTypes.bool,
    width: propTypes.number,
    localizer: propTypes.object.isRequired,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    selected: propTypes.object,
    selectable: propTypes.oneOf([true, false, 'ignoreEvents']),
    longPressThreshold: propTypes.number,
    onSelectSlot: propTypes.func,
    onSelectEvent: propTypes.func,
    onDoubleClickEvent: propTypes.func,
    onDrillDown: propTypes.func,
    getDrilldownView: propTypes.func.isRequired,
    scrollRef: propTypes.any,
  }

  var NONE = {}
  function Resources(resources, accessors) {
    return {
      map: function map(fn) {
        if (!resources) return [fn([NONE, null], 0)]
        return resources.map(function(resource, idx) {
          return fn([accessors.resourceId(resource), resource], idx)
        })
      },
      groupEvents: function groupEvents(events) {
        var eventsByResource = new Map()

        if (!resources) {
          // Return all events if resources are not provided
          eventsByResource.set(NONE, events)
          return eventsByResource
        }

        events.forEach(function(event) {
          var id = accessors.resource(event) || NONE
          var resourceEvents = eventsByResource.get(id) || []
          resourceEvents.push(event)
          eventsByResource.set(id, resourceEvents)
        })
        return eventsByResource
      },
    }
  }

  var TimeGrid =
    /*#__PURE__*/
    (function(_Component) {
      _inheritsLoose(TimeGrid, _Component)

      function TimeGrid(props) {
        var _this

        _this = _Component.call(this, props) || this

        _this.handleScroll = function(e) {
          if (_this.scrollRef.current) {
            _this.scrollRef.current.scrollLeft = e.target.scrollLeft
          }
        }

        _this.handleResize = function() {
          cancel$1(_this.rafHandle)
          _this.rafHandle = request(_this.checkOverflow)
        }

        _this.gutterRef = function(ref) {
          _this.gutter = ref && ReactDOM.findDOMNode(ref)
        }

        _this.handleSelectAlldayEvent = function() {
          //cancel any pending selections so only the event click goes through.
          _this.clearSelection()

          for (
            var _len = arguments.length, args = new Array(_len), _key = 0;
            _key < _len;
            _key++
          ) {
            args[_key] = arguments[_key]
          }

          notify$2(_this.props.onSelectEvent, args)
        }

        _this.handleSelectAllDaySlot = function(slots, slotInfo) {
          var onSelectSlot = _this.props.onSelectSlot
          notify$2(onSelectSlot, {
            slots: slots,
            start: slots[0],
            end: slots[slots.length - 1],
            action: slotInfo.action,
          })
        }

        _this.checkOverflow = function() {
          if (_this._updatingOverflow) return
          var content = _this.contentRef.current
          var isOverflowing = content.scrollHeight > content.clientHeight

          if (_this.state.isOverflowing !== isOverflowing) {
            _this._updatingOverflow = true

            _this.setState(
              {
                isOverflowing: isOverflowing,
              },
              function() {
                _this._updatingOverflow = false
              }
            )
          }
        }

        _this.memoizedResources = index$2(function(resources, accessors) {
          return Resources(resources, accessors)
        })
        _this.state = {
          gutterWidth: undefined,
          isOverflowing: null,
        }
        _this.scrollRef = React__default.createRef()
        _this.contentRef = React__default.createRef()
        _this._scrollRatio = null
        return _this
      }

      var _proto = TimeGrid.prototype

      _proto.UNSAFE_componentWillMount = function UNSAFE_componentWillMount() {
        this.calculateScroll()
      }

      _proto.componentDidMount = function componentDidMount() {
        this.checkOverflow()

        if (this.props.width == null) {
          this.measureGutter()
        }

        this.applyScroll()
        window.addEventListener('resize', this.handleResize)
      }

      _proto.componentWillUnmount = function componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize)
        cancel$1(this.rafHandle)

        if (this.measureGutterAnimationFrameRequest) {
          window.cancelAnimationFrame(this.measureGutterAnimationFrameRequest)
        }
      }

      _proto.componentDidUpdate = function componentDidUpdate() {
        if (this.props.width == null) {
          this.measureGutter()
        }

        this.applyScroll() //this.checkOverflow()
      }

      _proto.UNSAFE_componentWillReceiveProps = function UNSAFE_componentWillReceiveProps(
        nextProps
      ) {
        var _this$props = this.props,
          range = _this$props.range,
          scrollToTime = _this$props.scrollToTime // When paginating, reset scroll

        if (
          !eq(nextProps.range[0], range[0], 'minute') ||
          !eq(nextProps.scrollToTime, scrollToTime, 'minute')
        ) {
          this.calculateScroll(nextProps)
        }
      }

      _proto.renderEvents = function renderEvents(range, events, now) {
        var _this2 = this

        var _this$props2 = this.props,
          min = _this$props2.min,
          max = _this$props2.max,
          components = _this$props2.components,
          accessors = _this$props2.accessors,
          localizer = _this$props2.localizer,
          dayLayoutAlgorithm = _this$props2.dayLayoutAlgorithm
        var resources = this.memoizedResources(this.props.resources, accessors)
        var groupedEvents = resources.groupEvents(events)
        return resources.map(function(_ref, i) {
          var id = _ref[0],
            resource = _ref[1]
          return range.map(function(date, jj) {
            var daysEvents = (groupedEvents.get(id) || []).filter(function(
              event
            ) {
              return inRange(
                date,
                accessors.start(event),
                accessors.end(event),
                'day'
              )
            })
            return React__default.createElement(
              DayColumn,
              _extends({}, _this2.props, {
                localizer: localizer,
                min: merge(date, min),
                max: merge(date, max),
                resource: resource && id,
                components: components,
                isNow: eq(date, now, 'day'),
                key: i + '-' + jj,
                date: date,
                events: daysEvents,
                dayLayoutAlgorithm: dayLayoutAlgorithm,
              })
            )
          })
        })
      }

      _proto.render = function render() {
        var _this$props3 = this.props,
          events = _this$props3.events,
          range = _this$props3.range,
          width = _this$props3.width,
          rtl = _this$props3.rtl,
          selected = _this$props3.selected,
          getNow = _this$props3.getNow,
          resources = _this$props3.resources,
          components = _this$props3.components,
          accessors = _this$props3.accessors,
          getters = _this$props3.getters,
          localizer = _this$props3.localizer,
          min = _this$props3.min,
          max = _this$props3.max,
          showMultiDayTimes = _this$props3.showMultiDayTimes,
          longPressThreshold = _this$props3.longPressThreshold
        width = width || this.state.gutterWidth
        var start = range[0],
          end = range[range.length - 1]
        this.slots = range.length
        var allDayEvents = [],
          rangeEvents = []
        events.forEach(function(event) {
          if (inRange$1(event, start, end, accessors)) {
            var eStart = accessors.start(event),
              eEnd = accessors.end(event)

            if (
              accessors.allDay(event) ||
              (isJustDate(eStart) && isJustDate(eEnd)) ||
              (!showMultiDayTimes && !eq(eStart, eEnd, 'day'))
            ) {
              allDayEvents.push(event)
            } else {
              rangeEvents.push(event)
            }
          }
        })
        allDayEvents.sort(function(a, b) {
          return sortEvents(a, b, accessors)
        })
        return React__default.createElement(
          'div',
          {
            className: clsx(
              'rbc-time-view',
              resources && 'rbc-time-view-resources'
            ),
          },
          React__default.createElement(TimeGridHeader, {
            range: range,
            events: allDayEvents,
            width: width,
            rtl: rtl,
            getNow: getNow,
            localizer: localizer,
            selected: selected,
            resources: this.memoizedResources(resources, accessors),
            selectable: this.props.selectable,
            accessors: accessors,
            getters: getters,
            components: components,
            scrollRef: this.scrollRef,
            isOverflowing: this.state.isOverflowing,
            longPressThreshold: longPressThreshold,
            onSelectSlot: this.handleSelectAllDaySlot,
            onSelectEvent: this.handleSelectAlldayEvent,
            onDoubleClickEvent: this.props.onDoubleClickEvent,
            onDrillDown: this.props.onDrillDown,
            getDrilldownView: this.props.getDrilldownView,
          }),
          React__default.createElement(
            'div',
            {
              ref: this.contentRef,
              className: 'rbc-time-content',
              onScroll: this.handleScroll,
            },
            React__default.createElement(TimeGutter, {
              date: start,
              ref: this.gutterRef,
              localizer: localizer,
              min: merge(start, min),
              max: merge(start, max),
              step: this.props.step,
              getNow: this.props.getNow,
              timeslots: this.props.timeslots,
              components: components,
              className: 'rbc-time-gutter',
              getters: getters,
            }),
            this.renderEvents(range, rangeEvents, getNow())
          )
        )
      }

      _proto.clearSelection = function clearSelection() {
        clearTimeout(this._selectTimer)
        this._pendingSelection = []
      }

      _proto.measureGutter = function measureGutter() {
        var _this3 = this

        if (this.measureGutterAnimationFrameRequest) {
          window.cancelAnimationFrame(this.measureGutterAnimationFrameRequest)
        }

        this.measureGutterAnimationFrameRequest = window.requestAnimationFrame(
          function() {
            var width = getWidth(_this3.gutter)

            if (width && _this3.state.gutterWidth !== width) {
              _this3.setState({
                gutterWidth: width,
              })
            }
          }
        )
      }

      _proto.applyScroll = function applyScroll() {
        if (this._scrollRatio != null) {
          var content = this.contentRef.current
          content.scrollTop = content.scrollHeight * this._scrollRatio // Only do this once

          this._scrollRatio = null
        }
      }

      _proto.calculateScroll = function calculateScroll(props) {
        if (props === void 0) {
          props = this.props
        }

        var _props = props,
          min = _props.min,
          max = _props.max,
          scrollToTime = _props.scrollToTime
        var diffMillis = scrollToTime - startOf(scrollToTime, 'day')
        var totalMillis = diff(max, min)
        this._scrollRatio = diffMillis / totalMillis
      }

      return TimeGrid
    })(React.Component)
  TimeGrid.propTypes = {
    events: propTypes.array.isRequired,
    resources: propTypes.array,
    step: propTypes.number,
    timeslots: propTypes.number,
    range: propTypes.arrayOf(propTypes.instanceOf(Date)),
    min: propTypes.instanceOf(Date),
    max: propTypes.instanceOf(Date),
    getNow: propTypes.func.isRequired,
    scrollToTime: propTypes.instanceOf(Date),
    showMultiDayTimes: propTypes.bool,
    rtl: propTypes.bool,
    width: propTypes.number,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    localizer: propTypes.object.isRequired,
    selected: propTypes.object,
    selectable: propTypes.oneOf([true, false, 'ignoreEvents']),
    longPressThreshold: propTypes.number,
    onNavigate: propTypes.func,
    onSelectSlot: propTypes.func,
    onSelectEnd: propTypes.func,
    onSelectStart: propTypes.func,
    onSelectEvent: propTypes.func,
    onDoubleClickEvent: propTypes.func,
    onDrillDown: propTypes.func,
    getDrilldownView: propTypes.func.isRequired,
    dayLayoutAlgorithm: DayLayoutAlgorithmPropType,
  }
  TimeGrid.defaultProps = {
    step: 30,
    timeslots: 2,
    min: startOf(new Date(), 'day'),
    max: endOf(new Date(), 'day'),
    scrollToTime: startOf(new Date(), 'day'),
  }

  var Day =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(Day, _React$Component)

      function Day() {
        return _React$Component.apply(this, arguments) || this
      }

      var _proto = Day.prototype

      _proto.render = function render() {
        var _this$props = this.props,
          date = _this$props.date,
          props = _objectWithoutPropertiesLoose(_this$props, ['date'])

        var range = Day.range(date)
        return React__default.createElement(
          TimeGrid,
          _extends({}, props, {
            range: range,
            eventOffset: 10,
          })
        )
      }

      return Day
    })(React__default.Component)

  Day.propTypes = {
    date: propTypes.instanceOf(Date).isRequired,
  }

  Day.range = function(date) {
    return [startOf(date, 'day')]
  }

  Day.navigate = function(date, action) {
    switch (action) {
      case navigate.PREVIOUS:
        return add(date, -1, 'day')

      case navigate.NEXT:
        return add(date, 1, 'day')

      default:
        return date
    }
  }

  Day.title = function(date, _ref) {
    var localizer = _ref.localizer
    return localizer.format(date, 'dayHeaderFormat')
  }

  var Week =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(Week, _React$Component)

      function Week() {
        return _React$Component.apply(this, arguments) || this
      }

      var _proto = Week.prototype

      _proto.render = function render() {
        var _this$props = this.props,
          date = _this$props.date,
          props = _objectWithoutPropertiesLoose(_this$props, ['date'])

        var range = Week.range(date, this.props)
        return React__default.createElement(
          TimeGrid,
          _extends({}, props, {
            range: range,
            eventOffset: 15,
          })
        )
      }

      return Week
    })(React__default.Component)

  Week.propTypes = {
    date: propTypes.instanceOf(Date).isRequired,
  }
  Week.defaultProps = TimeGrid.defaultProps

  Week.navigate = function(date, action) {
    switch (action) {
      case navigate.PREVIOUS:
        return add(date, -1, 'week')

      case navigate.NEXT:
        return add(date, 1, 'week')

      default:
        return date
    }
  }

  Week.range = function(date, _ref) {
    var localizer = _ref.localizer
    var firstOfWeek = localizer.startOfWeek()
    var start = startOf(date, 'week', firstOfWeek)
    var end = endOf(date, 'week', firstOfWeek)
    return range(start, end)
  }

  Week.title = function(date, _ref2) {
    var localizer = _ref2.localizer

    var _Week$range = Week.range(date, {
        localizer: localizer,
      }),
      start = _Week$range[0],
      rest = _Week$range.slice(1)

    return localizer.format(
      {
        start: start,
        end: rest.pop(),
      },
      'dayRangeHeaderFormat'
    )
  }

  function workWeekRange(date, options) {
    return Week.range(date, options).filter(function(d) {
      return [6, 0].indexOf(d.getDay()) === -1
    })
  }

  var WorkWeek =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(WorkWeek, _React$Component)

      function WorkWeek() {
        return _React$Component.apply(this, arguments) || this
      }

      var _proto = WorkWeek.prototype

      _proto.render = function render() {
        var _this$props = this.props,
          date = _this$props.date,
          props = _objectWithoutPropertiesLoose(_this$props, ['date'])

        var range = workWeekRange(date, this.props)
        return React__default.createElement(
          TimeGrid,
          _extends({}, props, {
            range: range,
            eventOffset: 15,
          })
        )
      }

      return WorkWeek
    })(React__default.Component)

  WorkWeek.propTypes = {
    date: propTypes.instanceOf(Date).isRequired,
  }
  WorkWeek.defaultProps = TimeGrid.defaultProps
  WorkWeek.range = workWeekRange
  WorkWeek.navigate = Week.navigate

  WorkWeek.title = function(date, _ref) {
    var localizer = _ref.localizer

    var _workWeekRange = workWeekRange(date, {
        localizer: localizer,
      }),
      start = _workWeekRange[0],
      rest = _workWeekRange.slice(1)

    return localizer.format(
      {
        start: start,
        end: rest.pop(),
      },
      'dayRangeHeaderFormat'
    )
  }

  function hasClass(element, className) {
    if (element.classList)
      return !!className && element.classList.contains(className)
    return (
      (' ' + (element.className.baseVal || element.className) + ' ').indexOf(
        ' ' + className + ' '
      ) !== -1
    )
  }

  function addClass(element, className) {
    if (element.classList) element.classList.add(className)
    else if (!hasClass(element, className))
      if (typeof element.className === 'string')
        element.className = element.className + ' ' + className
      else
        element.setAttribute(
          'class',
          ((element.className && element.className.baseVal) || '') +
            ' ' +
            className
        )
  }

  function replaceClassName(origClass, classToRemove) {
    return origClass
      .replace(new RegExp('(^|\\s)' + classToRemove + '(?:\\s|$)', 'g'), '$1')
      .replace(/\s+/g, ' ')
      .replace(/^\s*|\s*$/g, '')
  }

  function removeClass(element, className) {
    if (element.classList) {
      element.classList.remove(className)
    } else if (typeof element.className === 'string') {
      element.className = replaceClassName(element.className, className)
    } else {
      element.setAttribute(
        'class',
        replaceClassName(
          (element.className && element.className.baseVal) || '',
          className
        )
      )
    }
  }

  var Agenda =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(Agenda, _React$Component)

      function Agenda(props) {
        var _this

        _this = _React$Component.call(this, props) || this

        _this.renderDay = function(day, events, dayKey) {
          var _this$props = _this.props,
            selected = _this$props.selected,
            getters = _this$props.getters,
            accessors = _this$props.accessors,
            localizer = _this$props.localizer,
            _this$props$component = _this$props.components,
            Event = _this$props$component.event,
            AgendaDate = _this$props$component.date
          events = events.filter(function(e) {
            return inRange$1(
              e,
              startOf(day, 'day'),
              endOf(day, 'day'),
              accessors
            )
          })
          return events.map(function(event, idx) {
            var title = accessors.title(event)
            var end = accessors.end(event)
            var start = accessors.start(event)
            var userProps = getters.eventProp(
              event,
              start,
              end,
              isSelected(event, selected)
            )
            var dateLabel =
              idx === 0 && localizer.format(day, 'agendaDateFormat')
            var first =
              idx === 0
                ? React__default.createElement(
                    'td',
                    {
                      rowSpan: events.length,
                      className: 'rbc-agenda-date-cell',
                    },
                    AgendaDate
                      ? React__default.createElement(AgendaDate, {
                          day: day,
                          label: dateLabel,
                        })
                      : dateLabel
                  )
                : false
            return React__default.createElement(
              'tr',
              {
                key: dayKey + '_' + idx,
                className: userProps.className,
                style: userProps.style,
              },
              first,
              React__default.createElement(
                'td',
                {
                  className: 'rbc-agenda-time-cell',
                },
                _this.timeRangeLabel(day, event)
              ),
              React__default.createElement(
                'td',
                {
                  className: 'rbc-agenda-event-cell',
                },
                Event
                  ? React__default.createElement(Event, {
                      event: event,
                      title: title,
                    })
                  : title
              )
            )
          }, [])
        }

        _this.timeRangeLabel = function(day, event) {
          var _this$props2 = _this.props,
            accessors = _this$props2.accessors,
            localizer = _this$props2.localizer,
            components = _this$props2.components
          var labelClass = '',
            TimeComponent = components.time,
            label = localizer.messages.allDay
          var end = accessors.end(event)
          var start = accessors.start(event)

          if (!accessors.allDay(event)) {
            if (eq(start, end)) {
              label = localizer.format(start, 'agendaTimeFormat')
            } else if (eq(start, end, 'day')) {
              label = localizer.format(
                {
                  start: start,
                  end: end,
                },
                'agendaTimeRangeFormat'
              )
            } else if (eq(day, start, 'day')) {
              label = localizer.format(start, 'agendaTimeFormat')
            } else if (eq(day, end, 'day')) {
              label = localizer.format(end, 'agendaTimeFormat')
            }
          }

          if (gt(day, start, 'day')) labelClass = 'rbc-continues-prior'
          if (lt(day, end, 'day')) labelClass += ' rbc-continues-after'
          return React__default.createElement(
            'span',
            {
              className: labelClass.trim(),
            },
            TimeComponent
              ? React__default.createElement(TimeComponent, {
                  event: event,
                  day: day,
                  label: label,
                })
              : label
          )
        }

        _this._adjustHeader = function() {
          if (!_this.tbodyRef.current) return
          var header = _this.headerRef.current
          var firstRow = _this.tbodyRef.current.firstChild
          if (!firstRow) return
          var isOverflowing =
            _this.contentRef.current.scrollHeight >
            _this.contentRef.current.clientHeight
          var widths = _this._widths || []
          _this._widths = [
            getWidth(firstRow.children[0]),
            getWidth(firstRow.children[1]),
          ]

          if (
            widths[0] !== _this._widths[0] ||
            widths[1] !== _this._widths[1]
          ) {
            _this.dateColRef.current.style.width = _this._widths[0] + 'px'
            _this.timeColRef.current.style.width = _this._widths[1] + 'px'
          }

          if (isOverflowing) {
            addClass(header, 'rbc-header-overflowing')
            header.style.marginRight = scrollbarSize() + 'px'
          } else {
            removeClass(header, 'rbc-header-overflowing')
          }
        }

        _this.headerRef = React__default.createRef()
        _this.dateColRef = React__default.createRef()
        _this.timeColRef = React__default.createRef()
        _this.contentRef = React__default.createRef()
        _this.tbodyRef = React__default.createRef()
        return _this
      }

      var _proto = Agenda.prototype

      _proto.componentDidMount = function componentDidMount() {
        this._adjustHeader()
      }

      _proto.componentDidUpdate = function componentDidUpdate() {
        this._adjustHeader()
      }

      _proto.render = function render() {
        var _this2 = this

        var _this$props3 = this.props,
          length = _this$props3.length,
          date = _this$props3.date,
          events = _this$props3.events,
          accessors = _this$props3.accessors,
          localizer = _this$props3.localizer
        var messages = localizer.messages
        var end = add(date, length, 'day')
        var range$1 = range(date, end, 'day')
        events = events.filter(function(event) {
          return inRange$1(event, date, end, accessors)
        })
        events.sort(function(a, b) {
          return +accessors.start(a) - +accessors.start(b)
        })
        return React__default.createElement(
          'div',
          {
            className: 'rbc-agenda-view',
          },
          events.length !== 0
            ? React__default.createElement(
                React__default.Fragment,
                null,
                React__default.createElement(
                  'table',
                  {
                    ref: this.headerRef,
                    className: 'rbc-agenda-table',
                  },
                  React__default.createElement(
                    'thead',
                    null,
                    React__default.createElement(
                      'tr',
                      null,
                      React__default.createElement(
                        'th',
                        {
                          className: 'rbc-header',
                          ref: this.dateColRef,
                        },
                        messages.date
                      ),
                      React__default.createElement(
                        'th',
                        {
                          className: 'rbc-header',
                          ref: this.timeColRef,
                        },
                        messages.time
                      ),
                      React__default.createElement(
                        'th',
                        {
                          className: 'rbc-header',
                        },
                        messages.event
                      )
                    )
                  )
                ),
                React__default.createElement(
                  'div',
                  {
                    className: 'rbc-agenda-content',
                    ref: this.contentRef,
                  },
                  React__default.createElement(
                    'table',
                    {
                      className: 'rbc-agenda-table',
                    },
                    React__default.createElement(
                      'tbody',
                      {
                        ref: this.tbodyRef,
                      },
                      range$1.map(function(day, idx) {
                        return _this2.renderDay(day, events, idx)
                      })
                    )
                  )
                )
              )
            : React__default.createElement(
                'span',
                {
                  className: 'rbc-agenda-empty',
                },
                messages.noEventsInRange
              )
        )
      }

      return Agenda
    })(React__default.Component)

  Agenda.propTypes = {
    events: propTypes.array,
    date: propTypes.instanceOf(Date),
    length: propTypes.number.isRequired,
    selected: propTypes.object,
    accessors: propTypes.object.isRequired,
    components: propTypes.object.isRequired,
    getters: propTypes.object.isRequired,
    localizer: propTypes.object.isRequired,
  }
  Agenda.defaultProps = {
    length: 30,
  }

  Agenda.range = function(start, _ref) {
    var _ref$length = _ref.length,
      length = _ref$length === void 0 ? Agenda.defaultProps.length : _ref$length
    var end = add(start, length, 'day')
    return {
      start: start,
      end: end,
    }
  }

  Agenda.navigate = function(date, action, _ref2) {
    var _ref2$length = _ref2.length,
      length =
        _ref2$length === void 0 ? Agenda.defaultProps.length : _ref2$length

    switch (action) {
      case navigate.PREVIOUS:
        return add(date, -length, 'day')

      case navigate.NEXT:
        return add(date, length, 'day')

      default:
        return date
    }
  }

  Agenda.title = function(start, _ref3) {
    var _ref3$length = _ref3.length,
      length =
        _ref3$length === void 0 ? Agenda.defaultProps.length : _ref3$length,
      localizer = _ref3.localizer
    var end = add(start, length, 'day')
    return localizer.format(
      {
        start: start,
        end: end,
      },
      'agendaHeaderFormat'
    )
  }

  var _VIEWS
  var VIEWS = ((_VIEWS = {}),
  (_VIEWS[views.MONTH] = MonthView),
  (_VIEWS[views.WEEK] = Week),
  (_VIEWS[views.WORK_WEEK] = WorkWeek),
  (_VIEWS[views.DAY] = Day),
  (_VIEWS[views.AGENDA] = Agenda),
  _VIEWS)

  function moveDate(View, _ref) {
    var action = _ref.action,
      date = _ref.date,
      today = _ref.today,
      props = _objectWithoutPropertiesLoose(_ref, ['action', 'date', 'today'])

    View = typeof View === 'string' ? VIEWS[View] : View

    switch (action) {
      case navigate.TODAY:
        date = today || new Date()
        break

      case navigate.DATE:
        break

      default:
        !(View && typeof View.navigate === 'function')
          ? invariant_1(
              false,
              'Calendar View components must implement a static `.navigate(date, action)` method.s'
            )
          : void 0
        date = View.navigate(date, action, props)
    }

    return date
  }

  var Toolbar =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(Toolbar, _React$Component)

      function Toolbar() {
        var _this

        for (
          var _len = arguments.length, args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          args[_key] = arguments[_key]
        }

        _this =
          _React$Component.call.apply(_React$Component, [this].concat(args)) ||
          this

        _this.navigate = function(action) {
          _this.props.onNavigate(action)
        }

        _this.view = function(view) {
          _this.props.onView(view)
        }

        return _this
      }

      var _proto = Toolbar.prototype

      _proto.render = function render() {
        var _this$props = this.props,
          messages = _this$props.localizer.messages,
          label = _this$props.label
        return React__default.createElement(
          'div',
          {
            className: 'rbc-toolbar',
          },
          React__default.createElement(
            'span',
            {
              className: 'rbc-btn-group',
            },
            React__default.createElement(
              'button',
              {
                type: 'button',
                onClick: this.navigate.bind(null, navigate.TODAY),
              },
              messages.today
            ),
            React__default.createElement(
              'button',
              {
                type: 'button',
                onClick: this.navigate.bind(null, navigate.PREVIOUS),
              },
              messages.previous
            ),
            React__default.createElement(
              'button',
              {
                type: 'button',
                onClick: this.navigate.bind(null, navigate.NEXT),
              },
              messages.next
            )
          ),
          React__default.createElement(
            'span',
            {
              className: 'rbc-toolbar-label',
            },
            label
          ),
          React__default.createElement(
            'span',
            {
              className: 'rbc-btn-group',
            },
            this.viewNamesGroup(messages)
          )
        )
      }

      _proto.viewNamesGroup = function viewNamesGroup(messages) {
        var _this2 = this

        var viewNames = this.props.views
        var view = this.props.view

        if (viewNames.length > 1) {
          return viewNames.map(function(name) {
            return React__default.createElement(
              'button',
              {
                type: 'button',
                key: name,
                className: clsx({
                  'rbc-active': view === name,
                }),
                onClick: _this2.view.bind(null, name),
              },
              messages[name]
            )
          })
        }
      }

      return Toolbar
    })(React__default.Component)

  Toolbar.propTypes = {
    view: propTypes.string.isRequired,
    views: propTypes.arrayOf(propTypes.string).isRequired,
    label: propTypes.node.isRequired,
    localizer: propTypes.object,
    onNavigate: propTypes.func.isRequired,
    onView: propTypes.func.isRequired,
  }

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
      length = array == null ? 0 : array.length

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break
      }
    }
    return array
  }

  /**
   * The base implementation of `assignValue` and `assignMergeValue` without
   * value checks.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function baseAssignValue(object, key, value) {
    if (key == '__proto__' && defineProperty$d) {
      defineProperty$d(object, key, {
        configurable: true,
        enumerable: true,
        value: value,
        writable: true,
      })
    } else {
      object[key] = value
    }
  }

  /** Used for built-in method references. */
  var objectProto$c = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$b = objectProto$c.hasOwnProperty

  /**
   * Assigns `value` to `key` of `object` if the existing value is not equivalent
   * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignValue(object, key, value) {
    var objValue = object[key]
    if (
      !(hasOwnProperty$b.call(object, key) && eq$1(objValue, value)) ||
      (value === undefined && !(key in object))
    ) {
      baseAssignValue(object, key, value)
    }
  }

  /**
   * Copies properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy properties from.
   * @param {Array} props The property identifiers to copy.
   * @param {Object} [object={}] The object to copy properties to.
   * @param {Function} [customizer] The function to customize copied values.
   * @returns {Object} Returns `object`.
   */
  function copyObject(source, props, object, customizer) {
    var isNew = !object
    object || (object = {})

    var index = -1,
      length = props.length

    while (++index < length) {
      var key = props[index]

      var newValue = customizer
        ? customizer(object[key], source[key], key, object, source)
        : undefined

      if (newValue === undefined) {
        newValue = source[key]
      }
      if (isNew) {
        baseAssignValue(object, key, newValue)
      } else {
        assignValue(object, key, newValue)
      }
    }
    return object
  }

  /**
   * The base implementation of `_.assign` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssign(object, source) {
    return object && copyObject(source, keys$4(source), object)
  }

  /**
   * This function is like
   * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * except that it includes inherited enumerable properties.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function nativeKeysIn(object) {
    var result = []
    if (object != null) {
      for (var key in Object(object)) {
        result.push(key)
      }
    }
    return result
  }

  /** Used for built-in method references. */
  var objectProto$d = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$c = objectProto$d.hasOwnProperty

  /**
   * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeysIn(object) {
    if (!isObject$1(object)) {
      return nativeKeysIn(object)
    }
    var isProto = isPrototype(object),
      result = []

    for (var key in object) {
      if (
        !(
          key == 'constructor' &&
          (isProto || !hasOwnProperty$c.call(object, key))
        )
      ) {
        result.push(key)
      }
    }
    return result
  }

  /**
   * Creates an array of the own and inherited enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keysIn(new Foo);
   * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
   */
  function keysIn$1(object) {
    return isArrayLike(object)
      ? arrayLikeKeys(object, true)
      : baseKeysIn(object)
  }

  /**
   * The base implementation of `_.assignIn` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssignIn(object, source) {
    return object && copyObject(source, keysIn$1(source), object)
  }

  /** Detect free variable `exports`. */
  var freeExports$2 =
    typeof exports == 'object' && exports && !exports.nodeType && exports

  /** Detect free variable `module`. */
  var freeModule$2 =
    freeExports$2 &&
    typeof module == 'object' &&
    module &&
    !module.nodeType &&
    module

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2

  /** Built-in value references. */
  var Buffer$1 = moduleExports$2 ? root$1.Buffer : undefined,
    allocUnsafe = Buffer$1 ? Buffer$1.allocUnsafe : undefined

  /**
   * Creates a clone of  `buffer`.
   *
   * @private
   * @param {Buffer} buffer The buffer to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Buffer} Returns the cloned buffer.
   */
  function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
      return buffer.slice()
    }
    var length = buffer.length,
      result = allocUnsafe
        ? allocUnsafe(length)
        : new buffer.constructor(length)

    buffer.copy(result)
    return result
  }

  /**
   * Copies the values of `source` to `array`.
   *
   * @private
   * @param {Array} source The array to copy values from.
   * @param {Array} [array=[]] The array to copy values to.
   * @returns {Array} Returns `array`.
   */
  function copyArray(source, array) {
    var index = -1,
      length = source.length

    array || (array = Array(length))
    while (++index < length) {
      array[index] = source[index]
    }
    return array
  }

  /**
   * Copies own symbols of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbols(source, object) {
    return copyObject(source, getSymbols(source), object)
  }

  /** Built-in value references. */
  var getPrototype = overArg(Object.getPrototypeOf, Object)

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols$1 = Object.getOwnPropertySymbols

  /**
   * Creates an array of the own and inherited enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbolsIn = !nativeGetSymbols$1
    ? stubArray
    : function(object) {
        var result = []
        while (object) {
          arrayPush$1(result, getSymbols(object))
          object = getPrototype(object)
        }
        return result
      }

  /**
   * Copies own and inherited symbols of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbolsIn(source, object) {
    return copyObject(source, getSymbolsIn(source), object)
  }

  /**
   * Creates an array of own and inherited enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeysIn(object) {
    return baseGetAllKeys(object, keysIn$1, getSymbolsIn)
  }

  /** Used for built-in method references. */
  var objectProto$e = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$d = objectProto$e.hasOwnProperty

  /**
   * Initializes an array clone.
   *
   * @private
   * @param {Array} array The array to clone.
   * @returns {Array} Returns the initialized clone.
   */
  function initCloneArray(array) {
    var length = array.length,
      result = new array.constructor(length)

    // Add properties assigned by `RegExp#exec`.
    if (
      length &&
      typeof array[0] == 'string' &&
      hasOwnProperty$d.call(array, 'index')
    ) {
      result.index = array.index
      result.input = array.input
    }
    return result
  }

  /**
   * Creates a clone of `arrayBuffer`.
   *
   * @private
   * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
   * @returns {ArrayBuffer} Returns the cloned array buffer.
   */
  function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength)
    new Uint8Array$3(result).set(new Uint8Array$3(arrayBuffer))
    return result
  }

  /**
   * Creates a clone of `dataView`.
   *
   * @private
   * @param {Object} dataView The data view to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned data view.
   */
  function cloneDataView(dataView, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer
    return new dataView.constructor(
      buffer,
      dataView.byteOffset,
      dataView.byteLength
    )
  }

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/

  /**
   * Creates a clone of `regexp`.
   *
   * @private
   * @param {Object} regexp The regexp to clone.
   * @returns {Object} Returns the cloned regexp.
   */
  function cloneRegExp(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags.exec(regexp))
    result.lastIndex = regexp.lastIndex
    return result
  }

  /** Used to convert symbols to primitives and strings. */
  var symbolProto$2 = Symbol$2 ? Symbol$2.prototype : undefined,
    symbolValueOf$1 = symbolProto$2 ? symbolProto$2.valueOf : undefined

  /**
   * Creates a clone of the `symbol` object.
   *
   * @private
   * @param {Object} symbol The symbol object to clone.
   * @returns {Object} Returns the cloned symbol object.
   */
  function cloneSymbol(symbol) {
    return symbolValueOf$1 ? Object(symbolValueOf$1.call(symbol)) : {}
  }

  /**
   * Creates a clone of `typedArray`.
   *
   * @private
   * @param {Object} typedArray The typed array to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned typed array.
   */
  function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep
      ? cloneArrayBuffer(typedArray.buffer)
      : typedArray.buffer
    return new typedArray.constructor(
      buffer,
      typedArray.byteOffset,
      typedArray.length
    )
  }

  /** `Object#toString` result references. */
  var boolTag$2 = '[object Boolean]',
    dateTag$2 = '[object Date]',
    mapTag$3 = '[object Map]',
    numberTag$2 = '[object Number]',
    regexpTag$2 = '[object RegExp]',
    setTag$3 = '[object Set]',
    stringTag$2 = '[object String]',
    symbolTag$2 = '[object Symbol]'

  var arrayBufferTag$2 = '[object ArrayBuffer]',
    dataViewTag$3 = '[object DataView]',
    float32Tag$1 = '[object Float32Array]',
    float64Tag$1 = '[object Float64Array]',
    int8Tag$1 = '[object Int8Array]',
    int16Tag$1 = '[object Int16Array]',
    int32Tag$1 = '[object Int32Array]',
    uint8Tag$1 = '[object Uint8Array]',
    uint8ClampedTag$1 = '[object Uint8ClampedArray]',
    uint16Tag$1 = '[object Uint16Array]',
    uint32Tag$1 = '[object Uint32Array]'

  /**
   * Initializes an object clone based on its `toStringTag`.
   *
   * **Note:** This function only supports cloning values with tags of
   * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
   *
   * @private
   * @param {Object} object The object to clone.
   * @param {string} tag The `toStringTag` of the object to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneByTag(object, tag, isDeep) {
    var Ctor = object.constructor
    switch (tag) {
      case arrayBufferTag$2:
        return cloneArrayBuffer(object)

      case boolTag$2:
      case dateTag$2:
        return new Ctor(+object)

      case dataViewTag$3:
        return cloneDataView(object, isDeep)

      case float32Tag$1:
      case float64Tag$1:
      case int8Tag$1:
      case int16Tag$1:
      case int32Tag$1:
      case uint8Tag$1:
      case uint8ClampedTag$1:
      case uint16Tag$1:
      case uint32Tag$1:
        return cloneTypedArray(object, isDeep)

      case mapTag$3:
        return new Ctor()

      case numberTag$2:
      case stringTag$2:
        return new Ctor(object)

      case regexpTag$2:
        return cloneRegExp(object)

      case setTag$3:
        return new Ctor()

      case symbolTag$2:
        return cloneSymbol(object)
    }
  }

  /** Built-in value references. */
  var objectCreate$1 = Object.create

  /**
   * The base implementation of `_.create` without support for assigning
   * properties to the created object.
   *
   * @private
   * @param {Object} proto The object to inherit from.
   * @returns {Object} Returns the new object.
   */
  var baseCreate = (function() {
    function object() {}
    return function(proto) {
      if (!isObject$1(proto)) {
        return {}
      }
      if (objectCreate$1) {
        return objectCreate$1(proto)
      }
      object.prototype = proto
      var result = new object()
      object.prototype = undefined
      return result
    }
  })()

  /**
   * Initializes an object clone.
   *
   * @private
   * @param {Object} object The object to clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneObject(object) {
    return typeof object.constructor == 'function' && !isPrototype(object)
      ? baseCreate(getPrototype(object))
      : {}
  }

  /** `Object#toString` result references. */
  var mapTag$4 = '[object Map]'

  /**
   * The base implementation of `_.isMap` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a map, else `false`.
   */
  function baseIsMap(value) {
    return isObjectLike(value) && getTag$1(value) == mapTag$4
  }

  /* Node.js helper references. */
  var nodeIsMap = nodeUtil && nodeUtil.isMap

  /**
   * Checks if `value` is classified as a `Map` object.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a map, else `false`.
   * @example
   *
   * _.isMap(new Map);
   * // => true
   *
   * _.isMap(new WeakMap);
   * // => false
   */
  var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap

  /** `Object#toString` result references. */
  var setTag$4 = '[object Set]'

  /**
   * The base implementation of `_.isSet` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a set, else `false`.
   */
  function baseIsSet(value) {
    return isObjectLike(value) && getTag$1(value) == setTag$4
  }

  /* Node.js helper references. */
  var nodeIsSet = nodeUtil && nodeUtil.isSet

  /**
   * Checks if `value` is classified as a `Set` object.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a set, else `false`.
   * @example
   *
   * _.isSet(new Set);
   * // => true
   *
   * _.isSet(new WeakSet);
   * // => false
   */
  var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4

  /** `Object#toString` result references. */
  var argsTag$3 = '[object Arguments]',
    arrayTag$2 = '[object Array]',
    boolTag$3 = '[object Boolean]',
    dateTag$3 = '[object Date]',
    errorTag$2 = '[object Error]',
    funcTag$2 = '[object Function]',
    genTag$1 = '[object GeneratorFunction]',
    mapTag$5 = '[object Map]',
    numberTag$3 = '[object Number]',
    objectTag$3 = '[object Object]',
    regexpTag$3 = '[object RegExp]',
    setTag$5 = '[object Set]',
    stringTag$3 = '[object String]',
    symbolTag$3 = '[object Symbol]',
    weakMapTag$2 = '[object WeakMap]'

  var arrayBufferTag$3 = '[object ArrayBuffer]',
    dataViewTag$4 = '[object DataView]',
    float32Tag$2 = '[object Float32Array]',
    float64Tag$2 = '[object Float64Array]',
    int8Tag$2 = '[object Int8Array]',
    int16Tag$2 = '[object Int16Array]',
    int32Tag$2 = '[object Int32Array]',
    uint8Tag$2 = '[object Uint8Array]',
    uint8ClampedTag$2 = '[object Uint8ClampedArray]',
    uint16Tag$2 = '[object Uint16Array]',
    uint32Tag$2 = '[object Uint32Array]'

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {}
  cloneableTags[argsTag$3] = cloneableTags[arrayTag$2] = cloneableTags[
    arrayBufferTag$3
  ] = cloneableTags[dataViewTag$4] = cloneableTags[boolTag$3] = cloneableTags[
    dateTag$3
  ] = cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] = cloneableTags[
    int8Tag$2
  ] = cloneableTags[int16Tag$2] = cloneableTags[int32Tag$2] = cloneableTags[
    mapTag$5
  ] = cloneableTags[numberTag$3] = cloneableTags[objectTag$3] = cloneableTags[
    regexpTag$3
  ] = cloneableTags[setTag$5] = cloneableTags[stringTag$3] = cloneableTags[
    symbolTag$3
  ] = cloneableTags[uint8Tag$2] = cloneableTags[
    uint8ClampedTag$2
  ] = cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true
  cloneableTags[errorTag$2] = cloneableTags[funcTag$2] = cloneableTags[
    weakMapTag$2
  ] = false

  /**
   * The base implementation of `_.clone` and `_.cloneDeep` which tracks
   * traversed objects.
   *
   * @private
   * @param {*} value The value to clone.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Deep clone
   *  2 - Flatten inherited properties
   *  4 - Clone symbols
   * @param {Function} [customizer] The function to customize cloning.
   * @param {string} [key] The key of `value`.
   * @param {Object} [object] The parent object of `value`.
   * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
   * @returns {*} Returns the cloned value.
   */
  function baseClone(value, bitmask, customizer, key, object, stack) {
    var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG

    if (customizer) {
      result = object
        ? customizer(value, key, object, stack)
        : customizer(value)
    }
    if (result !== undefined) {
      return result
    }
    if (!isObject$1(value)) {
      return value
    }
    var isArr = isArray$1(value)
    if (isArr) {
      result = initCloneArray(value)
      if (!isDeep) {
        return copyArray(value, result)
      }
    } else {
      var tag = getTag$1(value),
        isFunc = tag == funcTag$2 || tag == genTag$1

      if (isBuffer(value)) {
        return cloneBuffer(value, isDeep)
      }
      if (tag == objectTag$3 || tag == argsTag$3 || (isFunc && !object)) {
        result = isFlat || isFunc ? {} : initCloneObject(value)
        if (!isDeep) {
          return isFlat
            ? copySymbolsIn(value, baseAssignIn(result, value))
            : copySymbols(value, baseAssign(result, value))
        }
      } else {
        if (!cloneableTags[tag]) {
          return object ? value : {}
        }
        result = initCloneByTag(value, tag, isDeep)
      }
    }
    // Check for circular references and return its corresponding clone.
    stack || (stack = new Stack())
    var stacked = stack.get(value)
    if (stacked) {
      return stacked
    }
    stack.set(value, result)

    if (isSet(value)) {
      value.forEach(function(subValue) {
        result.add(
          baseClone(subValue, bitmask, customizer, subValue, value, stack)
        )
      })

      return result
    }

    if (isMap(value)) {
      value.forEach(function(subValue, key) {
        result.set(
          key,
          baseClone(subValue, bitmask, customizer, key, value, stack)
        )
      })

      return result
    }

    var keysFunc = isFull
      ? isFlat
        ? getAllKeysIn
        : getAllKeys
      : isFlat
      ? keysIn
      : keys$4

    var props = isArr ? undefined : keysFunc(value)
    arrayEach(props || value, function(subValue, key) {
      if (props) {
        key = subValue
        subValue = value[key]
      }
      // Recursively populate clone (susceptible to call stack limits).
      assignValue(
        result,
        key,
        baseClone(subValue, bitmask, customizer, key, value, stack)
      )
    })
    return result
  }

  /**
   * Gets the last element of `array`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to query.
   * @returns {*} Returns the last element of `array`.
   * @example
   *
   * _.last([1, 2, 3]);
   * // => 3
   */
  function last$2(array) {
    var length = array == null ? 0 : array.length
    return length ? array[length - 1] : undefined
  }

  /**
   * Gets the parent value at `path` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} path The path to get the parent value of.
   * @returns {*} Returns the parent value.
   */
  function parent(object, path) {
    return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1))
  }

  /**
   * The base implementation of `_.unset`.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {Array|string} path The property path to unset.
   * @returns {boolean} Returns `true` if the property is deleted, else `false`.
   */
  function baseUnset(object, path) {
    path = castPath(path, object)
    object = parent(object, path)
    return object == null || delete object[toKey(last$2(path))]
  }

  /** `Object#toString` result references. */
  var objectTag$4 = '[object Object]'

  /** Used for built-in method references. */
  var funcProto$2 = Function.prototype,
    objectProto$f = Object.prototype

  /** Used to resolve the decompiled source of functions. */
  var funcToString$2 = funcProto$2.toString

  /** Used to check objects for own properties. */
  var hasOwnProperty$e = objectProto$f.hasOwnProperty

  /** Used to infer the `Object` constructor. */
  var objectCtorString = funcToString$2.call(Object)

  /**
   * Checks if `value` is a plain object, that is, an object created by the
   * `Object` constructor or one with a `[[Prototype]]` of `null`.
   *
   * @static
   * @memberOf _
   * @since 0.8.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   * }
   *
   * _.isPlainObject(new Foo);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   *
   * _.isPlainObject(Object.create(null));
   * // => true
   */
  function isPlainObject(value) {
    if (!isObjectLike(value) || baseGetTag(value) != objectTag$4) {
      return false
    }
    var proto = getPrototype(value)
    if (proto === null) {
      return true
    }
    var Ctor = hasOwnProperty$e.call(proto, 'constructor') && proto.constructor
    return (
      typeof Ctor == 'function' &&
      Ctor instanceof Ctor &&
      funcToString$2.call(Ctor) == objectCtorString
    )
  }

  /**
   * Used by `_.omit` to customize its `_.cloneDeep` use to only clone plain
   * objects.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {string} key The key of the property to inspect.
   * @returns {*} Returns the uncloned value or `undefined` to defer cloning to `_.cloneDeep`.
   */
  function customOmitClone(value) {
    return isPlainObject(value) ? undefined : value
  }

  /**
   * Flattens `array` a single level deep.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to flatten.
   * @returns {Array} Returns the new flattened array.
   * @example
   *
   * _.flatten([1, [2, [3, [4]], 5]]);
   * // => [1, 2, [3, [4]], 5]
   */
  function flatten(array) {
    var length = array == null ? 0 : array.length
    return length ? baseFlatten(array, 1) : []
  }

  /**
   * A specialized version of `baseRest` which flattens the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @returns {Function} Returns the new function.
   */
  function flatRest(func) {
    return setToString(overRest(func, undefined, flatten), func + '')
  }

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG$1 = 1,
    CLONE_FLAT_FLAG$1 = 2,
    CLONE_SYMBOLS_FLAG$1 = 4

  /**
   * The opposite of `_.pick`; this method creates an object composed of the
   * own and inherited enumerable property paths of `object` that are not omitted.
   *
   * **Note:** This method is considerably slower than `_.pick`.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The source object.
   * @param {...(string|string[])} [paths] The property paths to omit.
   * @returns {Object} Returns the new object.
   * @example
   *
   * var object = { 'a': 1, 'b': '2', 'c': 3 };
   *
   * _.omit(object, ['a', 'c']);
   * // => { 'b': '2' }
   */
  var omit = flatRest(function(object, paths) {
    var result = {}
    if (object == null) {
      return result
    }
    var isDeep = false
    paths = arrayMap(paths, function(path) {
      path = castPath(path, object)
      isDeep || (isDeep = path.length > 1)
      return path
    })
    copyObject(object, getAllKeysIn(object), result)
    if (isDeep) {
      result = baseClone(
        result,
        CLONE_DEEP_FLAG$1 | CLONE_FLAT_FLAG$1 | CLONE_SYMBOLS_FLAG$1,
        customOmitClone
      )
    }
    var length = paths.length
    while (length--) {
      baseUnset(result, paths[length])
    }
    return result
  })

  /** Used for built-in method references. */
  var objectProto$g = Object.prototype

  /** Used to check objects for own properties. */
  var hasOwnProperty$f = objectProto$g.hasOwnProperty

  /**
   * Assigns own and inherited enumerable string keyed properties of source
   * objects to the destination object for all destination properties that
   * resolve to `undefined`. Source objects are applied from left to right.
   * Once a property is set, additional values of the same property are ignored.
   *
   * **Note:** This method mutates `object`.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The destination object.
   * @param {...Object} [sources] The source objects.
   * @returns {Object} Returns `object`.
   * @see _.defaultsDeep
   * @example
   *
   * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
   * // => { 'a': 1, 'b': 2 }
   */
  var defaults = baseRest(function(object, sources) {
    object = Object(object)

    var index = -1
    var length = sources.length
    var guard = length > 2 ? sources[2] : undefined

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      length = 1
    }

    while (++index < length) {
      var source = sources[index]
      var props = keysIn$1(source)
      var propsIndex = -1
      var propsLength = props.length

      while (++propsIndex < propsLength) {
        var key = props[propsIndex]
        var value = object[key]

        if (
          value === undefined ||
          (eq$1(value, objectProto$g[key]) &&
            !hasOwnProperty$f.call(object, key))
        ) {
          object[key] = source[key]
        }
      }
    }

    return object
  })

  /**
   * An alternative to `_.reduce`; this method transforms `object` to a new
   * `accumulator` object which is the result of running each of its own
   * enumerable string keyed properties thru `iteratee`, with each invocation
   * potentially mutating the `accumulator` object. If `accumulator` is not
   * provided, a new object with the same `[[Prototype]]` will be used. The
   * iteratee is invoked with four arguments: (accumulator, value, key, object).
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @static
   * @memberOf _
   * @since 1.3.0
   * @category Object
   * @param {Object} object The object to iterate over.
   * @param {Function} [iteratee=_.identity] The function invoked per iteration.
   * @param {*} [accumulator] The custom accumulator value.
   * @returns {*} Returns the accumulated value.
   * @example
   *
   * _.transform([2, 3, 4], function(result, n) {
   *   result.push(n *= n);
   *   return n % 2 == 0;
   * }, []);
   * // => [4, 9]
   *
   * _.transform({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
   *   (result[value] || (result[value] = [])).push(key);
   * }, {});
   * // => { '1': ['a', 'c'], '2': ['b'] }
   */
  function transform(object, iteratee, accumulator) {
    var isArr = isArray$1(object),
      isArrLike = isArr || isBuffer(object) || isTypedArray$1(object)

    iteratee = baseIteratee(iteratee, 4)
    if (accumulator == null) {
      var Ctor = object && object.constructor
      if (isArrLike) {
        accumulator = isArr ? new Ctor() : []
      } else if (isObject$1(object)) {
        accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {}
      } else {
        accumulator = {}
      }
    }
    ;(isArrLike
      ? arrayEach
      : baseForOwn)(object, function(value, index, object) {
      return iteratee(accumulator, value, index, object)
    })
    return accumulator
  }

  /**
   * Creates an object with the same keys as `object` and values generated
   * by running each own enumerable string keyed property of `object` thru
   * `iteratee`. The iteratee is invoked with three arguments:
   * (value, key, object).
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Object
   * @param {Object} object The object to iterate over.
   * @param {Function} [iteratee=_.identity] The function invoked per iteration.
   * @returns {Object} Returns the new mapped object.
   * @see _.mapKeys
   * @example
   *
   * var users = {
   *   'fred':    { 'user': 'fred',    'age': 40 },
   *   'pebbles': { 'user': 'pebbles', 'age': 1 }
   * };
   *
   * _.mapValues(users, function(o) { return o.age; });
   * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
   *
   * // The `_.property` iteratee shorthand.
   * _.mapValues(users, 'age');
   * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
   */
  function mapValues(object, iteratee) {
    var result = {}
    iteratee = baseIteratee(iteratee, 3)

    baseForOwn(object, function(value, key, object) {
      baseAssignValue(result, key, iteratee(value, key, object))
    })
    return result
  }

  /**
   * Retrieve via an accessor-like property
   *
   *    accessor(obj, 'name')   // => retrieves obj['name']
   *    accessor(data, func)    // => retrieves func(data)
   *    ... otherwise null
   */
  function accessor$1(data, field) {
    var value = null
    if (typeof field === 'function') value = field(data)
    else if (
      typeof field === 'string' &&
      typeof data === 'object' &&
      data != null &&
      field in data
    )
      value = data[field]
    return value
  }
  var wrapAccessor = function wrapAccessor(acc) {
    return function(data) {
      return accessor$1(data, acc)
    }
  }

  function viewNames$1(_views) {
    return !Array.isArray(_views) ? Object.keys(_views) : _views
  }

  function isValidView(view, _ref) {
    var _views = _ref.views
    var names = viewNames$1(_views)
    return names.indexOf(view) !== -1
  }
  /**
   * react-big-calendar is a full featured Calendar component for managing events and dates. It uses
   * modern `flexbox` for layout, making it super responsive and performant. Leaving most of the layout heavy lifting
   * to the browser. __note:__ The default styles use `height: 100%` which means your container must set an explicit
   * height (feel free to adjust the styles to suit your specific needs).
   *
   * Big Calendar is unopiniated about editing and moving events, preferring to let you implement it in a way that makes
   * the most sense to your app. It also tries not to be prescriptive about your event data structures, just tell it
   * how to find the start and end datetimes and you can pass it whatever you want.
   *
   * One thing to note is that, `react-big-calendar` treats event start/end dates as an _exclusive_ range.
   * which means that the event spans up to, but not including, the end date. In the case
   * of displaying events on whole days, end dates are rounded _up_ to the next day. So an
   * event ending on `Apr 8th 12:00:00 am` will not appear on the 8th, whereas one ending
   * on `Apr 8th 12:01:00 am` will. If you want _inclusive_ ranges consider providing a
   * function `endAccessor` that returns the end date + 1 day for those events that end at midnight.
   */

  var Calendar =
    /*#__PURE__*/
    (function(_React$Component) {
      _inheritsLoose(Calendar, _React$Component)

      function Calendar() {
        var _this

        for (
          var _len = arguments.length, _args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          _args[_key] = arguments[_key]
        }

        _this =
          _React$Component.call.apply(_React$Component, [this].concat(_args)) ||
          this

        _this.getViews = function() {
          var views = _this.props.views

          if (Array.isArray(views)) {
            return transform(
              views,
              function(obj, name) {
                return (obj[name] = VIEWS[name])
              },
              {}
            )
          }

          if (typeof views === 'object') {
            return mapValues(views, function(value, key) {
              if (value === true) {
                return VIEWS[key]
              }

              return value
            })
          }

          return VIEWS
        }

        _this.getView = function() {
          var views = _this.getViews()

          return views[_this.props.view]
        }

        _this.getDrilldownView = function(date) {
          var _this$props = _this.props,
            view = _this$props.view,
            drilldownView = _this$props.drilldownView,
            getDrilldownView = _this$props.getDrilldownView
          if (!getDrilldownView) return drilldownView
          return getDrilldownView(date, view, Object.keys(_this.getViews()))
        }

        _this.handleRangeChange = function(date, viewComponent, view) {
          var _this$props2 = _this.props,
            onRangeChange = _this$props2.onRangeChange,
            localizer = _this$props2.localizer

          if (onRangeChange) {
            if (viewComponent.range) {
              onRangeChange(
                viewComponent.range(date, {
                  localizer: localizer,
                }),
                view
              )
            } else {
              {
                console.error('onRangeChange prop not supported for this view')
              }
            }
          }
        }

        _this.handleNavigate = function(action, newDate) {
          var _this$props3 = _this.props,
            view = _this$props3.view,
            date = _this$props3.date,
            getNow = _this$props3.getNow,
            onNavigate = _this$props3.onNavigate,
            props = _objectWithoutPropertiesLoose(_this$props3, [
              'view',
              'date',
              'getNow',
              'onNavigate',
            ])

          var ViewComponent = _this.getView()

          var today = getNow()
          date = moveDate(
            ViewComponent,
            _extends({}, props, {
              action: action,
              date: newDate || date || today,
              today: today,
            })
          )
          onNavigate(date, view, action)

          _this.handleRangeChange(date, ViewComponent)
        }

        _this.handleViewChange = function(view) {
          if (view !== _this.props.view && isValidView(view, _this.props)) {
            _this.props.onView(view)
          }

          var views = _this.getViews()

          _this.handleRangeChange(
            _this.props.date || _this.props.getNow(),
            views[view],
            view
          )
        }

        _this.handleSelectEvent = function() {
          for (
            var _len2 = arguments.length, args = new Array(_len2), _key2 = 0;
            _key2 < _len2;
            _key2++
          ) {
            args[_key2] = arguments[_key2]
          }

          notify$2(_this.props.onSelectEvent, args)
        }

        _this.handleDoubleClickEvent = function() {
          for (
            var _len3 = arguments.length, args = new Array(_len3), _key3 = 0;
            _key3 < _len3;
            _key3++
          ) {
            args[_key3] = arguments[_key3]
          }

          notify$2(_this.props.onDoubleClickEvent, args)
        }

        _this.handleSelectSlot = function(slotInfo) {
          notify$2(_this.props.onSelectSlot, slotInfo)
        }

        _this.handleDrillDown = function(date, view) {
          var onDrillDown = _this.props.onDrillDown

          if (onDrillDown) {
            onDrillDown(date, view, _this.drilldownView)
            return
          }

          if (view) _this.handleViewChange(view)

          _this.handleNavigate(navigate.DATE, date)
        }

        _this.state = {
          context: _this.getContext(_this.props),
        }
        return _this
      }

      var _proto = Calendar.prototype

      _proto.UNSAFE_componentWillReceiveProps = function UNSAFE_componentWillReceiveProps(
        nextProps
      ) {
        this.setState({
          context: this.getContext(nextProps),
        })
      }

      _proto.getContext = function getContext(_ref2) {
        var startAccessor = _ref2.startAccessor,
          endAccessor = _ref2.endAccessor,
          allDayAccessor = _ref2.allDayAccessor,
          tooltipAccessor = _ref2.tooltipAccessor,
          titleAccessor = _ref2.titleAccessor,
          resourceAccessor = _ref2.resourceAccessor,
          resourceIdAccessor = _ref2.resourceIdAccessor,
          resourceTitleAccessor = _ref2.resourceTitleAccessor,
          eventPropGetter = _ref2.eventPropGetter,
          slotPropGetter = _ref2.slotPropGetter,
          slotGroupPropGetter = _ref2.slotGroupPropGetter,
          dayPropGetter = _ref2.dayPropGetter,
          view = _ref2.view,
          views = _ref2.views,
          localizer = _ref2.localizer,
          culture = _ref2.culture,
          _ref2$messages = _ref2.messages,
          messages$1 = _ref2$messages === void 0 ? {} : _ref2$messages,
          _ref2$components = _ref2.components,
          components = _ref2$components === void 0 ? {} : _ref2$components,
          _ref2$formats = _ref2.formats,
          formats = _ref2$formats === void 0 ? {} : _ref2$formats
        var names = viewNames$1(views)
        var msgs = messages(messages$1)
        return {
          viewNames: names,
          localizer: mergeWithDefaults(localizer, culture, formats, msgs),
          getters: {
            eventProp: function eventProp() {
              return (
                (eventPropGetter && eventPropGetter.apply(void 0, arguments)) ||
                {}
              )
            },
            slotProp: function slotProp() {
              return (
                (slotPropGetter && slotPropGetter.apply(void 0, arguments)) ||
                {}
              )
            },
            slotGroupProp: function slotGroupProp() {
              return (
                (slotGroupPropGetter &&
                  slotGroupPropGetter.apply(void 0, arguments)) ||
                {}
              )
            },
            dayProp: function dayProp() {
              return (
                (dayPropGetter && dayPropGetter.apply(void 0, arguments)) || {}
              )
            },
          },
          components: defaults(
            components[view] || {},
            omit(components, names),
            {
              eventWrapper: NoopWrapper,
              eventContainerWrapper: NoopWrapper,
              dateCellWrapper: NoopWrapper,
              weekWrapper: NoopWrapper,
              timeSlotWrapper: NoopWrapper,
            }
          ),
          accessors: {
            start: wrapAccessor(startAccessor),
            end: wrapAccessor(endAccessor),
            allDay: wrapAccessor(allDayAccessor),
            tooltip: wrapAccessor(tooltipAccessor),
            title: wrapAccessor(titleAccessor),
            resource: wrapAccessor(resourceAccessor),
            resourceId: wrapAccessor(resourceIdAccessor),
            resourceTitle: wrapAccessor(resourceTitleAccessor),
          },
        }
      }

      _proto.render = function render() {
        var _this$props4 = this.props,
          view = _this$props4.view,
          toolbar = _this$props4.toolbar,
          events = _this$props4.events,
          style = _this$props4.style,
          className = _this$props4.className,
          elementProps = _this$props4.elementProps,
          current = _this$props4.date,
          getNow = _this$props4.getNow,
          length = _this$props4.length,
          showMultiDayTimes = _this$props4.showMultiDayTimes,
          onShowMore = _this$props4.onShowMore,
          _0 = _this$props4.components,
          _1 = _this$props4.formats,
          _2 = _this$props4.messages,
          _3 = _this$props4.culture,
          props = _objectWithoutPropertiesLoose(_this$props4, [
            'view',
            'toolbar',
            'events',
            'style',
            'className',
            'elementProps',
            'date',
            'getNow',
            'length',
            'showMultiDayTimes',
            'onShowMore',
            'components',
            'formats',
            'messages',
            'culture',
          ])

        current = current || getNow()
        var View = this.getView()
        var _this$state$context = this.state.context,
          accessors = _this$state$context.accessors,
          components = _this$state$context.components,
          getters = _this$state$context.getters,
          localizer = _this$state$context.localizer,
          viewNames = _this$state$context.viewNames
        var CalToolbar = components.toolbar || Toolbar
        var label = View.title(current, {
          localizer: localizer,
          length: length,
        })
        return React__default.createElement(
          'div',
          _extends({}, elementProps, {
            className: clsx(className, 'rbc-calendar', props.rtl && 'rbc-rtl'),
            style: style,
          }),
          toolbar &&
            React__default.createElement(CalToolbar, {
              date: current,
              view: view,
              views: viewNames,
              label: label,
              onView: this.handleViewChange,
              onNavigate: this.handleNavigate,
              localizer: localizer,
            }),
          React__default.createElement(
            View,
            _extends({}, props, {
              events: events,
              date: current,
              getNow: getNow,
              length: length,
              localizer: localizer,
              getters: getters,
              components: components,
              accessors: accessors,
              showMultiDayTimes: showMultiDayTimes,
              getDrilldownView: this.getDrilldownView,
              onNavigate: this.handleNavigate,
              onDrillDown: this.handleDrillDown,
              onSelectEvent: this.handleSelectEvent,
              onDoubleClickEvent: this.handleDoubleClickEvent,
              onSelectSlot: this.handleSelectSlot,
              onShowMore: onShowMore,
            })
          )
        )
      }
      /**
       *
       * @param date
       * @param viewComponent
       * @param {'month'|'week'|'work_week'|'day'|'agenda'} [view] - optional
       * parameter. It appears when range change on view changing. It could be handy
       * when you need to have both: range and view type at once, i.e. for manage rbc
       * state via url
       */

      return Calendar
    })(React__default.Component)

  Calendar.defaultProps = {
    elementProps: {},
    popup: false,
    toolbar: true,
    view: views.MONTH,
    views: [views.MONTH, views.WEEK, views.DAY, views.AGENDA],
    step: 30,
    length: 30,
    drilldownView: views.DAY,
    titleAccessor: 'title',
    tooltipAccessor: 'title',
    allDayAccessor: 'allDay',
    startAccessor: 'start',
    endAccessor: 'end',
    resourceAccessor: 'resourceId',
    resourceIdAccessor: 'id',
    resourceTitleAccessor: 'title',
    longPressThreshold: 250,
    getNow: function getNow() {
      return new Date()
    },
    dayLayoutAlgorithm: 'overlap',
  }
  Calendar.propTypes = {
    localizer: propTypes.object.isRequired,

    /**
     * Props passed to main calendar `<div>`.
     *
     */
    elementProps: propTypes.object,

    /**
     * The current date value of the calendar. Determines the visible view range.
     * If `date` is omitted then the result of `getNow` is used; otherwise the
     * current date is used.
     *
     * @controllable onNavigate
     */
    date: propTypes.instanceOf(Date),

    /**
     * The current view of the calendar.
     *
     * @default 'month'
     * @controllable onView
     */
    view: propTypes.string,

    /**
     * The initial view set for the Calendar.
     * @type Calendar.Views ('month'|'week'|'work_week'|'day'|'agenda')
     * @default 'month'
     */
    defaultView: propTypes.string,

    /**
     * An array of event objects to display on the calendar. Events objects
     * can be any shape, as long as the Calendar knows how to retrieve the
     * following details of the event:
     *
     *  - start time
     *  - end time
     *  - title
     *  - whether its an "all day" event or not
     *  - any resource the event may be related to
     *
     * Each of these properties can be customized or generated dynamically by
     * setting the various "accessor" props. Without any configuration the default
     * event should look like:
     *
     * ```js
     * Event {
     *   title: string,
     *   start: Date,
     *   end: Date,
     *   allDay?: boolean
     *   resource?: any,
     * }
     * ```
     */
    events: propTypes.arrayOf(propTypes.object),

    /**
     * Accessor for the event title, used to display event information. Should
     * resolve to a `renderable` value.
     *
     * ```js
     * string | (event: Object) => string
     * ```
     *
     * @type {(func|string)}
     */
    titleAccessor: accessor,

    /**
     * Accessor for the event tooltip. Should
     * resolve to a `renderable` value. Removes the tooltip if null.
     *
     * ```js
     * string | (event: Object) => string
     * ```
     *
     * @type {(func|string)}
     */
    tooltipAccessor: accessor,

    /**
     * Determines whether the event should be considered an "all day" event and ignore time.
     * Must resolve to a `boolean` value.
     *
     * ```js
     * string | (event: Object) => boolean
     * ```
     *
     * @type {(func|string)}
     */
    allDayAccessor: accessor,

    /**
     * The start date/time of the event. Must resolve to a JavaScript `Date` object.
     *
     * ```js
     * string | (event: Object) => Date
     * ```
     *
     * @type {(func|string)}
     */
    startAccessor: accessor,

    /**
     * The end date/time of the event. Must resolve to a JavaScript `Date` object.
     *
     * ```js
     * string | (event: Object) => Date
     * ```
     *
     * @type {(func|string)}
     */
    endAccessor: accessor,

    /**
     * Returns the id of the `resource` that the event is a member of. This
     * id should match at least one resource in the `resources` array.
     *
     * ```js
     * string | (event: Object) => Date
     * ```
     *
     * @type {(func|string)}
     */
    resourceAccessor: accessor,

    /**
     * An array of resource objects that map events to a specific resource.
     * Resource objects, like events, can be any shape or have any properties,
     * but should be uniquly identifiable via the `resourceIdAccessor`, as
     * well as a "title" or name as provided by the `resourceTitleAccessor` prop.
     */
    resources: propTypes.arrayOf(propTypes.object),

    /**
     * Provides a unique identifier for each resource in the `resources` array
     *
     * ```js
     * string | (resource: Object) => any
     * ```
     *
     * @type {(func|string)}
     */
    resourceIdAccessor: accessor,

    /**
     * Provides a human readable name for the resource object, used in headers.
     *
     * ```js
     * string | (resource: Object) => any
     * ```
     *
     * @type {(func|string)}
     */
    resourceTitleAccessor: accessor,

    /**
     * Determines the current date/time which is highlighted in the views.
     *
     * The value affects which day is shaded and which time is shown as
     * the current time. It also affects the date used by the Today button in
     * the toolbar.
     *
     * Providing a value here can be useful when you are implementing time zones
     * using the `startAccessor` and `endAccessor` properties.
     *
     * @type {func}
     * @default () => new Date()
     */
    getNow: propTypes.func,

    /**
     * Callback fired when the `date` value changes.
     *
     * @controllable date
     */
    onNavigate: propTypes.func,

    /**
     * Callback fired when the `view` value changes.
     *
     * @controllable view
     */
    onView: propTypes.func,

    /**
     * Callback fired when date header, or the truncated events links are clicked
     *
     */
    onDrillDown: propTypes.func,

    /**
     *
     * ```js
     * (dates: Date[] | { start: Date; end: Date }, view?: 'month'|'week'|'work_week'|'day'|'agenda') => void
     * ```
     *
     * Callback fired when the visible date range changes. Returns an Array of dates
     * or an object with start and end dates for BUILTIN views. Optionally new `view`
     * will be returned when callback called after view change.
     *
     * Custom views may return something different.
     */
    onRangeChange: propTypes.func,

    /**
     * A callback fired when a date selection is made. Only fires when `selectable` is `true`.
     *
     * ```js
     * (
     *   slotInfo: {
     *     start: Date,
     *     end: Date,
     *     resourceId:  (number|string),
     *     slots: Array<Date>,
     *     action: "select" | "click" | "doubleClick",
     *     bounds: ?{ // For "select" action
     *       x: number,
     *       y: number,
     *       top: number,
     *       right: number,
     *       left: number,
     *       bottom: number,
     *     },
     *     box: ?{ // For "click" or "doubleClick" actions
     *       clientX: number,
     *       clientY: number,
     *       x: number,
     *       y: number,
     *     },
     *   }
     * ) => any
     * ```
     */
    onSelectSlot: propTypes.func,

    /**
     * Callback fired when a calendar event is selected.
     *
     * ```js
     * (event: Object, e: SyntheticEvent) => any
     * ```
     *
     * @controllable selected
     */
    onSelectEvent: propTypes.func,

    /**
     * Callback fired when a calendar event is clicked twice.
     *
     * ```js
     * (event: Object, e: SyntheticEvent) => void
     * ```
     */
    onDoubleClickEvent: propTypes.func,

    /**
     * Callback fired when dragging a selection in the Time views.
     *
     * Returning `false` from the handler will prevent a selection.
     *
     * ```js
     * (range: { start: Date, end: Date, resourceId: (number|string) }) => ?boolean
     * ```
     */
    onSelecting: propTypes.func,

    /**
     * Callback fired when a +{count} more is clicked
     *
     * ```js
     * (events: Object, date: Date) => any
     * ```
     */
    onShowMore: propTypes.func,

    /**
     * The selected event, if any.
     */
    selected: propTypes.object,

    /**
       * An array of built-in view names to allow the calendar to display.
       * accepts either an array of builtin view names,
       *
       * ```jsx
       * views={['month', 'day', 'agenda']}
       * ```
       * or an object hash of the view name and the component (or boolean for builtin).
       *
       * ```jsx
       * views={{
       *   month: true,
       *   week: false,
       *   myweek: WorkWeekViewComponent,
       * }}
       * ```
       *
       * Custom views can be any React component, that implements the following
       * interface:
       *
       * ```js
       * interface View {
       *   static title(date: Date, { formats: DateFormat[], culture: string?, ...props }): string
       *   static navigate(date: Date, action: 'PREV' | 'NEXT' | 'DATE'): Date
       * }
       * ```
       *
       * @type Views ('month'|'week'|'work_week'|'day'|'agenda')
       * @View
       ['month', 'week', 'day', 'agenda']
       */
    views: views$1,

    /**
     * The string name of the destination view for drill-down actions, such
     * as clicking a date header, or the truncated events links. If
     * `getDrilldownView` is also specified it will be used instead.
     *
     * Set to `null` to disable drill-down actions.
     *
     * ```js
     * <Calendar
     *   drilldownView="agenda"
     * />
     * ```
     */
    drilldownView: propTypes.string,

    /**
     * Functionally equivalent to `drilldownView`, but accepts a function
     * that can return a view name. It's useful for customizing the drill-down
     * actions depending on the target date and triggering view.
     *
     * Return `null` to disable drill-down actions.
     *
     * ```js
     * <Calendar
     *   getDrilldownView={(targetDate, currentViewName, configuredViewNames) =>
     *     if (currentViewName === 'month' && configuredViewNames.includes('week'))
     *       return 'week'
     *
     *     return null;
     *   }}
     * />
     * ```
     */
    getDrilldownView: propTypes.func,

    /**
     * Determines the end date from date prop in the agenda view
     * date prop + length (in number of days) = end date
     */
    length: propTypes.number,

    /**
     * Determines whether the toolbar is displayed
     */
    toolbar: propTypes.bool,

    /**
     * Show truncated events in an overlay when you click the "+_x_ more" link.
     */
    popup: propTypes.bool,

    /**
     * Distance in pixels, from the edges of the viewport, the "show more" overlay should be positioned.
     *
     * ```jsx
     * <Calendar popupOffset={30}/>
     * <Calendar popupOffset={{x: 30, y: 20}}/>
     * ```
     */
    popupOffset: propTypes.oneOfType([
      propTypes.number,
      propTypes.shape({
        x: propTypes.number,
        y: propTypes.number,
      }),
    ]),

    /**
     * Allows mouse selection of ranges of dates/times.
     *
     * The 'ignoreEvents' option prevents selection code from running when a
     * drag begins over an event. Useful when you want custom event click or drag
     * logic
     */
    selectable: propTypes.oneOf([true, false, 'ignoreEvents']),

    /**
     * Specifies the number of miliseconds the user must press and hold on the screen for a touch
     * to be considered a "long press." Long presses are used for time slot selection on touch
     * devices.
     *
     * @type {number}
     * @default 250
     */
    longPressThreshold: propTypes.number,

    /**
     * Determines the selectable time increments in week and day views
     */
    step: propTypes.number,

    /**
     * The number of slots per "section" in the time grid views. Adjust with `step`
     * to change the default of 1 hour long groups, with 30 minute slots.
     */
    timeslots: propTypes.number,

    /**
     *Switch the calendar to a `right-to-left` read direction.
     */
    rtl: propTypes.bool,

    /**
     * Optionally provide a function that returns an object of className or style props
     * to be applied to the the event node.
     *
     * ```js
     * (
     * 	event: Object,
     * 	start: Date,
     * 	end: Date,
     * 	isSelected: boolean
     * ) => { className?: string, style?: Object }
     * ```
     */
    eventPropGetter: propTypes.func,

    /**
     * Optionally provide a function that returns an object of className or style props
     * to be applied to the time-slot node. Caution! Styles that change layout or
     * position may break the calendar in unexpected ways.
     *
     * ```js
     * (date: Date, resourceId: (number|string)) => { className?: string, style?: Object }
     * ```
     */
    slotPropGetter: propTypes.func,

    /**
     * Optionally provide a function that returns an object of props to be applied
     * to the time-slot group node. Useful to dynamically change the sizing of time nodes.
     * ```js
     * () => { style?: Object }
     * ```
     */
    slotGroupPropGetter: propTypes.func,

    /**
     * Optionally provide a function that returns an object of className or style props
     * to be applied to the the day background. Caution! Styles that change layout or
     * position may break the calendar in unexpected ways.
     *
     * ```js
     * (date: Date) => { className?: string, style?: Object }
     * ```
     */
    dayPropGetter: propTypes.func,

    /**
     * Support to show multi-day events with specific start and end times in the
     * main time grid (rather than in the all day header).
     *
     * **Note: This may cause calendars with several events to look very busy in
     * the week and day views.**
     */
    showMultiDayTimes: propTypes.bool,

    /**
     * Constrains the minimum _time_ of the Day and Week views.
     */
    min: propTypes.instanceOf(Date),

    /**
     * Constrains the maximum _time_ of the Day and Week views.
     */
    max: propTypes.instanceOf(Date),

    /**
     * Determines how far down the scroll pane is initially scrolled down.
     */
    scrollToTime: propTypes.instanceOf(Date),

    /**
     * Specify a specific culture code for the Calendar.
     *
     * **Note: it's generally better to handle this globally via your i18n library.**
     */
    culture: propTypes.string,

    /**
     * Localizer specific formats, tell the Calendar how to format and display dates.
     *
     * `format` types are dependent on the configured localizer; both Moment and Globalize
     * accept strings of tokens according to their own specification, such as: `'DD mm yyyy'`.
     *
     * ```jsx
     * let formats = {
     *   dateFormat: 'dd',
     *
     *   dayFormat: (date, , localizer) =>
     *     localizer.format(date, 'DDD', culture),
     *
     *   dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
     *     localizer.format(start, { date: 'short' }, culture) + ' – ' +
     *     localizer.format(end, { date: 'short' }, culture)
     * }
     *
     * <Calendar formats={formats} />
     * ```
     *
     * All localizers accept a function of
     * the form `(date: Date, culture: ?string, localizer: Localizer) -> string`
     */
    formats: propTypes.shape({
      /**
       * Format for the day of the month heading in the Month view.
       * e.g. "01", "02", "03", etc
       */
      dateFormat: dateFormat,

      /**
       * A day of the week format for Week and Day headings,
       * e.g. "Wed 01/04"
       *
       */
      dayFormat: dateFormat,

      /**
       * Week day name format for the Month week day headings,
       * e.g: "Sun", "Mon", "Tue", etc
       *
       */
      weekdayFormat: dateFormat,

      /**
       * The timestamp cell formats in Week and Time views, e.g. "4:00 AM"
       */
      timeGutterFormat: dateFormat,

      /**
       * Toolbar header format for the Month view, e.g "2015 April"
       *
       */
      monthHeaderFormat: dateFormat,

      /**
       * Toolbar header format for the Week views, e.g. "Mar 29 - Apr 04"
       */
      dayRangeHeaderFormat: dateRangeFormat,

      /**
       * Toolbar header format for the Day view, e.g. "Wednesday Apr 01"
       */
      dayHeaderFormat: dateFormat,

      /**
       * Toolbar header format for the Agenda view, e.g. "4/1/2015 – 5/1/2015"
       */
      agendaHeaderFormat: dateRangeFormat,

      /**
       * A time range format for selecting time slots, e.g "8:00am – 2:00pm"
       */
      selectRangeFormat: dateRangeFormat,
      agendaDateFormat: dateFormat,
      agendaTimeFormat: dateFormat,
      agendaTimeRangeFormat: dateRangeFormat,

      /**
       * Time range displayed on events.
       */
      eventTimeRangeFormat: dateRangeFormat,

      /**
       * An optional event time range for events that continue onto another day
       */
      eventTimeRangeStartFormat: dateFormat,

      /**
       * An optional event time range for events that continue from another day
       */
      eventTimeRangeEndFormat: dateFormat,
    }),

    /**
     * Customize how different sections of the calendar render by providing custom Components.
     * In particular the `Event` component can be specified for the entire calendar, or you can
     * provide an individual component for each view type.
     *
     * ```jsx
     * let components = {
     *   event: MyEvent, // used by each view (Month, Day, Week)
     *   eventWrapper: MyEventWrapper,
     *   eventContainerWrapper: MyEventContainerWrapper,
     *   dateCellWrapper: MyDateCellWrapper,
     *   timeSlotWrapper: MyTimeSlotWrapper,
     *   timeGutterHeader: MyTimeGutterWrapper,
     *   toolbar: MyToolbar,
     *   agenda: {
     *   	 event: MyAgendaEvent // with the agenda view use a different component to render events
     *     time: MyAgendaTime,
     *     date: MyAgendaDate,
     *   },
     *   day: {
     *     header: MyDayHeader,
     *     event: MyDayEvent,
     *   },
     *   week: {
     *     header: MyWeekHeader,
     *     event: MyWeekEvent,
     *   },
     *   month: {
     *     header: MyMonthHeader,
     *     dateHeader: MyMonthDateHeader,
     *     event: MyMonthEvent,
     *   }
     * }
     * <Calendar components={components} />
     * ```
     */
    components: propTypes.shape({
      event: propTypes.elementType,
      eventWrapper: propTypes.elementType,
      eventContainerWrapper: propTypes.elementType,
      dateCellWrapper: propTypes.elementType,
      timeSlotWrapper: propTypes.elementType,
      timeGutterHeader: propTypes.elementType,
      resourceHeader: propTypes.elementType,
      toolbar: propTypes.elementType,
      agenda: propTypes.shape({
        date: propTypes.elementType,
        time: propTypes.elementType,
        event: propTypes.elementType,
      }),
      day: propTypes.shape({
        header: propTypes.elementType,
        event: propTypes.elementType,
      }),
      week: propTypes.shape({
        header: propTypes.elementType,
        event: propTypes.elementType,
      }),
      month: propTypes.shape({
        header: propTypes.elementType,
        dateHeader: propTypes.elementType,
        event: propTypes.elementType,
      }),
    }),

    /**
     * String messages used throughout the component, override to provide localizations
     */
    messages: propTypes.shape({
      allDay: propTypes.node,
      previous: propTypes.node,
      next: propTypes.node,
      today: propTypes.node,
      month: propTypes.node,
      week: propTypes.node,
      day: propTypes.node,
      agenda: propTypes.node,
      date: propTypes.node,
      time: propTypes.node,
      event: propTypes.node,
      noEventsInRange: propTypes.node,
      showMore: propTypes.func,
    }),

    /**
     * A day event layout(arrangement) algorithm.
     * `overlap` allows events to be overlapped.
     * `no-overlap` resizes events to avoid overlap.
     * or custom `Function(events, minimumStartDifference, slotMetrics, accessors)`
     */
    dayLayoutAlgorithm: DayLayoutAlgorithmPropType,
  }
  var Calendar$1 = uncontrollable(Calendar, {
    view: 'onView',
    date: 'onNavigate',
    selected: 'onSelectEvent',
  })

  var dateRangeFormat$1 = function dateRangeFormat(_ref, culture, local) {
    var start = _ref.start,
      end = _ref.end
    return (
      local.format(start, 'L', culture) +
      ' – ' +
      local.format(end, 'L', culture)
    )
  }

  var timeRangeFormat = function timeRangeFormat(_ref2, culture, local) {
    var start = _ref2.start,
      end = _ref2.end
    return (
      local.format(start, 'LT', culture) +
      ' – ' +
      local.format(end, 'LT', culture)
    )
  }

  var timeRangeStartFormat = function timeRangeStartFormat(
    _ref3,
    culture,
    local
  ) {
    var start = _ref3.start
    return local.format(start, 'LT', culture) + ' – '
  }

  var timeRangeEndFormat = function timeRangeEndFormat(_ref4, culture, local) {
    var end = _ref4.end
    return ' – ' + local.format(end, 'LT', culture)
  }

  var weekRangeFormat = function weekRangeFormat(_ref5, culture, local) {
    var start = _ref5.start,
      end = _ref5.end
    return (
      local.format(start, 'MMMM DD', culture) +
      ' – ' +
      local.format(end, eq(start, end, 'month') ? 'DD' : 'MMMM DD', culture)
    )
  }

  var formats = {
    dateFormat: 'DD',
    dayFormat: 'DD ddd',
    weekdayFormat: 'ddd',
    selectRangeFormat: timeRangeFormat,
    eventTimeRangeFormat: timeRangeFormat,
    eventTimeRangeStartFormat: timeRangeStartFormat,
    eventTimeRangeEndFormat: timeRangeEndFormat,
    timeGutterFormat: 'LT',
    monthHeaderFormat: 'MMMM YYYY',
    dayHeaderFormat: 'dddd MMM DD',
    dayRangeHeaderFormat: weekRangeFormat,
    agendaHeaderFormat: dateRangeFormat$1,
    agendaDateFormat: 'ddd MMM DD',
    agendaTimeFormat: 'LT',
    agendaTimeRangeFormat: timeRangeFormat,
  }
  function moment(moment) {
    var locale = function locale(m, c) {
      return c ? m.locale(c) : m
    }

    return new DateLocalizer({
      formats: formats,
      firstOfWeek: function firstOfWeek(culture) {
        var data = culture ? moment.localeData(culture) : moment.localeData()
        return data ? data.firstDayOfWeek() : 0
      },
      format: function format(value, _format, culture) {
        return locale(moment(value), culture).format(_format)
      },
    })
  }

  var dateRangeFormat$2 = function dateRangeFormat(_ref, culture, local) {
    var start = _ref.start,
      end = _ref.end
    return (
      local.format(start, 'd', culture) +
      ' – ' +
      local.format(end, 'd', culture)
    )
  }

  var timeRangeFormat$1 = function timeRangeFormat(_ref2, culture, local) {
    var start = _ref2.start,
      end = _ref2.end
    return (
      local.format(start, 't', culture) +
      ' – ' +
      local.format(end, 't', culture)
    )
  }

  var timeRangeStartFormat$1 = function timeRangeStartFormat(
    _ref3,
    culture,
    local
  ) {
    var start = _ref3.start
    return local.format(start, 't', culture) + ' – '
  }

  var timeRangeEndFormat$1 = function timeRangeEndFormat(
    _ref4,
    culture,
    local
  ) {
    var end = _ref4.end
    return ' – ' + local.format(end, 't', culture)
  }

  var weekRangeFormat$1 = function weekRangeFormat(_ref5, culture, local) {
    var start = _ref5.start,
      end = _ref5.end
    return (
      local.format(start, 'MMM dd', culture) +
      ' – ' +
      local.format(end, eq(start, end, 'month') ? 'dd' : 'MMM dd', culture)
    )
  }

  var formats$1 = {
    dateFormat: 'dd',
    dayFormat: 'ddd dd/MM',
    weekdayFormat: 'ddd',
    selectRangeFormat: timeRangeFormat$1,
    eventTimeRangeFormat: timeRangeFormat$1,
    eventTimeRangeStartFormat: timeRangeStartFormat$1,
    eventTimeRangeEndFormat: timeRangeEndFormat$1,
    timeGutterFormat: 't',
    monthHeaderFormat: 'Y',
    dayHeaderFormat: 'dddd MMM dd',
    dayRangeHeaderFormat: weekRangeFormat$1,
    agendaHeaderFormat: dateRangeFormat$2,
    agendaDateFormat: 'ddd MMM dd',
    agendaTimeFormat: 't',
    agendaTimeRangeFormat: timeRangeFormat$1,
  }
  function oldGlobalize(globalize) {
    function getCulture(culture) {
      return culture
        ? globalize.findClosestCulture(culture)
        : globalize.culture()
    }

    function firstOfWeek(culture) {
      culture = getCulture(culture)
      return (culture && culture.calendar.firstDay) || 0
    }

    return new DateLocalizer({
      firstOfWeek: firstOfWeek,
      formats: formats$1,
      format: function format(value, _format, culture) {
        return globalize.format(value, _format, culture)
      },
    })
  }

  var dateRangeFormat$3 = function dateRangeFormat(_ref, culture, local) {
    var start = _ref.start,
      end = _ref.end
    return (
      local.format(
        start,
        {
          date: 'short',
        },
        culture
      ) +
      ' – ' +
      local.format(
        end,
        {
          date: 'short',
        },
        culture
      )
    )
  }

  var timeRangeFormat$2 = function timeRangeFormat(_ref2, culture, local) {
    var start = _ref2.start,
      end = _ref2.end
    return (
      local.format(
        start,
        {
          time: 'short',
        },
        culture
      ) +
      ' – ' +
      local.format(
        end,
        {
          time: 'short',
        },
        culture
      )
    )
  }

  var timeRangeStartFormat$2 = function timeRangeStartFormat(
    _ref3,
    culture,
    local
  ) {
    var start = _ref3.start
    return (
      local.format(
        start,
        {
          time: 'short',
        },
        culture
      ) + ' – '
    )
  }

  var timeRangeEndFormat$2 = function timeRangeEndFormat(
    _ref4,
    culture,
    local
  ) {
    var end = _ref4.end
    return (
      ' – ' +
      local.format(
        end,
        {
          time: 'short',
        },
        culture
      )
    )
  }

  var weekRangeFormat$2 = function weekRangeFormat(_ref5, culture, local) {
    var start = _ref5.start,
      end = _ref5.end
    return (
      local.format(start, 'MMM dd', culture) +
      ' – ' +
      local.format(end, eq(start, end, 'month') ? 'dd' : 'MMM dd', culture)
    )
  }

  var formats$2 = {
    dateFormat: 'dd',
    dayFormat: 'eee dd/MM',
    weekdayFormat: 'eee',
    selectRangeFormat: timeRangeFormat$2,
    eventTimeRangeFormat: timeRangeFormat$2,
    eventTimeRangeStartFormat: timeRangeStartFormat$2,
    eventTimeRangeEndFormat: timeRangeEndFormat$2,
    timeGutterFormat: {
      time: 'short',
    },
    monthHeaderFormat: 'MMMM yyyy',
    dayHeaderFormat: 'eeee MMM dd',
    dayRangeHeaderFormat: weekRangeFormat$2,
    agendaHeaderFormat: dateRangeFormat$3,
    agendaDateFormat: 'eee MMM dd',
    agendaTimeFormat: {
      time: 'short',
    },
    agendaTimeRangeFormat: timeRangeFormat$2,
  }
  function globalize(globalize) {
    var locale = function locale(culture) {
      return culture ? globalize(culture) : globalize
    } // return the first day of the week from the locale data. Defaults to 'world'
    // territory if no territory is derivable from CLDR.
    // Failing to use CLDR supplemental (not loaded?), revert to the original
    // method of getting first day of week.

    function firstOfWeek(culture) {
      try {
        var days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        var cldr = locale(culture).cldr
        var territory = cldr.attributes.territory
        var weekData = cldr.get('supplemental').weekData
        var firstDay = weekData.firstDay[territory || '001']
        return days.indexOf(firstDay)
      } catch (e) {
        {
          console.error(
            'Failed to accurately determine first day of the week.' +
              ' Is supplemental data loaded into CLDR?'
          )
        } // maybe cldr supplemental is not loaded? revert to original method

        var date = new Date() //cldr-data doesn't seem to be zero based

        var localeDay = Math.max(
          parseInt(
            locale(culture).formatDate(date, {
              raw: 'e',
            }),
            10
          ) - 1,
          0
        )
        return Math.abs(date.getDay() - localeDay)
      }
    }

    if (!globalize.load) return oldGlobalize(globalize)
    return new DateLocalizer({
      firstOfWeek: firstOfWeek,
      formats: formats$2,
      format: function format(value, _format, culture) {
        _format =
          typeof _format === 'string'
            ? {
                raw: _format,
              }
            : _format
        return locale(culture).formatDate(value, _format)
      },
    })
  }

  var dateRangeFormat$4 = function dateRangeFormat(_ref, culture, local) {
    var start = _ref.start,
      end = _ref.end
    return (
      local.format(start, 'P', culture) +
      ' \u2013 ' +
      local.format(end, 'P', culture)
    )
  }

  var timeRangeFormat$3 = function timeRangeFormat(_ref2, culture, local) {
    var start = _ref2.start,
      end = _ref2.end
    return (
      local.format(start, 'p', culture) +
      ' \u2013 ' +
      local.format(end, 'p', culture)
    )
  }

  var timeRangeStartFormat$3 = function timeRangeStartFormat(
    _ref3,
    culture,
    local
  ) {
    var start = _ref3.start
    return local.format(start, 'h:mma', culture) + ' \u2013 '
  }

  var timeRangeEndFormat$3 = function timeRangeEndFormat(
    _ref4,
    culture,
    local
  ) {
    var end = _ref4.end
    return ' \u2013 ' + local.format(end, 'h:mma', culture)
  }

  var weekRangeFormat$3 = function weekRangeFormat(_ref5, culture, local) {
    var start = _ref5.start,
      end = _ref5.end
    return (
      local.format(start, 'MMMM dd', culture) +
      ' \u2013 ' +
      local.format(end, eq(start, end, 'month') ? 'dd' : 'MMMM dd', culture)
    )
  }

  var formats$3 = {
    dateFormat: 'dd',
    dayFormat: 'dd ddd',
    weekdayFormat: 'cccc',
    selectRangeFormat: timeRangeFormat$3,
    eventTimeRangeFormat: timeRangeFormat$3,
    eventTimeRangeStartFormat: timeRangeStartFormat$3,
    eventTimeRangeEndFormat: timeRangeEndFormat$3,
    timeGutterFormat: 'p',
    monthHeaderFormat: 'MMMM yyyy',
    dayHeaderFormat: 'dddd MMM dd',
    dayRangeHeaderFormat: weekRangeFormat$3,
    agendaHeaderFormat: dateRangeFormat$4,
    agendaDateFormat: 'ddd MMM dd',
    agendaTimeFormat: 'p',
    agendaTimeRangeFormat: timeRangeFormat$3,
  }

  var dateFnsLocalizer = function dateFnsLocalizer(_ref6) {
    var startOfWeek = _ref6.startOfWeek,
      getDay = _ref6.getDay,
      _format = _ref6.format,
      locales = _ref6.locales
    return new DateLocalizer({
      formats: formats$3,
      firstOfWeek: function firstOfWeek(culture) {
        return getDay(
          startOfWeek(new Date(), {
            locale: locales[culture],
          })
        )
      },
      format: function format(value, formatString, culture) {
        return _format(new Date(value), formatString, {
          locale: locales[culture],
        })
      },
    })
  }

  var components = {
    eventWrapper: NoopWrapper,
    timeSlotWrapper: NoopWrapper,
    dateCellWrapper: NoopWrapper,
  }

  exports.Calendar = Calendar$1
  exports.DateLocalizer = DateLocalizer
  exports.Navigate = navigate
  exports.Views = views
  exports.components = components
  exports.dateFnsLocalizer = dateFnsLocalizer
  exports.globalizeLocalizer = globalize
  exports.momentLocalizer = moment
  exports.move = moveDate

  Object.defineProperty(exports, '__esModule', { value: true })
})
