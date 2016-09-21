// Alias
// alias live="node ~/desktop/live-file-view"

// ------------------------------------------------------------
//   Dependencies
// ------------------------------------------------------------
var pwd         = process.env.PWD + '/'

var _           = require('lodash')
var fs          = require('fs')
var express     = require('express')
var app         = express()
var http        = require('http').Server(app)
var io          = require('socket.io')(http)
var watcher     = require('fsevents')(pwd)
var bodyParser  = require('body-parser')
var chalk       = require('chalk')


// ------------------------------------------------------------
//   FS Events
// ------------------------------------------------------------
watcher.start()

watcher.on('change', function(path, info) {
	var simplePath = path
	var filename = simplePath.split('/')[simplePath.split('/').length-1]
	
	console.log(filename, chalk.yellow(info.flags), chalk.green(info.event))
	
	if(info.event == 'modified') {
		io.emit('fschange', {path: simplePath})
		return
	}
	
	io.emit('fsupdate')
})


// ------------------------------------------------------------
//   Middleware
// ------------------------------------------------------------
app.use(express.static(__dirname+'/public/'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// ------------------------------------------------------------
//   Express API
// ------------------------------------------------------------
app.get('/api/files', function(req, res) {
	var files = findFiles({path: pwd})
	
	res.send(files)
})

app.post('/api/get_file', function(req, res) {
	res.send(fs.readFileSync(req.body.path, 'utf-8'))
})


// ------------------------------------------------------------
//   Default ignored folders and files
// ------------------------------------------------------------
var defaultIgnore = [
	'.DS_Store',
	'node_modules/',
	'vendor/',
	'storage/',
	'.git/',
	'sftp_config.json',
	'sublime.project-workspace'
]


// ------------------------------------------------------------
//   Load sublime-project files
// ------------------------------------------------------------
var rootFiles = fs.readdirSync(pwd)
var sublimeProject = {
	"folders": [
		{
			"folder_exclude_patterns": [],
			"file_exclude_patterns": []
		}
	]
}

_.forEach(rootFiles, function(file) {
	var sublimeProjectPattern = /[a-zA-Z0-9\_\-]+.sublime-project/
	
	if(sublimeProjectPattern.test(file)) {
		sublimeProject = JSON.parse(fs.readFileSync(file, "utf8"))
	}
})

function checkIfExcludedFolder(path) {
	for(var i=0; i<sublimeProject.folders.length; i++) {
		var projectFolder = sublimeProject.folders[i]
		
		if(_.indexOf(projectFolder.folder_exclude_patterns, path.substring(0, path.length-1)) !== -1) {
			return true
		}
	}
}

function checkIfExcludedFile(path) {
	for(var i=0; i<sublimeProject.folders.length; i++) {
		var projectFolder = sublimeProject.folders[i]
		
		if(_.indexOf(projectFolder.file_exclude_patterns, path) !== -1) {
			return true
		}
	}
}


// ------------------------------------------------------------
//   Recursive Datastructure for Dirs and Files
// ------------------------------------------------------------
function findFiles(folder) {
	var paths = fs.readdirSync(folder.path)
	var files = []

	paths.forEach(function(path) {
		var thing = {}
		var stat = fs.lstatSync(folder.path + path)
		var name = path + (stat.isDirectory() ? '/' : '')
		
		thing.type = stat.isFile() ? 'file' : 'directory'
		thing.path = folder.path + name
		thing.name = name
		thing.shortpath = thing.path.replace(pwd, '')
		
		if(defaultIgnore.indexOf(name) !== -1) return
			
		if(thing.type == 'file') {
			if(checkIfExcludedFile(thing.shortpath)) {
				console.log('excluded file', thing.shortpath)
				return
			}
		} else {
			if(checkIfExcludedFolder(thing.shortpath)) {
				console.log('excluded folder', thing.shortpath)
				return
			}
		}
		
		if(thing.type == 'directory') {
			thing.files = findFiles(thing)
		}
		
		files.push(thing)
	})
	
	return _.sortBy(files, function(file) {
		return file.type !== 'directory'
	})
}


// ------------------------------------------------------------
//   Socket.IO
// ------------------------------------------------------------
io.on('connection', function(socket) {
	console.log('A user connected', socket.id)
	socket.emit('connected')
	socket.emit('fsupdate')
})


// ------------------------------------------------------------
//   Start the Server
// ------------------------------------------------------------
http.listen(3000, function() {
	var ip = ''
	var mode = ''
	var adapter = require('os').networkInterfaces()

	console.log(adapter)
	
	if(adapter.en0) {
		ip = adapter.en0[1].address
	}
	
	if(adapter.en5) {
		ip = adapter.en5[1].address
	}
	
	var msg = '║        Live File Watcher'
	var local = '║    local: '+chalk.yellow('http://localhost:'+3000)
	var pub = '║  ip: '+chalk.yellow('http://'+ip+':'+3000)
	var max = _.max([msg.length, local.length, pub.length])

	var dashes = repeat(max-10, '═')
	
	function rSpace(str, len) {
		var amount = len - str.length;
		var oStr = ''
		for(var i=0; i<amount; i++){oStr += ' '}
		return oStr
	}
	
	function repeat(n, str) {
		var oStr = ''
		for(var i=0; i<n; i++) {
			oStr += str
		}
		return oStr
	}

	console.log('')
	console.log(' ' + pwd + ' ')
	console.log('')
	console.log('╔' + dashes + '╗')
	console.log('║' + repeat(max-10, ' ') + '║')
	console.log(msg + rSpace(msg, max-10) + ' ║')
	console.log('║' + repeat(max-10, ' ') + '║')
	// console.log(local + rSpace(local, max) + ' ║')
	console.log(pub + rSpace(pub, max) + ' ║')
	console.log('║' + repeat(max-10, ' ') + '║')
	console.log('╚' + dashes + '╝')
})