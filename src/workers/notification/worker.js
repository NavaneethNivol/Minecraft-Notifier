const electron = require('electron');
const io = require('socket.io-client');

const ipcRenderer = electron.ipcRenderer;

let message2UI = (command, payload) => {
    ipcRenderer.send('message-from-notification-worker', {
        command: command, payload: payload
    });
}

const socket = io.connect(`http://34.87.151.12:5000/`, {
    reconnection: true,
    query: {
        token: "FEND13182414"
    }
});


socket.on('connect', function () {

    console.log('Connected to Minecraft Server.');

    message2UI('server-status', { status: true });

    socket.emit('get-players', 'Get players from server');

    socket.on('login', function (data) {
        console.log(`${data.player} Joined the game.`);
        new window.Notification(`${data.player} Joined the game.`, {
            body: 'Lets catch up?'
        });
    });

    socket.on('logout', function (data) {
        console.log(`${data.player} Left the game.`);
        new window.Notification(`${data.player} Left the game.`, {
            body: ':('
        });
    });

    socket.on('players', function (players) {
        console.log(`Online Players: ${players.filter(x => x.name)}`);

        message2UI('players', { players: players });
    });

});


socket.on('disconnect', (err) => {
    console.log('Disconnected from Minecraft Server.');
    message2UI('server-status', { status: false });
    new window.Notification(`Minecraft Server went offline`, {
        body: '*_*'
    });
    if (err) {
        console.log(err);
    }
});