import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateLoginForm,
  saveSession,
  getSession,
  clearSession,
  login,
  logout,
  render,
} from '../../src/modules/auth/auth.js';

describe('Auth_Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --- validateLoginForm ---

  describe('validateLoginForm', () => {
    it('email dan password valid → valid: true, tidak ada errors', () => {
      const result = validateLoginForm('user@example.com', 'password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('email kosong → errors.email diset', () => {
      const result = validateLoginForm('', 'password123');
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('password kosong → errors.password diset', () => {
      const result = validateLoginForm('user@example.com', '');
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('format email tidak valid → errors.email diset', () => {
      const result = validateLoginForm('bukan-email', 'password123');
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });
  });

  // --- saveSession / getSession / clearSession ---

  describe('session management', () => {
    it('saveSession + getSession → mengembalikan token yang sama', () => {
      saveSession('my-token-abc');
      expect(getSession()).toBe('my-token-abc');
    });

    it('clearSession → getSession() mengembalikan null', () => {
      saveSession('some-token');
      clearSession();
      expect(getSession()).toBeNull();
    });
  });

  // --- login ---

  describe('login', () => {
    it('kredensial valid → success: true, token terdefinisi', async () => {
      const result = await login('user@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('kredensial tidak valid → success: false, error terdefinisi', async () => {
      const result = await login('invalid', '123');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // --- logout ---

  describe('logout', () => {
    it('logout → sesi dihapus (getSession mengembalikan null)', () => {
      // Mock window.location.hash agar tidak error di jsdom
      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      saveSession('active-token');
      logout();
      expect(getSession()).toBeNull();
    });
  });

  // --- render ---

  describe('render', () => {
    it('render → menyuntikkan form login ke container dengan elemen yang benar', () => {
      const container = document.createElement('div');
      render(container);

      expect(container.querySelector('#login-form')).not.toBeNull();
      expect(container.querySelector('#login-email')).not.toBeNull();
      expect(container.querySelector('#login-password')).not.toBeNull();
      expect(container.querySelector('button[type="submit"]')).not.toBeNull();
    });
  });
});
