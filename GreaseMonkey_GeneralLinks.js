// ==UserScript==
// @name         Extract any links from any site
// @namespace    any site
// @version      0.2
// @description  try to take over the world!
// @include      *
// @grant        none
// ==/UserScript==


(function() {
    'use strict';
    const all = window.allLink = new Set();
    
    function getLink(PageDocument) {
        Array.from(PageDocument.getElementsByTagName('a')).forEach(link=>{ //"a href" links
            if(!all.has(link.href)) {
                all.add(link.href);
                console.log((link.href).replace(/^http/, "ttp").replace(/#.*$/, ""));
            }
        });
        Array.from(PageDocument.getElementsByTagName('img')).forEach(link=>{ //Images
            if(!all.has(link.src)) {
                all.add(link.src);
                console.log((link.src).replace(/^http/, "ttp").replace(/#.*$/, ""));
            }
        });
        Array.from(PageDocument.getElementsByTagName('*')).forEach(link=>{ //Background images
            if(!all.has(link.style.backgroundImage)&&link.style.backgroundImage!="") {
                    all.add(link.style);
                    console.log((link.style.backgroundImage).replace(/url\((\"|\')/, "").replace(/(\"|\')\)/, "").replace(/^http/, "ttp"));
            }
        });
    }
    //Code that executes when the MAIN WINDOW loads the page
    //Please note that this does not reflect the loading of subwindows when you open links in a way that does not reload the main window
    //Since this executes ONCE when the main window loads.
  
    window.addEventListener('load',getLink.bind(null, document)); //Get links on the main window when page finishes loading
    window.addEventListener('load', (event) => {
        let CurrentDocument = document
        window.addEventListener('scroll',getLink.bind(null, CurrentDocument)); //Get links on the main window when scrolling (when page loads as you scroll; infinute scroll)
        if (window.frames.length) { //Loop through every window and extract their links too (NOTE: will not extract recursively)
            for (let i=0;i<window.frames.length;i++) {
                CurrentDocument = window.frames[i].document
                CurrentDocument.addEventListener('scroll',getLink.bind(null, CurrentDocument));
                CurrentDocument.addEventListener('load',getLink.bind(null, CurrentDocument));
            }
        }
    })

})();