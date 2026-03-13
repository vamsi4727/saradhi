import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from './db.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails?.[0]?.value;
        const avatarUrl = photos?.[0]?.value;

        if (!email) return done(new Error('No email from Google'));

        let result = await query(
          `SELECT * FROM users WHERE google_id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          result = await query(
            `INSERT INTO users (google_id, email, name, avatar_url)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, email, displayName || email.split('@')[0], avatarUrl]
          );
        }

        return done(null, result.rows[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});
