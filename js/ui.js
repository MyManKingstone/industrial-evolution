import { gameState } from './state.js';
import { MACHINES_CONFIG, RESEARCH_CONFIG, UPGRADES_CONFIG } from './data.js';
import { 
    modifyEnergy, buyMaxEnergy, getNextEnergyCost, unlockItem, buyUpgrade, getUpgradeCost, 
    getTotalMaxEnergy, calculatePrestigeGain, doRestructuring, doExpansion, getCurrentLocation, 
    checkNextExpansion, isMachineReplaced, isMachineAvailableInLoc, buyHrPoint, assignStaff, 
    doHeadhunt, equipSpecialist, getAssignedStaff, getRealMachineProduction, getRealResearchProduction, 
    canUnlock, getUpgradeMultiplier, getGlobalProductionRates, getGlobalMultipliers, getHrPointCost, 
    calculateOptimizationGain, doOptimization, getCalculatedSpeedMultipliers 
} from './game.js';

// --- DOM ELEMENTS ---
const els = {
    money: document.getElementById('res-money'),
    know: document.getElementById('res-knowledge'),
    hr: document.getElementById('res-hr'),
    energy: document.getElementById('res-energy'),
    maxEnergy: document.getElementById('res-max-energy'),
    rep: document.getElementById('res-rep'),
    opt: document.getElementById('res-opt'),
    machinesList: document.getElementById('machines-list'),
    researchList: document.getElementById('research-list'),
    upgradesList: document.getElementById('upgrades-list'),
    countryDisplay: document.getElementById('country-display'),
    locationMods: document.getElementById('location-mods'),
    prestigeGain: document.getElementById('prestige-gain'),
    optGain: document.getElementById('opt-gain'),
    btnExpansion: document.getElementById('btn-expansion'),
    // HR Elements
    hrCostMoney: document.getElementById('hr-cost-money'),
    hrCostKnow: document.getElementById('hr-cost-know'),
    headhuntResult: document.getElementById('headhunter-result'),
    hrRoster: document.getElementById('hr-roster'),
    countPm: document.getElementById('count-pm'),
    countOpt: document.getElementById('count-opt'),
    countLog: document.getElementById('count-log'),
    // Modals & Stats
    tutorialModal: document.getElementById('tutorial-modal'),
    closeTutorialBtn: document.getElementById('close-tutorial'),
    moneyRate: document.getElementById('money-rate'),
    knowRate: document.getElementById('know-rate'),
    repBonusMoneyCurr: document.getElementById('rep-bonus-money-curr'),
    repBonusKnowCurr: document.getElementById('rep-bonus-know-curr'),
    repBonusMoneyNext: document.getElementById('rep-bonus-money-next'),
    repBonusKnowNext: document.getElementById('rep-bonus-know-next'),
    optBonusFacCurr: document.getElementById('opt-bonus-fac-curr'),
    optBonusLabCurr: document.getElementById('opt-bonus-lab-curr'),
    optBonusFacNext: document.getElementById('opt-bonus-fac-next'),
    optBonusLabNext: document.getElementById('opt-bonus-lab-next'),
    statMoneyMult: document.getElementById('stat-money-mult'),
    statKnowMult: document.getElementById('stat-know-mult'),
    statSpeedMult: document.getElementById('stat-speed-mult')
};

// --- UNIVERSAL HOLD TO BUY LOGIC ---
let holdTimer = null;
let repeatTimeout = null;
let currentHoldSpeed = 200;

function stopHolding() {
    if (holdTimer) clearTimeout(holdTimer);
    if (repeatTimeout) clearTimeout(repeatTimeout);
    holdTimer = null;
    repeatTimeout = null;
    currentHoldSpeed = 200;
}

function startHolding(actionFn) {
    actionFn(); 
    holdTimer = setTimeout(() => {
        const loop = () => {
            actionFn(); 
            currentHoldSpeed = Math.max(30, currentHoldSpeed * 0.85); 
            repeatTimeout = setTimeout(loop, currentHoldSpeed);
        };
        loop();
    }, 300);
}

// --- INITIALIZATION ---
export function initUI() {
    if (!localStorage.getItem('tutorial_seen')) {
        if(els.tutorialModal) els.tutorialModal.style.display = 'flex';
    } else {
        if(els.tutorialModal) els.tutorialModal.style.display = 'none';
    }
    if(els.closeTutorialBtn) {
        els.closeTutorialBtn.addEventListener('click', () => {
            els.tutorialModal.style.display = 'none';
            localStorage.setItem('tutorial_seen', 'true');
        });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            e.target.classList.add('active');
            const tabId = e.target.dataset.tab;
            document.getElementById(`tab-${tabId}`).style.display = 'block';
        });
    });

    // Inicjalizacja stanów maszyn i badań
    MACHINES_CONFIG.forEach(config => {
        if (!gameState.machines[config.id]) {
            gameState.machines[config.id] = {
                level: 1,
                unlocked: config.unlockCost === 0,
                assignedEnergy: 0,
                currentProgress: 0
            };
        }
    });
    
    RESEARCH_CONFIG.forEach(config => {
        if (!gameState.research[config.id]) {
            gameState.research[config.id] = {
                level: 1,
                unlocked: config.unlockCost === 0,
                assignedEnergy: 0,
                currentProgress: 0
            };
        }
    });

    renderListStructure(els.machinesList, MACHINES_CONFIG, 'machine');
    renderListStructure(els.researchList, RESEARCH_CONFIG, 'research');
    renderUpgradesList();

    // --- GENERIC MOUSE HANDLERS (HOLD TO BUY) ---
    const handleStart = (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        // 1. Energia +/-
        if (btn.classList.contains('btn-plus')) { e.preventDefault(); startHolding(() => modifyEnergy(btn.dataset.id, 1)); }
        else if (btn.classList.contains('btn-minus')) { e.preventDefault(); startHolding(() => modifyEnergy(btn.dataset.id, -1)); }
        
        // 2. Punkty HR (Kupowanie)
        else if (btn.id === 'btn-buy-hr') { e.preventDefault(); startHolding(() => { buyHrPoint(); updateUI(); }); }
        
        // 3. Max Energia
        else if (btn.id === 'btn-buy-energy') { e.preventDefault(); startHolding(() => { buyMaxEnergy(); updateUI(); }); }
        
        // 4. Kupowanie Ulepszeń
        else if (btn.classList.contains('btn-buy-upgrade')) { e.preventDefault(); startHolding(() => { buyUpgrade(btn.dataset.id); updateUI(); }); }
        
        // 5. Przypisywanie HR (+)
        else if (btn.classList.contains('btn-assign-hr')) { e.preventDefault(); startHolding(() => { assignStaff(btn.dataset.id, btn.dataset.type, 1); updateUI(); }); }
        
        // 6. Odejmowanie HR (-)
        else if (btn.classList.contains('btn-unassign-hr')) { e.preventDefault(); startHolding(() => { assignStaff(btn.dataset.id, btn.dataset.type, -1); updateUI(); }); }
    };
    
    const handleEnd = () => stopHolding();

    document.addEventListener('mousedown', handleStart);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('mouseleave', handleEnd);
    document.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchend', handleEnd);

    // --- CLICK HANDLERS (Pojedyncze akcje) ---
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        
        // Ignoruj te obsłużone przez hold-to-buy
        if (btn.classList.contains('btn-plus') || 
            btn.classList.contains('btn-minus') || 
            btn.id === 'btn-buy-hr' || 
            btn.id === 'btn-buy-energy' ||
            btn.classList.contains('btn-buy-upgrade') ||
            btn.classList.contains('btn-assign-hr') ||
            btn.classList.contains('btn-unassign-hr')) return;

        if (btn.classList.contains('btn-unlock-machine')) { unlockItem(id, 'machine'); forceRebuildControls(id, 'machine'); updateUI(); }
        else if (btn.classList.contains('btn-unlock-research')) { unlockItem(id, 'research'); forceRebuildControls(id, 'research'); updateUI(); } 
        else if (btn.id === 'btn-headhunt') { 
            const res = doHeadhunt(); 
            if(els.headhuntResult) els.headhuntResult.textContent = res; 
            updateUI(); 
            renderHeadhunterList();
        }
    });

    if(document.getElementById('btn-prestige')) document.getElementById('btn-prestige').addEventListener('click', doRestructuring);
    if(document.getElementById('btn-optimization')) document.getElementById('btn-optimization').addEventListener('click', doOptimization);
    if(els.btnExpansion) els.btnExpansion.addEventListener('click', doExpansion);

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('specialist-select')) {
            equipSpecialist(e.target.dataset.id, e.target.value);
            updateUI();
        }
    });
    
    updateUI();
    renderHeadhunterList();
}

// --- RENDER FUNCTIONS ---

function renderListStructure(container, configArray, type) {
    if (!container) return;
    container.innerHTML = '';
    
    configArray.forEach(config => {
        const div = document.createElement('div');
        div.className = type === 'research' ? 'machine-card research-card' : 'machine-card';
        div.id = `${type}-card-${config.id}`;
        
        const state = type === 'machine' ? gameState.machines[config.id] : gameState.research[config.id];
        
        let initialControlsHTML = '';
        if (!state.unlocked) {
            initialControlsHTML = `<button class="btn-unlock-${type}" data-id="${config.id}" style="background:#e65100;width:100%;padding:5px;cursor:pointer;">ODBLOKUJ $${formatNumber(config.unlockCost)}</button>`;
        } else {
            initialControlsHTML = `
                <div style="text-align:center; color:#aaa;">Moc: <span id="energy-val-${type}-${config.id}" style="color:white; font-weight:bold;">${state.assignedEnergy}</span></div>
                <div class="energy-btn-group" style="display:flex; gap:5px; justify-content:center; margin-top:5px;">
                    <button class="btn-minus" data-id="${config.id}" style="padding:5px 15px; user-select: none;">-</button>
                    <button class="btn-plus" data-id="${config.id}" style="padding:5px 15px; user-select: none;">+</button>
                </div>
            `;
        }

        const resourceIcon = type === 'research' ? 'Nauka: ' : '$';
        let hrSection = '';
        if (type === 'machine') {
            hrSection = `
            <div class="controls-section" style="margin-top: 10px; border-top: 1px dashed #444; padding-top: 5px;">
                <div class="control-row">
                    <span class="text-pm">PM (+10% $)</span>
                    <span>
                        <span id="val-pm-${config.id}">0</span>/5 
                        <button class="btn-unassign-hr small-btn" data-id="${config.id}" data-type="pm">-</button>
                        <button class="btn-assign-hr small-btn" data-id="${config.id}" data-type="pm">+</button>
                    </span>
                </div>
                <div class="control-row">
                    <span class="text-opt">Opt (Free En)</span>
                    <span>
                        <span id="val-opt-${config.id}">0</span>/5 
                        <button class="btn-unassign-hr small-btn" data-id="${config.id}" data-type="opt">-</button>
                        <button class="btn-assign-hr small-btn" data-id="${config.id}" data-type="opt">+</button>
                    </span>
                </div>
                <div class="control-row">
                    <span class="text-log">Log (+10% Spd)</span>
                    <span>
                        <span id="val-log-${config.id}">0</span>/5 
                        <button class="btn-unassign-hr small-btn" data-id="${config.id}" data-type="log">-</button>
                        <button class="btn-assign-hr small-btn" data-id="${config.id}" data-type="log">+</button>
                    </span>
                </div>
                <select class="specialist-select" data-id="${config.id}" id="sel-spec-${config.id}" style="width:100%; margin-top:5px; padding:5px; background:#333; color:white; border:1px solid #555;">
                    <option value="">-- Wybierz Specjalistę --</option>
                </select>
            </div>`;
        }

        div.innerHTML = `
            <div class="machine-header">
                <h3>${config.name}</h3>
                <div class="machine-stats" style="text-align:right;">
                    ${resourceIcon}<span id="prod-val-${type}-${config.id}">${config.baseProd}</span><span id="unit-${type}-${config.id}"> / cykl</span><br>
                    <span id="time-${type}-${config.id}">${config.baseTime}s</span>
                </div>
            </div>
            <div class="progress-container" id="prog-cont-${type}-${config.id}"><div class="progress-bar" id="bar-${type}-${config.id}"></div></div>
            <div class="machine-body" id="body-${type}-${config.id}">
                <div class="energy-controls" id="controls-${type}-${config.id}">${initialControlsHTML}</div>
                ${hrSection}
            </div>
        `;
        container.appendChild(div);
    });
}

function renderUpgradesList() {
    if (!els.upgradesList) return;
    els.upgradesList.innerHTML = '';
    UPGRADES_CONFIG.forEach(up => {
        const div = document.createElement('div');
        div.className = 'upgrade-card';
        div.id = `upg-${up.id}`;
        div.innerHTML = `
            <div>
                <h4>${up.name} <span id="lvl-${up.id}" style="font-size:0.8em;">(0)</span></h4>
                <div class="upgrade-desc">${up.desc}</div>
            </div>
            <button class="btn-buy-upgrade" data-id="${up.id}">Kup (<span id="cost-${up.id}">${up.baseCost}</span>)</button>
        `;
        els.upgradesList.appendChild(div);
    });
}

function renderHeadhunterList() {
    if (!els.hrRoster) return;
    els.hrRoster.innerHTML = '';
    
    if (gameState.headhunters.length === 0) {
        els.hrRoster.innerHTML = '<span style="color:#aaa; font-style:italic;">Brak specjalistów.</span>';
        return;
    }

    gameState.headhunters.forEach(h => {
        const targetMachine = MACHINES_CONFIG.find(m => m.id === h.targetId)?.name || "Nieznana";
        const div = document.createElement('div');
        div.style.background = '#333';
        div.style.padding = '5px';
        div.style.borderLeft = '3px solid #ff5252';
        div.style.fontSize = '0.9em';
        div.innerHTML = `<strong>${h.name}</strong> <br> Spec: ${targetMachine} <br> <span style="color: #4caf50;">+${(h.bonus * 100).toFixed(0)}% Prod</span>`;
        els.hrRoster.appendChild(div);
    });
}

// --- DYNAMIC CONTROL BUILDER ---

function forceRebuildControls(id, type) {
    const config = type === 'machine' ? MACHINES_CONFIG.find(m => m.id === id) : RESEARCH_CONFIG.find(r => r.id === id);
    const state = type === 'machine' ? gameState.machines[id] : gameState.research[id];
    const container = document.getElementById(`controls-${type}-${id}`);
    
    if (!container) return;
    
    if (!state.unlocked) {
        let btnText = `ODBLOKUJ $${formatNumber(config.unlockCost)}`;
        let disabledAttr = "";
        let btnColor = "#e65100";
        
        if (!canUnlock(id, type) && config.reqRes) {
            const reqName = RESEARCH_CONFIG.find(r => r.id === config.reqRes).name;
            btnText = `WYMAGA: ${reqName}`;
            btnColor = "#333";
            disabledAttr = "disabled";
        }
        container.innerHTML = `<button class="btn-unlock-${type}" data-id="${id}" style="background:${btnColor};width:100%;padding:5px;cursor:pointer;" ${disabledAttr}>${btnText}</button>`;
    } else {
        container.innerHTML = `
            <div style="text-align:center; color:#aaa;">Moc: <span id="energy-val-${type}-${id}" style="color:white; font-weight:bold;">${state.assignedEnergy}</span></div>
            <div class="energy-btn-group" style="display:flex; gap:5px; justify-content:center; margin-top:5px;">
                <button class="btn-minus" data-id="${id}" style="padding:5px 15px; user-select: none;">-</button>
                <button class="btn-plus" data-id="${id}" style="padding:5px 15px; user-select: none;">+</button>
            </div>
        `;
    }
}

function checkAndRenderControls(id, type, state, config) {
    const container = document.getElementById(`controls-${type}-${id}`);
    if (!container) return;

    const isEmpty = container.innerHTML.trim() === '';
    const hasUnlockBtn = container.querySelector(`.btn-unlock-${type}`);
    const hasEnergyBtns = container.querySelector('.btn-plus');

    let needsRebuild = false;
    
    if (isEmpty) needsRebuild = true;
    else if (state.unlocked && hasUnlockBtn) needsRebuild = true;
    else if (!state.unlocked && hasEnergyBtns) needsRebuild = true;
    else if (!state.unlocked && hasUnlockBtn) {
        const btn = hasUnlockBtn;
        const isReqMet = canUnlock(id, type);
        if (btn.disabled && isReqMet) needsRebuild = true;
    }

    if (needsRebuild) {
        forceRebuildControls(id, type);
    }
}

// --- HELPERS ---
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
    return Math.floor(num);
}

export function showSaveToast() {
    const toast = document.getElementById('save-toast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
}

// --- MAIN UPDATE LOOP ---
export function updateUI() {
    // 1. ZASOBY
    if(els.money) els.money.textContent = `$${formatNumber(gameState.resources.money)}`;
    if(els.know) els.know.textContent = Math.floor(gameState.resources.knowledge);
    if(els.hr) els.hr.textContent = Math.floor(gameState.resources.hrPoints);
    if(els.energy) els.energy.textContent = gameState.resources.energyUsed;
    if(els.maxEnergy) { 
        try { els.maxEnergy.textContent = getTotalMaxEnergy(); } 
        catch(e) { els.maxEnergy.textContent = "10"; } 
    }
    
    if(document.getElementById('cost-next-energy')) {
        document.getElementById('cost-next-energy').textContent = `$${formatNumber(getNextEnergyCost())}`;
    }
    
    const hrCost = getHrPointCost();
    if(els.hrCostMoney) els.hrCostMoney.textContent = `$${formatNumber(hrCost.money)}`;
    if(els.hrCostKnow) els.hrCostKnow.textContent = formatNumber(hrCost.knowledge);

    // 2. RATES
    const rates = getGlobalProductionRates();
    if(els.moneyRate) els.moneyRate.textContent = `(+$${formatNumber(rates.money)}/s)`;
    if(els.knowRate) els.knowRate.textContent = `(+${formatNumber(rates.knowledge)}/s)`;

    // 3. STATS PANEL
    const mults = getGlobalMultipliers();
    if(els.statMoneyMult) els.statMoneyMult.textContent = `x${formatNumber(mults.money)}`;
    if(els.statKnowMult) els.statKnowMult.textContent = `x${formatNumber(mults.knowledge)}`;
    if(els.statSpeedMult) els.statSpeedMult.textContent = `x${mults.speed.toFixed(2)}`;

    // 4. PRESTIGE
    if(els.rep) els.rep.textContent = Math.floor(gameState.resources.reputation);
    if(els.opt) els.opt.textContent = Math.floor(gameState.resources.optimization || 0);

    const currRep = gameState.resources.reputation;
    const gainRep = calculatePrestigeGain();
    const nextRep = currRep + gainRep;

    if(els.repBonusMoneyCurr) els.repBonusMoneyCurr.textContent = `+${(currRep * 10).toFixed(0)}%`;
    if(els.repBonusKnowCurr) els.repBonusKnowCurr.textContent = `+${(currRep * 5).toFixed(0)}%`;
    if(els.repBonusMoneyNext) els.repBonusMoneyNext.textContent = `+${(nextRep * 10).toFixed(0)}%`;
    if(els.repBonusKnowNext) els.repBonusKnowNext.textContent = `+${(nextRep * 5).toFixed(0)}%`;

    if(els.prestigeGain) els.prestigeGain.textContent = gainRep;
    const btnRep = document.getElementById('btn-prestige');
    if(btnRep) { 
        btnRep.disabled = gainRep <= 0; 
        btnRep.style.opacity = gainRep > 0 ? "1" : "0.5"; 
    }

    // Optimization
    const currOpt = gameState.resources.optimization || 0;
    const gainOpt = calculateOptimizationGain();
    const nextOpt = currOpt + gainOpt;
    
    if(els.optBonusFacCurr) els.optBonusFacCurr.textContent = `+${(currOpt * 10).toFixed(0)}%`;
    if(els.optBonusLabCurr) els.optBonusLabCurr.textContent = `+${(currOpt * 20).toFixed(0)}%`;
    if(els.optBonusFacNext) els.optBonusFacNext.textContent = `+${(nextOpt * 10).toFixed(0)}%`;
    if(els.optBonusLabNext) els.optBonusLabNext.textContent = `+${(nextOpt * 20).toFixed(0)}%`;
    
    if(els.optGain) els.optGain.textContent = gainOpt;
    const btnOpt = document.getElementById('btn-optimization');
    if(btnOpt) { 
        btnOpt.disabled = gainOpt <= 0; 
        btnOpt.style.opacity = gainOpt > 0 ? "1" : "0.5"; 
    }

    // 5. LOCATION
    const loc = getCurrentLocation();
    if(els.countryDisplay && loc.country) {
        els.countryDisplay.textContent = `[${loc.planet.name}] ${loc.country.name}`;
    }

    if (els.locationMods && loc.country) {
        const cMods = loc.continent.mods || {};
        let info = [];
        info.push(`Zysk: x${loc.country.mult}`);
        if (cMods.prod && cMods.prod !== 1.0) info.push(`Region Prod: x${cMods.prod}`);
        if (cMods.know && cMods.know !== 1.0) info.push(`Wiedza: x${cMods.know}`);
        if (cMods.energyMax && cMods.energyMax !== 0) info.push(`Max Moc: ${cMods.energyMax > 0 ? '+' : ''}${cMods.energyMax}`);
        if (cMods.speedMult && cMods.speedMult !== 1.0) info.push(`Prędkość: x${cMods.speedMult}`);
        els.locationMods.textContent = info.join(' | ');
    }

    // 6. RENDER LISTS
    updateListUI(MACHINES_CONFIG, 'machine');
    updateListUI(RESEARCH_CONFIG, 'research');

    // 7. UPGRADES
    UPGRADES_CONFIG.forEach(up => {
        const currentLvl = gameState.upgrades[up.id] || 0;
        const currentCost = getUpgradeCost(up.id);
        const lvlEl = document.getElementById(`lvl-${up.id}`);
        const costEl = document.getElementById(`cost-${up.id}`);
        const btn = document.querySelector(`#upg-${up.id} button`);

        if(lvlEl) lvlEl.textContent = `(${currentLvl}/${up.maxLevel})`;
        if(costEl) costEl.textContent = currentLvl >= up.maxLevel ? "-" : formatNumber(currentCost);
        if(btn) btn.disabled = gameState.resources.knowledge < currentCost || currentLvl >= up.maxLevel;
    });

    // 8. EXPANSION & HR
    if(els.countPm) els.countPm.textContent = gameState.employees.pm;
    if(els.countOpt) els.countOpt.textContent = gameState.employees.opt;
    if(els.countLog) els.countLog.textContent = gameState.employees.log;

    const nextExp = checkNextExpansion();
    if (nextExp && els.btnExpansion) {
        document.getElementById('next-country-name').textContent = nextExp.target.name;
        document.getElementById('next-country-cost').textContent = `$${formatNumber(nextExp.target.reqCash)}`;
        els.btnExpansion.disabled = gameState.resources.money < nextExp.target.reqCash;
    }
}

function updateListUI(configArray, type) {
    const { speedMult, labSpeedMult } = getCalculatedSpeedMultipliers();

    configArray.forEach(config => {
        const state = type === 'machine' ? gameState.machines[config.id] : gameState.research[config.id];
        const card = document.getElementById(`${type}-card-${config.id}`);

        let visible = true;
        if (type === 'machine' && isMachineReplaced(config.id)) visible = false;
        if (type === 'machine' && !isMachineAvailableInLoc(config)) visible = false;

        if (card) card.style.display = visible ? 'block' : 'none';
        if (!visible) return;

        checkAndRenderControls(config.id, type, state, config);

        if (state.unlocked) {
            // Dropdown Logic
            if (type === 'machine') {
                const select = document.getElementById(`sel-spec-${config.id}`);
                if (select) {
                    const candidates = gameState.headhunters.filter(h => h.targetId === config.id);
                    if (select.options.length !== candidates.length + 1) {
                        while (select.options.length > 1) { select.remove(1); }
                        candidates.forEach(cand => {
                            const opt = document.createElement('option');
                            opt.value = cand.id;
                            opt.textContent = `${cand.name} (+${(cand.bonus*100).toFixed(0)}% Prod)`;
                            select.appendChild(opt);
                        });
                        if (gameState.machineSpecialists[config.id]) {
                            select.value = gameState.machineSpecialists[config.id];
                        }
                    }
                }
            }

            // NAPRAWA: Chowanie przycisku [+]
            const btnPlus = card.querySelector('.btn-plus');
            if (btnPlus) {
                // Jeśli energia >= 10, ukryj przycisk
                btnPlus.style.display = state.assignedEnergy >= 10 ? 'none' : 'inline-block';
            }

            const cappedEnergy = Math.min(state.assignedEnergy, 10);
            let effectiveEnergy = cappedEnergy;
            let hrSpeedMult = 1.0;

            if (type === 'machine') {
                const staff = getAssignedStaff(config.id);
                effectiveEnergy += (staff.opt * 2);
                hrSpeedMult = 1 + (staff.log * 0.10);
            }

            const percent = Math.min(100, (state.currentProgress / config.baseTime) * 100);
            const bar = document.getElementById(`bar-${type}-${config.id}`);
            
            // NAPRAWA: Poprawne mnożniki czasu (Maszyny vs Labo)
            let realCycleTime = 999;
            const currentGlobalSpeed = (type === 'research') ? labSpeedMult : speedMult;

            if (effectiveEnergy > 0) {
                realCycleTime = config.baseTime / (effectiveEnergy * currentGlobalSpeed * hrSpeedMult);
            }

            if (bar) {
                if (effectiveEnergy > 0 && realCycleTime < 0.1) {
                    bar.style.width = '100%'; 
                    bar.style.transition = 'none'; 
                } else {
                    bar.style.width = `${percent}%`; 
                    bar.style.transition = 'width 0.1s linear';
                }
            }

            const enVal = document.getElementById(`energy-val-${type}-${config.id}`);
            if(enVal) {
                enVal.textContent = state.assignedEnergy;
                enVal.style.color = state.assignedEnergy >= 10 ? '#ff5252' : 'white';
            }
            
            const timeEl = document.getElementById(`time-${type}-${config.id}`);
            if(timeEl) {
                if (effectiveEnergy > 0) {
                    if (realCycleTime < 1.0) {
                        const cyclesPerSec = (1 / realCycleTime).toFixed(1);
                        timeEl.textContent = `${cyclesPerSec} cykli/s`;
                        timeEl.style.color = '#4caf50'; 
                    } else {
                        timeEl.textContent = `${realCycleTime.toFixed(2)}s`;
                        timeEl.style.color = '#fff';
                    }
                } else {
                    timeEl.textContent = `${config.baseTime}s`;
                    timeEl.style.color = '#aaa';
                }
            }

            // NAPRAWA: Wyświetlanie $/s lub Nauka/s
            const prodValEl = document.getElementById(`prod-val-${type}-${config.id}`);
            const unitEl = document.getElementById(`unit-${type}-${config.id}`);
            
            if (prodValEl) {
                if (effectiveEnergy > 0) {
                    let perSec = 0;
                    if (type === 'machine') {
                        const realProd = getRealMachineProduction(config.id);
                        perSec = realProd / realCycleTime;
                    } else {
                        const realGain = getRealResearchProduction(config.id);
                        perSec = realGain / realCycleTime;
                    }
                    prodValEl.textContent = formatNumber(perSec);
                    // Zmiana tekstu jednostki
                    if (unitEl) unitEl.textContent = " / s";
                } else {
                    // Jeśli maszyna stoi, pokaż bazową produkcję (dla informacji)
                    prodValEl.textContent = formatNumber(config.baseProd);
                    if (unitEl) unitEl.textContent = " / cykl";
                }
            }

            if (type === 'machine') {
                const staff = getAssignedStaff(config.id);
                // NAPRAWA: Dodanie blokady wizualnej przycisków HR jeśli max
                const btnAssignPm = card.querySelector(`button[data-type="pm"].btn-assign-hr`);
                const btnAssignOpt = card.querySelector(`button[data-type="opt"].btn-assign-hr`);
                const btnAssignLog = card.querySelector(`button[data-type="log"].btn-assign-hr`);
                
                if (btnAssignPm) btnAssignPm.disabled = staff.pm >= 5;
                if (btnAssignOpt) btnAssignOpt.disabled = staff.opt >= 5;
                if (btnAssignLog) btnAssignLog.disabled = staff.log >= 5;

                document.getElementById(`val-pm-${config.id}`).textContent = staff.pm;
                document.getElementById(`val-opt-${config.id}`).textContent = staff.opt;
                document.getElementById(`val-log-${config.id}`).textContent = staff.log;
            }
        } else {
            const unlockBtn = document.querySelector(`#controls-${type}-${config.id} button`);
            if (unlockBtn && !unlockBtn.disabled) {
                unlockBtn.style.opacity = gameState.resources.money < config.unlockCost ? "0.5" : "1";
            }
        }
    });
}