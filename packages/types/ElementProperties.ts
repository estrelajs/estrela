import { Subscription } from 'rxjs';
import { EventEmitter, StateSubject } from '../core';

export interface ElementProperties {
  emitters: Record<string, EventEmitter<any> | undefined>;
  props: Record<string, StateSubject<any> | undefined>;
  state: StateSubject<any> | StateSubject<any>[];
  subscription: Subscription | Subscription[];
}
