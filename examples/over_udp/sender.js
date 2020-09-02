const ToneStream = require('tone-stream')
const DtmfDetectionStream = require('../../index.js')
const dgram = require('dgram')

const args = process.argv

if(args.length != 6) {
	console.log(`
Invalid Number of arguments. 

Parameters: local_ip remote_ip remote_port dtmf_string
Ex:         127.0.0.1 127.0.0.1 8890 01234567890abcdef
`)

	process.exit(1)
}

const local_ip = process.argv[2]
const remote_ip = process.argv[3]
const remote_port = process.argv[4]
const dtmf_string = process.argv[5]

const re = /[0-9a-dA-D]+/
if(!dtmf_string.match(re)) {
	console.log('Invalid dtmf_string. Valid chars are 0123456789abcdef')	
	process.exit(1)
}

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

const ts = new ToneStream(format)
for (var i = 0; i < dtmf_string.length; i++) {
	var digit = dtmf_string.charAt(i)

	ts.add([800, `DTMF:${digit}`])
	ts.add([1000, 0]) // silence
}

const s = dgram.createSocket('udp4');

s.on('error', (err) => {
	console.log(`Dgram error:\n${err.stack}`)
	s.close()
	proces.exit(1)
})

s.on('listening', () => {
	setInterval(() => {
		var data = ts.read(1024)
		if(!data) {
			console.log("tone stream finished")
			process.exit(0)
		} 
		//console.log(data)
		s.send(data, remote_port, remote_ip)
	}, 10)
})

s.bind({
	address: local_ip,
})

