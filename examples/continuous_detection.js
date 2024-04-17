const { ToneStream } = require('tone-stream')
const DtmfDetectionStream = require('../index.js')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

var digits = '0123456789abcdef'.split('')

var temp_digits = digits.slice(0) // clone array

const ts = new ToneStream(format)
ts.add([800, `DTMF:${temp_digits.shift()}`])
ts.add([800, 's'])

ts.on('empty', () => {
	var digit = temp_digits.shift()
	if(!digit) {
		temp_digits = digits.reverse().slice(0)
		ts.add([800, `DTMF:${temp_digits.shift()}`])
		ts.add([800, 's'])
	} else {
		ts.add([800, `DTMF:${digit}`])
		ts.add([800, 's'])
	}
})

const dds = new DtmfDetectionStream({format})

dds.on('dtmf', data => {
	console.log('Got dtmf', data)
})

dds.on('speech', data => {
  console.log('Got speech', data)
})

ts.pipe(dds)

