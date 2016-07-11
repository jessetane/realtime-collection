var EventEmitter = require('events')

module.exports = class extends EventEmitter {
  constructor (opts) {
    super(this)
    this._onchange = this._onchange.bind(this)
    this._onremove = this._onremove.bind(this)
    this.storage = opts.storage
    this.orderBy = opts.orderBy
    this.where = opts.where
    this.items = opts.items || {}
    if (opts.watch !== false) {
      this.watch()
    }
  }

  watch () {
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

    this._ref.on('child_added', this._onchange)
    this._ref.on('child_changed', this._onchange)
    this._ref.on('child_removed', this._onremove)
  }

  unwatch () {
    if (!this.watching) return
    this.watching = false

    this._ref.off('child_added', this._onchange)
    this._ref.off('child_changed', this._onchange)
    this._ref.off('child_removed', this._onremove)
  }

  _onchange (snap, old) {
    var key = snap.key
    var oldData = old ? old.val() : null
    var newData = snap.val()
    this.items[key] = newData
    this.emit('change', {
      key,
      oldData,
      newData,
    })
  }

  _onremove (snap) {
    var key = snap.key
    var oldData = snap.val()
    delete this.items[key]
    this.emit('change', {
      key,
      oldData, 
      newData: null,
    })
  }
}
