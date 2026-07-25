/**
 * Late-bound entity constructors / enums.
 * Breaks block.js ↔ entity.js import cycles (Class extends undefined).
 */
export const entityRegistry = {
    Entities: null,
    TNT: null,
    EntityTypes: null,
};
