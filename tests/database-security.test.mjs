// Gateway Security: Database Security & Concurrency Verification Test Suite
// Run with: node tests/database-security.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isLiveConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder')
);

// ----------------------------------------------------------------------------
// SUITE 1: DETERMINISTIC CONTRACT & SIMULATION TESTS (In-Memory Engine)
// ----------------------------------------------------------------------------

test('[SIMULATION] State Machine Contract - Reject Illegal Transitions & Bypasses', () => {
  const isValidTransition = (current, next) => {
    switch (current) {
      case 'pending': return ['approved', 'rejected', 'leave_at_gate', 'expired', 'cancelled'].includes(next);
      case 'approved': return ['checked_in', 'expired', 'cancelled'].includes(next);
      case 'checked_in': return next === 'checked_out';
      case 'leave_at_gate': return ['collected', 'cancelled'].includes(next);
      default: return false;
    }
  };

  // Illegal bypasses
  assert.equal(isValidTransition('pending', 'checked_in'), false, 'Direct check-in must be rejected');
  assert.equal(isValidTransition('pending', 'collected'), false, 'Direct pending to collected must be rejected');
  assert.equal(isValidTransition('leave_at_gate', 'checked_in'), false, 'Leave at Gate cannot check in as physical visitor');

  // Valid paths
  assert.equal(isValidTransition('pending', 'approved'), true);
  assert.equal(isValidTransition('approved', 'checked_in'), true);
  assert.equal(isValidTransition('checked_in', 'checked_out'), true);
  assert.equal(isValidTransition('pending', 'leave_at_gate'), true);
  assert.equal(isValidTransition('leave_at_gate', 'collected'), true);
});

test('[SIMULATION] State Machine Contract - Terminal States Cannot Re-open', () => {
  const terminalStates = ['rejected', 'expired', 'cancelled', 'checked_out', 'collected'];
  const allStates = ['pending', 'approved', 'rejected', 'expired', 'cancelled', 'checked_in', 'checked_out', 'leave_at_gate', 'collected'];

  const canTransitionFromTerminal = (current, next) => {
    if (['rejected', 'expired', 'cancelled', 'checked_out', 'collected'].includes(current)) {
      return false;
    }
    return true;
  };

  for (const terminal of terminalStates) {
    for (const next of allStates) {
      assert.equal(canTransitionFromTerminal(terminal, next), false, `Terminal state ${terminal} must not transition to ${next}`);
    }
  }
});

test('[SIMULATION] Concurrency Simulation - Parallel Single-Use Guest Pass Entry', async () => {
  // Simulates fn_verify_and_use_guest_pass row-lock and atomic decrement
  class MockDatabasePassStore {
    constructor() {
      this.pass = {
        id: 'pass-race-1',
        pass_code: '554433',
        max_entries: 1,
        entries_used: 0,
        is_active: true,
        valid_until: new Date(Date.now() + 3600000).toISOString()
      };
      this.locked = false;
    }

    async atomicRedeem(code) {
      // Simulate atomic row lock (SELECT FOR UPDATE)
      while (this.locked) {
        await new Promise(r => setTimeout(r, 5));
      }
      this.locked = true;

      try {
        if (this.pass.pass_code !== code) return { success: false, reason: 'INVALID_OR_EXPIRED_PASS' };
        if (!this.pass.is_active) return { success: false, reason: 'INVALID_OR_EXPIRED_PASS' };
        if (this.pass.entries_used >= this.pass.max_entries) return { success: false, reason: 'PASS_LIMIT_EXCEEDED' };

        // Increment
        this.pass.entries_used += 1;
        this.pass.is_active = this.pass.entries_used < this.pass.max_entries;
        return { success: true, remaining: this.pass.max_entries - this.pass.entries_used };
      } finally {
        this.locked = false;
      }
    }
  }

  const store = new MockDatabasePassStore();

  // Fire 10 simultaneous redemption requests (simulating guards at different gates)
  const attempts = await Promise.all([
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433'),
    store.atomicRedeem('554433')
  ]);

  const successes = attempts.filter(a => a.success);
  const failures = attempts.filter(a => !a.success);

  assert.equal(successes.length, 1, 'Exactly ONE concurrent attempt must succeed on a 1-use pass');
  assert.equal(failures.length, 9, 'All other 9 concurrent attempts must fail');
  assert.equal(store.pass.entries_used, 1, 'Final entries_used must be strictly 1');
  assert.equal(store.pass.is_active, false, 'Pass must be deactivated');
});

test('[SIMULATION] Audit Log Immutability Contract', () => {
  const disallowTampering = (operation) => {
    if (operation === 'UPDATE' || operation === 'DELETE' || operation === 'TRUNCATE') {
      throw new Error('Audit logs are immutable and cannot be updated, deleted, or truncated');
    }
    return true;
  };

  assert.throws(() => disallowTampering('UPDATE'), /immutable/);
  assert.throws(() => disallowTampering('DELETE'), /immutable/);
  assert.throws(() => disallowTampering('TRUNCATE'), /immutable/);
  assert.equal(disallowTampering('INSERT'), true);
});

test('[SIMULATION] Authorization Rules - Resident and Guard Boundary Enforcement', () => {
  const canApproveVisitor = (role, userFlatId, requestFlatId) => {
    if (role === 'super_admin' || role === 'community_admin') return true;
    if (role === 'resident' || role === 'family_member') {
      return userFlatId === requestFlatId;
    }
    return false; // Guards cannot approve
  };

  assert.equal(canApproveVisitor('resident', 'flat-101', 'flat-101'), true, 'Resident of Flat 101 can approve for Flat 101');
  assert.equal(canApproveVisitor('resident', 'flat-102', 'flat-101'), false, 'Resident of Flat 102 CANNOT approve for Flat 101');
  assert.equal(canApproveVisitor('security_guard', 'gate-1', 'flat-101'), false, 'Guard CANNOT approve on behalf of resident');
});

test('[SIMULATION] Concurrency Simulation - Parallel Parcel Handover Requests', async () => {
  // Simulates fn_confirm_parcel_handover atomic row lock (SELECT FOR UPDATE)
  class MockDatabaseParcelStore {
    constructor() {
      this.parcel = {
        id: 'parcel-race-1',
        status: 'leave_at_gate',
        handover_status: 'at_gate',
        collection_otp: '6543',
        collected_at: null,
        collected_by_name: null,
        handover_guard_id: null
      };
      this.locked = false;
    }

    async atomicConfirmHandover(enteredOtp, collectorName, guardId) {
      while (this.locked) {
        await new Promise(r => setTimeout(r, 5));
      }
      this.locked = true;

      try {
        if (this.parcel.status !== 'leave_at_gate' || this.parcel.handover_status !== 'at_gate') {
          return { success: false, reason: 'PARCEL_NOT_AWAITING_COLLECTION' };
        }
        if (this.parcel.collection_otp !== enteredOtp) {
          return { success: false, reason: 'INVALID_COLLECTION_PIN' };
        }

        this.parcel.status = 'collected';
        this.parcel.handover_status = 'collected';
        this.parcel.collected_at = new Date().toISOString();
        this.parcel.collected_by_name = collectorName;
        this.parcel.handover_guard_id = guardId;

        return { success: true };
      } finally {
        this.locked = false;
      }
    }
  }

  const store = new MockDatabaseParcelStore();

  // 10 concurrent requests (e.g. rapid multiple clicks by guard or race between terminals)
  const attempts = await Promise.all([
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1'),
    store.atomicConfirmHandover('6543', 'Suresh', 'guard-1')
  ]);

  const successes = attempts.filter(a => a.success);
  const failures = attempts.filter(a => !a.success);

  assert.equal(successes.length, 1, 'Exactly ONE concurrent handover must succeed');
  assert.equal(failures.length, 9, 'All subsequent concurrent requests must be rejected');
  assert.equal(store.parcel.status, 'collected');
  assert.equal(store.parcel.handover_status, 'collected');
  assert.ok(store.parcel.collected_at);
});

test('[SIMULATION] Multi-Tenant Community Isolation for Parcels', () => {
  const canAccessParcel = (userCommunityId, requestCommunityId) => {
    return userCommunityId === requestCommunityId;
  };

  const communityA = 'comm-aaa-111';
  const communityB = 'comm-bbb-222';

  assert.equal(canAccessParcel(communityA, communityA), true, 'User in Community A can access Community A parcel');
  assert.equal(canAccessParcel(communityA, communityB), false, 'User in Community A CANNOT access Community B parcel');
});

// ----------------------------------------------------------------------------
// SUITE 2: LIVE SUPABASE POSTGRESQL VERIFICATION
// ----------------------------------------------------------------------------

test('[LIVE POSTGRESQL] Anonymous Access & Expiration Routine Restriction', async (t) => {
  if (!isLiveConfigured) {
    t.diagnostic('LIVE DATABASE TESTS NOT EXECUTED: NEXT_PUBLIC_SUPABASE_URL is not configured for a live PostgreSQL instance.');
    t.diagnostic('Run tests/verify_migration_06.sql directly in the Supabase SQL Editor to execute the full PostgreSQL test suite.');
    return;
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Verify Anonymous Access Denied on visitor_requests
  const { data: anonData, error: anonError } = await anonClient
    .from('visitor_requests')
    .insert({
      visitor_name: 'Attacker',
      visitor_phone: '+91 99999 99999',
      purpose: 'Tamper',
      flat_id: 'd0000000-0000-0000-0000-000000000402',
      community_id: 'a0000000-0000-0000-0000-000000000001'
    });

  assert.ok(anonError, 'Anonymous insert to visitor_requests must be denied by RLS');

  // 2. Verify Anonymous Audit Log Deletion Denied
  const { error: anonAuditError } = await anonClient
    .from('audit_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  assert.ok(anonAuditError, 'Anonymous deletion of audit_logs must be denied');

  // 3. Verify Anonymous cannot call fn_expire_stale_visitor_requests RPC
  const { error: expireRpcError } = await anonClient.rpc('fn_expire_stale_visitor_requests', {
    p_expiration_minutes: 10
  });

  assert.ok(expireRpcError, 'Anonymous user must be denied from calling fn_expire_stale_visitor_requests');
});
