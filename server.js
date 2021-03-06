const express = require('express')
const bodyParser = require('body-parser');

const { receive, initializeConnection, initializeVoxbone } = require('./internal')

const app = express()
app.use(bodyParser.json()) // for parsing application/json

/*
 * POST /14165551234 HTTP/1.1
 * Content-Length: 118
 * Content-Type: application/json; charset=UTF-8
 * Host: sms.example.com:8080
 * Connection: Keep-Alive
 * User-Agent: Apache-HttpAsyncClient/4.1.1 (Java/1.8.0_25)
 *
 * {"msg":"Devin attempt 3","from":"+14165554321","time":"2016-12-30 05:43:16","uuid":"f49f2326a0a74595bec7169b21100bcc"}
 */
app.post('/receive/:did', function(req, res) {
  const { from, msg, time, uuid } = req.body
  const to = req.params.did
  receive(to.replace('+', ''), from.replace('+', ''), msg)
  res.sendStatus(200)
})

app.get('/status', function(req, res) {
  res.sendStatus(200)
})

/*
 * MAIN
 */
 
initializeVoxbone().then(() => {
  initializeConnection()
  app.listen(process.env.PORT || 8080)
})
