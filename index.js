const WebSocket = require('ws')
const { EventEmitter } = require('events')
const debug = require('debug')('ws-client')

class WebSocketClient extends EventEmitter {
  constructor(url, opts = {}) {
    super()

    this.url = url
    this.opts = opts
    this.reconectInterval =
      opts.reconectInterval || process.env.RECONNET_INTERVAL
    this.open()
  }

  open() {
    debug(`create: ${this.url} ${this.opts}`)
    this.instance = new WebSocket(this.url, this.opts)

    this.instance.on('open', () => {
      debug(`open: ${this.url}`)
      this.emit('open')
    })

    this.instance.on('message', (message, flags) => {
      const { event, data } = JSON.parse(message)
      debug(`message: ${event} data: ${data}`)
      this.emit(event, data, flags)
      this.emit('message', message, flags)
    })

    this.instance.on('close', e => {
      debug(`close with code ${e.code}`)
      switch (e.code) {
        case 1000:
          // CLOSE_NORMAL
          break
        default:
          // Abnormal closure
          this.reconnect(e)
          break
      }
      this.emit('close', e)
    })

    this.instance.on('error', e => {
      debug(e)
      switch (e.code) {
        case 'ECONNREFUSED':
          this.reconnect(e)
          break
        default:
          this.emit('error', e)
          break
      }
    })
  }

  send(event, data, option) {
    const request = { event, data }
    debug(`send: ${event} data: ${data} `)
    try {
      this.instance.send(JSON.stringify(request), option)
    } catch (e) {
      this.instance.emit('error', e)
    }
  }

  reconnect(e) {
    debug(`reconnection to ${this.url}`)
    this.instance.removeAllListeners()
    setTimeout(() => this.open(), this.reconectInterval)
  }
}

module.exports = WebSocketClient
