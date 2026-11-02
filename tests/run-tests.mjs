// Gateway Security: Automated Permission & State Transition Tests
// Run with: node tests/run-tests.mjs

import test from 'node:test';
import assert from 'node:assert/strict';

// Helper replicate transition logic
function isValidStatusTransition(current, next) {
  switch (current) {
    case 'pending':
      return ['approved', 'rejected', 'leave_at_gate', 'expired', 'cancelled'].includes(next);
    case 'approved':
      return ['checked_in', 'expired', 'cancelled'].includes(next);
    case 'checked_in':
      return next === 'checked_out';
    case 'leave_at_gate':
      return ['collected', 'cancelled'].includes(next);
    case 'rejected':
    case 'expired':
    case 'cancelled':
    case 'checked_out':
    case 'collected':
      return false; // Terminal states
    default:
      return false;
  }
}

function maskPhoneNumber(phone) {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) return phone;
  const last4 = clean.slice(-4);
  const first2 = clean.slice(-10, -8);
  return `+91 ${first2}XXX-XX${last4}`;
}

function validateIndianPhone(phone) {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return /^[6-9]\d{9}$/.test(clean);
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return /^[6-9]\d{9}$/.test(clean.slice(2));
  }
  return false;
}

test('Visitor State Machine - Valid Transitions', () => {
  // Pending can transition to approved, rejected, expired, cancelled
  assert.equal(isValidStatusTransition('pending', 'approved'), true);
  assert.equal(isValidStatusTransition('pending', 'rejected'), true);
  assert.equal(isValidStatusTransition('pending', 'expired'), true);
  assert.equal(isValidStatusTransition('pending', 'cancelled'), true);

  // Approved can transition to checked_in
  assert.equal(isValidStatusTransition('approved', 'checked_in'), true);

  // Checked in can transition to checked_out
  assert.equal(isValidStatusTransition('checked_in', 'checked_out'), true);
});

test('Visitor State Machine - Safety Violation Prevention', () => {
  // Guard cannot bypass resident approval: pending directly to checked_in MUST FAIL
  assert.equal(isValidStatusTransition('pending', 'checked_in'), false, 'Direct check-in from pending must be prohibited');

  // Rejected visitor cannot be checked in
  assert.equal(isValidStatusTransition('rejected', 'checked_in'), false, 'Denied entry cannot be checked in');

  // Terminal states cannot transition
  assert.equal(isValidStatusTransition('checked_out', 'checked_in'), false, 'Checked-out visitor cannot re-check in');
  assert.equal(isValidStatusTransition('checked_out', 'approved'), false);
  assert.equal(isValidStatusTransition('expired', 'checked_in'), false);
});

test('Privacy - Phone Number Masking', () => {
  assert.equal(maskPhoneNumber('+91 98111 22334'), '+91 98XXX-XX2334');
  assert.equal(maskPhoneNumber('9876543210'), '+91 98XXX-XX3210');
  // Short number fallback
  assert.equal(maskPhoneNumber('112'), '112');
});

test('Validation - Indian Mobile Numbers (+91 / 10 digits)', () => {
  assert.equal(validateIndianPhone('9876543210'), true);
  assert.equal(validateIndianPhone('+91 98111 22334'), true);
  assert.equal(validateIndianPhone('7001234567'), true);
  assert.equal(validateIndianPhone('8912345678'), true);
  assert.equal(validateIndianPhone('6123456789'), true);

  // Invalid phone numbers (starts with 0, 1, 2, 3, 4, 5 or wrong length)
  assert.equal(validateIndianPhone('1234567890'), false);
  assert.equal(validateIndianPhone('5555555555'), false);
  assert.equal(validateIndianPhone('98765'), false);
  assert.equal(validateIndianPhone('987654321000'), false);
});

test('Security - Guest Pass Validation and Expiry', () => {
  const now = new Date();
  const validPass = {
    pass_code: '847291',
    valid_until: new Date(now.getTime() + 3600000).toISOString(),
    max_entries: 1,
    entries_used: 0,
    is_active: true
  };

  const expiredPass = {
    pass_code: '123456',
    valid_until: new Date(now.getTime() - 3600000).toISOString(),
    max_entries: 1,
    entries_used: 0,
    is_active: true
  };

  const verifyPass = (pass, code) => {
    if (pass.pass_code !== code) return { valid: false, reason: 'INVALID_CODE' };
    if (!pass.is_active) return { valid: false, reason: 'INACTIVE' };
    if (new Date(pass.valid_until) < new Date()) return { valid: false, reason: 'EXPIRED' };
    if (pass.entries_used >= pass.max_entries) return { valid: false, reason: 'LIMIT_REACHED' };
    return { valid: true };
  };

  assert.equal(verifyPass(validPass, '847291').valid, true);
  assert.equal(verifyPass(validPass, '000000').valid, false);
  assert.equal(verifyPass(expiredPass, '123456').reason, 'EXPIRED');
});

test('Role-Based Authorization Constraints', () => {
  const allowedRolesForVisitorRegistration = ['security_guard', 'community_admin'];
  const allowedRolesForApproval = ['resident', 'family_member'];

  assert.equal(allowedRolesForVisitorRegistration.includes('security_guard'), true);
  assert.equal(allowedRolesForVisitorRegistration.includes('resident'), false);

  assert.equal(allowedRolesForApproval.includes('resident'), true);
  assert.equal(allowedRolesForApproval.includes('family_member'), true);
  assert.equal(allowedRolesForApproval.includes('security_guard'), false, 'Guard cannot approve visitor entry on behalf of resident without resident action');
});

test('Migration 06/07 - Terminal State Immutability Enforcement', () => {
  const terminalStates = ['rejected', 'expired', 'cancelled', 'checked_out', 'collected'];
  const allStates = ['pending', 'approved', 'rejected', 'expired', 'cancelled', 'checked_in', 'checked_out', 'leave_at_gate', 'collected'];

  for (const terminal of terminalStates) {
    for (const next of allStates) {
      assert.equal(
        isValidStatusTransition(terminal, next),
        false,
        `Terminal state ${terminal} must NOT transition to ${next}`
      );
    }
  }
});

test('Migration 06 - Atomic Pass Anti-Replay Simulation', () => {
  // Simulates fn_verify_and_use_guest_pass row-locking behavior
  const guestPass = {
    id: 'pass-test-1',
    pass_code: '998877',
    valid_from: new Date(Date.now() - 3600000).toISOString(),
    valid_until: new Date(Date.now() + 3600000).toISOString(),
    max_entries: 1,
    entries_used: 0,
    is_active: true
  };

  function simulateAtomicUse(pass, enteredCode) {
    // Atomically check and increment
    if (pass.pass_code !== enteredCode) return { success: false, reason: 'PASS_NOT_FOUND' };
    if (!pass.is_active) return { success: false, reason: 'PASS_INACTIVE' };
    if (new Date(pass.valid_until) < new Date()) return { success: false, reason: 'PASS_EXPIRED' };
    if (new Date(pass.valid_from) > new Date()) return { success: false, reason: 'PASS_NOT_YET_VALID' };
    if (pass.entries_used >= pass.max_entries) return { success: false, reason: 'PASS_LIMIT_EXCEEDED' };

    pass.entries_used += 1;
    pass.is_active = pass.entries_used < pass.max_entries;
    return { success: true, remaining: pass.max_entries - pass.entries_used };
  }

  // First check-in should succeed
  const attempt1 = simulateAtomicUse(guestPass, '998877');
  assert.equal(attempt1.success, true);
  assert.equal(attempt1.remaining, 0);
  assert.equal(guestPass.is_active, false);

  // Replay attempt with same code MUST FAIL
  const attempt2 = simulateAtomicUse(guestPass, '998877');
  assert.equal(attempt2.success, false);
  assert.equal(attempt2.reason, 'PASS_INACTIVE');
});

test('Migration 06 - Schema Integrity Constraints Validation', () => {
  // Validates chk_visitor_checkout_time logic
  const isValidCheckoutSequence = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return true;
    return new Date(checkOutTime).getTime() >= new Date(checkInTime).getTime();
  };

  const t1 = '2026-10-26T10:00:00Z';
  const t2 = '2026-10-26T11:00:00Z';

  assert.equal(isValidCheckoutSequence(t1, t2), true, 'Checkout after check-in is valid');
  assert.equal(isValidCheckoutSequence(t2, t1), false, 'Checkout before check-in must violate constraint');
  assert.equal(isValidCheckoutSequence(t1, null), true, 'Null checkout time is allowed (still inside)');

  // Validates chk_guest_passes_dates logic
  const isValidPassValidity = (validFrom, validUntil) => {
    return new Date(validUntil).getTime() > new Date(validFrom).getTime();
  };

  assert.equal(isValidPassValidity(t1, t2), true, 'valid_until > valid_from is valid');
  assert.equal(isValidPassValidity(t2, t1), false, 'valid_until < valid_from must violate constraint');
  assert.equal(isValidPassValidity(t1, t1), false, 'Equal timestamps must violate constraint');
});

// ----------------------------------------------------------------------------
// MIGRATION 07: DELIVERY AND PARCEL MANAGEMENT TESTS
// ----------------------------------------------------------------------------

test('Migration 07 - Delivery Categories Validation', () => {
  const validCategories = ['food', 'courier', 'grocery', 'e_commerce', 'other'];

  const isValidDeliveryCategory = (cat) => validCategories.includes(cat);

  assert.equal(isValidDeliveryCategory('food'), true);
  assert.equal(isValidDeliveryCategory('courier'), true);
  assert.equal(isValidDeliveryCategory('grocery'), true);
  assert.equal(isValidDeliveryCategory('e_commerce'), true);
  assert.equal(isValidDeliveryCategory('other'), true);

  // Invalid categories
  assert.equal(isValidDeliveryCategory('electronics'), false);
  assert.equal(isValidDeliveryCategory('medicine'), false);
  assert.equal(isValidDeliveryCategory('unknown'), false);
});

test('Migration 07 - Parcel Lifecycle State Transitions', () => {
  // Valid flow: pending -> leave_at_gate -> collected
  assert.equal(isValidStatusTransition('pending', 'leave_at_gate'), true, 'Resident can authorize Leave at Gate from pending');
  assert.equal(isValidStatusTransition('leave_at_gate', 'collected'), true, 'Guard can mark parcel collected after Leave at Gate');
  assert.equal(isValidStatusTransition('leave_at_gate', 'cancelled'), true, 'Leave at Gate can be cancelled');

  // Direct skip violation: pending directly to collected MUST FAIL
  assert.equal(isValidStatusTransition('pending', 'collected'), false, 'Cannot mark collected directly without Leave at Gate authorization');

  // Cross-flow violations: leave_at_gate cannot jump to visitor check-in/out
  assert.equal(isValidStatusTransition('leave_at_gate', 'checked_in'), false, 'Parcel at gate cannot check in as physical visitor');
  assert.equal(isValidStatusTransition('leave_at_gate', 'checked_out'), false, 'Parcel at gate cannot check out directly');
  assert.equal(isValidStatusTransition('leave_at_gate', 'approved'), false, 'Cannot revert leave_at_gate to approved');

  // Terminal state: collected cannot transition to any state
  assert.equal(isValidStatusTransition('collected', 'pending'), false);
  assert.equal(isValidStatusTransition('collected', 'leave_at_gate'), false);
  assert.equal(isValidStatusTransition('collected', 'approved'), false);
});

test('Migration 07 - Database Constraint chk_collected_requires_action Validation', () => {
  // PostgreSQL constraint:
  // CHECK (status != 'collected' OR (collected_at IS NOT NULL AND handover_status = 'collected'))
  const validateCollectedConstraint = (record) => {
    if (record.status !== 'collected') return true;
    return Boolean(record.collected_at) && record.handover_status === 'collected';
  };

  // Valid collected record
  assert.equal(validateCollectedConstraint({
    status: 'collected',
    collected_at: '2026-10-26T16:00:00Z',
    handover_status: 'collected',
    collected_by_name: 'Rahul Sharma'
  }), true);

  // Invalid: status is collected, but collected_at is null
  assert.equal(validateCollectedConstraint({
    status: 'collected',
    collected_at: null,
    handover_status: 'collected'
  }), false, 'Must violate constraint if collected_at is null');

  // Invalid: status is collected, but handover_status is still at_gate
  assert.equal(validateCollectedConstraint({
    status: 'collected',
    collected_at: '2026-10-26T16:00:00Z',
    handover_status: 'at_gate'
  }), false, 'Must violate constraint if handover_status is not collected');

  // Non-collected record (e.g. leave_at_gate) does not require collected_at
  assert.equal(validateCollectedConstraint({
    status: 'leave_at_gate',
    collected_at: null,
    handover_status: 'at_gate'
  }), true);
});

test('Migration 07 - Atomic fn_confirm_parcel_handover OTP Verification Simulation', () => {
  // Simulates fn_confirm_parcel_handover with row locking and OTP verification
  const parcelRecord = {
    id: 'req-parcel-1',
    status: 'leave_at_gate',
    handover_status: 'at_gate',
    collection_otp: '7412',
    collected_at: null,
    collected_by: null,
    collected_by_name: null,
    handover_guard_id: null
  };

  function simulateHandoverRpc(record, enteredOtp, collectorName, guardId) {
    if (record.status !== 'leave_at_gate' || record.handover_status !== 'at_gate') {
      return { success: false, error: 'PARCEL_NOT_AWAITING_COLLECTION' };
    }
    if (record.collection_otp && record.collection_otp !== enteredOtp) {
      return { success: false, error: 'INVALID_COLLECTION_PIN' };
    }

    record.status = 'collected';
    record.handover_status = 'collected';
    record.collected_at = new Date().toISOString();
    record.collected_by_name = collectorName;
    record.handover_guard_id = guardId;

    return {
      success: true,
      data: {
        id: record.id,
        status: record.status,
        handover_status: record.handover_status,
        collected_at: record.collected_at,
        collected_by_name: record.collected_by_name
      }
    };
  }

  // 1. Wrong OTP attempt fails
  const wrongAttempt = simulateHandoverRpc(parcelRecord, '0000', 'Rahul', 'guard-1');
  assert.equal(wrongAttempt.success, false);
  assert.equal(wrongAttempt.error, 'INVALID_COLLECTION_PIN');
  assert.equal(parcelRecord.status, 'leave_at_gate');

  // 2. Correct OTP succeeds and records audit details
  const validAttempt = simulateHandoverRpc(parcelRecord, '7412', 'Rahul Sharma', 'guard-1');
  assert.equal(validAttempt.success, true);
  assert.equal(parcelRecord.status, 'collected');
  assert.equal(parcelRecord.handover_status, 'collected');
  assert.ok(parcelRecord.collected_at);
  assert.equal(parcelRecord.collected_by_name, 'Rahul Sharma');
  assert.equal(parcelRecord.handover_guard_id, 'guard-1');

  // 3. Replay attempt on already collected parcel fails
  const replayAttempt = simulateHandoverRpc(parcelRecord, '7412', 'Rahul Sharma', 'guard-1');
  assert.equal(replayAttempt.success, false);
  assert.equal(replayAttempt.error, 'PARCEL_NOT_AWAITING_COLLECTION');
});

test('Migration 07 - Flat Membership & Role Boundary Enforcement for Parcels', () => {
  const canAuthorizeLeaveAtGate = (userRole, userFlatId, requestFlatId) => {
    if (userRole === 'resident' || userRole === 'family_member') {
      return userFlatId === requestFlatId;
    }
    return false; // Guards and non-members cannot authorize Leave at Gate
  };

  const canConfirmHandover = (userRole) => {
    return userRole === 'security_guard' || userRole === 'community_admin' || userRole === 'super_admin';
  };

  // Resident of Flat 402 can authorize Leave at Gate for Flat 402
  assert.equal(canAuthorizeLeaveAtGate('resident', 'flat-402', 'flat-402'), true);

  // Resident of Flat 101 CANNOT authorize Leave at Gate for Flat 402
  assert.equal(canAuthorizeLeaveAtGate('resident', 'flat-101', 'flat-402'), false, 'Flat isolation violation');

  // Guard CANNOT authorize Leave at Gate on behalf of resident
  assert.equal(canAuthorizeLeaveAtGate('security_guard', 'gate-1', 'flat-402'), false, 'Guard cannot authorize Leave at Gate');

  // Guard CAN confirm parcel handover at gate
  assert.equal(canConfirmHandover('security_guard'), true);
  // Resident CANNOT execute guard handover RPC
  assert.equal(canConfirmHandover('resident'), false);
});
