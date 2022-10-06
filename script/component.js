/*
    TODO
        *
*/

import {} from "./PinkTrombone.js";
// import {} from "../bufferToWave.js";
import PinkTromboneUI from "./graphics/PinkTromboneUI.js";
import ParameterDescriptors from "./audio/nodes/pinkTrombone/processors/ParameterDescriptors.js";

window.OfflineAudioContext = window.OfflineAudioContext || window.webkitAudioContext;

class PinkTromboneElement extends HTMLElement {
    constructor() {
        super();

        this._animationFrameObservers = [];

        window.customElements.whenDefined("pink-trombone")
            .then(() => {
                // RequestAnimationFrame
                this.addEventListener("requestAnimationFrame", event => {
                    if(!this._animationFrameObservers.includes(event.target))
                        this._animationFrameObservers.push(event.target);

                    const customEvent = new CustomEvent("didRequestAnimationFrame");
                    event.target.dispatchEvent(customEvent);

                    event.stopPropagation();
                });
                this.addEventListener("didResume", async event => {
                    console.log('did resume')
                    for (let i=0; i<2; i++) {
                        await this.setAudioContext().then(async pinktrombone => {
                            this.connect(pinkTromboneElement.audioContext.destination)
                            await this.downloadOffline();
                        });
                    }
                })

                this.addEventListener("resume", event => {
                    console.log('resume')
                    this.pinkTrombone.start();
                    event.target.dispatchEvent(new CustomEvent("didResume"));
                    event.currentTarget.dispatchEvent(new CustomEvent("didResume"));
                });
    
                // Audio Parameters
                this.addEventListener("setParameter", event => {

                    const parameterName = event.detail.parameterName;
                    const audioParam = parameterName.split('.').reduce((audioParam, propertyName) => audioParam[propertyName], this.parameters);
                    const newValue = Number(event.detail.newValue);

                    switch(event.detail.type) {
                        case "linear":
                            audioParam.linearRampToValueAtTime(newValue, this.audioContext.currentTime + event.detail.timeOffset);
                            break;
                        default:
                            audioParam.value = newValue;
                    }

                    event.target.dispatchEvent(new CustomEvent("didSetParameter", {
                        detail : event.detail,
                    }));

                    event.stopPropagation();
                });

                this.addEventListener("getParameter", event => {
                    const parameterName = event.detail.parameterName;
                    const audioParam = parameterName.split('.').reduce((audioParam, propertyName) => audioParam[propertyName], this.parameters);

                    const value = audioParam.value;
                    
                    const detail = event.detail;
                        detail.value = value;

                    event.target.dispatchEvent(new CustomEvent("didGetParameter", {
                        detail : detail,
                    }));

                    event.stopPropagation();
                });

                // Constrictions
                this.addEventListener("newConstriction", event => {
                    const {index, diameter} = event.detail;
                    const constriction = this.newConstriction(index, diameter);

                    const detail = event.detail;
                    detail.constrictionIndex = constriction._index;

                    event.target.dispatchEvent(new CustomEvent("didNewConstriction", {
                        detail : detail,
                    }));

                    event.stopPropagation();
                });
                this.addEventListener("setConstriction", event => {
                    const constrictionIndex = Number(event.detail.constrictionIndex);
                    const constriction = this.constrictions[constrictionIndex];

                    if(constriction) {
                        const {index, diameter} = event.detail;

                        const indexValue = index || constriction.index.value;
                        const diameterValue = diameter || constriction.diameter.value;

                        switch(event.detail.type) {
                            case "linear":
                                constriction.index.linearRampToValueAtTime(indexValue, event.detail.endTime);
                                constriction.diameter.linearRampToValueAtTime(diameterValue, event.detail.endTime);
                                break;
                            default:
                                constriction.index.value = indexValue;
                                constriction.diameter.value = diameterValue;
                        }
                        
                        event.target.dispatchEvent(new CustomEvent("didSetConstriction"));
                    }
                    
                    event.stopPropagation();
                });
                this.addEventListener("getConstriction", event => {
                    const constrictionIndex = Number(event.detail.constrictionIndex);
                    const constriction = this.constrictions[constrictionIndex];
    
                    event.target.dispatchEvent(new CustomEvent("didGetConstriction", {
                        detail : {
                            index : constriction.index.value,
                            diameter : constriction.diameter.value,
                        },
                    }));

                    event.stopPropagation();
                });
                this.addEventListener("removeConstriction", event => {
                    const constrictionIndex = Number(event.detail.constrictionIndex);
                    const constriction = this.constrictions[constrictionIndex];
                    this.removeConstriction(constriction);

                    const detail = event.detail;
                    
                    event.target.dispatchEvent(new CustomEvent("didRemoveConstriction", {
                        detail : detail,
                    }));

                    event.stopPropagation();
                });

                this.addEventListener("getProcessor", event => {
                    this.getProcessor()
                        .then(processor => {
                            event.target.dispatchEvent(new CustomEvent("didGetProcessor", {
                                detail : {
                                    processor : processor,
                                }
                            }));        
                        });

                    event.stopPropagation();
                });
            });
        
        if(this.getAttribute("UI") !== null)
            this.enableUI();
        
        const loadEvent = new Event("load");
        this.dispatchEvent(loadEvent);
    }

    runOffline() {
        console.log('resume')
        // this.audioContext.resume();
        this.pinkTrombone.start();
        let context = new AudioContext()
        // context.resume();
        this.audioContext.startRendering().then(data => {
            let bufferedSource =  context.createBufferSource()
            bufferedSource.buffer = data
            bufferedSource.connect(context.destination)
            bufferedSource.start()
        })
    }

    async downloadOffline() {
        // this.pinkTrombone.start();
        pinkTromboneElement.start();
        this.audioContext.startRendering().then(buffer => {
            let audio = URL.createObjectURL(bufferToWave(buffer, 0,44100*5))
            downloadBlob(audio, 'hei.wav')
        })
    }

    enableUI() {
        if(this.UI == undefined) {
            this.UI = new PinkTromboneUI();
            this.appendChild(this.UI.node);
        }

        this.UI.show();
    }
    disableUI() {
        if(this.UI !== undefined) {
            this.UI.hide();
            this.stopUI();
        }
    }

    startUI() {
        if(this.UI !== undefined) {
            this._isRunning = true;
            window.requestAnimationFrame(highResTimeStamp => {
                this._requestAnimationFrameCallback(highResTimeStamp);
            });    
        }
    }
    stopUI() {
        this._isRunning = false;
    }

    // getAttribute getter?
    static get observedAttributes() {
        return [
            "UI",
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case "UI":
                if(newValue !== null)
                    this.enableUI();
                else
                    this.disableUI();
                break;
            default:
                break;
        }
    }

    setAudioContext(audioContext = new window.OfflineAudioContext(1, 44100*5, 44100)) {
        this.pinkTrombone = audioContext.createPinkTrombone();

        this.loadPromise = this.pinkTrombone.loadPromise
            .then(audioContext => {
                this.parameters = this.pinkTrombone.parameters;

                for(let parameterName in this.pinkTrombone.parameters)
                    this[parameterName] = this.pinkTrombone.parameters[parameterName];

                return this.pinkTrombone;
            });
        return this.loadPromise;
    }
    

    get audioContext() {
        if(this.pinkTrombone)
            return this.pinkTrombone.audioContext;
        else
            throw "Audio Context has not been set";
    }
    set audioContext(audioContext) {
        this.setAudioContext(audioContext);
    }

    connect() {
        if(this.pinkTrombone)
            return this.pinkTrombone.connect(...arguments);
    }
    disconnect() {
        if(this.pinkTrombone)
            return this.pinkTrombone.disconnect(...arguments);
    }

    start() {
        if(this.pinkTrombone) {
            this.pinkTrombone.start();
            // this.startUI();
        }
        else
            throw "Pink Trombone hasn't been set yet";
    }
    stop() {
        if(this.pinkTrombone) {
            this.pinkTrombone.stop();
            this.stopUI();
        }
        else
            throw "Pink Trombone hasn't been set yet";
    }

    _requestAnimationFrameCallback(highResTimeStamp) {
        if(this._isRunning) {
            this._animationFrameObservers.forEach(element => {
                const customEvent = new CustomEvent("animationFrame", {
                    detail : {
                        highResTimeStamp : highResTimeStamp,
                    }
                });
                element.dispatchEvent(customEvent);
            });
            window.requestAnimationFrame(_highResTimeStamp => this._requestAnimationFrameCallback.call(this, _highResTimeStamp));
        }
    }


    // CONSTRICTIONS
    get constrictions() {
        return this.pinkTrombone.constrictions;
    }
    newConstriction() {
        return this.pinkTrombone.newConstriction(...arguments);
    }
    removeConstriction(constriction) {
        return this.pinkTrombone.removeConstriction(constriction);
    }

    getProcessor() {
        return this.pinkTrombone.getProcessor();
    }
}

if(document.createElement("pink-trombone").constructor == HTMLElement) {
    window.customElements.define("pink-trombone", PinkTromboneElement);
}



function bufferToWave(abuffer, offset, len) {
    var numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan  * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        pos = 0;
    // write WAVE header - total offset will be 44 bytes - see chart at http://soundfile.sapp.org/doc/WaveFormat/
    setUint32(0x46464952);                         // 'RIFF'
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // 'WAVE'
    setUint32(0x20746d66);                         // 'fmt ' chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this demo)

    setUint32(0x61746164);                         // 'data' - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for(i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while(pos < length) {
        for(i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // update data chunk
            pos += 2;
        }
        offset++                                     // next source sample
    }

    // create Blob
    return new Blob([buffer], {type: 'audio/wav'});

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

function downloadBlob(blob, name = 'file.txt') {
    if (
        window.navigator &&
        window.navigator.msSaveOrOpenBlob
    ) return window.navigator.msSaveOrOpenBlob(blob);

    // For other browsers:
    // Create a link pointing to the ObjectURL containing the blob.
    const data = blob //window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = data;
    link.download = name;

    // this is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
        new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        })
    );

    setTimeout(() => {
        // For Firefox it is necessary to delay revoking the ObjectURL
        window.URL.revokeObjectURL(data);
        link.remove();
    }, 100);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function linspace(start, stop, num, endpoint = true) {
    const div = endpoint ? (num - 1) : num;
    const step = (stop - start) / div;
    return Array.from({length: num}, (_, i) => start + step * i);
}

function makeArr(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}

export default PinkTromboneElement;