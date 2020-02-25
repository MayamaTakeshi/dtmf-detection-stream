const { Writable } = require('stream')
const { EventEmitter } = require('events')

const DTMF = require('goertzeljs/lib/dtmf')

class DtmfDetectionStream extends Writable {
	constructor(opts) {
		super(opts)

		this.dtmf = new DTMF(opts)

		this.bytesPerSample = opts.bitDepth ? opts.bitDepth/8 : 2
		this.numSamples = opts.numSamples ? opts.numSamples : 160

		this.remains = null

		this.previous = Array(16) // one slot for each DTMF tone

		this.eventEmitter = new EventEmitter()
	}

	on(evt, cb) {
		this.eventEmitter.on(evt, cb)
	}

	_digitToSlot(d) {
		switch(d){
		case '*':
			return 14
		case '#':
			return 15
		case 'A':
		case 'B':
		case 'C':
		case 'D':
			return parseInt(d, 16)
		default:
			return parseInt(d, 10)
		}
	}

	_slotToDigit(s) {
		if(s < 10) {
			return s + ''
		} else if(s >=10 && s > 14) {
			return String.fromCharCode(65 - 10 + s)
		} else if(s = 14) {
			return '*'
		} else {
			return '#'
		}
	}

	_processSamples(data) {
		console.log('_processSamples', data)
		var buffer = new Float32Array(this.numSamples)

		for(var i = 0 ; i<this.numSamples ; i++) {
			var f
			if(this.bytesPerSample == 1) {
				f = data[i]
			} else if (this.bytesPerSample == 2) {
				f = data.readInt16LE(i*2)
				var LIMIT = 0.9999999999999999
				f = (LIMIT - -LIMIT)/(32767 - -32768)*(f - 32767)+LIMIT
			} else {
				throw "NOT SUPPORTED"
			}
			buffer[i] = f
		}

		//console.log(buffer)

		var digits = this.dtmf.processBuffer(buffer)
		console.log(digits)

		// report digits upon signal extinction
		var slots = digits.map(digit => this._digitToSlot(digit))
		//console.log('slots', slots)
		var absentOnes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter(slot => slots.indexOf(slot) < 0)
		//console.log('absentOnes', absentOnes)
		absentOnes.forEach(slot => {
			if(this.previous[slot]) {
				this.eventEmitter.emit('digit', this._slotToDigit(slot))
				this.previous[slot] = null
			}
		})

		slots.forEach(slot => {
			this.previous[slot] = true
		})
	}

	_write(chunk, encoding, callback) {
		//console.log('_write', chunk)
		var data = chunk

		if(this.remains) {
			data = Buffer.concat([this.remains, data])
			this.remains = null
		}

		var numBytes = this.numSamples * this.bytesPerSample

		console.log(data.length, numBytes)
		if(data.length < numBytes) {
			this.remains = data
		} else if(data.length == numBytes) {
			this._processSamples(data)
		} else {
			var blocks = Math.floor(data.length / numBytes)
			console.log('blocks', blocks)
			for(var i=0 ; i<blocks ; i++) {
				this._processSamples(data.slice(i*numBytes, i*numBytes+numBytes))
			}
			var remaining = data.length - blocks*numBytes
			if(remaining > 0) {
				this.remains = data.slice(-remaining)
			}
		}
	}
}

module.exports = DtmfDetectionStream

