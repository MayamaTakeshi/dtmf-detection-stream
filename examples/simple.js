// sending a new digit after after the previous one is detected.

const { ToneStream, utils } = require('tone-stream')
const DtmfDetectionStream = require('../index.js')

const sampleRate = 8000

const format = {
	sampleRate,
	bitDepth: 16,
	channels: 1,
}

const ts = new ToneStream(format)

ts.add([800, 's'])
var tones = utils.gen_dtmf_tones("0123456789abcd*#", 100, 100, sampleRate)
tones.push([800, 's'])
console.log("tones:")
tones.forEach(tone => {
    console.log(tone)
})

ts.concat(tones)

const dds = new DtmfDetectionStream({format})

dds.on('dtmf', data => {
	console.log('Event dtmf:', data)

  if(data.digit == '#') {
    console.log("done")
    process.exit(0)
  }
})

ts.pipe(dds)

