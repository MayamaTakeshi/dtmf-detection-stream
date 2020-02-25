# dtmf-detection-stream

This is is simple node.js DTMF detection stream.

```
const ToneStream = require('tone-stream')
const DtmfDetectionStream = require('dtmf-detection-stream')

const format = {
	sampleRate: 8000,
	bitDepth: 16,
	channels: 1,
}

const ts = new ToneStream(format)
ts.add([800, 'DTMF:1'])
ts.add([800, 0]) // silence
ts.add([800, 'DTMF:2'])
ts.add([800, 0]) // silence
ts.add([800, 'DTMF:3'])
ts.add([800, 0]) // silence

const dds = new DtmfDetectionStream(format)

dds.on('digit', digit => {
	console.log('got digit', digit)
})

ts.pipe(dds)

```

```
$ node b.js 
got digit 1
got digit 2
got digit 3
```

