// ------------------------------------------------------------
//   Dependencies
// ------------------------------------------------------------
var pwd         = process.env.PWD + '/'

var _           = require('lodash')
var fs          = require('fs')
var express     = require('express')
var exapp       = express()
var http        = require('http').Server(exapp)
var io          = require('socket.io')(http)
var chokidar    = require('chokidar')
var bodyParser  = require('body-parser')
var chalk       = require('chalk')


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
	'project.sublime-workspace'
]


// ------------------------------------------------------------
//   Load sublime-project files
// ------------------------------------------------------------
var rootFiles = fs.readdirSync(pwd)

var sublimeProjectPattern = /[a-zA-Z0-9\_\-]+.sublime-project/

var sublimeProject = {
	"folders": [
		{
			"folder_exclude_patterns": [],
			"file_exclude_patterns": []
		}
	]
}

_.forEach(rootFiles, function(file) {
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
//   FS Events
// ------------------------------------------------------------
chokidar.watch(pwd, {ignored: defaultIgnore.map((str) => pwd+str), ignoreInitial: true}).on('all', (event, path) => {
	console.log('chokidar', event, path);
	
	var simplePath = path
	var filename = simplePath.split('/')[simplePath.split('/').length-1]
	
	if(sublimeProjectPattern.test(simplePath.replace(pwd, ''))) {
		sublimeProject = JSON.parse(fs.readFileSync(path, "utf8"))
		io.emit('fsupdate')
	}
	
	if(event == 'change') {
		io.emit('fschange', {path: simplePath})
		return
	}
	
	io.emit('fsupdate')
});


// ------------------------------------------------------------
//   Middleware
// ------------------------------------------------------------
exapp.use(express.static(__dirname+'/public/'))
exapp.use(bodyParser.json());
exapp.use(bodyParser.urlencoded({ extended: true }));


// ------------------------------------------------------------
//   Express API
// ------------------------------------------------------------
exapp.get('/api/files', function(req, res) {
	var files = findFiles({path: pwd})
	
	res.send(files)
})

exapp.post('/api/get_file', function(req, res) {
	res.send(fs.readFileSync(req.body.path, 'utf-8'))
})


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
				return
			}
		} else {
			if(checkIfExcludedFolder(thing.shortpath)) {
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

	// console.log('')
	// console.log(' ' + pwd + ' ')
	// console.log('')
	// console.log('╔' + dashes + '╗')
	// console.log('║' + repeat(max-10, ' ') + '║')
	// console.log(msg + rSpace(msg, max-10) + ' ║')
	// console.log('║' + repeat(max-10, ' ') + '║')
	// // console.log(local + rSpace(local, max) + ' ║')
	// console.log(pub + rSpace(pub, max) + ' ║')
	// console.log('║' + repeat(max-10, ' ') + '║')
	// console.log('╚' + dashes + '╝')
})


// ------------------------------------------------------------
//   Expose properties for module
// ------------------------------------------------------------

module.exports = {
	io: io,
	server: http
}