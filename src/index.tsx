import { render } from 'solid-js/web';
import App from './App';
import './styles/theme.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

const root = document.getElementById('root');

if (root) {
  render(() => <App />, root);
}
