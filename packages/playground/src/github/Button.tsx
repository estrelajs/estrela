import { Component } from 'estrela';

export interface ButtonProps {
  disabled?: boolean;
  icon?: string;
  emitters: {
    click: void;
  };
}
const Button: Component<ButtonProps> = ({ disabled, icon, click }) => {
  return (
    <button disabled={disabled()} on:click={() => click.next()}>
      {icon() && <i class={`fa-solid fa-${icon()}`}></i>}
      <span>
        <slot />
      </span>
    </button>
  );
};

export default Button;
