const escapeRegexp = require('lodash.escaperegexp')
const xmpp = require('xmppjs')
const Voxbone = require('voxbone-voxsms')
const { 
  apiLogin, apiPassword, smsBotDomain, smsBotPassword,
  xmppDomain, xmppPort, xmppMappings, reverseXmppMappings
} = require('./secrets')

const voxbone = new Voxbone({ apiLogin, apiPassword })
const conn = new xmpp.Connection()

function send(to, from, msg) {
  const fragref = voxbone.createFragRef()
  const dr = 'none'
  voxbone.sendSMS(to, `+${from}`, msg, fragref, dr, function(transaction_id) {
    console.log(`Message sent: ${msg}. Transaction id is ${transaction_id}.`)
    
  }, function(statusCode, frag) {
    if (parseInt(statusCode) >= 400) {
      console.log(`Message failed! Message was <<${msg}>>, HTTP status code was <<${statusCode}>>.`)
      const fromName = xmppMappings[from]

      conn.send(xmpp.message({
        to: `${fromName}@${xmppDomain}`,
        from: `${to}@${smsBotDomain}`,
        type: 'chat'
      }).c('body').t(`Message failed! Message was <<${msg}>>, HTTP status code was <<${statusCode}>>.`))
    }
  })
}

function receive(toDid, fromDid, msg) {
  const toName = xmppMappings[toDid]
  
  conn.send(xmpp.message({
    to: `${toName}@${xmppDomain}`,
    from: `${fromDid}@${smsBotDomain}`,
    type: 'chat'
  }).c('body').t(msg))
}

function onMessage(message) {
  const toJid = message.getAttribute('to')
  const fromJid = message.getAttribute('from')
  const msg = message.getChild('body').getText()

  const toDid = toJid.replace(`@${smsBotDomain}`, '')
  const fromName = fromJid.replace(new RegExp(`@${escapeRegexp(xmppDomain)}.*`), '')
  const fromDid = reverseXmppMappings[fromName]

  send(toDid, fromDid, msg)
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

module.exports = { receive, initializeConnection }
