// ==UserScript==
// @name         Nitter - report failed to load URL
// @namespace    nitter.net
// @version      0.2
// @description  If page loads and its an error/protected page, logs its URL.
// @include      https://nitter.net/*
// ==/UserScript==

//Use this in conjunction with "GreaseMonkey_Sequential_URLVisit", and after that is done,
//on the console log (assuming you didn't clear it), search for:
// -"URLStatus_Nitter_NotFound" to find URLs that either failed to load temporally or if tweets not load at all
// -"URLStatus_Nitter_Inaccessible" to find inaccessible URLs (protected tweets/suspended).

(function() {
	//Get some info
		let URL_Status = {
			TweetNotLoaded: false,
			IsTweetsProtected: false,
			IsUserSuspended: false
		}
		//Now determine if these are true
			if (document.getElementsByClassName("tweet-date").length == 0 && window.location.href != "https://nitter.net/search") { //No tweet are loaded when errors occured.
				URL_Status.TweetNotLoaded = true
			}
			for (let i = 0; i < document.getElementsByTagName("H2").length && URL_Status.IsTweetsProtected == false; i++) {
				if (document.getElementsByTagName("H2")[i].innerHTML == "This account\'s tweets are protected.") {
					URL_Status.IsTweetsProtected = true
				}
			}
			for (let i = 0; i < document.getElementsByTagName("SPAN").length && URL_Status.IsUserSuspended == false; i++) {
				if (/User \"[a-zA-Z\d_]+\" has been suspended/.test(document.getElementsByTagName("SPAN")[i].innerHTML)) {
					URL_Status.IsUserSuspended = true
				}
			}
	//Report to console log
		if (URL_Status.TweetNotLoaded == true && (URL_Status.IsTweetsProtected == false && URL_Status.IsUserSuspended == false)) {
			console.log("URLStatus_Nitter_NotFound: " + window.location.href.replace(/^h/, ""))
		}
		if (URL_Status.IsTweetsProtected || URL_Status.IsUserSuspended) {
			console.log("URLStatus_Nitter_Inaccessible: " + window.location.href.replace(/^h/, "") + " " + JSON.stringify(URL_Status))
		}
})();