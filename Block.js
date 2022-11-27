class Block {
    constructor(x, y, type, background, meta) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.type = type ?? 'STONE';
        this.background = background ?? false;
        this.metadata = meta ?? {};
        this.rect = () => {
            return {
                left: this.x,
                top: this.y,
                right: this.x + 1,
                bottom: this.y + 1,
                width: 1,
                height: 1
            };
        };
    }

    type;
    x;
    y;
    metadata;
    background;
}
module.exports = Block;