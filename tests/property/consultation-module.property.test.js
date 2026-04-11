import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  createConsultation,
  cancelConsultation,
  getUpcomingConsultations,
  _setStore,
  _getScheduledReminderTime,
} from '../../src/modules/consultation/consultationModule.js';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const timeStrArb = fc
  .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
  .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

// Tanggal di masa depan (minimal 2 jam ke depan agar reminder bisa dijadwalkan)
const futureDateArb = fc
  .date({ min: new Date(Date.now() + 2 * 60 * 60 * 1000), max: new Date('2030-12-31') })
  .map((d) => d.toISOString());

const consultationArb = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  doctorName: fc.string({ minLength: 1, maxLength: 50 }),
  specialization: fc.string({ minLength: 1, maxLength: 50 }),
  scheduledDate: futureDateArb,
  scheduledTime: timeStrArb,
  method: fc.constantFrom('in_person', 'online'),
  status: fc.constant('upcoming'),
  reminderSet: fc.boolean(),
  notes: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
});

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Consultation_Module Property Tests', () => {
  // Feature: pantas-ptm-monitoring, Property 20: Jadwal konsultasi tersimpan dan dapat diambil kembali (round-trip)
  it('Property 20: createConsultation kemudian getUpcomingConsultations mengembalikan jadwal dengan field yang identik', async () => {
    // **Validates: Requirements 10.1**
    await fc.assert(
      fc.asyncProperty(consultationArb, async (consultation) => {
        localStorage.clear();

        await createConsultation(consultation);
        const upcoming = getUpcomingConsultations();

        const found = upcoming.find((c) => c.id === consultation.id);
        if (!found) return false;

        return (
          found.id === consultation.id &&
          found.userId === consultation.userId &&
          found.doctorName === consultation.doctorName &&
          found.specialization === consultation.specialization &&
          found.scheduledDate === consultation.scheduledDate &&
          found.scheduledTime === consultation.scheduledTime &&
          found.method === consultation.method &&
          found.status === 'upcoming'
        );
      }),
      { numRuns: 50 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 21: Pengingat konsultasi selalu dijadwalkan 1 jam sebelumnya
  it('Property 21: _getScheduledReminderTime mengembalikan waktu tepat 60 menit sebelum jadwal konsultasi', () => {
    // **Validates: Requirements 10.2**
    fc.assert(
      fc.property(consultationArb, (consultation) => {
        const reminderTime = _getScheduledReminderTime(consultation);

        // Hitung waktu konsultasi yang diharapkan
        const [hours, minutes] = consultation.scheduledTime.split(':').map(Number);
        const consultationTime = new Date(consultation.scheduledDate);
        consultationTime.setHours(hours, minutes, 0, 0);

        const diffMs = consultationTime.getTime() - reminderTime.getTime();
        const diffMinutes = diffMs / (60 * 1000);

        return diffMinutes === 60;
      }),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 22: Hanya jadwal upcoming yang dikembalikan oleh getUpcomingConsultations
  it('Property 22: getUpcomingConsultations hanya mengembalikan jadwal dengan status upcoming', () => {
    // **Validates: Requirements 10.3**
    fc.assert(
      fc.property(
        fc.array(consultationArb, { minLength: 1, maxLength: 10 }),
        fc.array(
          consultationArb.map((c) => ({ ...c, status: 'completed' })),
          { minLength: 0, maxLength: 5 }
        ),
        fc.array(
          consultationArb.map((c) => ({ ...c, status: 'cancelled' })),
          { minLength: 0, maxLength: 5 }
        ),
        (upcomingList, completedList, cancelledList) => {
          localStorage.clear();

          const all = [...upcomingList, ...completedList, ...cancelledList];
          // Deduplikasi id
          const seen = new Set();
          const unique = all.filter((c) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });

          _setStore(unique);

          const upcoming = getUpcomingConsultations();
          return upcoming.every((c) => c.status === 'upcoming');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pantas-ptm-monitoring, Property 23: Pembatalan jadwal menghilangkannya dari daftar upcoming
  it('Property 23: cancelConsultation(id) membuat jadwal tidak muncul di getUpcomingConsultations', async () => {
    // **Validates: Requirements 10.5**
    await fc.assert(
      fc.asyncProperty(consultationArb, async (consultation) => {
        localStorage.clear();

        await createConsultation(consultation);
        await cancelConsultation(consultation.id);

        const upcoming = getUpcomingConsultations();
        return !upcoming.some((c) => c.id === consultation.id);
      }),
      { numRuns: 50 }
    );
  });
});
