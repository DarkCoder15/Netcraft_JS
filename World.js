const perlin = require('perlin-noise');
const { v4 } = require('uuid');
const { Entity } = require('./entity');
const Player = require('./Player');
const rectangle = require('./utils/rectangle');
const { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
class World {
    constructor() {
        this.blocks = {};
        this.players = {};
        this.entities = {};
        this.tickEvent = {};
    }

    blocks;
    players;
    entities;
    tickEvent;

    /**
     * 
     * @param {string} name - Player's name
     * @returns {Player|null} Player
     */
    getPlayer(name) {
        return this.players[name] ?? null;
    }

    /**
     * Get all players in this world
     * @returns {Player[]} Array of players in this world
     */
    getPlayers() {
        return Object.values(this.players);
    }

    /**
     * Get all entities in this world
     * @returns {Entity[]} Array of entities in this world
     */
    getEntities() {
        return Object.values(this.entities);
    }

    /**
     * Get entity by ID
     * @param {string} id - Entity ID
     * @returns {Entity|null}
     */
    getEntity(id) {
        return this.entities[id] ?? null;
    }

    /**
     * Send a chat message to every player in this world
     * @param {string} ch - Packet to broadcast
     */
    broadcastMessage(ch) {
        this.getPlayers().forEach(p => p.sendMessage(ch));
        console.log(`[World Broadcast] ${ch}`);
    }

    /**
     * Send a chat message to every player in this world
     * @param {string} ch - Message to broadcast
     */
    broadcastChat(ch) {
        this.broadcastMessage(ch);
    }

    /**
     * Send a packet to every player in this world
     * @param {string} data
     * @param {Function} [filter] 
     */
    broadcastPacket(data, filter) {
        for (const p of this.getPlayers()) {
            if (!filter || filter && filter(p)) p.send(data);
        }
    }

    /**
     * Create an entity and get it's ID
     * @param {Entity} entity 
     * @returns {string}
     */
    createEntity(entity) {
        entity.id = v4();
        this.broadcastPacket(`addentity?${entity.id}?${entity.type}`);
        this.broadcastPacket(`moveentity?${entity.id}?${entity.x}?${entity.y}`);
        this.entities[entity.id] = entity;
        if (entity.createEvent) entity.createEvent();
        return entity.id;
    }

    /**
     * Remove an entity
     * @param {Entity|string} entity 
     */
    removeEntity(entity) {
        this.broadcastPacket(`delentity?${entity.id ?? entity}`);
        if (entity.createEvent) entity.removeEvent();
        delete this.entities[entity.id ?? entity];
    }

    /**
     * Move an entity
     * @param {Entity} entity - The entity
     * @param {Number} x - X
     * @param {Number} y - Y
     * @param {boolean} noClip - Should ignore block intersecting
     * @returns {boolean|Block[]} True if success or block array if intersects
     */
    moveEntity(entity, x, y, noClip) {
        if (x < MIN_COORDINATE || x > MAX_COORDINATE || y < MIN_COORDINATE || y > MAX_COORDINATE) return ['BORDER'];
        if (!noClip) {
            let intersecting = [];
            for (const block of Object.values(this.blocks)) {
                if (entity.rect().bottom <= block.y) continue;
                if (block.background || netcraftData.non_solid_blocks.includes(block.type)) continue;
                let pr = entity.rect();
                pr.left = x;
                pr.top = y;
                pr.bottom = y + pr.height;
                pr.right = x + pr.width;
                pr.bottom -= 0.1;
                let inters = rectangle.intersect(rectangle.fromBlock(block), pr);

                if (inters) {
                    intersecting.push(block);
                }
            }
            if (intersecting.length > 0) {
                return intersecting;
            }
        }
        entity.x = x;
        entity.y = y;
        this.broadcastPacket(`moveentity?${entity.id}?${x * 32}?${y * 32}`);
        return true;
    }

    /**
     * Get block at specified X, Y
     * @param {Number} x 
     * @param {Number} y 
     * @returns {Block}
     */
    getBlockAt(x, y) {
        x = parseInt(x.toString());
        y = parseInt(y.toString());
        return this.blocks[`${x}_${y}`] ?? null;
    }

    /**
     * 
     * @param {Number|Block} x 
     * @param {Number} y 
     * @param {Block} block
     */
    setBlockAt(x, y, block) {
        if (typeof x == 'object') {
            let x_ = x.x;
            let y_ = x.y;
            x_ = parseInt(x_.toString());
            y_ = parseInt(y_.toString());
            delete this.blocks[`${x_}_${y_}`];
            this.blocks[`${x_}_${y_}`] = block;
            return;
        }
        x = parseInt(x.toString());
        y = parseInt(y.toString());
        //console.log(`${JSON.stringify(x)} ${JSON.stringify(y)} ${JSON.stringify(block)}`);
        delete this.blocks[`${x}_${y}`];
        if (!block) return;
        block.x = x;
        block.y = y;
        this.blocks[`${x}_${y}`] = block;
    }

    /**
     * Get world in string
     * @returns {string} World in JSON
     */
    save() {
        return JSON.stringify({
            blocks: this.blocks,
            entites: Object.fromEntries(Object.entries(this.entities).map(x => [x[0], x[1].toParsedJSON()])),
            generatorOptions: this.generatorOptions
        });
    }
    
    saveExperimental(dirName) {
        // пока так.
        if (typeof dirName !== "string" && !/^[a-zA-Z0-9_]+$/.test(dirName)) throw new Error("Illegal dirName");
        var dirPath = `./${dirName}`;
        var rgPath = `${dirPath}/region`;
        if (!existsSync(dirPath)) mkdirSync(dirPath);
        if (!existsSync(rgPath)) mkdirSync(rgPath);
        const chunks = {};
        console.warn('Experimental save');
        for (var x = 0; x < Math.ceil(this.width / this.chunkSizeX); x++) {
            for (var y = 0; y < Math.ceil(this.height / this.chunkSizeY); y++) {
                var chunk = [];
                var blockX1 = x * this.chunkSizeX;
                var blockX2 = x * this.chunkSizeX + this.chunkSizeX;
                var blockY1 = y * this.chunkSizeY;
                var blockY2 = y * this.chunkSizeY + this.chunkSizeY;
                for (var block of Object.values(this.blocks).filter(x => blockX1 < x.x > blockX2 && // разве можно так писать? .-.
                    blockY1 < x.y > blockY2)) {
                    chunk.push(block);
                }
                writeFileSync(`${rgPath}/${x}_${y}.json`, JSON.stringify(chunk));
            }
        }
    }

    get chunkSizeX() {
        return 16;
    }

    get chunkSizeY() {
        return 16;
    }

    get width() {
        var m = 0;
        for (const block of Object.values(this.blocks)) {
            if (m < block.x) m = block.x;
        }
        return m;
    }

    get height() {
        var m = 0;
        for (const block of Object.values(this.blocks)) {
            if (m < block.y) m = block.y;
        }
        return m;
    }

    /**
     * Load world from JSON save
     * @param {string} save 
     */
    loadFrom(save) {
        let dat = JSON.parse(save);
        this.blocks = dat.blocks;
        this.entities = Object.fromEntries(Object.entries(dat.entites).map(x => [x[0], Entity.fromParsedJSON(x[1], this)]));
        this.getEntities().forEach(x => x.createEvent(true));
        this.generatorOptions = dat.generatorOptions;
        let a = false;
        Object.values(this.blocks).forEach(x => {
            if (typeof x.x == 'string') { x.x = parseInt(x.x); a = true; }
            if (typeof x.y == 'string') { x.y = parseInt(x.y); a = true; }
        });
        if (a) console.warn(`World repaired (X or Y of some blocks was string, changed to int)`);
    }

    runtimeId = v4();
    generatorOptions = {};
}

const Block = require('./Block');
const { updateUnionTypeNode } = require('typescript');
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Generate a world
 * @returns {World}
 */
function generate() {
    const maxHeight = 100;
    let world = new World();
    let ya = perlin.generatePerlinNoise(256, 1).map(x => parseInt(Math.round(x * 10 + 15)));
    console.log(ya);
    for (let x in ya) {
        let y = ya[x];
        for (let a = y; a < maxHeight; a++) {
            if (a >= maxHeight - 1) world.setBlockAt(x, a, new Block(x, a, 'BEDROCK', false));
            else if (a == y) {
                world.setBlockAt(x, a, new Block(x, a, 'GRASS_BLOCK', false));
            }
            else if (a < maxHeight - 2 && a > 10) {
                if (a > maxHeight - 15 && randomInt(1, 10) > 6) {
                    world.setBlockAt(x, a, new Block(x, a, randomInt(1, 10) > 6 ? 'DIAMOND_ORE' : 'GOLD_ORE', false));
                    continue;
                } else if (a > 16 && a < maxHeight - 4 && randomInt(1, 10) > 7) {
                    world.setBlockAt(x, a, new Block(x, a, randomInt(1, 10) > 5 ? 'IRON_ORE' : 'COAL_ORE', false));
                    continue;
                } else if (a < 16 && randomInt(1, 10) > 6) {
                    world.setBlockAt(x, a, new Block(x, a, randomInt(1, 10) > 5 ? 'IRON_ORE' : 'COAL_ORE', false));
                    continue;
                }
                world.setBlockAt(x, a, new Block(x, a, 'STONE', false));
            } else {
                world.setBlockAt(x, a, new Block(x, a, 'DIRT', false));
            }
        }
    }
    for (let y = 21; y < maxHeight; y++) {
        for (let x in ya) {
            if (!world.getBlockAt(x, y)) {
                world.setBlockAt(x, y, new Block(x, y, 'WATER'));
            }
        }
    }
    return world;
}

/**
 * Generate a tree
 * @param {World} world - World 
 * @param {Number} x - Sapling X
 * @param {Number} y - Sapling Y
 * @param {boolean|undefined|null} bg - On background or not
 * @param {boolean|undefined|null} broadcastPackets - Should broadcast packets or not
 */
function generateTree(world, x, y, bg, broadcastPackets) {
    world.setBlockAt(x, y, new Block(x, y, 'WOOD', bg ?? false, {}));
    world.setBlockAt(x, y - 1, new Block(x, y - 1, 'WOOD', bg ?? false, {}));
    world.setBlockAt(x, y - 2, new Block(x, y - 2, 'WOOD', bg ?? false, {}));
    world.setBlockAt(x, y - 3, new Block(x, y - 3, 'LEAVES', bg ?? false, {}));
    world.setBlockAt(x - 1, y - 3, new Block(x - 1, y - 3, 'LEAVES', bg ?? false, {}));
    world.setBlockAt(x + 1, y - 3, new Block(x + 1, y - 3, 'LEAVES', bg ?? false, {}));
    world.setBlockAt(x, y - 4, new Block(x, y - 4, 'LEAVES', bg ?? false, {}));
    if (broadcastPackets) {
        world.getPlayers().forEach(p => {
            p.sendBlockChange(x, y, 'WOOD', bg ?? false, true);
            p.sendBlockChange(x, y - 1, 'WOOD', bg ?? false, true);
            p.sendBlockChange(x, y - 2, 'WOOD', bg ?? false, true);
            p.sendBlockChange(x, y - 3, 'LEAVES', bg ?? false, true);
            p.sendBlockChange(x - 1, y - 3, 'LEAVES', bg ?? false, true);
            p.sendBlockChange(x + 1, y - 3, 'LEAVES', bg ?? false, true);
            p.sendBlockChange(x, y - 4, 'LEAVES', bg ?? false, true);
            p.sendQueue();
        });
    }
}

module.exports.generateTree = generateTree;
module.exports.generate = generate;
module.exports.World = World;