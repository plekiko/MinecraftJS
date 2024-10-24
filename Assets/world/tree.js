class Tree {
    constructor(variants = []) {
        this.variants = variants;
    }
}

const Trees = Object.freeze({
    Cactus: new Tree([
        [
            // Variant 1 (a simple vertical cactus)
            [Blocks.Cactus], // Bottom
            [Blocks.Cactus], // Middle
            [Blocks.Cactus], // Top
        ],
        [
            // Variant 2 (a taller cactus)
            [Blocks.Cactus], // Bottom
            [Blocks.Cactus], // Middle
            [Blocks.Cactus], // Middle
            [Blocks.Cactus], // Top
        ],
        [
            // Variant 3 (a short cactus)
            [Blocks.Cactus], // Just one block
        ],
    ]),

    Oak: new Tree([
        // Variant 1: Small Oak Tree
        [
            [Blocks.OakLog], // Trunk (bottom)
            [Blocks.OakLog], // Trunk (middle)
            [
                Blocks.OakLeaves,
                Blocks.OakLeaves,
                Blocks.OakLog,
                Blocks.OakLeaves,
                Blocks.OakLeaves,
            ], // Leaf layer 1
            [
                Blocks.OakLeaves,
                Blocks.OakLeaves,
                Blocks.OakLog,
                Blocks.OakLeaves,
                Blocks.OakLeaves,
            ], // Leaf layer 1
            [Blocks.OakLeaves, Blocks.OakLeaves, Blocks.OakLeaves], // Leaf layer 2 (with trunk in the center)
            [Blocks.OakLeaves, Blocks.OakLeaves, Blocks.OakLeaves], // Leaf layer 3
        ],

        // Variant 2: Medium Oak Tree
        [
            [Blocks.OakLog], // Trunk (bottom)
            [Blocks.OakLog], // Trunk (middle)
            [Blocks.OakLog], // Trunk (middle)
            [
                Blocks.OakLeaves,
                Blocks.OakLeaves,
                Blocks.OakLog,
                Blocks.OakLeaves,
                Blocks.OakLeaves,
            ], // Leaf layer 1
            [
                Blocks.OakLeaves,
                Blocks.OakLeaves,
                Blocks.OakLog,
                Blocks.OakLeaves,
                Blocks.OakLeaves,
            ], // Leaf layer 1
            [Blocks.OakLeaves, Blocks.OakLeaves, Blocks.OakLeaves], // Leaf layer 2 (with trunk in the center)
            [Blocks.OakLeaves, Blocks.OakLeaves, Blocks.OakLeaves], // Leaf layer 3
        ],

        // Variant 3: Large Oak Tree
        [
            [Blocks.OakLog], // Trunk (bottom)
            [Blocks.OakLog], // Trunk (middle)
            [Blocks.OakLog], // Trunk (middle)
            [Blocks.OakLog], // Trunk (middle)
            [
                Blocks.OakLeaves,
                Blocks.OakLeaves,
                Blocks.OakLog,
                Blocks.OakLeaves,
                Blocks.OakLeaves,
            ], // Leaf layer 1
            [
                Blocks.OakLeaves,
                Blocks.OakLeaves,
                Blocks.OakLog,
                Blocks.OakLeaves,
                Blocks.OakLeaves,
            ], // Leaf layer 1
            [
                Blocks.OakLeaves,
                Blocks.OakLeaves,
                Blocks.OakLog,
                Blocks.OakLeaves,
                Blocks.OakLeaves,
            ], // Leaf layer 1
            [Blocks.OakLeaves, Blocks.OakLeaves, Blocks.OakLeaves], // Leaf layer 2 (with trunk in the center)
            [Blocks.OakLeaves, Blocks.OakLeaves, Blocks.OakLeaves], // Leaf layer 3
        ],
    ]),

    Spruce: new Tree([
        [
            [Blocks.SpruceLog],
            [Blocks.SpruceLog],
            [
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLog,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
            ],
            [
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLog,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
            ],
            [Blocks.SpruceLeaves, Blocks.SpruceLog, Blocks.SpruceLeaves],
            [
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLog,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
            ],
            [Blocks.SpruceLeaves, Blocks.SpruceLeaves, Blocks.SpruceLeaves],
            [Blocks.SpruceLeaves],
            [Blocks.SpruceLeaves, Blocks.SpruceLeaves, Blocks.SpruceLeaves],
        ],
    ]),

    BigSpruce: new Tree([
        [
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [Blocks.SpruceLog, Blocks.SpruceLog],
            [
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
            ],
            [
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
                Blocks.SpruceLeaves,
            ],
            [Blocks.SpruceLeaves, Blocks.SpruceLeaves],
        ],
    ]),

    Acacia: new Tree([
        [
            [Blocks.AcaciaLog],
            [Blocks.AcaciaLog],
            [Blocks.Air, Blocks.AcaciaLog, Blocks.AcaciaLog],
            [
                Blocks.Air,
                Blocks.Air,
                Blocks.Air,
                Blocks.AcaciaLog,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
            ],
            [
                Blocks.Air,
                Blocks.AcaciaLog,
                Blocks.Air,
                Blocks.Air,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
            ],
            [
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.Air,
                Blocks.Air,
            ],
            [
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.AcaciaLeaves,
                Blocks.Air,
                Blocks.Air,
                Blocks.Air,
            ],
        ],
    ]),

    Birch: new Tree([
        [
            [Blocks.BirchLog], // Trunk (bottom)
            [Blocks.BirchLog], // Trunk (middle)
            [
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
                Blocks.BirchLog,
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
            ], // Leaf layer 1
            [
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
                Blocks.BirchLog,
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
            ], // Leaf layer 1
            [Blocks.BirchLeaves, Blocks.BirchLeaves, Blocks.BirchLeaves], // Leaf layer 2 (with trunk in the center)
            [Blocks.BirchLeaves, Blocks.BirchLeaves, Blocks.BirchLeaves], // Leaf layer 3
        ],

        // Variant 2: Medium Oak Tree
        [
            [Blocks.BirchLog], // Trunk (bottom)
            [Blocks.BirchLog], // Trunk (middle)
            [Blocks.BirchLog], // Trunk (middle)
            [
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
                Blocks.BirchLog,
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
            ], // Leaf layer 1
            [
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
                Blocks.BirchLog,
                Blocks.BirchLeaves,
                Blocks.BirchLeaves,
            ], // Leaf layer 1
            [Blocks.BirchLeaves, Blocks.BirchLeaves, Blocks.BirchLeaves], // Leaf layer 2 (with trunk in the center)
            [Blocks.BirchLeaves, Blocks.BirchLeaves, Blocks.BirchLeaves], // Leaf layer 3
        ],
    ]),
});
