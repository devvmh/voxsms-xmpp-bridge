const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('messages.sqlite')

const Voxbone = require('voxbone-voxsms')
const { apiLogin, apiPassword } = require('./secrets')
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

function readMessages(did) {
  const allMessages = []
  const conversations = {}
  let query = 'SELECT to_did, from_did, timestamp, message FROM messages'
  if (did !== null) {
    query += ` WHERE to_did = '${did}' OR from_did = '${did}'`
  }
  db.each(query, function(err, row) {
    const { to_did, from_did, timestamp, message } = row
    const formatted_time = new Date(timestamp * 1000).toString().substring(0, 24)
    allMessages.push({ to_did, from_did, formatted_time, message })
    const otherDid = to_did === did ? from_did : to_did
    if (!conversations[otherDid]) conversations[otherDid] = []
    conversations[otherDid].push({ to_did, from_did, formatted_time, message, fromMe: did === from_did })
  })
  return [allMessages.sort((a,b) => {
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
  }), conversations]
}

// send 11 digit numbers e.g. 12262201584 for from/to when using send/receive
module.exports = { send, receive, readMessages }
