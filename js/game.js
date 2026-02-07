import { gameState, applyPrestigeReset } from './state.js';
import { MACHINES_CONFIG, RESEARCH_CONFIG, UPGRADES_CONFIG, LOCATIONS, HR_CONFIG } from './data.js';

// --- HELPERS: LOKALIZACJA ---

export function getCurrentLocation() {
    const pIndex = gameState.meta.planetIndex || 0;
    const cIndex = gameState.meta.continentIndex || 0;
    const kIndex = gameState.meta.countryIndex || 0;

    const planet = LOCATIONS[pIndex] || LOCATIONS[0];
    const continent = planet.continents[cIndex] || planet.continents[0];
    const country = continent.countries[kIndex] || continent.countries[0];
    return { planet, continent, country };
}

function getContinentModifiers() {
    const { continent } = getCurrentLocation();
    return {
        prod: continent.mods?.prod || 1.0,
        know: continent.mods?.know || 1.0,
        energyMax: continent.mods?.energyMax || 0,
        speedMult: continent.mods?.speedMult || 1.0
    };
}

// --- CORE: MATEMATYKA ---

// Funkcja zwracająca rzeczywisty przychód maszyny na jeden cykl (uwzględniając wszystko)
export function getRealMachineProduction(machineId) {
    const config = MACHINES_CONFIG.find(m => m.id === machineId);
    const state = gameState.machines[machineId];
    if (!config || !state) return 0;

    const { country } = getCurrentLocation();
    const contMods = getContinentModifiers();
    const repMult = 1 + (gameState.resources.reputation * 0.1); 
    const prodUpgrade = getUpgradeMultiplier('production_mult');
    
    // HR Bonus
    const hr = getHRBonuses(machineId);

    // Baza * Level * Kraj * Kontynent * Reputacja * Ulepszenia * HR
    let production = config.baseProd * state.level;
    production *= country.mult;
    production *= contMods.prod;
    production *= repMult;
    production *= prodUpgrade.multiplier;
    production *= hr.prodMult;

    return production;
}

// --- POZOSTAŁE HELPERSY ---

export function getUpgradeCost(upgradeId) {
    const config = UPGRADES_CONFIG.find(u => u.id === upgradeId);
    if (!config) return Infinity;
    const currentLevel = gameState.upgrades[upgradeId] || 0;
    if (currentLevel >= config.maxLevel) return Infinity; 
    return Math.floor(config.baseCost * Math.pow(config.costMult, currentLevel));
}

export function getUpgradeMultiplier(type) {
    let multiplier = 1.0;
    let adder = 0;
    Object.keys(gameState.upgrades).forEach(upId => {
        const level = gameState.upgrades[upId];
        const config = UPGRADES_CONFIG.find(u => u.id === upId);
        if (config && config.effect.type === type) {
            if (type.includes('mult')) multiplier += (config.effect.value * level); 
            else adder += (config.effect.value * level);
        }
    });
    return { multiplier, adder };
}

export function getAssignedStaff(machineId) {
    if (!gameState.assignments[machineId]) {
        gameState.assignments[machineId] = { pm: 0, opt: 0, log: 0 };
    }
    return gameState.assignments[machineId];
}

function getHRBonuses(machineId) {
    const staff = getAssignedStaff(machineId);
    let specBonusProd = 0;
    const specId = gameState.machineSpecialists[machineId];
    if (specId) {
        const spec = gameState.headhunters.find(h => h.id === specId);
        if (spec) specBonusProd = spec.bonus; 
    }
    return {
        prodMult: 1 + (staff.pm * 0.10) + specBonusProd,
        energyFree: staff.opt * 2,
        speedMult: 1 + (staff.log * 0.10),
        energyCostAdded: staff.log * 1
    };
}

export function doHeadhunt() {
    if (gameState.resources.hrPoints < 5) return "Brak HR Punktów!";
    gameState.resources.hrPoints -= 5;
    const names = ["Janusz", "Elon", "Grażyna", "Walter", "Skyler", "Gordon"];
    const roles = ["Mistrz", "Ekspert", "Specjalista"];
    
    const unlocked = MACHINES_CONFIG.filter(m => gameState.machines[m.id]?.unlocked);
    if (unlocked.length === 0) { gameState.resources.hrPoints += 5; return "Brak maszyn!"; }
    
    const target = unlocked[Math.floor(Math.random() * unlocked.length)];
    const newSpec = {
        id: Date.now(),
        name: `${names[Math.floor(Math.random()*names.length)]} (${roles[Math.floor(Math.random()*roles.length)]})`,
        bonus: 0.25, targetId: target.id
    };
    gameState.headhunters.push(newSpec);
    return `Zrekrutowano: ${newSpec.name} dla: ${target.name}!`;
}

// --- GAME LOOP ---

export function updateGame(deltaTime) {
    const speedUpgrade = getUpgradeMultiplier('speed_mult');
    const contMods = getContinentModifiers();
    const globalSpeedMult = speedUpgrade.multiplier * contMods.speedMult;

    // Badania (prostsze, nie wymagają przeliczania co klatkę $ bo są stałe)
    const knowUpgrade = getUpgradeMultiplier('knowledge_mult');
    const repKnowMult = 1 + (gameState.resources.reputation * 0.05);
    const globalKnowMult = contMods.know * knowUpgrade.multiplier * repKnowMult;

    // MASZYNY
    MACHINES_CONFIG.forEach(config => {
        const machineState = gameState.machines[config.id];
        
        if (!isMachineAvailableInLoc(config) || isMachineReplaced(config.id)) return;
        if (!machineState.unlocked) return;

        const hr = getHRBonuses(config.id);
        const workingEnergy = machineState.assignedEnergy + hr.energyFree;
        
        if (workingEnergy <= 0) return;

        const progressAdded = deltaTime * workingEnergy * globalSpeedMult * hr.speedMult;
        machineState.currentProgress += progressAdded;

        if (machineState.currentProgress >= config.baseTime) {
            // Używamy nowej funkcji, żeby logika zarabiania i wyświetlania była identyczna
            const revenue = getRealMachineProduction(config.id);
            
            gameState.resources.money += revenue;
            gameState.stats.runEarnings += revenue;
            gameState.stats.lifetimeEarnings += revenue;
            machineState.currentProgress -= config.baseTime; 
        }
    });

    // BADANIA
    RESEARCH_CONFIG.forEach(config => {
        const resState = gameState.research[config.id];
        if (!resState.unlocked || resState.assignedEnergy <= 0) return;
        
        const progressAdded = deltaTime * resState.assignedEnergy * globalSpeedMult;
        resState.currentProgress += progressAdded;
        
        if (resState.currentProgress >= config.baseTime) {
            let gain = config.baseProd * resState.level;
            gain *= globalKnowMult; 
            gameState.resources.knowledge += gain;
            resState.currentProgress -= config.baseTime;
        }
    });
}

// --- LOCK & UNLOCK ---

export function isMachineAvailableInLoc(machineConfig) {
    const { continent, country } = getCurrentLocation();
    
    // 1. Sprawdź Kontynent (HARD CHECK)
    if (machineConfig.reqContinent && machineConfig.reqContinent !== continent.id) return false;

    // 2. Sprawdź Kraj (SOFT CHECK - jeśli odblokowana, zostaje)
    const isUnlocked = gameState.machines[machineConfig.id]?.unlocked;
    if (machineConfig.reqLoc && country.id !== machineConfig.reqLoc && !isUnlocked) return false;

    return true;
}

export function isMachineReplaced(machineId) {
    const replacement = MACHINES_CONFIG.find(m => m.replaces === machineId);
    if (replacement) {
        // Jeśli nowa maszyna jest na tym samym kontynencie...
        if (isMachineAvailableInLoc(replacement)) {
            const replacementState = gameState.machines[replacement.id];
            // ...i jest odblokowana LUB jest dedykowana dla tego kraju
            if (replacementState && replacementState.unlocked) return true;
            
            const { country } = getCurrentLocation();
            if (replacement.reqLoc && country.id === replacement.reqLoc) return true;
        }
    }
    return false;
}

export function canUnlock(itemId, type) {
    if (type === 'research') return true; 
    const config = MACHINES_CONFIG.find(m => m.id === itemId);
    if (!config.reqRes) return true; 
    const reqResState = gameState.research[config.reqRes];
    return reqResState && reqResState.unlocked;
}

export function unlockItem(itemId, type = 'machine') {
    if (!canUnlock(itemId, type)) return false;
    let stateItem = (type === 'machine') ? gameState.machines[itemId] : gameState.research[itemId];
    let configItem = (type === 'machine') ? MACHINES_CONFIG.find(m => m.id === itemId) : RESEARCH_CONFIG.find(r => r.id === itemId);

    if (type === 'machine' && !isMachineAvailableInLoc(configItem)) return false;

    if (stateItem && !stateItem.unlocked) {
        if (gameState.resources.money >= configItem.unlockCost) {
            gameState.resources.money -= configItem.unlockCost;
            stateItem.unlocked = true;
            return true;
        }
    }
    return false;
}

// --- OTHER ACTIONS ---

export function modifyEnergy(targetId, amount) {
    let target = gameState.machines[targetId] || gameState.research[targetId];
    if (!target || !target.unlocked) return;
    
    const used = gameState.resources.energyUsed;
    const max = getTotalMaxEnergy(); 

    if (amount > 0 && used + amount <= max) {
        target.assignedEnergy += amount;
        gameState.resources.energyUsed += amount;
    } else if (amount < 0 && target.assignedEnergy + amount >= 0) {
        target.assignedEnergy += amount;
        gameState.resources.energyUsed += amount;
    }
}

export function getTotalMaxEnergy() {
    const contMods = getContinentModifiers();
    const upgradeBonus = getUpgradeMultiplier('energy_max').adder;
    return Math.max(1, gameState.resources.energyMax + upgradeBonus + contMods.energyMax);
}

export function getNextEnergyCost() {
    return Math.floor(50 * Math.pow(1.5, gameState.resources.energyMax - 10));
}

export function buyMaxEnergy() {
    const cost = getNextEnergyCost();
    if (gameState.resources.money >= cost) {
        gameState.resources.money -= cost;
        gameState.resources.energyMax += 1;
        return true;
    }
    return false;
}

export function buyUpgrade(upgradeId) {
    const cost = getUpgradeCost(upgradeId);
    if (cost === Infinity) return false;
    if (gameState.resources.knowledge >= cost) {
        gameState.resources.knowledge -= cost;
        if (!gameState.upgrades[upgradeId]) gameState.upgrades[upgradeId] = 0;
        gameState.upgrades[upgradeId]++;
        return true;
    }
    return false;
}

export function buyHrPoint() {
    if (gameState.resources.money >= 10000 && gameState.resources.knowledge >= 100) {
        gameState.resources.money -= 10000;
        gameState.resources.knowledge -= 100;
        gameState.resources.hrPoints++;
        return true;
    }
    return false;
}

export function assignStaff(machineId, type, amount) {
    const assignments = getAssignedStaff(machineId);
    const costConfig = HR_CONFIG.find(h => h.id === type);
    if (!costConfig) return;
    const cost = costConfig.cost;
    
    if (amount > 0 && gameState.resources.hrPoints >= cost) {
        gameState.resources.hrPoints -= cost;
        gameState.employees[type]++; 
        assignments[type]++;         
    } 
}

export function equipSpecialist(machineId, specId) {
    if (specId === "") gameState.machineSpecialists[machineId] = null;
    else gameState.machineSpecialists[machineId] = parseInt(specId);
}

export function calculatePrestigeGain() {
    const earnings = gameState.stats.runEarnings;
    if (earnings < 1000) return 0;
    return Math.floor(Math.cbrt(earnings / 1000));
}

export function doRestructuring() {
    const gain = calculatePrestigeGain();
    if (gain <= 0) return;
    if (confirm(`Restrukturyzacja: +${gain} Reputacji.`)) {
        gameState.resources.reputation += gain;
        applyPrestigeReset('restructuring'); 
    }
}

export function checkNextExpansion() {
    const { planet, continent, country } = getCurrentLocation();
    const pIndex = gameState.meta.planetIndex;
    const cIndex = gameState.meta.continentIndex;
    const kIndex = gameState.meta.countryIndex;
    
    if (kIndex < continent.countries.length - 1) {
        return { type: 'country', target: continent.countries[kIndex + 1] };
    }
    if (cIndex < planet.continents.length - 1) {
        return { type: 'continent', target: planet.continents[cIndex + 1] };
    }
    if (pIndex < LOCATIONS.length - 1) {
        return { type: 'planet', target: LOCATIONS[pIndex + 1] };
    }
    return null; 
}

export function doExpansion() {
    const next = checkNextExpansion();
    if (!next) return;
    if (gameState.resources.money < next.target.reqCash) return;
    
    let msg = `EKSPANSJA do: ${next.target.name}`;
    if (next.type === 'continent') msg = `NOWY KONTYNENT: ${next.target.name} (Reset Kraju)`;
    if (next.type === 'planet') msg = `KOLONIZACJA: ${next.target.name} (HARD RESET)`;

    if (confirm(msg)) applyPrestigeReset(next.type);
}