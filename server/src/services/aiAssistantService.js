import { db } from '../db/database.js';

export class ContextualAIAssistantService {
  /**
   * Process a question from an authenticated user strictly within their permission scope.
   */
  static async handleUserQuery(user, query, currentContext = {}) {
    const q = query.trim().toLowerCase();

    // Step 1: Permission-scoped data gathering
    const userRole = user.role;
    const userOrgId = user.organisation_id;

    // Gather records this user is explicitly authorized to view
    const savedOpps = db.find('saved_opportunities', s => s.user_id === user.id);
    const savedOppIds = new Set(savedOpps.map(s => s.opportunity_id));
    const allOpportunities = db.get('opportunities');

    // Vendors only see their own proposals
    const myProposals = (userRole === 'vendor' && userOrgId)
      ? db.find('proposals', p => p.vendor_organisation_id === userOrgId)
      : [];

    // Institutions only see proposals for opportunities they created
    const myOrgOpportunities = (userRole === 'institution' && userOrgId)
      ? db.find('opportunities', o => o.organisation_id === userOrgId)
      : [];
    const myOrgOppIds = new Set(myOrgOpportunities.map(o => o.id));

    const pendingInstitutionProposals = (userRole === 'institution' && userOrgId)
      ? db.find('proposals', p => myOrgOppIds.has(p.opportunity_id))
      : [];

    // Service requests for customer or admin
    const myServiceRequests = (userRole === 'admin')
      ? db.get('service_requests')
      : db.find('service_requests', r => r.customer_user_id === user.id);

    // Active user tasks
    const myTasks = db.find('tasks', t => t.user_id === user.id && t.status !== 'completed');

    // Unread notifications
    const myNotifications = db.find('notifications', n => n.user_id === user.id && !n.read);

    // Step 2: Intent Classification & Deterministic Response Generation
    const references = [];
    const suggested_actions = [];
    let reply = '';
    let category = 'general';

    // 1. "What should I do next?" / Next-step guidance
    if (q.includes('what should i do next') || q.includes('next action') || q.includes('what next') || q.includes('recommend next')) {
      category = 'next_steps';

      if (userRole === 'vendor') {
        const clarificationNeeded = myProposals.find(p => p.status === 'clarification_required');
        const urgentTask = myTasks.find(t => t.priority === 'urgent');

        if (clarificationNeeded) {
          const opp = db.findById('opportunities', clarificationNeeded.opportunity_id);
          reply = `**Immediate Action Required:** The buyer for **"${opp?.title || 'your proposal'}"** has requested a clarification regarding your bid submission. Responding promptly will keep your bid in consideration for shortlisting.`;
          references.push({
            id: clarificationNeeded.id,
            title: `Proposal for ${opp?.title}`,
            type: 'proposal',
            link: `/proposals/${clarificationNeeded.id}`
          });
          suggested_actions.push({
            label: 'Review Clarification & Reply',
            link: `/proposals/${clarificationNeeded.id}`
          });
        } else if (urgentTask) {
          reply = `Your highest priority task right now is **"${urgentTask.title}"** (Due: ${new Date(urgentTask.due_date).toLocaleDateString()}).`;
          references.push({
            id: urgentTask.id,
            title: urgentTask.title,
            type: 'task',
            link: '/tasks'
          });
          suggested_actions.push({
            label: 'View Incomplete Tasks',
            link: '/tasks'
          });
        } else if (savedOpps.length > 0) {
          const firstSaved = db.findById('opportunities', savedOpps[0].opportunity_id);
          reply = `You have saved **"${firstSaved?.title}"**. Check your readiness checklist to verify technical compliance and submit your proposal before the deadline.`;
          references.push({
            id: firstSaved.id,
            title: firstSaved.title,
            type: 'opportunity',
            link: `/opportunities/${firstSaved.id}`
          });
          suggested_actions.push({
            label: 'Open Readiness Checklist',
            link: `/opportunities/${firstSaved.id}`
          });
        } else {
          reply = `You are caught up on pending items! Next, explore new tender and RFQ opportunities on the marketplace matching your registered categories.`;
          suggested_actions.push({
            label: 'Browse Matching Opportunities',
            link: '/opportunities'
          });
        }
      } else if (userRole === 'institution') {
        const unreviewed = pendingInstitutionProposals.filter(p => p.status === 'submitted');
        if (unreviewed.length > 0) {
          reply = `You have **${unreviewed.length} pending proposal submission(s)** awaiting criterion evaluation across your published listings. Reviewing them will allow you to generate shortlists or request necessary clarifications.`;
          references.push({
            id: unreviewed[0].id,
            title: `Submission from ${unreviewed[0].vendor_name}`,
            type: 'proposal',
            link: `/opportunities/${unreviewed[0].opportunity_id}/proposals`
          });
          suggested_actions.push({
            label: 'Open Submissions Inbox',
            link: `/opportunities/${unreviewed[0].opportunity_id}/proposals`
          });
        } else {
          reply = `All submitted proposals for your listings have been reviewed. You can create a new tender or RFQ to source suppliers for your upcoming events.`;
          suggested_actions.push({
            label: 'Publish New Opportunity',
            link: '/opportunities/create'
          });
        }
      } else if (userRole === 'service_customer') {
        const pendingQuote = myServiceRequests.find(r => r.status === 'quote_sent');
        if (pendingQuote) {
          reply = `Vistaro has prepared an official quote for your **"${pendingQuote.service_type}"** request. Please review the scope, deliverables, and pricing to confirm the booking.`;
          references.push({
            id: pendingQuote.id,
            title: pendingQuote.service_type,
            type: 'service_request',
            link: `/services/requests/${pendingQuote.id}`
          });
          suggested_actions.push({
            label: 'Review Official Quote',
            link: `/services/requests/${pendingQuote.id}`
          });
        } else {
          reply = `You can explore Vistaro's delivery services: Paid Promotion, Video Shoot & Editing, or Turnkey Event Planning for your upcoming campus initiatives.`;
          suggested_actions.push({
            label: 'Explore Services & Promotions',
            link: '/services'
          });
        }
      } else {
        reply = `Welcome to Vistaro! You can explore public opportunities, search verified vendor profiles, or submit a request for video and promotion services.`;
        suggested_actions.push({
          label: 'Explore Opportunities',
          link: '/opportunities'
        });
      }
    }

    // 2. "Which of my saved opportunities closes soon?" / Deadlines
    else if (q.includes('closes soon') || q.includes('deadline') || q.includes('saved opportunities') || q.includes('expiring')) {
      category = 'deadlines';

      if (savedOpps.length === 0) {
        reply = `You currently do not have any saved opportunities in your personal watchlist. You can bookmark relevant tenders from the Opportunity Marketplace to track their countdowns here.`;
        suggested_actions.push({
          label: 'Browse Marketplace',
          link: '/opportunities'
        });
      } else {
        const items = savedOpps
          .map(s => db.findById('opportunities', s.opportunity_id))
          .filter(Boolean)
          .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline));

        const upcoming = items[0];
        const deadlineDate = new Date(upcoming.submission_deadline);
        const daysLeft = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));

        reply = `Your soonest closing saved opportunity is **"${upcoming.title}"** closing on **${deadlineDate.toLocaleDateString()}** (~${daysLeft} days remaining).`;
        references.push({
          id: upcoming.id,
          title: upcoming.title,
          type: 'opportunity',
          link: `/opportunities/${upcoming.id}`
        });
        suggested_actions.push({
          label: 'Prepare Proposal',
          link: `/opportunities/${upcoming.id}`
        });
      }
    }

    // 3. "What is missing from my proposal?" / Readiness check
    else if (q.includes('missing from my proposal') || q.includes('readiness') || q.includes('proposal checklist')) {
      category = 'readiness';

      if (userRole !== 'vendor') {
        reply = `Proposal readiness assessments are available for registered vendor profiles to compare company credentials against buyer requirements.`;
      } else {
        const assessment = db.findOne('readiness_assessments', a => a.vendor_id === userOrgId);

        if (assessment && assessment.checklist_items) {
          const missing = assessment.checklist_items.filter(i => i.status === 'missing_evidence' || i.status === 'needs_verification');
          const opp = db.findById('opportunities', assessment.opportunity_id);

          if (missing.length > 0) {
            reply = `For **"${opp?.title || 'your target opportunity'}"**, your readiness score is **${assessment.overall_readiness_pct}%**. The following item(s) require verification or supporting evidence:\n` +
              missing.map(m => `• **${m.title}** (${m.status.replace('_', ' ')})`).join('\n');
            references.push({
              id: assessment.opportunity_id,
              title: opp?.title || 'Opportunity',
              type: 'readiness',
              link: `/opportunities/${assessment.opportunity_id}`
            });
            suggested_actions.push({
              label: 'Update Readiness Checklist',
              link: `/opportunities/${assessment.opportunity_id}`
            });
          } else {
            reply = `All checklist requirements for **"${opp?.title || 'your proposal'}"** are marked as Ready (100% compliance). You are prepared for final submission!`;
            suggested_actions.push({
              label: 'Proceed to Submission',
              link: `/opportunities/${assessment.opportunity_id}`
            });
          }
        } else {
          reply = `You have not yet started a readiness assessment on an opportunity. Open any opportunity detail page and click the "Readiness Checklist" tab to benchmark your documents.`;
          suggested_actions.push({
            label: 'Browse Opportunities',
            link: '/opportunities'
          });
        }
      }
    }

    // 4. "Has the buyer asked for clarification?"
    else if (q.includes('clarification') || q.includes('buyer asked')) {
      category = 'clarification';

      if (userRole === 'vendor') {
        const withClarifications = myProposals.filter(p =>
          p.clarification_threads && p.clarification_threads.length > 0
        );

        if (withClarifications.length === 0) {
          reply = `No active clarification requests found on your submitted proposals. All bids are either under review or in standard workflow.`;
        } else {
          const target = withClarifications[0];
          const opp = db.findById('opportunities', target.opportunity_id);
          const latestThread = target.clarification_threads[target.clarification_threads.length - 1];

          reply = `Yes. For opportunity **"${opp?.title || 'Listing'}"**, the buyer noted: *"\"${latestThread.message}\"*. Please submit your reply directly on the proposal screen.`;
          references.push({
            id: target.id,
            title: `Proposal for ${opp?.title}`,
            type: 'proposal',
            link: `/proposals/${target.id}`
          });
          suggested_actions.push({
            label: 'Open Clarification Thread',
            link: `/proposals/${target.id}`
          });
        }
      } else {
        reply = `As an institution buyer, you can request clarification on any submitted proposal directly from the Submissions Comparison view.`;
        suggested_actions.push({
          label: 'View My Listings',
          link: '/dashboard'
        });
      }
    }

    // 5. "How do I publish an opportunity?" / Navigation Help
    else if (q.includes('how do i publish') || q.includes('publish an opportunity') || q.includes('create tender') || q.includes('post rfp')) {
      category = 'navigation';

      if (userRole === 'institution' || userRole === 'admin') {
        reply = `To publish a procurement need:\n1. Click **"Publish Opportunity"** in the navigation bar.\n2. Complete the structured wizard: Title, Category, Scope, Quantities, Budget, and Submission Deadline.\n3. Add mandatory technical criteria and upload rider/spec PDFs.\n4. Click **"Publish Listing"** to make it publicly discoverable to verified vendors.`;
        suggested_actions.push({
          label: 'Go to Opportunity Wizard',
          link: '/opportunities/create'
        });
      } else {
        reply = `Publishing tenders and RFPs requires an **Institution / Buyer** account. You are currently logged in as a **${userRole}**. Switch or register as an Institution to create listings.`;
      }
    }

    // 6. Service request inquiries
    else if (q.includes('service') || q.includes('video shoot') || q.includes('promotion') || q.includes('event planner')) {
      category = 'services';

      if (myServiceRequests.length > 0) {
        const sr = myServiceRequests[0];
        reply = `Your service request for **"${sr.service_type}"** is currently in **${sr.status.replace('_', ' ').toUpperCase()}** status. ${sr.status === 'quote_sent' ? 'An official quote has been issued for your review.' : 'The Vistaro operations team is reviewing your brief.'}`;
        references.push({
          id: sr.id,
          title: sr.service_type,
          type: 'service_request',
          link: `/services/requests/${sr.id}`
        });
        suggested_actions.push({
          label: 'View Service Details',
          link: `/services/requests/${sr.id}`
        });
      } else {
        reply = `Vistaro offers 3 managed services delivered with our on-the-ground team:\n1. **Paid Promotion**: Multi-campus student activations.\n2. **Promotional Video Shoot & Editing**: 4K cinematic reels & festival aftermovies.\n3. **Event Planning & Ground Execution**: Turnkey run-of-show and stage direction.`;
        suggested_actions.push({
          label: 'Request a Service',
          link: '/services'
        });
      }
    }

    // 7. Safe Fallback with accurate context
    else {
      category = 'general';
      reply = `I am your Vistaro contextual assistant. I can help guide your workspace actions, check deadlines on saved tenders, monitor proposal readiness, review clarification queries, or track service requests.\n\nAsk me:\n• *"What should I do next?"*\n• *"Which of my saved opportunities closes soon?"*\n• *"What is missing from my proposal?"*\n• *"Has the buyer asked for clarification?"*\n• *"How do I request a promotional video shoot?"*`;
      suggested_actions.push({
        label: 'View Dashboard',
        link: '/dashboard'
      });
    }

    return {
      reply,
      category,
      references,
      suggested_actions,
      timestamp: new Date().toISOString()
    };
  }
}
