const ItemStack = require('./ItemStack');
const Encode = require('./Encode');
const messages = require('./messages.json');

const fs = require('fs');

class Player {
    constructor(socket) {
        this.socket = socket;
        this.x = 0;
        this.y = 0;
        this.inventory = [new ItemStack('WOODEN_AXE', 1), new ItemStack('WOODEN_PICKAXE', 1)];
        this.selectedItem = this.inventory[0];
        this.health = 100;
        this.foodLevel = 100;
        this.packetQueue = [];
        this.world = null;
        this.isSpectator = false;
        this.noMoveCheck = false;
        this.ready = false;
        this.rect = () => {
            return {
                left: this.x,
                top: this.y,
                right: this.x + (32 / 32),
                bottom: this.y + (40 / 32),
                width: 32 / 32,
                height: 40 / 32
            };
        };
        this.noClip = false;
        this.unlimitedReach = false;
        this.isAdmin = false;
        this.kicked = false;
    }

    username;
    skinUrl;
    uuid;
    x;
    y;
    inventory;
    selectedItem;
    health;
    foodLevel;
    packetQueue;
    world;
    isSpectator;
    noMoveCheck;
    ready;
    rect;
    noClip;
    unlimitedReach;
    socket;
    language;
    isAdmin;
    currentChest;
    kicked;

    teleportToWorld(w) {
        if (process.env.NJSTEST == "yes") {
            this.setNoClip(true);
        }
        let worldEvent = {
            player: this,
            from: this.world,
            to: w,
            cancel: false
        };
        Netcraft.emit('player_world_change', worldEvent);
        if (worldEvent.cancel) return;
        const that = this;
        if (this.world) {
            this.packetQueue.push(`unload`);
            delete this.world.players[this.username];
            this.world.broadcastPacket(`removeplayer?${this.username}`); // сообщить всем, что этот чел сваливает
            for (const p of Object.keys(this.world.players)) {
                if (!p) continue;
                this.packetQueue.push(`removeplayer?${p}`);
            }
            for (const p of Object.keys(this.world.entities)) {
                if (!p) continue;
                this.packetQueue.push(`delentity?${p}`);
            }
            for (const p of Object.values(this.world.blocks)) {
                if (!p) continue;
                this.sendBlockChange(p.x, p.y, null, false, true);
            }
        }
        this.world = w;
        this.x = 0;
        this.y = 0;
        if (this.world) {
            for (const p of w.getPlayers()) {
                if (!p) continue;
                this.packetQueue.push(`addplayer?${p.username}?${p.skinUrl}`);
                this.packetQueue.push(`updateplayerposition?${p.username}?${p.x}?${p.y}`);
                this.packetQueue.push(`itemset?${p.username}?${p.selectedItem ? p.selectedItem.item : 'nothing'}`);
            }
            for (const p of w.getEntities()) {
                if (!p) continue;
                this.packetQueue.push(`addentity?${p.id}?${p.type}`);
                this.packetQueue.push(`moveentity?${p.id}?${p.x * 32}?${p.y * 32}`);
            }
            // for (const p of Object.values(this.world.blocks)) {
            //     if (!p) continue;
            //     this.sendBlockChange(p.x, p.y, p.type, p.background, true);
            // }
            this.sendWorldPiece(Math.floor(this.x / this.viewDistanceX) * this.viewDistanceX, Math.floor(this.x / this.viewDistanceX + 1) * this.viewDistanceX,
                Math.floor(this.y / this.viewDistanceY) * this.viewDistanceY, Math.floor(this.y / this.viewDistanceY + 1) * this.viewDistanceY);
            this.world.players[this.username] = this;
            this.packetQueue.push(`updatecraftable?${netcraftCraftingRecipes.map(x => x.output.item).join('?')}`);
        }
        this.packetQueue.push(`teleport?0?0`);
        this.packetQueue.push(`completeload`);
        this.sendQueue();
        if (this.world) {
            for (const p of w.getPlayers()) {
                if (!p) continue;
                if (p.uuid != this.uuid) {
                    p.packetQueue.push(`addplayer?${this.username}?${this.skinUrl}`);
                    p.packetQueue.push(`updateplayerposition?${this.username}?0?0`);
                    p.packetQueue.push(`itemset?${this.username}?${this.selectedItem ? this.selectedItem.item : 'nothing'}`);
                    p.sendQueue();
                }
            }
        }
    }

    setAdmin(value) {
        if (typeof value != 'boolean') throw new Error('value must be boolean');
        this.isAdmin = value;
        if (value) {
            this.sendMessage('You are now server admin');
        } else {
            this.sendMessage('You are no longer being server admin')
        }
    }

    save() {
        return JSON.stringify({
            name: this.username,
            x: this.x,
            y: this.y,
            inv: this.inventory,
            adm: this.isAdmin
        });
    }

    loadFrom(data) {
        let d = JSON.parse(data);
        this.teleport(d.x, d.y);
        this.inventory = d.inv;
        this.sendInventory();
        this.isAdmin = d.adm;
    }

    send(data) {
        let packetEvent = {
            player: this,
            data: data,
            cancel: false
        };
        Netcraft.emit('player_packet_sent', packetEvent);
        data = packetEvent.data;
        if (packetEvent.cancel) return;
        if (this.socket.writable) this.socket.write(Encode.encrypt(data) + '\n', 'utf-8');
    }

    sendLog(mesg) {
        this.send(`evalresult?${mesg}`);
    }

    sendQueue() {
        this.send(this.packetQueue.join('\n'));
        this.packetQueue = [];
    }

    receive(callback) {
        let a = (data) => {
            callback(Encode.decrypt(data.toString('utf-8')));
            this.socket.off('data', a);
        };
        this.socket.on('data', a);
    }

    setNoClip(value) {
        this.noClip = value;
        if (value) this.send('noclip');
        else this.send('clip');
    }

    setHealth(value, mesg) {
        let healthEvent = {
            player: this,
            oldValue: this.health,
            newValue: value,
            cancel: false
        };
        Netcraft.emit('player_health', healthEvent);
        if (healthEvent.cancel) return;
        value = healthEvent.newValue;
        if (value <= 0) {
            this.health = 0;
            this.kill(mesg);
            return;
        }
        this.health = value;
        this.send(`health?${value}`);
    }

    damage(d, mesg) {
        this.setHealth(this.health - d, mesg);
    }

    kill(mesg) {
        let killEvent = {
            player: this,
            cancel: false
        };
        Netcraft.emit('player_death', killEvent);
        if (killEvent.cancel) return;
        this.sendDeathScreen(mesg, true);
        this.diedInWorld = this.world;
        this.teleportToWorld(null);
        if (mesg) this.diedInWorld.broadcastChat(mesg.replace('%player%', this.username));
    }

    respawn() {
        this.setHealth(100);
        this.teleportToWorld(this.diedInWorld ?? Netcraft.getWorld());
    }

    sendDeathScreen(text, q) {
        if (q) this.packetQueue.push(`deathscreen?${text}`);
        else this.send(`deathscreen?${text}`);
    }

    sendWarning(text) {
        this.send(`dowarn?${text}`);
    }

    sendMessage(message) {
        this.send(message.split('\n').map(x => `chat?${x}`).join('\n'));
    }

    teleport(x, y) {
        let playerTeleportEvent = {
            player: this,
            from: {
                x: this.x,
                y: this.y
            },
            to: {
                x: x,
                y: y
            },
            cancel: false
        };
        Netcraft.emit('player_teleport', playerTeleportEvent);
        if (playerTeleportEvent.cancel) return;
        this.x = playerTeleportEvent.to.x;
        this.y = playerTeleportEvent.to.y;
        this.send(`teleport?${x * 32}?${y * 32}`);
    }

    sendInventory(q) {
        let sendInventoryEvent = {
            player: this,
            cancel: false
        };
        Netcraft.emit('player_send_inventory', sendInventoryEvent);
        if (sendInventoryEvent.cancel) return;
        this.packetQueue.push('clearinventory');
        for (const stack of this.inventory) {
            this.packetQueue.push(`additem?${stack.item} x ${stack.count}`);
        }
        if (!q) this.sendQueue();
    }

    refreshSelectedItem() {
        if (this.world) this.world.broadcastPacket(`itemset?${this.username}?${this.selectedItem ? this.selectedItem.item : 'nothing'}`, (p) => p.ready == true && p.uuid != this.uuid);
        this.send(`itemset?@?${this.selectedItem ? this.selectedItem.item : 'nothing'}`);
    }

    sendDialogMessage(text, type) {
        if (!type || type == 'info') {
            this.send(`msg?${text}`);
        } else if (type == 'warn') {
            this.send(`msgwarn?${text}`);
        } else if (type == 'error') {
            this.send(`msgerror?${text}`);
        } else {
            return false;
        }
        return true;
    }

    kick(reason) {
        let event = {
            player: this,
            reason: reason,
            cancel: false
        };
        Netcraft.emit('player_disconnect', event);
        if (event.cancel) return;
        reason = event.reason;
        if (this.username) console.log(`${this.username} has been kicked.${reason ? ` Reason: ${reason}` : ''}`);
        this.send(`msgkick?${reason ?? 'Kicked from server'}`);
        if (this.ready && this.username) broadcastChat(messages.broadcast_leave.replace('PLAYER', this.username ?? 'Unknown'));

        if (this.ready && this.username) fs.writeFileSync(`./players/${this.username}.json`, this.save());

        this.send = () => { };
        this.kicked = true;
        this.teleportToWorld(null);

        this.ready = false;
        this.socket.destroy();
    }

    giveItem(item, noupd) {
        if (!item) return;
        let a;
        for (const stack of this.inventory) {
            if (stack.item == item.item && JSON.stringify(stack.metadata) == JSON.stringify(item.metadata)) {
                a = stack;
                break;
            }
        }
        if (a) {
            item.count += a.count;
            this.inventory = this.inventory.filter(x => x.id != a.id);
        }
        this.inventory.push(item);
        if (!noupd) this.sendInventory();
    }

    removeItem(type, count, noupd) {
        if (!count) count = 2147483647;
        let a;
        for (const stack of this.inventory) {
            if (stack.item == type) {
                a = stack;
                break;
            }
        }
        if (a) {
            this.inventory = this.inventory.filter(x => x.id != a.id);
            a.count -= count;
            if (a.count > 0) {
                this.inventory.push(a);
                this.selectedItem = a;
            } else {
                if (a.id == this.selectedItem.id) {
                    this.selectedItem = null;
                }
            }
            if (!noupd) this.sendInventory();
            return true;
        }
        return false;
    }

    inventoryCountOf(type) {
        let len = 0;
        for (const stack of this.inventory) {
            if (stack.item == type) {
                len += stack.count;
            }
        }
        return len;
    }

    worldPieceSent;
    viewDistanceX = 24;
    viewDistanceY = 12;
    sendWorldPiece(minX, maxX, minY, maxY, resend) {
        if (!resend && this.worldPieceSent && this.worldPieceSent[0] == minX && this.worldPieceSent[1] == maxX && this.worldPieceSent[2] == minY && this.worldPieceSent[3] == maxY) return;
        for (const block of Object.values(this.world.blocks)) {
            if (block.x >= minX - 4 && block.x <= maxX + 4 &&
                block.y >= minY - this.viewDistanceY / 2 && block.y <= maxY + this.viewDistanceY / 2) {
                this.sendBlockChange(block.x, block.y, block.type, block.background, true);
            } else {
                if (this.worldPieceSent && block.x >= this.worldPieceSent[0] - 4 && block.x <= this.worldPieceSent[1] + 4 &&
                    block.y >= this.worldPieceSent[2] - this.viewDistanceY / 2 && block.y <= this.worldPieceSent[3] + this.viewDistanceY / 2) {
                    this.sendBlockChange(block.x, block.y, false, false, true);
                }
            }
        }
        this.sendQueue();
        this.worldPieceSent = [minX, maxX, minY, maxY]
    }

    sendBlockChange(x, y, m, bg, queue) {
        let blockChangeEvent = {
            player: this,
            cancel: false,
            x: x,
            y: y,
            type: m,
            background: bg
        };
        Netcraft.emit('player_block_change_sent', blockChangeEvent);
        if (blockChangeEvent.cancel) return;
        m = blockChangeEvent.type;
        bg = blockChangeEvent.background;
        if (!m || m == 'AIR') {
            let d = `removeblock?${x}?${y}`;
            if (!queue)
                this.send(d);
            else
                this.packetQueue.push(d);
            return;
        }
        var nonsolid = false;
        if (netcraftData.non_solid_blocks.includes(m)) nonsolid = true;
        var t = m;
        if (m == "BEDROCK")
            t = "bedrock";
        if (m == "STONE")
            t = "stone";
        if (m == "DIRT")
            t = "dirt";
        if (m == "PLANKS")
            t = "planks";
        if (m == "WOOD")
            t = "wood";
        if (m == "GRASS_BLOCK")
            t = "grass_block";
        if (m == "SNOWY_GRASS_BLOCK")
            t = "snowygrass";
        if (m == "NETCRAFT_BLOCK")
            t = "netcraft_block";
        if (m == "SNOWY_NETCRAFT_BLOCK")
            t = "netcraft_block_snowy";
        if (m == "COBBLESTONE")
            t = "cobble";
        if (m == "LEAVES")
            t = "leaves";
        if (m == "COAL_ORE")
            t = "coal_ore";
        if (m == "IRON_ORE")
            t = "iron_ore";
        if (m == "DIAMOND_ORE")
            t = "diamond_ore";
        if (m == "OBSIDIAN")
            t = "obsidian";
        if (m == "SAND")
            t = "sand";
        if (m == "END_STONE")
            t = "endstone";
        if (m == "GLASS")
            t = "glass";
        if (m == "GRAVEL")
            t = "gravel";
        if (m == "FIRE") {
            t = "fire";
            nonsolid = true;
        }
        if (m == "GOLD_ORE")
            t = "gold_ore";
        if (m == "FURNACE")
            t = "furnace";
        if (m == "IRON_BLOCK")
            t = "iron_block";
        if (m == "DIAMOND_BLOCK")
            t = "diamond_block";
        if (m == "GOLD_BLOCK")
            t = "gold_block";
        if (m == "TNT")
            t = "tnt";
        if (m == "SEEDS") {
            t = "wheat0";
            nonsolid = true;
        }
        if (m == "WHEAT") {
            t = "wheat7";
            nonsolid = true;
        }
        if (m == "CHEST")
            t = "chest";
        if (m == "SAPLING") {
            t = "sapling";
            nonsolid = true;
        }
        if (m == "WATER") {
            t = "water";
            nonsolid = true;
        }
        if (m == "LAVA") {
            t = "lava";
            nonsolid = true;
        }
        if (m == "RED_FLOWER") {
            t = "poppy";
            nonsolid = true;
        }
        if (m == "YELLOW_FLOWER") {
            t = "dandelion";
            nonsolid = true;
        }
        t = t.toLowerCase();
        let data = `blockchange?${x}?${y}?${t ?? m}${bg ? '?bg' : '?fg'}${nonsolid ? '-non-solid' : '-solid'}`;
        if (queue)
            return this.packetQueue.push(data);
        this.send(data);
    }
}
module.exports = Player;