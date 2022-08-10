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
    
    function getLink() {
        Array.from(document.getElementsByTagName('a')).forEach(link=>{ //"a href" links
            if(!all.has(link.href)) {
                all.add(link.href);
                console.log((link.href).replace(/^http/, "ttp").replace(/#.*$/, ""));
            }
        });
        Array.from(document.getElementsByTagName('img')).forEach(link=>{ //Images
            if(!all.has(link.src)) {
                all.add(link.src);
                console.log((link.src).replace(/^http/, "ttp").replace(/#.*$/, ""));
            }
        });
        Array.from(document.getElementsByTagName('*')).forEach(link=>{ //Background images
            if(!all.has(link.style)) {
                if ((link.style.backgroundImage).replace(/url\((\"|\')/, "").replace(/(\"|\')\)/, "").replace(/^http/, "ttp") != "") {
                    all.add(link.style);
                    console.log((link.style.backgroundImage).replace(/url\((\"|\')/, "").replace(/(\"|\')\)/, "").replace(/^http/, "ttp"));
                }
            }
        });
    }
    getLink();
    window.addEventListener('scroll',getLink);
})();