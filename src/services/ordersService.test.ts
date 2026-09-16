import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl, getOrderStatusLabel, normalizeOrderStatus } from './ordersService';

describe('normalizeOrderStatus', () => {
  it('maps the simplified lifecycle to the real schema without inventing new tables', () => {
    expect(normalizeOrderStatus('received')).toBe('pending');
    expect(normalizeOrderStatus('preparing')).toBe('preparing');
    expect(normalizeOrderStatus('completed')).toBe('delivered');
    expect(normalizeOrderStatus(null)).toBe('pending');
  });
});

describe('getOrderStatusLabel', () => {
  it('shows the user-facing lifecycle in simple terms', () => {
    expect(getOrderStatusLabel('pending')).toBe('Order received');
    expect(getOrderStatusLabel('preparing')).toBe('Preparing');
    expect(getOrderStatusLabel('delivered')).toBe('Completed');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a real deep link from a valid seller phone', () => {
    expect(buildWhatsAppUrl('+260971234567', 'Order #12345 for Glasses')).toContain('wa.me/260971234567');
  });
});
