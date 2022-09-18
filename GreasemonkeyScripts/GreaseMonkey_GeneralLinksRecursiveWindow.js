// ==UserScript==
// @name         Extract any links from any site
// @namespace    any site
// @version      0.2
// @description  try to take over the world!
// @include      *
// @grant        none
// ==/UserScript==

//Credit goes to hacker09 on GreasyFork: https://greasyfork.org/en/discussions/requests/65921-feature-request-extract-links-as-the-user-scroll-down-general-purpose-any-site
//for hints on how to set up a code to read the document to obtain links.
//
//Notes:
//- This was tested on firefox.
//- If you are extracting a large number of links, make sure:
//-- On firefox, go on the search bar and enter "about:config", "Accept the Risk and Continue" and type "HUD" and find these settings:
//--- devtools.hud.loglimit (this is the console log limit for the console.log per-tab)
//--- devtools.hud.loglimit.console (same as above but for firefox's browser console: https://firefox-source-docs.mozilla.org/devtools-user/browser_console/index.html )
//   And set them to a number: 2147483647 else the log may DELETE entries to make more room.
//- Make sure you have "Persist Logs"/"Preserve log" enabled. Loading a different page on the main window or if the page have "console.clear()" in its code will
//  delete your console.log. At the time of writing this (2022-08-14), I've discovered that firefox doesn't have the ability to disobey console.clear(): https://bugzilla.mozilla.org/show_bug.cgi?id=1267856

(function() {
	//Settings
		const Interval_captureLinks = true //Capture based on intervals (run this code perodically), false = no, true = yes.
		const CaptureLinksInterval = 100 //Time (milliseconds) between each execution of code to extract links, used when Interval_captureLinks = true.
		const IframeMaxRecursion = 50
			//^When there is an iframe and multiple windows, this is the max recusion before cutting off further innser windows (failsafe to stop potential infinute loops/stack size exceeds)
	//Don't touch
		let IframeRecursionCount = 0 //Tracks how many levels deep sub-window frames to scan into.

	//"all" is a set that contains only unique items, the console.log however isn't necessarily a set so that COULD have duplicate items in it.
	//The [(!all.has(URLString[0])] code makes it so that if something is already on the set, then don't add the duplicate. However,
	//Because "all" is per-tab, and also resets when going to a different pages, duplicates may appear on the console log when the console.log's
	//"Persist Log" (gear icon on the top-right of the devtool UI).
	'use strict';
	const all = window.allLink = new Set();
		//^"all" is a set that is used to avoid or mitigate duplicate items in the console log. You'll still get duplicates
		// if this gets reset via pagereload/load-to-another-page. Does not reset if only subwindows are refreshed/new-page-load.
	function ExtractLinksFromPage(PageDocument) {
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
	function addEventListenersToPages(Input_Window) {
		//This adds even listeners to each window when the main windiw is first loaded, then if there are
		Input_Window.addEventListener('scroll',ExtractLinksFromPage.bind(null, Input_Window.document));
		Input_Window.addEventListener('load',ExtractLinksFromPage.bind(null, Input_Window.document));
		for (let i=0; ((i<Input_Window.frames.length)&&(IframeRecursionCount<IframeMaxRecursion));i++) {
			IframeRecursionCount++
			addEventListenersToPages(Input_Window.frames[i])
			IframeRecursionCount-- //Don't count as total number of function calls, just how many levels deep.
		}
	}
	
	function ExtractLinksOnWindow(Input_Window) {
		//This extracts links in the current window, then searches for any subwindow, calls itself recursively
		//to extract its links and across multiple windows (multiple windows that aren't inside of another). Best used
		//when the subwindows loaded a different document but the main window didn't, by calling this function again.
		ExtractLinksFromPage(Input_Window.document)
		for (let i=0; ((i<Input_Window.frames.length)&&(IframeRecursionCount<IframeMaxRecursion));i++) {
			IframeRecursionCount++
			ExtractLinksOnWindow(Input_Window.frames[i])
			IframeRecursionCount-- //Don't count as total number of function calls, just how many levels deep.
		}
	}
	
	
	window.addEventListener('scroll',addEventListenersToPages.bind(null, window));
	window.addEventListener('load',addEventListenersToPages.bind(null, window));
	if (Interval_captureLinks) {
		const IntervalID = setInterval(ExtractLinksOnWindow, CaptureLinksInterval, window)
	}

})();