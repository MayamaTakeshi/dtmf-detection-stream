const { Writable } = require("stream");
const { EventEmitter } = require("events");

const MINIMAL_COUNT = 2;

const AGGREGATION_TIMEOUT = 500;

const TRANSCRIPT_LIMIT = 256;

class DtmfDetectionStream extends Writable {
  constructor(args) {
    super();
    this.MAX_BINS = 8;

    const format = args.format

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
      throw "Unsupported sample rate";
    }

    this.channels = format.channels;

    this.freqs = [697, 770, 852, 941, 1209, 1336, 1477, 1633];
    this.coefs = new Array(8).fill(0);
    this.calcCoeffs();

    // Initialize per-channel state
    this.channelState = [];
    for (let c = 0; c < this.channels; c++) {
      this.channelState.push(this.createChannelState());
    }

    this.eventEmitter = new EventEmitter();
  }

  on(evt, cb) {
    this.eventEmitter.on(evt, cb);
  }

  createChannelState() {
    return {
      sampleIndex: 0,
      sampleCount: 0,
      q1: new Array(8).fill(0),
      q2: new Array(8).fill(0),
      r: new Array(8).fill(0),
      curChar: "",
      count: 0,
      timeoutID: null,
      aggregated: "",
    };
  }

  postTesting(ch) {
    const rowColAsciiCodes = [
      ["1", "2", "3", "a"],
      ["4", "5", "6", "b"],
      ["7", "8", "9", "c"],
      ["*", "0", "#", "d"],
    ];
    const s = this.channelState[ch];
    let row = 0;
    let col = 0;
    let seeDigit = false;
    let peakCount = 0;
    let maxIndex = 0;
    let maxVal = 0.0;
    let t = 0;

    for (let i = 0; i < 4; i++) {
      if (s.r[i] > maxVal) {
        maxVal = s.r[i];
        row = i;
      }
    }

    col = 4;
    maxVal = 0;

    for (let i = 4; i < 8; i++) {
      if (s.r[i] > maxVal) {
        maxVal = s.r[i];
        col = i;
      }
    }

    if (s.r[row] < 4.0e5 || s.r[col] < 4.0e5) {
      if (s.curChar && s.count >= MINIMAL_COUNT) {
        this.emitDtmf(ch, s.curChar);
      }
      s.curChar = "";
      s.count = 0;
      return "energy not enough";
    }

    seeDigit = true;

    if (s.r[col] > s.r[row]) {
      maxIndex = col;
      if (s.r[row] < s.r[col] * 0.398) {
        seeDigit = false;
      }
    } else {
      maxIndex = row;
      if (s.r[col] < s.r[row] * 0.158) {
        seeDigit = false;
      }
    }

    if (s.r[maxIndex] > 1.0e9) {
      t = s.r[maxIndex] * 0.158;
    } else {
      t = s.r[maxIndex] * 0.01;
    }

    peakCount = 0;

    for (let i = 0; i < 8; i++) {
      if (s.r[i] > t) {
        peakCount++;
      }
    }

    if (peakCount > 2) {
      seeDigit = false;
      if (s.curChar && s.count >= MINIMAL_COUNT) {
        this.emitDtmf(ch, s.curChar);
      }
      s.curChar = "";
      s.count = 0;
    }

    if (seeDigit) {
      const detectedChar = rowColAsciiCodes[row][col - 4];
      if (s.curChar == detectedChar) {
        s.count++;
      } else {
        if (s.count >= MINIMAL_COUNT) {
          this.emitDtmf(ch, s.curChar);
          s.curChar = "";
          s.count = 0;
        }
        s.curChar = detectedChar;
        s.count++;
      }
    }
  }

  goertzel(ch, sample) {
    const s = this.channelState[ch];
    let q0 = 0;
    s.sampleCount++;
    s.sampleIndex++;

    for (let i = 0; i < this.MAX_BINS; i++) {
      q0 = this.coefs[i] * s.q1[i] - s.q2[i] + sample;
      s.q2[i] = s.q1[i];
      s.q1[i] = q0;
    }

    if (s.sampleCount === this.GOERTZEL_N) {
      for (let i = 0; i < this.MAX_BINS; i++) {
        s.r[i] =
          s.q1[i] * s.q1[i] +
          s.q2[i] * s.q2[i] -
          this.coefs[i] * s.q1[i] * s.q2[i];
        s.q1[i] = 0;
        s.q2[i] = 0;
      }
      this.postTesting(ch);
      s.sampleCount = 0;
    }
  }

  calcCoeffs() {
    for (let n = 0; n < this.MAX_BINS; n++) {
      this.coefs[n] =
        2.0 * Math.cos((2.0 * Math.PI * this.freqs[n]) / this.SAMPLING_RATE);
    }
  }

  _final(callback) {
    for (let ch = 0; ch < this.channels; ch++) {
      const s = this.channelState[ch];
      if (s.curChar && s.count >= MINIMAL_COUNT) {
        this.emitDtmf(ch, s.curChar);
      }
    }
    callback();
  }

  _write(chunk, encoding, callback) {
    let samples = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.byteLength / 2)

    for (let i = 0; i < samples.length; i++) {
      const ch = i % this.channels;
      this.goertzel(ch, samples[i]);
    }

    callback();
  }

  emitDtmf(ch, digit) {
    const s = this.channelState[ch];
    const timestamp = parseFloat(s.sampleIndex) / parseFloat(this.SAMPLING_RATE);
    const channel = this.channels > 1 ? ch : undefined;
    this.eventEmitter.emit("dtmf", { digit, timestamp, ...(channel !== undefined && { channel }) });

    s.aggregated += digit;

    if (s.timeoutID) {
      clearTimeout(s.timeoutID);
      s.timeoutID = null;
    }

    if (s.aggregated.length >= TRANSCRIPT_LIMIT) {
      this.eventEmitter.emit("speech", { transcript: s.aggregated, timestamp, ...(channel !== undefined && { channel }) });
      s.aggregated = "";
      return;
    }

    s.timeoutID = setTimeout(() => {
      this.eventEmitter.emit("speech", { transcript: s.aggregated, timestamp, ...(channel !== undefined && { channel }) });
      s.timeoutID = null;
      s.aggregated = "";
    }, AGGREGATION_TIMEOUT);
  }
}

module.exports = DtmfDetectionStream;
