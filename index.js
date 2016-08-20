module.exports = RealtimeCollection

var inherits = require('inherits')
var EventEmitter = require('events')

inherits(RealtimeCollection, EventEmitter)

function RealtimeCollection (opts) {
  EventEmitter.call(this)
  this._onchange = this._onchange.bind(this)
  this._onremove = this._onremove.bind(this)
  this._onerror = this._onerror.bind(this)
  this.parseKey = opts.parseKey || this.parseKey
  this.storage = opts.storage
  this.orderBy = opts.orderBy
  this.where = opts.where
  this.items = opts.items || {}
  if (opts.watch !== false) {
    this.watch()
  }
}

RealtimeCollection.prototype.watch = function () {
  if (this.watching) return
  this.watching = true

  this._ref = this.storage

  var orderBy = this.orderBy
  if (orderBy) {
    this._ref = this._ref
      .orderByChild(orderBy)
  }

  var where = this.where
  if (where) {
    this._ref = this._ref
      .equalTo(where)
  }

  this._ref.on('child_added', this._onchange, this._onerror)
  this._ref.on('child_changed', this._onchange, this._onerror)
  this._ref.on('child_removed', this._onremove, this._onerror)
}

RealtimeCollection.prototype.unwatch = function () {
  if (!this.watching) return
  this.watching = false

  this._ref.off('child_added', this._onchange)
  this._ref.off('child_changed', this._onchange)
  this._ref.off('child_removed', this._onremove)
}

RealtimeCollection.prototype.parseKey = function (key) {
  return key
}

RealtimeCollection.prototype._onchange = function (snap) {
  var key = this.parseKey(snap.key)
  var oldData = this.items[key]
  var newData = snap.val()
  this.items[key] = newData
  this.emit('change', {
    key,
    oldData,
    newData,
  })
}

RealtimeCollection.prototype._onremove = function (snap) {
  var key = this.parseKey(snap.key)
  var oldData = snap.val()
  delete this.items[key]
  this.emit('change', {
    key,
    oldData,
    newData: null,
  })
}

RealtimeCollection.prototype._onerror = function (err) {
  this.emit('error', err)
}
