import PinkTromboneElement from "./script/component.js";
import pinkTrombone from "./script/PinkTrombone.js";

// const pinkTromboneElement = new PinkTromboneElement()
const pinkTromboneElement = document.querySelector("pink-trombone")

let myConstriction;
console.log('heiii')



pinkTromboneElement.setAudioContext().then(pinkTrombone => {
    pinkTromboneElement.enableUI();
    // pinkTromboneElement.startUI();
    pinkTromboneElement.connect(pinkTromboneElement.audioContext.destination);

    // pinkTromboneElement.runOffline();

    // event.target.dispatchEvent(new CustomEvent("didResume"));
});




