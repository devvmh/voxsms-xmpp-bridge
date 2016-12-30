const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('messages.sqlite')

const Voxbone = require('voxbone-voxsms')
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
function send(to, from, msg, dr = 'none') {
  const fragref = voxbone.createFragRef()
  voxbone.sendSMS(to, `+${from}`, msg, fragref)
  db.run(`INSERT INTO messages VALUES ('${to}', '${from}', ${getDate()}, "${sanitize(msg)}")`)
}

function receive(to, from, msg) {
  db.run(`INSERT INTO messages VALUES ('${to}', '${from.replace('+', '')}', ${getDate()}, "${sanitize(msg)}")`)
}

module.exports = { send, receive }
