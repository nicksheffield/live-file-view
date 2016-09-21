var electron = require('electron')
var app = electron.app
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

var ipcMain = require('electron').ipcMain

var mainApp = require('./app')

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
