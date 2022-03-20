import {
  EstrelaElement,
  EstrelaComponent,
  ComponentRender,
  HTMLTemplateLike,
} from '../types';
import { render } from './template/render';

export class ElementRef {
  hook = 0;

  static ref: ElementRef | undefined = undefined;

  static clear(): void {
    this.ref = undefined;
  }

  static setComponent(component: EstrelaComponent, element: EstrelaElement): void {
    ElementRef.ref = new ElementRef(component, element);
  }

  static setTemplate(
    template: HTMLTemplateLike | ComponentRender,
    host: HTMLElement | ShadowRoot
  ): void {
    ElementRef.ref = new ElementRef(
      ElementRef.ref?.component,
      ElementRef.ref?.element,
      template,
      host
    );
  }

  constructor(
    readonly component: EstrelaComponent | undefined,
    readonly element: EstrelaElement | undefined,
    readonly template?: HTMLTemplateLike | ComponentRender,
    readonly host?: HTMLElement | ShadowRoot
  ) {}

  nextHook(): void {
    this.hook++;
  }

  requestRender(): void {
    if (!this.host) {
      return;
    }
    const host = this.host instanceof ShadowRoot ? this.host.host : this.host;
    if ((host as EstrelaElement).requestRender) {
      (host as EstrelaElement).requestRender();
    } else {
      render(this.template, this.host);
    }
  }
}
