import test from 'node:test';
import assert from 'node:assert';
import app from '../src/index.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. API Health Check', async () => {
  const res = await fetch(`${baseUrl.replace('/v1', '')}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.service, 'Vistaro Backend API');
});

test('2. Public Opportunity Discovery', async () => {
  const res = await fetch(`${baseUrl}/opportunities`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.opportunities));
  assert.ok(data.opportunities.length > 0);
  assert.ok(data.opportunities[0].title);
  assert.ok(data.opportunities[0].submission_deadline);
});

test('3. Demo User Authentication & Role Token', async () => {
  // Login as Vendor 1 (Apex Audio)
  const res = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-1' })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  assert.strictEqual(data.user.role, 'vendor');
  assert.strictEqual(data.user.organisation_id, 'org-apex');
});

test('4. Confidential Proposal Access Rules', async () => {
  // 1. Authenticate as Vendor 1 (Apex Audio)
  const loginApex = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-1' })
  });
  const apexToken = (await loginApex.json()).token;

  // 2. Authenticate as Vendor 2 (Royal Feast)
  const loginRoyal = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-2' })
  });
  const royalToken = (await loginRoyal.json()).token;

  // Royal Feast should be able to view their own proposal
  const ownPropRes = await fetch(`${baseUrl}/proposals/prop-royal-001`, {
    headers: { Authorization: `Bearer ${royalToken}` }
  });
  assert.strictEqual(ownPropRes.status, 200);

  // BUT Apex Audio must NOT be allowed to view Royal Feast's proposal (403 Forbidden)
  const forbiddenRes = await fetch(`${baseUrl}/proposals/prop-royal-001`, {
    headers: { Authorization: `Bearer ${apexToken}` }
  });
  assert.strictEqual(forbiddenRes.status, 403);
});

test('5. Services & Promotions Catalogue', async () => {
  const res = await fetch(`${baseUrl}/services`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.services.length, 3);
  const slugs = data.services.map(s => s.slug);
  assert.ok(slugs.includes('paid-promotion'));
  assert.ok(slugs.includes('promotional-video'));
  assert.ok(slugs.includes('event-planner-execution'));
});

test('6. Contextual AI Assistant Query (Permission-Scoped)', async () => {
  const loginApex = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-1' })
  });
  const token = (await loginApex.json()).token;

  const res = await fetch(`${baseUrl}/assistant/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query: 'What should I do next?' })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.reply);
  assert.ok(data.reply.length > 10);
  assert.ok(Array.isArray(data.suggested_actions));
});

test('7. Private Tender Access Enforcement (403 Forbidden)', async () => {
  // 1. Unauthenticated visitor must NOT see private tender opp-2026-005 in public list
  const publicListRes = await fetch(`${baseUrl}/opportunities`);
  const publicData = await publicListRes.json();
  const foundInPublic = publicData.opportunities.some(o => o.id === 'opp-2026-005');
  assert.strictEqual(foundInPublic, false, 'Private tender opp-2026-005 must not appear in public discovery');

  // 2. Unauthenticated visitor direct access to opp-2026-005 returns 403
  const directUnauthRes = await fetch(`${baseUrl}/opportunities/opp-2026-005`);
  assert.strictEqual(directUnauthRes.status, 403, 'Unauthenticated visitor must receive 403 on private tender');

  // 3. Login as uninvited vendor (Royal Feast: usr-vendor-2)
  const loginRoyal = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-2' })
  });
  const royalToken = (await loginRoyal.json()).token;

  // Uninvited vendor direct access returns 403
  const royalAccessRes = await fetch(`${baseUrl}/opportunities/opp-2026-005`, {
    headers: { Authorization: `Bearer ${royalToken}` }
  });
  assert.strictEqual(royalAccessRes.status, 403, 'Uninvited vendor must receive 403 on private tender');

  // 4. Login as invited vendor (Apex Audio: usr-vendor-1)
  const loginApex = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-1' })
  });
  const apexToken = (await loginApex.json()).token;

  // Invited vendor direct access returns 200 OK
  const apexAccessRes = await fetch(`${baseUrl}/opportunities/opp-2026-005`, {
    headers: { Authorization: `Bearer ${apexToken}` }
  });
  assert.strictEqual(apexAccessRes.status, 200, 'Invited vendor must successfully access private tender');
  const apexOppData = await apexAccessRes.json();
  assert.strictEqual(apexOppData.opportunity.visibility, 'PRIVATE');
  assert.ok(apexOppData.opportunity.my_invitation);
});

test('8. Uninvited Vendor Proposal Submission Forbidden (403)', async () => {
  // Login as uninvited vendor (Royal Feast: usr-vendor-2)
  const loginRoyal = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-2' })
  });
  const royalToken = (await loginRoyal.json()).token;

  // Attempt to submit bid for private tender opp-2026-005
  const submitRes = await fetch(`${baseUrl}/proposals/opportunity/opp-2026-005`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${royalToken}`
    },
    body: JSON.stringify({
      quote_amount: 550000,
      delivery_timeline: '3 weeks',
      proposal_summary: 'Royal Feast uninvited bid attempt'
    })
  });

  assert.strictEqual(submitRes.status, 403, 'Uninvited vendor proposal submission must be rejected with 403');
});

test('9. Invited Tenders Endpoint for Vendors', async () => {
  // Login as Apex Audio (invited vendor)
  const loginApex = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-1' })
  });
  const apexToken = (await loginApex.json()).token;

  const res = await fetch(`${baseUrl}/opportunities/invited`, {
    headers: { Authorization: `Bearer ${apexToken}` }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.opportunities));
  const hasZenithPrivate = data.opportunities.some(o => o.id === 'opp-2026-005');
  assert.strictEqual(hasZenithPrivate, true, 'Apex Audio must see opp-2026-005 in their invited opportunities feed');
});

test('10. Institution Tender Invitation Lifecycle (Invite & Revoke)', async () => {
  // Login as Zenith (institution owner: usr-buyer-2)
  const loginZenith = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-buyer-2' })
  });
  const zenithToken = (await loginZenith.json()).token;

  // 1. View current invitations on opp-2026-005
  const listInvRes = await fetch(`${baseUrl}/opportunities/opp-2026-005/invitations`, {
    headers: { Authorization: `Bearer ${zenithToken}` }
  });
  assert.strictEqual(listInvRes.status, 200);
  const listData = await listInvRes.json();
  assert.ok(Array.isArray(listData.invitations));

  // 2. Invite Royal Feast by email (orders@royalfeast.in)
  const inviteRes = await fetch(`${baseUrl}/opportunities/opp-2026-005/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${zenithToken}`
    },
    body: JSON.stringify({
      vendor_email: 'orders@royalfeast.in',
      vendor_organisation_id: 'org-royal',
      notes: 'Invited for boardroom executive banquet and pantry integration'
    })
  });
  assert.strictEqual(inviteRes.status, 201);
  const newInvData = await inviteRes.json();
  const invitationId = newInvData.invitation.id;

  // 3. Royal Feast should now have access!
  const loginRoyal = await fetch(`${baseUrl}/auth/switch-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-vendor-2' })
  });
  const royalToken = (await loginRoyal.json()).token;

  const royalAccessAfterRes = await fetch(`${baseUrl}/opportunities/opp-2026-005`, {
    headers: { Authorization: `Bearer ${royalToken}` }
  });
  assert.strictEqual(royalAccessAfterRes.status, 200, 'Royal Feast must now be granted access to private tender');

  // 4. Revoke the invitation
  const revokeRes = await fetch(`${baseUrl}/opportunities/opp-2026-005/invitations/${invitationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${zenithToken}` }
  });
  assert.strictEqual(revokeRes.status, 200);

  // 5. Royal Feast access should once again be 403 Forbidden
  const royalAccessRevokedRes = await fetch(`${baseUrl}/opportunities/opp-2026-005`, {
    headers: { Authorization: `Bearer ${royalToken}` }
  });
  assert.strictEqual(royalAccessRevokedRes.status, 403, 'Royal Feast must be blocked after invitation revocation');
});
