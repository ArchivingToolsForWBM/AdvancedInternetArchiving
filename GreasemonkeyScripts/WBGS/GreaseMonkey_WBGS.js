// ==UserScript==
// @name         WBGS - Auto-check "Save results in a new Sheet."
// @namespace    WBGS_autocheck
// @version      0.1
// @description  So duped processes don't overwrite save results.
// @include      https://archive.org/services/wayback-gsheets/*
// @grant        none
// ==/UserScript==

(function() {
	const ListOfTrackingURLs = new Set()
	
	setInterval(Code, 100)
	//^Had to be an interval instead of a timeout because when you click on links to another WBGS page, that isn't a page refresh
	// rather a dynamic page (https://en.wikipedia.org/wiki/Dynamic_web_page ) similar to being on twitter and clicking on links
	// to another twitter page, which result in this JS code not executing until you refresh the page.
	
	
	function Code() {
		if (window.location.href == "https://archive.org/services/wayback-gsheets/check?method=archive" && document.querySelectorAll('input[type=checkbox]')[2].checked == false) {
			document.querySelectorAll('input[type=checkbox]')[2].click()
			//^Had to use .click() instead of just directly setting the checked state to true bc if user interacts with other inputs, it will uncheck it.
			// Probably because of this: https://stackoverflow.com/questions/30488218/checkbox-onchange-event-not-firing that JS setting checked to true
			// does not fire the onchange event because it is changing the attribute.
		}
		let ProcessTrackingURLString = ""
		if (document.querySelectorAll("small")[1] !== undefined) {
			if (/^Tracking URL/.test(document.querySelectorAll("small")[1].innerText)) {
				ProcessTrackingURLString = document.querySelectorAll("small")[1].innerText.match(/https:\/\/archive\.org\/services\/wayback-gsheets\/check[^\s]+$/)[0]
				if (ListOfTrackingURLs.has(ProcessTrackingURLString)==false) {
					console.log("Tracking URL: " + ProcessTrackingURLString.replace(/^https/, "ttps")) //URLs in the console log gets truncated and the text may not be preserved depending on browser.
					ListOfTrackingURLs.add(ProcessTrackingURLString)
				}
			}
		}
	}
})();