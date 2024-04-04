const ToneStream = require('tone-stream')
const DtmfDetectionStream = require('../index.js')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

var digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', '*', '#']

const ts = new ToneStream(format)

ts.add([800, 's'])
ts.add([800, `DTMF:${digits.shift()}`])
ts.add([800, 's'])

ts.on('empty', () => {
	var digit = digits.shift()
	if(!digit) {
		return
	}

	ts.add([800, `DTMF:${digit}`])
	ts.add([800, 's'])
})

const dds = new DtmfDetectionStream(format, {numSamples: 800})

dds.on('digit', digit => {
	console.log('got digit', digit)
})

ts.pipe(dds)

