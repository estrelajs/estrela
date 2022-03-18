import { render } from 'estrela';
import './style.css';

// components
import './app.estrela';
import './counter.estrela';
import './github.estrela';
import './greeter.estrela';
import './switch.estrela';

render('<app-root></app-root>', document.getElementById('app')!);
