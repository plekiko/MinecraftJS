class Tree {
    constructor(variants = []) {
        this.variants = variants;
    }
}

const Trees = Object.freeze({
    Cactus: new Tree([
        {
            blocks: [[Blocks.Cactus], [Blocks.Cactus], [Blocks.Cactus]],
        },
        {
            blocks: [
                [Blocks.Cactus],
                [Blocks.Cactus],
                [Blocks.Cactus],
                [Blocks.Cactus],
            ],
        },
        {
            blocks: [[Blocks.Cactus], [Blocks.Cactus]],
        },
        {
            blocks: [[Blocks.Cactus]],
        },
    ]),

    Oak: new Tree([
        {
            blocks: [
                [
                    Blocks.Air,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.Air,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLog,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                ],
                [
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLog,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                ],
                [Blocks.Air, Blocks.Air, Blocks.OakLog, Blocks.Air, Blocks.Air],
                [Blocks.Air, Blocks.Air, Blocks.OakLog, Blocks.Air, Blocks.Air],
            ],
        },
        {
            blocks: [
                [
                    Blocks.Air,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.Air,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLog,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                ],
                [
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                    Blocks.OakLog,
                    Blocks.OakLeaves,
                    Blocks.OakLeaves,
                ],
                [Blocks.Air, Blocks.Air, Blocks.OakLog, Blocks.Air, Blocks.Air],
            ],
        },
    ]),

    Spruce: new Tree([
        {
            blocks: [
                [Blocks.Air, Blocks.SpruceLeaves, Blocks.Air],
                [Blocks.SpruceLeaves, Blocks.SpruceLeaves, Blocks.SpruceLeaves],
                [Blocks.SpruceLeaves, Blocks.SpruceLog, Blocks.SpruceLeaves],
                [Blocks.SpruceLeaves, Blocks.SpruceLog, Blocks.SpruceLeaves],
                [Blocks.Air, Blocks.SpruceLog, Blocks.Air],
                [Blocks.Air, Blocks.SpruceLog, Blocks.Air],
            ],
        },
    ]),

    BigSpruce: new Tree([
        {
            blocks: [
                [Blocks.Air, Blocks.SpruceLeaves, Blocks.Air],
                [Blocks.SpruceLeaves, Blocks.SpruceLeaves, Blocks.SpruceLeaves],
                [Blocks.SpruceLeaves, Blocks.SpruceLog, Blocks.SpruceLeaves],
                [Blocks.SpruceLeaves, Blocks.SpruceLog, Blocks.SpruceLeaves],
                [Blocks.Air, Blocks.SpruceLog, Blocks.Air],
                [Blocks.Air, Blocks.SpruceLog, Blocks.Air],
                [Blocks.Air, Blocks.SpruceLog, Blocks.Air],
                [Blocks.Air, Blocks.SpruceLog, Blocks.Air],
            ],
        },
    ]),

    Birch: new Tree([
        {
            blocks: [
                [
                    Blocks.Air,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.Air,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLog,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                ],
                [
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLog,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                ],
                [
                    Blocks.Air,
                    Blocks.Air,
                    Blocks.BirchLog,
                    Blocks.Air,
                    Blocks.Air,
                ],
                [
                    Blocks.Air,
                    Blocks.Air,
                    Blocks.BirchLog,
                    Blocks.Air,
                    Blocks.Air,
                ],
            ],
        },
        {
            blocks: [
                [
                    Blocks.Air,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.Air,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.Air,
                ],
                [
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLog,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                ],
                [
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                    Blocks.BirchLog,
                    Blocks.BirchLeaves,
                    Blocks.BirchLeaves,
                ],
                [
                    Blocks.Air,
                    Blocks.Air,
                    Blocks.BirchLog,
                    Blocks.Air,
                    Blocks.Air,
                ],
            ],
        },
    ]),

    Jungle: new Tree([
        {
            blocks: [
                [Blocks.Air, Blocks.JungleLeaves, Blocks.Air],
                [Blocks.JungleLeaves, Blocks.JungleLeaves, Blocks.JungleLeaves],
                [Blocks.JungleLeaves, Blocks.JungleLog, Blocks.JungleLeaves],
                [Blocks.JungleLeaves, Blocks.JungleLog, Blocks.JungleLeaves],
                [Blocks.Air, Blocks.JungleLog, Blocks.Air],
                [Blocks.Air, Blocks.JungleLog, Blocks.Air],
            ],
        },
    ]),

    BigJungle: new Tree([
        {
            blocks: [
                [Blocks.Air, Blocks.JungleLeaves, Blocks.Air],
                [Blocks.JungleLeaves, Blocks.JungleLeaves, Blocks.JungleLeaves],
                [Blocks.JungleLeaves, Blocks.JungleLog, Blocks.JungleLeaves],
                [Blocks.JungleLeaves, Blocks.JungleLog, Blocks.JungleLeaves],
                [Blocks.Air, Blocks.JungleLog, Blocks.Air],
                [Blocks.Air, Blocks.JungleLog, Blocks.Air],
                [Blocks.Air, Blocks.JungleLog, Blocks.Air],
                [Blocks.Air, Blocks.JungleLog, Blocks.Air],
            ],
        },
    ]),
});
