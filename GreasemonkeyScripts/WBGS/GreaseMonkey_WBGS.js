// ==UserScript==
// @name         WBGS - Auto-check "Save results in a new Sheet."
// @namespace    WBGS_autocheck
// @version      0.1
// @description  So duped processes don't overwrite save results.
// @include      https://archive.org/services/wayback-gsheets/*
// @grant        none
// ==/UserScript==

(function() {
	setInterval(Code, 100)
	//^Had to be an interval instead of a timeout because when you click on links to another WBGS page, that isn't a page refresh
	// rather a dynamic page (https://en.wikipedia.org/wiki/Dynamic_web_page ) similar to being on twitter and clicking on links
	// to another twitter page, which result in this JS code not executing until you refresh the page.
	
	let hasClicked = false
	
	function Code() {
		if (window.location.href == "https://archive.org/services/wayback-gsheets/check?method=archive" && document.querySelectorAll('input[type=checkbox]')[2].checked == false) {
			document.querySelectorAll('input[type=checkbox]')[2].click()
			hasClicked = true
		}
	}
})();