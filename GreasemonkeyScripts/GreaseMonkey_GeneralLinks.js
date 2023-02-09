// ==UserScript==
// @name         Extract any links from any site
// @namespace    any site
// @version      0.2
// @description  try to take over the world!
// @include      *
// @grant        none
// ==/UserScript==

//Notes:
//- This was tested on firefox.
//- If you are extracting a large number of links, make sure:
//-- On firefox, go on the search bar and enter "about:config", "Accept the Risk and Continue" and type "HUD" and find these settings:
//--- devtools.hud.loglimit (this is the console log limit for the console.log per-tab)
//--- devtools.hud.loglimit.console (same as above but for firefox's browser console: https://firefox-source-docs.mozilla.org/devtools-user/browser_console/index.html )
//   And set them to a number: 2147483647 else the log may DELETE entries to make more room.
//- Make sure you have "Persist Logs"/"Preserve log" enabled. Loading a different page on the main window or if the page have "console.clear()" in its code will
//  delete your console.log
//-If a page uses iframe (multiple windows in a document), this script will ONLY grab links from the main window.
(function() {
	//Settings
		const Interval_captureLinks = true //Capture based on intervals (run this code perodically), false = no, true = yes.
		const CaptureLinksInterval = 100 //Time (milliseconds) between each execution of code to extract links, used when Interval_captureLinks = true.

	//"all" is a set that contains only unique items, the console.log however isn't necessarily a set so that COULD have duplicate items in it.
	//The [(!all.has(URLString[0])] code makes it so that if something is already on the set, then don't add the duplicate. However,
	//Because "all" is per-tab, and also resets when going to a different pages, duplicates may appear on the console log when the console.log's
	//"Persist Log" (gear icon on the top-right of the devtool UI).
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
		if ((/^\s*javascript:.*$/.test(String))||String=="none"||String=="") {
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
		window.addEventListener('load',getLink.bind(null, CurrentDocument));
		if (Interval_captureLinks) {
			const CaptureLinksIntervalID = setInterval(getLink, CaptureLinksInterval, CurrentDocument)
		}
		if (window.frames.length) { //Loop through every window and extract their links too (NOTE: will not extract recursively)
			for (let i=0;i<window.frames.length;i++) {
				CurrentDocument = window.frames[i].document
				CurrentDocument.addEventListener('scroll',getLink.bind(null, CurrentDocument));
				CurrentDocument.addEventListener('load',getLink.bind(null, CurrentDocument));
				if (Interval_captureLinks) {
					const CaptureLinksIntervalID = setInterval(getLink, CaptureLinksInterval, CurrentDocument)
				}
			}
		}
	})

})();