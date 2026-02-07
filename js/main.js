import { loadGame, saveGame, resetSave, gameState } from './state.js';
import { updateGame } from './game.js';
import { initUI, updateUI } from './ui.js';

// Setup
try {
    loadGame();
    initUI();
} catch (e) {
    console.error("CRITICAL ERROR IN INIT:", e);
    // Awaryjne czyszczenie jeśli initUI padnie przez złe dane
    localStorage.clear();
    location.reload();
}

// Obsługa przycisków globalnych
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');

if (saveBtn) saveBtn.addEventListener('click', saveGame);
if (resetBtn) resetBtn.addEventListener('click', resetSave);

// Auto-Save
setInterval(saveGame, 10000);

// GAME LOOP
let lastTime = performance.now();

function loop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    // Bezpieczne wywołanie logiki gry
    try {
        if(gameState) {
            updateGame(deltaTime);
            updateUI();
        }
    } catch (e) {
        console.error("GAME LOOP ERROR:", e);
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);