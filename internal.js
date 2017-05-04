const escapeRegexp = require('lodash.escaperegexp')
const nslookup = require('nslookup')
const xmpp = require('xmppjs')
const Voxbone = require('voxbone-voxsms')
const { 
  apiLogin, apiPassword, smsBotDomain, smsBotPassword,
  xmppDomain, xmppPort, xmppMappings, reverseXmppMappings
} = require('./secrets')

const conn = new xmpp.Connection()

let serverIP = 'sms.voxbone.com'
let voxbone

// see https://github.com/voxbone/voxsms-npm/issues/1
// provided we can look one up, use a fixed IP for voxbone
// otherwise fallback to te URL, which sometimes gets 401 errors
function initializeVoxbone() {
  return new Promise((resolve, reject) => {
    nslookup('sms.voxbone.com').end((err, addrs) => {
      if (!err && addrs.length >= 1) {
        serverIP = addrs[0]
        console.log(`initializeVoxbone: Setting DNS address to ${serverIP}`)
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
        console.log('initializeVoxbone: Disabling TLS identity checking')
      } else {
        console.log(`initializeVoxbone: Can't nslookup voxbone! error: ${error}`)
      }

      voxbone = new Voxbone({
        apiLogin,
        apiPassword,
        url: `https://${serverIP}:4443/sms/v1/`
      })
      resolve() // ready to start using voxbone
    })
  })
}

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
  
  console.log(`Message received: to: ${toDid}, from: ${fromDid}, msg: <<${msg}>>.`)
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

module.exports = { receive, initializeConnection, initializeVoxbone }
