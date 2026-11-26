import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, optionalAuth, requireRole, logAudit } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/vendors - Public search & directory
router.get('/', (req, res) => {
  const { search, category, location, verified } = req.query;

  let profiles = db.get('vendor_profiles');

  if (search) {
    const q = search.toLowerCase();
    profiles = profiles.filter(p =>
      p.business_name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.service_categories.some(cat => cat.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'all') {
    profiles = profiles.filter(p =>
      p.service_categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
    );
  }

  if (location && location !== 'all') {
    const locLower = location.toLowerCase();
    profiles = profiles.filter(p =>
      p.service_areas.some(area => area.toLowerCase().includes(locLower))
    );
  }

  if (verified === 'true') {
    profiles = profiles.filter(p => p.verified_status?.includes('Verified'));
  }

  // Enrich with portfolio preview & organisation details
  const enriched = profiles.map(profile => {
    const org = db.findById('organisations', profile.organisation_id);
    const portfolio = db.find('vendor_portfolio_items', item => item.vendor_id === profile.id);

    return {
      ...profile,
      organisation: org,
      portfolio_sample: portfolio.slice(0, 2),
      total_portfolio_items: portfolio.length
    };
  });

  res.json({ vendors: enriched, count: enriched.length });
});

// GET /api/v1/vendors/me - Current user's own vendor profile
router.get('/me', authenticateToken, requireRole(['vendor']), (req, res) => {
  const profile = db.findOne('vendor_profiles', vp => vp.organisation_id === req.user.organisation_id);
  if (!profile) {
    return res.status(404).json({ error: 'Vendor profile not initialized for this account' });
  }

  const org = db.findById('organisations', req.user.organisation_id);
  const portfolio = db.find('vendor_portfolio_items', item => item.vendor_id === profile.id);

  res.json({
    profile: {
      ...profile,
      organisation: org,
      portfolio
    }
  });
});

// PATCH /api/v1/vendors/me - Update own vendor profile
router.patch('/me', authenticateToken, requireRole(['vendor']), (req, res) => {
  let profile = db.findOne('vendor_profiles', vp => vp.organisation_id === req.user.organisation_id);

  if (!profile) {
    // Auto-create if not yet existing
    profile = db.insert('vendor_profiles', {
      organisation_id: req.user.organisation_id,
      business_name: req.user.name,
      tagline: '',
      service_categories: [],
      service_areas: [],
      description: '',
      capacity: '',
      experience_years: 1,
      contact_preferences: { email: true, in_app: true },
      verified_status: 'Unverified New Partner',
      rating: 5.0,
      completed_projects_count: 0
    });
  }

  const {
    business_name,
    tagline,
    service_categories,
    service_areas,
    description,
    capacity,
    experience_years,
    contact_preferences,
    certifications
  } = req.body;

  const updates = {};
  if (business_name !== undefined) updates.business_name = business_name;
  if (tagline !== undefined) updates.tagline = tagline;
  if (service_categories !== undefined) updates.service_categories = service_categories;
  if (service_areas !== undefined) updates.service_areas = service_areas;
  if (description !== undefined) updates.description = description;
  if (capacity !== undefined) updates.capacity = capacity;
  if (experience_years !== undefined) updates.experience_years = Number(experience_years);
  if (contact_preferences !== undefined) updates.contact_preferences = contact_preferences;
  if (certifications !== undefined) updates.certifications = certifications;

  const updatedProfile = db.update('vendor_profiles', profile.id, updates);
  logAudit(req.user.id, req.user.name, 'VENDOR_PROFILE_UPDATED', 'vendor_profile', profile.id);

  res.json({ message: 'Profile updated successfully', profile: updatedProfile });
});

// POST /api/v1/vendors/me/portfolio - Add portfolio item
router.post('/me/portfolio', authenticateToken, requireRole(['vendor']), (req, res) => {
  const profile = db.findOne('vendor_profiles', vp => vp.organisation_id === req.user.organisation_id);
  if (!profile) return res.status(404).json({ error: 'Vendor profile not found' });

  const { title, category, client_name, year, description, images, tags, link } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required for portfolio items' });
  }

  const newItem = db.insert('vendor_portfolio_items', {
    vendor_id: profile.id,
    title,
    category: category || 'Event Production',
    client_name: client_name || 'Confidential Client',
    year: year || '2026',
    description,
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'],
    tags: tags || [],
    link: link || ''
  });

  res.status(201).json({ message: 'Portfolio item added successfully', item: newItem });
});

// GET /api/v1/vendors/:id - Public vendor profile detail
router.get('/:id', optionalAuth, (req, res) => {
  const profile = db.findById('vendor_profiles', req.params.id) ||
                  db.findOne('vendor_profiles', p => p.organisation_id === req.params.id);

  if (!profile) {
    return res.status(404).json({ error: 'Vendor profile not found' });
  }

  const org = db.findById('organisations', profile.organisation_id);
  const portfolio = db.find('vendor_portfolio_items', item => item.vendor_id === profile.id);

  res.json({
    vendor: {
      ...profile,
      organisation: org,
      portfolio
    }
  });
});

export default router;
