import { Subscription } from 'rxjs';
import { EventEmitter, StateSubject } from '../core';

export interface ElementProperties {
  emitters?: Record<string, EventEmitter<any>>;
  props?: Record<string, StateSubject<any>>;
  state?: StateSubject<any> | StateSubject<any>[];
  subscription?: Subscription | Subscription[];
}
