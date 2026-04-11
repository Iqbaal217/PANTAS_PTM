import { describe, it, expect, vi } from 'vitest';
import eventBus from '../../src/utils/eventBus.js';

describe('eventBus', () => {
  // Reset listeners before each test
  beforeEach(() => {
    eventBus._listeners = {};
  });

  it('memanggil listener saat event di-emit', () => {
    const handler = vi.fn();
    eventBus.on('test:event', handler);
    eventBus.emit('test:event', { value: 42 });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('mendukung beberapa listener untuk satu event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    eventBus.on('multi', h1);
    eventBus.on('multi', h2);
    eventBus.emit('multi', 'data');
    expect(h1).toHaveBeenCalledWith('data');
    expect(h2).toHaveBeenCalledWith('data');
  });

  it('off() menghapus listener sehingga tidak dipanggil lagi', () => {
    const handler = vi.fn();
    eventBus.on('remove:test', handler);
    eventBus.off('remove:test', handler);
    eventBus.emit('remove:test', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('emit() pada event tanpa listener tidak melempar error', () => {
    expect(() => eventBus.emit('no:listeners', {})).not.toThrow();
  });

  it('off() pada event yang tidak ada tidak melempar error', () => {
    expect(() => eventBus.off('nonexistent', () => {})).not.toThrow();
  });

  it('emit() tanpa data memanggil listener dengan undefined', () => {
    const handler = vi.fn();
    eventBus.on('no:data', handler);
    eventBus.emit('no:data');
    expect(handler).toHaveBeenCalledWith(undefined);
  });
});
