// --- STATE MANAGEMENT ---

const SAVE_KEY = 'industrial_evolution_v9'; // Zmiana wersji zapisu (ważne!)

const initialState = {
    resources: {
        money: 0,
        knowledge: 0,
        hrPoints: 0,
        energyMax: 10,
        energyUsed: 0,
        reputation: 0,
        optimization: 0 // NOWY ZASÓB
    },
    machines: {}, // { id: { level: 1, unlocked: false, assignedEnergy: 0, currentProgress: 0 } }
    research: {}, // { id: { level: 1, unlocked: false, assignedEnergy: 0, currentProgress: 0 } }
    upgrades: {}, // { id: level }
    employees: { pm: 0, opt: 0, log: 0 },
    assignments: {}, // { machineId: { pm: 0, opt: 0, log: 0 } }
    headhunters: [], // { id, name, bonus, targetId }
    machineSpecialists: {}, // { machineId: specialistId }
    stats: {
        startTime: Date.now(),
        runEarnings: 0,
        lifetimeEarnings: 0
    },
    meta: {
        planetIndex: 0,
        continentIndex: 0,
        countryIndex: 0
    }
};

export let gameState = null;

// Deep copy helper
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge z initialState na wypadek nowych pól w przyszłych wersjach
            gameState = { ...deepCopy(initialState), ...parsed, resources: { ...deepCopy(initialState.resources), ...parsed.resources } };
            
            // Fix dla zasobów podrzędnych (machines, research) jeśli są puste
            if (!gameState.machines) gameState.machines = {};
            if (!gameState.research) gameState.research = {};
            if (!gameState.upgrades) gameState.upgrades = {};
            
            console.log("Game Loaded");
        } catch (e) {
            console.error("Save file corrupted, resetting.", e);
            resetSave();
        }
    } else {
        resetSave();
    }
    
    // Inicjalizacja struktur dla maszyn/badań jeśli nie istnieją
    // (To się dzieje w game.js przy pierwszym użyciu, ale tu warto wyczyścić starocie)
}

export function saveGame() {
    if (!gameState) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    console.log("Game Saved");
}

export function resetSave() {
    gameState = deepCopy(initialState);
    
    // Inicjalizacja podstawowych maszyn (z data.js zrobimy to dynamicznie, 
    // ale stan musi być czysty).
    
    // Odblokuj pierwszą maszynę manualnie w logice gry, tutaj tylko stan.
    saveGame();
    location.reload();
}

// Funkcja obsługująca różne rodzaje resetu (Prestiż / Podróż)
export function applyPrestigeReset(type) {
    // Zachowujemy to co ma przetrwać
    const currentRep = gameState.resources.reputation;
    const currentOpt = gameState.resources.optimization; // Zachowaj OPT
    const currentStats = gameState.stats;
    const currentMeta = gameState.meta;
    const currentHeadhunters = gameState.headhunters; // Headhunterzy zostają? Zazwyczaj tak w prestiżu.
    // Decyzja: Przyjmijmy, że Headhunterzy zostają przy resecie kraju, ale przy resecie planety mogą znikać?
    // Na razie zostawmy ich zawsze (są drodzy).

    // Reset stanu do czystego
    const newState = deepCopy(initialState);

    // Przywracanie wartości w zależności od typu resetu
    newState.resources.reputation = currentRep;
    newState.resources.optimization = currentOpt; // Przywróć OPT
    newState.stats = currentStats;
    newState.headhunters = currentHeadhunters;

    if (type === 'restructuring') {
        // Resetuje wszystko (lokację też? Zazwyczaj prestiż nie cofa lokacji w grach typu "podróż", 
        // ale w tej grze "Restrukturyzacja" to miękki reset w obecnym miejscu).
        // Zostajemy w tym samym kraju.
        newState.meta = currentMeta;
        
        // Wyzeruj run earnings dla nowego runu
        newState.stats.runEarnings = 0;
    } 
    else if (type === 'optimization') {
        // Nowy typ: Optymalizacja. Działa jak Restrukturyzacja, ale daje OPT.
        newState.meta = currentMeta;
        newState.stats.runEarnings = 0;
    }
    else if (type === 'country') {
        // Przeniesienie do nowego kraju (zachowaj Rep/Opt, zmień index)
        newState.meta = currentMeta;
        newState.stats.runEarnings = 0; // Nowy kraj = budowa od zera
    }
    else if (type === 'continent') {
        // Nowy kontynent (zachowaj Rep/Opt, zmień index)
        newState.meta = currentMeta;
        newState.stats.runEarnings = 0;
    }
    else if (type === 'planet') {
        // Nowa planeta (zachowaj Rep/Opt, zmień index)
        newState.meta = currentMeta;
        newState.stats.runEarnings = 0;
    }

    gameState = newState;
    saveGame();
    location.reload();
}