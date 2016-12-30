var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
 
db.serialize(() => {
  const query = 'CREATE TABLE messages (to_did VARCHAR(20), from_did VARCHAR(20), timestamp INTEGER, message TEXT);'

  db.run(query)
})
