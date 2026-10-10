const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'amis_system' });

db.connect((err) => {
  if (err) {
    console.log('ERR', err.message);
    process.exit(1);
  }

  const alters = [
    "ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) NOT NULL DEFAULT 'text'",
    "ALTER TABLE messages ADD COLUMN attachment_original_name VARCHAR(255) NULL",
    "ALTER TABLE messages ADD COLUMN attachment_mime_type VARCHAR(150) NULL",
    "ALTER TABLE messages ADD COLUMN attachment_size BIGINT NULL"
  ];

  let i = 0;
  const next = () => {
    if (i >= alters.length) {
      console.log('DONE');
      process.exit(0);
    }
    const sql = alters[i++];
    db.query(sql, (e) => {
      if (e) {
        if (e.message.includes('Duplicate column name')) {
          console.log('SKIP (already exists):', sql);
        } else {
          console.log('ALTER ERR:', sql, e.message);
        }
      } else {
        console.log('OK:', sql);
      }
      next();
    });
  };
  next();
});
