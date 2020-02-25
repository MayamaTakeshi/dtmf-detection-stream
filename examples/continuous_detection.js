const ToneStream = require('tone-stream')
const DtmfDetectionStream = require('../index.js')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

const ts = new ToneStream(format)

const items = [
	[250, 'DTMF:0'],
	[250, 'DTMF:1'],
	[250, 'DTMF:2'],
	[250, 'DTMF:3'],
	[250, 'DTMF:4'],
	[250, 'DTMF:5'],
	[250, 'DTMF:6'],
	[250, 'DTMF:7'],
	[250, 'DTMF:8'],
	[250, 'DTMF:9'],
	[250, 'DTMF:A'],
	[250, 'DTMF:B'],
	[250, 'DTMF:C'],
	[250, 'DTMF:D'],
	[250, 'DTMF:*'],
	[250, 'DTMF:#'],
]

ts.concat(items)

ts.on('empty', () => {
	console.log('empty. Reversing items')
	items.reverse()
	ts.concat(items)
})

const dds = new DtmfDetectionStream(format, 160)

dds.on('digit', digit => {
	console.log('got digit', digit)
})

ts.pipe(dds)

