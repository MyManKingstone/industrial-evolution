import { loadGame, saveGame, resetSave, gameState } from './state.js';
import { updateGame } from './game.js';
import { initUI, updateUI, showSaveToast } from './ui.js'; // Dodano import showSaveToast

// Setup
try {
    loadGame();
    initUI();
} catch (e) {
    console.error("CRITICAL ERROR IN INIT:", e);
}

// Global Buttons
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');

if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        saveGame();
        showSaveToast(); // Pokaż dymek przy ręcznym zapisie
    });
}
if (resetBtn) resetBtn.addEventListener('click', resetSave);

// --- AUTO SAVE SYSTEM ---

// 1. Zapisuj co 30 sekund (rzadziej, żeby nie spamować dymkiem)
setInterval(() => {
    saveGame();
    showSaveToast();
}, 30000);

// 2. Zapisuj ZAWSZE przy zamykaniu karty/odświeżaniu
window.addEventListener('beforeunload', () => {
    saveGame();
});

// --- GAME LOOP ---
let lastTime = performance.now();

function loop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    try {
        if(gameState) {
            updateGame(deltaTime);
            updateUI();
        }
    } catch (e) {
        console.error("LOOP ERROR:", e);
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);