const DtmfDetectionStream = require('../index.js')
const DtmfGenerationStream = require('dtmf-generation-stream')

const sampleRate = 16000

const format = {
	sampleRate,
	bitDepth: 16,
	channels: 1,
}

const dgs = new DtmfGenerationStream({format})
dgs.enqueue('0123456789')

const dds = new DtmfDetectionStream({format})

var intervalID = setInterval(() => {
  console.log("heartbeat")
  var bytes = (sampleRate / 8000) * 320 * 20
  var data = dgs.read(bytes)
  //console.log(data)
  dds.write(data)
}, 20)

dds.on('dtmf', data => {
	console.log('Got', data)
})

dds.on('speech', data => {
	console.log('Got', data)
  clearInterval(intervalID)
  console.log("done")
})


dgs.on('empty', () => {
  console.log('empty')
})
