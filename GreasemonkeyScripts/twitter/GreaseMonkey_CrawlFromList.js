// ==UserScript==
// @name	Crawl Twitter links, videos (internal) and images.
// @namespace	twitter.com
// @version	0.1
// @description	Extracts URLs and have them stored in a set (browser storage)
// @include	*
// @grant	GM.setValue
// @grant	GM.getValue
// @grant	GM.registerMenuCommand
// ==/UserScript==
//NOTE: include had to be any site so that you can start the process on any page, so that it goes to a twitter page on the first URL on "ListOfURLs".
//
//
//Usage notes:
//-When editing "ListOfURLs", and after you save, refresh the page using this script so that the change is applied and loads the first URL correctly.
//-This script also works on any page with infinite loading, if you edit the code in "GetTwitterLinks" to not filter certain URLs.
//--However, if you have the page loads longer than the number of seconds in "LoadWaitTime" here, you will miss extracting links from the content that haven't been loaded yet.
//
//How to use:
//1.      Edit this script on ListOfURLs, a list of twitter URLs. Works best if the URL contains multiple tweets, such as replies
//        or searches.
//1.1     Make any necessary changes in "Settings" (below). For example, if you have slow internet connection, I recommend setting "LoadWaitTime" to a higher number.
//2.      Save. Any currently opened tab using this script needs to be refreshed to reflect the changes.
//3.      Open the monkey menu and on user script commands (assuming you are using greasemonkey):
//3.1     Clear the list ("TwitCrawl - clear URL list") so you can get rid of potentially unwanted URLs
//4.      Open the dev tools and on console, so you'll see if the script is working or not.
//5.      Open the monkey menu and click on "TwitCrawl - Start" to start crawling. It will open each URL in "ListOfURLs" in the same order as the text.
//7.      If you get an alert box, then there is something wrong with the browser storage (I never ran into these issues during testing, I would assume
//        either due to memory corruption, out of memory or something...). Fix whatever issue you have and reset this script ("TwitCrawl - Stop and reset.")
//8.      Once all the URLs have been traversed and get the alert box saying it is done, open the monkey menu and click on "Print twitter URL extraction to console log"
//        The console log will now have the list (without duplicates) displayed for you to copy.

(async () => {
	//Settings
		const ScrollDistancePerSecond = 840 //How many, in pixels scrolled, per second
		const LoadWaitTime = 10 //How many seconds after detecting a scroll stop before loading next URL (this is so that it waits to load more tweets)
		//failsafe if too many items in the set could cause memory issues
			const MaxSetSize = 100000
	//Don't Touch
		var PreviousYScrollPosition = 0
		var HowManySecondsOfNoScroll = 0
		let IsPageLoaded = false
		var ScrollingDirection = -1
			//^This makes it so the page starts scrolling upwards (long tweet threads that is above the tweet you are on and you scroll up causes the page's origin to "shift upwards"),
			// which sets your scroll position and the entire page to a lower position.
			// We first scroll upwards, and when a stop has reached for a certain amount of time, then switch to downwards, and if a stop happens for a certain amount of time, load
			// next URL.
	//List of URLs to visit when bottom is reached
const ListOfURLs = `
https://twitter.com/search?q=from%3Atwitter%20until%3A2020-01-01&src=typed_query&f=top
https://twitter.com/search?q=from%3Atwitter%20until%3A2019-01-01&src=typed_query&f=top
`
	//Monkey menu
		async function Reset() {
			await GM.setValue("TwitterURLIndex", -2); //TwitterURLIndex == -2 so that when starting a process will automatically load the first URL
			await GM.setValue("TwitterURLSequence_Enabled", false);
		}
		GM.registerMenuCommand("TwitCrawl - Stop and reset.", Reset, "R");
		
		async function Start() {
			await GM.setValue("TwitterURLIndex", -2)
			await GM.setValue("TwitterURLSequence_Enabled", true);
		}
		GM.registerMenuCommand("TwitCrawl - Start", Start, "R");
		
		
		async function ClearTwitterSetList() {
			await GM.setValue("TwitterURLsSet", new Set()).then(
				() => {
				/* success */
					window.alert("Set list is cleared.");
				},
				() => {
				/* failure */
					window.alert("Set list fail to clear.");
				}
			);
		}
		GM.registerMenuCommand("TwitCrawl - clear URL list", ClearTwitterSetList, "R");
		
		async function PrintOutList() {
			//Credit goes to Mozilla: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write
			
			let List = await GM.getValue("TwitterURLsSet", new Set())
			List = [...List]
			let StringOfList = ""
			for (let i = 0; i < List.length; i++) {
				StringOfList += List[i]
				if (i != List.length - 1) {
					StringOfList += "\n"
				}
			}
			
			console.log("TwitCrawl - List of URLs:\n" + StringOfList)
		}
		GM.registerMenuCommand("Print twitter URL extraction to console log", PrintOutList, "C");
	//Get storage values
		var TwitterURLSet = await GM.getValue("TwitterURLsSet", new Set()).catch(function(reason) {
			window.alert("Loading URL set failed!")
		});
	//Start code
		window.addEventListener('scroll',GetTwitterLinks);
		window.addEventListener('scroll', AutoClickShowReplies)
		const MainLoopIntervalID = setInterval(MainLoop, 1000)
	
	
	async function GetTwitterLinks() {
		Array.from(document.querySelectorAll('a[href*="/"]')).forEach(link=>{
			if(!TwitterURLSet.has(link.href)&&Boolean(link.href.match(/twitter\.com\/(?!privacy|notifications|messages|home|explore|search-advanced|tos)[^\\?&\\.\\/\\:]+$/))) {
				AddTo_TwitterURLSet(link.href);
			}
		});
		Array.from(document.querySelectorAll('a[href*="/status/"]')).forEach(link=>{
			let TweetURL = link.href.match(/https:\/\/twitter\.com\/[a-zA-Z0-9_]+\/status\/\d+/)[0]
			if(!TwitterURLSet.has(TweetURL)&&link.href.match(/twitter\.com\/.+?\/status\/\d+/)) {
				AddTo_TwitterURLSet(TweetURL);
			}
		});
		Array.from(document.querySelectorAll('a[href*="/i/events/"]')).forEach(link=>{
			if(!TwitterURLSet.has(link.href)&&link.href.match(/twitter\.com\/i\/events\/\d+/)) {
				AddTo_TwitterURLSet(link.href);
			}
		});
		Array.from(document.querySelectorAll('[src*="pbs.twimg.com"]')).forEach(link=>{
			if(!TwitterURLSet.has(link.src)) {
				AddTo_TwitterURLSet(link.src);
			}
		});
		Array.from(document.querySelectorAll('[src*="video.twimg.com/"]')).forEach(link=>{
			if(!TwitterURLSet.has(link.src)) {
				AddTo_TwitterURLSet(link.src);
			}
		});
		//Console log how many items were added
			console.log("TwitCrawl - Extraction count: " + BigInt(TwitterURLSet.size).toString(10));
		//Save it to a storage
			await GM.setValue("TwitterURLsSet", TwitterURLSet).then(
				() => {},
				() => {
				/* failure */
					window.alert("Uhh, saving URL set to storage failed.");
				}
			);
	}
	function AddTo_TwitterURLSet(Entry) {
		if (TwitterURLSet.size < MaxSetSize && (typeof Entry == "string")) {
			TwitterURLSet.add(Entry)
		} else {
			window.alert("Twitter URL set maximum has been reached!");
		}
	}
	
	function AutoClickShowReplies() {
		for (let i = 0; i < document.getElementsByTagName("SPAN").length; i++) {
			if (document.getElementsByTagName("SPAN")[i].innerText == "Show replies") {
				document.getElementsByTagName("SPAN")[i].click()
			}
		}
		for (let i = 0; i < document.getElementsByTagName("DIV").length; i++) { //"Show additional replies, including those that may contain offensive content"
			if (document.getElementsByTagName("DIV")[i].innerText == "Show") {
				document.getElementsByTagName("DIV")[i].click()
			}
		}
	}
	async function MainLoop() {
		let URL_index = await GM.getValue("TwitterURLIndex", -1).catch(function(reason) {
			window.alert("Loading URL index failed!")
			Reset()
		});
		
		let TwitterURLSequenceEnabled = await GM.getValue("TwitterURLSequence_Enabled", false).catch(function(reason) {
			window.alert("Loading sequence enabled status failed!")
			Reset()
		})
		if (TwitterURLSequenceEnabled) {
			if (URL_index >= -1) {
				//First, wait until page is loaded
					for (let i = 0; i < (document.getElementsByTagName("input").length) && (IsPageLoaded == false); i++) {
						if (document.getElementsByTagName("input")[i].hasAttribute("type")) { //Failsafe if attribute missing
							if (document.getElementsByTagName("input")[i].type="text") {
								IsPageLoaded = true
							}
						}
					}
					
					if (IsPageLoaded == false) { //If tweets not loaded yet
						console.log("TwitCrawl - Page not loaded yet")
					} else { //If page are loaded
							PreviousYScrollPosition = window.scrollY //Previous position to see if the page has been scrolled.
						//Autoscroll
							window.scrollTo(0, window.scrollY+(ScrollDistancePerSecond * ScrollingDirection)); //Try to scroll the page
						//Check if bottom has reached resulting in scrolling stops. If no scrolling for consecutive LoadWaitTime , load next URL.
							if (PreviousYScrollPosition == window.scrollY) { //If no scrolling occured
								HowManySecondsOfNoScroll++ //Increment the number of seconds of no scroll
								HowManySecondsOfNoScroll = clamp(HowManySecondsOfNoScroll, 0, LoadWaitTime) //Clamp the seconds counter to avoid negative number display
								
								if (ScrollingDirection == -1) {
									console.log("TwitCrawl - Scroll top reached. Seconds left before changing switching to scroll down: " + (LoadWaitTime - HowManySecondsOfNoScroll).toString(10))
								} else {
									console.log("TwitCrawl - Scroll bottom reached. Seconds left before loading next URL: " + (LoadWaitTime - HowManySecondsOfNoScroll).toString(10))
								}
								if (HowManySecondsOfNoScroll >= LoadWaitTime) {
									if (ScrollingDirection == -1) {
										ScrollingDirection = 1 //Top has reached for a certain amount of time, now switch to scroll down
									} else { //scrolls down, be at the bottom long enough
										NextURL(URL_index)
									}
								}
							} else { //Scrolling occured
								HowManySecondsOfNoScroll = 0 //reset the counter
								if (ScrollingDirection == -1) {
									console.log("TwitCrawl - Scrolling upward...")
								} else {
									console.log("TwitCrawl - Scrolling downward...")
								}
							}
							PreviousYScrollPosition = window.scrollY
					}
			} else {
				URL_index++
				NextURL(URL_index)
			}
		}
	}
	async function NextURL(URL_index) { //A parameter was need because "URL_index" is a let-local variable that loses its value when going out of scope, including calling a function.
		URL_index++
		await GM.setValue("TwitterURLIndex", URL_index).then(
		() => {
			//Success
				if (URL_index < ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length&&URL_index>=0) {
					console.log("TwitCrawl - Sequence URL progress: " + BigInt(URL_index+1).toString(10) + "/" + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length).toString(10) + " (" + clamp(((URL_index+1)*100)/ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length).toFixed(2) + "%, " + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length-URL_index-1).toString(10) + " remaining, Visiting: " + ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] + " )")
					location.href = ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] //Code stops executing after this executes.
				} else {
					alert("Done!")
					Reset()
				}
		},
		() => {
			//Failed
				window.alert("Writing next URL index to storage failed")
				Reset()
		});
	}
	function clamp(num, min, max) {
		//Restrict a number within a specified range.
			if (isNaN(num) == true) {
				num = 0
			}
			return num <= min ? min : num >= max ? max : num;
	}
})();