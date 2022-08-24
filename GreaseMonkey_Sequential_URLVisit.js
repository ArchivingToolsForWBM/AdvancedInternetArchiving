// ==UserScript==
// @name     Load URLs in a sequence.
// @version  1
// @grant    GM.setValue
// @grant    GM.getValue
// @grant    GM.registerMenuCommand
// @include      *
// ==/UserScript==
'use strict';


(async () => {
//-----------------------------------------------------------
	const ListOfURLs = `
https://google.com
https://wikipedia.org
	`
//-----------------------------------------------------------
	async function Reset() {
		await GM.setValue("URLIndex", -1);
		await GM.setValue("URLSequence", false);
	}
	GM.registerMenuCommand("Stop and reset URL sequence", Reset, "R");
	
	async function StartSequence() {
		await GM.setValue("URLIndex", -1);
		await GM.setValue("URLSequence", true);
		LoadURLAfterTimer()
	}
	GM.registerMenuCommand("Start URL sequence", StartSequence, "S");
	
	window.addEventListener('load', LoadURLAfterTimer)
	
	function LoadURLAfterTimer() {
		setTimeout(LoadAnotherPage, 2000)
	}
	
	
	async function LoadAnotherPage() {
		let IsSequenceOn = await GM.getValue("URLSequence", false);
		if (IsSequenceOn) {
			let URL_index = await GM.getValue("URLIndex", -1);
			URL_index++
			if (Number.isNaN(URL_index)||URL_index>=ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length) {
				URL_index = -1
			}
			await GM.setValue("URLIndex", URL_index);
			if (URL_index < ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length&&URL_index>=0) {
				console.log("sequence URL progress: " + BigInt(URL_index+1).toString(10) + "/" + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length).toString(10) + " (" + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length-URL_index-1).toString(10) + " remaining, Visiting: " + ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] + ")")
				location.href = ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] //Code stops executing after this executes.
			} else {
				alert("Done!")
				Reset()
			}
		}
	}
})();