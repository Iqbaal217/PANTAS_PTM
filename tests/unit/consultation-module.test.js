import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createConsultation,
  updateConsultation,
  cancelConsultation,
  getUpcomingConsultations,
  getConsultationHistory,
  exportToCalendar,
  _getStore,
  _setStore,
  _getScheduledReminderTime,
} from '../../src/modules/consultation/consultationModule.js';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Consultation_Module Unit Tests', () => {
  const makeConsultation = (overrides = {}) => ({
    id: 'cons-001',
    userId: 'user-1',
    doctorName: 'Dr. Budi Santoso',
    specialization: 'Kardiologi',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 hari ke depan
    scheduledTime: '10:00',
    method: 'in_person',
    status: 'upcoming',
    reminderSet: false,
    notes: 'Bawa hasil lab',
    ...overrides,
  });

  // 1. createConsultation → getUpcomingConsultations returns the consultation
  it('createConsultation kemudian getUpcomingConsultations mengembalikan konsultasi yang dibuat', async () => {
    vi.useFakeTimers();
    const consultation = makeConsultation();
    await createConsultation(consultation);

    const upcoming = getUpcomingConsultations();
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].id).toBe(consultation.id);
    expect(upcoming[0].doctorName).toBe(consultation.doctorName);
    expect(upcoming[0].status).toBe('upcoming');
    vi.useRealTimers();
  });

  // 2. cancelConsultation → consultation no longer in getUpcomingConsultations
  it('cancelConsultation membuat konsultasi tidak muncul di getUpcomingConsultations', async () => {
    vi.useFakeTimers();
    const consultation = makeConsultation();
    await createConsultation(consultation);
    await cancelConsultation(consultation.id);

    const upcoming = getUpcomingConsultations();
    expect(upcoming).toHaveLength(0);
    vi.useRealTimers();
  });

  // 3. updateConsultation → updates the specified fields
  it('updateConsultation memperbarui field yang ditentukan', async () => {
    vi.useFakeTimers();
    const consultation = makeConsultation();
    await createConsultation(consultation);
    await updateConsultation(consultation.id, { doctorName: 'Dr. Siti Rahayu', method: 'online' });

    const store = _getStore();
    const updated = store.find((c) => c.id === consultation.id);
    expect(updated.doctorName).toBe('Dr. Siti Rahayu');
    expect(updated.method).toBe('online');
    expect(updated.specialization).toBe(consultation.specialization); // field lain tidak berubah
    vi.useRealTimers();
  });

  // 4. getUpcomingConsultations only returns status === 'upcoming'
  it('getUpcomingConsultations hanya mengembalikan konsultasi dengan status upcoming', () => {
    _setStore([
      makeConsultation({ id: 'c1', status: 'upcoming' }),
      makeConsultation({ id: 'c2', status: 'completed' }),
      makeConsultation({ id: 'c3', status: 'cancelled' }),
    ]);

    const upcoming = getUpcomingConsultations();
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].id).toBe('c1');
  });

  // 5. getConsultationHistory returns completed/cancelled consultations
  it('getConsultationHistory mengembalikan konsultasi completed dan cancelled', () => {
    _setStore([
      makeConsultation({ id: 'c1', status: 'upcoming' }),
      makeConsultation({ id: 'c2', status: 'completed' }),
      makeConsultation({ id: 'c3', status: 'cancelled' }),
    ]);

    const history = getConsultationHistory();
    expect(history).toHaveLength(2);
    const ids = history.map((c) => c.id);
    expect(ids).toContain('c2');
    expect(ids).toContain('c3');
    expect(ids).not.toContain('c1');
  });

  // 6. exportToCalendar returns iCal string with BEGIN:VCALENDAR
  it('exportToCalendar mengembalikan string iCal dengan BEGIN:VCALENDAR', () => {
    const consultation = makeConsultation();
    // Stub URL API yang tidak tersedia di jsdom
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    const ical = exportToCalendar(consultation);

    expect(ical).toContain('BEGIN:VCALENDAR');
    expect(ical).toContain('BEGIN:VEVENT');
    expect(ical).toContain('END:VEVENT');
    expect(ical).toContain('END:VCALENDAR');
    expect(ical).toContain('DTSTART:');
    expect(ical).toContain('DTEND:');
    expect(ical).toContain(`Konsultasi dengan ${consultation.doctorName}`);
  });

  // 7. _getScheduledReminderTime returns time 1 hour before consultation
  it('_getScheduledReminderTime mengembalikan waktu 1 jam sebelum konsultasi', () => {
    const scheduledDate = new Date('2025-08-15T00:00:00.000Z').toISOString();
    const consultation = makeConsultation({ scheduledDate, scheduledTime: '10:00' });

    const reminderTime = _getScheduledReminderTime(consultation);

    // Buat waktu konsultasi yang diharapkan
    const expectedConsultationTime = new Date('2025-08-15T00:00:00.000Z');
    expectedConsultationTime.setHours(10, 0, 0, 0);
    const expectedReminderTime = new Date(expectedConsultationTime.getTime() - 60 * 60 * 1000);

    expect(reminderTime.getTime()).toBe(expectedReminderTime.getTime());
  });
});
