var express = require('express')
var bodyParser = require('body-parser');
var app = express()
app.use(bodyParser.json()) // for parsing application/json

const { send, receive } = require('./voxbone')
 
app.post('/send/:did', function (req, res) {
  const { from, msg } = req.body
  const to = req.params.did

  console.log(`send(${to}, ${from}, ${msg})`)
  send(to.replace('+', ''), from.replace('+', ''), msg)
  res.sendStatus(200)
})

app.get('/messages/:did', function(req, res) {
  res.send('Whoops, unimplemented')
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
