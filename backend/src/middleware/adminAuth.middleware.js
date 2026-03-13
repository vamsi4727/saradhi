import bcrypt from 'bcryptjs';

export const adminLogin = async (req, res) => {
  const { password } = req.body;

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return res.status(500).json({ error: 'Admin auth not configured' });
  }

  const isValid = await bcrypt.compare(password, hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  req.session.isAdmin = true;
  req.session.adminLoginAt = Date.now();
  res.json({ success: true });
};

export const requireAdmin = (req, res, next) => {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  const eightHours = 8 * 60 * 60 * 1000;
  if (Date.now() - req.session.adminLoginAt > eightHours) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session expired — please log in again' });
  }

  next();
};
