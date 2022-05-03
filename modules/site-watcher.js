const config = require('../config.json')
const { request } = require('../utils')

let { SITE_WEBHOOK, SLOW_WEBHOOK } = config

let hosts = [
  {
    hostname: 'transportsg.me',
    name: 'TransportSG'
  },
  {
    hostname: 'transportvic.me',
    name: 'TransportVic'
  }
]

async function checkHost(host) {
  let response = { average: -1 }
  try {
    response = JSON.parse(await request(`https://${host.hostname}/.host-proxy/site-response`))
  } catch (e) {}

  if (response.average === -1) {
    console.log(`${host.name} Not Responding`);

    await request(SITE_WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: `${host.name} Not Responding: ${new Date().toLocaleString()}`
      })
    })
  } else if (response.average >= 3500) {
    if (response.average !== host.lastMean) {
      host.lastMean = response.average

      console.log(`${host.name} Very Slow, mean response time ${response.average}`);
      await request(SLOW_WEBHOOK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: `${host.name} Very Slow:
Mean Response Time ${response.average}ms
At: ${new Date().toLocaleString()}`
        })
      })
    }
  } else {
    console.log(`${host.name} Performing OK, mean response time ${response.average}`);
  }
}

async function check() {
  for (let host of hosts) await checkHost(host)
}

module.exports = check
