import { Component, EventEmitter } from 'estrela';

export interface ButtonProps {
  disabled?: boolean;
  icon?: string;
  click?: EventEmitter<void>;
}

const Button: Component<ButtonProps> = props => (
  <button disabled={() => props.disabled} on:click={() => props.click?.next()}>
    {() => props.icon && <i class={`fa-solid fa-${props.icon}`}></i>}
    <span>
      <slot />
    </span>
  </button>
);

export default Button;
