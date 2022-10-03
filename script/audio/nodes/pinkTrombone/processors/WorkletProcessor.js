/*
    TODO
        *
*/

import ParameterDescriptors from "./ParameterDescriptors.js";
import Processor from "./Processor.js";

class PinkTromboneWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.processor = new Processor();
        this.enabledConstrictionIndices = [];

        this.yawn = yawn(5000, true)

        this.port.onmessage = (event) => {
            switch(event.data.name) {
                case "enableConstriction":
                    this.enabledConstrictionIndices[event.data.constrictionIndex] = true;
                    this.port.postMessage(event.data);
                    break;
                case "disableConstriction":
                    this.enabledConstrictionIndices[event.data.constrictionIndex] = false;
                    this.port.postMessage(event.data);
                    break;

                case "enabledConstrictionIndices":
                    event.data.enabledConstrictionIndices = this.enabledConstrictionIndices;
                    this.port.postMessage(event.data);
                    break;
                
                case "getProcessor":
                    event.data.processor = JSON.stringify(this.processor);
                    this.port.postMessage(event.data);
                    break;
                default:
                    break;
            }
        }
    }

    static get parameterDescriptors() {
        return ParameterDescriptors;
    }

    _getParameterSamples(parameters, sampleIndex) {
        const parameterSamples = {};

        for(let parameterDescriptorIndex = 0; parameterDescriptorIndex < this.constructor.parameterDescriptors.length; parameterDescriptorIndex++) {
            const parameterDescriptor = this.constructor.parameterDescriptors[parameterDescriptorIndex];
            if(!parameterDescriptor.name.includes("constriction")) {
                parameterSamples[parameterDescriptor.name] = (parameters[parameterDescriptor.name].length == 1)?
                    parameters[parameterDescriptor.name][0] :
                    parameters[parameterDescriptor.name][sampleIndex];
            }
        }

        return parameterSamples;
    }

    _getConstrictions(parameters) {
        const constrictions = [];

        for(let constrictionIndex = 0; constrictionIndex < ParameterDescriptors.numberOfConstrictions; constrictionIndex++) {
            if(this.enabledConstrictionIndices[constrictionIndex]) {
                const prefix = "constriction" + constrictionIndex;

                const constriction = {
                    index : parameters[prefix + "index"][0],
                    diameter : parameters[prefix + "diameter"][0],
                };

                constrictions[constrictionIndex] = constriction;
            }
        }

        return constrictions;
    }

    process(inputs, outputs, parameters) {
        // const constrictions = this._getConstrictions(parameters);

        let seconds;

        for(let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
            for(let channelIndex = 0; channelIndex < outputs[outputIndex].length; channelIndex++) {
                for(let sampleIndex = 0; sampleIndex < outputs[outputIndex][channelIndex].length; sampleIndex++) {                    
                    const parameterSamples = this._getParameterSamples(parameters, sampleIndex);
                    seconds = currentTime + (sampleIndex/sampleRate);
                    const outputSample = this.processor.process(parameterSamples, sampleIndex, outputs[outputIndex][channelIndex].length, seconds);

                    outputs[outputIndex][channelIndex][sampleIndex] = outputSample;
                }
            }
        }

        let globalIndex = Math.round(1723 * currentTime / 2)
        let constrictions = [this.yawn[globalIndex].constriction]

        this.processor.update(currentTime + (outputs[0][0].length/sampleRate), constrictions);

        return true;
    }
}

function yawn(steps = 5000, randomize = false) {

    // this.pinkTrombone.intensity.value = 1;
    // this.pinkTrombone.tongue.index.value = 18
    // this.pinkTrombone.tongue.diameter.value = 2.7

    let params = [];
    let freq_min
    let voiceness_min
    let constriction_indexes_min

    if (randomize) {
        freq_min = getRandomArbitrary(30, 70)
        voiceness_min = getRandomArbitrary(0.6, 0.8)
        constriction_indexes_min = getRandomArbitrary(11, 16)
    } else {
        freq_min = 30;
        voiceness_min = 0.8;
        constriction_indexes_min = 11;
    }

    let freqs = [...makeArr(freq_min, freq_min * 2, steps / 2), ...makeArr(freq_min * 2, freq_min, steps / 2)]
    let voicenesses = [...makeArr(1, voiceness_min, steps / 2), ...makeArr(voiceness_min, 1, steps / 2)]
    let constriction_indexes = [...makeArr(constriction_indexes_min, constriction_indexes_min * 2, steps / 2), ...makeArr(constriction_indexes_min * 2, constriction_indexes_min * 2, steps / 2)]
    let constriction_diameters = [...makeArr(0, 1, steps / 2), ...makeArr(1, 0, steps / 2)]

    for (let i of Array(steps).keys()) {
        // this.pinkTrombone.frequency.value = freqs[i];
        // setVoiceness(voicenesses[i])
        // myConstriction.index.value = constriction_indexes[i]
        // myConstriction.diameter.value = constriction_diameters[i]
        params.push({
            'frequency': freqs[i],
            'voicenesses': voicenesses[i],
            'myConstriction.index': constriction_indexes[i],
            'myConstriction.diameter': constriction_diameters[i],
            'intensity': 1,
            'tongue.index': 18,
            'tongue.diameter': 2.7,
            'constriction': {
                'index': constriction_indexes[i],
                'diameter': constriction_diameters[i]
            }
        })
    }
    return params
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function makeArr(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}


registerProcessor("pink-trombone-worklet-processor", PinkTromboneWorkletProcessor);