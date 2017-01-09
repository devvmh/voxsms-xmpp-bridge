require('isomorphic-fetch')
const base64 = require('base-64')
const xmpp = require('xmppjs')

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('messages.sqlite')

const Voxbone = require('voxbone-voxsms')
const { apiLogin, apiPassword } = require('./secrets')
const voxbone = new Voxbone({ apiLogin, apiPassword })

const { useXmpp, xmppUser, xmppPassword, xmppUrl, xmppPort, xmppMappings, reverseXmppMappings } = require('./secrets')

const { smsBotDomain, smsBotPassword } = require('./secrets')
const conn = new xmpp.Connection()

function sanitize(msg) {
  return msg.replace('"', '\"')
}

function getDate() {
  return (new Date().getTime() / 1000).toFixed(0)
}

function notifyXmpp(to, from, msg) {
  if (!useXmpp) return

  // http://xmpp.verdexus.com:5280/msg/devin@xmpp.verdexus.com
  const who = xmppMappings[to]
  const url = `http://${xmppUrl}:${xmppPort}/msg/${who}@${xmppUrl}`

  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + base64.encode(`${xmppUser}@${xmppUrl}:${xmppPassword}`),
      'Content-Type': 'text/plain'
    },
    body: `You have a new message for ${to} from ${from}: ${msg}`
  }).then(response => {
    return response.text()
  }).then(payload => {
    console.log(`XMPP notified for did ${to}`)
  }).catch(error => {
    console.log(`XMPP notification failed for did ${from}`)
  })
}

function send(to, from, msg, dr = 'none') {
  const fragref = voxbone.createFragRef()
  voxbone.sendSMS(to, `+${from}`, msg, fragref)
  db.run(`INSERT INTO messages VALUES ('${to}', '${from}', ${getDate()}, "${sanitize(msg)}")`)
}

function receive(to, from, msg) {
  //notifyXmpp(to, from, msg)
  sendMessageToXmpp(to, from, msg)
  db.run(`INSERT INTO messages VALUES ('${to}', '${from}', ${getDate()}, "${sanitize(msg)}")`)
}

function readMessages(did) {
  const allMessages = []
  const conversations = {}
  let query = 'SELECT to_did, from_did, timestamp, message FROM messages'
  if (did !== null) {
    query += ` WHERE to_did = '${did}' OR from_did = '${did}'`
  }
  query += ' ORDER BY timestamp DESC'
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

function onMessage(message) {
  const toJid = message.getAttribute('to')
  const fromJid = message.getAttribute('from')
  const msg = message.getChild('body').getText()

  const toDid = toJid.replace('@sms.verdexus.com', '')
  const fromName = fromJid.replace('@xmpp.verdexus.com/phone', '')
  const fromDid = reverseXmppMappings[fromName]

  console.log(`OK, I got a message from ${fromName}. I'll send a message to ${toDid} from ${fromDid}.`)
  console.log(`The message is ${msg}.`)
  send(toDid, fromDid, msg)
}

function sendMessageToXmpp(toDid, fromDid, msg) {
  const toName = xmppMappings[toDid]
  
  conn.send(xmpp.message({
    to: `${toName}@xmpp.verdexus.com/phone`,
    from: `${fromDid}@sms.verdexus.com`,
    type: 'chat'
  }).c('body').t(msg))
}

function initializeConnection() {
  conn.connect(smsBotDomain, smsBotPassword, function (status, condition) {
    if (status == xmpp.Status.CONNECTED) {
      conn.addHandler(onMessage, null, 'message', null, null,  null)
    } else {
      conn.log(xmpp.LogLevel.DEBUG, `New connection status: ${status}` + condition ? ` (${condition})` : '')
    }
  })
}

// send 11 digit numbers e.g. 12262201584 for from/to when using send/receive
module.exports = { send, receive, readMessages, initializeConnection }
