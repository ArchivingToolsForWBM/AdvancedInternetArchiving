// ==UserScript==
// @name         Copy list of URLs in email
// @version      0.2
// @description  EZ copy list of URLs
// @include      https://mail.google.com/mail/u/*
// @grant    GM.setClipboard
// ==/UserScript==
(() => {
	
	document.addEventListener(
		"click",
		function (e) {
			if (e.ctrlKey) {
				let ListOfLinks = [...e.target.getElementsByTagName("a")].map((URLLink) => {
					return URLLink.href
				})
				let ListOfURLsExtracted_String = ""
				ListOfLinks.forEach((URLLink, Index, ListOfLinksArray) => {
					ListOfURLsExtracted_String += URLLink
					if (Index != ListOfLinksArray.length-1) {
						ListOfURLsExtracted_String += "\n"
					}
				})
				GM.setClipboard(ListOfURLsExtracted_String)
			}
		}
	)
})();