var electron      = require('electron')
var low           = require('lowdb')
var mkdirp        = require('mkdirp')
var mainApp       = require('./live-file-view')
var fs            = require('fs')

var app           = electron.app
var dialog        = electron.dialog
var ipcMain       = electron.ipcMain
var BrowserWindow = electron.BrowserWindow

var mainWindow

var dataDir = app.getPath('appData') + '/live-file-view'

if(!fs.readdirSync(dataDir)) {
	mkdirp(dataDir)
}

var db = low(dataDir + '/db.json')

db.defaults({ folders: [] }).value()

app.on('ready', function () {
	mainWindow = new BrowserWindow({width: 800, height: 600})
	mainWindow.loadURL(`file://${__dirname}/app/app.html`)
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

ipcMain.on('open-file-dialog', function(event) {
	var window = BrowserWindow.fromWebContents(event.sender)
	var files = dialog.showOpenDialog(window, { properties: [ 'openDirectory' ]})
	
	setFolder(event, files)
})

ipcMain.on('drop-folder', function(event, path) {
	setFolder(event, [path])
})

function setFolder(event, path) {
	event.sender.send('selected-directory', path)
	mainApp.setFolder(path)
	
	// console.log('folders', db.get('folders'))
	// db.get('folders')
	// 	.push(path[0])
	// 	.value()
	
	var data = db.getState()
	
	if(data.folders.indexOf(path[0]) == -1) {
		data.folders.push(path[0])
		db.value()
	}
}