const fs = require('fs')
const wav = require('wav')
const DtmfDetectionStream = require('../index.js')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

var file_path

if(process.argv[2]) {
	file_path = process.argv[2]
	console.log(`file_path=${file_path}`)
} else {
	file_path = __dirname + '/artifacts/digits.1234.8000hz.wav'
	console.log(`Using default file_path=${file_path}`)
}

const file = fs.createReadStream(file_path)

const reader = new wav.Reader()

file.pipe(reader)

reader.on('format', format => {
	console.log('format:', format)
	const dds = new DtmfDetectionStream(format)

	dds.on('digit', digit => {
		console.log('got digit', digit)
	})

	reader.pipe(dds)
})

