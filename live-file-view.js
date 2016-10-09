// ------------------------------------------------------------
//   Dependencies
// ------------------------------------------------------------
// var pwd         = process.env.PWD + '/'

var _           = require('lodash')
var fs          = require('fs')
var express     = require('express')
var exapp       = express()
var http        = require('http').Server(exapp)
var io          = require('socket.io')(http)
var chokidar    = require('chokidar')
var bodyParser  = require('body-parser')
var chalk       = require('chalk')

var fileApp = express()
var fileServer = require('http').Server(fileApp)



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
//   Set Folder
// ------------------------------------------------------------
var mainFolder = ''


function setFolder(folder) {
	if(!folder || !folder[0]) return false

	var stat = fs.lstatSync(folder[0])

	if(!stat.isDirectory()) return false
		
	mainFolder = folder[0] + '/'
	
	console.log('mainFolder chosen:', mainFolder)
	
	io.emit('fsupdate')
	
	// ------------------------------------------------------------
	//   Set Express Static Middleware
	// ------------------------------------------------------------
	
	if(fileApp._router) {
		fileApp._router.stack = _.filter(fileApp._router.stack, function(middleware) {
			return middleware.name !== 'serveStatic'
		})
	}
	
	fileApp.use(express.static(mainFolder))
	

	// ------------------------------------------------------------
	//   Load sublime-project files
	// ------------------------------------------------------------
	var rootFiles = fs.readdirSync(mainFolder)

	_.forEach(rootFiles, function(file) {
		if(sublimeProjectPattern.test(file)) {
			sublimeProject = JSON.parse(fs.readFileSync(mainFolder + file, "utf8"))
		}
	})


	// ------------------------------------------------------------
	//   FS Events
	// ------------------------------------------------------------
	var watcher = chokidar.watch(mainFolder, {ignored: defaultIgnore.map((str) => mainFolder+str), ignoreInitial: true})

	watcher.on('all', (event, path) => {
		// console.log('chokidar', event, path)
		
		var simplePath = path
		var filename = simplePath.split('/')[simplePath.split('/').length-1]
		
		if(sublimeProjectPattern.test(simplePath.replace(mainFolder, ''))) {
			sublimeProject = JSON.parse(fs.readFileSync(path, "utf8"))
			io.emit('fsupdate')
		}
		
		if(event == 'change') {
			io.emit('fschange', {path: simplePath})
			return
		}
		
		io.emit('fsupdate')
	});
	
	return true
}


var sublimeProjectPattern = /[a-zA-Z0-9\_\-]+.sublime-project/

var sublimeProject = {
	"folders": [
		{
			"folder_exclude_patterns": [],
			"file_exclude_patterns": []
		}
	]
}


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
//   Middleware
// ------------------------------------------------------------
exapp.use(express.static(__dirname + '/public/'))
exapp.use(bodyParser.json())
exapp.use(bodyParser.urlencoded({ extended: true }))


// ------------------------------------------------------------
//   Express API
// ------------------------------------------------------------
exapp.get('/api/files', function(req, res) {
	if(mainFolder) {
		var files = findFiles({path: mainFolder})
		
		files = [
			{
				type: 'directory',
				path: mainFolder,
				name: mainFolder.split('/')[mainFolder.split('/').length-2] + '/',
				shortpath: '/',
				files: files
			}
		]
		
		res.send(files)
	} else {
		res.send([])
	}
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
		thing.shortpath = thing.path.replace(mainFolder, '')
		
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
http.listen(3000)
fileServer.listen(3333)


// ------------------------------------------------------------
//   Expose properties for module
// ------------------------------------------------------------

module.exports = {
	io: io,
	server: http,
	setFolder: setFolder
}