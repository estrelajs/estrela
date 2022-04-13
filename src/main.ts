import App from './components/App';
import { html, render } from './lib/dom';

render(html`<${App} />`, document.getElementById('app')!);
