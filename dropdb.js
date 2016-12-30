var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
 
db.serialize(() => {
  const query = 'DROP TABLE messages'

  db.run(query)
})
