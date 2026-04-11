import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');

describe('Navbar', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = html;
  });

  it('should contain 6 navigation links', () => {
    const links = document.querySelectorAll('.nav-links a');
    expect(links.length).toBe(6);
  });

  it('should have correct href for each nav link', () => {
    const expectedHrefs = ['#hero', '#about', '#skills', '#projects', '#education', '#contact'];
    const links = document.querySelectorAll('.nav-links a');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expectedHrefs.forEach(href => {
      expect(hrefs).toContain(href);
    });
  });

  it('should have a dark-mode-toggle button', () => {
    const btn = document.getElementById('dark-mode-toggle');
    expect(btn).not.toBeNull();
  });

  it('should have a hamburger button', () => {
    const btn = document.getElementById('hamburger');
    expect(btn).not.toBeNull();
  });

  it('should have hamburger button with aria-expanded attribute', () => {
    const btn = document.getElementById('hamburger');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });
});
