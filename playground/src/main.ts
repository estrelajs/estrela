import { render } from 'estrela';
import './style.css';

// components
import './app.estrela';
import './examples/counter.estrela';
import './examples/forms.estrela';
import './examples/github.estrela';
import './examples/greeter.estrela';
import './examples/switch.estrela';
import './github/github-content.estrela';
import './github/github-result.estrela';

render('<app-root></app-root>', document.getElementById('app')!);
