import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeUrl, sanitizeInput, stripHtml } from '@/lib/sanitize';

describe('sanitize', () => {
  describe('sanitizeHtml', () => {
    it('escapes HTML entities', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('handles plain text', () => {
      expect(sanitizeHtml('Hello world')).toBe('Hello world');
    });

    it('handles empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('escapes backticks and equals', () => {
      expect(sanitizeHtml('`test=1`')).toBe('&#96;test&#61;1&#96;');
    });
  });

  describe('sanitizeUrl', () => {
    it('allows https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('allows http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('blocks javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('blocks data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>')).toBeNull();
    });
  });

  describe('sanitizeInput', () => {
    it('trims and sanitizes', () => {
      expect(sanitizeInput('  <b>hello</b>  ')).toBe('&lt;b&gt;hello&lt;&#x2F;b&gt;');
    });

    it('respects max length', () => {
      expect(sanitizeInput('a'.repeat(600), 100).length).toBe(100);
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<b>bold</b> text')).toBe('bold text');
    });

    it('handles non-string input', () => {
      expect(stripHtml('' as unknown as string)).toBe('');
    });
  });
});
