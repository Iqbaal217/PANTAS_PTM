import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { validateLoginForm, saveSession, getSession, logout } from '../../src/modules/auth/auth.js';

beforeEach(() => {
  localStorage.clear();
});

describe('Auth_Module Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 1: Validasi form login menolak input kosong/whitespace
  it('Property 1: validateLoginForm returns errors for whitespace-only or empty email or password', () => {
    // **Validates: Requirements 1.2**
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter((s) => s.trim() === ''),
          fc.string({ minLength: 1 }).filter((s) => s.trim() !== '')
        ),
        fc.oneof(
          fc.string().filter((s) => s.trim() === ''),
          fc.string({ minLength: 1 }).filter((s) => s.trim() !== '')
        ),
        (email, password) => {
          const isEmailBlank = email.trim() === '';
          const isPasswordBlank = password.trim() === '';

          // Only test cases where at least one field is blank
          fc.pre(isEmailBlank || isPasswordBlank);

          const { errors } = validateLoginForm(email, password);
          return Object.keys(errors).length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 2: Sesi tersimpan dan dapat diambil kembali (round-trip)
  it('Property 2: saveSession then getSession returns the identical token', () => {
    // **Validates: Requirements 1.2**
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (token) => {
          saveSession(token);
          return getSession() === token;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 3: Logout membersihkan sesi
  it('Property 3: logout clears the session so getSession returns null', () => {
    // **Validates: Requirements 1.2**

    // Mock window.location to avoid navigation errors in jsdom
    const originalLocation = window.location;
    delete window.location;
    window.location = { hash: '' };

    try {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (token) => {
            saveSession(token);
            logout();
            return getSession() === null;
          }
        ),
        { numRuns: 100 }
      );
    } finally {
      window.location = originalLocation;
    }
  });
});
