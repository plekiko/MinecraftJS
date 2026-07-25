/** Data-only inventory item (no rendering). Client extends with draw helpers. */

import { getItem } from "./item.js";

export class InventoryItem {
    constructor({ blockId = null, itemId = null, count = 0, props = {} } = {}) {
        this.blockId = blockId;
        this.itemId = itemId;
        this.count = count;
        this.props = props;

        this.init();
    }

    init() {
        if (this.itemId !== null) {
            const item = getItem(this.itemId);
            if (item?.durability) {
                if (!this.hasProp("durability"))
                    this.setProp("durability", item.durability);
            }
        }
    }

    addProps(props) {
        this.props = { ...this.props, ...props };
    }

    removeProps(props) {
        for (const prop in props) {
            delete this.props[prop];
        }
    }

    hasProp(prop) {
        return this.props[prop] !== undefined;
    }

    getProp(prop) {
        return this.props[prop];
    }

    setProp(prop, value) {
        this.props[prop] = value;
    }

    removeProp(prop) {
        delete this.props[prop];
    }

    isEmpty() {
        if (this.count <= 0) return true;
        return this.blockId === null && this.itemId === null;
    }
}
