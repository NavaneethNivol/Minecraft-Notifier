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

        var taglines = [
            'Lets catch up?',
            'Wanna play?'
        ]

        new window.Notification(`${data.player} Joined the game.`, {
            body: taglines[[Math.floor(Math.random() * taglines.length)]]
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

    socket.on('backup', function (data) {

        var body = '';
        var title = '';

        var taglines = [
            'Hang tight',
            'Hold still',
            'Just bear with me',
            'Wait a little',
            'Be patient',
            'Just a minute',
            'Sit tight',
            'Please wait'
        ]

        if (!data.done) {
            title = "Automatic backup has started";
            body = taglines[[Math.floor(Math.random() * taglines.length)]];
        }
        else if(data.done && data.status == 'completed') {
            title = "Backup Completed";
            body = data.backup_name;
        }
        else if (data.done && data.status == 'failed') {
            title = "Backup Failed";
            body = data.error;
        }

        new window.Notification(title, {
            body: body
        });

    });
});


socket.on('disconnect', (err) => {
    console.log('Disconnected from Minecraft Server.');
    message2UI('server-status', { status: false });
    if (err) {
        console.log(err);
    }
});