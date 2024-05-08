const DtmfDetectionStream = require('../index.js')
const DtmfGenerationStream = require('dtmf-generation-stream')

const sampleRate = 16000

const format = {
	sampleRate,
	bitDepth: 16,
	channels: 1,
}

const params = {
  text: '0123456789',
}

const dgs = new DtmfGenerationStream({format, params})

const dds = new DtmfDetectionStream({format})

var intervalID = setInterval(() => {
  //console.log("interval")
  var bytes = (sampleRate / 8000) * 320 * 20
  var data = dgs.read(bytes)
  //console.log(data)
  if(data) {
    dds.write(data)
  } else {
    console.log("done")
    process.exit(0)
  }
}, 20)

dds.on('dtmf', data => {
	console.log('Event dtmf:', data)
})

dds.on('speech', data => {
	console.log('Event speech:', data)
  clearInterval(intervalID)
  console.log("done")
})

