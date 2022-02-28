import {
  defineElement,
  emitter,
  FE,
  html,
  prop,
  setProperties,
} from '../../revange';

// Result "component"
const Result: FE = element => {
  const result = prop<any>();
  const remove = emitter<any>();

  setProperties({
    emitters: { remove },
    props: { result },
  });

  element.addEventListener('destroy', function () {
    console.log('element destroyed', this);
  });

  return () => {
    return html`
      <div>
        <a href=${result().html_url} target="_blank"> ${result().full_name} </a>
        🌟<strong>${result().stargazers_count}</strong>
      </div>
      <p>${result().description}</p>
      ${Button({
        onClick: () => remove.emit(result()),
        children: 'Remove',
      })}

      <style>
        :host {
          padding: 10px;
          margin: 10px;
          background: white;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
        }
      </style>
    `;
  };
};

const Button = ({ onClick, children }: any) => html`
  <button on:click=${onClick}>${children}</button>
`;

defineElement('app-result', Result);
