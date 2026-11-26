import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validate.js';

const router = express.Router();

// Helper to set HTTP-only cookie
const setAuthCookie = (res, token) => {
  res.cookie('vistaro_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// Helper to issue JWT
const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      organisation_id: user.organisation_id
    },
    CONFIG.JWT_SECRET,
    { expiresIn: CONFIG.JWT_EXPIRES_IN }
  );
};

// GET /api/v1/auth/demo-users - Pre-seeded demo personas for easy testing
router.get('/demo-users', (req, res) => {
  const users = db.get('users').map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title,
    organisation_id: u.organisation_id,
    organisation_name: db.findById('organisations', u.organisation_id)?.name || ''
  }));
  res.json({ demo_users: users });
});

// POST /api/v1/auth/switch-demo - Switch active session immediately to any demo user
router.post('/switch-demo', (req, res) => {
  const { userId } = req.body;
  const user = db.findById('users', userId);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = createToken(user);
  setAuthCookie(res, token);
  const org = db.findById('organisations', user.organisation_id);

  res.json({
    message: `Logged in as ${user.name} (${user.role})`,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organisation_id: user.organisation_id,
      title: user.title,
      phone: user.phone,
      organisation: org
    }
  });
});

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, organisationName, organisationType, phone, title } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create organisation if provided or required
    let orgId = null;
    if (organisationName) {
      const newOrg = db.insert('organisations', {
        name: organisationName,
        type: organisationType || role,
        verified: false,
        created_at: new Date().toISOString()
      });
      orgId = newOrg.id;

      // If registered as vendor, initialize vendor profile
      if (role === 'vendor') {
        db.insert('vendor_profiles', {
          organisation_id: newOrg.id,
          business_name: organisationName,
          tagline: 'Professional Service Provider',
          service_categories: [],
          service_areas: [],
          description: '',
          capacity: 'Self-reported capacity',
          experience_years: 1,
          contact_preferences: { email: true, in_app: true },
          verified_status: 'Unverified New Partner',
          rating: 5.0,
          completed_projects_count: 0
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = db.insert('users', {
      name,
      email: email.toLowerCase(),
      password_hash,
      role,
      organisation_id: orgId,
      phone: phone || '',
      title: title || ''
    });

    const token = createToken(newUser);
    setAuthCookie(res, token);
    const org = orgId ? db.findById('organisations', orgId) : null;

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organisation: org
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user);
    setAuthCookie(res, token);
    const org = user.organisation_id ? db.findById('organisations', user.organisation_id) : null;

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisation_id: user.organisation_id,
        title: user.title,
        phone: user.phone,
        organisation: org
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const org = user.organisation_id ? db.findById('organisations', user.organisation_id) : null;
  const vendorProfile = user.role === 'vendor' && user.organisation_id
    ? db.findOne('vendor_profiles', vp => vp.organisation_id === user.organisation_id)
    : null;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      phone: user.phone,
      organisation: org,
      vendor_profile: vendorProfile
    }
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('vistaro_token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
