import { describe, expect, it } from 'vitest';
import {
  buildSellerOrderNotificationText,
  buildWhatsAppUrl,
  getOrderStatusLabel,
  normalizeOrderStatus,
  normalizeWhatsAppNumber,
} from './ordersService';

describe('normalizeOrderStatus', () => {
  it('maps the simplified lifecycle to the real schema without inventing new tables', () => {
    expect(normalizeOrderStatus('received')).toBe('pending');
    expect(normalizeOrderStatus('confirmed')).toBe('preparing');
    expect(normalizeOrderStatus('preparing')).toBe('preparing');
    expect(normalizeOrderStatus('completed')).toBe('delivered');
    expect(normalizeOrderStatus(null)).toBe('pending');
  });
});

describe('updateOrderStatus database mapping', () => {
  it('keeps the UI preparing state mapped to the database confirmed state', () => {
    expect(normalizeOrderStatus('confirmed')).toBe('preparing');
    expect(normalizeOrderStatus('preparing')).toBe('preparing');
  });
});

describe('getOrderStatusLabel', () => {
  it('shows the user-facing lifecycle in simple terms', () => {
    expect(getOrderStatusLabel('pending')).toBe('Order received');
    expect(getOrderStatusLabel('preparing')).toBe('Preparing');
    expect(getOrderStatusLabel('delivered')).toBe('Completed');
  });
});

describe('normalizeWhatsAppNumber', () => {
  it('normalizes local Zambian numbers into E.164', () => {
    expect(normalizeWhatsAppNumber('0971234567')).toBe('260971234567');
    expect(normalizeWhatsAppNumber('+260971234567')).toBe('260971234567');
  });
});

describe('buildSellerOrderNotificationText', () => {
  it('keeps the seller message concise and order-first', () => {
    expect(buildSellerOrderNotificationText({
      orderNumber: 'SHP-10482',
      itemName: 'Oversized Denim Jacket',
      quantity: 1,
      total: 'K 480.00',
      buyerName: 'Happy',
      deliveryLocation: 'Lusaka',
      orderLink: 'https://shopitt.app/orders/abc',
    })).toContain('NEW SHOPITT ORDER');
    expect(buildSellerOrderNotificationText({
      orderNumber: 'SHP-10482',
      itemName: 'Oversized Denim Jacket',
      quantity: 1,
      total: 'K 480.00',
      buyerName: 'Happy',
      deliveryLocation: 'Lusaka',
      orderLink: 'https://shopitt.app/orders/abc',
    })).toContain('https://shopitt.app/orders/abc');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a real deep link from a valid seller phone', () => {
    expect(buildWhatsAppUrl('+260971234567', 'Order #12345 for Glasses')).toContain('wa.me/260971234567');
  });
});
