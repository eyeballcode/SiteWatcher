const config = require('../config.json')
const { request } = require('../utils')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const FormData = require('form-data')

let wonCount = 0
let wonCountPath = path.join(__dirname, '../won.dat')
try {
  wonCount = parseInt(fs.readFileSync(wonCountPath)) || 0
} catch (e) {}

let { WON_WEBHOOK } = config

async function httpRequest(url) {
  return request(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15'
    }
  })
}

async function check() {
  let body = ''
  try {
    body = await httpRequest('https://railsws.com.au/news/2024/01/16/weekly-operational-notices-wons-2023-2/')
  } catch (e) {}

  let $ = cheerio.load(body)

  let wonButtons = Array.from($('.wp-block-button'))
  if (wonButtons.length === 0) return // Request must have failed

  if (wonButtons.length !== wonCount) {
    wonCount = wonButtons.length
    let year = new Date().getFullYear()
    let wonID = wonCount < 10 ? '0' + wonCount : wonCount
    let wonName = `WON-${wonID}-${year}.pdf`

    let url = $('a', wonButtons[wonCount - 1]).attr('href')
    let wonPath = '/tmp/' + wonName

    console.log(`Downloading ${wonName} from ${url} to ${wonPath}`)

    let wonBuffer = await request(url, { timeout: 60000, raw: true })

    fs.writeFile(wonPath, wonBuffer, async err => {
      let formData = new FormData()
      formData.append('content', `New WON Uploaded: WON.${wonID}/${year}`)
      formData.append('file', fs.createReadStream(wonPath))

      console.log('Uploading WON now')

      await request(WON_WEBHOOK, {
        method: 'POST',
        body: formData,
        timeout: 60000
      })

      console.log('Uploaded WON, updating count');

      fs.writeFile(wonCountPath, wonCount.toString(), () => {})
    })
  } else console.log('WON up to date')
}

module.exports = check

