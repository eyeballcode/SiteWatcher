const fetch = require('node-fetch')

async function request(url, options={}) {
  let body, error
  let raw = options.raw || false

  for (let i = 0; i < 3; i++) {
    try {
      body = await fetch(url, {
        timeout: 15000,
        compress: true,
        highWaterMark: 1024 * 1024,
        ...options
      })

      break
    } catch (e) {
      error = e
    }
  }

  if (!body && error) throw error
  return await (raw ? body.buffer() : body.text())
}

module.exports.request = request
