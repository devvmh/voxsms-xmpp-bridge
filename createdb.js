var sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('messages.sqlite')
 
db.serialize(() => {
  const query = 'CREATE TABLE messages (to_did VARCHAR(20), from_did VARCHAR(20), timestamp INTEGER, message TEXT);'

  db.run(query)
})
