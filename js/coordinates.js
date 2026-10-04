/**
 * Mama Vana - Central Coordinates & Transforms Database
 * 
 * Contains calibrated coordinates, scales, rotations, z-indices, 
 * hitboxes, mirror configurations, Cute CUT multi-track layers, and sound talk timings.
 * 
 * Extensibility:
 * To add a new item, just add its filename (e.g. 'new_eye.png') under the corresponding
 * category in ITEM_COORDINATES below. It will automatically load and appear everywhere in the game!
 */

// =============================================================================
// 1. DEFAULT Z-INDEX ORDERING HIERARCHY
// Note: Ears are placed behind bodys and head_shapes (at the very back: zIndex 2).
// =============================================================================
const DEFAULT_Z_INDEX = {
    'ears': 2,               // Behind bodys and head shapes (very back)
    'bodys': 5,              // Body base
    'head_shapes': 10,       // Head shape
    'eyes': 15,              // Eyes
    'eyeborws': 20,          // Eyebrows
    'haires': 30,            // Hair
    'mouths': 35,            // Mouth
    'talking_mouth': 35,     // Animated talking mouth (under facials/beard)
    'facials': 40,           // Beard and moustache (above mouth)
    'noses': 45,             // Nose
    'body_enquipments': 50,  // Body gear (ties, chains, suits)
    'head_enquipments': 55   // Head gear (crowns, hats)
};

// =============================================================================
// 2. BASE CATEGORY DEFAULT COORDINATES & TEMPLATES
// =============================================================================
const BASE_CATEGORY_COORDINATES = {
    "bodys": {
        "x": 0,
        "y": 85,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 5,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "head_shapes": {
        "x": 0,
        "y": -65,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 10,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "eyes": {
        "x": 0,
        "y": -75,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 15,
        "mirror": {
            "enabled": false,
            "distance": 50,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": true
        }
    },
    "eyeborws": {
        "x": 0,
        "y": -105,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 20,
        "mirror": {
            "enabled": false,
            "distance": 50,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": true
        }
    },
    "ears": {
        "x": 0,
        "y": -65,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 2,
        "mirror": {
            "enabled": false,
            "distance": 160,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": true
        }
    },
    "haires": {
        "x": 0,
        "y": -145,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 30,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "mouths": {
        "x": 0,
        "y": -20,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 35,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "talking_mouth": {
        "x": 0,
        "y": -20,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 35,
        "frameSpeed": 110,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "facials": {
        "x": 0,
        "y": -25,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 40,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "noses": {
        "x": 0,
        "y": -50,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 45,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "body_enquipments": {
        "x": 0,
        "y": 65,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 50,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    },
    "head_enquipments": {
        "x": 0,
        "y": -150,
        "scale": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "zIndex": 55,
        "mirror": {
            "enabled": false,
            "distance": 0,
            "flipSides": false,
            "tilt": 0,
            "rotateOpposite": false
        }
    }
};

// =============================================================================
// 3. ITEM COORDINATES DATABASE (ALL SECTIONS & ITEMS)
// Every item has its own independent coordinates entry so modifying one item
// never affects any other item in the game!
// =============================================================================
const ITEM_COORDINATES = {
    "bodys": {
        "1.png": { "x": -273, "y": -186, "scale": 0.6, "scaleX": 1.1, "scaleY": 1.05, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "4.png": { "x": -556, "y": -530, "scale": 0.26, "scaleX": 1.2, "scaleY": 1.15, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "28.png": { "x": -184, "y": -77, "scale": 0.76, "scaleX": 1.2, "scaleY": 1.15, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "44.png": { "x": -253, "y": -170, "scale": 0.62, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "46.png": { "x": -252, "y": -145, "scale": 0.68, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "48.png": { "x": -310, "y": -111, "scale": 0.84, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "50.png": { "x": -234, "y": -92, "scale": 0.8, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "54.png": { "x": -277, "y": -184, "scale": 0.6, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "56.png": { "x": -277, "y": -184, "scale": 0.6, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "58.png": { "x": -207, "y": -94, "scale": 0.8, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "60.png": { "x": -298, "y": -166, "scale": 0.6, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "62.png": { "x": -251, "y": -134, "scale": 0.76, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "64.png": { "x": -281, "y": -172, "scale": 0.66, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "66.png": { "x": -297, "y": -148, "scale": 0.68, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "69.png": { "x": -292, "y": -160, "scale": 0.66, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "71.png": { "x": -226, "y": -108, "scale": 0.8, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "73.png": { "x": -253, "y": -111, "scale": 0.82, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "75.png": { "x": -278, "y": -151, "scale": 0.66, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "77.png": { "x": -254, "y": -71, "scale": 0.9, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "79.png": { "x": -282, "y": -150, "scale": 0.7, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "81.png": { "x": -274, "y": -129, "scale": 0.74, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "82.png": { "x": -247, "y": -107, "scale": 0.78, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "83.png": { "x": -251, "y": -111, "scale": 0.78, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "85.png": { "x": -289, "y": -153, "scale": 0.7, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "87.png": { "x": -173, "y": -78, "scale": 1.1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "2.png": { "x": -425, "y": -309, "scale": 0.46, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "3.png": { "x": -459, "y": -309, "scale": 0.42, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "5.png": { "x": -507, "y": -358, "scale": 0.381, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "6.png": { "x": -530, "y": -600, "scale": 0.42, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "7.png": { "x": -431, "y": -475, "scale": 0.515, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "8.png": { "x": -431, "y": -475, "scale": 0.515, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 5, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "head_shapes": {
        "1.png": { "x": -64, "y": -178, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "103.png": { "x": -74, "y": -182, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "107.png": { "x": -74, "y": -178, "scale": 1.02, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "108.png": { "x": -71, "y": -185, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "109.png": { "x": -71, "y": -173, "scale": 1.02, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "110.png": { "x": -64, "y": -178, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "111.png": { "x": -64, "y": -178, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "113.png": { "x": -67, "y": -182, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "114.png": { "x": -66, "y": -182, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "115.png": { "x": -77, "y": -159, "scale": 0.92, "scaleX": 1, "scaleY": 1.35, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "116.png": { "x": -151, "y": -308, "scale": 0.46, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "7.png": { "x": -73, "y": -176, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "2.png": { "x": -240, "y": -315, "scale": 0.28, "scaleX": 1, "scaleY": 1.25, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "3.png": { "x": -97, "y": -234, "scale": 0.67, "scaleX": 1.1, "scaleY": 1, "rotation": 0, "zIndex": 10, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "haires": {
        "222.png": { "x": -77, "y": -194, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "223.png": { "x": -93, "y": -216, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "224.png": { "x": -128, "y": -245, "scale": 0.94, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "225.png": { "x": -68, "y": -196, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "227.png": { "x": -71, "y": -191, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "228.png": { "x": -79, "y": -175, "scale": 0.96, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "229.png": { "x": -29, "y": -173, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "230.png": { "x": -72, "y": -184, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "231.png": { "x": -71, "y": -183, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "232.png": { "x": -45, "y": -186, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "233.png": { "x": -69, "y": -190, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "234.png": { "x": -83, "y": -212, "scale": 0.98, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "235.png": { "x": -153, "y": -188, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "236.png": { "x": -99, "y": -207, "scale": 0.74, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "237.png": { "x": -68, "y": -183, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "238.png": { "x": -68, "y": -183, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "239.png": { "x": -68, "y": -183, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "240.png": { "x": -68, "y": -183, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "241.png": { "x": -40, "y": -220, "scale": 1, "scaleX": 0.8, "scaleY": 2.15, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "242.png": { "x": -67, "y": -186, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "243.png": { "x": -72, "y": -186, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "244.png": { "x": -72, "y": -186, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "245.png": { "x": -87, "y": -207, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "246.png": { "x": -87, "y": -206, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "247.png": { "x": -170, "y": -226, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "248.png": { "x": -123, "y": -212, "scale": 0.68, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "9.png": { "x": -70, "y": -242, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "10.png": { "x": -148, "y": -258, "scale": 0.6, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "18.png": { "x": -162, "y": -270, "scale": 0.46, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "11.png": { "x": -725, "y": -713, "scale": 0.24, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "12.png": { "x": -342, "y": -475, "scale": 0.38, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "13.png": { "x": -239, "y": -383, "scale": 0.34, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "14.png": { "x": -253, "y": -422, "scale": 0.44, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "15.png": { "x": -353, "y": -703, "scale": 0.3, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "16.png": { "x": -393, "y": -411, "scale": 0.18, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "17.png": { "x": -302, "y": -430, "scale": 0.28, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "19.png": { "x": -154, "y": -249, "scale": 0.52, "scaleX": 1, "scaleY": 1.15, "rotation": 0, "zIndex": 30, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "eyeborws": {
        "1.png": { "x": -51, "y": -117, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 20, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "188.png": { "x": -51, "y": -117, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 20, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "191.png": { "x": -50, "y": -117, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": -3, "zIndex": 20, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "192.png": { "x": -44, "y": -114, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 20, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "193.png": { "x": -51, "y": -117, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 20, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "194.png": { "x": -67, "y": -120, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 20, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "195.png": { "x": -59, "y": -114, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 20, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } }
    },

    "eyes": {
        "1.png": { "x": -6, "y": -89, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 53, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "2.png": { "x": -6, "y": -90, "scale": 0.98, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 44, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "119.png": { "x": -61, "y": -138, "scale": 0.76, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "122.png": { "x": -44, "y": -127, "scale": 1.16, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": false, "distance": 52, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "123.png": { "x": -7, "y": -92, "scale": 1.38, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 59, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "125.png": { "x": -28, "y": -94, "scale": 1.54, "scaleX": 1, "scaleY": 1, "rotation": -3, "zIndex": 15, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "126.png": { "x": -7, "y": -92, "scale": 1.14, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "128.png": { "x": -39, "y": -93, "scale": 1.26, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "132.png": { "x": -7, "y": -91, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 50, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "137.png": { "x": -6, "y": -86, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 57, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "141.png": { "x": -6, "y": -114, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 86, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "142.png": { "x": -6, "y": -97, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 49, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "146.png": { "x": -5, "y": -92, "scale": 1.14, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 50, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "151.png": { "x": -5, "y": -97, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 54, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "158.png": { "x": -6, "y": -95, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 54, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "168.png": { "x": -6, "y": -94, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 50, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "172.png": { "x": -7, "y": -96, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": true, "distance": 58, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "176.png": { "x": -57, "y": -124, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "180.png": { "x": -24, "y": -119, "scale": 1.16, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } },
        "8.png": { "x": -54, "y": -130, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 15, "mirror": { "enabled": false, "distance": 50, "flipSides": false, "tilt": 0, "rotateOpposite": true } }
    },

    "noses": {
        "1.png": { "x": -37, "y": -88, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "2.png": { "x": -79, "y": -120, "scale": 0.38, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "3.png": { "x": -301, "y": -180, "scale": 0.44, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "10.png": { "x": -34, "y": -77, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "273.png": { "x": -22, "y": -69, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "276.png": { "x": -25, "y": -76, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "277.png": { "x": -23, "y": -83, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "279.png": { "x": -23, "y": -76, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "280.png": { "x": -32, "y": -71, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "281.png": { "x": -14, "y": -89, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "282.png": { "x": -22, "y": -76, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "283.png": { "x": -24, "y": -66, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 45, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "mouths": {
        "1.png": { "x": -40, "y": -28, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "11.png": { "x": -36, "y": -24, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "199.png": { "x": -42, "y": -28, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "202.png": { "x": -27, "y": -25, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "203.png": { "x": -27, "y": -26, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "205.png": { "x": -37, "y": -27, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "206.png": { "x": -28, "y": -27, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "207.png": { "x": -39, "y": -32, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "208.png": { "x": -43, "y": -27, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "209.png": { "x": -46, "y": -45, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "210.png": { "x": -19, "y": -23, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "211.png": { "x": -28, "y": -25, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "212.png": { "x": -24, "y": -27, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "213.png": { "x": -34, "y": -34, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 13, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "214.png": { "x": -13, "y": -32, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "215.png": { "x": -29, "y": -30, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "216.png": { "x": -36, "y": -37, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "ears": {
        "1.png": { "x": 0, "y": -90, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 149, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "2.png": { "x": 1, "y": -107, "scale": 0.38, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 160, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "100.png": { "x": 1, "y": -99, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 163, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "6.png": { "x": 1, "y": -97, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 186, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "96.png": { "x": 2, "y": -94, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 133, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "97.png": { "x": 1, "y": -101, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 150, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "98.png": { "x": 1, "y": -88, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 149, "flipSides": true, "tilt": 0, "rotateOpposite": true } },
        "99.png": { "x": 1, "y": -91, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 2, "mirror": { "enabled": true, "distance": 145, "flipSides": true, "tilt": 0, "rotateOpposite": true } }
    },

    "facials": {
        "1.png": { "x": -61, "y": -60, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "2.png": { "x": -143, "y": -182, "scale": 0.56, "scaleX": 1.1, "scaleY": 1, "rotation": 2, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "3.png": { "x": -202, "y": -151, "scale": 0.42, "scaleX": 1.1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "4.png": { "x": -191, "y": -173, "scale": 0.46, "scaleX": 1.1, "scaleY": 1, "rotation": -2, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "5.png": { "x": -147, "y": -141, "scale": 0.52, "scaleX": 1.1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "6.png": { "x": -172, "y": -115, "scale": 0.32, "scaleX": 1.1, "scaleY": 1, "rotation": -2, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "7.png": { "x": -153, "y": -148, "scale": 0.44, "scaleX": 1.1, "scaleY": 1, "rotation": -3, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "8.png": { "x": -258, "y": -160, "scale": 0.52, "scaleX": 1.1, "scaleY": 1, "rotation": -2, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "9.png": { "x": -160, "y": -136, "scale": 0.4, "scaleX": 1.1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "10.png": { "x": -170, "y": -134, "scale": 0.58, "scaleX": 1.1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "11.png": { "x": -164, "y": -139, "scale": 0.34, "scaleX": 1.1, "scaleY": 1, "rotation": -2, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "12.png": { "x": -207, "y": -140, "scale": 0.3, "scaleX": 1.1, "scaleY": 1.15, "rotation": -2, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "254.png": { "x": -36, "y": -37, "scale": 1.28, "scaleX": 1.2, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "255.png": { "x": -39, "y": -46, "scale": 1, "scaleX": 1.3, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "257.png": { "x": -51, "y": -37, "scale": 2.18, "scaleX": 1, "scaleY": 1, "rotation": -1, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "259.png": { "x": -63, "y": -62, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "261.png": { "x": -36, "y": -39, "scale": 1.48, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "263.png": { "x": -19, "y": -5, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "265.png": { "x": -27, "y": -7, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "267.png": { "x": -66, "y": -73, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "268.png": { "x": -149, "y": -176, "scale": 0.52, "scaleX": 1.1, "scaleY": 1, "rotation": 5, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "269.png": { "x": -65, "y": -79, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 40, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "head_enquipments": {
        "283.png": { "x": -28, "y": -74, "scale": 1.44, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "284.png": { "x": -72, "y": -105, "scale": 0.88, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "295.png": { "x": -74, "y": -205, "scale": 0.92, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "296.png": { "x": -151, "y": -241, "scale": 0.92, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "297.png": { "x": -151, "y": -241, "scale": 0.92, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "298.png": { "x": -132, "y": -248, "scale": 0.72, "scaleX": 1, "scaleY": 1, "rotation": -7, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "299.png": { "x": -105, "y": -230, "scale": 0.74, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "300.png": { "x": -98, "y": -264, "scale": 0.74, "scaleX": 1, "scaleY": 0.75, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "301.png": { "x": -371, "y": -308, "scale": 0.56, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "302.png": { "x": -252, "y": -393, "scale": 0.56, "scaleX": 1, "scaleY": 1, "rotation": 4, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "303.png": { "x": -384, "y": -413, "scale": 0.24, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "304.png": { "x": -97, "y": -229, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "305.png": { "x": -97, "y": -214, "scale": 0.7, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "306.png": { "x": -124, "y": -238, "scale": 0.82, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "307.png": { "x": -103, "y": -230, "scale": 0.72, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "308.png": { "x": -159, "y": -222, "scale": 0.5, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "309.png": { "x": -151, "y": -328, "scale": 0.48, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "2.png": { "x": -130, "y": -138, "scale": 0.48, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "3.png": { "x": -142, "y": -130, "scale": 0.46, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "4.png": { "x": -135, "y": -121, "scale": 0.52, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "5.png": { "x": -123, "y": -280, "scale": 0.66, "scaleX": 1, "scaleY": 0.95, "rotation": 0, "zIndex": 55, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "body_enquipments": {
        "39.png": { "x": -45, "y": 44, "scale": 1.12, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 50, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "41.png": { "x": -159, "y": 59, "scale": 1, "scaleX": 1, "scaleY": 1.75, "rotation": 0, "zIndex": 50, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "5.png": { "x": -489, "y": -364, "scale": 0.48, "scaleX": 1, "scaleY": 1, "rotation": -69, "zIndex": 1, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "6.png": { "x": -316, "y": -248, "scale": 1.06, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 1, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "7.png": { "x": 3, "y": 96, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 1, "mirror": { "enabled": true, "distance": 300, "flipSides": true, "tilt": 0, "rotateOpposite": false } },
        "8.png": { "x": -135, "y": -356, "scale": 0.5, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 50, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "9.gif": { "x": -155, "y": -544, "scale": 0.4, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 50, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "10.png": { "x": -257, "y": -174, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": -26, "zIndex": 1, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "11.png": { "x": 5, "y": -122, "scale": 1, "scaleX": 1, "scaleY": 1, "rotation": -37, "zIndex": 1, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "12.png": { "x": 2, "y": 94, "scale": 0.74, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 1, "mirror": { "enabled": true, "distance": 350, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "13.webp": { "x": -257, "y": -132, "scale": 1.82, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 1, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    },

    "talking_mouth": {
        "345.png": { "x": -27, "y": -38, "scale": 0.71, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "346.png": { "x": -27, "y": -31, "scale": 0.62, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "348.png": { "x": -28, "y": -29, "scale": 0.64, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } },
        "349.png": { "x": -29, "y": -31, "scale": 0.72, "scaleX": 1, "scaleY": 1, "rotation": 0, "zIndex": 35, "mirror": { "enabled": false, "distance": 0, "flipSides": false, "tilt": 0, "rotateOpposite": false } }
    }
};

// =============================================================================
// 4. SOUND & VOICE TALK DURATION TIMINGS (Voices & Audio Configs)
//
// AGE-RATED HATE VOICES — played when the character is ATTACKED
// There are TWO separate manifests based on the player's chosen content mode:
//
//   VOICE_TIMINGS_ALL_AGES  → safe for all players  → folder: hate_voices/all ages/
//   VOICE_TIMINGS_18_PLUS   → adult content only     → folder: hate_voices/+18/
//
// HOW TO ADD MORE VOICES:
//   1. Drop your .mp3 file into the correct subfolder.
//   2. Copy one of the blocks below and give it a unique "voice_XXX" key.
//   3. Set durationMs to the clip's length in milliseconds.
//   4. That's it — the game picks the right set automatically based on age mode.
// =============================================================================

// ── ALL AGES voices (safe for everyone) ────────────────────────────────────
const VOICE_TIMINGS_ALL_AGES = {
    "voice_10": { "name": "voice_10", "file": "assets/sounds/hate_voices/all ages/10.mp3", "durationMs": 3140, "talkSpeed": 110 },
    "voice_11": { "name": "voice_11", "file": "assets/sounds/hate_voices/all ages/11.mp3", "durationMs": 20200, "talkSpeed": 110 },
    "voice_18": { "name": "voice_18", "file": "assets/sounds/hate_voices/all ages/18.mp3", "durationMs": 4340, "talkSpeed": 110 },
    "voice_29": { "name": "voice_29", "file": "assets/sounds/hate_voices/all ages/29.mp3", "durationMs": 2220, "talkSpeed": 110 },
    "voice_355": { "name": "voice_355", "file": "assets/sounds/hate_voices/all ages/355.mp3", "durationMs": 1022, "talkSpeed": 250 }
};

// ── +18 voices (adult content — shown only when +18 mode is enabled) ────────
const VOICE_TIMINGS_18_PLUS = {
    "voice_8": { "name": "voice_8", "file": "assets/sounds/hate_voices/+18/8.mp3", "durationMs": 4181, "talkSpeed": 110 },
    "voice_17": { "name": "voice_17", "file": "assets/sounds/hate_voices/+18/17.mp3", "durationMs": 5200, "talkSpeed": 110 },
    "voice_19": { "name": "voice_19", "file": "assets/sounds/hate_voices/+18/19.mp3", "durationMs": 4340, "talkSpeed": 110 },
    "voice_20": { "name": "voice_20", "file": "assets/sounds/hate_voices/+18/20.mp3", "durationMs": 4330, "talkSpeed": 110 },
    "voice_21": { "name": "voice_21", "file": "assets/sounds/hate_voices/+18/21.mp3", "durationMs": 2220, "talkSpeed": 110 },
    "voice_27": { "name": "voice_27", "file": "assets/sounds/hate_voices/+18/27.mp3", "durationMs": 910, "talkSpeed": 110 },
    "voice_31": { "name": "voice_31", "file": "assets/sounds/hate_voices/+18/31.mp3", "durationMs": 13170, "talkSpeed": 110 },
    "voice_350": { "name": "voice_350", "file": "assets/sounds/hate_voices/+18/350.mp3", "durationMs": 9892, "talkSpeed": 105 },
    "voice_367": { "name": "voice_367", "file": "assets/sounds/hate_voices/+18/367.mp3", "durationMs": 3042, "talkSpeed": 120 },
    "voice_369": { "name": "voice_369", "file": "assets/sounds/hate_voices/+18/369.mp3", "durationMs": 6293, "talkSpeed": 85 }
};

// Helper: returns the correct voice set based on the saved age mode
function getActiveVoiceTimings() {
    let ageMode = 'all_ages';
    try {
        const cfg = JSON.parse(localStorage.getItem('mama_vana_settings') || '{}');
        ageMode = cfg.ageMode;
    } catch (e) { /* */ }
    return ageMode === '+18'
        ? { ...VOICE_TIMINGS_ALL_AGES, ...VOICE_TIMINGS_18_PLUS }
        : VOICE_TIMINGS_ALL_AGES;
}

const SOUND_TALK_TIMINGS = {
    // ─────────────────────────────────────────────────────────────────────────
    // HATE VOICES — merged from both age sets for the Dev Studio exporter.
    // The audio engine DOES NOT use this merged set directly; it always calls
    // getActiveVoiceTimings() so only the correct age-rated folder plays.
    // ─────────────────────────────────────────────────────────────────────────
    ...VOICE_TIMINGS_ALL_AGES,
    ...VOICE_TIMINGS_18_PLUS,

    // ─────────────────────────────────────────────────────────────────────────
    // NORMAL / IDLE VOICES → played randomly every 2-3 minutes
    // Key MUST start with "ambient_"   |   Folder: assets/sounds/normal_voices/
    // To add more: copy a block, give it a unique "ambient_XXX" key,
    // drop the .mp3 in normal_voices/, and set durationMs to the clip length.
    // ─────────────────────────────────────────────────────────────────────────
    "ambient_5": { "name": "ambient_5", "file": "assets/sounds/normal_voices/5.mp3", "durationMs": 9030, "talkSpeed": 110 },
    "ambient_6": { "name": "ambient_6", "file": "assets/sounds/normal_voices/6.mp3", "durationMs": 5720, "talkSpeed": 110 },
    "ambient_7": { "name": "ambient_7", "file": "assets/sounds/normal_voices/7.mp3", "durationMs": 3090, "talkSpeed": 110 },
    "ambient_9": { "name": "ambient_9", "file": "assets/sounds/normal_voices/9.mp3", "durationMs": 8670, "talkSpeed": 110 },
    "ambient_12": { "name": "ambient_12", "file": "assets/sounds/normal_voices/12.mp3", "durationMs": 10550, "talkSpeed": 110 },
    "ambient_13": { "name": "ambient_13", "file": "assets/sounds/normal_voices/13.mp3", "durationMs": 11400, "talkSpeed": 110 },
    "ambient_14": { "name": "ambient_14", "file": "assets/sounds/normal_voices/14.mp3", "durationMs": 12336, "talkSpeed": 110 },
    "ambient_15": { "name": "ambient_15", "file": "assets/sounds/normal_voices/15.mp3", "durationMs": 8480, "talkSpeed": 110 },
    "ambient_16": { "name": "ambient_16", "file": "assets/sounds/normal_voices/16.mp3", "durationMs": 8670, "talkSpeed": 110 },
    "ambient_23": { "name": "ambient_23", "file": "assets/sounds/normal_voices/23.mp3", "durationMs": 13880, "talkSpeed": 110 },
    "ambient_25": { "name": "ambient_25", "file": "assets/sounds/normal_voices/25.mp3", "durationMs": 19370, "talkSpeed": 110 },
    "ambient_26": { "name": "ambient_26", "file": "assets/sounds/normal_voices/26.mp3", "durationMs": 15908, "talkSpeed": 110 },
    "ambient_28": { "name": "ambient_28", "file": "assets/sounds/normal_voices/28.mp3", "durationMs": 4510, "talkSpeed": 110 },
    "ambient_30": { "name": "ambient_30", "file": "assets/sounds/normal_voices/30.mp3", "durationMs": 11500, "talkSpeed": 110 },
    "ambient_347": {
        "name": "ambient_347",
        "file": "assets/sounds/normal_voices/347.mp3",
        "durationMs": 3750,
        "talkSpeed": 110
    },
    "ambient_356": {
        "name": "ambient_356",
        "file": "assets/sounds/normal_voices/356.mp3",
        "durationMs": 2717,
        "talkSpeed": 135
    },
    "ambient_357": {
        "name": "ambient_357",
        "file": "assets/sounds/normal_voices/357.mp3",
        "durationMs": 8243,
        "talkSpeed": 145
    },
    "ambient_385": {
        "name": "ambient_385",
        "file": "assets/sounds/normal_voices/385.mp3",
        "durationMs": 3553,
        "talkSpeed": 90
    },
    "ambient_386": {
        "name": "ambient_386",
        "file": "assets/sounds/normal_voices/386.mp3",
        "durationMs": 13072,
        "talkSpeed": 115
    },
    "ambient_460": {
        "name": "ambient_460",
        "file": "assets/sounds/normal_voices/460.mp3",
        "durationMs": 10542,
        "talkSpeed": 110
    }
};

// =============================================================================
// 5. ATTACK PARTS, HITBOXES & CUTE CUT MULTI-TRACK TIMELINES
// =============================================================================
const ATTACK_PARTS_COORDINATES = {
    "slap": {
        "id": "slap",
        "name": "زللـەی کوردی (Slap Swipe)",
        "folder": "slap",
        "animMode": "cutecut_timeline",
        "frames": [
            "341.png",
            "342.png",
            "343.png"
        ],
        "frameSpeed": 90,
        "damage": 25,
        "sound": "slap_sound",
        "allowMirror": true,
        "offsetX": 10,
        "offsetY": -65,
        "scale": 1.2,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "hitbox": {
            "x": -80,
            "y": -160,
            "width": 160,
            "height": 180
        },
        "tracks": [
            {
                "id": "track_1788181215490",
                "name": "Layer 3 (341.png)",
                "frame": "341.png",
                "x": -74,
                "y": -117,
                "scale": 2.45,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 34,
                "opacity": 1,
                "zIndex": 60,
                "startTimeMs": 167,
                "durationMs": 188,
                "transition": {
                    "enabled": false,
                    "startX": 0,
                    "startY": 0,
                    "startScale": 1,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 0,
                    "startOpacity": 1,
                    "endX": 0,
                    "endY": 0,
                    "endScale": 1.2,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 0,
                    "endOpacity": 1,
                    "easing": "easeOutQuad"
                }
            },
            {
                "id": "track_1",
                "name": "دەستی سەرەکی (Main Hand)",
                "frame": "342.png",
                "x": -338,
                "y": 81,
                "scale": 2.4,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": -57,
                "opacity": 1,
                "zIndex": 61,
                "startTimeMs": 0,
                "durationMs": 259,
                "transition": {
                    "enabled": true,
                    "startX": -338,
                    "startY": 81,
                    "startScale": 2.4,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": -57,
                    "startOpacity": 1,
                    "endX": -150,
                    "endY": 38,
                    "endScale": 2.4,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": -19,
                    "endOpacity": 1,
                    "easing": "easeOutQuad",
                    "durationMs": 180
                }
            },
            {
                "id": "track_2",
                "name": "کاریگەری زللـە (Slap Spark)",
                "frame": "343.png",
                "x": -331,
                "y": 60,
                "scale": 1.88,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": -24,
                "opacity": 0.9,
                "zIndex": 62,
                "startTimeMs": 0,
                "durationMs": 294,
                "transition": {
                    "enabled": true,
                    "startX": -421,
                    "startY": 115,
                    "startScale": 1.88,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": -42,
                    "startOpacity": 0.9,
                    "endX": -331,
                    "endY": 60,
                    "endScale": 1.88,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": -24,
                    "endOpacity": 0.9,
                    "easing": "easeOutQuad"
                }
            }
        ],
        "frameOffsets": {
            "341.png": {
                "x": 35,
                "y": -65,
                "scale": 1.2,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "342.png": {
                "x": 5,
                "y": -65,
                "scale": 1.25,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": -5
            },
            "343.png": {
                "x": -25,
                "y": -60,
                "scale": 1.2,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": -10
            }
        }
    },
    "Karate": {
        "id": "Karate",
        "name": "کاراتێ و بۆکس (Karate Punch)",
        "folder": "Karate",
        "animMode": "cutecut_timeline",
        "frames": [
            "360.png",
            "362.png"
        ],
        "frameSpeed": 110,
        "damage": 35,
        "sound": "karate_sound",
        "allowMirror": true,
        "offsetX": 0,
        "offsetY": 10,
        "scale": 1.3,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "hitbox": {
            "x": -110,
            "y": -80,
            "width": 220,
            "height": 230
        },
        "tracks": [
            {
                "id": "track_1",
                "name": "دەستکێشی کاراتێ (Karate Fist)",
                "frame": "360.png",
                "x": -121,
                "y": 79,
                "scale": 1.9,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 6,
                "opacity": 1,
                "zIndex": 60,
                "startTimeMs": 0,
                "durationMs": 651,
                "transition": {
                    "enabled": true,
                    "startX": -271,
                    "startY": 129,
                    "startScale": 1.9,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": -33,
                    "startOpacity": 1,
                    "endX": -121,
                    "endY": 79,
                    "endScale": 1.9,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 6,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            },
            {
                "id": "track_2",
                "name": "لێدانی تەواوکەر (Impact Follow)",
                "frame": "362.png",
                "x": -218,
                "y": 64,
                "scale": 1.35,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": -9,
                "opacity": 1,
                "zIndex": 61,
                "startTimeMs": 249,
                "durationMs": 295,
                "transition": {
                    "enabled": true,
                    "startX": -329,
                    "startY": 125,
                    "startScale": 1.35,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": -34,
                    "startOpacity": 1,
                    "endX": -218,
                    "endY": 64,
                    "endScale": 1.35,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": -9,
                    "endOpacity": 1,
                    "easing": "linear"
                }
            }
        ],
        "frameOffsets": {
            "360.png": {
                "x": -30,
                "y": 10,
                "scale": 1.3,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "362.png": {
                "x": 25,
                "y": 15,
                "scale": 1.35,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 5
            }
        }
    },
    "choking": {
        "id": "choking",
        "name": "خنکاندن (Choking Composite)",
        "folder": "choking",
        "animMode": "cutecut_timeline",
        "frames": [
            "349.png",
            "353.png",
            "380.png"
        ],
        "frameSpeed": 120,
        "damage": 40,
        "sound": "choke_sound",
        "allowMirror": false,
        "offsetX": 0,
        "offsetY": -10,
        "scale": 1.25,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "hitbox": {
            "x": -70,
            "y": -50,
            "width": 140,
            "height": 120
        },
        "tracks": [
            {
                "id": "track_2",
                "name": "دەستی ڕاست (Right Hand)",
                "frame": "353.png",
                "x": -47,
                "y": 82,
                "scale": 2.34,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 7,
                "opacity": 1,
                "zIndex": 61,
                "startTimeMs": 0,
                "durationMs": 742,
                "transition": {
                    "enabled": true,
                    "startX": -47,
                    "startY": 82,
                    "startScale": 2.34,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 4,
                    "startOpacity": 1,
                    "endX": -47,
                    "endY": 82,
                    "endScale": 2.34,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 7,
                    "endOpacity": 1,
                    "easing": "bounce",
                    "durationMs": 580
                }
            },
            {
                "id": "track_3",
                "name": "گوشین و کاریگەری (Choke Grip Effect)",
                "frame": "380.png",
                "x": -5,
                "y": -95,
                "scale": 0.82,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 5,
                "opacity": 0.85,
                "zIndex": 62,
                "startTimeMs": 126,
                "durationMs": 733,
                "transition": {
                    "enabled": true,
                    "startX": -5,
                    "startY": -95,
                    "startScale": 0.77,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 5,
                    "startOpacity": 0.85,
                    "endX": -5,
                    "endY": -95,
                    "endScale": 0.82,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 5,
                    "endOpacity": 0.85,
                    "easing": "bounce"
                }
            }
        ],
        "frameOffsets": {
            "349.png": {
                "x": -25,
                "y": -15,
                "scale": 1.25,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": -5
            },
            "353.png": {
                "x": 25,
                "y": -10,
                "scale": 1.25,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 5
            },
            "380.png": {
                "x": 0,
                "y": -5,
                "scale": 1.3,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            }
        }
    },
    "eye_popping": {
        "id": "eye_popping",
        "name": "تۆقاندن و چاو (Eye Pop)",
        "folder": "eye_popping",
        "animMode": "cutecut_timeline",
        "frames": [
            "375.png",
            "376.png",
            "378.png",
            "380.png",
            "381.png",
            "382.png",
            "383.png",
            "384.png"
        ],
        "frameSpeed": 80,
        "damage": 50,
        "sound": "eyepop_sound",
        "allowMirror": false,
        "offsetX": 0,
        "offsetY": -75,
        "scale": 1.1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "hitbox": {
            "x": -75,
            "y": -125,
            "width": 150,
            "height": 100
        },
        "tracks": [
            {
                "id": "track_1788184936514",
                "name": "Layer 7 (383.png)",
                "frame": "383.png",
                "x": -8,
                "y": -45,
                "scale": 0.88,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 2,
                "opacity": 1,
                "zIndex": 60,
                "startTimeMs": 555,
                "durationMs": 405,
                "transition": {
                    "enabled": true,
                    "startX": -7,
                    "startY": -71,
                    "startScale": 0.69,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 2,
                    "startOpacity": 1,
                    "endX": -8,
                    "endY": -45,
                    "endScale": 0.88,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 2,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            },
            {
                "id": "track_1788184872613",
                "name": "Layer 1 (381.png)",
                "frame": "381.png",
                "x": -7,
                "y": -83,
                "scale": 1.04,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 2,
                "opacity": 1,
                "zIndex": 61,
                "startTimeMs": 555,
                "durationMs": 405,
                "transition": {
                    "enabled": true,
                    "startX": -7,
                    "startY": -83,
                    "startScale": 0.66,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 2,
                    "startOpacity": 1,
                    "endX": -7,
                    "endY": -83,
                    "endScale": 1.04,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 2,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            },
            {
                "id": "track_1788184728968",
                "name": "Layer 1 (382.png)",
                "frame": "382.png",
                "x": -4,
                "y": -97,
                "scale": 0.81,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 9,
                "opacity": 1,
                "zIndex": 62,
                "startTimeMs": 555,
                "durationMs": 445,
                "transition": {
                    "enabled": true,
                    "startX": -4,
                    "startY": -97,
                    "startScale": 0.66,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 9,
                    "startOpacity": 1,
                    "endX": -4,
                    "endY": -97,
                    "endScale": 0.81,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 9,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            },
            {
                "id": "track_1788184694319",
                "name": "Layer 1 (380.png)",
                "frame": "380.png",
                "x": -6,
                "y": -91,
                "scale": 0.76,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 6,
                "opacity": 1,
                "zIndex": 63,
                "startTimeMs": 421,
                "durationMs": 155,
                "transition": {
                    "enabled": true,
                    "startX": -6,
                    "startY": -91,
                    "startScale": 0.76,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 6,
                    "startOpacity": 1,
                    "endX": -6,
                    "endY": -91,
                    "endScale": 0.76,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 6,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            },
            {
                "id": "track_1788184646675",
                "name": "Layer 1 (378.png)",
                "frame": "378.png",
                "x": -7,
                "y": -92,
                "scale": 0.73,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 6,
                "opacity": 1,
                "zIndex": 64,
                "startTimeMs": 280,
                "durationMs": 155,
                "transition": {
                    "enabled": true,
                    "startX": -7,
                    "startY": -92,
                    "startScale": 0.73,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 6,
                    "startOpacity": 1,
                    "endX": -7,
                    "endY": -92,
                    "endScale": 0.73,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 6,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            },
            {
                "id": "track_1788184571365",
                "name": "Layer 2 (376.png)",
                "frame": "376.png",
                "x": -10,
                "y": -90,
                "scale": 0.71,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 6,
                "opacity": 1,
                "zIndex": 65,
                "startTimeMs": 140,
                "durationMs": 150,
                "transition": {
                    "enabled": true,
                    "startX": -10,
                    "startY": -90,
                    "startScale": 0.71,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 6,
                    "startOpacity": 1,
                    "endX": -10,
                    "endY": -90,
                    "endScale": 0.71,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 6,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            },
            {
                "id": "track_1788184477081",
                "name": "Layer 3 (375.png)",
                "frame": "375.png",
                "x": -170,
                "y": 175,
                "scale": 2.72,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": -28,
                "opacity": 1,
                "zIndex": 66,
                "startTimeMs": 0,
                "durationMs": 893,
                "transition": {
                    "enabled": true,
                    "startX": -170,
                    "startY": 175,
                    "startScale": 2.72,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": -28,
                    "startOpacity": 1,
                    "endX": -146,
                    "endY": 62,
                    "endScale": 2.72,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": -9,
                    "endOpacity": 1,
                    "easing": "bounce"
                }
            }
        ],
        "frameOffsets": {
            "375.png": {
                "x": 0,
                "y": -75,
                "scale": 1.1,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "376.png": {
                "x": 0,
                "y": -75,
                "scale": 1.1,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "378.png": {
                "x": 0,
                "y": -75,
                "scale": 1.1,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "380.png": {
                "x": 0,
                "y": -75,
                "scale": 1.15,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "381.png": {
                "x": 0,
                "y": -75,
                "scale": 1.2,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "382.png": {
                "x": 0,
                "y": -75,
                "scale": 1.15,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "383.png": {
                "x": 0,
                "y": -75,
                "scale": 1.1,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            },
            "384.png": {
                "x": 0,
                "y": -75,
                "scale": 1,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0
            }
        }
    },
    "talking_mouth": {
        "id": "talking_mouth",
        "name": "دەمی قسەکەر (Talking Mouth Animation)",
        "folder": "talking_mouth",
        "animMode": "cutecut_timeline",
        "frames": [
            "345.png",
            "346.png",
            "348.png",
            "349.png"
        ],
        "frameSpeed": 110,
        "damage": 0,
        "sound": "ambient_voice",
        "hitbox": {
            "x": -50,
            "y": -40,
            "width": 100,
            "height": 60
        },
        "allowMirror": true,
        "tracks": [
            {
                "id": "track_1",
                "name": "فڕەیمی دەم 1 (345.png)",
                "frame": "345.png",
                "x": -1,
                "y": -20,
                "scale": 0.71,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0,
                "opacity": 1,
                "zIndex": 35,
                "startTimeMs": 0,
                "durationMs": 110,
                "transition": {
                    "enabled": false,
                    "startX": -1,
                    "startY": -20,
                    "startScale": 0.71,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 0,
                    "startOpacity": 1,
                    "endX": -1,
                    "endY": -20,
                    "endScale": 0.71,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 0,
                    "endOpacity": 1,
                    "easing": "linear"
                }
            },
            {
                "id": "track_2",
                "name": "فڕەیمی دەم 2 (346.png)",
                "frame": "346.png",
                "x": 4,
                "y": -16,
                "scale": 0.62,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0,
                "opacity": 1,
                "zIndex": 35,
                "startTimeMs": 110,
                "durationMs": 110,
                "transition": {
                    "enabled": false,
                    "startX": 4,
                    "startY": -16,
                    "startScale": 0.62,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 0,
                    "startOpacity": 1,
                    "endX": 4,
                    "endY": -16,
                    "endScale": 0.62,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 0,
                    "endOpacity": 1,
                    "easing": "linear"
                }
            },
            {
                "id": "track_3",
                "name": "فڕەیمی دەم 3 (348.png)",
                "frame": "348.png",
                "x": 0,
                "y": -18,
                "scale": 0.64,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0,
                "opacity": 1,
                "zIndex": 35,
                "startTimeMs": 220,
                "durationMs": 110,
                "transition": {
                    "enabled": false,
                    "startX": 0,
                    "startY": -18,
                    "startScale": 0.64,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 0,
                    "startOpacity": 1,
                    "endX": 0,
                    "endY": -18,
                    "endScale": 0.64,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 0,
                    "endOpacity": 1,
                    "easing": "linear"
                }
            },
            {
                "id": "track_4",
                "name": "فڕەیمی دەم 4 (349.png)",
                "frame": "349.png",
                "x": 0,
                "y": -18,
                "scale": 0.72,
                "scaleX": 1,
                "scaleY": 1,
                "rotation": 0,
                "opacity": 1,
                "zIndex": 35,
                "startTimeMs": 330,
                "durationMs": 110,
                "transition": {
                    "enabled": false,
                    "startX": 0,
                    "startY": -18,
                    "startScale": 0.72,
                    "startScaleX": 1,
                    "startScaleY": 1,
                    "startRot": 0,
                    "startOpacity": 1,
                    "endX": 0,
                    "endY": -18,
                    "endScale": 0.72,
                    "endScaleX": 1,
                    "endScaleY": 1,
                    "endRot": 0,
                    "endOpacity": 1,
                    "easing": "linear"
                }
            }
        ]
    }
};

// =============================================================================
// 6. FIREARMS / SHOOTING WEAPONS CONFIGURATIONS & COORDINATES
// =============================================================================
const SHOOTING_WEAPONS_COORDINATES = {
    "akm": {
        "id": "akm",
        "name": "کڵاشینکۆف (AKM)",
        "category": "shooting",
        "folder": "attaker/shooting/akm",
        "frames": [
            "frame1.png",
            "frame2.png",
            "frame3.png"
        ],
        "bullet": "bullet.png",
        "sound": "attaker/shooting/akm/akm_single_fire.mp3",
        "damage": 35,
        "scale": 1.5,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "muzzleOffset": {
            "x": 143,
            "y": -20
        },
        "bulletSpeed": 2200,
        "bulletScale": 0.5,
        "frameSpeed": 85,
        "recoilKick": 15,
        "bloodScale": 0.50,
        "bloodDuration": 2200,
        "selectedFireMode": "rapid",
        "frameOffsets": {
            "frame1.png": {
                "x": 0,
                "y": 0,
                "scale": 1.0,
                "scaleX": 1.0,
                "scaleY": 1.0,
                "rotation": 0
            },
            "frame2.png": {
                "x": 41,
                "y": -7,
                "scale": 1.0,
                "scaleX": 1.0,
                "scaleY": 1.0,
                "rotation": 0
            },
            "frame3.png": {
                "x": -1,
                "y": -1,
                "scale": 1.0,
                "scaleX": 1.0,
                "scaleY": 1.0,
                "rotation": 0
            },
            "bullet.png": {
                "x": 0,
                "y": 0,
                "scale": 0.5,
                "scaleX": 1.0,
                "scaleY": 1.0,
                "rotation": 0
            }
        },
        "fireModes": {
            "single": { "enabled": true },
            "burst": { "enabled": true, "count": 3, "intervalMs": 100 },
            "rapid": { "enabled": true, "intervalMs": 135 }
        },
        "bloodZone": {
            "centerY": 240,
            "spreadY": 150,
            "spreadX": 110
        }
    },
    "m4": {
        "id": "m4",
        "name": "ئێم فۆڕ (M4A1)",
        "category": "shooting",
        "folder": "attaker/shooting/m4",
        "iconFile": "m4.png",
        "frames": [
            "frame1.png",
            "frame2.png",
            "frame3.png"
        ],
        "bullet": "bullet.png",
        "sound": "attaker/shooting/m4/m4_single_fire.mp3",
        "damage": 30,
        "scale": 2.0,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "muzzleOffset": { "x": 142, "y": -19 },
        "frameOffsets": {
            "frame1.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame2.png": { "x": 35, "y": -4, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame3.png": { "x": 4, "y": -1, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "bullet.png": { "x": 0, "y": 0, "scale": 0.5, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 }
        },
        "fireModes": {
            "single": { "enabled": true },
            "burst": { "enabled": true, "count": 3, "intervalMs": 75 },
            "rapid": { "enabled": true, "intervalMs": 95 }
        },
        "selectedFireMode": "rapid",
        "bulletSpeed": 2400,
        "bulletScale": 0.5,
        "frameSpeed": 55,
        "recoilKick": 12,
        "bloodScale": 0.35,
        "bloodDuration": 2200,
        "bloodZone": {
            "centerY": 240,
            "spreadY": 150,
            "spreadX": 110
        }
    },
    "kar98k": {
        "id": "kar98k",
        "name": "کارنۆڤێنت (Kar98k)",
        "category": "shooting",
        "folder": "attaker/shooting/kar98k",
        "iconFile": "kar98k.png",
        "frames": [
            "frame1.png",
            "frame2.png",
            "frame3.png"
        ],
        "bullet": "bullet.png",
        "sound": "attaker/shooting/kar98k/kar98k.mp3",
        "damage": 55,
        "scale": 1.0,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "muzzleOffset": { "x": 195, "y": -12 },
        "frameOffsets": {
            "frame1.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame2.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame3.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "bullet.png": { "x": 0, "y": 0, "scale": 0.45, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 }
        },
        "fireModes": {
            "single": { "enabled": true },
            "burst": { "enabled": false, "count": 3, "intervalMs": 150 },
            "rapid": { "enabled": false, "intervalMs": 250 }
        },
        "selectedFireMode": "single",
        "bulletSpeed": 2800,
        "bulletScale": 0.45,
        "frameSpeed": 95,
        "recoilKick": 24,
        "bloodScale": 0.45,
        "bloodDuration": 2500,
        "bloodZone": {
            "centerY": 240,
            "spreadY": 150,
            "spreadX": 110
        }
    },
    "pistol": {
        "id": "pistol",
        "name": "دەمانچە (Pistol)",
        "category": "shooting",
        "folder": "attaker/shooting/pistol",
        "iconFile": "pistol.png",
        "frames": [
            "frame1.png",
            "frame2.png",
            "frame3.png"
        ],
        "bullet": "bullet.png",
        "sound": "attaker/shooting/pistol/pistol.mp3",
        "damage": 25,
        "scale": 1.4,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "muzzleOffset": { "x": 75, "y": -16 },
        "frameOffsets": {
            "frame1.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame2.png": { "x": 30, "y": -4, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame3.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "bullet.png": { "x": 0, "y": 0, "scale": 0.5, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 }
        },
        "fireModes": {
            "single": { "enabled": true },
            "burst": { "enabled": false, "count": 3, "intervalMs": 90 },
            "rapid": { "enabled": false, "intervalMs": 130 }
        },
        "selectedFireMode": "single",
        "bulletSpeed": 2100,
        "bulletScale": 0.5,
        "frameSpeed": 60,
        "recoilKick": 10,
        "bloodScale": 0.30,
        "bloodDuration": 2000,
        "bloodZone": {
            "centerY": 240,
            "spreadY": 150,
            "spreadX": 110
        }
    },
    "shotgun": {
        "id": "shotgun",
        "name": "تاپڕ (Shotgun)",
        "category": "shooting",
        "folder": "attaker/shooting/shotgun",
        "iconFile": "shotgun.png",
        "frames": [
            "frame1.png",
            "frame2.png",
            "frame3.png"
        ],
        "bullet": "bullet.png",
        "sound": "attaker/shooting/shotgun/shotgun.mp3",
        "damage": 60,
        "scale": 1.0,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "muzzleOffset": { "x": 190, "y": -14 },
        "frameOffsets": {
            "frame1.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame2.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "frame3.png": { "x": 0, "y": 0, "scale": 1.0, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 },
            "bullet.png": { "x": 0, "y": 0, "scale": 0.55, "scaleX": 1.0, "scaleY": 1.0, "rotation": 0 }
        },
        "fireModes": {
            "single": { "enabled": true },
            "burst": { "enabled": false, "count": 3, "intervalMs": 120 },
            "rapid": { "enabled": false, "intervalMs": 180 }
        },
        "selectedFireMode": "single",
        "bulletSpeed": 2300,
        "bulletScale": 0.55,
        "frameSpeed": 80,
        "recoilKick": 28,
        "bloodScale": 0.55,
        "bloodDuration": 2400,
        "bloodZone": {
            "centerY": 240,
            "spreadY": 160,
            "spreadX": 120
        }
    },
    "flamethrower": {
        "id": "flamethrower",
        "name": "فلامێن تۆڕ (Flamethrower)",
        "category": "shooting",
        "folder": "attaker/shooting/flamethrower",
        "frames": ["frame1.png", "frame2.png"],
        "bullet": "fireball1.png",
        "projectileFrames": ["fireball1.png", "fireball2.png"],
        "flameFrames": ["flame1.png", "flame2.png", "flame3.png"],
        "sound": "attaker/shooting/flamethrower/fireball.mp3",
        "flameSound": "attaker/shooting/flamethrower/flame.mp3",
        "burningSound": "attaker/shooting/flamethrower/burning.mp3",
        "screamSound": "attaker/shooting/flamethrower/screem.mp3",
        "damage": 22,
        "scale": 1.15,
        "muzzleOffset": { "x": 555, "y": -18 },
        "bulletSpeed": 900,
        "bulletScale": 0.42,
        "frameSpeed": 70,
        "recoilKick": 8,
        "selectedFireMode": "single",
        "fireModes": {
            "single": { "enabled": true },
            "auto": { "enabled": true, "intervalMs": 115 }
        },
        "bloodZone": { "centerY": 220, "spreadY": 170, "spreadX": 120 },
        "flamethrower": true
    },
    "paintball": {
        "id": "paintball",
        "name": "پەینتباڵ (Paintball)",
        "category": "shooting",
        "folder": "attaker/shooting/paintball",
        "frames": ["frame1.png"],
        "bullet": "redball.png",
        "projectileFiles": ["redball.png", "blueball.png", "greenball.png", "purpleball.png", "yellowball.png"],
        "splashFiles": { "redball.png": "redsplash.png", "blueball.png": "bluesplash.png", "greenball.png": "greensplash.png", "purpleball.png": "purplesplash.png", "yellowball.png": "yellowsplash.png" },
        "sound": "attaker/shooting/paintball/fire.mp3",
        "hitSound": "attaker/shooting/paintball/hitsplash.mp3",
        "damage": 12,
        "scale": 1.45,
        "muzzleOffset": { "x": 130, "y": -8 },
        "bulletSpeed": 1100,
        "bulletScale": 0.72,
        "frameSpeed": 60,
        "recoilKick": 6,
        "selectedFireMode": "single",
        "fireModes": {
            "single": { "enabled": true },
            "burst": { "enabled": true, "count": 3, "intervalMs": 180 },
            "rapid": { "enabled": true, "intervalMs": 230 }
        },
        "bloodZone": { "centerY": 220, "spreadY": 170, "spreadX": 120 },
        "paintball": true
    }
};

// =============================================================================
// 7. SWORDS & BLADES WEAPONS CONFIGURATIONS & COORDINATES
// =============================================================================
const SWORDS_WEAPONS_COORDINATES = {
    "katana": {
        "id": "katana",
        "name": "شمشێری کاتانا (Katana)",
        "category": "swords",
        "folder": "attaker/swords/katana",
        "iconFile": "katana.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/katana/katana.mp3",
        "damage": 45,
        "scale": 0.70,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 220,
        "hitPush": 40,
        "bloodScale": 0.45,
        "bloodDuration": 2400
    },
    "knight": {
        "id": "knight",
        "name": "شمشێری سوارچاک (Knight Sword)",
        "category": "swords",
        "folder": "attaker/swords/knight",
        "iconFile": "knight.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/knight/knight.mp3",
        "damage": 50,
        "scale": 0.45,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 230,
        "hitPush": 45,
        "bloodScale": 0.50,
        "bloodDuration": 2400
    },
    "minecraft": {
        "id": "minecraft",
        "name": "شمشێری ماینکرافت (Minecraft Sword)",
        "category": "swords",
        "folder": "attaker/swords/minecraft",
        "iconFile": "minecraft.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/minecraft/minecraft.mp3",
        "damage": 40,
        "scale": 0.35,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 210,
        "hitPush": 38,
        "bloodScale": 0.40,
        "bloodDuration": 2400
    },
    "axe": {
        "id": "axe",
        "name": "تەور (Axe)",
        "category": "swords",
        "folder": "attaker/swords/axe",
        "iconFile": "axe.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/axe/axe.mp3",
        "damage": 50,
        "scale": 0.58,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 220,
        "hitPush": 45,
        "bloodScale": 0.50,
        "bloodDuration": 2400
    },
    "blades_of_chaos": {
        "id": "blades_of_chaos",
        "name": "شمشێری کەیۆس (Blades of Chaos)",
        "category": "swords",
        "folder": "attaker/swords/Blade of Chaos",
        "iconFile": "Blade of Chaos.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/Blade of Chaos/Blade of Chaos.mp3",
        "damage": 65,
        "scale": 0.58,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 230,
        "hitPush": 55,
        "bloodScale": 0.55,
        "bloodDuration": 2500
    },

    "club": {
        "id": "club",
        "name": "دار دەست (Club)",
        "category": "swords",
        "folder": "attaker/swords/club",
        "iconFile": "club.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/club/club.mp3",
        "damage": 45,
        "scale": 0.68,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 210,
        "hitPush": 45,
        "bloodScale": 0.45,
        "bloodDuration": 2400
    },
    "floor_mop": {
        "id": "floor_mop",
        "name": "مەسیحی زەوی (Floor Mop)",
        "category": "swords",
        "folder": "attaker/swords/floor mop",
        "iconFile": "floor mop.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/floor mop/floor mop.mp3",
        "extraSound": "attaker/swords/floor mop/extra sound.mp3",
        "damage": 35,
        "scale": 0.62,
        "scaleX": 1.0,
        "scaleY": 1.5,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 230,
        "hitPush": 40,
        "bloodScale": 0.40,
        "bloodDuration": 2400
    },

    "karambit": {
        "id": "karambit",
        "name": "چەقۆی کارامبیت (Karambit)",
        "category": "swords",
        "folder": "attaker/swords/karambit",
        "iconFile": "karambit.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/karambit/karambit.mp3",
        "damage": 40,
        "scale": 0.42,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 180,
        "hitPush": 35,
        "bloodScale": 0.40,
        "bloodDuration": 2200
    },
    "pubg_pan": {
        "id": "pubg_pan",
        "name": "تاوەی پۆبجی (PUBG Pan)",
        "category": "swords",
        "folder": "attaker/swords/pubg pan",
        "iconFile": "pubg pan.png",
        "frame": "frame1.png",
        "sound": "attaker/swords/pubg pan/pubg pan.mp3",
        "damage": 55,
        "scale": 0.82,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": -25,
        "offsetX": 0,
        "offsetY": -60,
        "slashReach": 200,
        "hitPush": 50,
        "bloodScale": 0.45,
        "bloodDuration": 2400
    },
    "cucumber": {
        "id": "cucumber",
        "name": "خیار (Cucumber)",
        "category": "swords",
        "folder": "attaker/swords/cucumber",
        "iconFile": "cucumber.png",
        "frame": "frame1.png",
        "bottomFile": "bottom part.png",
        "upperFile": "upper half.png",
        "sound": "attaker/swords/cucumber/cucumber.mp3",
        "splitSound": "attaker/swords/cucumber/split.mp3",
        "damage": 38,
        "scale": 0.55,
        "rotation": -25,
        "slashReach": 190,
        "hitPush": 38,
        "bloodScale": 0.42,
        "bloodDuration": 2200,
        "splitChance": 0.05
    },
    "pubg pan": "pubg_pan",
    "floor mop": "floor_mop",
    "Blade of Chaos": "blades_of_chaos"
};

// =============================================================================
// 8. SPECIAL WEAPONS CONFIGURATIONS & COORDINATES
// =============================================================================
const SPECIAL_WEAPONS_COORDINATES = {
    "shuriken": {
        "id": "shuriken",
        "name": "شووریکەن (Shuriken)",
        "category": "special",
        "folder": "attaker/special/shuriken",
        "iconFile": "shuriken.png",
        "frame": "frame1.png",
        "sound": "attaker/special/shuriken/shuriken.mp3",
        "damage": 30,
        "scale": 1.0,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "orbitRadius": 75,
        "spinSpeed": 720,
        "flySpeed": 3200,
        "stickDuration": 4500,
        "bloodScale": 0.35,
        "bloodDuration": 2200
    },
    "pencil": {
        "id": "pencil",
        "name": "پێنووس (Pencil)",
        "category": "special",
        "folder": "attaker/special/pencil",
        "iconFile": "pencil.png",
        "projectileFiles": ["pencil1.png", "pencil2.png", "pencil3.png", "pencil4.png", "pencil5.png"],
        "throwSound": "attaker/special/pencil/throw.mp3",
        "damage": 24,
        "scale": 1.0,
        "flySpeed": 2400,
        "stickDuration": 5500,
        "bloodScale": 0.4,
        "bloodDuration": 2200
    },
    "scorpion": {
        "id": "scorpion",
        "name": "دەستی سکۆرپیۆن (Scorpion)",
        "category": "special",
        "folder": "attaker/special/scorpion",
        "iconFile": "scorpion.png",
        "handImage": "hand.png",
        "headImage": "head.png",
        "chainImage": "chain.png",
        "chainSound": "attaker/special/scorpion/chain.mp3",
        "voiceSound": "attaker/special/scorpion/get over her.mp3",
        "damage": 65,
        "scale": 1.0,
        "handScale": 0.32,
        "headScale": 0.18,
        "chainHeight": 18,
        "throwSpeed": 1400,
        "pullDelayMs": 700,
        "pullDurationMs": 450,
        "bloodScale": 0.50,
        "bloodDuration": 2500
    },
    "spiders": {
        "id": "spiders",
        "name": "جاڵجاڵۆکەکان (Spiders)",
        "category": "special",
        "folder": "attaker/special/spiders",
        "iconFile": "spiders.png",
        "frame": "frame1.gif",
        "biteSound": "attaker/special/spiders/spider bite.mp3",
        "walkSound": "attaker/special/spiders/spider walk.mp3",
        "blood": "attaker/special/spiders/blood.png",
        "damage": 10,
        "scale": 0.22,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "biteIntervalMs": 500,
        "maxBites": 10,
        "bloodScale": 0.35,
        "bloodDuration": 2000
    },
    "minecraft_blocks": {
        "id": "minecraft_blocks",
        "name": "بلۆکەکانی ماینکرافت (Minecraft)",
        "category": "special",
        "folder": "attaker/special/minecrat",
        "iconFile": "minecraft.png",
        "throwSound": "attaker/special/minecrat/throw.mp3",
        "hitSound": "attaker/special/minecrat/hit.mp3",
        "sheepSound": "attaker/special/minecrat/sheep.mp3",
        "lifetimeMs": 15000
    },
    "flip_flop": {
        "id": "flip_flop",
        "name": "فلیپ فلاپ (Flip Flop)",
        "category": "special",
        "folder": "attaker/special/flip flop",
        "iconFile": "flip flop.png",
        "throwSound": "attaker/special/flip flop/throw.mp3",
        "hitSound": "attaker/special/flip flop/hit.mp3",
        "klashSound": "attaker/special/flip flop/klash.mp3",
        "projectileFolder": "attaker/special/flip flop",
        "projectileSubfolder": "shoes",
        "projectileFiles": ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png"],
        "klashFile": "klash.png",
        "klashChance": 0.05,
        "lifetimeMs": 15000,
        "actorSize": 78,
        "collisionSize": 4,
        "actorCollisionSize": 4,
        "postHitGravity": 1200,
        "groundOffset": 16,
        "damage": 14
    },
    "watermelon": {
        "id": "watermelon",
        "name": "شوتی (Watermelon)",
        "category": "special",
        "folder": "attaker/special/watermelon",
        "frame1": "frame1.png",
        "hitFrames": ["hit frame1.png", "hit frame2.png"],
        "parts": ["parts1.png", "parts2.png", "parts3.png", "parts4.png"],
        "throwSound": "attaker/special/watermelon/throw.mp3",
        "hitSound": "attaker/special/watermelon/hit.mp3",
        "rareSound": "attaker/special/watermelon/sound.mp3",
        "damage": 28,
        "lifetimeMs": 10000,
        "actorSize": 80,
        "collisionSize": 12,
        "actorCollisionSize": 24,
        "postHitGravity": 1100,
        "watermelon": true
    },
    "drone": {
        "id": "drone",
        "name": "درۆن (Drone)",
        "category": "special",
        "folder": "attaker/special/drone",
        "frame": "frame1.png",
        "shootFrames": ["fireframe1.png", "fireframe2.png"],
        "bullet": "bullet.png",
        "explosionFrames": ["explosion1.png", "explosion2.png", "explosion3.png", "explosion4.png"],
        "flySound": "attaker/special/drone/drone.mp3",
        "fireSound": "attaker/special/drone/bulletfire.mp3",
        "suicideSound": "attaker/special/drone/sound.mp3",
        "damage": 18,
        "maxShots": 10,
        "drone": true
    },
    "coca_cola": {
        "id": "coca_cola",
        "name": "Coca Cola",
        "category": "special",
        "folder": "attaker/special/coca cola",
        "iconFile": "coca cola.png",
        "frame1": "frame1.png",
        "frame2": "frame2.png",
        "capFile": "cap.png",
        "hitSound": "attaker/special/coca cola/hit.mp3",
        "capHitSound": "attaker/special/coca cola/cap hit.mp3",
        "holdSound": "attaker/special/coca cola/sound.mp3",
        "crashSound": "attaker/special/coca cola/crash.mp3",
        "crashImage": "attaker/special/coca cola/crash.png",
        "damage": 16,
        "actorSize": 58,
        "collisionSize": 4,
        "actorCollisionSize": 4,
        "postHitGravity": 1050,
        "lifetimeMs": 15000
    },
    "elder_wand": {
        "id": "elder_wand",
        "name": "گۆچانی سحری (Elder Wand)",
        "category": "special",
        "folder": "attaker/special/elder wand",
        "iconFile": "elder wand.png",
        "frame": "frame1.png",
        "damage": 70,
        "scale": 0.55,
        "scaleX": 1.0,
        "scaleY": 1.0,
        "rotation": 0,
        "bloodScale": 0.45,
        "bloodDuration": 2400
    },
    "elder wand": "elder_wand"
};

// =============================================================================
// 7. COORDINATES DATABASE HELPER CLASS
// =============================================================================
class CoordinatesDB {
    constructor() {
        this.baseCategory = JSON.parse(JSON.stringify(BASE_CATEGORY_COORDINATES));
        this.items = JSON.parse(JSON.stringify(ITEM_COORDINATES));
        this.attacks = JSON.parse(JSON.stringify(ATTACK_PARTS_COORDINATES));
        this.soundTimings = JSON.parse(JSON.stringify(SOUND_TALK_TIMINGS));
        this.shooting = JSON.parse(JSON.stringify(SHOOTING_WEAPONS_COORDINATES));
        this.swords = JSON.parse(JSON.stringify(SWORDS_WEAPONS_COORDINATES));
        this.special = JSON.parse(JSON.stringify(SPECIAL_WEAPONS_COORDINATES));
        this.defaultZIndex = { ...DEFAULT_Z_INDEX };

        // coordinates.js is the absolute source of truth!
        // Clear any old cached localStorage coordinates so code edits always take immediate effect.
        try {
            localStorage.removeItem('mama_vana_shooting_coords');
            localStorage.removeItem('mama_vana_shooting_version');
        } catch (e) { }
    }

    /**
     * Gets the precise transform for a specific item in a category.
     * If the item is not explicitly listed, creates and returns its default based on baseCategory.
     */
    getPartTransform(category, itemFileName) {
        const base = this.baseCategory[category] || {
            x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0,
            zIndex: this.defaultZIndex[category] !== undefined ? this.defaultZIndex[category] : 10,
            mirror: { enabled: false, distance: 0, flipSides: false, tilt: 0, rotateOpposite: false }
        };

        if (this.items[category] && this.items[category][itemFileName]) {
            const item = this.items[category][itemFileName];
            const defZ = (category === 'ears') ? 2 : (this.defaultZIndex[category] || 10);
            return {
                x: item.x !== undefined ? item.x : base.x,
                y: item.y !== undefined ? item.y : base.y,
                scale: item.scale !== undefined ? item.scale : (base.scale || 1.0),
                scaleX: item.scaleX !== undefined ? item.scaleX : (base.scaleX !== undefined ? base.scaleX : 1.0),
                scaleY: item.scaleY !== undefined ? item.scaleY : (base.scaleY !== undefined ? base.scaleY : 1.0),
                rotation: item.rotation !== undefined ? item.rotation : (base.rotation || 0),
                zIndex: item.zIndex !== undefined ? item.zIndex : (base.zIndex || defZ),
                mirror: {
                    enabled: (item.mirror && item.mirror.enabled !== undefined) ? item.mirror.enabled : ((base.mirror && base.mirror.enabled) || false),
                    distance: (item.mirror && item.mirror.distance !== undefined) ? item.mirror.distance : ((base.mirror && base.mirror.distance) || 0),
                    flipSides: (item.mirror && item.mirror.flipSides !== undefined) ? item.mirror.flipSides : ((base.mirror && base.mirror.flipSides) || false),
                    tilt: (item.mirror && item.mirror.tilt !== undefined) ? item.mirror.tilt : ((base.mirror && base.mirror.tilt) || 0),
                    rotateOpposite: (item.mirror && item.mirror.rotateOpposite !== undefined) ? item.mirror.rotateOpposite : ((base.mirror && base.mirror.rotateOpposite) || false)
                }
            };
        }

        // If newly added item file not in database, auto-initialize from base template
        const newItem = JSON.parse(JSON.stringify(base));
        if (category === 'ears') newItem.zIndex = 2;
        if (!this.items[category]) this.items[category] = {};
        this.items[category][itemFileName] = newItem;
        return { ...newItem };
    }

    /**
     * Sets the transform for a single specific item only.
     * Does NOT touch any other items.
     */
    setItemTransform(category, itemFileName, transform) {
        if (!this.items[category]) this.items[category] = {};
        this.items[category][itemFileName] = JSON.parse(JSON.stringify(transform));
    }

    /**
     * Sets the base template transform for a category.
     */
    setCategoryTransform(category, transform) {
        this.baseCategory[category] = JSON.parse(JSON.stringify(transform));
    }

    /**
     * Applies a transform to all existing items in a category.
     */
    applyTransformToAllInCategory(category, transform) {
        this.setCategoryTransform(category, transform);
        if (this.items[category]) {
            for (const file of Object.keys(this.items[category])) {
                this.items[category][file] = JSON.parse(JSON.stringify(transform));
            }
        }
    }

    /**
     * Returns list of item file names registered under a category.
     */
    getCategoryItems(category) {
        if (this.items[category]) {
            return Object.keys(this.items[category]);
        }
        return [];
    }

    getAttackConfig(attackId) {
        return this.attacks[attackId] || ATTACK_PARTS_COORDINATES[attackId] || null;
    }

    setAttackConfig(attackId, config) {
        this.attacks[attackId] = { ...config };
    }

    getAttackTracks(attackId) {
        const atk = this.getAttackConfig(attackId);
        if (!atk) return [];
        if (attackId === 'talking_mouth') {
            const frames = atk.frames || Object.keys(this.items['talking_mouth'] || {});
            return frames.map((f, idx) => {
                const item = (this.items['talking_mouth'] && this.items['talking_mouth'][f]) || { x: 0, y: -20, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 35 };
                return {
                    id: `track_${idx + 1}`,
                    name: `فڕەیمی دەم ${idx + 1} (${f})`,
                    frame: f,
                    x: item.x !== undefined ? item.x : 0,
                    y: item.y !== undefined ? item.y : 0,
                    scale: item.scale !== undefined ? item.scale : 1.0,
                    scaleX: item.scaleX !== undefined ? item.scaleX : 1.0,
                    scaleY: item.scaleY !== undefined ? item.scaleY : 1.0,
                    rotation: item.rotation !== undefined ? item.rotation : 0,
                    opacity: 1.0,
                    zIndex: item.zIndex || 35,
                    startTimeMs: idx * 110,
                    durationMs: 110,
                    transition: {
                        enabled: false,
                        startX: item.x || 0, startY: item.y || 0,
                        startScale: item.scale || 1.0, startScaleX: 1.0, startScaleY: 1.0, startRot: 0, startOpacity: 1.0,
                        endX: item.x || 0, endY: item.y || 0,
                        endScale: item.scale || 1.0, endScaleX: 1.0, endScaleY: 1.0, endRot: 0, endOpacity: 1.0,
                        easing: 'linear'
                    }
                };
            });
        }
        if (atk.tracks && Array.isArray(atk.tracks) && atk.tracks.length > 0) {
            return atk.tracks;
        }
        const tracks = (atk.frames || []).map((f, idx) => {
            const fo = (atk.frameOffsets && atk.frameOffsets[f]) || {};
            return {
                id: `track_${idx + 1}`,
                name: `Layer ${idx + 1} (${f})`,
                frame: f,
                x: fo.x !== undefined ? fo.x : (atk.offsetX || 0),
                y: fo.y !== undefined ? fo.y : (atk.offsetY || 0),
                scale: fo.scale !== undefined ? fo.scale : (atk.scale || 1.2),
                scaleX: fo.scaleX !== undefined ? fo.scaleX : 1.0,
                scaleY: fo.scaleY !== undefined ? fo.scaleY : 1.0,
                rotation: fo.rotation !== undefined ? fo.rotation : 0,
                opacity: 1.0,
                zIndex: 60 + idx,
                startTimeMs: idx * 80,
                durationMs: 250,
                transition: {
                    enabled: false,
                    startX: 0, startY: 0, startScale: 1.0, startScaleX: 1.0, startScaleY: 1.0, startRot: 0, startOpacity: 1.0,
                    endX: 0, endY: 0, endScale: 1.0, endScaleX: 1.0, endScaleY: 1.0, endRot: 0, endOpacity: 1.0,
                    easing: 'linear'
                }
            };
        });
        atk.tracks = tracks;
        return tracks;
    }

    setAttackTracks(attackId, tracks) {
        const atk = this.getAttackConfig(attackId);
        if (!atk) return;
        atk.tracks = JSON.parse(JSON.stringify(tracks));
        if (attackId === 'talking_mouth' && tracks.length > 0) {
            tracks.forEach(tr => {
                if (tr.frame) {
                    this.setItemTransform('talking_mouth', tr.frame, {
                        x: tr.x || 0,
                        y: tr.y !== undefined ? tr.y : -20,
                        scale: tr.scale || 1.0,
                        scaleX: tr.scaleX !== undefined ? tr.scaleX : 1.0,
                        scaleY: tr.scaleY !== undefined ? tr.scaleY : 1.0,
                        rotation: tr.rotation || 0,
                        zIndex: tr.zIndex || 35
                    });
                }
            });
        }
    }

    getAttackFrameTransform(attackId, frameFile) {
        const atk = this.getAttackConfig(attackId);
        if (!atk) return { x: 0, y: 0, scale: 1.2, scaleX: 1.0, scaleY: 1.0, rotation: 0, zIndex: 35 };

        // 1. Primary: tracks[] — used by all attacks including talking_mouth when tracks are defined
        if (atk.tracks && Array.isArray(atk.tracks) && atk.tracks.length > 0) {
            const tr = atk.tracks.find(t => t.frame === frameFile);
            if (tr) {
                return {
                    x: tr.x !== undefined ? tr.x : 0,
                    y: tr.y !== undefined ? tr.y : 0,
                    scale: tr.scale !== undefined ? tr.scale : 1.0,
                    scaleX: tr.scaleX !== undefined ? tr.scaleX : 1.0,
                    scaleY: tr.scaleY !== undefined ? tr.scaleY : 1.0,
                    rotation: tr.rotation !== undefined ? tr.rotation : 0,
                    zIndex: tr.zIndex || 35
                };
            }
        }

        // 2. talking_mouth fallback: read from items[] — this is the same store the dev studio
        //    edits live (via drag/sliders → persistTalkingMouth → setItemTransform).
        //    This keeps gameplay and dev studio in sync when no tracks[] have been defined yet.
        if (attackId === 'talking_mouth') {
            return this.getPartTransform('talking_mouth', frameFile);
        }

        // 3. Secondary for other attacks: frameOffsets
        if (atk.frameOffsets && atk.frameOffsets[frameFile]) {
            const fo = atk.frameOffsets[frameFile];
            return {
                x: fo.x !== undefined ? fo.x : (atk.offsetX || 0),
                y: fo.y !== undefined ? fo.y : (atk.offsetY || 0),
                scale: fo.scale !== undefined ? fo.scale : (atk.scale || 1.0),
                scaleX: fo.scaleX !== undefined ? fo.scaleX : 1.0,
                scaleY: fo.scaleY !== undefined ? fo.scaleY : 1.0,
                rotation: fo.rotation !== undefined ? fo.rotation : 0,
                zIndex: 35
            };
        }

        // 4. Final fallback: base attack offsets
        return {
            x: atk.offsetX || 0,
            y: atk.offsetY || 0,
            scale: atk.scale || 1.0,
            scaleX: atk.scaleX !== undefined ? atk.scaleX : 1.0,
            scaleY: atk.scaleY !== undefined ? atk.scaleY : 1.0,
            rotation: atk.rotation || 0,
            zIndex: 35
        };
    }

    setAttackFrameTransform(attackId, frameFile, transform) {
        const atk = this.getAttackConfig(attackId);
        if (!atk) return;
        if (!atk.frameOffsets) atk.frameOffsets = {};
        atk.frameOffsets[frameFile] = { ...transform };

        if (attackId === 'talking_mouth') {
            this.setItemTransform('talking_mouth', frameFile, transform);
        }
    }

    getSoundTiming(soundKey) {
        return this.soundTimings[soundKey] || SOUND_TALK_TIMINGS[soundKey] || { durationMs: 2200, talkSpeed: 110 };
    }

    setSoundTiming(soundKey, timing) {
        this.soundTimings[soundKey] = { ...timing };
    }

    addSoundTiming(soundKey, timing) {
        this.soundTimings[soundKey] = { ...timing };
    }

    deleteSoundTiming(soundKey) {
        delete this.soundTimings[soundKey];
    }

    getAllSoundTimings() {
        return this.soundTimings;
    }

    getShootingConfig(weaponId) {
        return this.shooting[weaponId] || SHOOTING_WEAPONS_COORDINATES[weaponId] || {};
    }

    setShootingConfig(weaponId, config) {
        this.shooting[weaponId] = { ...config };
    }

    getShootingFrameTransform(weaponId, frameFile) {
        const gun = this.getShootingConfig(weaponId);
        if (!gun) return { x: 0, y: 0, scale: 1.0, scaleX: 1.0, scaleY: 1.0, rotation: 0 };
        if (gun.frameOffsets && gun.frameOffsets[frameFile]) {
            return { ...gun.frameOffsets[frameFile] };
        }
        return {
            x: 0,
            y: 0,
            scale: gun.scale !== undefined ? gun.scale : 1.0,
            scaleX: gun.scaleX !== undefined ? gun.scaleX : 1.0,
            scaleY: gun.scaleY !== undefined ? gun.scaleY : 1.0,
            rotation: gun.rotation !== undefined ? gun.rotation : 0
        };
    }

    setShootingFrameTransform(weaponId, frameFile, transform) {
        if (!this.shooting[weaponId]) return;
        if (!this.shooting[weaponId].frameOffsets) {
            this.shooting[weaponId].frameOffsets = {};
        }
        this.shooting[weaponId].frameOffsets[frameFile] = { ...transform };
    }

    setShootingFireMode(weaponId, mode) {
        if (!this.shooting[weaponId]) return;
        this.shooting[weaponId].selectedFireMode = mode;
    }

    setShootingFireModeConfig(weaponId, mode, key, value) {
        if (!this.shooting[weaponId]) return;
        if (!this.shooting[weaponId].fireModes) {
            this.shooting[weaponId].fireModes = {
                single: { enabled: true },
                burst: { enabled: true, count: 3, intervalMs: 80, cooldownMs: 350 },
                rapid: { enabled: true, intervalMs: 110 }
            };
        }
        if (!this.shooting[weaponId].fireModes[mode]) {
            this.shooting[weaponId].fireModes[mode] = {};
        }
        this.shooting[weaponId].fireModes[mode][key] = value;
    }

    setShootingBloodZone(weaponId, bloodZone) {
        if (!this.shooting[weaponId]) return;
        this.shooting[weaponId].bloodZone = {
            ...(this.shooting[weaponId].bloodZone || { centerY: 240, spreadY: 150, spreadX: 110 }),
            ...bloodZone
        };
    }

    getAllShootingConfigs() {
        return this.shooting;
    }

    addShootingWeapon(weaponId, config) {
        this.shooting[weaponId] = { ...config };
    }

    deleteShootingWeapon(weaponId) {
        delete this.shooting[weaponId];
    }

    // Swords & Blades Configs
    getSwordConfig(weaponId) {
        let cfg = this.swords[weaponId] || SWORDS_WEAPONS_COORDINATES[weaponId] || null;
        // Resolve alias: if value is a string, it's a redirect to another key
        if (typeof cfg === 'string') cfg = this.swords[cfg] || SWORDS_WEAPONS_COORDINATES[cfg] || {};
        return cfg || {};
    }

    setSwordConfig(weaponId, config) {
        this.swords[weaponId] = { ...config };
    }

    getAllSwordConfigs() {
        // Filter out string aliases so they don't create duplicate toolbar entries
        const result = {};
        for (const [k, v] of Object.entries(this.swords)) {
            if (typeof v !== 'string') result[k] = v;
        }
        return result;
    }

    // Special Weapons Configs
    getSpecialConfig(weaponId) {
        let cfg = this.special[weaponId] || SPECIAL_WEAPONS_COORDINATES[weaponId] || null;
        // Resolve alias: if value is a string, it's a redirect to another key
        if (typeof cfg === 'string') cfg = this.special[cfg] || SPECIAL_WEAPONS_COORDINATES[cfg] || {};
        return cfg || {};
    }

    setSpecialConfig(weaponId, config) {
        this.special[weaponId] = { ...config };
    }

    getAllSpecialConfigs() {
        // Filter out string aliases so they don't create duplicate toolbar entries
        const result = {};
        for (const [k, v] of Object.entries(this.special)) {
            if (typeof v !== 'string') result[k] = v;
        }
        return result;
    }

    // Generic Weapon Getter
    getWeaponConfig(weaponId, category = null) {
        if (this.shooting && this.shooting[weaponId]) return this.shooting[weaponId];
        if (this.swords && this.swords[weaponId]) return this.swords[weaponId];
        if (this.special && this.special[weaponId]) return this.special[weaponId];
        if (SHOOTING_WEAPONS_COORDINATES[weaponId]) return SHOOTING_WEAPONS_COORDINATES[weaponId];
        if (SWORDS_WEAPONS_COORDINATES[weaponId]) return SWORDS_WEAPONS_COORDINATES[weaponId];
        if (SPECIAL_WEAPONS_COORDINATES[weaponId]) return SPECIAL_WEAPONS_COORDINATES[weaponId];
        return null;
    }

    resetAll() {
        this.baseCategory = JSON.parse(JSON.stringify(BASE_CATEGORY_COORDINATES));
        this.items = JSON.parse(JSON.stringify(ITEM_COORDINATES));
        this.attacks = JSON.parse(JSON.stringify(ATTACK_PARTS_COORDINATES));
        this.soundTimings = JSON.parse(JSON.stringify(SOUND_TALK_TIMINGS));
        this.shooting = JSON.parse(JSON.stringify(SHOOTING_WEAPONS_COORDINATES));
        this.swords = JSON.parse(JSON.stringify(SWORDS_WEAPONS_COORDINATES));
        this.special = JSON.parse(JSON.stringify(SPECIAL_WEAPONS_COORDINATES));
        try { localStorage.removeItem('mama_vana_shooting_coords'); } catch (e) { }
    }

    exportSelectedItem(category, itemFileName) {
        const transform = this.getPartTransform(category, itemFileName);
        return `// شوێنی ئەم کەرەستەیە (${itemFileName}) دابنێ لە ناو ITEM_COORDINATES['${category}'] لە js/coordinates.js:
"${itemFileName}": ${JSON.stringify(transform, null, 4)},`;
    }

    exportSelectedCategory(category) {
        const catItems = this.items[category] || {};
        return `// شوێنی کەرەستەکانی بەشی '${category}' لە ناو ITEM_COORDINATES['${category}'] لە js/coordinates.js:
"${category}": ${JSON.stringify(catItems, null, 4)},`;
    }

    exportSelectedAttack(attackId) {
        const atk = this.getAttackConfig(attackId);
        if (atk) {
            atk.allowMirror = (atk.allowMirror !== false);
            atk.tracks = this.getAttackTracks(attackId);
        }
        return `// ڕێکخستنی ئەم هێرشە دابنێ لە ناو ATTACK_PARTS_COORDINATES لە js/coordinates.js:
"${attackId}": ${JSON.stringify(atk, null, 4)},`;
    }

    exportSelectedAttackCuteCut(attackId) {
        const atk = this.getAttackConfig(attackId);
        if (atk) {
            atk.allowMirror = (atk.allowMirror !== false);
            atk.tracks = this.getAttackTracks(attackId);
        }
        return `// کۆدی هێرشی ستۆدیۆی Cute CUT بۆ '${attackId}':
"${attackId}": ${JSON.stringify(atk, null, 4)},`;
    }

    exportShootingWeapon(weaponId) {
        const gun = this.getShootingConfig(weaponId);
        return `// ڕێکخستنی ئەم چەکە دابنێ لە ناو SHOOTING_WEAPONS_COORDINATES لە js/coordinates.js:
"${weaponId}": ${JSON.stringify(gun, null, 4)},`;
    }

    exportSwordWeapon(weaponId) {
        const sw = this.getSwordConfig(weaponId);
        return `// ڕێکخستنی ئەم شمشێرە دابنێ لە ناو SWORDS_WEAPONS_COORDINATES لە js/coordinates.js:
"${weaponId}": ${JSON.stringify(sw, null, 4)},`;
    }

    exportSpecialWeapon(weaponId) {
        const sp = this.getSpecialConfig(weaponId);
        return `// ڕێکخستنی ئەم هێرشە تایبەتە دابنێ لە ناو SPECIAL_WEAPONS_COORDINATES لە js/coordinates.js:
"${weaponId}": ${JSON.stringify(sp, null, 4)},`;
    }

    exportAllShootingCode() {
        return `// تەواوی ڕێکخستنی چەکەکان لە ناو SHOOTING_WEAPONS_COORDINATES لە js/coordinates.js:
const SHOOTING_WEAPONS_COORDINATES = ${JSON.stringify(this.shooting, null, 4)};`;
    }

    exportSoundTimings() {
        return `// کات و خێرایی دەنگەکان لە ناو SOUND_TALK_TIMINGS لە js/coordinates.js:
const SOUND_TALK_TIMINGS = ${JSON.stringify(this.soundTimings, null, 4)};`;
    }

    exportCode() {
        return `// =============================================================================
// Mama Vana - Calibrated Coordinates Database (Exported from Dev Studio)
// =============================================================================

const DEFAULT_Z_INDEX = ${JSON.stringify(this.defaultZIndex, null, 4)};

const BASE_CATEGORY_COORDINATES = ${JSON.stringify(this.baseCategory, null, 4)};

const ITEM_COORDINATES = ${JSON.stringify(this.items, null, 4)};

const SOUND_TALK_TIMINGS = ${JSON.stringify(this.soundTimings, null, 4)};

const ATTACK_PARTS_COORDINATES = ${JSON.stringify(this.attacks, null, 4)};

const SHOOTING_WEAPONS_COORDINATES = ${JSON.stringify(this.shooting, null, 4)};

const SWORDS_WEAPONS_COORDINATES = ${JSON.stringify(this.swords, null, 4)};

const SPECIAL_WEAPONS_COORDINATES = ${JSON.stringify(this.special, null, 4)};`;
    }
}

window.coordinatesDB = new CoordinatesDB();
window.ITEM_COORDINATES = ITEM_COORDINATES;
window.BASE_CATEGORY_COORDINATES = BASE_CATEGORY_COORDINATES;
window.DEFAULT_Z_INDEX = DEFAULT_Z_INDEX;
window.SHOOTING_WEAPONS_COORDINATES = SHOOTING_WEAPONS_COORDINATES;
window.SWORDS_WEAPONS_COORDINATES = SWORDS_WEAPONS_COORDINATES;
window.SPECIAL_WEAPONS_COORDINATES = SPECIAL_WEAPONS_COORDINATES;
