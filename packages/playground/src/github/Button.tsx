import { Component, EventEmitter } from 'estrela';

export interface ButtonProps {
  disabled?: boolean;
  icon?: string;
  click?: EventEmitter<void>;
}

const Button: Component<ButtonProps> = ({ disabled, icon, click }) => (
  <button disabled={disabled} on:click={() => click?.next()}>
    {icon && <i class={`fa-solid fa-${icon}`}></i>}
    <span>
      <slot />
    </span>
  </button>
);

export default Button;
