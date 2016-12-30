var sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('messages.sqlite')
 
db.serialize(() => {
  const query = 'DROP TABLE messages'

  db.run(query)
})
