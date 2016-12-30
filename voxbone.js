const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

const Voxbone = require('voxbone-sms')
const apiLogin = 'devin2'
const apiPassword = 'Devin123!@#'
const voxbone = new Voxbone({ apiLogin, apiPassword })

function sanitize(msg) {
  return msg.replace('"', '\"')
}

function getDate() {
  return (new Date().getTime() / 1000).toFixed(0)
}

// const to = "12263363620"
// const from = "12262201584"
// const msg = "message sent from npm app"
export function send(to, from, msg, dr = 'none') {
  const fragref = voxbone.createFragRef()
  voxbone.sendSMS(to, `+${from}`, msg, fragref)
  db.run(`INSERT INTO messages VALUES ('${to}', '${from}', ${getDate()}, "${sanitize(msg)}")`)
}

export function receive(to, body) {
  const { from, uuid, time, msg, frag } = body
  db.run(`INSERT INTO messages VALUES ('${to}', '${from.replace('+', '')}', ${getDate()}, "${sanitize(msg)}")`)
}
