// ==UserScript==
// @name         Template
// @namespace    https://twitter.com
// @version      0.2
// @description  WTF Twitter
// @include      https://twitter.com*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @grant        GM.
// ==/UserScript==
(function() {
	//Settings
		const Setting_Delay = 3000

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
					let Content = Array.from(document.getElementsByTagName("DIV")).filter((Element) => {
						return ((Element.dataset.testid) == "cellInnerDiv" && (Element.textContent != ""))
					}).map((Element) => {
						
						let MediaURLs = Array.from(document.getElementsByTagName("*")).filter((Element) => {
							if (Element.tagName == "IMG") {
								return true
							}
							return false
						}).map((Element) => {
							if (Element.tagName == "IMG") {
								return Element.src
							}
						}).filter((URL) => {
							return /https?:\/\/pbs\.twimg\.com\/(?:media|profile_images)/.test(URL)
						})
						MediaURLs = Array.from(new Set(MediaURLs))
						return {
							URLViewedFrom: window.location.href,
							HTMLData: Element.innerHTML,
							MediaURLs: MediaURLs
						}
					})
					
					
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