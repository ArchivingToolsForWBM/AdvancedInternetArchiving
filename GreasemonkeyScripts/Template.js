// ==UserScript==
// @name         Template
// @namespace    example.com
// @version      0.2
// @description  try to take over the world!
// @include      example.com/*
// @grant        none
// ==/UserScript==
(function() {
	//Settings
		const Setting_Delay = 1000

	//Stuff you don't touch unless you know what you're doing.
		let RaceConditionLock = false
			//^This prevents concurrent runs of the code as a failsafe.
		//no duplicates on the console log
			const SetOfURLs = new Set()
		//Run code periodically (recommended for dynamic web pages, infinite scrolling)
			window.onload = setInterval(MainCode, Setting_Delay)
	//MainCode, runs periodically and used to extract page content.
		function MainCode() {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				//Code here
				RaceConditionLock = false
			}
		}
	//reused Functions
		function ConsoleLoggingURL(URL_String) {
			let URL_truncateProof = URL_String.replace(/^http/, "ttp")
			if (!SetOfURLs.has(URL_truncateProof)) {
				console.log(URL_truncateProof)
				SetOfURLs.add(URL_truncateProof)
			}
		}
})();