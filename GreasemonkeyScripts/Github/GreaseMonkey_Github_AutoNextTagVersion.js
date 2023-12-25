// ==UserScript==
// @name         Github release tag next-er
// @namespace    any site
// @version      0.2
// @description  Auto-clicks next
// @include      https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
	//settings
		const Github_AutoNext_IntervalNext = 1000
			//^Number of milliseconds between each click of the next button
		const Github_UsernamePart = "(?:(?!(?:about|codespaces|collections|contact|customer\\-stories|enterprise|features|git\\-guides|images|login|mobile|organizations|orgs|premium-support|pricing|readme|search|security|signup|sitemap|solutions|sponsors|team|topics|trending|users))[A-Za-z0-9\\-]+)"
	//Not to touch unless you know what you're doing
		let RaceConditionLock = false
			//^This prevents concurrent runs of the code as a failsafe.
	//Main code
		window.onload = setInterval(MainCode, Github_AutoNext_IntervalNext)
	
	
		function MainCode() {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				
				let ArrayOfAHref = Array.from(document.getElementsByTagName("a"))
				let NextButton = ArrayOfAHref.find((HTMLElement) => {
					if (HTMLElement.hasAttribute("href")) {
						if (RegExp("^https:\\/\\/github\\.com\\/" + Github_UsernamePart + "\\/[A-Za-z0-9_.\\-]+\\/tags\\?after=").test(HTMLElement.href) && HTMLElement.innerText == "Next") {
							return true
						}
					} else {
						return false
					}
				})
				NextButton.click()
				RaceConditionLock = false
			}
		}
})();