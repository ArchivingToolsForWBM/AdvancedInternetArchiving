// ==UserScript==
// @name         Extract any links from any site
// @namespace    any site
// @version      0.2
// @description  try to take over the world!
// @include      *
// @grant        none
// ==/UserScript==

//Note: This was tested on firefox.
(function() {
	'use strict';
	const all = window.allLink = new Set();
	function getLink(PageDocument) {
		Array.from(PageDocument.getElementsByTagName('a')).forEach(link=>{ //"a href" links
			let URLString = FormatURL(link.href)
			if(!all.has(URLString[0])&&URLString[1]) {
				all.add(URLString[0]);
				console.log((URLString[0]).replace(/^http/, "ttp").replace(/#.*$/, ""));
			}
		});
		Array.from(PageDocument.getElementsByTagName('img')).forEach(link=>{ //Images
			let URLString = FormatURL(link.src)
			if(!all.has(URLString[0])&&URLString[1]) {
				all.add(URLString[0]);
				console.log((URLString[0]).replace(/^http/, "ttp").replace(/#.*$/, ""));
			}
		});
		Array.from(PageDocument.getElementsByTagName('*')).forEach(link=>{ //Background images
			let URLString = FormatURL(link.style.backgroundImage.slice(5, -2))
			if(!all.has(URLString[0])&&URLString[1]) {
				all.add(URLString[0]);
				console.log((URLString[0]).replace(/^http/, "ttp"));
			}
		});
	}
	
	function FormatURL(String) {
		let IsStringValid = true
		if (String=="javascript:void(0);"||String=="none"||String=="") {
			IsStringValid = false
		}
		if (IsStringValid) {
			if (/^\/+/.test(String)) {
				String = String.replace(/^\/+/, "https://")
			} else if (/^(?!http(s)?:\/\/)/.test(String)) {
				String = String.replace(/^/, "https://")
			}
		}
		return [String, IsStringValid]
	};
	
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