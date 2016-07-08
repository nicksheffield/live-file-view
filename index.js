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
//   Recursive Datastructure for Dirs and Files
// ------------------------------------------------------------
function findFiles(folder) {
	var paths = fs.readdirSync(folder.path)
	var files = []

	paths.forEach(function(path) {
		var thing = {}
		var stat = fs.lstatSync(folder.path + path)
		var name = path + (stat.isDirectory() ? '/' : '')

		if(name == 'node_modules/') return
		if(stat.isDirectory() && name[0] == '.') return
		if(name == '.DS_Store') return

		thing.type = stat.isFile() ? 'file' : 'directory'
		thing.path = folder.path + name
		thing.name = name

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
	// console.log('a user connected', socket.id)
	socket.emit('connected')
})


// ------------------------------------------------------------
//   Start the Server
// ------------------------------------------------------------
http.listen(3000, function() {
	var ip = require('os').networkInterfaces().en0[1].address
	var msg = '║        Live File Watcher'
	var local = '║    local: '+chalk.blue('http://localhost:'+3000)
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
	console.log('╔' + dashes + '╗')
	console.log('║' + repeat(max-10, ' ') + '║')
	console.log(msg + rSpace(msg, max-10) + ' ║')
	console.log('║' + repeat(max-10, ' ') + '║')
	// console.log(local + rSpace(local, max) + ' ║')
	console.log(pub + rSpace(pub, max) + ' ║')
	console.log('║' + repeat(max-10, ' ') + '║')
	console.log('╚' + dashes + '╝')
})
