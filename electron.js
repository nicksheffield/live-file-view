var electron      = require('electron')
var mainApp       = require('./app')

var app           = electron.app
var dialog        = electron.dialog
var ipcMain       = electron.ipcMain
var BrowserWindow = electron.BrowserWindow

var mainWindow

app.on('ready', function () {
	mainWindow = new BrowserWindow({width: 800, height: 600})
	mainWindow.loadURL(`file://${__dirname}/public/app.html`)
	mainWindow.on('closed', function () {
		mainWindow = null
	})
})

app.on('window-all-closed', function () {
	app.quit()
})

mainApp.io.on('connection', function(socket) {
	mainWindow.webContents.send('user-connection', {
		id: socket.id,
		count: mainApp.io.engine.clientsCount
	})
	
	socket.on('disconnect', function() {
		mainWindow.webContents.send('user-connection', {
			id: socket.id,
			count: mainApp.io.engine.clientsCount
		})
	})
})

ipcMain.on('request-io-update', function(event) {
	event.sender.send('user-connection', {
		count: mainApp.io.engine.clientsCount
	})
})

ipcMain.on('open-file-dialog', function (event) {
	var window = BrowserWindow.fromWebContents(event.sender)
	var files = dialog.showOpenDialog(window, { properties: [ 'openDirectory' ]})
	
	event.sender.send('selected-directory', files)
	mainApp.setFolder(files)
})

ipcMain.on('drop-folder', function (event, path) {
	event.sender.send('selected-directory', [path])
	mainApp.setFolder([path])
})