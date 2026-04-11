/**
 * Centralized event bus for inter-module communication.
 * Exported as a singleton instance.
 */
const eventBus = {
  _listeners: {},

  /**
   * Subscribe to an event.
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   */
  on(event, listener) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  },

  /**
   * Unsubscribe from an event.
   * @param {string} event - Event name
   * @param {Function} listener - Callback function to remove
   */
  off(event, listener) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l !== listener);
  },

  /**
   * Emit an event with optional data.
   * @param {string} event - Event name
   * @param {*} data - Optional data to pass to listeners
   */
  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(listener => listener(data));
  },
};

export default eventBus;
