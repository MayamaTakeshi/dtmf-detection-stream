const ToneStream = require('tone-stream')
const DtmfDetectionStream = require('../index.js')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

const ts = new ToneStream(format)
ts.add([1000, 'DTMF:0'])
ts.add([1000, 'DTMF:1'])
ts.add([1000, 'DTMF:2'])
ts.add([1000, 'DTMF:3'])
ts.add([1000, 'DTMF:4'])
ts.add([1000, 'DTMF:5'])
ts.add([1000, 'DTMF:6'])
ts.add([1000, 'DTMF:7'])
ts.add([1000, 'DTMF:8'])
ts.add([1000, 'DTMF:9'])
ts.add([1000, 'DTMF:A'])
ts.add([1000, 'DTMF:B'])
ts.add([1000, 'DTMF:C'])
ts.add([1000, 'DTMF:D'])
ts.add([1000, 'DTMF:*'])
ts.add([1000, 'DTMF:#'])
ts.add([1000, 'DTMF:0'])

const dds = new DtmfDetectionStream(format, 160)

dds.on('digit', digit => {
	console.log('got digit', digit)
})

ts.pipe(dds)

//setTimeout(() => {} , 3000)
