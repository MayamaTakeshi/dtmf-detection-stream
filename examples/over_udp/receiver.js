const DtmfDetectionStream = require('../../index.js')
const dgram = require('dgram')

const args = process.argv

if(args.length != 4) {
	console.log(`
Invalid Number of arguments. 

Parameters: local_ip local_port
Ex:         127.0.0.1 8890
`)

	process.exit(1)
}

const local_ip = process.argv[2]
const local_port = process.argv[3]

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

const dds = new DtmfDetectionStream(format)

dds.on('digit', digit => {
	console.log('got digit', digit)
})

const d = dgram.createSocket('udp4');

d.on('error', (err) => {
	console.log(`server error:\n${err.stack}`);
	d.close();
	process.exit(1)
})

d.on('message', (msg, rinfo) => {
	dds.write(msg)
})

d.on('listening', () => {
	const address = d.address();
	console.log(`Listening ${address.address}:${address.port}`);
})

d.bind(local_port, local_ip);

