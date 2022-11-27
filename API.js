const EventEmitter = require('events').EventEmitter;
class API extends EventEmitter {
    constructor() {
        super();
    }

    getPlayer(name) {}
    getWorld() {}
    setBanned(name, value) {}
    isBanned(name) {}
    getServer() {}

    getPlayers() {
        return Object.values(players);
    }

    broadcastMessage(mesg) {
        console.log(`[API Broadcast] ${mesg}`);
        this.getPlayers().forEach(p => {
            p.sendMessage(mesg);
        })
    }
}
module.exports = API;