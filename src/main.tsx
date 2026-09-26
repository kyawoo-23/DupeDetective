import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// biome-ignore lint/style/noNonNullAssertion: root element is guaranteed by index.html
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
