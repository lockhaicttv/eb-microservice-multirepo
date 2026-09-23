import { Injectable } from '@nestjs/common';
import { Product } from '@demo/contracts';

export const MAX_ORDER_TOTAL = 10000;

/**
 * Demo catalog is seeded as live EVENTS, each mapped onto the `Product` gRPC wire type
 * (name -> event title, price -> ticket price, stock -> tickets left / capacity).
 * Domestic contract stays `products`; the event/ticket vocabulary is exposed at the BFF
 * GraphQL layer. A future `createEvent` (business owner) will write through this store.
 */
const seedEvents: Product[] = [
  { id: 'e-1', name: 'Acoustic Night - Nguyễn Du Garden', description: 'Semi-acoustic set under the trees (standing)', price: 25, stock: 200 },
  { id: 'e-2', name: 'Indie Live at The Wall', description: '3-band indie lineup, indoor stage', price: 60, stock: 120 },
  { id: 'e-3', name: 'Tech Summit 2026 (All-Access)', description: '2-day conference, all talks + expo', price: 300, stock: 40 },
  { id: 'e-4', name: 'Weekend Festival 3-Day Pass', description: '3-day camping festival with 40 artists', price: 1200, stock: 30 },
  { id: 'e-5', name: 'VIP Backstage Pass', description: 'Meet-and-greet + backstage access (over-limit tier)', price: 12000, stock: 5 },
];

@Injectable()
export class ProductsStore {
  private readonly products = new Map<string, Product>();

  constructor() {
    for (const p of seedEvents) this.products.set(p.id, p);
  }

  list(query?: string): Product[] {
    const q = (query ?? '').trim().toLowerCase();
    const all = [...this.products.values()];
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }

  get(id: string): Product | undefined {
    return this.products.get(id);
  }
}
