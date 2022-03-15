import { html } from 'estrela';

// Result "component"
export const Result = ({ result, onRemove }: any) => html`
  <div key=${result.id} class="result">
    <div>
      <a href=${result.html_url} target="_blank"> ${result.full_name} </a>
      🌟<strong>${result.stargazers_count}</strong>
    </div>
    <p>${result.description}</p>
    ${Button({
      onClick: () => onRemove(result),
      children: `Remove ${Math.round(Math.random() * 1000)}`,
    })}
  </div>
`;

const Button = ({ onClick, children }: any) => html`
  <button on:click=${onClick}>${children}</button>
`;
