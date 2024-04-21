# dtmf-detection-stream

This is a simple node.js DTMF detection stream.

## Installation 

```
npm i dtmf-detection-stream
```

## Sample usage

```
const { ToneStream } = require('tone-stream')
const Speaker = require('speaker')
const DtmfDetectionStream = require('dtmf-detection-stream')

const format = {
  sampleRate: 8000,
  bitDepth: 16,
  channels: 1,
}

const ts = new ToneStream(format)
ts.add([800, 's']) // silence
ts.add([800, 'DTMF:1'])
ts.add([800, 's']) // silence
ts.add([800, 'DTMF:2'])
ts.add([800, 's']) // silence
ts.add([800, 'DTMF:3'])
ts.add([800, 's']) // silence

const dds = new DtmfDetectionStream({format})

dds.on('dtmf', data => {
  console.log('Got dtmf:', data)
})

dds.on('speech', data => {
  console.log('Got speech:', data)
  process.exit(0)     
})

ts.on('data', data => {
  dds.write(data)
})

const speaker = new Speaker(format)
ts.pipe(speaker)

```
Output:

```
$ node mytest.js 
Got dtmf: { digit: '1', timestamp: 0.207 }
Got dtmf: { digit: '2', timestamp: 0.4025 }
Got dtmf: { digit: '3', timestamp: 0.6095 }
Got speech: { transcript: '123', timestamp: 0.6095 }

```

## Events

The DtmfDetectionStream emits two kinds of events:
  - 'dtmf': single digit as soon as it is detected (notified upon signal extintion).
  - 'speech': aggregated digits after 500 milliseconds with no more digits being detected. So it will be like someone is using DTMF to talk (this will permit to treat dtmf-detection-stream as a speech-recog-stream and use it with mrcp_server and ws_speech_server).

## More Examples

See [here](https://github.com/MayamaTakeshi/dtmf-detection-stream/tree/master/examples).


