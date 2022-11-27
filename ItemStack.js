const { v4 } = require("uuid");

class ItemStack {
    constructor(item, count) {
        this.item = item ?? 'STONE';
        this.count = count ?? 1;
    }

    item;
    count;
    id = v4();
    metadata = {};
}
module.exports = ItemStack;