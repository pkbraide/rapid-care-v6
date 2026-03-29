require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { initDB } = require('./db');

require('./passport');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'rapidcare_session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Serve static files from project ROOT (one level up from server/)
app.use(express.static(path.join(__dirname, '..')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api', require('./routes/emergency.routes'));

// Catch-all — serve index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏥 Rapid Care Ghana`);
    console.log(`✅ http://localhost:${PORT}\n`);
    console.log(`── Test Accounts ──────────────────────`);
    console.log(`  patient@test.com  /  test123`);
    console.log(`  ama@test.com      /  test123`);
    console.log(`  doctor@test.com   /  test123`);
    console.log(`  nurse@test.com    /  test123`);
    console.log(`───────────────────────────────────────\n`);
  });
}).catch(err => {
  console.error('❌ DB connection failed:', err.message);
  console.error('   Check DATABASE_URL in server/.env');
  process.exit(1);
});
