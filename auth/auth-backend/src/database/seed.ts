import * as bcrypt from 'bcryptjs';
import { USER_ROLES, UserRole } from '@demo/contracts';
import { AppDataSource } from './data-source';
import { UserEntity } from './user.entity';

/**
 * Idempotent seed for the demo accounts referenced in the README
 * (alice@demo.dev / alice123, bob@demo.dev / bob123).
 *
 * Safe to re-run: an account that already exists is left untouched, so this
 * never resets a password someone changed by hand.
 */
/**
 * The admin is seeded rather than promoted, because promoting requires an admin
 * — otherwise there would be no way to reach the admin UI on a fresh database.
 *
 * Only ADMIN is seeded directly. EVENT_OWNER is left out so the admin
 * "promote a user" flow is actually reachable in the demo; `carol@demo.dev`
 * starts as CUSTOMER and gets promoted from the admin page.
 */
const SEED_USERS: Array<{ email: string; name: string; password: string; role: UserRole }> = [
  { email: 'admin@demo.dev', name: 'Ada Admin', password: 'admin123', role: USER_ROLES.ADMIN },
  { email: 'alice@demo.dev', name: 'Alice', password: 'alice123', role: USER_ROLES.CUSTOMER },
  { email: 'bob@demo.dev', name: 'Bob', password: 'bob123', role: USER_ROLES.CUSTOMER },
  { email: 'carol@demo.dev', name: 'Carol', password: 'carol123', role: USER_ROLES.CUSTOMER },
];

const BCRYPT_ROUNDS = 10;

async function seed() {
  const dataSource = await AppDataSource.initialize();
  const repo = dataSource.getRepository(UserEntity);

  try {
    for (const seedUser of SEED_USERS) {
      const existing = await repo.findOne({ where: { email: seedUser.email } });
      if (existing) {
        // Reconcile the role but never the password: the role is part of the
        // declared demo fixture, while a hand-edited password should survive a
        // re-seed. Without this, an account whose role was lost (e.g. the role
        // column was dropped and re-added) could never be restored, since the
        // only way back is to promote it and promotion needs an admin.
        if (existing.role !== seedUser.role) {
          const previous = existing.role;
          existing.role = seedUser.role;
          await repo.save(existing);
          console.log(`[seed] ${seedUser.email} role ${previous} -> ${seedUser.role} (reconciled)`);
        } else {
          console.log(`[seed] ${seedUser.email} already exists (id=${existing.id}) — skipped`);
        }
        continue;
      }
      const saved = await repo.save(
        repo.create({
          email: seedUser.email,
          name: seedUser.name,
          role: seedUser.role,
          passwordHash: await bcrypt.hash(seedUser.password, BCRYPT_ROUNDS),
        }),
      );
      console.log(`[seed] created ${saved.email} [${saved.role}] (id=${saved.id})`);
    }
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('[seed] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});