import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  addReminder,
  removeReminder,
  getActiveReminders,
  _setStore,
} from '../../src/modules/reminder/reminderModule.js';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const timeStrArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

const medicationReminderArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  medicationName: fc.string({ minLength: 1, maxLength: 50 }),
  dosage: fc.string({ minLength: 1, maxLength: 20 }),
  frequency: fc.constantFrom('daily', 'twice_daily', 'three_times_daily', 'weekly', 'custom'),
  scheduledTimes: fc.array(timeStrArb, { minLength: 1, maxLength: 4 }),
  isActive: fc.constant(true),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map((d) => d.toISOString()),
  lastStatus: fc.constantFrom('taken', 'skipped', 'pending'),
});

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Reminder_Module Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 17: Pengingat obat tersimpan dan dapat diambil kembali (round-trip)
  it('Property 17: addReminder kemudian getActiveReminders mengembalikan pengingat dengan field yang identik', async () => {
    // **Validates: Requirements 9.1**
    await fc.assert(
      fc.asyncProperty(medicationReminderArb, async (reminder) => {
        localStorage.clear();

        await addReminder(reminder);
        const actives = getActiveReminders();

        const found = actives.find((r) => r.id === reminder.id);
        if (!found) return false;

        return (
          found.id === reminder.id &&
          found.userId === reminder.userId &&
          found.medicationName === reminder.medicationName &&
          found.dosage === reminder.dosage &&
          found.frequency === reminder.frequency &&
          found.isActive === true &&
          found.createdAt === reminder.createdAt
        );
      }),
      { numRuns: 50 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 18: Hanya pengingat aktif yang dikembalikan
  it('Property 18: getActiveReminders hanya mengembalikan pengingat dengan isActive === true', async () => {
    // **Validates: Requirements 9.4**
    await fc.assert(
      fc.asyncProperty(
        fc.array(medicationReminderArb, { minLength: 1, maxLength: 10 }),
        fc.array(
          medicationReminderArb.map((r) => ({ ...r, isActive: false })),
          { minLength: 1, maxLength: 10 }
        ),
        async (activeReminders, inactiveReminders) => {
          localStorage.clear();

          // Pastikan id unik: gabungkan dan deduplikasi
          const allReminders = [...activeReminders, ...inactiveReminders];
          const seen = new Set();
          const unique = allReminders.filter((r) => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });

          _setStore(unique);

          const actives = getActiveReminders();

          // Semua yang dikembalikan harus isActive === true
          return actives.every((r) => r.isActive === true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 19: Penghapusan pengingat menghilangkannya dari daftar aktif
  it('Property 19: removeReminder(id) membuat pengingat tidak muncul di getActiveReminders', async () => {
    // **Validates: Requirements 9.5**
    await fc.assert(
      fc.asyncProperty(medicationReminderArb, async (reminder) => {
        localStorage.clear();

        await addReminder(reminder);
        await removeReminder(reminder.id);

        const actives = getActiveReminders();
        return !actives.some((r) => r.id === reminder.id);
      }),
      { numRuns: 50 }
    );
  });
});
