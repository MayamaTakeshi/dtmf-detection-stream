# dtmf-detection-stream

This is is simple node.js DTMF detection stream.

## Sample usage

```
const { ToneStream } = require('tone-stream')
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

const dds = new DtmfDetectionStream(format)

dds.on('dtmf', data => {
        console.log('Got', data)
})

ts.on('data', data => {
        dds.write(data)
})

```
Output:

```
$ node mytest.js 
Got { digit: '1', timestamp: 0.207 }
Got { digit: '2', timestamp: 0.4025 }
Got { digit: '3', timestamp: 0.6095 }
```

## Events

The DtmfDetectionStream emits two kinds of events:
  - 'dtmf': single digit as soon as it is detected (notified upon signal extintion)
  - 'transcript': aggregated digits after 100 milliseconds with no more digits being detected.

## More Examples

See [here](https://github.com/MayamaTakeshi/dtmf-detection-stream/tree/master/examples).


