import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export const NOTIFICATION_EVENTS = {
  CHANGED: 'notification:changed',
} as const;

export function emitNotificationChanged(): void {
  emitter.emit(NOTIFICATION_EVENTS.CHANGED);
}

export function onNotificationChanged(listener: () => void): () => void {
  emitter.on(NOTIFICATION_EVENTS.CHANGED, listener);
  return () => {
    emitter.off(NOTIFICATION_EVENTS.CHANGED, listener);
  };
}
