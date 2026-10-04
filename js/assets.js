/**
 * Mama Vana - Asset Manifest & Preloader
 * Maps all body parts, attacker frames, and backgrounds.
 */

const ASSETS_MANIFEST = {
    categories: [
        { id: 'bodys', name: 'جەستە (Body)', folder: 'body parts/bodys', icon: '👕', default: '1.png' },
        { id: 'head_shapes', name: 'شێوەی سەر (Head)', folder: 'body parts/head shapes', icon: '👤', default: '1.png' },
        { id: 'haires', name: 'قژ (Hair)', folder: 'body parts/haires', icon: '💇', default: null },
        { id: 'eyeborws', name: 'برۆکان (Eyebrows)', folder: 'body parts/eyeborws', icon: '〰️', default: '1.png' },
        { id: 'eyes', name: 'چاوەکان (Eyes)', folder: 'body parts/eyes', icon: '👀', default: '119.png' },
        { id: 'noses', name: 'لووت (Nose)', folder: 'body parts/noses', icon: '👃', default: '1.png' },
        { id: 'mouths', name: 'دەم (Mouth)', folder: 'body parts/mouths', icon: '👄', default: '1.png' },
        { id: 'ears', name: 'گوێچکە (Ears)', folder: 'body parts/ears', icon: '👂', default: '1.png' },
        { id: 'facials', name: 'سمێڵ و ڕیش (Beard/Facial)', folder: 'body parts/facials', icon: '🧔', default: '254.png' },
        { id: 'head_enquipments', name: 'پێداویستی سەر (Head Gear)', folder: 'body parts/head enquipments', icon: '👑', default: '295.png' },
        { id: 'body_enquipments', name: 'پێداویستی جەستە (Body Gear)', folder: 'body parts/Body enquipments', icon: '👔', default: '39.png' },
    ],

    bodyParts: {
        'bodys': [
            '1.png', '28.png', '44.png', '46.png', '48.png', '50.png', '54.png', '56.png',
            '58.png', '60.png', '62.png', '64.png', '66.png', '69.png', '71.png', '73.png',
            '75.png', '77.png', '79.png', '81.png', '83.png', '85.png', '87.png', '7.png', '8.png'
        ],
        'head_shapes': [
            '1.png', '103.png', '107.png', '108.png', '109.png', '110.png', '111.png',
            '113.png', '114.png', '115.png', '116.png', '7.png', '3.png'
        ],
        'haires': [
            '222.png', '223.png', '224.png', '225.png', '227.png', '228.png',
            '229.png', '230.png', '231.png', '232.png', '233.png', '234.png', '235.png',
            '236.png', '237.png', '238.png', '239.png', '240.png', '241.png', '242.png',
            '243.png', '244.png', '245.png', '246.png', '247.png', '248.png', '9.png', '19.png'
        ],
        'eyeborws': [
            '1.png', '188.png', '191.png', '192.png', '193.png', '194.png', '195.png'
        ],
        'eyes': [
            '1.png', '119.png', '122.png', '123.png', '125.png', '126.png', '128.png',
            '132.png', '137.png', '141.png', '142.png', '146.png', '151.png', '158.png',
            '168.png', '172.png', '176.png', '180.png', '8.png'
        ],
        'noses': [
            '1.png', '10.png', '273.png', '276.png', '277.png', '279.png', '280.png',
            '281.png', '282.png', '283.png'
        ],
        'mouths': [
            '1.png', '11.png', '199.png', '202.png', '203.png', '205.png', '206.png',
            '207.png', '208.png', '209.png', '210.png', '211.png', '212.png', '213.png',
            '214.png', '215.png', '216.png'
        ],
        'ears': [
            '1.png', '100.png', '6.png', '96.png', '97.png', '98.png', '99.png'
        ],
        'facials': [
            '1.png', '254.png', '255.png', '257.png', '259.png', '261.png', '263.png',
            '265.png', '267.png', '268.png', '269.png'
        ],
        'head_enquipments': [
            '283.png', '284.png', '295.png', '4.png', '5.png'
        ],
        'body_enquipments': [
            '39.png', '41.png'
        ],
        'talking_mouth': [
            '345.png', '346.png', '348.png', '349.png'
        ]
    },

    attacker: {
        'slap': ['341.png', '342.png', '343.png'],
        'Karate': ['360.png', '362.png'],
        'choking': ['349.png', '353.png', '380.png'],
        'eye_popping': ['375.png', '376.png', '378.png', '380.png', '381.png', '382.png', '383.png', '384.png'],
        'talking_mouth': ['345.png', '346.png', '348.png', '349.png'],
        'akm': ['frame1.png', 'frame2.png', 'frame3.png', 'bullet.png'],
        'm4': ['frame1.png', 'frame2.png', 'frame3.png', 'bullet.png']
    },

    shootingFx: ['attaker/shooting/blood.png'],

    backgrounds: ['15.png', '16.png', '17.png', 'Gothic City.png', 'Arabic City.png', 'Snowy Village.png', 'god of war.png', 'hogwarts school.png', 'hogwarts school great hall.png', 'shrek house.png', 'tekken.png', 'mama vana house.png', 'minecraft.png', 'terminator.png']
};

// Automatically sync all items from ITEM_COORDINATES in coordinates.js
// Any new item added to coordinates.js will automatically appear everywhere!
if (typeof ITEM_COORDINATES !== 'undefined') {
    for (const [cat, itemsObj] of Object.entries(ITEM_COORDINATES)) {
        if (!ASSETS_MANIFEST.bodyParts[cat]) {
            ASSETS_MANIFEST.bodyParts[cat] = [];
        }
        for (const file of Object.keys(itemsObj)) {
            if (!ASSETS_MANIFEST.bodyParts[cat].includes(file)) {
                ASSETS_MANIFEST.bodyParts[cat].push(file);
            }
        }
    }
}

class AssetManager {
    constructor() {
        this.cache = new Map();
        this.totalCount = 0;
        this.loadedCount = 0;
    }

    getCategoryFolder(catId) {
        switch (catId) {
            case 'bodys': return 'body parts/bodys';
            case 'head_shapes': return 'body parts/head shapes';
            case 'haires': return 'body parts/haires';
            case 'eyeborws': return 'body parts/eyeborws';
            case 'eyes': return 'body parts/eyes';
            case 'noses': return 'body parts/noses';
            case 'mouths': return 'body parts/mouths';
            case 'ears': return 'body parts/ears';
            case 'facials': return 'body parts/facials';
            case 'head_enquipments': return 'body parts/head enquipments';
            case 'body_enquipments': return 'body parts/Body enquipments';
            case 'talking_mouth': return 'body parts/talking mouth';
            default: return `body parts/${catId}`;
        }
    }

    getAttackerFolder(weaponId) {
        switch (weaponId) {
            case 'slap': return 'attaker/slap';
            case 'Karate': return 'attaker/Karate';
            case 'choking': return 'attaker/choking';
            case 'eye_popping': return 'attaker/eye popping';
            case 'talking_mouth':
            case 'talking mouth':
                return 'body parts/talking mouth';
            case 'akm': return 'attaker/shooting/akm';
            case 'm4': return 'attaker/shooting/m4';
            case 'kar98k': return 'attaker/shooting/kar98k';
            case 'pistol': return 'attaker/shooting/pistol';
            case 'shotgun': return 'attaker/shooting/shotgun';
            case 'flamethrower': return 'attaker/shooting/flamethrower';
            case 'paintball': return 'attaker/shooting/paintball';
            case 'katana': return 'attaker/swords/katana';
            case 'knight': return 'attaker/swords/knight';
            case 'minecraft': return 'attaker/swords/minecraft';
            case 'axe': return 'attaker/swords/axe';
            case 'blades_of_chaos':
            case 'Blade of Chaos':
                return 'attaker/swords/Blade of Chaos';
            case 'club': return 'attaker/swords/club';
            case 'floor_mop':
            case 'floor mop':
                return 'attaker/swords/floor mop';
            case 'karambit': return 'attaker/swords/karambit';
            case 'pubg_pan':
            case 'pubg pan':
                return 'attaker/swords/pubg pan';
            case 'cucumber': return 'attaker/swords/cucumber';
            case 'shuriken': return 'attaker/special/shuriken';
            case 'pencil': return 'attaker/special/pencil';
            case 'scorpion': return 'attaker/special/scorpion';
            case 'spiders': return 'attaker/special/spiders';
            case 'flip_flop': return 'attaker/special/flip flop';
            case 'watermelon': return 'attaker/special/watermelon';
            case 'drone': return 'attaker/special/drone';
            case 'elder_wand':
            case 'elder wand':
                return 'attaker/special/elder wand';
            default:
                if (window.coordinatesDB && window.coordinatesDB.getWeaponConfig) {
                    const wCfg = window.coordinatesDB.getWeaponConfig(weaponId);
                    if (wCfg && wCfg.folder) return wCfg.folder;
                }
                if (weaponId && weaponId.startsWith('body parts/')) return weaponId;
                if (weaponId && weaponId.startsWith('attaker/')) return weaponId;
                return `attaker/${weaponId}`;
        }
    }

    getItemPath(category, fileName) {
        if (!fileName) return '';
        const folder = this.getCategoryFolder(category);
        return `${folder}/${fileName}`;
    }

    preloadAll(onProgress, onComplete) {
        const urls = [];

        // Body parts
        for (const [cat, files] of Object.entries(ASSETS_MANIFEST.bodyParts)) {
            const folder = this.getCategoryFolder(cat);
            for (const file of files) {
                urls.push(`${folder}/${file}`);
            }
        }

        // Attacker frames
        for (const [weapon, files] of Object.entries(ASSETS_MANIFEST.attacker)) {
            const folder = this.getAttackerFolder(weapon);
            for (const file of files) {
                urls.push(`${folder}/${file}`);
            }
        }

        // Backgrounds
        for (const bg of ASSETS_MANIFEST.backgrounds) {
            urls.push(`backgrounds/${bg}`);
        }

        // Shooting FX (blood, etc.)
        if (ASSETS_MANIFEST.shootingFx) {
            for (const fx of ASSETS_MANIFEST.shootingFx) {
                urls.push(fx);
            }
        }

        this.totalCount = urls.length;
        this.loadedCount = 0;

        if (this.totalCount === 0) {
            if (onComplete) onComplete();
            return;
        }

        urls.forEach(url => {
            const img = new Image();
            img.onload = () => {
                this.loadedCount++;
                this.cache.set(url, img);
                if (onProgress) {
                    onProgress(this.loadedCount, this.totalCount, Math.floor((this.loadedCount / this.totalCount) * 100));
                }
                if (this.loadedCount >= this.totalCount && onComplete) {
                    onComplete();
                }
            };
            img.onerror = () => {
                console.warn(`Could not load asset: ${url}`);
                this.loadedCount++;
                if (onProgress) {
                    onProgress(this.loadedCount, this.totalCount, Math.floor((this.loadedCount / this.totalCount) * 100));
                }
                if (this.loadedCount >= this.totalCount && onComplete) {
                    onComplete();
                }
            };
            img.src = encodeURI(url);
        });
    }
}

window.assetManager = new AssetManager();
