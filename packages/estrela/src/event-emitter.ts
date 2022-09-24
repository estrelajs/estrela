export class EventEmitter<T = void> {
  private listeners = new Set<(value: T) => void>();

  emit(value: T): void {
    Array.from(this.listeners).forEach(listener => listener(value));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
