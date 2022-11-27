const net = require('net');
const colors = require('colors');
const fs = require('fs');
const moment = require('moment');
const uuid = require('uuid');
const intersects = require('intersects');

console.reallyLog = console.log;
console.reallyWarn = console.warn;
console.reallyError = console.error;
console.reallyDebug = console.debug;

console.log = function (data) {
    var str = '';
    if (typeof data == 'object') str = JSON.stringify(data);
    else str = data.toString();
    str.split('\n').forEach((v) => {
        console.reallyLog(`${moment().format("HH:mm:ss")} ${colors.green("[INFO]")} ${v}`);
    });
};

console.warn = function (data) {
    var str = '';
    if (typeof data == 'object') str = JSON.stringify(data);
    else str = data.toString();
    str.split('\n').forEach((v) => {
        console.reallyWarn(`${moment().format("HH:mm:ss")} ${colors.yellow("[WARNING]")} ${v}`);
    });
};

console.error = function (data) {
    var str = '';
    if (typeof data == 'object') str = JSON.stringify(data);
    else str = data.toString();
    str.split('\n').forEach((v) => {
        console.reallyLog(`${moment().format("HH:mm:ss")} ${colors.red("[ERROR]")} ${v}`);
    });
};

console.debug = function (data) {
    //if(!process.env['kkdebug']) return;
    var str = '';
    if (typeof data == 'object') str = JSON.stringify(data);
    else str = data.toString();
    str.split('\n').forEach((v) => {
        console.reallyLog(`${moment().format("HH:mm:ss")} ${colors.magenta("[DEBUG]")} ${v}`);
    });
};

const Player = require('./Player');
const World = require('./World');
const Encode = require('./Encode');
const rectangle = require('./utils/rectangle');
const distanceBetween = require('./utils/distance');

globalThis.MIN_COORDINATE = 0;
globalThis.MAX_COORDINATE = 256;

globalThis.NJS_VERSION = '0.2';
globalThis.NETCRAFT_VERSION = '0.1.9b';

console.log('  _   _      _                  __ _   \r\n | \\ | | ___| |_ ___ _ __ __ _ \/ _| |_ \r\n |  \\| |\/ _ \\ __\/ __| \'__\/ _` | |_| __|\r\n | |\\  |  __\/ || (__| | | (_| |  _| |_ \r\n |_| \\_|\\___|\\__\\___|_|  \\__,_|_|  \\__|\r\n');

const config = require('./properties.json');
const messages = require('./messages.json');
console.log('Server starting...');

let daytimeInterval;
let stp;
let worldtime;
let skyClr = [];
function initTime() {
    console.warn('TODO: Program.js initTime()');
}

initTime();
const banlist = require('./banlist.json');

const CraftingRecipe = require('./CraftingRecipe');
const ItemStack = require('./ItemStack');

globalThis.netcraftCraftingRecipes = [];
globalThis.furnaceRecipes = {};
function loadCraftingRecipes() {
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('WHEAT', 3)], new ItemStack('BREAD', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('IRON', 3)], new ItemStack('BUCKET', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('PLANKS', 8)], new ItemStack('CHEST', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('COBBLESTONE', 8)], new ItemStack('FURNACE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('WOOD', 1)], new ItemStack('PLANKS', 4)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('PLANKS', 2)], new ItemStack('STICK', 4)));

    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('PLANKS', 3), new ItemStack('STICK', 2)], new ItemStack('WOODEN_PICKAXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('PLANKS', 3), new ItemStack('STICK', 2)], new ItemStack('WOODEN_AXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('PLANKS', 1), new ItemStack('STICK', 2)], new ItemStack('WOODEN_SHOVEL', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('PLANKS', 2), new ItemStack('STICK', 1)], new ItemStack('WOODEN_SWORD', 1)));

    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('COBBLESTONE', 3), new ItemStack('STICK', 2)], new ItemStack('STONE_PICKAXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('COBBLESTONE', 3), new ItemStack('STICK', 2)], new ItemStack('STONE_AXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('COBBLESTONE', 1), new ItemStack('STICK', 2)], new ItemStack('STONE_SHOVEL', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('COBBLESTONE', 2), new ItemStack('STICK', 1)], new ItemStack('STONE_SWORD', 1)));

    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('IRON', 3), new ItemStack('STICK', 2)], new ItemStack('IRON_PICKAXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('IRON', 3), new ItemStack('STICK', 2)], new ItemStack('IRON_AXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('IRON', 1), new ItemStack('STICK', 2)], new ItemStack('IRON_SHOVEL', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('IRON', 2), new ItemStack('STICK', 1)], new ItemStack('IRON_SWORD', 1)));

    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('DIAMOND', 3), new ItemStack('STICK', 2)], new ItemStack('DIAMOND_PICKAXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('DIAMOND', 3), new ItemStack('STICK', 2)], new ItemStack('DIAMOND_AXE', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('DIAMOND', 1), new ItemStack('STICK', 2)], new ItemStack('DIAMOND_SHOVEL', 1)));
    netcraftCraftingRecipes.push(new CraftingRecipe([new ItemStack('DIAMOND', 2), new ItemStack('STICK', 1)], new ItemStack('DIAMOND_SWORD', 1)));

}

function loadFurnaceRecipes() {
    furnaceRecipes.IRON_ORE = 'IRON';
    furnaceRecipes.GOLD_ORE = 'GOLD';
    furnaceRecipes.COBBLESTONE = 'STONE';
}

let world = new World.World();
if (fs.existsSync('./world.json')) {
    world.loadFrom(fs.readFileSync('./world.json'));
} else {
    world = require('./World').generate();
}

function save(sworld, sbanlist) {
    if (sworld) {
        fs.writeFileSync('./world.json', world.save());
        console.log(messages.world_saved);
    }
    if (sbanlist) {
        fs.writeFileSync('./banlist.json', JSON.stringify(banlist));
        console.log(messages.banlist_saved);
    }
}

globalThis.netcraftData = require('./data.json');

save(true);

loadCraftingRecipes();
loadFurnaceRecipes();

let server = net.createServer();
const players = {};
var worlds = [world];

globalThis.broadcastPacket = (data, filter) => {
    for (const p of Object.values(players)) {
        if (!filter || filter && filter(p)) p.send(data);
    }
}

globalThis.broadcastChat = (mesg) => {
    broadcastPacket(`chat?${mesg}`, (p) => p.ready == true);
}

const API = require('./API');
const Block = require('./Block');
globalThis.Netcraft = new API();

Netcraft.getPlayer = (name) => {
    return players[name];
};

Netcraft.getPlayers = () => {
    return Object.values(players);
}

Netcraft.getWorld = () => {
    return world;
};

Netcraft.addWorld = (world) => {
    worlds.push(world);
};

Netcraft.removeWorld = (world) => {
    if (typeof world == 'string') {
        worlds = worlds.filter(w => w.runtimeId != world);
    } else {
        worlds = worlds.filter(w => w != world);
    }
};

Netcraft.isBanned = (name) => {
    return banlist.includes(name);
};

Netcraft.save = save;

Netcraft.setBanned = (name, value) => {
    if (value && !banlist.includes(name)) {
        banlist.push(name);
    } else if (banlist.includes(name) && !value) {
        banlist = banlist.filter(x => x != name);
    }
};

Netcraft.getServer = () => {
    return server;
};

process.on('uncaughtException', (err) => {
    Object.values(players).forEach(p => {
        p.kick(messages.internal_server_error_kick);
    });
    console.error(err.stack);
    process.exit(-1);
});

process.on('beforeExit', () => {
    save(true);
    Object.values(players).forEach(p => {
        p.kick(messages.server_stop_kick);
    });
});

fs.readdirSync('./plugins').forEach(path => {
    console.log(`Loading ${path}`);
    if (!path.endsWith('js')) return console.warn(`${path} is not a JS plugin. Skipping.`);
    let plugin = require(`./plugins/${path}`);
    if (plugin.start) {
        plugin.start();
    } else
        console.warn(`${plugin.name} doesn't have exported start()`);
    console.log(`Plugin ${plugin.name} v${plugin.version} by ${plugin.author} started`);
});

globalThis.netcraftWheatGrowInterval = setInterval(() => {
    for (const world of worlds) {
        for (const block of Object.values(world.blocks).filter(x => x.type == 'SEEDS')) {
            let event = {
                block: block,
                x: block.x,
                y: block.y,
                type: 'wheat',
                cancel: false
            };
            Netcraft.emit('block_growth_event', event);
            if (event.cancel) return;
            world.setBlockAt(block.x, block.y, new Block(block.x, block.y, 'WHEAT', false, {}));
            world.getPlayers().forEach(p => {
                p.sendBlockChange(block.x, block.y, 'WHEAT', block.background, true);
            });
        }
        world.getPlayers().forEach(p => {
            p.sendQueue();
        });
    }
}, 10000);

globalThis.netcraftSaplingGrowInterval = setInterval(() => {
    for (const world of worlds) {
        for (const block of Object.values(world.blocks).filter(x => x.type == 'SAPLING')) {
            let event = {
                block: block,
                x: block.x,
                y: block.y,
                type: 'SAPLING',
                cancel: false
            };
            Netcraft.emit('block_growth_event', event);
            if (event.cancel) return;
            World.generateTree(world, block.x, block.y, block.background, true);
        }
    }
}, 10000);

globalThis.netcraftDamageWhenIntersectBlocksInterval = setInterval(() => {
    for (const world of worlds) {
        for (const block of Object.values(world.blocks).filter(x => netcraftData.damage_when_intersect_blocks.includes(x.type))) {
            let event = {
                block: block,
                x: block.x,
                y: block.y,
                cancel: false
            };
            Netcraft.emit(event);
            if (event.cancel) return;
            for (const player of world.getPlayers()) {
                if (rectangle.intersect(rectangle.fromBlock(block), player.rect())) {
                    player.damage(2, netcraftData.death_messages.damage_when_intersect_blocks[block.type] ? netcraftData.death_messages.damage_when_intersect_blocks[block.type].replace('%player%', player.username) : null);
                }
            }
        }
    }
}, 150);

globalThis.netcraftWorldTickInterval = setInterval(() => {
    worlds.forEach(x => {
        Object.values(x.tickEvent).forEach(a => {
            a(x);
        });
    });
}, 50);

server.on('connection', (client) => {
    console.log(`Connection from ${client.remoteAddress}`);
    let p = new Player(client);

    function onData(data) {
        data = Encode.decrypt(data.toString('utf-8').replace('\r', '').replace('\n', '')).replace('\r', '').replace('\n', '');
        let arr = data.split('?');
        let packetEvent = {
            player: p,
            data: arr,
            cancel: false
        };
        Netcraft.emit('player_packet_received', packetEvent);
        arr = packetEvent.data;
        if (packetEvent.cancel) return;
        if (arr[0] == 'setname') {
            if (arr.length != 4) return p.kick(messages.invalid_packet_kick);
            if (p.username) return p.kick(messages.invalid_packet_kick);
            if (banlist.includes(arr[1])) return p.kick(messages.banned_kick);
            if (!/^[a-zA-Z0-9_]+$/.test(arr[1]) || arr[1].length > 20) return p.kick(messages.invalid_name_kick);
            if (players[arr[1]]) return p.kick(messages.name_taken_kick);
            p.sendMessage(config.motd ?? 'Welcome to Netcraft.js');
            console.log(`${arr[1]} joined the game`);
            p.username = arr[1];
            p.language = arr[2];
            p.skinUrl = arr[3];
            p.uuid = uuid.v4();

            let preloginEvent = {
                player: p,
                cancel: false
            };

            Netcraft.emit('player_prelogin', preloginEvent);
            if (preloginEvent.cancel != false) {
                p.kick(typeof preloginEvent.cancel == 'string' ? preloginEvent.cancel : 'Login cancelled');
                return;
            }

            players[p.username] = p;

            broadcastChat(messages.broadcast_join.replace('PLAYER', p.username));

            if (fs.existsSync(`./players/${p.username}.json`)) {
                p.loadFrom(fs.readFileSync(`./players/${p.username}.json`, { encoding: 'utf-8' }));
            } else {
                if (config.everybody_admin) {
                    console.warn(`Making ${p.username} admin! You can disable 'everybody_admin' in properties.json`);
                    p.setAdmin(true);
                }
            }

            client.on('close', () => {
                delete players[p.username];
                if (!p.username || p.kicked) return;
                console.log(`${p.username ?? 'Unknown'} left the game`);
                if (p.world) p.world.broadcastPacket(`removeplayer?${p.username}`);
                p.kick(`Socket close`);
            });
            return;
        }
        if (!p.username) return p.kick(messages.invalid_packet_kick);
        if (arr[0] == 'world') {
            if (p.ready) return p.kick(messages.invalid_packet_kick);

            console.log(`${p.username} joining the world`);

            p.ready = true;
            p.teleportToWorld(world);

            let joinEvent = {
                player: p
            };

            Netcraft.emit('player_join', joinEvent);

        } else if (arr[0] == 'chat') {
            let m = arr.slice(1).join('?');
            let chatEvent = {
                player: p,
                message: m,
                cancel: false
            };
            Netcraft.emit('player_chat', chatEvent);
            m = chatEvent.message;
            if (chatEvent.cancel) return;
            let mesg = config.chat_format.replace('PLAYER', p.username).replace('MESSAGE', m);
            console.log(`[Chat] ${mesg}`);
            broadcastChat(mesg);
        } else if (arr[0] == 'entityplayermove') {
            if (Number.isNaN(arr[1]) || Number.isNaN(arr[2])) return p.kick(messages.invalid_packet_kick);
            if (!p.world) return;
            let x = parseInt(arr[1]) / 32;
            let y = parseInt(arr[2]) / 32;
            if (!p.noMoveCheck && config.enable_internal_anticheat) {
                if (!p.noClip) {
                    for (const block of Object.values(p.world.blocks)) {
                        if (p.rect().bottom <= block.y) continue;
                        if (block.background || netcraftData.non_solid_blocks.includes(block.type)) continue;
                        let pr = p.rect();
                        pr.left = parseFloat(x.toFixed(2));
                        pr.top = parseFloat(y.toFixed(2));
                        pr.right = parseFloat((x + 1).toFixed(2));
                        pr.bottom = parseFloat((y + 1.20).toFixed(2));
                        let inters = rectangle.intersect(rectangle.fromBlock(block), pr);

                        if (inters) {
                            p.send(`teleport?${p.x * 32}?${p.y * 32}`);
                            return;
                        }
                    }
                }
                if (Math.abs(p.x - x) > 2 || Math.abs(p.y - y) > 2) {
                    console.warn(`${p.username} moved too fast`);
                    p.teleport(p.x, p.y);
                    return;
                }
                if ((x < MIN_COORDINATE || x > MAX_COORDINATE) || (y < MIN_COORDINATE || y > MAX_COORDINATE)) {
                    //console.warn(`${p.username} moved wrongly (Invalid position)`);
                    let fx = p.x;
                    let fy = p.y;
                    if (fx < MIN_COORDINATE) fx = MIN_COORDINATE;
                    if (fx > MAX_COORDINATE) fx = MAX_COORDINATE;
                    if (fy < MIN_COORDINATE) fy = MIN_COORDINATE;
                    if (fy > MAX_COORDINATE) fy = MAX_COORDINATE;
                    p.teleport(fx, fy);
                    return;
                }
            }
            let moveEvent = {
                player: p,
                cancel: false,
                from: {
                    x: p.x,
                    y: p.y
                },
                to: {
                    x: x,
                    y: y
                }
            };
            Netcraft.emit('player_move', moveEvent);
            if (moveEvent.cancel) return;
            p.x = moveEvent.to.x;
            p.y = moveEvent.to.y;
            if (x != moveEvent.to.x || y != moveEvent.to.y) {
                p.teleport(moveEvent.to.x, moveEvent.to.y);
            }

            p.sendWorldPiece(Math.floor(p.x / p.viewDistanceX) * p.viewDistanceX, Math.floor(p.x / p.viewDistanceX + 1) * p.viewDistanceX,
                Math.floor(p.y / p.viewDistanceY) * p.viewDistanceY, Math.floor(p.y / p.viewDistanceY + 1) * p.viewDistanceY);
            p.world.broadcastPacket(`updateplayerposition?${p.username}?${p.x * 32}?${p.y * 32}`, (pl) => pl.ready == true && pl.uuid != p.uuid);
        } else if (arr[0] == 'update_inventory') {
            p.sendInventory();
        } else if (arr[0] == 'view_distance') {
            if (!arr[1] || !arr[2]) return p.kick(messages.invalid_packet_kick);
            let x = parseInt(arr[1]);
            let y = parseInt(arr[2]);
            p.viewDistanceX = x;
            p.viewDistanceY = y;
            p.sendWorldPiece(Math.floor(p.x / p.viewDistanceX) * p.viewDistanceX, Math.floor(p.x / p.viewDistanceX + 1) * p.viewDistanceX,
                Math.floor(p.y / p.viewDistanceY) * p.viewDistanceY, Math.floor(p.y / p.viewDistanceY + 1) * p.viewDistanceY, true);
        } else if (arr[0] == 'pvp') {
            if (!arr[1]) return p.kick(messages.invalid_packet_kick);
            if (!p.world) return;
            let t = Netcraft.getPlayer(arr[1]);
            if (!t) return p.send(`removeplayer?${arr[1]}`);
            if (t.world.runtimeId != p.world.runtimeId) return p.send(`removeplayer?${arr[1]}`);
            for (const block2 of Object.values(p.world.blocks).filter(x => !x.background && !netcraftData.non_solid_blocks.includes(x.type))) {
                if (intersects.boxLine(block2.x, block2.y, 1, 1, p.x + p.rect().width / 2, p.y, t.x + 0.5, t.y + 0.5)) {
                    return;
                }
            }
            let damage = 1;
            if (p.selectedItem && netcraftData.damage_multipliers[p.selectedItem.item]) damage *= netcraftData.damage_multipliers[p.selectedItem.item];
            if (distanceBetween(t.x, t.y, p.x, p.y) > 6) return p.sendWarning(`You are too far away from target`);
            let fightEvent = {
                attacker: p,
                target: t,
                damage: damage,
                cancel: false,
                targetIsEntity: false,
                attackerIsEntity: false
            };
            Netcraft.emit('fight', fightEvent);
            damage = fightEvent.damage;
            if (fightEvent.cancel) return;
            let mesg = '';
            if (p.selectedItem && p.selectedItem.item) {
                mesg = netcraftData.death_messages.fight_2.replace('%player%', t.username).replace('%fighter%', p.username).replace('%item%', p.selectedItem.item);
            } else {
                mesg = netcraftData.death_messages.fight.replace('%player%', t.username).replace('%fighter%', p.username);
            }
            t.damage(damage, mesg);
        } else if (arr[0] == 'pve') {
            if (!arr[1]) return p.kick(messages.invalid_packet_kick);
            if (!p.world) return;
            let entity = p.world.getEntity(arr[1]);
            if (!entity) return p.send(`delentity?${arr[1]}`);
            for (const block2 of Object.values(p.world.blocks).filter(x => !x.background && !netcraftData.non_solid_blocks.includes(x.type))) {
                if (intersects.boxLine(block2.x, block2.y, 1, 1, p.x + p.rect().width / 2, p.y, entity.x + 0.5, entity.y + 0.5)) {
                    return;
                }
            }
            let damage = 1;
            if (p.selectedItem && netcraftData.damage_multipliers[p.selectedItem.item]) damage *= netcraftData.damage_multipliers[p.selectedItem.item];
            if (distanceBetween(entity.x, entity.y, p.x, p.y) > 6) return p.sendWarning(`You are too far away from target`);
            let fightEvent = {
                attacker: p,
                target: entity,
                damage: damage,
                cancel: false,
                targetIsEntity: true,
                attackerIsEntity: false
            };
            Netcraft.emit('fight', fightEvent);
            if (fightEvent.cancel) return;
            entity.damage(damage, p);
        } else if (arr[0] == 'block_break') {
            if (Number.isNaN(arr[1]) || Number.isNaN(arr[2])) return p.kick(messages.invalid_packet_kick);
            if (!p.world) return;
            let x = parseInt(arr[1]);
            let y = parseInt(arr[2]);
            if (x > MAX_COORDINATE || x < MIN_COORDINATE || y > MAX_COORDINATE || y < MIN_COORDINATE) return;
            if (distanceBetween(x, y, p.x, p.y) > 5 && !p.unlimitedReach) return p.sendWarning('You are too far away from this block');
            let block = p.world.getBlockAt(x, y);
            if (!block) {
                p.sendBlockChange(x, y);
                p.sendWarning(`There is no block at ${x}, ${y}`);
                return;
            }
            if (!p.unlimitedReach) {
                for (const block2 of Object.values(p.world.blocks).filter(x => !x.background && !netcraftData.non_solid_blocks.includes(x.type))) {
                    if (intersects.boxLine(block2.x, block2.y, 1, 1, p.x + p.rect().width / 2, p.y, block.x + 0.5, block.y + 0.5) && block2 != block) {
                        return;
                    }
                }
            }
            let blockbreakEvent = {
                player: p,
                x: x,
                y: y,
                block: block,
                cancel: false
            };
            Netcraft.emit('block_break', blockbreakEvent);
            if (blockbreakEvent.cancel) return;
            if (netcraftData.unbreakable_blocks.includes(block.type)) return;
            if (!p.selectedItem) return p.sendWarning('You need to use a tool');

            if (netcraftData.override_block_items[block.type]) {
                let item = eval(netcraftData.override_block_items[block.type]);
                if (item == false) return;
                p.giveItem(item);
                p.world.setBlockAt(x, y);
            } else {
                p.giveItem(new ItemStack(block.type, 1), !!block.metadata.items);
                if (block.metadata.items) {
                    block.metadata.items.forEach(x => p.giveItem(x, true));
                    p.sendInventory();
                }
                p.world.setBlockAt(x, y);
            }

            Object.values(p.world.getPlayers()).forEach(pl => {
                pl.sendBlockChange(x, y);
            });
        } else if (arr[0] == 'block_place') {
            if (Number.isNaN(arr[1]) || Number.isNaN(arr[2])) return p.kick(messages.invalid_packet_kick);
            if (!p.world) return;
            let x = Math.floor(parseInt(arr[1]) / 32);
            let y = Math.floor(parseInt(arr[2]) / 32);
            if (x > MAX_COORDINATE || x < MIN_COORDINATE || y > MAX_COORDINATE || y < MIN_COORDINATE) return;
            if (distanceBetween(x, y, p.x, p.y) > 5 && !p.unlimitedReach) return p.sendWarning('You are too far away from this block');
            let block = p.world.getBlockAt(x, y);
            if (block) {
                p.sendWarning(`There is block at ${x}, ${y}`);
                return;
            }
            let item = p.selectedItem;
            if (!item) return;
            if (!p.unlimitedReach) {
                for (const block2 of Object.values(p.world.blocks).filter(x => !x.background && !netcraftData.non_solid_blocks.includes(x.type))) {
                    if (intersects.boxLine(block2.x, block2.y, 1, 1, p.x + p.rect().width / 2, p.y, x + 0.5, y + 0.5) && block2.x != x && block2.y != y) {
                        return;
                    }
                }
            }
            if (item.item == 'WHEAT') return;
            if (item.item == 'SEEDS') {
                let under = p.world.getBlockAt(x, y + 1);
                if (!under || under.type != 'DIRT') return;
            }
            for (const pl of p.world.getPlayers()) {
                if (y <= pl.rect().bottom) {
                    let pr = pl.rect();
                    pr.bottom -= 0.1;

                    if (!netcraftData.non_solid_blocks.includes(item.item) && rectangle.intersect(rectangle.fromBlock(new Block(x, y)), pr)) {
                        p.sendWarning(`Block to be placed intersects with a player.`);
                        return;
                    }
                }
            }
            let blockplaceEvent = {
                player: p,
                x: x,
                y: y,
                cancel: false,
                item: item,
                background: false
            };
            Netcraft.emit('block_place', blockplaceEvent);
            if (blockplaceEvent.cancel) return;
            if (netcraftData.blocks.includes(item.item)) {
                let b = netcraftData.override_block_placement[item.item] ? eval(netcraftData.override_block_placement[item.item][0]) : new Block(x, y, item.item, false, {});
                b.background = false;
                p.world.setBlockAt(x, y, b);
                if (!netcraftData.override_block_placement[item.item] || !netcraftData.override_block_placement[item.item][1])
                    p.removeItem(item.item, 1);
                else
                    eval(netcraftData.override_block_placement[item.item][1]);
                for (const player of p.world.getPlayers()) {
                    player.sendBlockChange(x, y, b.type, false, false);
                }
            } else {
                // Not a block
            }
        } else if (arr[0] == 'block_place_bg') {
            if (Number.isNaN(arr[1]) || Number.isNaN(arr[2])) return p.kick(messages.invalid_packet_kick);
            if (!p.world) return;
            let x = Math.floor(parseInt(arr[1]) / 32);
            let y = Math.floor(parseInt(arr[2]) / 32);
            if (x > MAX_COORDINATE || x < MIN_COORDINATE || y > MAX_COORDINATE || y < MIN_COORDINATE) return;
            if (distanceBetween(x, y, p.x, p.y) > 5 && !p.unlimitedReach) return p.sendWarning('You are too far away from this block');
            let block = p.world.getBlockAt(x, y);
            if (block) {
                p.sendWarning(`There is block at ${x}, ${y}`);
                return;
            }
            let item = p.selectedItem;
            if (!item) return;
            
            if (!p.unlimitedReach) {
                for (const block2 of Object.values(p.world.blocks).filter(x => !x.background && !netcraftData.non_solid_blocks.includes(x.type))) {
                    if (intersects.boxLine(block2.x, block2.y, 1, 1, p.x + p.rect().width / 2, p.y, x + 0.5, y + 0.5) && block2.x != x && block2.y != y) {
                        return;
                    }
                }
            }
            if (item.item == 'SEEDS' || item.item == 'WHEAT') return;
            let blockplaceEvent = {
                player: p,
                x: x,
                y: y,
                cancel: false,
                item: item,
                background: true
            };
            Netcraft.emit('block_place', blockplaceEvent);
            if (blockplaceEvent.cancel) return;
            if (netcraftData.blocks.includes(item.item)) {
                let b = netcraftData.override_block_placement[item.item] ? eval(netcraftData.override_block_placement[item.item][0]) : new Block(x, y, item.item, false, {});
                b.background = true;
                p.world.setBlockAt(x, y, b);
                if (!netcraftData.override_block_placement[item.item] || !netcraftData.override_block_placement[item.item][1])
                    p.removeItem(item.item, 1);
                else
                    eval(netcraftData.override_block_placement[item.item][1]);
                for (const player of p.world.getPlayers()) {
                    player.sendBlockChange(x, y, b.type, true, false);
                }
            } else {
                // Not a block
            }
        } else if (arr[0] == 'craft') {

            let recipe = netcraftCraftingRecipes.filter(x => x.output.item == arr[1]);
            if (!recipe) return p.sendWarning('Recipe not found');
            recipe = recipe[0];
            for (const item of recipe.requirement) {
                if (p.inventoryCountOf(item.item) < item.count) {
                    p.sendWarning('Not enough materials');
                    return;
                }
            }
            for (const item of recipe.requirement) {
                p.removeItem(item.item, item.count, true);
            }
            p.giveItem(new ItemStack(recipe.output.item, recipe.output.count));
        } else if (arr[0] == 'furnace' || arr[0] == 'rightclick') {
            if (Number.isNaN(arr[1]) || Number.isNaN(arr[2])) return p.kick(messages.invalid_packet_kick);
            let x = parseInt(arr[1]);
            let y = parseInt(arr[2]);
            if (x > MAX_COORDINATE || x < MIN_COORDINATE || y > MAX_COORDINATE || y < MIN_COORDINATE) return;
            if (distanceBetween(x, y, p.x, p.y) > 5 && !p.unlimitedReach) return p.sendWarning('You are too far away from this block');
            let block = p.world.getBlockAt(x, y);
            if (!block) {
                p.sendWarning(`There is no block at ${x}, ${y}`);
                return;
            }
            let item = p.selectedItem;
            if (!item) return;
            if (!p.unlimitedReach) {
                for (const block2 of Object.values(p.world.blocks).filter(x => !x.background && !netcraftData.non_solid_blocks.includes(x.type))) {
                    if (intersects.boxLine(block2.x, block2.y, 1, 1, p.x + p.rect().width / 2, p.y, block.x + 0.5, block.y + 0.5) && block2 != block) {
                        return;
                    }
                }
            }
            let event = {
                player: p,
                block: block,
                item: item,
                cancel: false
            };
            Netcraft.emit('block_right_click', event);
            if (event.cancel) return;

            if (block.type == 'FURNACE') {
                if (furnaceRecipes[item.item]) {
                    if (p.removeItem('COAL', 1)) {
                        p.giveItem(new ItemStack(furnaceRecipes[item.item], 1), 1);
                        p.removeItem(item.item, 1);
                    } else {
                        p.sendWarning('Not enough coal');
                    }
                }
            } else if (block.type == 'CHEST') {
                if (!block.metadata.items) block.metadata.items = [];
                p.currentChest = block;
                p.send(`chestopen?${block.metadata.items.map(item => item.item + ' x ' + item.count).join('?')}`);
            }

        } else if (arr[0] == 'closechest') {
            if (!p.currentChest) return;
            p.currentChest = null;
        } else if (arr[0] == 'selectitem') {
            let item = arr[1].split(' x ');
            let type = item[0];
            let count = item[1];
            let iitem;
            for (const stack of p.inventory) {
                if (stack.item == type && stack.count.toString() == count) {
                    iitem = stack;
                    break;
                }
            }
            if (!iitem) return p.sendWarning('You don\'t have this item in your inventory.');
            p.selectedItem = iitem;
            p.refreshSelectedItem();
        } else if (arr[0] == 'tochest') {
            if (!p.currentChest) return;
            let item = arr[1].split(' x ');
            let type = item[0];
            let count = item[1];
            let iitem;
            for (const stack of p.inventory) {
                if (stack.item == type && stack.count.toString() == count) {
                    iitem = stack;
                    break;
                }
            }
            if (!iitem) return p.sendWarning('You don\'t have this item in your inventory.');
            p.inventory = p.inventory.filter(i => i.id != iitem.id);
            let a;
            for (const stack of p.currentChest.metadata.items) {
                if (iitem.item == stack.item && JSON.stringify(iitem.metadata) == JSON.stringify(stack.metadata)) {
                    a = stack;
                    break;
                }
            }
            if (a) {
                p.currentChest.metadata.items = p.currentChest.metadata.items.filter(x => x.id != a.id);
                iitem.count += a.count;
            }
            p.currentChest.metadata.items.push(iitem);
            p.sendInventory(true);
            p.packetQueue.push(`chestupdate?${p.currentChest.metadata.items.map(item => item.item + ' x ' + item.count).join('?')}`);
            p.sendQueue();
        } else if (arr[0] == 'fromchest') {
            if (!p.currentChest) return;
            let item = arr[1].split(' x ');
            let type = item[0];
            let count = item[1];
            let iitem;
            for (const stack of p.currentChest.metadata.items) {
                if (stack.item == type && stack.count.toString() == count) {
                    iitem = stack;
                    break;
                }
            }
            if (!iitem) return p.sendWarning('There is no this item in current chest.');
            p.currentChest.metadata.items = p.currentChest.metadata.items.filter(i => i.id != iitem.id);
            p.giveItem(iitem, true);
            p.sendInventory(true);
            p.packetQueue.push(`chestupdate?${p.currentChest.metadata.items.map(item => item.item + ' x ' + item.count).join('?')}`);
            p.sendQueue();
        } else if (arr[0] == 'respawn') {
            if (p.health == 0) {
                p.respawn();
            }
        } else if (arr[0] == 'experiments') {
            if (arr[1] == 'save') {
                p.world.saveExperimental('world');
            }  
        } else {
            console.warn(`Received unknown or unsupported packet from ${p.username ?? 'Unknown'}: ${data}`);
        }
    }

    client.on('error', () => {
        delete players[p.username];
        if (!p.username || p.kicked) return;
        console.log(`${p.username ?? 'Unknown'} left the game`);
        if (p.world) p.world.broadcastPacket(`removeplayer?${p.username}`);
        p.kick(`Socket error`);
    });

    client.on('data', onData);
});

server.listen(config.port);

console.log(`Listening on ${config.port}`);
console.log(`Netcraft.js ${NJS_VERSION} for Netcraft ${NETCRAFT_VERSION} started successfully`);
Netcraft.emit('server_start');