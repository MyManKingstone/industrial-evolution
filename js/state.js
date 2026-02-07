import { MACHINES_CONFIG, RESEARCH_CONFIG } from './data.js';

const SAVE_KEY = 'industrial_evo_save_v8_final_fix'; // Nowy klucz wymusi czysty start

const defaultState = {
    resources: {
        money: 0,
        knowledge: 0,
        hrPoints: 0,
        energyUsed: 0,
        energyMax: 10,
        reputation: 0
    },
    stats: {
        runEarnings: 0,
        lifetimeEarnings: 0
    },
    meta: {
        planetIndex: 0,
        continentIndex: 0,
        countryIndex: 0
    },
    machines: {},
    research: {},
    upgrades: {},
    employees: { pm: 0, opt: 0, log: 0 },
    assignments: {},
    headhunters: [],
    machineSpecialists: {}
};

export function getFreshMachinesState() {
    const machines = {};
    MACHINES_CONFIG.forEach((m, index) => {
        // Tylko bazowe maszyny (bez replaces/reqLoc) są kandydatami na start
        const isBase = !m.replaces && !m.reqLoc;
        machines[m.id] = {
            level: 1,
            assignedEnergy: 0,
            currentProgress: 0,
            unlocked: index === 0 && isBase 
        };
    });
    return machines;
}

export function getFreshResearchState() {
    const research = {};
    RESEARCH_CONFIG.forEach((r, index) => {
        research[r.id] = {
            level: 1,
            assignedEnergy: 0,
            currentProgress: 0,
            unlocked: index === 0
        };
    });
    return research;
}

defaultState.machines = getFreshMachinesState();
defaultState.research = getFreshResearchState();

export let gameState = JSON.parse(JSON.stringify(defaultState));

export function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    console.log("Gra zapisana.");
}

export function loadGame() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            const loadedState = JSON.parse(saved);
            
            // Bezpieczne scalanie
            gameState = { 
                ...defaultState, 
                ...loadedState,
                resources: { ...defaultState.resources, ...(loadedState.resources || {}) },
                meta: { ...defaultState.meta, ...(loadedState.meta || {}) },
                employees: { ...defaultState.employees, ...(loadedState.employees || {}) },
                // Reset maszyn jeśli puste
                machines: loadedState.machines || getFreshMachinesState(),
                research: loadedState.research || getFreshResearchState()
            };
        }
    } catch (e) {
        console.error("Save corrupted, resetting.", e);
        localStorage.removeItem(SAVE_KEY);
        gameState = JSON.parse(JSON.stringify(defaultState));
    }
}

export function resetSave() {
    if(confirm("HARD RESET: Czy na pewno usunąć cały postęp?")) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }
}

export function applyPrestigeReset(level) {
    gameState.resources.money = 0;
    gameState.resources.knowledge = 0;
    gameState.resources.hrPoints = 0;
    gameState.resources.energyUsed = 0;
    gameState.resources.energyMax = 10;
    gameState.stats.runEarnings = 0;
    
    gameState.machines = getFreshMachinesState();
    gameState.research = getFreshResearchState();
    gameState.upgrades = {};
    gameState.employees = { pm: 0, opt: 0, log: 0 };
    gameState.assignments = {};
    gameState.headhunters = [];
    gameState.machineSpecialists = {};

    if (level === 'country') gameState.meta.countryIndex++;
    else if (level === 'continent') {
        gameState.meta.continentIndex++;
        gameState.meta.countryIndex = 0;
    }
    else if (level === 'planet') {
        gameState.meta.planetIndex++;
        gameState.meta.continentIndex = 0;
        gameState.meta.countryIndex = 0;
        gameState.resources.reputation = 0; 
    }
    
    saveGame();
    location.reload();
}