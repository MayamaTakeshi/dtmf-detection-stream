const ToneStream = require('tone-stream')
const DtmfDetectionStream = require('../index.js')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

var digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', '*', '#']

var temp_digits = digits.slice(0) // clone array

const ts = new ToneStream(format)
ts.add([800, `DTMF:${temp_digits.shift()}`])
ts.add([800, 0])

ts.on('empty', () => {
	var digit = temp_digits.shift()
	if(!digit) {
		temp_digits = digits.reverse().slice(0)
		ts.add([800, `DTMF:${temp_digits.shift()}`])
		ts.add([800, 0])
	} else {
		ts.add([800, `DTMF:${digit}`])
		ts.add([800, 0])
	}
})

const dds = new DtmfDetectionStream(format)

dds.on('digit', digit => {
	console.log('got digit', digit)
})

ts.pipe(dds)

