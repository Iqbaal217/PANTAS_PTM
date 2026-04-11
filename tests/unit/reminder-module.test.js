import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addReminder,
  removeReminder,
  markReminder,
  getActiveReminders,
  scheduleNotification,
  cancelNotification,
  _getStore,
  _setStore,
} from '../../src/modules/reminder/reminderModule.js';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Reminder_Module Unit Tests', () => {
  const makeReminder = (overrides = {}) => ({
    id: 'rem-001',
    userId: 'user-1',
    medicationName: 'Amlodipin',
    dosage: '5mg',
    frequency: 'daily',
    scheduledTimes: ['08:00'],
    isActive: true,
    createdAt: new Date().toISOString(),
    lastStatus: 'pending',
    ...overrides,
  });

  // 1. addReminder → getActiveReminders returns the added reminder
  it('addReminder kemudian getActiveReminders mengembalikan pengingat yang ditambahkan', async () => {
    const reminder = makeReminder();
    await addReminder(reminder);

    const actives = getActiveReminders();
    expect(actives).toHaveLength(1);
    expect(actives[0].id).toBe(reminder.id);
    expect(actives[0].medicationName).toBe(reminder.medicationName);
  });

  // 2. removeReminder → reminder no longer in getActiveReminders
  it('removeReminder membuat pengingat tidak muncul di getActiveReminders', async () => {
    const reminder = makeReminder();
    await addReminder(reminder);
    await removeReminder(reminder.id);

    const actives = getActiveReminders();
    expect(actives).toHaveLength(0);
  });

  // 3. markReminder('taken') → lastStatus is 'taken'
  it("markReminder dengan status 'taken' mengubah lastStatus menjadi 'taken'", async () => {
    const reminder = makeReminder();
    await addReminder(reminder);
    await markReminder(reminder.id, 'taken');

    const store = _getStore();
    const saved = store.find((r) => r.id === reminder.id);
    expect(saved.lastStatus).toBe('taken');
  });

  // 4. markReminder('skipped') → lastStatus is 'skipped'
  it("markReminder dengan status 'skipped' mengubah lastStatus menjadi 'skipped'", async () => {
    const reminder = makeReminder();
    await addReminder(reminder);
    await markReminder(reminder.id, 'skipped');

    const store = _getStore();
    const saved = store.find((r) => r.id === reminder.id);
    expect(saved.lastStatus).toBe('skipped');
  });

  // 5. getActiveReminders only returns reminders with isActive === true
  it('getActiveReminders hanya mengembalikan pengingat dengan isActive === true', async () => {
    const active = makeReminder({ id: 'rem-active', isActive: true });
    const inactive = makeReminder({ id: 'rem-inactive', isActive: false });

    // Simpan langsung ke store untuk menghindari scheduleNotification
    _setStore([active, inactive]);

    const actives = getActiveReminders();
    expect(actives).toHaveLength(1);
    expect(actives[0].id).toBe('rem-active');
  });

  // 6. cancelNotification clears the timeout (use vi.useFakeTimers)
  it('cancelNotification membersihkan timeout yang dijadwalkan', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const reminder = makeReminder({ scheduledTimes: ['23:59'] });
    scheduleNotification(reminder);
    cancelNotification(reminder.id);

    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  // 7. scheduleNotification doesn't throw when Notification API unavailable
  it('scheduleNotification tidak melempar error ketika Notification API tidak tersedia', () => {
    vi.useFakeTimers();

    // Hapus Notification dari global scope
    const originalNotification = globalThis.Notification;
    delete globalThis.Notification;

    const reminder = makeReminder({ scheduledTimes: ['09:00'] });
    expect(() => scheduleNotification(reminder)).not.toThrow();

    // Restore
    globalThis.Notification = originalNotification;
    vi.useRealTimers();
  });
});
