import { Logger } from '@nestjs/common';
import { AppDataSource } from './data-source';
import { ProductEntity } from './entities/product.entity';

/**
 * The demo listings that used to live in an in-memory array.
 *
 * `ownerUserId` is left NULL on purpose: these are platform-curated events with
 * no human owner, which is what makes an owner's dashboard start empty instead
 * of showing events they did not create.
 *
 * The `e-1`..`e-5` ids are kept verbatim. The frontend selects event artwork by
 * id and falls back to a single default image, so re-issuing these as uuids would
 * silently make every seeded card look the same.
 */
const SEED_EVENTS: Array<{
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  /** Days from "now"; negative = already started, positive = upcoming. */
  startsInDays: number;
}> = [
  {
    id: 'e-1',
    name: 'Acoustic Night - Nguyễn Du Garden',
    description: 'Semi-acoustic set under the trees (standing)',
    price: '25.00',
    stock: 200,
    startsInDays: -30,
  },
  {
    id: 'e-2',
    name: 'Indie Live at The Wall',
    description: '3-band indie lineup, indoor stage',
    price: '60.00',
    stock: 120,
    startsInDays: -10,
  },
  {
    id: 'e-3',
    name: 'Tech Summit 2026 (All-Access)',
    description: '2-day conference, all talks + expo',
    price: '300.00',
    stock: 40,
    startsInDays: 30,
  },
  {
    id: 'e-4',
    name: 'Weekend Festival 3-Day Pass',
    description: '3-day camping festival with 40 artists',
    price: '1200.00',
    stock: 30,
    startsInDays: 90,
  },
  {
    id: 'e-5',
    name: 'VIP Backstage Pass',
    description: 'Meet-and-greet + backstage access (over-limit tier)',
    price: '12000.00',
    stock: 5,
    startsInDays: 180,
  },
];

/** A start date `days` from now (negative for a past event). */
function startsAt(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Idempotent seed: an event that already exists is left untouched, so re-running
 * never resets stock that has been sold down or overwrites an edit.
 */
export async function seedCatalog(): Promise<void> {
  const logger = new Logger('CatalogSeed');
  const source = AppDataSource.getRepository(ProductEntity);

  let created = 0;
  for (const event of SEED_EVENTS) {
    const existing = await source.findOne({ where: { id: event.id } });
    if (existing) continue;

    await source.insert({
      id: event.id,
      name: event.name,
      description: event.description,
      price: event.price,
      stock: event.stock,
      ownerUserId: null,
      startsAt: startsAt(event.startsInDays),
    });
    created++;
  }

  logger.log(created > 0 ? `seeded ${created} event(s)` : 'catalog already seeded, nothing to do');
}

if (require.main === module) {
  AppDataSource.initialize()
    .then(seedCatalog)
    .then(() => AppDataSource.destroy())
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}
