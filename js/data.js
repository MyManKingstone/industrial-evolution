export const MACHINES_CONFIG = [
    // --- TIER 1 (PODSTAWOWE) ---
    { 
        id: "manual_press", name: "Ręczna Prasa", 
        baseCost: 0, baseProd: 10, baseTime: 3.0, unlockCost: 0, // Czas 2.0 -> 3.0
        reqRes: null, reqContinent: null 
    },
    { 
        id: "cobalt_cleaner", name: "Oczyszczarka Kobaltu", 
        baseCost: 500, baseProd: 35, baseTime: 4.0, unlockCost: 0, // Czas 1.8 -> 4.0
        reqRes: null, replaces: "manual_press", reqLoc: "egypt", reqContinent: "africa" 
    },
    { 
        id: "coal_sorter", name: "Sortownia Węgla", 
        baseCost: 0, baseProd: 50, baseTime: 3.5, unlockCost: 0, // Czas 1.5 -> 3.5
        reqRes: null, replaces: "manual_press", reqLoc: "poland", reqContinent: "europe" 
    },

    // --- TIER 2 (LOGISTYKA) ---
    { 
        id: "conveyor_belt", name: "Taśmociąg", 
        baseCost: 100, baseProd: 60, baseTime: 8.0, unlockCost: 250, // Czas 4.0 -> 8.0, Koszt 150 -> 250
        reqRes: null, reqContinent: null 
    },
    { 
        id: "wire_isolator", name: "Izolator Drutu", 
        baseCost: 2000, baseProd: 180, baseTime: 7.0, unlockCost: 0, 
        reqRes: null, replaces: "conveyor_belt", reqLoc: "rsa", reqContinent: "africa" 
    },

    // --- TIER 3 (PARA / ENERGIA - DUŻY SKOK TRUDNOŚCI) ---
    { 
        id: "steam_engine", name: "Silnik Parowy", 
        baseCost: 1000, baseProd: 400, baseTime: 20.0, unlockCost: 5000, // Czas 8.0 -> 20.0, Unlock 1.2k -> 5k
        reqRes: "thermo", reqContinent: null 
    },
    { 
        id: "coal_turbine", name: "Turbina Węglowa", 
        baseCost: 10000, baseProd: 1200, baseTime: 18.0, unlockCost: 0, 
        reqRes: "thermo", replaces: "steam_engine", reqLoc: "poland", reqContinent: "europe" 
    },

    // --- TIER 4 (ELEKTRYCZNOŚĆ) ---
    { 
        id: "electric_loom", name: "Tkacka Elektryczna", 
        baseCost: 25000, baseProd: 2500, baseTime: 40.0, unlockCost: 50000, // Czas 6.0 -> 40.0, Unlock 10k -> 50k
        reqRes: "electr", reqContinent: null 
    },
    { 
        id: "precision_lathe", name: "Tokarka Precyzyjna", 
        baseCost: 75000, baseProd: 6000, baseTime: 35.0, unlockCost: 0, 
        reqRes: "electr", replaces: "electric_loom", reqLoc: "germany", reqContinent: "europe" 
    },

    // --- TIER 5 (MASOWA PRODUKCJA) ---
    { 
        id: "assembly_line", name: "Linia Montażowa", 
        baseCost: 250000, baseProd: 20000, baseTime: 60.0, unlockCost: 500000, // Czas 12.0 -> 60.0 (1 min)
        reqRes: "logistics", reqContinent: "america" 
    },
    { 
        id: "royal_assembly", name: "Królewska Manufaktura", 
        baseCost: 200000, baseProd: 25000, baseTime: 50.0, unlockCost: 0, 
        reqRes: "logistics", replaces: "assembly_line", reqLoc: "uk", reqContinent: "europe" 
    },

    // --- TIER 6+ (ZAAWANSOWANE - CZASY W MINUTACH) ---
    { 
        id: "diesel_generator", name: "Agregat Przemysłowy", 
        baseCost: 1000000, baseProd: 50000, baseTime: 120.0, unlockCost: 2500000, // 2 min
        reqRes: "chemistry", reqContinent: "america" 
    },
    { 
        id: "cnc_machine", name: "Obrabiarka CNC", 
        baseCost: 5000000, baseProd: 150000, baseTime: 180.0, unlockCost: 10000000, // 3 min
        reqRes: "computing", reqContinent: "asia" 
    },
    { 
        id: "robot_arm", name: "Ramię Robota", 
        baseCost: 25000000, baseProd: 600000, baseTime: 300.0, unlockCost: 50000000, // 5 min
        reqRes: "robotics", reqContinent: "asia" 
    },
    { 
        id: "chip_fab", name: "Fabryka Chipów", 
        baseCost: 100000000, baseProd: 2500000, baseTime: 600.0, unlockCost: 250000000, // 10 min
        reqRes: "nanotech", reqContinent: "asia" 
    },

    // --- KOSMOS (LATE GAME - BARDZO DŁUGIE CYKLE) ---
    { 
        id: "moon_miner", name: "Koparka Helu-3", 
        baseCost: 1000000000, baseProd: 10000000, baseTime: 1200.0, unlockCost: 2000000000, // 20 min
        reqRes: "robotics", reqContinent: "moon_base" 
    },
    { 
        id: "martian_printer", name: "Drukarka 4D", 
        baseCost: 5000000000, baseProd: 50000000, baseTime: 1800.0, unlockCost: 10000000000, // 30 min
        reqRes: "ai_systems", reqContinent: "mars_base" 
    },
    { 
        id: "quantum_assembler", name: "Monter Kwantowy", 
        baseCost: 100000000000, baseProd: 5000000000, baseTime: 3600.0, unlockCost: 100000000000, // 60 min (1h)
        reqRes: "quantum", reqContinent: "venus_base" 
    }
];

export const RESEARCH_CONFIG = [
    { id: "basic_physics", name: "Podstawy Fizyki", baseProd: 1, baseTime: 5.0, unlockCost: 0 },
    { id: "thermo", name: "Termodynamika", baseProd: 4, baseTime: 15.0, unlockCost: 1000 },
    { id: "electr", name: "Elektryczność", baseProd: 10, baseTime: 30.0, unlockCost: 10000 },
    // Zwiększone czasy badań
    { id: "logistics", name: "Logistyka Stosowana", baseProd: 25, baseTime: 60.0, unlockCost: 50000 },
    { id: "chemistry", name: "Chemia Przemysłowa", baseProd: 60, baseTime: 120.0, unlockCost: 250000 },
    { id: "computing", name: "Informatyka", baseProd: 150, baseTime: 240.0, unlockCost: 1000000 },
    { id: "robotics", name: "Robotyka", baseProd: 400, baseTime: 480.0, unlockCost: 5000000 },
    { id: "ai_systems", name: "Systemy AI", baseProd: 1000, baseTime: 960.0, unlockCost: 25000000 },
    { id: "nanotech", name: "Nanotechnologia", baseProd: 2500, baseTime: 1920.0, unlockCost: 100000000 },
    { id: "quantum", name: "Fizyka Kwantowa", baseProd: 10000, baseTime: 3840.0, unlockCost: 1000000000 }
];

export const UPGRADES_CONFIG = [
    // Zwiększone costMult (drastycznie podbita cena kolejnych poziomów)
    { id: "lubricants", name: "Lepsze Smary", desc: "+20% prędkości.", baseCost: 10, costMult: 3.5, maxLevel: 10, effect: { type: "speed_mult", value: 0.20 } },
    { id: "training", name: "Szkolenie Kadr", desc: "+1 Max Energii.", baseCost: 50, costMult: 4.0, maxLevel: 5, effect: { type: "energy_max", value: 1 } },
    { id: "marketing", name: "Marketing", desc: "+50% Zysku ($).", baseCost: 200, costMult: 3.0, maxLevel: 20, effect: { type: "production_mult", value: 0.5 } },
    { id: "research_grant", name: "Granty Naukowe", desc: "+25% Wiedzy.", baseCost: 100, costMult: 3.5, maxLevel: 10, effect: { type: "knowledge_mult", value: 0.25 } }
];

export const HR_CONFIG = [
    { id: "pm", name: "Project Manager", cost: 1, desc: "+10% Zarobków" },
    { id: "opt", name: "Optimization Spec.", cost: 3, desc: "Zastępuje 2 Energii" },
    { id: "log", name: "Logistics Spec.", cost: 2, desc: "+10% Prędkości, +1 Koszt Energii" }
];

export const LOCATIONS = [
    {
        id: "earth", name: "ZIEMIA", reqCash: 0,
        continents: [
            {
                id: "africa", name: "Afryka", reqCash: 0,
                desc: "Start.", mods: { prod: 1.0, know: 1.0, energyMax: 0 },
                countries: [
                    { id: "congo", name: "Kongo", mult: 1, reqCash: 0 },
                    { id: "egypt", name: "Egipt", mult: 2, reqCash: 50000 },
                    { id: "rsa", name: "RPA", mult: 4, reqCash: 250000 }
                ]
            },
            {
                id: "europe", name: "Europa", reqCash: 1000000,
                desc: "Bogata, ale biurokratyczna (-1 Energii).", mods: { prod: 1.5, know: 1.2, energyMax: -1 },
                countries: [
                    { id: "poland", name: "Polska", mult: 10, reqCash: 1000000 },
                    { id: "germany", name: "Niemcy", mult: 25, reqCash: 50000000 },
                    { id: "uk", name: "Wielka Brytania", mult: 50, reqCash: 500000000 }
                ]
            },
            {
                id: "america", name: "Ameryka Płn.", reqCash: 10000000000,
                desc: "Kapitalizm.", mods: { prod: 2.0, know: 1.0, energyMax: 1 },
                countries: [
                    { id: "usa", name: "USA", mult: 100, reqCash: 10000000000 },
                    { id: "canada", name: "Kanada", mult: 150, reqCash: 500000000000 },
                    { id: "silicon_valley", name: "Dolina Krzemowa", mult: 300, reqCash: 1000000000000 }
                ]
            },
            {
                id: "asia", name: "Azja", reqCash: 10000000000000,
                desc: "Technologia.", mods: { prod: 0.8, know: 2.0, energyMax: 2 },
                countries: [
                    { id: "china", name: "Chiny", mult: 500, reqCash: 10000000000000 },
                    { id: "japan", name: "Japonia", mult: 800, reqCash: 500000000000000 },
                    { id: "singapore", name: "Singapur", mult: 1500, reqCash: 1000000000000000 }
                ]
            }
        ]
    },
    {
        id: "moon", name: "KSIĘŻYC", reqCash: 10000000000000000,
        continents: [
            {
                id: "moon_base", name: "Ciemna Strona", reqCash: 10000000000000000,
                desc: "Cisza radiowa.", mods: { prod: 1.0, know: 3.0, energyMax: -2 },
                countries: [
                    { id: "iss_dock", name: "Orbital Dock", mult: 5000, reqCash: 10000000000000000 },
                    { id: "tycho", name: "Krater Tycho", mult: 10000, reqCash: 5e16 },
                    { id: "armstrong", name: "Baza Armstrong", mult: 25000, reqCash: 1e17 }
                ]
            }
        ]
    },
    {
        id: "mars", name: "MARS", reqCash: 1e18,
        continents: [
            {
                id: "mars_base", name: "Olympus Mons", reqCash: 1e18,
                desc: "Niska grawitacja.", mods: { prod: 5.0, know: 0.8, energyMax: 0 },
                countries: [
                    { id: "curiosity", name: "Curiosity Site", mult: 50000, reqCash: 1e18 },
                    { id: "musk_city", name: "Colony One", mult: 100000, reqCash: 1e19 },
                    { id: "core_drill", name: "Wiertło Jądra", mult: 250000, reqCash: 1e20 }
                ]
            }
        ]
    },
    {
        id: "venus", name: "WENUS", reqCash: 1e22,
        continents: [
            {
                id: "venus_base", name: "Chmury Kwasowe", reqCash: 1e22,
                desc: "Ekstremalne warunki.", mods: { prod: 10.0, know: 1.0, energyMax: -5 },
                countries: [
                    { id: "sky_city", name: "Podniebne Miasto", mult: 1000000, reqCash: 1e22 },
                    { id: "sulfur_mine", name: "Kopalnia Siarki", mult: 2500000, reqCash: 1e23 }
                ]
            }
        ]
    },
    {
        id: "titan", name: "TYTAN", reqCash: 1e25,
        continents: [
            {
                id: "titan_base", name: "Metanowe Morze", reqCash: 1e25,
                desc: "Nieskończone paliwo.", mods: { prod: 50.0, know: 5.0, energyMax: 20 },
                countries: [
                    { id: "methane_rig", name: "Platforma Wiertnicza", mult: 10000000, reqCash: 1e25 },
                    { id: "cryo_lab", name: "Lab. Kriogeniczne", mult: 50000000, reqCash: 1e26 }
                ]
            }
        ]
    }
];