const fs = require('fs')
const wav = require('wav')
const DtmfDetectionStream = require('../index.js')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

var file_path = __dirname + '/artifacts/digits.1234.wav'
if(process.argv[2]) {
	file_path = process.argv[2]
}

const file = fs.createReadStream(file_path)

const reader = new wav.Reader()

file.pipe(reader)

reader.on('format', format => {
	const dds = new DtmfDetectionStream(format)

	dds.on('digit', digit => {
		console.log('got digit', digit)
	})

	reader.pipe(dds)
})

