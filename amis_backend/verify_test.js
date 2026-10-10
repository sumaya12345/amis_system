const http = require('http');
const mysql = require('mysql2/promise');

async function testAll() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'amis_system'
  });

  console.log('--- 1. DATABASE S3 & OFFICERS CHECK ---');
  const [users] = await db.execute("SELECT id, username, role FROM users WHERE role IN ('S1','S2','S3','S4')");
  console.log('Users in DB:', users);

  const [s3Records] = await db.execute("SELECT id, sarkaal_id, name, user_id FROM sarkaal_data WHERE user_id = 17 OR user_id = 3 LIMIT 5");
  console.log('S3 records in sarkaal_data:', s3Records);

  console.log('\n--- 2. INITIATE TESTS ---');
  for (const u of users) {
    let officerId;
    if (u.role === 'S1') {
      const [rows] = await db.execute("SELECT id, name FROM sarkaal_data WHERE user_id = ? LIMIT 1", [u.id]);
      officerId = rows[0]?.id;
    } else if (u.role === 'S2') {
      const [rows] = await db.execute("SELECT id, name FROM sarkaal_data_s2 WHERE user_id = ? LIMIT 1", [u.id]);
      officerId = rows[0]?.id;
    } else if (u.role === 'S3') {
      const [rows] = await db.execute("SELECT id, name FROM sarkaal_data WHERE user_id = 17 OR user_id = 3 LIMIT 1");
      officerId = rows[0]?.id;
    } else if (u.role === 'S4') {
      const [rows] = await db.execute("SELECT id, name FROM sarkaal_data_s4 WHERE user_id = ? LIMIT 1", [u.id]);
      officerId = rows[0]?.id;
    }

    console.log(`Role ${u.role} (User ID ${u.id}) has officer ID: ${officerId}`);
    if (!officerId) continue;

    // Clear from queue to allow fresh Initiate
    await db.execute("DELETE FROM queue_list WHERE sarkaal_data_id = ?", [officerId]);

    const postData = JSON.stringify({ sarkaal_data_id: officerId });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ballan',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-user-id': String(u.id),
        'x-user-role': u.role
      }
    };

    const res = await new Promise((resolve) => {
      const req = http.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => resolve({ status: response.statusCode, body }));
      });
      req.on('error', (e) => resolve({ status: 500, body: e.message }));
      req.write(postData);
      req.end();
    });

    console.log(`Initiate ${u.role} result: HTTP ${res.status} - ${res.body}`);
  }

  console.log('\n--- 3. EDIT / UPDATE ENDPOINT TESTS ---');
  // S1 PUT
  const [s1Row] = await db.execute("SELECT id, name, culays FROM sarkaal_data WHERE user_id = 1 LIMIT 1");
  if (s1Row.length > 0) {
    const s1Id = s1Row[0].id;
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="sarkaal_id"',
      '',
      '1001',
      `--${boundary}`,
      'Content-Disposition: form-data; name="name"',
      '',
      'Ali Maxamed Test',
      `--${boundary}`,
      'Content-Disposition: form-data; name="culays"',
      '',
      '75',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhiiga"',
      '',
      'O+',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhirirka"',
      '',
      '175',
      `--${boundary}`,
      'Content-Disposition: form-data; name="goobta_dhalashada"',
      '',
      'Muqdisho',
      `--${boundary}`,
      'Content-Disposition: form-data; name="tariikhda_dhalashada"',
      '',
      '1995-01-01',
      `--${boundary}--`
    ].join('\r\n');

    const updateRes = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/s1-data/${s1Id}`,
        method: 'PUT',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
          'x-user-id': '1',
          'x-user-role': 'S1'
        }
      }, (response) => {
        let b = '';
        response.on('data', chunk => b += chunk);
        response.on('end', () => resolve({ status: response.statusCode, body: b }));
      });
      req.on('error', (e) => resolve({ status: 500, body: e.message }));
      req.write(body);
      req.end();
    });
    console.log(`Update S1 (ID ${s1Id}) result: HTTP ${updateRes.status} - ${updateRes.body}`);
  }

  // S2 PUT
  const [s2Row] = await db.execute("SELECT id, name, culays FROM sarkaal_data_s2 WHERE user_id = 2 LIMIT 1");
  if (s2Row.length > 0) {
    const s2Id = s2Row[0].id;
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="sarkaal_id"',
      '',
      '2001',
      `--${boundary}`,
      'Content-Disposition: form-data; name="name"',
      '',
      'Hassan Omar Test',
      `--${boundary}`,
      'Content-Disposition: form-data; name="culays"',
      '',
      '80',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhiiga"',
      '',
      'A+',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhirirka"',
      '',
      '180',
      `--${boundary}`,
      'Content-Disposition: form-data; name="goobta_dhalashada"',
      '',
      'Hargeisa',
      `--${boundary}`,
      'Content-Disposition: form-data; name="tariikhda_dhalashada"',
      '',
      '1992-05-10',
      `--${boundary}--`
    ].join('\r\n');

    const updateRes = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/s2-data/${s2Id}`,
        method: 'PUT',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
          'x-user-id': '2',
          'x-user-role': 'S2'
        }
      }, (response) => {
        let b = '';
        response.on('data', chunk => b += chunk);
        response.on('end', () => resolve({ status: response.statusCode, body: b }));
      });
      req.on('error', (e) => resolve({ status: 500, body: e.message }));
      req.write(body);
      req.end();
    });
    console.log(`Update S2 (ID ${s2Id}) result: HTTP ${updateRes.status} - ${updateRes.body}`);
  }

  // S3 PUT
  const [s3Row] = await db.execute("SELECT id, name, culays FROM sarkaal_data WHERE user_id = 17 OR user_id = 3 LIMIT 1");
  if (s3Row.length > 0) {
    const s3Id = s3Row[0].id;
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="sarkaal_id"',
      '',
      '3001',
      `--${boundary}`,
      'Content-Disposition: form-data; name="name"',
      '',
      'Khadar Ahmed Test',
      `--${boundary}`,
      'Content-Disposition: form-data; name="culays"',
      '',
      '72',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhiiga"',
      '',
      'B+',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhirirka"',
      '',
      '170',
      `--${boundary}`,
      'Content-Disposition: form-data; name="goobta_dhalashada"',
      '',
      'Kismayo',
      `--${boundary}`,
      'Content-Disposition: form-data; name="tariikhda_dhalashada"',
      '',
      '1996-03-15',
      `--${boundary}--`
    ].join('\r\n');

    const updateRes = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/s3-data/${s3Id}`,
        method: 'PUT',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
          'x-user-id': '17',
          'x-user-role': 'S3'
        }
      }, (response) => {
        let b = '';
        response.on('data', chunk => b += chunk);
        response.on('end', () => resolve({ status: response.statusCode, body: b }));
      });
      req.on('error', (e) => resolve({ status: 500, body: e.message }));
      req.write(body);
      req.end();
    });
    console.log(`Update S3 (ID ${s3Id}) result: HTTP ${updateRes.status} - ${updateRes.body}`);
  }

  // S4 PUT
  const [s4Row] = await db.execute("SELECT id, name, culays FROM sarkaal_data_s4 WHERE user_id = 20 LIMIT 1");
  if (s4Row.length > 0) {
    const s4Id = s4Row[0].id;
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="sarkaal_id"',
      '',
      '4001',
      `--${boundary}`,
      'Content-Disposition: form-data; name="name"',
      '',
      'Yusuf Farah Test',
      `--${boundary}`,
      'Content-Disposition: form-data; name="culays"',
      '',
      '68',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhiiga"',
      '',
      'AB+',
      `--${boundary}`,
      'Content-Disposition: form-data; name="dhirirka"',
      '',
      '178',
      `--${boundary}`,
      'Content-Disposition: form-data; name="goobta_dhalashada"',
      '',
      'Garowe',
      `--${boundary}`,
      'Content-Disposition: form-data; name="tariikhda_dhalashada"',
      '',
      '1998-07-20',
      `--${boundary}--`
    ].join('\r\n');

    const updateRes = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/s4-data/${s4Id}`,
        method: 'PUT',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
          'x-user-id': '20',
          'x-user-role': 'S4'
        }
      }, (response) => {
        let b = '';
        response.on('data', chunk => b += chunk);
        response.on('end', () => resolve({ status: response.statusCode, body: b }));
      });
      req.on('error', (e) => resolve({ status: 500, body: e.message }));
      req.write(body);
      req.end();
    });
    console.log(`Update S4 (ID ${s4Id}) result: HTTP ${updateRes.status} - ${updateRes.body}`);
  }

  await db.end();
  console.log('\nVerification complete!');
}

testAll().catch(console.error);
