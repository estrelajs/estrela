import { Output } from 'estrela';

export interface ButtonProps {
  children?: JSX.Children;
  disabled?: boolean;
  icon?: string;
  click?: Output<void>;
}

function Button(this: ButtonProps) {
  return (
    <button disabled={this.disabled} on:click={() => this.click?.()}>
      {this.icon && <i class={`fa-solid fa-${this.icon}`}></i>}
      <span>{this.children}</span>
    </button>
  );
}

export default Button;
