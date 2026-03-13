import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { createRequire } from 'module';

import './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';
import copilotRoutes from './routes/copilot.routes.js';
import marketRoutes from './routes/market.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import adminRoutes from './routes/admin.routes.js';

const require = createRequire(import.meta.url);
const pgSession = require('connect-pg-simple')(session);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow frontend and admin portal (credentials for session cookies)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_PORTAL_URL || 'http://localhost:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

// Admin session (for /admin/api/*) — separate cookie, 8-hour timeout
app.use(
  '/admin/api',
  session({
    name: 'saradhi_admin',
    secret: process.env.ADMIN_SESSION_SECRET || 'admin-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);
app.use('/admin/api', adminRoutes);

// User sessions (for /api/*)
const sessionStore = process.env.DATABASE_URL
  ? new pgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'user_sessions',
    })
  : undefined;

app.use(
  session({
    store: sessionStore,
    name: 'saradhi_user',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'saradhi-api' });
});

// User-facing API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.listen(PORT, () => {
  console.log(`Saradhi API running on http://localhost:${PORT}`);
});
