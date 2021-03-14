const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}


function sendWindowMessage(targetWindow, message, payload) {
  if (typeof targetWindow === 'undefined') {
    console.log('Target window does not exist');
    return;
  }
  targetWindow.webContents.send(message, payload);
}


let mainWindow, workerWindow, tray;
let force_quit = false;
let server_status = false;
let backup_inprogress = false;
let active_players = [];


const createWindow = () => {

  if (app.dock) app.dock.hide();

  mainWindow = new BrowserWindow({
    width: 350,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(app.getAppPath(), 'src/render.js')
    },
    resizable: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.setBackgroundColor('#1E1F20')

  mainWindow.on('close', (event) => {
    if (!force_quit) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('before-quit', (event) => {
    if (!force_quit) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // mainWindow.webContents.openDevTools();

  // ---------------------- Notification Worker ---------------------- //

  workerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(app.getAppPath(), 'src/workers/notification/worker.js')
    }
  });

  workerWindow.loadFile(path.join(__dirname, 'worker.html'));

  ipcMain.on('message-from-notification-worker', (event, arg) => {

    if (arg.command == 'server-status') {
      if (arg.payload.status) {
        server_status = true;
      }
      else {
        server_status = false;
        active_players = [];
      }
    }
    else if (arg.command == 'players') {
      active_players = arg.payload.players;
    }
    else if (arg.command == 'server-status') {
      if (arg.payload.status) {
        server_status = true;
      }
      else {
        server_status = false;
      }
    }
    else if (arg.command == 'backup') {

      if (arg.payload.done) {
        backup_inprogress = false;
      }
      else {
        backup_inprogress = true;
      }
    }

    updateMenu();

    sendWindowMessage(mainWindow, 'message-from-notification-worker', arg);
  });

  tray = new Tray(path.join(app.getAppPath(), 'src/images/offline.png'));

  tray.setToolTip('Minecraft Notifier')

  updateMenu();

};


function updateMenu() {

  let items = []

  if (server_status) {

    tray.setImage(path.join(app.getAppPath(), 'src/images/online.png'));

    items.push({
      label: 'Server is Online',
      enabled: false
    });
  }
  else {

    tray.setImage(path.join(app.getAppPath(), 'src/images/offline.png'));

    items.push({
      label: 'Server is Offline',
      enabled: false
    });
  }

  if (backup_inprogress) {
    items.push({
      label: 'Backup is in progress...',
      enabled: false
    });
  }

  items.push({ type: 'separator' });

  items.push({
    label: 'Dashboard',
    click() {
      mainWindow.show();
    }
  });

  if (active_players.length > 0) {

    items.push({
      label: 'Players',
      submenu: active_players.map((item) => {
        return { label: item.name };
      })
    });

  }
  else {

    if (server_status) {
      items.push({
        label: 'Players',
        submenu: [{ label: 'No active players.', enabled: false }]
      });
    }
    else {
      items.push({
        label: 'Players',
        submenu: [{ label: 'Unable to retrive data.', enabled: false }]
      });
    }
  }

  items.push({ type: 'separator' });

  items.push({
    label: 'Quit',
    click() {
      force_quit = true;
      app.quit();
    },
    accelerator: 'CommandOrControl+Q'
  });

  const contextMenu = Menu.buildFromTemplate(items);
  tray.setContextMenu(contextMenu);

  if (process.platform === 'win32') {
    tray.on('click', tray.popUpContextMenu(contextMenu));
  }

}


app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});