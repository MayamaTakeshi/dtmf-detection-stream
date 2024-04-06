const { Writable } = require('stream');
const { EventEmitter } = require('events');

const MINIMAL_COUNT = 2

class DtmfDetectionStream extends Writable {
    constructor(format, opts) {
        super(opts);
        this.MAX_BINS = 8;

        if (format.sampleRate == 8000) {
            // 8kHz default
            this.GOERTZEL_N = 92;
            this.SAMPLING_RATE = 8000;
        } else if (format.sampleRate == 16000) {
            this.GOERTZEL_N = 210; // original value but misses first digit from examples/artifacts/digits.1234.16000hz.wav
            this.SAMPLING_RATE = 16000;
	} else if (format.sampleRate == 32000) {
	    this.GOERTZEL_N = 332; // trial and error against examples/artifacts/digits.1234.32000hz.wav
	    this.SAMPLING_RATE = 32100;
	} else if (format.sampleRate == 44100) {
	    this.GOERTZEL_N = 440; // trial and error against examples/artifacts/digits.1234.44100hz.wav
	    this.SAMPLING_RATE = 44100;
	} else if (format.sampleRate == 48000) {
	    //this.GOERTZEL_N = 460; // trial and error against examples/artifacts/digits.1234.48000hz.wav
	    this.GOERTZEL_N = 490; //
	    this.SAMPLING_RATE = 48000;
        } else {
	   throw("Unsupported sample rate")
	}

	this.channels = format.channels

        this.freqs = [697, 770, 852, 941, 1209, 1336, 1477, 1633];
        this.coefs = new Array(8).fill(0);
        this.reset();
        this.calcCoeffs();

        this.eventEmitter = new EventEmitter();
	this.curChar = ""
	this.counter = 0
    }

    on(evt, cb) {
        this.eventEmitter.on(evt, cb);
    }

    reset() {
        this.sampleIndex = 0;
        this.sampleCount = 0;
        this.q1 = new Array(8).fill(0);
        this.q2 = new Array(8).fill(0);
        this.r = new Array(8).fill(0);
    }

    postTesting() {
        const rowColAsciiCodes = [["1", "2", "3", "A"], ["4", "5", "6", "B"], ["7", "8", "9", "C"], ["*", "0", "#", "D"]];
        let row = 0;
        let col = 0;
        let seeDigit = false;
        let peakCount = 0;
        let maxIndex = 0;
        let maxVal = 0.0;
        let t = 0;
        
        for (let i = 0; i < 4; i++) {
            if (this.r[i] > maxVal) {
                maxVal = this.r[i];
                row = i;
            }
        }

        col = 4;
        maxVal = 0;

        for (let i = 4; i < 8; i++) {
            if (this.r[i] > maxVal) {
                maxVal = this.r[i];
                col = i;
            }
        }

        if (this.r[row] < 4.0e5 || this.r[col] < 4.0e5) {
            return "energy not enough";
        }

        seeDigit = true;

        if (this.r[col] > this.r[row]) {
            maxIndex = col;
            if (this.r[row] < this.r[col] * 0.398) {
                seeDigit = false;
            }
        } else {
            maxIndex = row;
            if (this.r[col] < this.r[row] * 0.158) {
                seeDigit = false;
            }
        }

        if (this.r[maxIndex] > 1.0e9) {
            t = this.r[maxIndex] * 0.158;
        } else {
            t = this.r[maxIndex] * 0.010;
        }

        peakCount = 0;

        for (let i = 0; i < 8; i++) {
            if (this.r[i] > t) {
                peakCount++;
            }
        }

        if (peakCount > 2) {
            seeDigit = false;
            //console.log("peak count is too high: ", peakCount);
	    if(this.curChar && this.count >= MINIMAL_COUNT) {
		this.emitDtmf(this.curChar);
            }
	    this.curChar = ""
            this.count = 0
        }

        if (seeDigit) {
            //console.log(rowColAsciiCodes[row][col - 4]); // for debugging
            const detectedChar = rowColAsciiCodes[row][col - 4];
	    if(this.curChar == detectedChar) {
              this.count++
            } else {
	      if(this.count >= MINIMAL_COUNT) {
		this.emitDtmf(this.curChar);
	        this.curChar = ""
	        this.count = 0
	      }
              this.curChar = detectedChar
	      this.count++
	    }
        }
    }

    goertzel(sample) {
        let q0 = 0;
        this.sampleCount++;
        this.sampleIndex++;

        for (let i = 0; i < this.MAX_BINS; i++) {
            q0 = this.coefs[i] * this.q1[i] - this.q2[i] + sample;
            this.q2[i] = this.q1[i];
            this.q1[i] = q0;
        }

        if (this.sampleCount === this.GOERTZEL_N) {
            for (let i = 0; i < this.MAX_BINS; i++) {
                this.r[i] = this.q1[i] * this.q1[i] + this.q2[i] * this.q2[i] - this.coefs[i] * this.q1[i] * this.q2[i];
                this.q1[i] = 0;
                this.q2[i] = 0;
            }
            this.postTesting();
            this.sampleCount = 0;
        }
    }

    calcCoeffs() {
        for (let n = 0; n < this.MAX_BINS; n++) {
            this.coefs[n] = 2.0 * Math.cos(2.0 * Math.PI * this.freqs[n] / this.SAMPLING_RATE);
        }
    }

    _write(chunk, encoding, callback) {
        //console.log("Processing chunk...", chunk);

        let samples = new Int16Array(chunk.buffer);
        let channel1Samples = [];
        if(this.channels == 1) {
		channel1Samples = samples
	} else {
            // Iterate over the interleaved samples and extract samples from the first channel
	    var channel1Index = 0
            for (let i = channel1Index; i < samples.length; i += this.channels) {
                channel1Samples.push(samples[i]);
            }
	}

        for (const sample of channel1Samples) {
            this.goertzel(sample);
        }

        //console.log("Chunk processed");
        callback(); // Call the callback to indicate that the data has been processed
    }

    emitDtmf(digit) {
	const timestamp = parseFloat(this.sampleIndex) / parseFloat(this.SAMPLING_RATE);
	this.eventEmitter.emit('dtmf', {digit, timestamp});
    }

}

module.exports = DtmfDetectionStream;

