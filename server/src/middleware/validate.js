import { z } from 'zod';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return res.status(400).json({ error: errorMessages, details: parsed.error.issues });
    }
    req.validatedBody = parsed.data;
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Validation failed: ' + err.message });
  }
};

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['vendor', 'institution', 'service_customer']),
  organisationName: z.string().optional(),
  organisationType: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createOpportunitySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.string().min(2, 'Category is required'),
  type: z.enum(['tender', 'rfp', 'rfq', 'vendor_enquiry', 'event_requirement']).default('tender'),
  scope: z.string().min(10, 'Scope must be at least 10 characters'),
  quantities: z.string().optional().nullable(),
  location: z.string().min(2, 'Location is required'),
  budget_min: z.number().or(z.string().regex(/^\d+$/).transform(Number)).default(0),
  budget_max: z.number().or(z.string().regex(/^\d+$/).transform(Number)).default(0),
  is_budget_disclosed: z.boolean().default(true),
  submission_deadline: z.string().min(5, 'Submission deadline is required'),
  event_date: z.string().optional().nullable(),
  requirements: z.array(z.any()).optional().default([]),
  attachments: z.array(z.any()).optional().default([]),
  contact_details: z.string().optional().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  status: z.enum(['draft', 'published', 'under_review', 'awarded', 'closed']).default('published')
});

export const createInvitationSchema = z.object({
  vendor_organisation_id: z.string().optional(),
  vendor_email: z.string().email('Valid vendor email is required')
});

export const submitProposalSchema = z.object({
  quote_amount: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
  delivery_timeline: z.string().min(3, 'Delivery timeline is required'),
  proposal_summary: z.string().min(10, 'Proposal summary must be at least 10 characters'),
  breakdown: z.array(z.any()).optional().default([]),
  readiness_score: z.number().or(z.string().regex(/^\d+$/).transform(Number)).optional().default(90)
});

export const submitServiceRequestSchema = z.object({
  service_slug: z.string().min(2, 'Service selection is required'),
  service_type: z.string().optional(),
  brief_details: z.string().min(10, 'Brief details must be at least 10 characters'),
  target_audience: z.string().optional(),
  preferred_dates: z.string().optional(),
  location: z.string().optional(),
  budget_range: z.string().optional(),
  assets_link: z.string().optional(),
  contact_phone: z.string().optional(),
  additional_notes: z.string().optional()
});
