const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleRequest } = require('./app/controller/rpa/sendVideo');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'src/renderer.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('src/index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// 接收渲染进程的数据
ipcMain.once('start-upload', async (event, { phone, videoUrl, title, desc }) => {
    try {
        // 调用 sendVideo.js 的 handleRequest
        await handleRequest(phone, videoUrl, title, desc);
        event.sender.send('upload-success', 'Video upload started successfully');
    } catch (error) {
        console.error('Error in video upload:', error);
        event.sender.send('upload-failure', 'Failed to start video upload' + error);
    }
});