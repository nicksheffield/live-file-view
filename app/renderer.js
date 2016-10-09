// var ip = require('ip')
var $ = require('jquery')
var shell = require('electron').shell
var adapter = require('os').networkInterfaces()

if(adapter.en5) ip = adapter.en5[1].address
if(adapter.en0) ip = adapter.en0[1].address

$('.ip')
	.text(ip + ':3000')
	.on('click', function() {
		shell.openExternal('http://' + ip + ':3000')
	})
	
var ipcRenderer = require('electron').ipcRenderer

ipcRenderer.send('request-io-update')
ipcRenderer.send('get-folders')

ipcRenderer.on('user-connection', function(event, data) {
	$('.count').text(data.count)
})

ipcRenderer.on('list-folders', function(event, folders) {
	folders = folders.reverse()
	
	$('.folders').empty()
	
	folders.forEach(function(folder) {
		$('.folders').append('<option value="'+folder+'">'+folder+'</option>')
	})
})

$('.choose-btn').on('click', function() {
	ipcRenderer.send('open-file-dialog')
})

ipcRenderer.on('selected-directory', function (event, path) {
	if(path) {
		$('.dir').text(path)
	}
	
	ipcRenderer.send('get-folders')
})

document.ondragover = document.ondrop = (ev) => {
	ev.preventDefault()
}

document.body.ondrop = (ev) => {
	console.log(ev.dataTransfer.files[0].path)
	ev.preventDefault()
	ipcRenderer.send('drop-folder', ev.dataTransfer.files[0].path)
}