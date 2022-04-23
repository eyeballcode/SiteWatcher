const config = require('./config.json')
const fetch = require('node-fetch')

let { SITE_WEBHOOK, SLOW_WEBHOOK } = config
let lastMean = 0

let hosts = [
  {
    hostname: 'transportsg.me',
    name: 'TransportSG'
  },
  {
    hostname: 'vic.transportsg.me',
    name: 'TransportVic'
  }
]

async function httpRequest(url) {
  let body, error

  for (let i = 0; i < 3; i++) {
    try {
      body = await fetch(url, {
        timeout: 15000,
        compress: true,
        highWaterMark: 1024 * 1024
      })

      break
    } catch (e) {
      error = e
    }
  }

  if (!body && error) throw error
  return await body.text()
}

async function checkHost(host) {
  let response = { average: -1 }
  try {
    response = JSON.parse(await httpRequest(`https://${host.hostname}/.host-proxy/site-response`))
  } catch (e) {}

  if (response.average === -1) {
    await request(SITE_WEBHOOK, {
      method: 'POST',
      json: true,
      body: {
        content: `${host.name} Not Responding: ${new Date().toLocaleString()}`
      }
    })
  } else if (response.average >= 3500) {
    if (response.average !== lastMean) {
      lastMean = response.average

      await request(SLOW_WEBHOOK, {
        method: 'POST',
        json: true,
        body: {
          content: `${host.name} Very Slow:
Mean Response Time ${response.average}ms
At: ${new Date().toLocaleString()}`
        }
      })
    }
  } else {
    console.log(`${host.name} Performing OK, mean response time ${response.average}`);
  }
}

async function check() {
  for (let host of hosts) await checkHost(host)
}

module.exports = () => {
  setInterval(check, 5 * 60 * 1000)
  check()
}
