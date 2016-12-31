const express = require('express')
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const app = express()

app.use(bodyParser.json()) // for parsing application/json
app.engine('handlebars', exphbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

const { send, receive, readMessages } = require('./voxbone')
const { fromDidList } = require('./secrets')
 
app.post('/send/:did', function (req, res) {
  const { from, msg } = req.body
  const to = req.params.did

  console.log(`send(${to}, ${from}, ${msg})`)
  send(to.replace('+', ''), from.replace('+', ''), msg)
  res.sendStatus(200)
})

app.get('/messages', function(req, res) {
  const messages = readMessages()
  res.render('messages', { messages, fromDidList })
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
