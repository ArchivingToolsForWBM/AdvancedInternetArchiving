// ==UserScript==
// @name     Load URLs in a sequence.
// @version  1
// @grant    GM.setValue
// @grant    GM.getValue
// @grant    GM.registerMenuCommand
// @include      *
// ==/UserScript==
'use strict';

//Notes:
// -Anytime you edit this script and save, make sure you refresh the page so the loaded JS code reflect the changes.
// -Also, every time you start this script, ALWAYS reset this by going onto the Greasemonkey script menu on
//  "User Script Commands..." and click on "Stop and reset URL sequence" just in case the script bugs out and start
//  on whatever position last set.
// -Beware of anything that would pause your browser, such as a download prompts and any popup box that you cannot
//  focus on your browser.
// -Sometimes, pages may error out temporally (like error 503). Make sure you have a script that sends info to the
//  web console containing a URL and some string of text that you can find it (e.g ThisURLFailedToLoad:
//  https://example.com) so you can then extract those and retry extracting them.

(async () => {
//Settings
	const TimeBeforeLoadingNextURL = 5000 //How many milliseconds after the page fully loads before loading the next URL.
	const TimeBeforeOrAfterLoad = 0
		//0 = Start timer to load next URL after page fully loads
		//1 = Start timer to load next URL before page fully loads.
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
	
	if (TimeBeforeOrAfterLoad == 0) {
		window.addEventListener('load', LoadURLAfterTimer)
	} else {
		LoadURLAfterTimer()
	}
	
	function LoadURLAfterTimer() {
		setTimeout(LoadAnotherPage, TimeBeforeLoadingNextURL)
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
				console.log("Sequence URL progress: " + BigInt(URL_index+1).toString(10) + "/" + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length).toString(10) + " (" + clamp(((URL_index+1)*100)/ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length).toFixed(2) + "%, " + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length-URL_index-1).toString(10) + " remaining, Visiting: " + ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] + " )")
				location.href = ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] //Code stops executing after this executes.
			} else {
				alert("Done!")
				Reset()
			}
		}
	}
	function clamp(num, min, max) {
	//Restrict a number within a specified range.
		if (isNaN(num) == true) {
			num = 0
		}
		return num <= min ? min : num >= max ? max : num;
	}
})();