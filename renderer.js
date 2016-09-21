var ip = require('ip')
var $ = require('jquery')
var shell = require('electron').shell

$('.ip')
	.text(ip.address()+':3000')
	.on('click', function() {
		shell.openExternal('http://'+ip.address()+':3000')
	})
	
var ipcRenderer = require('electron').ipcRenderer

ipcRenderer.send('request-io-update')

ipcRenderer.on('user-connection', function(event, data) {
	$('.count').text(data.count)
})

$('.choose-btn').on('click', function() {
	ipcRenderer.send('open-file-dialog')
})

ipcRenderer.on('selected-directory', function (event, path) {
	if(path) {
		$('.dir').text(path)
	}
})

document.ondragover = document.ondrop = (ev) => {
	ev.preventDefault()
}

document.body.ondrop = (ev) => {
	console.log(ev.dataTransfer.files[0].path)
	ev.preventDefault()
	ipcRenderer.send('drop-folder', ev.dataTransfer.files[0].path)
}