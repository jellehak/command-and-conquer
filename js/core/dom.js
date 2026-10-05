/** The canvas every subsystem draws on, plus the two debug-panel nodes
 *  that index.html exposes. This module is the leaf of the dependency
 *  graph, so it can be imported from anywhere without creating a cycle. */
export const canvas = document.getElementById('canvas');
export const context = canvas.getContext('2d');

export const debuggerPanel = document.getElementById('debugger');
export const debugModeToggle = document.getElementById('debug_mode');

/** Show/hide the debug panel. */
export function toggleDebugger() {
    if (!debuggerPanel) {
        return;
    }
    debuggerPanel.style.display = debuggerPanel.style.display === 'none' ? '' : 'none';
}
