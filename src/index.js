import './style.css';
import { renderFooter } from './components/footer.js';
import { renderGameModeSelection } from './controllers/domController.js';
import { setupGame } from './controllers/gameController.js';

renderGameModeSelection(setupGame);
renderFooter();
