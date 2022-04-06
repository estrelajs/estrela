export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface Subscriber<T> extends Observer<T> {
  completed: boolean;
  hasError: boolean;
  thrownError?: any;
}

export interface Subscription {
  unsubscribe(): void;
}
