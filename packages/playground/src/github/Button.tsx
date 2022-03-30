import { Component, EventEmitter } from 'estrela';

export interface ButtonProps {
  icon?: string;
  click?: EventEmitter<void>;
}

const Button: Component<ButtonProps> = ({ icon, click }) => {
  return (
    <button on:click={() => click.next()}>
      {icon() && <i class={`fa-solid fa-${icon()}`}></i>}
      <span>
        <slot />
      </span>
    </button>
  );
};

export default Button;
