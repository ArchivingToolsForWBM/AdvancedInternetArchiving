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
            if(!all.has(link.style)) {
                if ((link.style.backgroundImage).replace(/url\((\"|\')/, "").replace(/(\"|\')\)/, "").replace(/^http/, "ttp") != "") {
                    all.add(link.style);
                    console.log((link.style.backgroundImage).replace(/url\((\"|\')/, "").replace(/(\"|\')\)/, "").replace(/^http/, "ttp"));
                }
            }
        });
    }
    //Code that executes when the MAIN WINDOW loads the page
    //Please note that this does not reflect the loading of subwindows when you open links in a way that does not reload the main window
    //Since this executes ONCE when the main window loads.
    {
        let CurrentDocument = document
        window.addEventListener('scroll',getLink.bind(null, CurrentDocument)); //Get links on the main window when loaded
        if (window.frames.length) { //Loop through every window and extract their links too (NOTE: will not extract recursively)
            for (let i=0;i<window.frames.length;i++) {
                CurrentDocument = window.frames[i].document
                CurrentDocument.addEventListener('scroll',getLink.bind(null, CurrentDocument));
            }
        }
    }

})();