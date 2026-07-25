/** Node + browser compatible tooloud entry (avoids UMD bundle that needs `window`). */
import Perlin from "tooloud/src/Perlin.js";
import Simplex from "tooloud/src/Simplex.js";
import Worley from "tooloud/src/Worley.js";
import Fractal from "tooloud/src/Fractal.js";

const perlin = new Perlin();
const simplex = new Simplex();
const worley = new Worley();

const tooloud = {
    Perlin: {
        noise: perlin.noise,
        setSeed: perlin.setSeed,
        create: (seed) => new Perlin(seed),
    },
    Simplex: {
        noise: simplex.noise,
        setSeed: simplex.setSeed,
        create: (seed) => new Simplex(seed),
    },
    Worley: {
        Euclidean: worley.Euclidean,
        Manhattan: worley.Manhattan,
        setSeed: worley.setSeed,
        create: (seed) => new Worley(seed),
    },
    Fractal: {
        noise: Fractal.noise,
    },
};

export default tooloud;
