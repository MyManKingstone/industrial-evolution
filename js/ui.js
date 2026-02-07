import { gameState } from './state.js';
import { MACHINES_CONFIG, RESEARCH_CONFIG, UPGRADES_CONFIG } from './data.js';
import { modifyEnergy, buyMaxEnergy, getNextEnergyCost, unlockItem, buyUpgrade, getUpgradeCost, getTotalMaxEnergy, calculatePrestigeGain, doRestructuring, doExpansion, getCurrentLocation, checkNextExpansion, isMachineReplaced, isMachineAvailableInLoc, buyHrPoint, assignStaff, doHeadhunt, equipSpecialist, getAssignedStaff, getRealMachineProduction, canUnlock } from './game.js';

// DOM Elements
const els = {
    money: document.getElementById('res-money'),
    know: document.getElementById('res-knowledge'),
    hr: document.getElementById('res-hr'),
    energy: document.getElementById('res-energy'),
    maxEnergy: document.getElementById('res-max-energy'),
    rep: document.getElementById('res-rep'),
    machinesList: document.getElementById('machines-list'),
    researchList: document.getElementById('research-list'),
    upgradesList: document.getElementById('upgrades-list'),
    countryDisplay: document.getElementById('country-display'),
    prestigeGain: document.getElementById('prestige-gain'),
    currentRepBonus: document.getElementById('current-rep-bonus'),
    btnExpansion: document.getElementById('btn-expansion'),
    headhuntResult: document.getElementById('headhunter-result'),
    // Tutorial
    tutorialModal: document.getElementById('tutorial-modal'),
    closeTutorialBtn: document.getElementById('close-tutorial')
};

// Hold-to-buy variables
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

function startHolding(id, amount) {
    modifyEnergy(id, amount);
    holdTimer = setTimeout(() => {
        const loop = () => {
            modifyEnergy(id, amount);
            currentHoldSpeed = Math.max(30, currentHoldSpeed * 0.85); 
            repeatTimeout = setTimeout(loop, currentHoldSpeed);
        };
        loop();
    }, 300);
}

export function initUI() {
    // Tutorial Check
    if (!localStorage.getItem('tutorial_seen')) {
        els.tutorialModal.style.display = 'flex';
    } else {
        els.tutorialModal.style.display = 'none';
    }
    
    els.closeTutorialBtn.addEventListener('click', () => {
        els.tutorialModal.style.display = 'none';
        localStorage.setItem('tutorial_seen', 'true');
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            e.target.classList.add('active');
            const tabId = e.target.dataset.tab;
            document.getElementById(`tab-${tabId}`).style.display = 'block';
        });
    });

    renderListStructure(els.machinesList, MACHINES_CONFIG, 'machine');
    renderListStructure(els.researchList, RESEARCH_CONFIG, 'research');
    renderUpgradesList();

    // Listeners (Mysz/Dotyk)
    const handleStart = (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.classList.contains('btn-plus')) { e.preventDefault(); startHolding(btn.dataset.id, 1); }
        else if (btn.classList.contains('btn-minus')) { e.preventDefault(); startHolding(btn.dataset.id, -1); }
    };
    const handleEnd = () => stopHolding();

    document.addEventListener('mousedown', handleStart);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('mouseleave', handleEnd);
    document.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchend', handleEnd);

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        
        if (btn.classList.contains('btn-plus') || btn.classList.contains('btn-minus')) return;

        if (btn.classList.contains('btn-unlock-machine')) { unlockItem(id, 'machine'); forceRebuildControls(id, 'machine'); updateUI(); }
        else if (btn.classList.contains('btn-unlock-research')) { unlockItem(id, 'research'); forceRebuildControls(id, 'research'); updateUI(); } 
        else if (btn.classList.contains('btn-buy-upgrade')) { buyUpgrade(id); updateUI(); }
        else if (btn.id === 'btn-buy-hr') { buyHrPoint(); updateUI(); }
        else if (btn.id === 'btn-headhunt') { const res = doHeadhunt(); if(els.headhuntResult) els.headhuntResult.textContent = res; updateUI(); }
        else if (btn.classList.contains('btn-assign-hr')) { assignStaff(id, btn.dataset.type, 1); updateUI(); }
    });

    if(document.getElementById('btn-buy-energy')) document.getElementById('btn-buy-energy').addEventListener('click', () => { buyMaxEnergy(); updateUI(); });
    if(document.getElementById('btn-prestige')) document.getElementById('btn-prestige').addEventListener('click', doRestructuring);
    if(els.btnExpansion) els.btnExpansion.addEventListener('click', doExpansion);

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('specialist-select')) {
            equipSpecialist(e.target.dataset.id, e.target.value);
            updateUI();
        }
    });
    
    updateUI();
}

function renderListStructure(container, configArray, type) {
    if (!container) return;
    container.innerHTML = '';
    
    configArray.forEach(config => {
        const div = document.createElement('div');
        div.className = type === 'research' ? 'machine-card research-card' : 'machine-card';
        div.id = `${type}-card-${config.id}`;
        
        const state = type === 'machine' ? gameState.machines[config.id] : gameState.research[config.id];
        
        // Generowanie HTML przycisków OD RAZU
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

        const resourceIcon = type === 'research' ? 'Wiedza: ' : '$';
        let hrSection = '';
        if (type === 'machine') {
            hrSection = `
            <div class="controls-section" style="margin-top: 10px; border-top: 1px dashed #444; padding-top: 5px;">
                <div class="control-row"><span class="text-pm">Proj. Manager (1 HR)</span><span><span id="val-pm-${config.id}">0</span> <button class="btn-assign-hr small-btn" data-id="${config.id}" data-type="pm">+</button></span></div>
                <div class="control-row"><span class="text-opt">Optymalizator (3 HR)</span><span><span id="val-opt-${config.id}">0</span> <button class="btn-assign-hr small-btn" data-id="${config.id}" data-type="opt">+</button></span></div>
                <div class="control-row"><span class="text-log">Logistyk (2 HR)</span><span><span id="val-log-${config.id}">0</span> <button class="btn-assign-hr small-btn" data-id="${config.id}" data-type="log">+</button></span></div>
                <select class="specialist-select" data-id="${config.id}" id="sel-spec-${config.id}" style="width:100%; margin-top:5px; padding:5px; background:#333; color:white; border:1px solid #555;"><option value="">-- Wybierz Specjalistę --</option></select>
            </div>`;
        }

        div.innerHTML = `
            <div class="machine-header">
                <h3>${config.name}</h3>
                <div class="machine-stats" style="text-align:right;">
                    ${resourceIcon}<span id="prod-val-${type}-${config.id}">${config.baseProd}</span> / cykl<br>
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
            <div><h4>${up.name} <span id="lvl-${up.id}" style="font-size:0.8em;">(0)</span></h4><div class="upgrade-desc">${up.desc}</div></div>
            <button class="btn-buy-upgrade" data-id="${up.id}">Kup (<span id="cost-${up.id}">${up.baseCost}</span>)</button>
        `;
        els.upgradesList.appendChild(div);
    });
}

function forceRebuildControls(id, type) {
    const config = type === 'machine' ? MACHINES_CONFIG.find(m => m.id === id) : RESEARCH_CONFIG.find(r => r.id === id);
    const state = type === 'machine' ? gameState.machines[id] : gameState.research[id];
    const container = document.getElementById(`controls-${type}-${id}`);
    if (!container) return;
    
    if (!state.unlocked) {
        // Sprawdź czy zablokowane przez badania
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
    
    // Check if Requirements changed (e.g. bought research, button needs update)
    if (!state.unlocked && hasUnlockBtn) {
        const btn = hasUnlockBtn;
        const isReqMet = canUnlock(id, type);
        // Jeśli przycisk jest wyłączony, ale wymagania są spełnione -> przebuduj
        if (btn.disabled && isReqMet) needsRebuild = true;
    }

    if (needsRebuild) forceRebuildControls(id, type);
}

function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
    return Math.floor(num);
}

export function updateUI() {
    if(els.money) els.money.textContent = `$${formatNumber(gameState.resources.money)}`;
    if(els.know) els.know.textContent = Math.floor(gameState.resources.knowledge);
    if(els.hr) els.hr.textContent = Math.floor(gameState.resources.hrPoints);
    if(els.energy) els.energy.textContent = gameState.resources.energyUsed;
    if(els.maxEnergy) { try { els.maxEnergy.textContent = getTotalMaxEnergy(); } catch(e) { els.maxEnergy.textContent = "10"; } }
    document.getElementById('cost-next-energy').textContent = `$${formatNumber(getNextEnergyCost())}`;
    
    if(els.rep) els.rep.textContent = Math.floor(gameState.resources.reputation);
    // Pokaż procentowy bonus repa
    if(els.currentRepBonus) els.currentRepBonus.textContent = `+${(gameState.resources.reputation * 10).toFixed(0)}%`;

    const loc = getCurrentLocation();
    if(els.countryDisplay && loc.country) els.countryDisplay.textContent = `[${loc.planet.name}] ${loc.country.name} (x${loc.country.mult})`;

    updateListUI(MACHINES_CONFIG, 'machine');
    updateListUI(RESEARCH_CONFIG, 'research');

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

    const nextExp = checkNextExpansion();
    if (nextExp && els.btnExpansion) {
        document.getElementById('next-country-name').textContent = nextExp.target.name;
        document.getElementById('next-country-cost').textContent = `$${formatNumber(nextExp.target.reqCash)}`;
        els.btnExpansion.disabled = gameState.resources.money < nextExp.target.reqCash;
    }
    
    const repGain = calculatePrestigeGain();
    if(els.prestigeGain) els.prestigeGain.textContent = repGain;
    const bonusBtn = document.getElementById('btn-prestige');
    if(bonusBtn) bonusBtn.disabled = repGain <= 0;
}

function updateListUI(configArray, type) {
    const { country } = getCurrentLocation();

    configArray.forEach(config => {
        const state = type === 'machine' ? gameState.machines[config.id] : gameState.research[config.id];
        const card = document.getElementById(`${type}-card-${config.id}`);

        let visible = true;
        if (type === 'machine' && isMachineReplaced && isMachineReplaced(config.id)) visible = false;
        if (type === 'machine' && !isMachineAvailableInLoc(config)) visible = false;

        if (card) card.style.display = visible ? 'block' : 'none';
        if (!visible) return;

        checkAndRenderControls(config.id, type, state, config);

        if (state.unlocked) {
            const percent = Math.min(100, (state.currentProgress / config.baseTime) * 100);
            const bar = document.getElementById(`bar-${type}-${config.id}`);
            if(bar) bar.style.width = `${percent}%`;

            const enVal = document.getElementById(`energy-val-${type}-${config.id}`);
            if(enVal) enVal.textContent = state.assignedEnergy;
            
            const timeEl = document.getElementById(`time-${type}-${config.id}`);
            if(state.assignedEnergy > 0 && timeEl) {
                const realTime = config.baseTime / state.assignedEnergy; // Tu uproszczenie
                timeEl.textContent = realTime < 0.1 ? `${(1/realTime).toFixed(1)}/s` : `${realTime.toFixed(2)}s`;
                timeEl.style.color = '#4caf50';
            } else if (timeEl) {
                timeEl.textContent = `${config.baseTime}s`;
                timeEl.style.color = '#aaa';
            }

            // --- AKTUALIZACJA LICZB PRODUKCJI (Dynamiczna) ---
            const prodValEl = document.getElementById(`prod-val-${type}-${config.id}`);
            if (prodValEl) {
                if (type === 'machine') {
                    // Pobierz rzeczywistą produkcję z game.js
                    const realProd = getRealMachineProduction(config.id);
                    prodValEl.textContent = formatNumber(realProd);
                    prodValEl.style.color = '#fff';
                    prodValEl.style.fontWeight = 'bold';
                } else {
                    // Dla badań (uproszczone)
                    prodValEl.textContent = config.baseProd; 
                }
            }
            // --------------------------------------------------

            if (type === 'machine') {
                const staff = getAssignedStaff(config.id);
                document.getElementById(`val-pm-${config.id}`).textContent = staff.pm;
                document.getElementById(`val-opt-${config.id}`).textContent = staff.opt;
                document.getElementById(`val-log-${config.id}`).textContent = staff.log;
            }
        } else {
            const unlockBtn = document.querySelector(`#controls-${type}-${config.id} button`);
            if (unlockBtn && !unlockBtn.disabled) unlockBtn.style.opacity = gameState.resources.money < config.unlockCost ? "0.5" : "1";
        }
    });
}