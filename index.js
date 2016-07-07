var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var watcher = require('fsevents')('./site')
var fs = require('fs')
var _ = require('lodash')
var bodyParser = require('body-parser')

watcher.start()

watcher.on('change', function(path, info) {
	console.log('fschange', path)

	var simplePath = '.' + path.replace(__dirname, '')
	io.emit('fschange', {path: simplePath})
})

app.use(express.static('./public/'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/api/files', function(req, res) {
	var files = findFiles({path: './site/'})
	
	res.send(files)
})

app.post('/api/get_file', function(req, res) {
	res.send(fs.readFileSync(req.body.path, 'utf-8'))
})

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

io.on('connection', function(socket) {
	console.log('a user connected', socket.id)

	socket.emit('connected')

})

http.listen(3000, function() {
	console.log('\n\n\n\n\n\n\n\n\n')
	console.log('File View')
	console.log('Local:  http://localhost:3000')
	console.log('Public: http://'+require('os').networkInterfaces().en0[1].address+':3000')
	console.log('---------------------')
	console.log('')
})