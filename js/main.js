/** Entry point: boot the game and wire up the debug-mode checkbox.
 *  Loaded by index.html as `<script type="module" src="js/main.js">`, so
 *  the DOM is already parsed by the time this runs.
 *  The debug panel starts hidden via its inline style in index.html. */
import { game } from './game/game.js';
import { toggleDebugger, debugModeToggle } from './core/dom.js';

game.start();

debugModeToggle.addEventListener('change', function() {
    game.debugMode = !game.debugMode;
    toggleDebugger();
});
