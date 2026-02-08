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
    const currentStats = gameState.stats;
    const currentMeta = gameState.meta;
    const currentHeadhunters = gameState.headhunters;

    // Reset stanu do czystego
    const newState = deepCopy(initialState);

    // Przywracanie wartości universal
    newState.stats = currentStats;
    newState.headhunters = currentHeadhunters;

    if (type === 'restructuring') {
        // Miękki reset - zachowaj Rep
        const currentRep = gameState.resources.reputation;
        newState.resources.reputation = currentRep;
        newState.meta = currentMeta;
        newState.stats.runEarnings = 0;
    } 
    else if (type === 'optimization') {
        // Miękki reset - zachowaj Opt
        const currentOpt = gameState.resources.optimization;
        newState.resources.optimization = currentOpt;
        newState.meta = currentMeta;
        newState.stats.runEarnings = 0;
    }
    else if (type === 'country') {
        // Ekspansja kraju - resetuj Rep i Opt, zmień index
        newState.meta = { ...currentMeta, countryIndex: currentMeta.countryIndex + 1 };
        newState.stats.runEarnings = 0;
    }
    else if (type === 'continent') {
        // Nowy kontynent - resetuj wszystko, zmień indeksy
        newState.meta = { ...currentMeta, continentIndex: currentMeta.continentIndex + 1, countryIndex: 0 };
        newState.stats.runEarnings = 0;
    }
    else if (type === 'planet') {
        // Nowa planeta - resetuj wszystko, zmień indeksy
        newState.meta = { ...currentMeta, planetIndex: currentMeta.planetIndex + 1, continentIndex: 0, countryIndex: 0 };
        newState.stats.runEarnings = 0;
    }

    gameState = newState;
    saveGame();
    location.reload();
}