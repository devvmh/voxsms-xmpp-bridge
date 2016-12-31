const express = require('express')
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');

const { send, receive, readMessages } = require('./internal')
const { fromDidList, users } = require('./secrets')
const basicAuthMiddleware = basicAuth({ users, challenge: true })

const app = express()
app.use(bodyParser.json()) // for parsing application/json
app.engine('handlebars', exphbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
app.use(express.static('public'))

app.get('/', basicAuthMiddleware, function(req, res) {
  res.render('index', { didList: fromDidList })
})
 
app.get('/messages', basicAuthMiddleware, function(req, res) {
  res.redirect('/')
})

app.get('/messages/:did', basicAuthMiddleware, function(req, res) {
  const { did } = req.params
  if (fromDidList.indexOf(did) === -1) {
    res.sendStatus(404)
    return
  }
  const [messages, conversations] = readMessages(did)
  res.render('messages', {
    messages,
    conversations,
    did,
    didList: fromDidList.filter(d => d !== did)
  })
})

app.post('/send/:did', basicAuthMiddleware, function (req, res) {
  const { from, msg } = req.body
  const to = req.params.did

  send(to.replace('+', ''), from.replace('+', ''), msg)
  res.sendStatus(200)
})

/*
 * POST /12262201584 HTTP/1.1
 * Content-Length: 118
 * Content-Type: application/json; charset=UTF-8
 * Host: veasterisk-tor.verdexus.com:8080
 * Connection: Keep-Alive
 * User-Agent: Apache-HttpAsyncClient/4.1.1 (Java/1.8.0_25)
 *
 * {"msg":"Devin attempt 3","from":"+12263363620","time":"2016-12-30 05:43:16","uuid":"f49f2326a0a74595bec7169b21100bcc"}
 */
app.post('/receive/:did', function(req, res) {
  const { from, msg, time, uuid } = req.body
  const to = req.params.did
  receive(to.replace('+', ''), from.replace('+', ''), msg)
  res.sendStatus(200)
})
 
app.listen(process.env.PORT || 8080)
