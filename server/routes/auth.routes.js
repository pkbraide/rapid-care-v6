const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { getOne, run } = require('../db');

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role, license_number, specialization, hospital } = req.body;

    if (!full_name || !email || !password || !role)
      return res.status(400).json({ error: 'All fields are required' });
    if (!['patient', 'professional'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    if (role === 'professional' && !license_number)
      return res.status(400).json({ error: 'License number required for professionals' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);

    const user = await getOne(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4) RETURNING id, full_name, email, role`,
      [full_name, email, password_hash, role]
    );

    if (role === 'professional') {
      await run(
        `INSERT INTO professional_profiles (user_id, license_number, specialization, hospital)
         VALUES ($1,$2,$3,$4)`,
        [user.id, license_number, specialization || '', hospital || '']
      );
    } else {
      await run('INSERT INTO medical_profiles (user_id) VALUES ($1)', [user.id]);
    }

    res.status(201).json({ message: 'Account created! You can now log in.' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.password_hash)
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    let profile = null;
    if (user.role === 'professional') {
      profile = await getOne('SELECT * FROM professional_profiles WHERE user_id = $1', [user.id]);
    }

    const token = makeToken(user);
    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, avatar_url: user.avatar_url, profile } });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const role = req.query.role || 'patient';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role,
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/pages/login.html?error=google' }),
  async (req, res) => {
    try {
      const user = req.user;
      const role = req.query.state || 'patient';

      // If new user and professional role requested, update role & create pro profile
      if (role === 'professional' && user.role === 'patient') {
        const existing = await getOne('SELECT id FROM professional_profiles WHERE user_id = $1', [user.id]);
        if (!existing) {
          await run('UPDATE users SET role = $1 WHERE id = $2', ['professional', user.id]);
          await run(
            `INSERT INTO professional_profiles (user_id, license_number) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [user.id, 'PENDING-VERIFICATION']
          );
        }
      }

      const freshUser = await getOne('SELECT * FROM users WHERE id = $1', [user.id]);
      const token = makeToken(freshUser);

      // Redirect to frontend with token
      const redirect = freshUser.role === 'professional'
        ? `/pages/pro-dashboard.html?token=${token}`
        : `/pages/dashboard.html?token=${token}`;

      res.redirect(redirect);
    } catch (err) {
      res.redirect('/pages/login.html?error=server');
    }
  }
);

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  const user = await getOne('SELECT id, full_name, email, role, avatar_url, created_at FROM users WHERE id = $1', [req.user.id]);
  let profile = null;
  if (user.role === 'professional') {
    profile = await getOne('SELECT * FROM professional_profiles WHERE user_id = $1', [user.id]);
  } else {
    profile = await getOne('SELECT * FROM medical_profiles WHERE user_id = $1', [user.id]);
  }
  res.json({ user, profile });
});

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    await run('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
