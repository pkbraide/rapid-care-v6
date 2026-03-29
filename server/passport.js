const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getOne, run } = require('./db');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getOne('SELECT * FROM users WHERE id = $1', [id]);
    done(null, user);
  } catch (e) { done(e, null); }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const googleId = profile.id;
      const avatar = profile.photos?.[0]?.value || null;

      let user = await getOne('SELECT * FROM users WHERE google_id = $1', [googleId]);

      if (!user) {
        // Check if email already exists (link accounts)
        user = await getOne('SELECT * FROM users WHERE email = $1', [email]);
        if (user) {
          await run('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3',
            [googleId, avatar, user.id]);
        } else {
          // New Google user — default to 'patient', they can change role after
          await run(
            `INSERT INTO users (full_name, email, google_id, avatar_url, role)
             VALUES ($1,$2,$3,$4,'patient')`,
            [name, email, googleId, avatar]
          );
          user = await getOne('SELECT * FROM users WHERE google_id = $1', [googleId]);
          // Create medical profile
          await run('INSERT INTO medical_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
        }
      }

      done(null, user);
    } catch (e) {
      done(e, null);
    }
  }));
  console.log('✅ Google OAuth configured');
} else {
  console.log('⚠️  Google OAuth not configured (set GOOGLE_CLIENT_ID in .env to enable)');
}
