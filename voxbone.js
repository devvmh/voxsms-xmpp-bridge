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

function send(to, from, msg, dr = 'none') {
  const fragref = voxbone.createFragRef()
  voxbone.sendSMS(to, `+${from}`, msg, fragref)
  db.run(`INSERT INTO messages VALUES ('${to}', '${from}', ${getDate()}, "${sanitize(msg)}")`)
}

function receive(to, from, msg) {
  db.run(`INSERT INTO messages VALUES ('${to}', '${from}', ${getDate()}, "${sanitize(msg)}")`)
}

// send 11 digit numbers e.g. 12262201584 for from/to when using send/receive
module.exports = { send, receive }
