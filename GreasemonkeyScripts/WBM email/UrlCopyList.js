// ==UserScript==
// @name         Copy list of URLs in email
// @version      0.2
// @description  EZ copy list of URLs
// @include      https://mail.google.com/mail/u/*
// @grant    GM.setClipboard
// ==/UserScript==
(() => {
	//Usage:
	// -To insta-select the list of URLs you entered, just have your mouse to the right of the list of URLs, hold down CTRL, and double-click.
	// -Same applies to the WBM results, just CTRL+double-click the area to the right of the list.
	//After this, you can then CTRL+C to copy the text and go to "AdvancedInternetArchiving/JS tools/Email SPN2/", open the HTML and paste your
	//stuff there to find bad saves.
	//
	//I made this (some code belong to others, see comments) because to select only the list of URLs requires mouse precision, and gmail can
	//sometimes refresh the page's content which will remove the text selection, which is annoying and frustrating.
	document.addEventListener(
		"dblclick",
		function (e) {
			if (e.ctrlKey) {
				let nodeOfWBMResultListItem = {}
				try {
					nodeOfWBMResultListItem = e.target.parentNode
				} catch {
					return
				}
				if (!/^(?:OL|LI)$/.test(nodeOfWBMResultListItem.tagName)) {
					//The list of URLs you sent
					e.preventDefault()
					let div = getClosest(e.target, "DIV");
					if (div !== null) {
						let range = new Range();
						range.selectNodeContents(div);
						document.getSelection().removeAllRanges();
						document.getSelection().addRange(range);
					}
				} else {
					//WBM email result
					e.preventDefault()
					let ol = getClosest(e.target, "OL");
					if (ol !== null) {
						let range = new Range();
						range.selectNodeContents(ol);
						document.getSelection().removeAllRanges();
						document.getSelection().addRange(range);
					}
				}
				
				//GM.setClipboard(emailText)
			}
		}
	)
	
	//Reused functions
		//Credit:
		// https://keestalkstech.com/2014/04/click-to-select-all-on-the-pre-element/
		// https://www.sanwebe.com/2014/04/select-all-text-in-element-on-click
		// This returns the nearest desired element "tagName" from "el" as it ascends the node tree.
		function getClosest(el, tagName) {
			tagName = tagName && tagName.toUpperCase();
			if (!tagName || !el) //If isn't a tag or an element (invalid HTML element as a failsafe) return
				return null;
			do
			if (el.nodeName === tagName) //If matching tag is found, return that element
				return el;
			while (el = el.parentNode); //Ascend node until matching tag name, if none found, return null
			return null;
		}
})();