const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); // Kani waa ka maqnaa
const bcrypt = require('bcrypt');         // Kanina waa ka maqnaa
const crypto = require('crypto');
const app = express();
let otpStore = {};
let emailVerificationStore = {};
const contactOtpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const sessionStore = {};
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

const touchLastSeen = (userId) => {
    if (!userId) return;
    db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [userId], () => {});
};

const isSessionRecentlyActive = (session) => {
    if (!session || !session.lastSeenAt) return false;
    return (Date.now() - Number(session.lastSeenAt)) < ONLINE_WINDOW_MS;
};

const isUserOnline = (userId) => {
    return Object.values(sessionStore).some((session) => (
        Number(session.id) === Number(userId) && isSessionRecentlyActive(session)
    ));
};

const classifyMessageType = (file) => {
    if (!file) return 'text';
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
        return 'image';
    }
    return 'document';
};

const checkSession = (req, res, next) => {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId || !sessionStore[sessionId]) {
        return res.status(401).json({ success: false, message: 'Fadlan dib u gal nidaamka (Session expired)' });
    }
    req.session = sessionStore[sessionId];
    sessionStore[sessionId].lastSeenAt = Date.now();
    touchLastSeen(req.session.id);
    next();
};

const resolveMailDomain = (domain, timeoutMs = 5000) => new Promise((resolve) => {
    let settled = false;
    const finish = (valid) => {
        if (settled) return;
        settled = true;
        resolve(valid);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    dns.resolveMx(domain, (err, addresses) => {
        clearTimeout(timer);
        finish(!err && addresses && addresses.length > 0);
    });
});

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !allowedRoles.includes(req.session.role)) {
            return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const getContactOtpKey = (userId, type, value) => `${userId}:${type}:${String(value).trim().toLowerCase()}`;

const createContactOtp = (userId, type, value) => {
    const key = getContactOtpKey(userId, type, value);
    const previous = contactOtpStore.get(key);
    if (previous && Date.now() - previous.createdAt < OTP_RESEND_COOLDOWN_MS) {
        return { error: 'Please wait before requesting another verification code.' };
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    contactOtpStore.set(key, {
        hash: hashOtp(otp),
        createdAt: Date.now(),
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
        verified: false
    });
    return { key, otp };
};

const verifyContactOtpRecord = (userId, type, value, otp) => {
    const key = getContactOtpKey(userId, type, value);
    const record = contactOtpStore.get(key);
    if (!record || record.verified || Date.now() > record.expiresAt) {
        contactOtpStore.delete(key);
        return { ok: false, message: 'The verification code has expired or is invalid.' };
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
        contactOtpStore.delete(key);
        return { ok: false, message: 'Too many verification attempts. Request a new code.' };
    }
    record.attempts += 1;
    if (hashOtp(String(otp || '')) !== record.hash) {
        return { ok: false, message: 'The verification code you entered is incorrect.' };
    }
    record.verified = true;
    return { ok: true, key };
};

const sendEmailOtp = async (email, otp) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.');
    }
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
    });
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'AMIS Contact Verification Code',
        text: `Your AMIS verification code is ${otp}. It expires in 5 minutes.`
    });
};

const sendSmsOtp = async (phone, otp) => {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        throw new Error('SMS delivery is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.');
    }
    const body = new URLSearchParams({
        To: phone,
        From: TWILIO_FROM_NUMBER,
        Body: `Your AMIS verification code is ${otp}. It expires in 5 minutes.`
    });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });
    if (!response.ok) throw new Error(`SMS provider rejected the message (${response.status}).`);
};

const dataOwnerRole = {
    S1: 'S1', H1: 'S1',
    S2: 'S2', H2: 'S2',
    S3: 'S3', H3: 'S3',
    S4: 'S4', H4: 'S4'
};

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 2. FOLDERS SETUP (Si uusan server-ku u crash-gareyn) ---
const uploadDir = path.join(__dirname, './uploads');
if (!fs.existsSync(uploadDir)) {
    // Kani wuxuu abuurayaa folder-ka haddii uusan jirin
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Ka dhig folder-ka mid laga akrin karo Browser-ka
app.use('/uploads', express.static(uploadDir));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'amis_system'
});

db.connect(err => {
    if (err) {
        console.error('MySQL Connection Error:', err);
        return;
    }
    console.log('MySQL Connected...');
});

// ==========================================
// SCHEDULED JOB: Auto-cancel pending requests after 24 hours
// ==========================================
// Only the active-queue status changes; the queue row and any medical records are kept.
// Completed entries are never touched (status must still be 'Pending').
const cancelExpiredRequests = () => {
    const sql = `UPDATE queue_list
                SET status = 'Cancelled'
                WHERE status = 'Pending'
                AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error auto-cancelling expired requests:', err);
        } else if (result.affectedRows > 0) {
            console.log(`Auto-cancelled ${result.affectedRows} expired pending requests`);
        }
    });
};
// Run once at startup (covers downtime) and then every minute.
cancelExpiredRequests();
setInterval(cancelExpiredRequests, 60 * 1000);

// 1. U sheeg Multer inuu sawirada profile-ka geeyo 'uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/'); // Halkan iska hubi inay tahay 'uploads'
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const prefix = file.fieldname === 'attachment' ? 'msg-' : 'profile_pic-';
        cb(null, prefix + Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }
});
// --- API ROUTES ---
// 1. Login
// Tusaale: Login Endpoint-kaaga Node.js
app.post('/api/update-profile', checkSession, upload.single('profile_pic'), (req, res) => {
  const { userId, username } = req.body;
  
    if (req.session.id !== Number(userId)) {
      return res.status(403).json({ success: false, message: "Access denied: User ID mismatch" });
  }

  let sql = "";
  let params = [];

  // Hubi haddii sawir cusub la soo diray iyo haddii kale
  if (req.file) {
    const picName = req.file.filename;
    sql = "UPDATE users SET username = ?, pic = ? WHERE id = ?";
    params = [username, picName, userId];
  } else {
    sql = "UPDATE users SET username = ? WHERE id = ?";
    params = [username, userId];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.affectedRows > 0) {
      if (req.session) {
        req.session.username = username;
        if (req.file) {
          req.session.pic = req.file.filename;
        }
      }
      res.json({ 
        success: true, 
        message: "Profile-ka waa la cusboonaysiiyay!",
        pic: req.file ? req.file.filename : null,
        username
      });
    } else {
      res.status(404).json({ success: false, message: "User-ka lama helin" });
    }
  });
});
 
// =================================================================
// 3. AMIS SYSTEM: EMAIL VALIDATION & SECURE STORAGE
// =================================================================

// Function-ka hubinaya Domain-ka Gmail-ka (MX Records)
const verifyEmailDomain = (email) => {
    const domain = email.split('@')[1];
    return domain ? resolveMailDomain(domain) : Promise.resolve(false);
};

// API Endpoint: Real-time validation iyo kaydin sugan (MySQL db.query)
app.post('/api/validate-and-save-email', checkSession, async (req, res) => {
    const { email, userId, action } = req.body; 

    if (req.session.id !== Number(userId)) {
        return res.status(403).json({ success: false, message: "Access denied: User ID mismatch" });
    }

    // 1. Hubi haddii iimaylku madhan yahay
    if (!email) {
        return res.status(400).json({ success: false, message: "Fadlan iimaylka soo geli!" });
    }

    // 2. Hubi qaabka guud ee Gmail-ka (Regex Check)
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: "Please enter a valid Gmail address with a reachable mail domain." 
        });
    }

    // 3. Hubi Domain-ka (MX Records)
    const hasValidDomain = await verifyEmailDomain(email);
    if (!hasValidDomain) {
        return res.status(400).json({ 
            success: false, 
            message: "Please enter a valid Gmail address with a reachable mail domain." 
        });
    }

    // 4. Hubi haddii iimaylkan uu qof kale nidaamka hore uga diiwaan geliyay (Orodka db.query)
// Waxaan u baddalnay 'contact_value' maadaama uu yahay magaca saxda ah ee miiskaaga database-ka
const checkQuery = 'SELECT * FROM user_contacts WHERE contact_value = ? AND contact_type = "email" AND user_id != ?';

db.query(checkQuery, [email, userId || 0], (err, results) => {
    if (err) {
        // Tani waxay terminal-ka Node.js kuugu soo qori doontaa qaladka rasmiga ah ee MySQL
        console.error("MySQL Check Error:", err);
        
        // Farriintan guud waxaad u baddali kartaa mid cad si aad u ogaato in dhibku database yahay
        return res.status(500).json({ 
            success: false, 
            message: "Cilad farsamo ayaa ka dhacday hubinta database-ka." 
        });
    }

    if (results.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Iimaylkan nidaamka waa lagu furi waayay, qof kale ayaa leh." 
        });
    }
    
    // Halkan wixii ka dambeeya koodhkaaga intiisa kale ha iska sii socoto...    // 5. Haddii la rabo in la kaydiyo (Marka la gujiyo badhanka Save Email)
        if (action === 'save') {
            const insertQuery = 'INSERT INTO user_contacts (user_id, email) VALUES (?, ?)';
            db.query(insertQuery, [userId, email], (insertErr, insertResults) => {
                if (insertErr) {
                    console.error("MySQL Insert Error:", insertErr);
                    return res.status(500).json({ success: false, message: "Waa laguu diiday inaad iimaylka kaydiso." });
                }
                return res.json({ success: true, message: "Email verified and saved successfully." });
            });
        } else {
            // Haddii uu yahay Real-time check kaliya (Inta uu wax qorayo)
            return res.json({ success: true, message: "Email verified successfully." });
        }
    });
});

// --- API 1: RAADINTA USER-KA ---
app.post('/api/search-user', (req, res) => {
    const { identifier } = req.body;
    
    // Tani waxay terminal-ka ku tusaysaa waxa qofku soo qoray
    console.log("Raadinaya user-ka:", identifier); 

    const sql = "SELECT id, username, email, phone, pic FROM users WHERE username = ? OR email = ? OR phone = ?";

    db.query(sql, [identifier, identifier, identifier], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length > 0) {
            const user = results[0];
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email ? user.email.replace(/(.{2})(.*)(?=@)/, "$1***") : "N/A",
                    phone: user.phone ? user.phone.replace(/.(?=.{4})/g, "*") : "N/A",
                    pic: user.pic
                }
            });
        } else {
            res.status(404).json({ success: false, message: "User-ka lama helin" });
        }
    });
});
 // Meesha code-ka lagu kaydinayo kumeelgaar ahaan

// 1. Xaqiijinta Code-ka (OTP)
app.post('/api/verify-otp', (req, res) => {
    const { userId, otp } = req.body;
    if (otpStore[userId] === otp) {
        res.json({ success: true, message: "Code-ka waa sax!" });
    } else {
        res.status(400).json({ success: false, message: "Code-ka aad gelisay waa khalad!" });
    }
});

// 2. Beddelidda Password-ka (Halkan ayuu React-kaagu raadinayaa)
app.post('/api/reset-password', async (req, res) => {
    const { userId, code, newPassword } = req.body;

    // 1. Hubi in code-ku uu yahay kii saxda ahaa ee otpStore ku jiray
    if (otpStore[userId] && otpStore[userId] === code.toString()) {
        
        // 2. Haddii uu sax yahay, beddel password-ka
        db.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "Database error" });

            delete otpStore[userId]; // Code-ka tirtir maadaama la isticmaalay
            res.json({ success: true, message: "Password-ka si sax ah ayaa loo beddelay!" });
        });
    } else {
        // Haddii code-ku qaldan yahay ama uu dhacay
        res.status(400).json({ success: false, message: "Code-ku waa khaldan yahay ama wuu dhacay!" });
    }
});
app.post('/api/send-otp', async (req, res) => {
    const { userId, method } = req.body;
    
    db.query("SELECT email, phone FROM users WHERE id = ?", [userId], async (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: "User error" });

        const user = results[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[userId] = otp;

        if (method === 'email') {
            try {
                await sendEmailOtp(user.email, otp);
                res.json({ success: true, message: "Code-ka waa la diray" });
            } catch (e) {
                delete otpStore[userId];
                res.status(503).json({ success: false, message: e.message });
            }
        } else {
            try {
                await sendSmsOtp(user.phone, otp);
                res.json({ success: true, message: "Code-ka waa la diray" });
            } catch (e) {
                delete otpStore[userId];
                res.status(503).json({ success: false, message: e.message });
            }
        }
    });
});
// --- CONTACT VERIFICATION ---
app.post('/api/send-contact-otp', checkSession, async (req, res) => {
    const { userId, type = 'email', value } = req.body;

    if (req.session.id !== Number(userId)) {
        return res.status(403).json({ success: false, message: "Access denied: User ID mismatch" });
    }

    const normalizedValue = String(value || '').trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue);
    const validPhone = /^\+[1-9]\d{7,14}$/.test(normalizedValue);
    if (!['email', 'phone'].includes(type) || (type === 'email' && !validEmail) || (type === 'phone' && !validPhone)) {
        return res.status(400).json({ success: false, message: type === 'phone' ? 'Enter a valid phone number in international format.' : 'Please enter a valid email address.' });
    }

    if (type === 'email') {
      const domain = normalizedValue.split('@')[1];
    const hasValidDomain = await new Promise((resolve) => {
        resolveMailDomain(domain).then(resolve);
    });

    if (!hasValidDomain) {
        return res.status(400).json({ success: false, message: "Please enter a real email address that is accepted by the mail server." });
    }
    }

    const created = createContactOtp(userId, type, normalizedValue);
    if (created.error) return res.status(429).json({ success: false, message: created.error });

    try {
        if (type === 'email') await sendEmailOtp(normalizedValue, created.otp);
        else await sendSmsOtp(normalizedValue, created.otp);
        res.json({ success: true, message: `Verification code sent to your ${type}.` });
    } catch (error) {
        contactOtpStore.delete(created.key);
        console.error(`${type} OTP send error:`, error.message);
        res.status(503).json({ success: false, message: error.message });
    }
});

app.post('/api/verify-contact-otp', checkSession, (req, res) => {
    const { userId, type = 'email', value, otp } = req.body;

    if (req.session.id !== Number(userId)) {
        return res.status(403).json({ success: false, message: "Access denied: User ID mismatch" });
    }

    const result = verifyContactOtpRecord(userId, type, String(value || '').trim(), otp);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.json({ success: true, message: `${type === 'phone' ? 'Phone' : 'Email'} verified successfully.` });
});

app.post('/api/add-contact', checkSession, (req, res) => {
    const { userId, type, value } = req.body;

    if (req.session.id !== Number(userId)) {
        return res.status(403).json({ success: false, message: "Access denied: User ID mismatch" });
    }

    if (!value) {
        return res.status(400).json({ success: false, message: "Fadlan buuxi meesha banaan!" });
    }

    if (type === 'email') {
        const record = contactOtpStore.get(getContactOtpKey(userId, type, value));
        if (!record || !record.verified || Date.now() > record.expiresAt) return res.status(400).json({ success: false, message: `Please verify the ${type} with its OTP before saving it.` });
    }
    const query = "INSERT INTO user_contacts (user_id, contact_type, contact_value) VALUES (?, ?, ?)";
    db.query(query, [userId, type, value], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        contactOtpStore.delete(getContactOtpKey(userId, type, value));
        res.json({ success: true, message: "Contact saved successfully." });
    });
});

app.get('/api/get-contacts/:userId', checkSession, (req, res) => {
    const userId = Number(req.params.userId);
    if (req.session.id !== userId) {
        return res.status(403).json({ success: false, message: "Access denied: User ID mismatch" });
    }
    const sql = "SELECT * FROM user_contacts WHERE user_id = ?";
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, contacts: results });
    });
});
// --- API 3: BEDDELISTA PASSWORD-KA ---
// --- API 4: CUSBOONAYSIINTA XOGTA (Settings Page) ---
// app.post('/api/update_contact', (req, res) => {
//     const { userId, email, phone } = req.body;
//     const sql = "UPDATE users SET email = ?, phone = ? WHERE id = ?";
//     db.query(sql, [email, phone, userId], (err) => {
//         if (err) return res.status(500).json({ success: false });
//         res.json({ success: true });
//     });
// });
// --- 3. Ka dhig folder-ka sawirada mid la heli karo (Static) ---
app.use('/assets/profiles', express.static(path.join(__dirname, 'assets/profiles')));

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id, username, role, pic, password FROM users WHERE username = ?";
    db.query(sql, [username], async (err, result) => {
        if (err) return res.status(500).json({ success: false });
        if (result.length > 0) {
            const user = result[0];
            
            if (password === user.password) {
                const sessionId = crypto.randomBytes(16).toString('hex');
                sessionStore[sessionId] = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    pic: user.pic,
                    lastSeenAt: Date.now()
                };
                touchLastSeen(user.id);
                return res.json({
                    success: true,
                    sessionId: sessionId,
                    id: user.id,
                    role: user.role,
                    username: user.username,
                    pic: user.pic
                });
            }
        }
        res.status(401).json({ success: false, message: "Username ama Password khaldan" });
    });
});

app.post('/api/verify-session', (req, res) => {
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    if (sessionId && sessionStore[sessionId]) {
        return res.json({ success: true, user: sessionStore[sessionId] });
    }
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
});

app.post('/api/logout', (req, res) => {
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    if (sessionId) {
        delete sessionStore[sessionId];
    }
    res.json({ success: true });
});
// 2. Messaging System
app.post('/api/messages', checkSession, upload.single('attachment'), (req, res) => {
    const { message, receiver } = req.body;
    const text = String(message || '').trim();
    const attachment = req.file ? req.file.filename : null;
    const senderId = Number(req.session.id);
    const receiverId = Number(receiver);

    if (!receiver || (!text && !req.file) || !Number.isInteger(receiverId) || receiverId <= 0) {
        return res.status(400).json({ error: "Xogta qaar ayaa maqan" });
    }

    db.query("SELECT id FROM users WHERE id = ?", [receiverId], (userErr, users) => {
      if (userErr) return res.status(500).json({ error: userErr.sqlMessage });
      if (users.length === 0) return res.status(404).json({ error: "Recipient not found" });

      const messageType = classifyMessageType(req.file);
      const originalName = req.file ? path.basename(req.file.originalname || req.file.filename) : null;
      const mimeType = req.file ? req.file.mimetype : null;
      const fileSize = req.file ? req.file.size : null;
      const sql = "INSERT INTO messages (sender, receiver, message, attachment, message_type, attachment_original_name, attachment_mime_type, attachment_size, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)";
      db.query(sql, [String(senderId), String(receiverId), text, attachment, messageType, originalName, mimeType, fileSize], (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.status(200).json({ success: true, id: result.insertId, message_type: messageType, attachment });
      });
    });
});

// Roles each role may exchange messages with (mirrors the FariimahaModal directory).
// Roles not listed (Urur, medic, admin) may message everyone.
const messagingContactRoles = {
    S1: ['H1', 'Urur', 'medic', 'admin'], S2: ['H2', 'Urur', 'medic', 'admin'],
    S3: ['H3', 'Urur', 'medic', 'admin'], S4: ['H4', 'Urur', 'medic', 'admin'],
    H1: ['S1', 'Urur', 'medic', 'admin'], H2: ['S2', 'Urur', 'medic', 'admin'],
    H3: ['S3', 'Urur', 'medic', 'admin'], H4: ['S4', 'Urur', 'medic', 'admin']
};

app.get('/api/messages/unread-summary', checkSession, (req, res) => {
    // Only count messages the user can actually open: the sender must exist, must not be
    // the user themself, and must be a contact the user's role is allowed to message.
    // Unread messages from anyone else can never be marked read and inflated the badge.
    const contactRoles = messagingContactRoles[req.session.role];
    let sql = `SELECT u.id AS sender_id, COUNT(DISTINCT m.id) AS unread_count
               FROM messages m
               JOIN users u ON u.id = CAST(m.sender AS SIGNED)
               WHERE CAST(m.receiver AS SIGNED) = ? AND m.is_read = 0 AND u.id <> ?`;
    const params = [req.session.id, req.session.id];
    if (contactRoles) {
        sql += ` AND u.role IN (?)`;
        params.push(contactRoles);
    }
    sql += ` GROUP BY u.id`;
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        const bySender = {};
        let total = 0;
        (rows || []).forEach((row) => {
            const count = Number(row.unread_count) || 0;
            bySender[String(row.sender_id)] = count;
            total += count;
        });
        res.json({ total, bySender });
    });
});

app.post('/api/messages/mark-read', checkSession, (req, res) => {
    const senderId = Number(req.body.senderId);
    if (!Number.isInteger(senderId) || senderId <= 0) {
        return res.status(400).json({ error: "Invalid sender" });
    }
    const sql = `UPDATE messages SET is_read = 1
                 WHERE CAST(receiver AS SIGNED) = ? AND CAST(sender AS SIGNED) = ? AND is_read = 0`;
    db.query(sql, [req.session.id, senderId], (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json({ success: true, updated: result.affectedRows });
    });
});

app.get('/api/messages/chat/:user1/:user2', checkSession, (req, res) => {
    const user1Id = Number(req.params.user1);
    const user2Id = Number(req.params.user2);
    const { id, role } = req.session;

    if (!user1Id || !user2Id) {
        return res.status(400).json({ error: "Invalid message participants" });
    }

    if (id !== user1Id && id !== user2Id && !['Urur', 'admin'].includes(role)) {
        return res.status(403).json({ error: "Access denied" });
    }

    const sql = "SELECT * FROM messages WHERE (CAST(sender AS SIGNED) = ? AND CAST(receiver AS SIGNED) = ?) OR (CAST(sender AS SIGNED) = ? AND CAST(receiver AS SIGNED) = ?) ORDER BY created_at ASC";
    db.query(sql, [user1Id, user2Id, user2Id, user1Id], (err, results) => {
        if (err) return res.status(500).json(err);
        const otherId = id === user1Id ? user2Id : user1Id;
        db.query(
            "UPDATE messages SET is_read = 1 WHERE CAST(receiver AS SIGNED) = ? AND CAST(sender AS SIGNED) = ? AND is_read = 0",
            [id, otherId],
            () => {}
        );
        res.json(results);
    });
});

// 3. Sarkaalka Data (Universal Route for S1, S2, S3, S4)
// Waxaad isticmaali kartaa hal route oo 'user_id' leh si code-ka u yaraado
app.post('/api/sarkaal-save', upload.single('profile_pic'), (req, res) => {
    const { user_id, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;
    const profile_pic = req.file ? `uploads/${req.file.filename}` : null;
    const sql = "INSERT INTO sarkaal_data (user_id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Xogta waa la kaydiyey');
    });
});


// Qaybta Update-ka ee Email-ka iyo Taleefanka
// update contact
// --- 2. API-KA WAX KA BEDDELKA EMAIL-KA (UPDATE) ---
app.post('/api/update-contact', checkSession, (req, res) => {
    const { contactId, value, type } = req.body;

    if (!value) {
        return res.status(400).json({ success: false, message: "Fadlan buuxi meesha banaan!" });
    }

    db.query("SELECT user_id FROM user_contacts WHERE id = ?", [contactId], (err, results) => {
        if (err || results.length === 0 || results[0].user_id !== req.session.id) {
            return res.status(403).json({ success: false, message: "Access denied: Contact ownership verification failed" });
        }

        const record = contactOtpStore.get(getContactOtpKey(req.session.id, type, value));
        if (!record || !record.verified || Date.now() > record.expiresAt) {
            return res.status(400).json({ success: false, message: `Please verify the ${type} with its OTP before saving it.` });
        }
        const query = "UPDATE user_contacts SET contact_value = ? WHERE id = ? AND contact_type = ?";
        db.query(query, [value, contactId, type], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "Database error" });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Contact not found." });
            contactOtpStore.delete(getContactOtpKey(req.session.id, type, value));
            res.json({ success: true, message: "Contact updated successfully." });
        });
    });
});

app.post('/api/delete-contact', checkSession, (req, res) => {
    const { contactId, userId } = req.body;

    if (req.session.id !== Number(userId)) {
        return res.status(403).json({ success: false, message: "Access denied: User ID mismatch" });
    }

    if (!contactId) {
        return res.status(400).json({ success: false, message: "Contact ID lama helin!" });
    }

    db.query("SELECT user_id FROM user_contacts WHERE id = ?", [contactId], (err, results) => {
        if (err || results.length === 0 || results[0].user_id !== req.session.id) {
            return res.status(403).json({ success: false, message: "Access denied: Contact ownership verification failed" });
        }

        // Query-ga tirtirista xogta
        const query = "DELETE FROM user_contacts WHERE id = ?";
        
        db.query(query, [contactId], (err, result) => {
            if (err) {
                console.error("Cilad dhacday intii la tirtirayay:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Xogtan lama helin ama horey ayaa loo tirtiray" });
            }

            // Haddii si guul leh loo tirtiro
            res.json({ success: true, message: "Si guul leh ayaa loo tirtiray!" });
        });
    });
});

// Function-ka kaydinta si uusan code-ku isku dhex dabin
function saveToDatabase(contactId, value, res) {
    const sql = "UPDATE user_contacts SET contact_value = ? WHERE id = ?";
    db.query(sql, [value, contactId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (result.affectedRows === 0) return res.json({ success: false, message: "Contact lama helin" });
        
        return res.json({ success: true, message: "Si guul leh ayaa loo beddelay!" });
    });
}
// 4. Update Sarkaalka Data
app.put('/api/sarkaal-update/:id', upload.single('profile_pic'), (req, res) => {
    const { id } = req.params;
    const { name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;
    
    let sql = "";
    let values = [];

    if (req.file) {
        const profile_pic = `uploads/${req.file.filename}`;
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=?, profile_pic=? WHERE id=?`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, profile_pic, id];
    } else {
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=? WHERE id=?`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, id];
    }

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.send("Xogta waa la cusubaysiiyey");
    });
});

// 5. Medical & Queue System
// --- 2. MESSAGES RECEIVER ENDPOINT ---
app.get('/api/messages/:receiverId', checkSession, (req, res) => {
    const receiverId = Number(req.params.receiverId);

    if (req.session.id !== receiverId && !['Urur', 'admin'].includes(req.session.role)) {
        return res.status(403).json({ error: "Access denied" });
    }

    // SQL query si looga soo saaro database-ka fariimaha loo diray qofkaas
    const sql = "SELECT * FROM messages WHERE receiver = ? OR sender = ? ORDER BY created_at ASC";
    
    db.query(sql, [String(receiverId), String(receiverId)], (err, result) => {
        if (err) return res.status(500).json(err);
        res.send(result);
    });
});
// Duplicate LOGIN API removed for secure session flow


app.post('/api/s1-data', checkSession, authorizeRoles('S1'), upload.single('profile_pic'), (req, res) => {
    const { sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;
    const profile_pic = req.file ? `uploads/${req.file.filename}` : null;

    // Check if form is closed
    const checkClosureSql = "SELECT * FROM form_closure WHERE user_id = 1 AND role = 'S1' AND is_closed = TRUE";
    db.query(checkClosureSql, (err, closureResult) => {
        if (err) return res.status(500).send(err);
        
        if (closureResult.length > 0) {
            return res.status(403).json({ success: false, message: "Form-ka waa la xiray, ma heli karto inaad xog ku darto." });
        }

        const sql = "INSERT INTO sarkaal_data (user_id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        db.query(sql, [req.session.id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada], (err, result) => {
            if (err) return res.status(500).send(err);
            res.send('Data Saved for S1');
        });
    });
});

app.get('/api/s1-data', checkSession, authorizeRoles('S1', 'H1', 'Urur', 'medic'), (req, res) => {
    const sql = "SELECT s.* FROM sarkaal_data s JOIN users u ON u.id = s.user_id WHERE u.role = ?";
    db.query(sql, [dataOwnerRole[req.session.role] || 'S1'], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// ==========================================
// GET ALL USERS FOR MESSAGING
// ==========================================
app.get('/api/users', checkSession, (req, res) => {
    const sql = "SELECT id, username, role, pic, last_seen FROM users WHERE role != ? ORDER BY FIELD(role, 'S2', 'S3', 'S4', 'H1', 'H2', 'H3', 'H4', 'Urur', 'medic', 'admin'), username ASC";
    db.query(sql, [req.session.role], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json((result || []).map((user) => ({
            ...user,
            is_online: isUserOnline(user.id)
        })));
    });
});

app.get('/api/user/:id', checkSession, (req, res) => {
    const userId = Number(req.params.id);
    if (req.session.id !== userId && !['Urur', 'admin'].includes(req.session.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    db.query('SELECT id, username, role, pic FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (result.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.json(result[0]);
    });
});

// ==========================================
// 3. S2 DATA API (Xogta Askarta S2 - User 2)
// ==========================================
app.post('/api/s2-data', checkSession, authorizeRoles('S2'), upload.single('profile_pic'), (req, res) => {
    const { sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;
    const profile_pic = req.file ? `uploads/${req.file.filename}` : null;
    const sql = "INSERT INTO sarkaal_data (user_id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [req.session.id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Data Saved for S2');
    });
});

app.get('/api/s2-data', checkSession, authorizeRoles('S2', 'H2', 'Urur', 'medic'), (req, res) => {
    const sql = "SELECT s.* FROM sarkaal_data s JOIN users u ON u.id = s.user_id WHERE u.role = ?";
    db.query(sql, [dataOwnerRole[req.session.role] || 'S2'], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// ==========================================
// 4. S3 DATA API (Xogta Askarta S3 - User 3)
// ==========================================
app.post('/api/s3-data', checkSession, authorizeRoles('S3'), upload.single('profile_pic'), (req, res) => {
    const { sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;
    const profile_pic = req.file ? `uploads/${req.file.filename}` : null;
    const sql = "INSERT INTO sarkaal_data (user_id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [req.session.id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Data Saved for S3');
    });
});

app.get('/api/s3-data', checkSession, authorizeRoles('S3', 'H3', 'Urur', 'medic'), (req, res) => {
    const sql = "SELECT s.* FROM sarkaal_data s LEFT JOIN users u ON u.id = s.user_id WHERE u.role = ? OR s.user_id = 17 OR s.user_id = 3";
    db.query(sql, [dataOwnerRole[req.session.role] || 'S3'], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});


// ==========================================
// 5. S4 DATA API (Xogta Askarta S4 - User 4)
// ==========================================
app.post('/api/s4-data', checkSession, authorizeRoles('S4'), upload.single('profile_pic'), (req, res) => {
    const { sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;
    const profile_pic = req.file ? `uploads/${req.file.filename}` : null;
    
    const sql = "INSERT INTO sarkaal_data (user_id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')";
    
    db.query(sql, [req.session.id, profile_pic, sarkaal_id, name, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada], (err, result) => {
        if (err) {
            console.error("SQL Error S4:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.send('Data Saved for S4 with ID 4');
    });
});

app.get('/api/s4-data', checkSession, authorizeRoles('S4', 'H4', 'Urur', 'medic'), (req, res) => {
    const sql = "SELECT s.* FROM sarkaal_data s JOIN users u ON u.id = s.user_id WHERE u.role = ?";
    db.query(sql, [dataOwnerRole[req.session.role] || 'S4'], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// ==========================================
// 6. MEDICAL RECORDS (LA HAGAAJIYEY: S1 wuxuu arkaa xogtiisa)
// ==========================================
app.get('/api/medical-records', checkSession, (req, res) => {
    const { role } = req.session;
    let allowedUserId = null;
    
    if (['S1', 'H1'].includes(role)) {
        allowedUserId = 1;
    } else if (['S2', 'H2'].includes(role)) {
        allowedUserId = 2;
    } else if (['S3', 'H3'].includes(role)) {
        allowedUserId = 3;
    } else if (['S4', 'H4'].includes(role)) {
        allowedUserId = 4;
    }
    
    let sql = `
        SELECT m.*, s.name, s.sarkaal_id, s.profile_pic,
        CASE 
            WHEN s.user_id = 1 THEN 'Horinta 1aad'
            WHEN s.user_id = 2 THEN 'Horinta 2aad'
            WHEN s.user_id = 3 THEN 'Horinta 3aad'
            WHEN s.user_id = 4 THEN 'Horinta 4aad'
            ELSE 'Unknown'
        END AS horinta
        FROM medical_records m
        JOIN sarkaal_data s ON m.sarkaal_data_id = s.id`;
    
    let params = [];
    if (allowedUserId !== null) {
        sql += " WHERE s.user_id = ?";
        params.push(allowedUserId);
    } else {
        const { user_id } = req.query;
        if (user_id) {
            sql += " WHERE s.user_id = ?";
            params.push(user_id);
        }
    }
    
    sql += " ORDER BY m.created_at DESC";
    
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.get('/api/medical-records/:sarkaal_data_id', checkSession, (req, res) => {
    const { sarkaal_data_id } = req.params;
    const { role } = req.session;
    
    const sql = `
        SELECT m.*, s.name, s.sarkaal_id, s.profile_pic, s.user_id
        FROM medical_records m
        JOIN sarkaal_data s ON m.sarkaal_data_id = s.id
        WHERE m.sarkaal_data_id = ?
        ORDER BY m.created_at DESC`;
    
    db.query(sql, [sarkaal_data_id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length === 0) return res.json([]);
        
        const recordUserId = result[0].user_id;
        let authorized = false;
        if (['Urur', 'medic'].includes(role)) {
            authorized = true;
        } else if (['S1', 'H1'].includes(role) && recordUserId === 1) {
            authorized = true;
        } else if (['S2', 'H2'].includes(role) && recordUserId === 2) {
            authorized = true;
        } else if (['S3', 'H3'].includes(role) && recordUserId === 3) {
            authorized = true;
        } else if (['S4', 'H4'].includes(role) && recordUserId === 4) {
            authorized = true;
        }
        
        if (!authorized) {
            return res.status(403).json({ success: false, message: "Access denied: Unauthorized medical history access" });
        }
        
        res.json(result);
    });
});

app.post('/api/ballan', checkSession, authorizeRoles('S1', 'S2', 'S3', 'S4'), (req, res) => {
    const { sarkaal_data_id } = req.body;
    const personId = Number(sarkaal_data_id);
    const ownerRole = dataOwnerRole[req.session.role];

    if (!Number.isInteger(personId) || personId <= 0) {
        return res.status(400).json({ success: false, message: "Sarkaalka lama aqoonsan" });
    }

    const sql = `INSERT INTO queue_list
                (sarkaal_data_id, user_id, profile_pic, sarkaal_id, name, status)
                SELECT s.id, ?, s.profile_pic, s.sarkaal_id, s.name, 'Pending'
                FROM sarkaal_data s
                LEFT JOIN users u ON u.id = s.user_id
                WHERE s.id = ? AND (u.role = ? OR s.user_id = ? OR (s.user_id = 3 AND ? = 'S3'))`;

    db.query(sql, [req.session.id, personId, ownerRole, req.session.id, ownerRole], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: "Sarkaalkan mar hore ayaa safka lagu daray!" });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: `Sarkaalka ${req.session.role} lama helin` });
        }
        res.status(200).json({
            success: true,
            personId,
            destination: `H${req.session.role.slice(1)}`,
            status: 'Pending',
            message: `Sarkaalka waxaa loo gudbiyay ${req.session.role}`
        });
    });
});

app.get('/api/ballan/queue', checkSession, (req, res) => {
    const { role } = req.session;
    const ownerRole = dataOwnerRole[role];

    let sql = `
        SELECT s.*, q.id AS queue_id, q.sarkaal_data_id, q.user_id AS queue_user_id,
        q.status, q.created_at AS queue_created_at,
        CASE 
            WHEN s.user_id = 1 THEN 'Horinta 1aad'
            WHEN s.user_id = 2 THEN 'Horinta 2aad'
            WHEN s.user_id IN (3, 17) THEN 'Horinta 3aad'
            WHEN s.user_id IN (4, 20) THEN 'Horinta 4aad'
            ELSE 'Unknown'
        END AS horinta
        FROM queue_list q
        INNER JOIN sarkaal_data s ON s.id = q.sarkaal_data_id
        WHERE q.status = 'Pending'
        AND q.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`;

    let params = [];
    if (ownerRole) {
        sql += " AND (q.user_id IN (SELECT id FROM users WHERE role = ?) OR (? = 'S3' AND q.user_id IN (3, 17)) OR (? = 'S4' AND q.user_id IN (4, 20)))";
        params.push(ownerRole, ownerRole, ownerRole);
    } else {
        const { user_id } = req.query;
        if (user_id) {
            sql += " AND q.user_id = ?";
            params.push(user_id);
        }
    }

    sql += ` ORDER BY q.created_at ASC`;
        
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// Every referral to the medical section (all statuses), for monthly statistics.
// Uses the same division scoping as /api/ballan/queue; read-only.
app.get('/api/ballan/referrals', checkSession, (req, res) => {
    const ownerRole = dataOwnerRole[req.session.role];

    let sql = `
        SELECT q.id AS queue_id, q.sarkaal_data_id, q.status, q.created_at AS referred_at,
        s.sarkaal_id, s.name, s.profile_pic, s.culays, s.dhiiga, s.dhirirka,
        s.goobta_dhalashada, s.tariikhda_dhalashada, s.status AS personnel_status, s.id
        FROM queue_list q
        INNER JOIN sarkaal_data s ON s.id = q.sarkaal_data_id`;

    const params = [];
    if (ownerRole) {
        sql += " WHERE (q.user_id IN (SELECT id FROM users WHERE role = ?) OR (? = 'S3' AND q.user_id IN (3, 17)) OR (? = 'S4' AND q.user_id IN (4, 20)))";
        params.push(ownerRole, ownerRole, ownerRole);
    } else if (req.query.user_id) {
        sql += " WHERE q.user_id = ?";
        params.push(req.query.user_id);
    }

    sql += " ORDER BY q.created_at DESC";

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.delete('/api/ballan/cancel/:id', checkSession, (req, res) => {
    const { id } = req.params;
    const { role } = req.session;
    const ownerRole = dataOwnerRole[role];
    if (!ownerRole) {
        return res.status(403).json({ success: false, message: 'Only S1-S4 can cancel their own queue items' });
    }

    const sql = "DELETE FROM queue_list WHERE sarkaal_data_id = ? AND status = 'Pending' AND (user_id IN (SELECT id FROM users WHERE role = ?) OR (? = 'S3' AND user_id IN (3, 17)) OR (? = 'S4' AND user_id IN (4, 20)))";
    const params = [id, ownerRole, ownerRole, ownerRole];
    
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send("Sarkaalka waa laga saaray safka");
    });
});

// ==========================================
// 8. MEDICAL OFFICER (Complete Medical)
// ==========================================
app.post('/api/complete-medical', checkSession, authorizeRoles('medic'), (req, res) => {
    const {
        queue_id,
        sarkaal_data_id,
        diagnosis,
        limitation,
        days,
        referrals
    } = req.body;

    const sqlMedical = `
        INSERT INTO medical_records
        (sarkaal_data_id, user_id, profile_pic, sarkaal_id, name, diagnosis, limitation, days, referrals)
        SELECT id, user_id, profile_pic, sarkaal_id, name, ?, ?, ?, ?
        FROM sarkaal_data WHERE id = ?`;

    // Claim the queue entry first: it must still be Pending and inside its 24-hour window.
    // Done in one transaction so an expired or already-completed entry never gets a
    // medical record, and a double submit cannot create two records.
    const sqlUpdateStatus = `UPDATE queue_list SET status = 'Completed'
                             WHERE id = ? AND sarkaal_data_id = ? AND status = 'Pending'
                             AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`;

    const rollback = (status, body) => db.rollback(() => res.status(status).json(body));

    db.beginTransaction((txErr) => {
        if (txErr) return res.status(500).json({ error: "Xogta lama kaydin" });

        db.query(sqlUpdateStatus, [queue_id, sarkaal_data_id], (err2, result2) => {
            if (err2) {
                console.error("Update Status Error:", err2);
                return rollback(500, { error: "Status-ka lama beddelin" });
            }
            if (result2.affectedRows === 0) {
                return rollback(409, { error: "Queue item is missing, expired or already completed" });
            }

            db.query(sqlMedical, [diagnosis, limitation, days, referrals, sarkaal_data_id], (err, result) => {
                if (err || result.affectedRows === 0) {
                    console.error("Medical Record Error:", err);
                    return rollback(500, { error: "Xogta lama kaydin" });
                }
                db.commit((commitErr) => {
                    if (commitErr) return rollback(500, { error: "Xogta lama kaydin" });
                    res.status(200).json({ success: true, message: "Baaritaanka waa la dhamaystiray!" });
                });
            });
        });
    });
});

// ==========================================
// 9. SARKAL ALL DATA (Xogta Guud ee Horimada)
// ==========================================
app.get('/api/sarkaal-data', checkSession, (req, res) => {
    const { role } = req.session;
    let sql = `
        SELECT *, 
        CASE 
            WHEN user_id = 1 THEN 'Horinta 1aad'
            WHEN user_id = 2 THEN 'Horinta 2aad'
            WHEN user_id = 3 THEN 'Horinta 3aad'
            WHEN user_id = 4 THEN 'Horinta 4aad'
            ELSE 'Unknown'
        END AS horinta
        FROM sarkaal_data`;
    let params = [];
    if (['S1', 'H1'].includes(role)) {
        sql += " WHERE user_id = 1";
    } else if (['S2', 'H2'].includes(role)) {
        sql += " WHERE user_id = 2";
    } else if (['S3', 'H3'].includes(role)) {
        sql += " WHERE user_id = 3";
    } else if (['S4', 'H4'].includes(role)) {
        sql += " WHERE user_id = 4";
    }
    sql += " ORDER BY id DESC";

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.put('/api/cancel-status/:id', checkSession, (req, res) => {
    const { id } = req.params;
    const { role } = req.session;
    let allowedUserId = null;
    if (role === 'S1') allowedUserId = 1;
    else if (role === 'S2') allowedUserId = 2;
    else if (role === 'S3') allowedUserId = 3;
    else if (role === 'S4') allowedUserId = 4;
    
    let sql = "DELETE FROM queue_list WHERE sarkaal_data_id = ?"; 
    let params = [id];
    if (allowedUserId !== null) {
        sql += " AND user_id = ?";
        params.push(allowedUserId);
    }
    
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.send("Sarkaalka waa laga saaray safka");
    });
});

app.delete('/api/sarkaal/delete/:id', checkSession, (req, res) => {
    const { id } = req.params;
    const { role } = req.session;

    let allowedUserId = null;
    if (role === 'S1') allowedUserId = 1;
    else if (role === 'S2') allowedUserId = 2;
    else if (role === 'S3') allowedUserId = 3;
    else if (role === 'S4') allowedUserId = 4;

    if (allowedUserId === null && !['Urur', 'admin'].includes(role)) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    db.query("SELECT user_id FROM sarkaal_data WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: "Sarkaalka lama helin." });

        if (allowedUserId !== null && results[0].user_id !== allowedUserId) {
            return res.status(403).json({ success: false, message: "Access denied: Cannot delete personnel from other Horinta" });
        }

        const sql = "DELETE FROM sarkaal_data WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("SQL Error:", err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Laguma tirtiri karo sarkaalka xogtiisa meel kale oo furan darteed." 
                });
            }
            res.json({ success: true, message: "Xogta sarkaalka si guul leh ayaa loo tirtiray." });
        });
    });
});

app.put('/api/s1-data/:id', checkSession, authorizeRoles('S1'), upload.single('profile_pic'), (req, res) => {
    const { id } = req.params;
    const { name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;

    // Check if form is closed
    const checkClosureSql = "SELECT * FROM form_closure WHERE user_id = 1 AND role = 'S1' AND is_closed = TRUE";
    db.query(checkClosureSql, (err, closureResult) => {
        if (err) return res.status(500).send(err);
        
        if (closureResult.length > 0) {
            return res.status(403).json({ success: false, message: "Form-ka waa la xiray, ma heli karto inaad xog ku beddesho." });
        }

        let sql = "";
        let values = [];

        if (req.file) {
            const profile_pic = `uploads/${req.file.filename}`;
            sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=?, profile_pic=? WHERE id=? AND user_id=?`;
            values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, profile_pic, id, req.session.id];
        } else {
            sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=? WHERE id=? AND user_id=?`;
            values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, id, req.session.id];
        }

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Cilad SQL:", err);
                return res.status(500).json({ error: err.message });
            }
            res.send("Xogta si guul leh ayaa loo cusubaysiiyey");
        });
    });
});

app.delete('/api/s1-data/:id', checkSession, authorizeRoles('S1'), (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM sarkaal_data WHERE id=? AND user_id=?", [id, req.session.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Personnel deleted" });
    });
});

app.put('/api/s2-data/:id', checkSession, authorizeRoles('S2'), upload.single('profile_pic'), (req, res) => {
    const { id } = req.params;
    const { name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;

    let sql = "";
    let values = [];

    if (req.file) {
        const profile_pic = `uploads/${req.file.filename}`;
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=?, profile_pic=? WHERE id=? AND user_id=?`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, profile_pic, id, req.session.id];
    } else {
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=? WHERE id=? AND user_id=?`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, id, req.session.id];
    }

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Cilad SQL:", err);
            return res.status(500).json({ error: err.message });
        }
        res.send("Xogta si guul leh ayaa loo cusubaysiiyey");
    });
});

app.delete('/api/s2-data/:id', checkSession, authorizeRoles('S2'), (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM sarkaal_data WHERE id=? AND user_id=?", [id, req.session.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Personnel deleted" });
    });
});

app.put('/api/s3-data/:id', checkSession, authorizeRoles('S3'), upload.single('profile_pic'), (req, res) => {
    const { id } = req.params;
    const { name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;

    let sql = "";
    let values = [];

    if (req.file) {
        const profile_pic = `uploads/${req.file.filename}`;
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=?, profile_pic=? WHERE id=? AND (user_id=? OR user_id=3)`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, profile_pic, id, req.session.id];
    } else {
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=? WHERE id=? AND (user_id=? OR user_id=3)`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, id, req.session.id];
    }

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.send("Xogta si guul leh ayaa loo cusubaysiiyey");
    });
});

app.delete('/api/s3-data/:id', checkSession, authorizeRoles('S3'), (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM sarkaal_data WHERE id=? AND user_id=?", [id, req.session.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Personnel deleted" });
    });
});

app.put('/api/s4-data/:id', checkSession, authorizeRoles('S4'), upload.single('profile_pic'), (req, res) => {
    const { id } = req.params;
    const { name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada } = req.body;

    let sql = "";
    let values = [];

    if (req.file) {
        const profile_pic = `uploads/${req.file.filename}`;
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=?, profile_pic=? WHERE id=? AND user_id=?`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, profile_pic, id, req.session.id];
    } else {
        sql = `UPDATE sarkaal_data SET name=?, sarkaal_id=?, culays=?, dhiiga=?, dhirirka=?, goobta_dhalashada=?, tariikhda_dhalashada=? WHERE id=? AND user_id=?`;
        values = [name, sarkaal_id, culays, dhiiga, dhirirka, goobta_dhalashada, tariikhda_dhalashada, id, req.session.id];
    }

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.send("Xogta si guul leh ayaa loo cusubaysiiyey");
    });
});

app.delete('/api/s4-data/:id', checkSession, authorizeRoles('S4'), (req, res) => {
  const { id } = req.params;
    db.query("DELETE FROM sarkaal_data WHERE id=? AND user_id=?", [id, req.session.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Personnel deleted" });
  });
});

// ==========================================
// 10. FORM CLOSURE SYSTEM (XIR FORMKA)
// ==========================================

// Check form closure status
app.get('/api/form-closure/:userId', checkSession, (req, res) => {
  const userId = req.params.userId;
  const { role } = req.session;

  if (req.session.id !== Number(userId) && !['Urur', 'admin'].includes(role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const sql = "SELECT * FROM form_closure WHERE user_id = ? AND role = ?";
  db.query(sql, [userId, role], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (result.length > 0) {
      res.json({ success: true, isClosed: result[0].is_closed, closedAt: result[0].closed_at });
    } else {
      res.json({ success: true, isClosed: false });
    }
  });
});

// Close form
app.post('/api/form-closure/close', checkSession, (req, res) => {
  const { userId, role } = req.body;
  const { role: sessionRole } = req.session;

  if (sessionRole !== role || req.session.id !== Number(userId)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const checkSql = "SELECT * FROM form_closure WHERE user_id = ? AND role = ?";
  db.query(checkSql, [userId, role], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.length > 0) {
      const updateSql = "UPDATE form_closure SET is_closed = TRUE, closed_at = NOW() WHERE user_id = ? AND role = ?";
      db.query(updateSql, [userId, role], (updateErr, updateResult) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({ success: true, message: "Form closed successfully" });
      });
    } else {
      const insertSql = "INSERT INTO form_closure (user_id, role, is_closed, closed_at) VALUES (?, ?, TRUE, NOW())";
      db.query(insertSql, [userId, role], (insertErr, insertResult) => {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        res.json({ success: true, message: "Form closed successfully" });
      });
    }
  });
});

app.post('/api/form-closure/reopen', checkSession, (req, res) => {
  const { userId, role } = req.body;
  const { role: sessionRole } = req.session;

  if (sessionRole !== role || req.session.id !== Number(userId)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const reopenSql = "UPDATE form_closure SET is_closed = FALSE, closed_at = NULL WHERE user_id = ? AND role = ?";
  db.query(reopenSql, [userId, role], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Form reopened successfully" });
  });
});

// ==========================================
// 11. ANALYTICS API
// ==========================================
app.get('/api/analytics', checkSession, (req, res) => {
  const analyticsQueries = [
    "SELECT COUNT(*) as total FROM sarkaal_data",
    "SELECT COUNT(*) as total FROM medical_reports",
    "SELECT COUNT(*) as total FROM queue_list WHERE status = 'Pending'",
    "SELECT COUNT(*) as total FROM medical_reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
    "SELECT user_id, COUNT(*) as count FROM sarkaal_data GROUP BY user_id",
    "SELECT diagnosis, COUNT(*) as count FROM medical_reports WHERE diagnosis IS NOT NULL GROUP BY diagnosis LIMIT 10",
    "SELECT MONTH(created_at) as month, COUNT(*) as count FROM medical_reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY MONTH(created_at) ORDER BY month",
    "SELECT id, sarkaal_id, name, created_at FROM sarkaal_data ORDER BY created_at DESC LIMIT 5"
  ];

  Promise.all(analyticsQueries.map(sql => 
    new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(([totalPersonnel, totalMedicalRecords, totalQueue, recentReports, personnelByHorinta, diagnosisDistribution, monthlyActivity, recentPersonnel]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyChartData = Array.from({ length: 7 }, (_, i) => {
      const currentMonth = new Date().getMonth() - 6 + i;
      const adjustedMonth = currentMonth < 0 ? currentMonth + 12 : currentMonth;
      const monthData = monthlyActivity.find(m => m.month === adjustedMonth + 1);
      return {
        name: monthNames[adjustedMonth],
        value: monthData ? monthData.count : 0
      };
    });

    res.json({ 
      totalPersonnel: totalPersonnel[0].total, 
      totalMedicalRecords: totalMedicalRecords[0].total, 
      totalQueue: totalQueue[0].total,
      recentReports: recentReports[0].total,
      personnelByHorinta: personnelByHorinta.map(p => ({ 
        name: `Horinta ${p.user_id}`, 
        value: p.count 
      })),
      diagnosisDistribution: diagnosisDistribution.map(d => ({ 
        name: d.diagnosis || 'Other', 
        value: d.count 
      })),
      monthlyActivity: monthlyChartData,
      recentActivity: recentPersonnel.map(p => ({
        id: p.id,
        sarkaal_id: p.sarkaal_id,
        name: p.name,
        created_at: p.created_at
      }))
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// H1 analytics remain isolated from the system-wide analytics view.
app.get('/api/h1-analytics', checkSession, authorizeRoles('H1'), (req, res) => {
    const queries = [
        "SELECT COUNT(*) AS total FROM sarkaal_data WHERE user_id = 1",
        "SELECT COUNT(*) AS total FROM medical_records WHERE user_id = 1",
        "SELECT COUNT(*) AS total FROM queue_list WHERE user_id = 1 AND status = 'Pending'",
        "SELECT COUNT(*) AS total FROM medical_records WHERE user_id = 1 AND referrals = 'Yes'",
        "SELECT status, COUNT(*) AS count FROM queue_list WHERE user_id = 1 GROUP BY status",
        "SELECT MONTH(created_at) AS month, COUNT(*) AS count FROM medical_records WHERE user_id = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY MONTH(created_at) ORDER BY month"
    ];

    Promise.all(queries.map(sql => new Promise((resolve, reject) => {
        db.query(sql, (err, result) => err ? reject(err) : resolve(result));
    }))).then(([personnel, processed, pending, referred, status, monthly]) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyActivity = Array.from({ length: 7 }, (_, index) => {
            const monthIndex = (new Date().getMonth() - 6 + index + 12) % 12;
            const match = monthly.find(item => Number(item.month) === monthIndex + 1);
            return { name: monthNames[monthIndex], value: match ? Number(match.count) : 0 };
        });

        res.json({
            totalPersonnel: Number(personnel[0].total),
            totalProcessed: Number(processed[0].total),
            totalPending: Number(pending[0].total),
            totalReferred: Number(referred[0].total),
            statusDistribution: status.map(item => ({ name: item.status || 'Unknown', value: Number(item.count) })),
            monthlyActivity
        });
    }).catch(err => res.status(500).json({ error: err.message }));
});

// ==========================================
// 12. USER PROFILE UPDATE API
// ==========================================
app.put('/api/user/:id', checkSession, (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  const { role } = req.session;

  if (req.session.id !== Number(id) && !['Urur', 'admin'].includes(role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const sql = "UPDATE users SET username = ? WHERE id = ?";
  db.query(sql, [username, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Profile updated successfully" });
  });
});

// ==========================================
// 13. PASSWORD UPDATE API
// ==========================================
app.put('/api/user/:id/password', checkSession, (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  const { role } = req.session;

  if (req.session.id !== Number(id) && !['Urur', 'admin'].includes(role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // Verify current password
  const checkSql = "SELECT password FROM users WHERE id = ?";
  db.query(checkSql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (result[0].password !== currentPassword) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    // Update password
    const updateSql = "UPDATE users SET password = ? WHERE id = ?";
    db.query(updateSql, [newPassword, id], (updateErr, updateResult) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ success: true, message: "Password updated successfully" });
    });
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));