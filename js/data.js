export const MACHINES_CONFIG = [
    // --- AFRYKA (Tier 1-3) ---
    { 
        id: "manual_press", name: "Ręczna Prasa", 
        baseCost: 0, baseProd: 10, baseTime: 2.0, unlockCost: 0, 
        reqRes: null, reqContinent: "africa" 
    },
    { 
        id: "cobalt_cleaner", name: "Oczyszczarka Kobaltu", 
        baseCost: 500, baseProd: 35, baseTime: 1.8, unlockCost: 0, 
        reqRes: null, replaces: "manual_press", reqLoc: "egypt", reqContinent: "africa" 
    },
    { 
        id: "conveyor_belt", name: "Taśmociąg", 
        baseCost: 100, baseProd: 60, baseTime: 4.0, unlockCost: 150, 
        reqRes: null, reqContinent: "africa" 
    },
    { 
        id: "wire_isolator", name: "Izolator Drutu", 
        baseCost: 2000, baseProd: 180, baseTime: 3.5, unlockCost: 0, 
        reqRes: null, replaces: "conveyor_belt", reqLoc: "rsa", reqContinent: "africa" 
    },
    { 
        id: "steam_engine", name: "Silnik Parowy", 
        baseCost: 1000, baseProd: 400, baseTime: 8.0, unlockCost: 1200, 
        reqRes: "thermo", reqContinent: "africa" 
    },

    // --- EUROPA (Tier 4-5) ---
    // Te maszyny pojawią się dopiero po przeprowadzce do Europy!
    { 
        id: "coal_turbine", name: "Turbina Węglowa", 
        baseCost: 10000, baseProd: 1200, baseTime: 7.0, unlockCost: 0, 
        reqRes: "thermo", replaces: "steam_engine", reqLoc: "poland", reqContinent: "europe" 
    },
    { 
        id: "electric_loom", name: "Tkacka Elektryczna", 
        baseCost: 15000, baseProd: 2500, baseTime: 6.0, unlockCost: 10000, 
        reqRes: "electr", reqContinent: "europe" 
    },
    { 
        id: "precision_lathe", name: "Tokarka Precyzyjna", 
        baseCost: 50000, baseProd: 6000, baseTime: 5.5, unlockCost: 0, 
        reqRes: "electr", replaces: "electric_loom", reqLoc: "germany", reqContinent: "europe" 
    },
    { 
        id: "assembly_line", name: "Linia Montażowa", 
        baseCost: 150000, baseProd: 15000, baseTime: 12.0, unlockCost: 100000, 
        reqRes: "logistics", reqContinent: "europe" 
    },

    // --- MARS / KOSMOS (Late Game) ---
    { 
        id: "diesel_generator", name: "Generator Fuzyjny", 
        baseCost: 1000000, baseProd: 50000, baseTime: 15.0, unlockCost: 500000, 
        reqRes: "chemistry", reqContinent: "mars_base" // Zmieniłem ID kontynentu Marsa na unikalne
    },
    { 
        id: "martian_printer", name: "Drukarka 4D", 
        baseCost: 1e7, baseProd: 200000, baseTime: 8.0, unlockCost: 0, 
        reqRes: "robotics", replaces: "cnc_machine", reqLoc: "curiosity", reqContinent: "mars_base" 
    }
];

export const RESEARCH_CONFIG = [
    { id: "basic_physics", name: "Podstawy Fizyki", baseProd: 1, baseTime: 3.0, unlockCost: 0 },
    { id: "thermo", name: "Termodynamika", baseProd: 4, baseTime: 6.0, unlockCost: 500 },
    { id: "electr", name: "Elektryczność", baseProd: 10, baseTime: 10.0, unlockCost: 5000 }, // Droższe
    { id: "logistics", name: "Logistyka Stosowana", baseProd: 25, baseTime: 12.0, unlockCost: 25000 },
    { id: "chemistry", name: "Chemia Przemysłowa", baseProd: 60, baseTime: 15.0, unlockCost: 100000 },
    { id: "computing", name: "Informatyka", baseProd: 150, baseTime: 8.0, unlockCost: 500000 },
    { id: "robotics", name: "Robotyka", baseProd: 400, baseTime: 18.0, unlockCost: 2000000 },
    { id: "ai_systems", name: "Systemy AI", baseProd: 1000, baseTime: 25.0, unlockCost: 10000000 },
    { id: "nanotech", name: "Nanotechnologia", baseProd: 2500, baseTime: 30.0, unlockCost: 50000000 },
    { id: "quantum", name: "Fizyka Kwantowa", baseProd: 10000, baseTime: 60.0, unlockCost: 200000000 }
];

export const UPGRADES_CONFIG = [
    { id: "lubricants", name: "Lepsze Smary", desc: "+20% prędkości.", baseCost: 10, costMult: 2.5, maxLevel: 10, effect: { type: "speed_mult", value: 0.20 } },
    { id: "training", name: "Szkolenie Kadr", desc: "+1 Max Energii.", baseCost: 50, costMult: 3.0, maxLevel: 5, effect: { type: "energy_max", value: 1 } },
    { id: "marketing", name: "Marketing", desc: "+50% Zysku ($).", baseCost: 200, costMult: 2.0, maxLevel: 20, effect: { type: "production_mult", value: 0.5 } },
    { id: "research_grant", name: "Granty Naukowe", desc: "+25% Wiedzy.", baseCost: 100, costMult: 2.2, maxLevel: 10, effect: { type: "knowledge_mult", value: 0.25 } }
];

export const HR_CONFIG = [
    { id: "pm", name: "Project Manager", cost: 1, desc: "+10% Zarobków" },
    { id: "opt", name: "Optimization Spec.", cost: 3, desc: "Zastępuje 2 Energii" },
    { id: "log", name: "Logistics Spec.", cost: 2, desc: "+10% Prędkości, +1 Koszt Energii" }
];

export const LOCATIONS = [
    {
        id: "earth", name: "ZIEMIA",
        continents: [
            {
                id: "africa", name: "Afryka", desc: "Start.", mods: { prod: 1.0, know: 1.0, energyMax: 0 },
                countries: [
                    { id: "congo", name: "Kongo", mult: 1, reqCash: 0 },
                    { id: "egypt", name: "Egipt", mult: 2, reqCash: 50000 }, // 50k
                    { id: "rsa", name: "RPA", mult: 4, reqCash: 250000 }     // 250k
                ]
            },
            {
                id: "europe", name: "Europa", desc: "Bogata, ale biurokratyczna (-1 Energii).", mods: { prod: 1.5, know: 1.2, energyMax: -1 },
                countries: [
                    { id: "poland", name: "Polska", mult: 10, reqCash: 1000000 }, // 1M (Próg wyjścia z Afryki)
                    { id: "germany", name: "Niemcy", mult: 25, reqCash: 50000000 },
                    { id: "uk", name: "Wielka Brytania", mult: 50, reqCash: 500000000 }
                ]
            }
        ]
    },
    {
        id: "mars", name: "MARS",
        continents: [
            {
                id: "mars_base", name: "Olympus Mons", desc: "Niska grawitacja (x5 $).", mods: { prod: 5.0, know: 0.8, energyMax: 0 },
                countries: [
                    { id: "curiosity", name: "Curiosity Site", mult: 1000, reqCash: 1000000000 }, // 1B
                    { id: "musk_city", name: "Colony One", mult: 2500, reqCash: 100000000000 },
                    { id: "core_drill", name: "Wiertło Jądra", mult: 5000, reqCash: 1e15 }
                ]
            }
        ]
    }
];