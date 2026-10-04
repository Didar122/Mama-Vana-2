/**
 * Mama Vana - Configuration, Economy, Dialogues & Audio Manifest
 */

// =============================================================================
// DEVELOPER MODE VISIBILITY CONTROL
// Set to 'show' to make the Dev Studio button visible in Main Menu & HUD.
// Set to 'hidden' to completely hide the Dev Studio button.
// =============================================================================
const DEV_STUDIO_VISIBLE = 'hidden'; // Options: 'show' | 'hidden'

// =============================================================================
// ECONOMY & CURRENCY KEYS
// =============================================================================
const STORAGE_KEY_COINS = 'mama_vana_coins';
const STORAGE_KEY_DIAMONDS = 'mama_vana_diamonds';
const STORAGE_KEY_UNLOCKED = 'mama_vana_unlocked_items';
const STORAGE_KEY_UNLOCKED_SETS = 'mama_vana_unlocked_sets';
const STORAGE_KEY_BACKGROUND = 'mama_vana_active_background';
const STORAGE_KEY_CHARACTER = 'mama_vana_char_custom';
const STORAGE_KEY_SETTINGS = 'mama_vana_settings';
const STORAGE_KEY_SET_EFFECT_ENABLED = 'mama_vana_set_effect_enabled'; // 'true' | 'false'
const STORAGE_KEY_AGE_MODE = 'mama_vana_age_mode'; // 'all_ages' | '+18'
const STORAGE_KEY_AGE_PROMPT_SHOWN = 'mama_vana_age_prompt_shown'; // boolean

// =============================================================================
// RANKS & RARITY CONFIGURATION (Uncommon, Gold, Legendary)
// Easy to customize colors, labels, and visual accents
// =============================================================================
const ITEM_RANKS = {
    uncommon: {
        id: 'uncommon',
        name: 'ئاسایی',
        nameEn: 'Uncommon',
        color: '#2ed573',
        gradient: 'linear-gradient(135deg, #10ac84 0%, #2ed573 100%)',
        glow: 'rgba(46, 213, 115, 0.45)',
        border: '#2ed573',
        bg: 'rgba(46, 213, 115, 0.12)'
    },
    gold: {
        id: 'gold',
        name: 'ئاڵتوونی',
        nameEn: 'Gold',
        color: '#ffa502',
        gradient: 'linear-gradient(135deg, #e67e22 0%, #f1c40f 100%)',
        glow: 'rgba(255, 165, 2, 0.55)',
        border: '#ffa502',
        bg: 'rgba(255, 165, 2, 0.15)'
    },
    legendary: {
        id: 'legendary',
        name: 'ئەفسانەیی',
        nameEn: 'Legendary',
        color: '#ff4757',
        gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 50%, #9b59b6 100%)',
        glow: 'rgba(255, 71, 87, 0.65)',
        border: '#ff4757',
        bg: 'rgba(255, 71, 87, 0.18)'
    }
};

// =============================================================================
// CARD SETS CONFIGURATION (سێتە تەواوەکان)
// 
// How to add or edit cards:
// - id: Unique identifier
// - name: Kurdish Sorani name
// - subName: English subtitle
// - image: Path to image in assets/sets/
// - rank: 'uncommon' | 'gold' | 'legendary'
// - priceCoins: Coins needed to buy this set
// - priceDiamonds: Diamonds needed to buy this set
// - hasEffect: whether this set has a legendary effect
// - hasExclusiveBackground: whether this set has an exclusive background
// - items: Selected items that make up this complete outfit
// =============================================================================
const CARD_SETS = [

    {
        id: 'normal',
        name: 'سادە',
        subName: 'پیاوە سادەکە',
        image: 'assets/sets/normal.png',
        rank: 'uncommon',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: true,
        items: {
            bodys: '28.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'jail',
        name: 'زیندانی',
        subName: 'پیاوە تاوانبارەکە',
        image: 'assets/sets/Jail.png',
        rank: 'uncommon',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '81.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '295.png',
            body_enquipments: null
        }
    },
    {
        id: 'xatwn',
        name: 'خاتوو مەدام',
        subName: 'پیاوە نازدارەکە',
        image: 'assets/sets/xatwn.png',
        rank: 'uncommon',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '85.png',
            head_shapes: '1.png',
            haires: '12.png',
            eyeborws: '195.png',
            eyes: '132.png',
            noses: '273.png',
            mouths: '212.png',
            ears: '99.png',
            facials: null,
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'muscular',
        name: 'سوپەر ڤانە',
        subName: 'پیاوە غەزەبەکە',
        image: 'assets/sets/muscular.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '48.png',
            head_shapes: '1.png',
            haires: '13.png',
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '202.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '284.png',
            body_enquipments: null
        }
    },
    {
        id: 'homeless',
        name: 'مام سواڵکەر',
        subName: 'پیاوە کەوتوکە',
        image: 'assets/sets/homeless.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '50.png',
            head_shapes: '1.png',
            haires: '228.png',
            eyeborws: '188.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '207.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'mala',
        name: 'مامۆستا ڤانە',
        subName: 'پیاوە نورانیەکە',
        image: 'assets/sets/mala.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '62.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '304.png',
            body_enquipments: null
        }
    },
    {
        id: 'bad',
        name: 'ڤانە خەتەر',
        subName: 'پیاوە لەیاسا دەرچووەکە',
        image: 'assets/sets/bad.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '66.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '202.png',
            ears: '99.png',
            facials: '269.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'arab',
        name: 'ڤانە علوج',
        subName: 'پیاوە نیشتیمان پەروەرەکە',
        image: 'assets/sets/arab.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '75.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '301.png',
            body_enquipments: null
        }
    },
    {
        id: 'shex',
        name: 'شێخ ڤانە',
        subName: 'پیاوە گەورەکە',
        image: 'assets/sets/shex.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '77.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '302.png',
            body_enquipments: null
        }
    },
    {
        id: 'mafia',
        name: 'ڤانە مافیا',
        subName: 'پیاوە قاچاخچیەکە',
        image: 'assets/sets/mafia.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '79.png',
            head_shapes: '1.png',
            haires: '243.png',
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '202.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'afandi',
        name: 'ڤانە ئەفەنی',
        subName: 'پیاوە دەسڕۆشتووەکە',
        image: 'assets/sets/afandi.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '73.png',
            head_shapes: '109.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '300.png',
            body_enquipments: null
        }
    },
    {
        id: 'barsha',
        name: 'ڤانە بەرشەیی',
        subName: 'پیاوە میسی لۆڤەرەکە',
        image: 'assets/sets/barsha.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '56.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'ryal',
        name: 'ڤانە ڕیاڵی',
        subName: 'پیاوە ڕۆناڵدۆ لۆڤەرەکە',
        image: 'assets/sets/ryal.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '54.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'nawroz',
        name: 'ڤانەی فوتبۆڵ',
        subName: 'پیاوە وەرزش دۆستەکە',
        image: 'assets/sets/nawroz.png',
        rank: 'gold',
        priceCoins: 200,
        priceDiamonds: 0,
        unlockedByDefault: false,
        items: {
            bodys: '58.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'kurdish',
        name: 'ڤانە کوردی',
        subName: 'پیاوە کورد پەروەرەکە',
        image: 'assets/sets/kurdish.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '82.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '306.png',
            body_enquipments: null
        }
    },
    {
        id: 'tiger_jackson',
        name: 'تایگەر جاکسۆن',
        subName: 'کارەکتەرێکی تەیکن',
        image: 'assets/sets/Tiger Jackson.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '2.png',
            head_shapes: '1.png',
            haires: '11.png',
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '255.png',
            head_enquipments: '3.png',
            body_enquipments: null
        }
    },
    {
        id: 'harry_potter',
        name: 'هاری پۆتەر',
        subName: 'پیاوە ساحیرەکە',
        image: 'assets/sets/Harry Potter.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '3.png',
            head_shapes: '1.png',
            haires: '10.png',
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '2.png',
            body_enquipments: null
        }
    },
    {
        id: 'Draco_Malfoy',
        name: 'درەیکۆ مالفۆی',
        subName: 'پیاوە ساحیرە شڕیرەکە',
        image: 'assets/sets/Draco Malfoy.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '5.png',
            head_shapes: '1.png',
            haires: '18.png',
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'shrek',
        name: 'شڕێک',
        subName: 'پیاوە غولەکە',
        image: 'assets/sets/shrek.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '87.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '2.png',
            mouths: '1.png',
            ears: '2.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'god_of_war',
        name: 'گاد ئۆف واڕ',
        subName: 'پیاوە سامناکەکە',
        image: 'assets/sets/god of war.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '64.png',
            head_shapes: '116.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '2.png',
            mouths: '203.png',
            ears: '99.png',
            facials: '268.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'parti',
        name: 'پارتی و بارزانی',
        subName: 'پیاوە زەردەکە',
        image: 'assets/sets/parti.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '83.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '297.png',
            body_enquipments: null
        }
    },
    {
        id: 'traffic_police',
        name: 'کارمەندی هاتووچۆ',
        subName: 'پیاوە یاساییەکە',
        image: 'assets/sets/traffic police.png',
        rank: 'legendary',
        hasEffect: false,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '69.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '303.png',
            body_enquipments: null
        }
    },
    {
        id: 'stive',
        name: 'ستیڤ',
        subName: 'پیاوە بنیاتنەرەکە',
        image: 'assets/sets/stive.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '4.png',
            head_shapes: '2.png',
            haires: '16.png',
            eyeborws: '191.png',
            eyes: '1.png',
            noses: '280.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        }
    },
    {
        id: 'terminator',
        name: 'ڤانە تۆرمیناتۆر',
        subName: 'پیاوە ئاسنینەکە',
        image: 'assets/sets/terminator.png',
        rank: 'legendary',
        hasEffect: true,
        hasExclusiveBackground: true,
        priceCoins: 600,
        priceDiamonds: 15,
        unlockedByDefault: false,
        items: {
            bodys: '6.png',
            head_shapes: '1.png',
            haires: '19.png',
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '280.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: '4.png',
            body_enquipments: null
        }
    }
];

// =============================================================================
// INDIVIDUAL ITEM RANKS & PRICES (ڕێکخستنی نرخی بەشەکان)
// Specific overrides can be added here. Any item not listed here
// automatically gets a rank and price based on its set inclusion or category defaults.
// =============================================================================
const CUSTOM_ITEMS_DATA = {
    bodys: {
        '1.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0, unlockedByDefault: true },
        '28.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0, unlockedByDefault: true },
        '82.png': { rank: 'gold', priceCoins: 0, priceDiamonds: 0, unlockedByDefault: true },
        '46.png': { rank: 'uncommon', priceCoins: 120, priceDiamonds: 0 },
        '71.png': { rank: 'uncommon', priceCoins: 120, priceDiamonds: 0 },
        '44.png': { rank: 'uncommon', priceCoins: 120, priceDiamonds: 0 },
        '48.png': { rank: 'gold', priceCoins: 250, priceDiamonds: 3 },
        '50.png': { rank: 'gold', priceCoins: 250, priceDiamonds: 3 },
        '54.png': { rank: 'gold', priceCoins: 250, priceDiamonds: 3 },
        '56.png': { rank: 'gold', priceCoins: 250, priceDiamonds: 3 },
        '58.png': { rank: 'gold', priceCoins: 250, priceDiamonds: 3 },
        '60.png': { rank: 'uncommon', priceCoins: 120, priceDiamonds: 0 },
        '62.png': { rank: 'gold', priceCoins: 120, priceDiamonds: 0 },
        '66.png': { rank: 'gold', priceCoins: 120, priceDiamonds: 0 },
        '73.png': { rank: 'gold', priceCoins: 120, priceDiamonds: 0 },
        '75.png': { rank: 'gold', priceCoins: 120, priceDiamonds: 0 },
        '79.png': { rank: 'gold', priceCoins: 120, priceDiamonds: 0 },
        '85.png': { rank: 'gold', priceCoins: 120, priceDiamonds: 0 },
        '83.png': { rank: 'gold', priceCoins: 250, priceDiamonds: 3 },
        '87.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '2.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '3.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '4.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '69.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '64.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '77.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '81.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '7.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 },
        '8.png': { rank: 'legendary', priceCoins: 400, priceDiamonds: 8 }
    },
    head_shapes: {
        '1.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0, unlockedByDefault: true },
        '2.png': { rank: 'legendary', priceCoins: 0, priceDiamonds: 0 },
        '103.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0 },
        '107.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0 },
        '108.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0 },
        '109.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0 },
        '110.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0 },
        '111.png': { rank: 'gold', priceCoins: 0, priceDiamonds: 0 },
        '113.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0 },
        '114.png': { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0 },
        '115.png': { rank: 'gold', priceCoins: 0, priceDiamonds: 0 },
        '116.png': { rank: 'legendary', priceCoins: 0, priceDiamonds: 0 },
        '3.png': { rank: 'legendary', priceCoins: 0, priceDiamonds: 0 },
        '7.png': { rank: 'legendary', priceCoins: 0, priceDiamonds: 0 }
    },
    haires: {
        '222.png': { rank: 'gold', priceCoins: 140, priceDiamonds: 1 },
        '223.png': { rank: 'uncommon', priceCoins: 70, priceDiamonds: 0 },
        '224.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '225.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '227.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '228.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '229.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '230.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '231.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '232.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '233.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '234.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '235.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '236.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '237.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '238.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5 },
        '239.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '240.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '241.png': { rank: 'gold', priceCoins: 300, priceDiamonds: 5 },
        '242.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '243.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '244.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '245.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '246.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '247.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '248.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '9.png': { rank: 'uncommon', priceCoins: 300, priceDiamonds: 5 },
        '10.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5 },
        '11.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5 },
        '12.png': { rank: 'uncommon', priceCoins: 140, priceDiamonds: 1 },
        '13.png': { rank: 'gold', priceCoins: 200, priceDiamonds: 2 },
        '14.png': { rank: 'gold', priceCoins: 200, priceDiamonds: 2 },
        '15.png': { rank: 'gold', priceCoins: 200, priceDiamonds: 2 },
        '18.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5 },
        '16.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5 },
        '17.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5 },
        '19.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5 }
    },
    head_enquipments: {
        '4.png':   { rank: 'gold', priceCoins: 180, priceDiamonds: 2,  unlockedByDefault: false },
        '5.png':   { rank: 'gold', priceCoins: 180, priceDiamonds: 2,  unlockedByDefault: false },
        '2.png':   { rank: 'legendary', priceCoins: 320, priceDiamonds: 6,  unlockedByDefault: false },
        '3.png':   { rank: 'legendary', priceCoins: 320, priceDiamonds: 6,  unlockedByDefault: false },
        '283.png': { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0,  unlockedByDefault: false },
        '284.png': { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0,  unlockedByDefault: false },
        '295.png': { rank: 'gold',      priceCoins: 200, priceDiamonds: 3,  unlockedByDefault: false },
        '296.png': { rank: 'gold',      priceCoins: 180, priceDiamonds: 2,  unlockedByDefault: false },
        '297.png': { rank: 'legendary', priceCoins: 320, priceDiamonds: 6,  unlockedByDefault: false },
        '298.png': { rank: 'uncommon',  priceCoins: 90,  priceDiamonds: 0,  unlockedByDefault: false },
        '299.png': { rank: 'gold',      priceCoins: 180, priceDiamonds: 2,  unlockedByDefault: false },
        '300.png': { rank: 'gold',      priceCoins: 180, priceDiamonds: 2,  unlockedByDefault: false },
        '301.png': { rank: 'gold',      priceCoins: 200, priceDiamonds: 3,  unlockedByDefault: false },
        '302.png': { rank: 'gold',      priceCoins: 200, priceDiamonds: 3,  unlockedByDefault: false },
        '303.png': { rank: 'legendary', priceCoins: 320, priceDiamonds: 6,  unlockedByDefault: false },
        '304.png': { rank: 'gold',      priceCoins: 200, priceDiamonds: 3,  unlockedByDefault: false },
        '305.png': { rank: 'gold',      priceCoins: 200, priceDiamonds: 3,  unlockedByDefault: false },
        '306.png': { rank: 'gold',      priceCoins: 200, priceDiamonds: 3,  unlockedByDefault: false },
        '307.png': { rank: 'legendary', priceCoins: 320, priceDiamonds: 6,  unlockedByDefault: false },
        '308.png': { rank: 'legendary', priceCoins: 320, priceDiamonds: 6,  unlockedByDefault: false },
        '309.png': { rank: 'legendary', priceCoins: 320, priceDiamonds: 6,  unlockedByDefault: false }
    },
    body_enquipments: {
        '5.png':  { rank: 'gold', priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '6.png':  { rank: 'gold', priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '7.png':  { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '8.png':  { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '10.png': { rank: 'uncommon', priceCoins: 90, priceDiamonds: 0, unlockedByDefault: false },
        '11.png': { rank: 'gold', priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '12.png': { rank: 'gold', priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '39.png': { rank: 'gold',      priceCoins: 150, priceDiamonds: 2, unlockedByDefault: false },
        '41.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false }
    },
    eyeborws: {
        '1.png':   { rank: 'uncommon', priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '188.png': { rank: 'uncommon', priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '191.png': { rank: 'uncommon', priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '192.png': { rank: 'gold',     priceCoins: 150, priceDiamonds: 1, unlockedByDefault: false },
        '193.png': { rank: 'uncommon', priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '194.png': { rank: 'gold',     priceCoins: 150, priceDiamonds: 1, unlockedByDefault: false },
        '195.png': { rank: 'legendary',priceCoins: 280, priceDiamonds: 4, unlockedByDefault: false }
    },
    eyes: {
        '1.png':   { rank: 'uncommon',  priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '2.png':   { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '119.png': { rank: 'uncommon',  priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '122.png': { rank: 'uncommon',  priceCoins: 70,  priceDiamonds: 0, unlockedByDefault: false },
        '123.png': { rank: 'uncommon',  priceCoins: 70,  priceDiamonds: 0, unlockedByDefault: false },
        '125.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '126.png': { rank: 'uncommon',  priceCoins: 70,  priceDiamonds: 0, unlockedByDefault: false },
        '128.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '132.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '137.png': { rank: 'uncommon',  priceCoins: 70,  priceDiamonds: 0, unlockedByDefault: false },
        '141.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '142.png': { rank: 'uncommon',  priceCoins: 70,  priceDiamonds: 0, unlockedByDefault: false },
        '146.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '151.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '158.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '168.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '172.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '176.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '180.png': { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '8.png':   { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false }
    },
    noses: {
        '1.png':   { rank: 'uncommon', priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '2.png':   { rank: 'legendary', priceCoins: 260, priceDiamonds: 4, unlockedByDefault: false },
        '3.png':   { rank: 'gold',     priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '10.png':  { rank: 'uncommon', priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '273.png': { rank: 'uncommon', priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '276.png': { rank: 'gold',     priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '277.png': { rank: 'uncommon', priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '279.png': { rank: 'gold',     priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '280.png': { rank: 'gold',     priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '281.png': { rank: 'uncommon', priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '282.png': { rank: 'legendary',priceCoins: 260, priceDiamonds: 4, unlockedByDefault: false },
        '283.png': { rank: 'legendary',priceCoins: 260, priceDiamonds: 4, unlockedByDefault: false }
    },
    mouths: {
        '1.png':   { rank: 'uncommon',  priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '11.png':  { rank: 'uncommon',  priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '199.png': { rank: 'uncommon',  priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '202.png': { rank: 'gold',      priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '203.png': { rank: 'legendary', priceCoins: 280, priceDiamonds: 4, unlockedByDefault: false },
        '205.png': { rank: 'uncommon',  priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '206.png': { rank: 'gold',      priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '207.png': { rank: 'uncommon',  priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '208.png': { rank: 'gold',      priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '209.png': { rank: 'uncommon',  priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '210.png': { rank: 'gold',      priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '211.png': { rank: 'legendary', priceCoins: 280, priceDiamonds: 4, unlockedByDefault: false },
        '212.png': { rank: 'uncommon',  priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '213.png': { rank: 'gold',      priceCoins: 140, priceDiamonds: 1, unlockedByDefault: false },
        '214.png': { rank: 'legendary', priceCoins: 280, priceDiamonds: 4, unlockedByDefault: false },
        '215.png': { rank: 'uncommon',  priceCoins: 60,  priceDiamonds: 0, unlockedByDefault: false },
        '216.png': { rank: 'legendary', priceCoins: 280, priceDiamonds: 4, unlockedByDefault: false }
    },
    ears: {
        '1.png':   { rank: 'uncommon',  priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '2.png':   { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '99.png':  { rank: 'uncommon',  priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '96.png':  { rank: 'uncommon',  priceCoins: 70,  priceDiamonds: 0, unlockedByDefault: false },
        '97.png':  { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '98.png':  { rank: 'gold',      priceCoins: 160, priceDiamonds: 2, unlockedByDefault: false },
        '100.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '6.png':   { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false }
    },
    facials: {
        '1.png':   { rank: 'uncommon',  priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '2.png':   { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0, unlockedByDefault: false },
        '3.png':   { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0, unlockedByDefault: false },
        '4.png':   { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0, unlockedByDefault: false },
        '5.png':   { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '6.png':   { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '7.png':   { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '8.png':   { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '9.png':   { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '10.png':  { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '11.png':  { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '12.png':  { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '254.png': { rank: 'uncommon',  priceCoins: 0,   priceDiamonds: 0, unlockedByDefault: true  },
        '255.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '257.png': { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0, unlockedByDefault: false },
        '259.png': { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '261.png': { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0, unlockedByDefault: false },
        '263.png': { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '265.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '267.png': { rank: 'gold',      priceCoins: 180, priceDiamonds: 2, unlockedByDefault: false },
        '268.png': { rank: 'legendary', priceCoins: 300, priceDiamonds: 5, unlockedByDefault: false },
        '269.png': { rank: 'uncommon',  priceCoins: 80,  priceDiamonds: 0, unlockedByDefault: false }
    }
};

/**
 * Returns rank, price and unlock status for any item.
 * Guarantees every single item has rank color and editable values.
 */
function getItemRankAndPrice(category, file) {
    if (!file) {
        return { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0, unlockedByDefault: true };
    }

    // 1. Direct explicit override
    if (CUSTOM_ITEMS_DATA[category] && CUSTOM_ITEMS_DATA[category][file]) {
        return { unlockedByDefault: false, ...CUSTOM_ITEMS_DATA[category][file] };
    }

    // 2. Check if part of any CARD_SETS
    for (const set of CARD_SETS) {
        if (set.items && set.items[category] === file) {
            const setRank = set.rank || 'gold';
            let priceCoins = 100;
            let priceDiamonds = 0;
            if (setRank === 'gold') { priceCoins = 180; priceDiamonds = 2; }
            else if (setRank === 'legendary') { priceCoins = 320; priceDiamonds = 5; }
            else { priceCoins = 90; priceDiamonds = 0; }
            return { rank: setRank, priceCoins, priceDiamonds, unlockedByDefault: false, setRef: set };
        }
    }

    // 3. Default starter items
    const freeDefaults = {
        bodys: ['1.png', '28.png'],
        head_shapes: ['1.png'],
        eyeborws: ['1.png'],
        eyes: ['1.png'],
        noses: ['1.png'],
        mouths: ['1.png'],
        ears: ['99.png'],
        facials: ['1.png']
    };
    if (freeDefaults[category] && freeDefaults[category].includes(file)) {
        return { rank: 'uncommon', priceCoins: 0, priceDiamonds: 0, unlockedByDefault: true };
    }

    // 4. Deterministic fallback so every item has a rank & price
    let hash = 0;
    const str = `${category}:${file}`;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    hash = Math.abs(hash);

    const rankTier = hash % 10;
    if (rankTier < 5) {
        return { rank: 'uncommon', priceCoins: 50 + (hash % 4) * 10, priceDiamonds: 0, unlockedByDefault: false };
    } else if (rankTier < 8) {
        return { rank: 'gold', priceCoins: 120 + (hash % 5) * 20, priceDiamonds: 1 + (hash % 3), unlockedByDefault: false };
    } else {
        return { rank: 'legendary', priceCoins: 240 + (hash % 6) * 30, priceDiamonds: 4 + (hash % 4), unlockedByDefault: false };
    }
}

// Available Backgrounds in the game
// exclusiveSetId: if set, this background can ONLY be unlocked by purchasing that card set
const AVAILABLE_BACKGROUNDS = [
    { id: '17.png',                name: 'هەولێری کۆن',           file: '17.png',              rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'parti'          },
    { id: 'kurdish_home_at_night.png', name: 'ماڵی کوردی لە شەو', file: 'kurdish home at night.png', rank: 'legendary', priceCoins: 0, priceDiamonds: 0, unlocked: false, exclusiveSetId: 'kurdish' },
    { id: '15.png',                name: 'ناوماڵی کوردی',         file: '15.png',              rank: 'gold',      priceCoins: 100, priceDiamonds: 0,  unlocked: false },
    { id: '16.png',                name: 'سروشتی کوردستان',      file: '16.png',              rank: 'legendary', priceCoins: 250, priceDiamonds: 10, unlocked: false },
    { id: 'god_of_war.png',        name: 'گاد ئۆف واڕ',           file: 'god of war.png',      rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'god_of_war'     },
    { id: 'hogwarts_school.png',   name: 'قوتابخانەی هۆگوارتس',  file: 'hogwarts school.png', rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'harry_potter'   },
    { id: 'hogwarts_school_great_hall.png', name: 'هۆڵی گەورەی هۆگوارتس', file: 'hogwarts school great hall.png', rank: 'legendary', priceCoins: 0, priceDiamonds: 0, unlocked: false, exclusiveSetId: 'Draco_Malfoy' },
    { id: 'shrek_house.png',       name: 'ماڵی شڕێک',             file: 'shrek house.png',     rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'shrek'          },
    { id: 'tekken.png',            name: 'تێکن',                  file: 'tekken.png',          rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'tiger_jackson'  },
    { id: 'mama_vana_house.png',   name: 'ماڵی ماما ڤانە',        file: 'mama vana house.png', rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'traffic_police' },
    { id: 'minecraft.png',         name: 'ماینکرافت',             file: 'minecraft.png',       rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'stive' },
    { id: 'terminator.png',        name: 'تۆرمیناتۆر',             file: 'terminator.png',      rank: 'legendary', priceCoins: 0,   priceDiamonds: 0,  unlocked: false, exclusiveSetId: 'terminator' }
];

// Available Weapons Dock configurations
const WEAPONS = [
    {
        id: 'hand',
        name: 'لێدان (Punch)',
        iconEmoji: '👊',
        iconFile: 'hand.png',
        damage: 15,
        type: 'drag_punch',
        category: 'melee',
        sound: 'punch'
    },
    {
        id: 'slap',
        name: 'زللـە (Slap)',
        iconEmoji: '👋',
        iconFile: 'slap.png',
        category: 'melee',
        type: 'animated_attack'
    },
    {
        id: 'Karate',
        name: 'کاراتی (Karate)',
        iconEmoji: '🥋',
        iconFile: 'Karate.png',
        category: 'melee',
        type: 'animated_attack'
    },
    {
        id: 'choking',
        name: 'خنکاندن (Choke)',
        iconEmoji: '✋',
        iconFile: 'choking.png',
        category: 'melee',
        type: 'animated_attack'
    },
    {
        id: 'eye_popping',
        name: 'دەرهێنانی چاو (Eye Pop)',
        iconEmoji: '👀',
        iconFile: 'eye_popping.png',
        category: 'melee',
        type: 'animated_attack'
    },
    {
        id: 'akm',
        name: 'کڵاشینکۆف (AKM)',
        iconEmoji: '🔫',
        iconPath: 'attaker/shooting/akm/akm.png',
        iconFile: 'akm.png',
        damage: 35,
        type: 'shooting',
        category: 'shooting'
    },
    {
        id: 'm4',
        name: 'ئێم فۆڕ (M4A1)',
        iconEmoji: '🔫',
        iconPath: 'attaker/shooting/m4/m4.png',
        iconFile: 'm4.png',
        damage: 30,
        type: 'shooting',
        category: 'shooting'
    },
    {
        id: 'kar98k',
        name: 'بڕنەو (Kar98k)',
        iconEmoji: '🔫',
        iconPath: 'attaker/shooting/kar98k/kar98k.png',
        iconFile: 'kar98k.png',
        damage: 55,
        type: 'shooting',
        category: 'shooting'
    },
    {
        id: 'pistol',
        name: 'دەمانچە (Pistol)',
        iconEmoji: '🔫',
        iconPath: 'attaker/shooting/pistol/pistol.png',
        iconFile: 'pistol.png',
        damage: 25,
        type: 'shooting',
        category: 'shooting'
    },
    {
        id: 'shotgun',
        name: 'تاپڕ (Shotgun)',
        iconEmoji: '🔫',
        iconPath: 'attaker/shooting/shotgun/shotgun.png',
        iconFile: 'shotgun.png',
        damage: 60,
        type: 'shooting',
        category: 'shooting'
    },
    {
        id: 'flamethrower',
        name: 'فلامێن تۆڕ (Flamethrower)',
        iconEmoji: '🔥',
        iconPath: 'attaker/shooting/flamethrower/flamethrower.png',
        iconFile: 'flamethrower.png',
        damage: 22,
        type: 'shooting',
        category: 'shooting'
    },
    {
        id: 'paintball',
        name: 'پەینتباڵ (Paintball)',
        iconEmoji: '🎨',
        iconPath: 'attaker/shooting/paintball/paintball.png',
        iconFile: 'paintball.png',
        damage: 12,
        type: 'shooting',
        category: 'shooting'
    },
    {
        id: 'katana',
        name: 'شمشێری کیتانا (Katana)',
        iconEmoji: '⚔️',
        iconPath: 'attaker/swords/katana/katana.png',
        iconFile: 'katana.png',
        damage: 45,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'knight',
        name: 'شمشێری سوارچاک (Knight)',
        iconEmoji: '⚔️',
        iconPath: 'attaker/swords/knight/knight.png',
        iconFile: 'knight.png',
        damage: 50,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'minecraft',
        name: 'شمشێری ماینکرافت (Minecraft)',
        iconEmoji: '⚔️',
        iconPath: 'attaker/swords/minecraft/minecraft.png',
        iconFile: 'minecraft.png',
        damage: 40,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'axe',
        name: 'تەور (Axe)',
        iconEmoji: '🪓',
        iconPath: 'attaker/swords/axe/axe.png',
        iconFile: 'axe.png',
        damage: 50,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'blades_of_chaos',
        name: 'شمشێری کەیۆس (Blades of Chaos)',
        iconEmoji: '⚔️',
        iconPath: 'attaker/swords/Blade of Chaos/Blade of Chaos.png',
        iconFile: 'Blade of Chaos.png',
        damage: 65,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'club',
        name: 'دار دەست (Club)',
        iconEmoji: '🏏',
        iconPath: 'attaker/swords/club/club.png',
        iconFile: 'club.png',
        damage: 45,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'floor_mop',
        name: 'ماسیحە (Floor Mop)',
        iconEmoji: '🧹',
        iconPath: 'attaker/swords/floor mop/floor mop.png',
        iconFile: 'floor mop.png',
        damage: 35,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'karambit',
        name: 'چەقۆی کارامبیت (Karambit)',
        iconEmoji: '🗡️',
        iconPath: 'attaker/swords/karambit/karambit.png',
        iconFile: 'karambit.png',
        damage: 40,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'pubg_pan',
        name: 'تاوەی پۆبجی (PUBG Pan)',
        iconEmoji: '🍳',
        iconPath: 'attaker/swords/pubg pan/pubg pan.png',
        iconFile: 'pubg pan.png',
        damage: 55,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'cucumber',
        name: 'خیار (Cucumber)',
        iconEmoji: '🥒',
        iconPath: 'attaker/swords/cucumber/cucumber.png',
        iconFile: 'cucumber.png',
        damage: 38,
        type: 'swords',
        category: 'swords'
    },
    {
        id: 'shuriken',
        name: 'شووریکەن (Shuriken)',
        iconEmoji: '✨',
        iconPath: 'attaker/special/shuriken/shuriken.png',
        iconFile: 'shuriken.png',
        damage: 30,
        type: 'special',
        category: 'special'
    },
    {
        id: 'pencil',
        name: 'پێنووس (Pencil)',
        iconEmoji: '✏️',
        iconPath: 'attaker/special/pencil/pencil.png',
        iconFile: 'pencil.png',
        damage: 24,
        type: 'special',
        category: 'special'
    },
    {
        id: 'scorpion',
        name: 'دەستی سکۆرپیۆن (Scorpion)',
        iconEmoji: '🦂',
        iconPath: 'attaker/special/scorpion/scorpion.png',
        iconFile: 'scorpion.png',
        damage: 65,
        type: 'special',
        category: 'special'
    },
    {
        id: 'spiders',
        name: 'جاڵجاڵۆکەکان (Spiders)',
        iconEmoji: '🕷️',
        iconPath: 'attaker/special/spiders/spiders.png',
        iconFile: 'spiders.png',
        damage: 10,
        type: 'special',
        category: 'special'
    },
    {
        id: 'elder_wand',
        name: 'داری سحری (Elder Wand)',
        iconEmoji: '🪄',
        iconPath: 'attaker/special/elder wand/elder wand.png',
        iconFile: 'elder wand.png',
        damage: 70,
        type: 'special',
        category: 'special'
    },
    {
        id: 'flip_flop',
        name: 'نەعل (Flip Flop)',
        iconEmoji: '🩴',
        iconPath: 'attaker/special/flip flop/flip flop.png',
        iconFile: 'flip flop.png',
        damage: 14,
        type: 'special',
        category: 'special'
    },
    {
        id: 'watermelon',
        name: 'شوتی (Watermelon)',
        iconEmoji: '🍉',
        iconPath: 'attaker/special/watermelon/watermelon.png',
        iconFile: 'watermelon.png',
        damage: 28,
        type: 'special',
        category: 'special'
    },
    {
        id: 'drone',
        name: 'درۆن (Drone)',
        iconEmoji: '🚁',
        iconPath: 'attaker/special/drone/drone.png',
        iconFile: 'drone.png',
        damage: 18,
        type: 'special',
        category: 'special'
    }
];

// Kurdish Sorani funny lines for Mama Vana
const KURDISH_QUOTES = {
    onHit: [
        "ئای دایکە گیان!",
        "دەستت بشکێ چیت دەوێ ؟!",
        "سەرم سوڕا بەخوا!",
        "ئەرێ کاکە تۆ تەربێتت هەیە ؟!",
        "دەستم بەرەن بزانم خۆی بەچی ئەزانێ",
        "ماما ڤانە بەم شتانە ناترسێ !",
        "ئەرێ تۆ بێ ئیشی ؟ بۆ وازم لێ ناهێنیت ؟",
        "ئۆففففف! سمێڵم هەڵوەری!",
        "بەسە ئیتر سەرم تەقی!",
        "ئەرێ بۆ وا دەکەیت ?!"
    ],
    onHighDamage: [
        "ئاخ ئەگەر دەستم ئیشی ئەکرد",
        "هێواش، هێوااااش",
        "سەیری ئەم بێ ویژدانە کە!",
        "تۆ شێتیت یان چی ؟!!",
        "کەللـەی سەرم تەقی !",
        "ئاخخخ پشتم شکا!",
        "هەی کەلە بەران",
        "بەس دەس مەیە لە سمێێڵم چی ئەکەی بیکە",
        "هەی گدیش",
        "ئا بیخەنە ناو گایەلەکە !"
    ],
    onIdle: [
        "دەی تاقەتت نەما ؟!",
        "هەر ئەوەندەت لە دەست دێت ؟",
        "تەماشام مەکە، وەرە پێشەوە !",
        "هیوایەتم کوبەیە، کوبی، کوکو، شوشو",
        "خۆ خەوت لێنەکەوتووە ؟"
    ],
    onKO: [
        "ئیتر تەسلیم بووم...",
        "ئا لەم بەزمە...",
        "ئۆخەی ئیتر نەجاتم بوو لە دەستت!",
        "کەی بەخەبەر دێمەوە؟"
    ]
};

// =============================================================================
// CONFIG & ECONOMY MANAGER
// =============================================================================
class ConfigManager {
    constructor() {
        this.coins = this.loadCoins();
        this.diamonds = this.loadDiamonds();
        this.unlockedItems = this.loadUnlockedItems();
        this.unlockedSets = this.loadUnlockedSets();
        this.activeBackground = this.loadBackground();
        this.ageMode = this.loadAgeMode(); // 'all_ages' | '+18'
    }

    // ─── Sets & Items Unlock System ──────────────────────────────────────────
    loadUnlockedSets() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED_SETS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    }

    saveUnlockedSets() {
        try { localStorage.setItem(STORAGE_KEY_UNLOCKED_SETS, JSON.stringify(this.unlockedSets)); } catch (e) { }
    }

    isSetUnlocked(setId) {
        if (!setId) return false;
        const set = CARD_SETS.find(s => s.id === setId);
        if (set && set.unlockedByDefault) return true;
        return this.unlockedSets.includes(setId);
    }

    unlockSet(setId) {
        if (!this.unlockedSets.includes(setId)) {
            this.unlockedSets.push(setId);
            this.saveUnlockedSets();
        }
        // Automatically unlock all items in this set
        const set = CARD_SETS.find(s => s.id === setId);
        if (set && set.items) {
            for (const [cat, file] of Object.entries(set.items)) {
                if (file) {
                    this.unlockItem(cat, file);
                }
            }
        }
        // Auto-unlock the exclusive background linked to this set
        const exclusiveBg = AVAILABLE_BACKGROUNDS.find(bg => bg.exclusiveSetId === setId);
        if (exclusiveBg) {
            this.unlockItem(`bg_${exclusiveBg.file}`);
        }
    }

    // ─── Background Unlock Helper ────────────────────────────────────────────
    isBackgroundUnlocked(bg) {
        if (!bg) return false;
        // Free (priceCoins=0 and no exclusiveSetId) or explicitly in unlocked list
        if (!bg.exclusiveSetId && bg.priceCoins === 0) return true;
        // Explicitly purchased/unlocked
        if (this.isUnlocked(`bg_${bg.file}`)) return true;
        // Exclusive set background: check if the linked set is unlocked
        if (bg.exclusiveSetId && this.isSetUnlocked(bg.exclusiveSetId)) return true;
        return false;
    }

    // ─── Set Effect Toggle ──────────────────────────────────────────────────
    isSetEffectEnabled() {
        try {
            const val = localStorage.getItem(STORAGE_KEY_SET_EFFECT_ENABLED);
            return val !== 'false'; // default ON
        } catch (e) { return true; }
    }

    setSetEffectEnabled(enabled) {
        try { localStorage.setItem(STORAGE_KEY_SET_EFFECT_ENABLED, enabled ? 'true' : 'false'); } catch (e) { }
    }

    // ─── Helper: get exclusive bg file for a set ─────────────────────────────
    getExclusiveBgForSet(setId) {
        return AVAILABLE_BACKGROUNDS.find(bg => bg.exclusiveSetId === setId) || null;
    }

    isItemUnlocked(category, file) {
        if (!file) return true; // 'None' is always unlocked
        const itemData = getItemRankAndPrice(category, file);
        if (itemData.unlockedByDefault) return true;

        const key = `${category}:${file}`;
        if (this.unlockedItems.includes(key) || this.unlockedItems.includes(file)) {
            return true;
        }

        // Check if included in any UNLOCKED card set
        for (const set of CARD_SETS) {
            if (this.isSetUnlocked(set.id)) {
                if (set.items && set.items[category] === file) {
                    return true;
                }
            }
        }

        return false;
    }

    unlockItem(categoryOrId, file = null) {
        let key = categoryOrId;
        if (file) {
            key = `${categoryOrId}:${file}`;
        }
        if (!this.unlockedItems.includes(key)) {
            this.unlockedItems.push(key);
            this.saveUnlockedItems();
        }
    }

    buySet(setId) {
        const set = CARD_SETS.find(s => s.id === setId);
        if (!set) return false;
        if (this.isSetUnlocked(set.id)) return true;

        const costCoins = set.priceCoins || 0;
        const costDiamonds = set.priceDiamonds || 0;

        if (this.coins >= costCoins && this.diamonds >= costDiamonds) {
            this.saveCoins(this.coins - costCoins);
            this.saveDiamonds(this.diamonds - costDiamonds);
            this.unlockSet(set.id);
            this.notifyEconomyChange();
            if (window.soundEngine) {
                if (costDiamonds > 0) window.soundEngine.playDiamond();
                else window.soundEngine.playCoin();
            }
            return true;
        }
        return false;
    }

    buyItem(category, file) {
        if (this.isItemUnlocked(category, file)) return true;
        const itemData = getItemRankAndPrice(category, file);
        const costCoins = itemData.priceCoins || 0;
        const costDiamonds = itemData.priceDiamonds || 0;

        if (this.coins >= costCoins && this.diamonds >= costDiamonds) {
            this.saveCoins(this.coins - costCoins);
            this.saveDiamonds(this.diamonds - costDiamonds);
            this.unlockItem(category, file);
            this.notifyEconomyChange();
            if (window.soundEngine) {
                if (costDiamonds > 0) window.soundEngine.playDiamond();
                else window.soundEngine.playCoin();
            }
            return true;
        }
        return false;
    }

    // ─── Age Mode ───────────────────────────────────────────────────────────
    loadAgeMode() {
        try {
            return localStorage.getItem(STORAGE_KEY_AGE_MODE) || 'all_ages';
        } catch (e) { return 'all_ages'; }
    }

    saveAgeMode(mode) {
        this.ageMode = (mode === '+18') ? '+18' : 'all_ages';
        try { localStorage.setItem(STORAGE_KEY_AGE_MODE, this.ageMode); } catch (e) { }
        // Also persist inside mama_vana_settings so getActiveVoiceTimings() can read it
        try {
            const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
            cfg.ageMode = this.ageMode;
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(cfg));
        } catch (e) { }
        this.applyAgeBadge();
    }

    isAdultMode() {
        return this.ageMode === '+18';
    }

    /** Show/hide the +18 oblique badge next to the game title in the menu */
    applyAgeBadge() {
        const badge = document.getElementById('menu-age-badge');
        if (badge) badge.style.display = this.isAdultMode() ? 'inline-flex' : 'none';
    }

    /** Head Equipment Falling Physics Toggle (Enabled by default) */
    isHeadGearFallingEnabled() {
        try {
            const val = localStorage.getItem('mama_vana_gear_falling_enabled');
            return val !== null ? (val === 'true') : true;
        } catch (e) {
            return true;
        }
    }

    setHeadGearFallingEnabled(enabled) {
        try {
            localStorage.setItem('mama_vana_gear_falling_enabled', enabled ? 'true' : 'false');
        } catch (e) { }
    }

    /** Has the first-launch age prompt already been shown? */
    wasAgePropromptShown() {
        try { return !!localStorage.getItem(STORAGE_KEY_AGE_PROMPT_SHOWN); } catch (e) { return false; }
    }

    markAgePromptShown() {
        try { localStorage.setItem(STORAGE_KEY_AGE_PROMPT_SHOWN, '1'); } catch (e) { }
    }

    getCoins() {
        return this.coins || 0;
    }

    getDiamonds() {
        return this.diamonds || 0;
    }

    // Dev Studio visibility helper
    isDevStudioVisible() {
        return DEV_STUDIO_VISIBLE.toLowerCase().trim() === 'show';
    }

    // Currency operations
    loadCoins() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_COINS);
            return saved !== null ? parseInt(saved, 10) : 100;
        } catch (e) { return 100; }
    }

    saveCoins(amount) {
        this.coins = Math.max(0, amount);
        try { localStorage.setItem(STORAGE_KEY_COINS, this.coins.toString()); } catch (e) { }
    }

    addCoins(amount) {
        this.saveCoins(this.coins + amount);
        this.notifyEconomyChange();
    }

    loadDiamonds() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_DIAMONDS);
            return saved !== null ? parseInt(saved, 10) : 10;
        } catch (e) { return 10; }
    }

    saveDiamonds(amount) {
        this.diamonds = Math.max(0, amount);
        try { localStorage.setItem(STORAGE_KEY_DIAMONDS, this.diamonds.toString()); } catch (e) { }
    }

    addDiamonds(amount) {
        this.saveDiamonds(this.diamonds + amount);
        this.notifyEconomyChange();
    }

    loadUnlockedItems() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
            return saved ? JSON.parse(saved) : ['bg_15.png'];
        } catch (e) { return ['bg_15.png']; }
    }

    saveUnlockedItems() {
        try { localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(this.unlockedItems)); } catch (e) { }
    }

    isUnlocked(categoryOrId, file = null) {
        if (file) return this.isItemUnlocked(categoryOrId, file);
        return this.unlockedItems.includes(categoryOrId);
    }

    loadBackground() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_BACKGROUND);
            return saved || '17.png';
        } catch (e) { return '17.png'; }
    }

    setBackground(bgFile) {
        this.activeBackground = bgFile;
        try { localStorage.setItem(STORAGE_KEY_BACKGROUND, bgFile); } catch (e) { }
        this.applyBackgroundToStage();
    }

    applyBackgroundToStage() {
        const stages = [document.getElementById('game-stage'), document.getElementById('screen-game')];
        stages.forEach(st => {
            if (st) {
                st.style.backgroundImage = `url('backgrounds/${encodeURI(this.activeBackground)}')`;
            }
        });
    }

    notifyEconomyChange() {
        document.querySelectorAll('.coins-counter-val').forEach(el => el.textContent = this.coins);
        document.querySelectorAll('.diamonds-counter-val').forEach(el => el.textContent = this.diamonds);
        const gameCoinsEl = document.getElementById('game-coins-count');
        if (gameCoinsEl) gameCoinsEl.textContent = this.coins;
        const gameDiamondsEl = document.getElementById('game-diamonds-count');
        if (gameDiamondsEl) gameDiamondsEl.textContent = this.diamonds;
        const customCoinsEl = document.getElementById('customizer-coins-count');
        if (customCoinsEl) customCoinsEl.textContent = this.coins;
        const customDiamondsEl = document.getElementById('customizer-diamonds-count');
        if (customDiamondsEl) customDiamondsEl.textContent = this.diamonds;
    }

    // Coordinates integration with window.coordinatesDB
    getPartTransform(category, itemFileName) {
        if (window.coordinatesDB) {
            return window.coordinatesDB.getPartTransform(category, itemFileName);
        }
        return { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 10, mirror: { enabled: false, distance: 0, rotateOpposite: false } };
    }

    setCategoryTransform(category, transform) {
        if (window.coordinatesDB) {
            window.coordinatesDB.setCategoryTransform(category, transform);
        }
    }

    setItemTransform(category, itemFileName, transform) {
        if (window.coordinatesDB) {
            window.coordinatesDB.setItemTransform(category, itemFileName, transform);
        }
    }

    applyTransformToAllInCategory(category, transform) {
        if (window.coordinatesDB) {
            window.coordinatesDB.applyTransformToAllInCategory(category, transform);
        }
    }

    getAttackConfig(attackId) {
        if (window.coordinatesDB) {
            return window.coordinatesDB.getAttackConfig(attackId);
        }
        return null;
    }

    setAttackConfig(attackId, config) {
        if (window.coordinatesDB) {
            window.coordinatesDB.setAttackConfig(attackId, config);
        }
    }

    getAttackFrameTransform(attackId, frameFile) {
        if (window.coordinatesDB) {
            return window.coordinatesDB.getAttackFrameTransform(attackId, frameFile);
        }
        return { x: 0, y: 0, scale: 1.2, scaleX: 1.0, scaleY: 1.0, rotation: 0 };
    }

    setAttackFrameTransform(attackId, frameFile, transform) {
        if (window.coordinatesDB) {
            window.coordinatesDB.setAttackFrameTransform(attackId, frameFile, transform);
        }
    }

    getShootingConfig(weaponId) {
        if (window.coordinatesDB) {
            return window.coordinatesDB.getShootingConfig(weaponId);
        }
        return null;
    }

    setShootingConfig(weaponId, config) {
        if (window.coordinatesDB) {
            window.coordinatesDB.setShootingConfig(weaponId, config);
        }
    }

    getAllShootingConfigs() {
        if (window.coordinatesDB) {
            return window.coordinatesDB.getAllShootingConfigs();
        }
        return {};
    }

    resetAll() {
        if (window.coordinatesDB) {
            window.coordinatesDB.resetAll();
        }
    }

    exportHardcodeCode() {
        if (window.coordinatesDB) {
            return window.coordinatesDB.exportCode();
        }
        return '';
    }
}

window.configManager = new ConfigManager();
