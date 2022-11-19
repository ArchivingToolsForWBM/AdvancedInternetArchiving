// ==UserScript==
// @name	Crawl Twitter links, videos (internal) and images.
// @namespace	twitter.com
// @version	0.1
// @description	Extracts URLs and have them stored in a set (browser storage)
// @include	*
// @grant	GM.setValue
// @grant	GM.getValue
// @grant	GM.registerMenuCommand
// @grant	GM.setClipboard
// ==/UserScript==
//NOTE: include had to be any site so that you can start the process on any page, so that it goes to a twitter page on the first URL on "ListOfURLs".
//
//
//Usage notes:
//-When editing "ListOfURLs", and after you save, refresh the page using this script so that the change is applied and loads the first URL correctly.
//-This script also works on any page with infinite loading, if you edit:
//--the code in "GetTwitterLinks" to not filter certain URLs.
//--remove the code between [Get tweets that have "Show this thread"] and the comment below it
//-If you have the page loads longer than the number of seconds in "LoadWaitTime" here, you will miss extracting links from the content that haven't been loaded yet.
//-The output will includes URLs of tweets, images, media, and a tweet URL of a tweet that have "Show Replies".
//-Make sure ONLY 1 tab is running this. Each tab running this causes concurrent writes to browser storage (getValue and setValue) and could replace each other rather
// than combining them. The index number pointing to which URL to load could increment by more than 1, skipping it entirely. Plus it is very slow and could trigger twitter's rate limits.
//
//How to use:
//1.      Edit this script on ListOfURLs, a list of twitter URLs. Works best if the URL contains multiple tweets, such as replies
//        or twitter search. Do note that on search and timelines, some tweets that do match may not appear due to indexing limitations, as twitter said in its help page:
//        https://help.twitter.com/en/using-twitter/missing-tweets under "Tweets on my profile are cut off after a specific date".
//
//        To get around this, my real advice is that you use the search bar and search using restrictive filters, and break them into multiple searches. For example, by date, if you
//        want (virtually) all tweets within 2020-01-01 to 2020-01-31, don't do this:
//
//          Example_search since:2020-01-01 until:2020-01-31
//
//        Instead break this up into multiple searches, be it roughly every 7 days, or each day (if the tweets you are searching happens to have tons of tweets per day):
//
//          Example_search since:2020-01-01 until:2020-01-02
//          Example_search since:2020-01-03 until:2020-01-04
//
//
//        I would assume this happens by freeing up the search index capacity since a "broad" search will have "too many results" that some tweets won't show up due to others
//        taking over, while specific searches will limit many tweets, making it easier for tweets that meet the search criteria to show up.
//
//        The URL format of twitter search is this: https://twitter.com/search?q=(SearchBarContent)&src=typed_query&f=top[&f=TabFilter] Note that certain characters may be
//        percent-encoded: https://en.wikipedia.org/wiki/Percent-encoding .
//          (SearchBarContent) = The text you entered in the search bar
//          [&f=TabFilter] = (optional) Search type, if this entirely omitted, would be "Top", otherwise if "TabFilter" is:
//          live = "Latest" tab
//          user = "People" tab
//          image = "Photos" tab
//          video = "Videos" tab
//
//1.1     Make any necessary changes in "Settings" (below). For example, if you have slow internet connection, I recommend setting "LoadWaitTime" to a higher number.
//2.      Save. Any currently opened tab using this script needs to be refreshed to reflect the changes.
//3.      Open the monkey menu and on user script commands (assuming you are using greasemonkey):
//3.1     Clear the list ("TwitCrawl - clear URL list") so you can get rid of potentially unwanted URLs
//4.      Open the dev tools and on console, so you'll see if the script is working or not.
//5.      Open the monkey menu and click on "TwitCrawl - Start" to start crawling. It will open each URL in "ListOfURLs" in the same order as the text.
//7.      If you get an alert box, then there is something wrong with the browser storage (I never ran into these issues during testing, I would assume
//        either due to memory corruption, out of memory or something...). Fix whatever issue you have and reset this script ("TwitCrawl - Stop and reset.")
//8.      Once all the URLs have been traversed and get the alert box saying it is done, open the monkey menu and click on "Print twitter URL extraction to clipboard"
//        The console log will now have the list (without duplicates) displayed for you to copy.
//
//The list contains all the extracted URLs, including ones detected to have "Show replies" if you wanted to extract additional tweets from a tweet.

(async () => {
	//Settings
		const ScrollDistancePerSecond = 1000 //How many, in pixels scrolled, per second
		const LoadWaitTime = 2 //How many seconds after detecting a scroll stop before loading next URL (this is so that it waits to load more tweets)
		//failsafe if too many items in the set could cause memory issues
			const MaxSetSize = 100000
	//Don't Touch
		var PreviousYScrollPosition = 0
		var HowManySecondsOfNoScroll = 0
		let IsPageInitallyLoaded = false
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
		GM.registerMenuCommand("TwitCrawl - Start", Start, "S");
		
		
		async function ClearTwitterSetList() {
			if (confirm("Are you sure you want to clear the extraction list?")) {
				await GM.setValue("TwitterURLsSet", new Set()).then(
					() => {
					/* success */
						TwitterURLSet = new Set()
						console.log("TwitCrawl - Set list is cleared.");
					},
					() => {
					/* failure */
						console.log("TwitCrawl - Set list fail to clear.");
					}
				);
			}
		}
		GM.registerMenuCommand("TwitCrawl - clear URL list", ClearTwitterSetList, "C");
		
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
			
			GM.setClipboard("TwitCrawl - List of URLs:\n" + StringOfList);
			window.alert("List copied into clipboard.");
		}
		GM.registerMenuCommand("Print twitter URL extraction to clipboard", PrintOutList, "C");
	//Get storage values
		var TwitterURLSet = await GM.getValue("TwitterURLsSet", new Set()).catch(function(reason) {
			window.alert("Loading URL set failed!")
		});
	//Start code
		window.addEventListener('scroll',GetTwitterLinks);
		window.addEventListener('scroll', AutoClickShowReplies)
		const MainLoopIntervalID = setInterval(MainLoop, 1000)
	
	
	async function GetTwitterLinks() {
		//URLs and media
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
			Array.from(document.getElementsByTagName("a")).forEach(link=>{ //for some reason, querySelectorAll('[src*="t.co/"]') does not work
				if (link.hasAttribute("href")) {
					if(!TwitterURLSet.has(link.href) && /^http(s)?:\/\/t\.co\/.*$/.test(link.href)) {
						AddTo_TwitterURLSet(link.href);
					}
				}
			});
		//Get tweets that have "Show this thread"
			Array.from(document.getElementsByTagName("a")).forEach((link, i)=>{
				if(document.getElementsByTagName("a")[i].innerText == "Show this thread" && document.getElementsByTagName("a")[i].hasAttribute("href")) {
					let Item = link + " (Show this thread)"
					if(!TwitterURLSet.has(Item)) {
						AddTo_TwitterURLSet(Item)
					}
				}
			});
		//Get twitter URLs the browser is on that have potentially missed URLs, such as "Something went wrong. Try reloading."
			let SomethingWentWrong = false
			for (let i = 0; i < document.getElementsByTagName("SPAN").length && SomethingWentWrong == false; i++ ) {
				if(document.getElementsByTagName("SPAN")[i].innerText == "Something went wrong. Try reloading."||document.getElementsByTagName("SPAN")[i].innerText == "Looks like you lost your connection. Please check it and try again.") {
					AddTo_TwitterURLSet(window.location.href + " (May contain missed URLs)")
					SomethingWentWrong = true
				}
			}
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
		for (let i = 0; i < document.getElementsByTagName("SPAN").length; i++) { //In long threads some tweets are "collapsed".
			if (document.getElementsByTagName("SPAN")[i].innerText == "Show replies"||document.getElementsByTagName("SPAN")[i].innerText == "Show more replies") {
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
		GetTwitterLinks() //Just in case if no scrolling occured and misses extracting links.
		let URL_index = await GM.getValue("TwitterURLIndex", -1).catch(function(reason) {
			window.alert("Loading URL index failed!")
			Reset()
		});
		
		let TwitterURLSequenceEnabled = await GM.getValue("TwitterURLSequence_Enabled", false).catch(function(reason) {
			window.alert("Loading sequence enabled status failed!")
			Reset()
		})
		//Loading content besides the whole screen is loading i.e tweets, clicking on "Show". Unlike "IsPageInitallyLoaded",
		//which remains true after page initially loads without user input, "IsPageCurrentlyLoadingSubContent" can be false again.
			let IsPageCurrentlyLoadingSubContent = false
			if (document.getElementsByTagName("circle").length != 0) {
				IsPageCurrentlyLoadingSubContent = true
			}
		if (TwitterURLSequenceEnabled) {
			if (URL_index >= -1) {
				//First, wait until page is loaded
					if (document.getElementsByTagName("circle").length == 0) {
						IsPageInitallyLoaded = true
					}
					
					if (IsPageInitallyLoaded == false) { //If tweets not loaded yet
						console.log("TwitCrawl - Page not loaded yet")
					} else { //If page are loaded
							PreviousYScrollPosition = window.scrollY //Previous position to see if the page has been scrolled.
						//Autoscroll
							//First check if this is a search (because a twitter search ALWAYS starts the scroll position at the top of the page and NEVER loads as you scroll up, unlike tweets that have other tweets before it in a thread)
								if (/http(s)?\:\/\/(mobile\.)?twitter\.com\/search\?q=/.test(window.location.href)) {
									ScrollingDirection = 1
								}
							//Don't skip over "Show" content (collapsed tweets)
								if (IsPageCurrentlyLoadingSubContent == false) {
									window.scrollTo(0, window.scrollY+(ScrollDistancePerSecond * ScrollingDirection)); //Try to scroll the page
								}
						//Check if bottom has reached resulting in scrolling stops. If no scrolling for consecutive LoadWaitTime , load next URL.
							if ((PreviousYScrollPosition == window.scrollY) && (IsPageCurrentlyLoadingSubContent == false)) { //If no scrolling occurred
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
							} else { //Scrolling occurred
								HowManySecondsOfNoScroll = 0 //reset the counter
								if (ScrollingDirection == -1) {
									console.log("TwitCrawl - Scrolling/loading upward...")
								} else {
									console.log("TwitCrawl - Scrolling/loading downward...")
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