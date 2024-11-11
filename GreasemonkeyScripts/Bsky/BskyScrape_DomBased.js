// ==UserScript==
// @name         Bsky-scrape
// @namespace    https://bsky.app/
// @version      0.2
// @description  try to take over the world!
// @include      https://bsky.app/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// ==/UserScript==
(async function() {
	//NOTES:
	//Best works on firefox because of my testing:
	//-Best to have URLs have the "http" substring replaced with "ttps" because firefox truncate long links and doesn't keep the original full URL when copying them (the middle is
	// replaced with ellipsis), if you are using the devtools.
	//-Chrome will truncate object parts printed on the console log, and those aren't preserved
	//-Chrome, for some reason have "textContent" be a blank string if it is an element far offscreen. However this code does have a failsafe that if such data is missing (like user handle),
	// it will not accept storing that. This means if you are using google chrome, will not extract all posts that exists in the HTML rather extracts only posts that is on-screen, unlike
	// firefox.
	//-If you navigate to (click on links) another bsky page, the list of process stored here will not unload posts that are no longer visible that were once visible before you navigate
	// due to the entire page not refreshing. This means that if you say navigate from the user profile page to a posts, several posts from the profile page persist while being on a
	// post page. This script will detect loaded-but-invisible lists and ignore them.
	//-This scripts assumes that the reply post system follows a "tree structure": https://en.wikipedia.org/wiki/Tree_(data_structure) - The first post that isn't a reply to anything is
	// the "root" post each post can have multiple replies, but what it's replying to only goes to 1 post. Therefore the attribute "ReplyToURL" only contains 1 URL, and "RepliesURLs" is
	// a list of replies to the post.
	//-This script will work on post pages if you are logged in, because the dom tree layout of posts are different when viewing a post vs not logged in. I strongly recommend that you
	// are because users can sometimes have their post content hidden from public view.
	//-While this script is scanning the document, I don't recommend doing so while content is loading. This includes scrolling while the scanning is active. Best way to handle this
	// is hit "start" only when loading is done and you are not scrolling, then hit stop. Preferably scroll down as far as you can go, then start-stop.
	//-The bsky home page after logging in won't work due to different layout, and also a potential privacy concern (like leaving the script running.)
	//-Does not work if the URL is "base-64 mode", e.g. https://bsky.app/profile/did:plc:<base_64_string>
	//-This tool only works if you have the language setting set to "English" on the app language. This is because the page layout and info layout must match with the regex in order to work.
	// In case of future of new settings, I recommend using default settings for stuff besides the app language.
	//-If using google chrome or any browser with its own translating feature, do not translate it as it breaks things. For example: Content flagged as "Sexually Suggestive", the button
	// does not change text after it was translated, and causes this script to repeatedly show and hide repeatedly.
	//--Any form of page-altering feature of the browser or another extension that would change the page layout will also break this.
	//Settings
	// Note: Changes apply when the page is refreshed. Either reload the page via a browser or enter the address bar. It's not a reload if only part of the page loads content while
	// everything else persist.
		const Setting_http_ttp = false
			//^true = All URLs in the output start with "ttp" instead of "http" (to avoid URL truncation like what firefox does; replacing the middle of string with ellipsis).
			// false = leave it as http. NOTE that this counts as a "different URL" when this script detects a post that is already saved, causing it to save duplicates.
		const Setting_ShowLocalTimeInTimestamp = true
			//^true = PostTimeStamp sub-object will contain the local timestamp
			//^false = no (will only show the UTC and milliseconds (page only shows minutes as lowest units of time, so it assumes whole minutes) since epoch)
		const Setting_PostImageFullRes = true
			//^true = all image URLs in the post will be full resolution versions (including external link preview images)
			// false = use potentially downsized resolution from the HTML.
		const Setting_ProfileImageFullRes = true
			//^Save as above but for profile images
		const Setting_MaxNumberOfPosts = -1
			//^-1 = No limit on how many posts
			// <any positive number> = The maximum number of post can be saved. Once reached, any new post won't
			// be added and console log will state that the max is reached. It does not delete any posts in the
			// list if above the limit
		const Setting_MaxNumberOfProfiles = 100
			//^-1 = no limit
			// <any positive number> = The maximum number of profiles can be saved. Same as above.
		const Setting_AllowFlaggedSexuallySuggestive = true
			//^false = no, don't reveal and scrape content flagged as sexually suggestive
			// true = yes.
			// NOTE: If you manually click "show", the scraper will scrape anything that is visible on the page, even things on the page you clicked on that causes things on it to change.

	//Stuff you don't touch unless you know what you're doing.
		let RaceConditionLock = false
			//^This prevents concurrent runs of the code as a failsafe.
		let ConfirmationPause = false
			//^This makes the reset function not fail should the main code execute right when the user
			// selects reset.
		let HaveAlertedUnreconizedURL = false
			//^prevents repeated alerts when on a unrecognized URL e.g. https://bsky.app/profile/did:plc:<base64string>
		//no duplicates on the console log
			const SetOfURLs = new Set()
			const SetOfPostsURLs = new Set()
		//Some load/save values (note that here execute only once and during a page load)
			let Saved_Setting_StartStop = false
			let Saved_Setting_ScanFrequency = 1000
			let Saved_Extracted_Posts = []
			let Saved_Extracted_Profiles = []
			
			UpdateSavedValues()
			
			let ID_TimeoutScrapeContent = 0
		//Run code
			//Code that spawns the UI on the bottom right
				setTimeout(LoadScrapeUI, 1500)
			//Main code
				if (Saved_Setting_StartStop) {
					ID_TimeoutScrapeContent = setTimeout(CheckForHiddenContent, 2000)
				}
			
		//Copy to clipboard
			let CopiedListOfPosts = ""
			let CopiedListOfProfiles = ""
		//Elements we need to have remember so we can make changes on them
			let Div_PostSaveCount = {}
			let Div_ProfileSaveCount = {}
			let Button_StopStart = {}
			let Input_ScanFrequency = {}
			let Span_ScanFrequencySecCount = {}
			
			
		//Counters for display
			let Counter_Profile_Saved = 0
			let Counter_Post_Saved = 0
	//Spawn a UI
		async function LoadScrapeUI() {
			//div box
			let BoxOfUI = document.createElement("div")
			//BoxOfUI.setAttribute("style", "position: fixed;bottom: 40px;right: 40px;z-index: 999; background-color: rgba(64, 64, 64, .5); color: #ffffff; border-radius: 30px; padding: 15px;")
			BoxOfUI.style.position = "fixed"
			BoxOfUI.style.bottom = "40px"
			BoxOfUI.style.right = "40px"
			BoxOfUI.style.zIndex = "999"
			BoxOfUI.style.backgroundColor = "rgba(64, 64, 64, .5)"
			BoxOfUI.style.color = "#ffffff"
			BoxOfUI.style.borderRadius = "30px"
			BoxOfUI.style.padding = "15px"
			
			let Title = document.createElement("h2")
			Title.appendChild(document.createTextNode("Blue sky scraper"))
			Title.setAttribute("style", "text-align: center;")
			BoxOfUI.appendChild(Title)
			
			//Start/stop button
			Button_StopStart = document.createElement("button")
			Button_StopStart.setAttribute("style", "width: 50px;")
			let BskyScrape_StartStopFlag = Saved_Setting_StartStop
			let Button_StopStart_Text = "Start"
			if (BskyScrape_StartStopFlag) {
				Button_StopStart_Text = "Stop"
			}
			Button_StopStart.appendChild(document.createTextNode(Button_StopStart_Text))
			Button_StopStart.addEventListener(
				"click",
				async function () {
					BskyScrape_StartStopFlag = !BskyScrape_StartStopFlag
					
					if (BskyScrape_StartStopFlag) {
						this.textContent = "Stop"
						CheckForHiddenContent()
					} else {
						this.textContent = "Start"
						if (typeof ID_TimeoutScrapeContent != "undefined") {
							clearTimeout(ID_TimeoutScrapeContent);
						}
					}
					
					await GM.setValue("BskyScrape_StartStopFlag", BskyScrape_StartStopFlag)
				}
			)
			BoxOfUI.appendChild(Button_StopStart)
			
			//Copy data into clipboard button (readable)
			let CopyToClipboardButton = document.createElement("button")
			CopyToClipboardButton.appendChild(document.createTextNode("Copy to clipboard"))
			CopyToClipboardButton.addEventListener(
				"click",
				function() {CopyExtractedContent(" ")}
			)
			BoxOfUI.appendChild(CopyToClipboardButton)
			
			//Copy data into clipboard button (compressed)
			let CopyToClipboardButtonCompressed = document.createElement("button")
			CopyToClipboardButtonCompressed.appendChild(document.createTextNode("Copy to clipboard (compressed)"))
			CopyToClipboardButtonCompressed.addEventListener(
				"click",
				function() {CopyExtractedContent()}
			)
			BoxOfUI.appendChild(CopyToClipboardButtonCompressed)
			
			//Reset button
			let ResetButton = document.createElement("button")
			ResetButton.appendChild(document.createTextNode("Reset"))
			ResetButton.addEventListener(
				"click",
				async function () {
					ConfirmationPause = true
					if (window.confirm("Bsky-scrape: Are you sure you want to reset?")) {
						BskyScrape_StartStopFlag = false
						HaveAlertedUnreconizedURL = false
						Button_StopStart.textContent = "Start"
						if (typeof ID_TimeoutScrapeContent != "undefined") {
							clearTimeout(ID_TimeoutScrapeContent);
						}
						
						Saved_Extracted_Posts = []
						Saved_Extracted_Profiles = []
						await GM.setValue("BSkyScrape_PostList", "[]")
						await GM.setValue("BSkyScrape_ProfileList", "[]")
						
						if (Div_ProfileSaveCount != null) {
							Div_ProfileSaveCount.textContent = "0"
						}
						
						if (Div_PostSaveCount != null) {
							Div_PostSaveCount.textContent = "0"
						}
					}
					ConfirmationPause = false
				}
			)
			BoxOfUI.appendChild(ResetButton)
			
			//table
			let TableUI = document.createElement("table")
			
			//Row - scan frequency
			
			let TableRow0 = document.createElement("tr")
			TableUI.appendChild(TableRow0)
			
			let TableCell_0_0 = document.createElement("td")
			TableCell_0_0.setAttribute("title", "The amount of time between each scanning for scraping.")
			TableCell_0_0.appendChild(document.createTextNode("Scan frequency "))
			TableRow0.appendChild(TableCell_0_0)
			
			let TableCell_0_1 = document.createElement("td")
			Input_ScanFrequency = document.createElement("input")
			Input_ScanFrequency.setAttribute("type", "range")
			Input_ScanFrequency.setAttribute("min", "500")
			Input_ScanFrequency.setAttribute("max", "10000")
			Input_ScanFrequency.setAttribute("step", "500")
			Input_ScanFrequency.setAttribute("value", Saved_Setting_ScanFrequency)
			Input_ScanFrequency.addEventListener(
			"input",
			async function () {
				Span_ScanFrequencySecCount.textContent = (parseInt(this.value)/1000).toFixed(1)
				await GM.setValue("BskyScrape_ScanFrequency", this.value)
			})
			TableCell_0_1.appendChild(Input_ScanFrequency)
			TableCell_0_1.appendChild(document.createElement("br"))
			TableCell_0_1.setAttribute("style", "text-align: center;")
			
			Span_ScanFrequencySecCount = document.createElement("span")
			Span_ScanFrequencySecCount.appendChild(document.createTextNode((Saved_Setting_ScanFrequency/1000).toFixed(1)))
			TableCell_0_1.appendChild(Span_ScanFrequencySecCount)
			TableCell_0_1.appendChild(document.createTextNode(" sec"))
			TableRow0.appendChild(TableCell_0_1)
			
			//Row - "Number of posts saved: "
			let TableRow1 = document.createElement("tr")
			TableUI.appendChild(TableRow1)
			
			let TableCell_1_0 = document.createElement("td")
			TableCell_1_0.appendChild(document.createTextNode("Number of posts saved: "))
			TableRow1.appendChild(TableCell_1_0)
			
			let TableCell_1_1 = document.createElement("td")
			Div_PostSaveCount = document.createElement("span")
			Div_PostSaveCount.appendChild(document.createTextNode(Saved_Extracted_Posts.length.toFixed(0)))
			TableCell_1_1.appendChild(Div_PostSaveCount)
			TableRow1.appendChild(TableCell_1_1)
			
			
			//Row - Number of profiles
			let TableRow2 = document.createElement("tr")
			TableUI.appendChild(TableRow2
			)
			let TableCell_2_0 = document.createElement("td")
			TableCell_2_0.appendChild(document.createTextNode("Number of profiles saved: "))
			TableRow2.appendChild(TableCell_2_0)
			
			let TableCell_2_1 = document.createElement("td")
			Div_ProfileSaveCount = document.createElement("span")
			Div_ProfileSaveCount.appendChild(document.createTextNode(Saved_Extracted_Profiles.length.toFixed(0)))
			TableCell_2_1.appendChild(Div_ProfileSaveCount)
			TableRow2.appendChild(TableCell_2_1)
			
			BoxOfUI.appendChild(TableUI)
			
			
			//Add the box to the HTML
			let HTMLBody = [...document.getElementsByTagName("BODY")].find((Element) => {return true})
			let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
			if (InnerNodeOfHTMLBody.IsSuccessful) {
				document.body.insertBefore(BoxOfUI, HTMLBody.childNodes[0]);
			}
		}
	//Reused UI menu functions
		function CopyExtractedContent(string) {
			let Text = ""
			let ObjectOfProfilesAndPosts = {
				ListOfProfiles: Saved_Extracted_Profiles,
				ListOfPosts: Saved_Extracted_Posts
			}
			GM.setClipboard(JSON.stringify(ObjectOfProfilesAndPosts, null, string))
		}
	//Reveal hidden content (show/hide button)
	//This is the main code that executes periodically, reflecting changes when more posts get loaded as well as when hidden posts (e.g. posts flagged as sexually suggestive that requires clicking on a button to show).
	//If certain hidden posts you wished to be revealed and scraped are detected, it autoclicks them to show them, wait until all posts revealed, then scrapes afterwards.
		function CheckForHiddenContent() {
			let IsThereHiddenContent = false
			let Buttons = [...document.querySelectorAll("BUTTON")].forEach((ele) => {
				if (Setting_AllowFlaggedSexuallySuggestive && /^Sexually Suggestive/.test(ele.textContent)) {
					if (/Show$/.test(ele.textContent)) {
						ele.click()
						IsThereHiddenContent = true
					}
				}
			})
			if (IsThereHiddenContent) { //If there is hidden content, reveal them and schedule a re-run of this code to check again
				ID_TimeoutScrapeContent = setTimeout(CheckForHiddenContent, 100) //Content being clicked on will not immediately show results, so delay is needed
			} else {
				ScrapeContent()
				//Otherwise all is shown, scrape it immediately (not just because its unnecessary to delay it, its to avoid a situation that IsThereHiddenContent==false,
				//then a change on the HTML (like you clicking "hide" after it is shown) is made that IS hidden, and then scrapes that) 
				ID_TimeoutScrapeContent = setTimeout(CheckForHiddenContent, Saved_Setting_ScanFrequency)
			}
		}
	//ScrapeContent, grabs profile and posts.
		async function ScrapeContent() {
			if (RaceConditionLock) {
				return
			}
			UpdateSavedValues()
			RaceConditionLock = true
			//Code here
				let DateTimeOfScrape = ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(Date.now()).toISOString())
				
				let isLoggedIn = false
				{
					let SignUpButton = [...document.getElementsByTagName("BUTTON")].find((Button) => {
						return (Button.textContent == "Sign up")
					})
					if (typeof SignUpButton == "undefined") {//No signup button is found, indicating the user is logged in.
						isLoggedIn = true
					}
				}
				let UserPostArea = []
				let Profile = {}
				let ListOfPosts = [] //List of each individual posts
				if (/https:\/\/bsky\.app\/(?:profile\/(?:[a-zA-Z\d\-]+\.)+(?:[a-zA-Z\d\-]+)\/?)?$/.test(window.location.href)) { //profile/front page
					//First, find an a href link to a profile as a reference. We get the lowest node that at least has all the posts on the page
					UserPostArea = GetPostBoxesByLink(11)
					
					//"UserPostArea" will now contain "boxes" that may either be a horizontal line, containing 1 or 2 posts (2 if it has replies, with a vertical line between 2 avatars)
					UserPostArea.forEach((Box, BoxIndex) => { // Loop each box
						//[profile page]
						let RecommendationBoxes = ""
						try {
							RecommendationBoxes = Box.childNodes[0].childNodes[0].childNodes[0].textContent
						} catch {}
						if (/(?:Suggested for you|Similar accounts)/.test(RecommendationBoxes)) {
							return
						}
						let EndOfFeed = ""
						try {
							EndOfFeed = Box.childNodes[0].childNodes[0].textContent
						} catch {}
						if (EndOfFeed == "End of feed") {
							return
						}
						
						if (typeof Box.childNodes != "undefined") {
							let BoxListingPosts = [...Box.childNodes]
							let BoxListingPostsLengthCache = BoxListingPosts.length
							let PostGroup = []
							for (let i = 0; i < BoxListingPostsLengthCache; i++) { //Loop each posts (BoxListingPosts[i] should return a post), within a box
								//
								//Box - the whole box, if there are multiple posts as a reply, it encompasses all
								//Box.childNodes[X] - each post within a box
								//Box.childNodes[X].childNodes[0].childNodes[0] - The space above the posts, a spot for reply line to above
								//Box.childNodes[X].childNodes[0].childNodes[0].childNodes[1] - Re-posted message (0x12 dimension if not a repost)
								//Box.childNodes[X].childNodes[0].childNodes[1] - Post area
								//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[0] - Avatar image and reply line below
								//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1] - post content
								//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1].childNodes[0] - User title, handle and timestamp
								//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1].childNodes[1] - Post content (text, media, and embedded posts)
								//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[X] - each segment of above
								//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1].childNodes[2] - Replies, reposts, and likes.
								
								let RepostedByUserTitle = ""
								let ReplyToUserTitle = ""
								let PostURL = "" //URL of post (if viewing its URL directly, then it is the browser's [window.location.href])
								
								let PostHasRepliesLineBelow = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
								let PostIsAReplyLineToAbove = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
								let IsCurrentPostURL = false //Used to determine the post that doesn't have a href link to determine the post below it is a reply to it
								
								let ReplyToURL = "" //Reply to post above
								let RepliesURLs = [] //Replies of the current post
								let UserTitle = ""
								let UserHandle = ""
								let UserAvatar = ""
								let PostTimeStamp = {}
								let PostContent = {}
								let ReplyCount = ""
								let RepostCount = ""
								let LikesCount = ""
								
								let Post = BoxListingPosts[i]
								
								if (Post.textContent != "View full thread") {
									//Link to post
									{
										try {
											PostURL = Post.childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes[0].childNodes[2].href
										} catch (e) {
											alert("Failed to extract link (" + e + ")")
										}
									}
									if (PostURL == "https://bsky.app/profile/summerchill14.bsky.social/post/3l7kgtjibcq2u") {
										let bp = 0
									}
									//RepostedByUser
									try {
										let RepostedText = Post.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[1].textContent
										if (RepostedText != "") {
											RepostedByUserTitle = RepostedText
										}
									} catch {}
									//ReplyToUser
									let ReplyOffset = 0
									try {
										let ReplyToText = Post.childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes[1].childNodes[1].textContent
										if (ReplyToText != "") {
											ReplyToUserTitle = ReplyToText
											ReplyOffset = 1
										}
										
									} catch {}
									//Reply downwards line
									{
										try {
											let DownwardPostLine = Post.childNodes[0].childNodes[0].childNodes[2].childNodes[0].childNodes[1]
											if (typeof DownwardPostLine != "undefined") {
												PostHasRepliesLineBelow = true
											}
										} catch {}
									}
									//Reply upwards line
									{
										try {
											let UpwardPostLine = Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0]
											if (typeof UpwardPostLine != "undefined") {
												PostIsAReplyLineToAbove = true
											}
										} catch {}
									}
									//User title
									{
										try {
											UserTitle = Post.childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent
										} catch (e) {
											alert("Failed to extract user title")
										}
									}
									//User handle
									{
										try {
											UserHandle = CleanString(Post.childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].textContent)
										} catch (e) {
											alert("Failed to extract user handle")
										}
									}
									//User Avatar
									{
										try {
											UserAvatar = ConvertAvatarImgToFullRes(Post.childNodes[0].childNodes[0].childNodes[2].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src)
										} catch (e) {
											alert("Failed to extract avatar")
										}
									}
									//Post time stamp
									{
										try {
											PostTimeStamp = PostDateInfo(Post.childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip)
										} catch (e) {
											alert("Failed to extract timestamp")
										}
									}
									//Post content
										try {
											PostContent = GetPostContent(Post.childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes[1+ReplyOffset], "Post_UserFontPage")
										} catch (e) {
											alert("Failed to extract post content")
										}
									
									
									//Reply, repost, and likes
									{
										//let NodeOfReplyRepostLikes_Array = []
										////Post.childNodes[0].childNodes[0].childNodes[1].childNodes[N]
										////where N is the last element because sometimes a post have duplicate counts between the date and timestamp at the bottom
										//let NodeOfFoooter = DescendNode(Post, [0,0,1,1])
										//if (NodeOfFoooter.IsSuccessful) {
										//	let LastNode = [...NodeOfFoooter.OutputNode.childNodes].at(-1)
										//	NodeOfReplyRepostLikes_Array = [...LastNode.childNodes]
										//}
										//if (typeof NodeOfReplyRepostLikes_Array[2] != "undefined") { //role="progressbar" - posts not fully loaded
										//	ReplyCount = NodeOfReplyRepostLikes_Array[0].textContent //prone to errors
										//	RepostCount = NodeOfReplyRepostLikes_Array[1].textContent
										//	LikesCount = NodeOfReplyRepostLikes_Array[2].textContent
										//}
										try {
											let ReplyRepostLikesBar = [...Post.childNodes[0].childNodes[0].childNodes[2].childNodes[1].childNodes].at(-1)
											ReplyCount = ReplyRepostLikesBar.childNodes[0].textContent
											RepostCount = ReplyRepostLikesBar.childNodes[1].textContent
											LikesCount = ReplyRepostLikesBar.childNodes[2].textContent
										} catch (e) {
											alert("Failed to extract reply repost and likes bar")
										}
									}
									if ((PostURL != "")&&(UserTitle != "")&&(UserHandle != "")) {
										PostGroup.push({
											RepostedByUserTitle: RepostedByUserTitle,
											ReplyToUserTitle: ReplyToUserTitle,
											PostURL: PostURL,
											ReplyConnections: {
												PostHasRepliesLineBelow: PostHasRepliesLineBelow,
												PostIsAReplyLineToAbove: PostIsAReplyLineToAbove,
												IsCurrentPostURL: IsCurrentPostURL,
												IsViewFullThread: false
											},
											ReplyToURL: ReplyToURL,
											RepliesURLs: RepliesURLs,
											UserTitle: UserTitle,
											UserHandle: UserHandle,
											UserAvatar: UserAvatar,
											PostTimeStamp: PostTimeStamp,
											PostContent: PostContent,
											ReplyCount: ReplyCount,
											RepostCount: RepostCount,
											LikesCount: LikesCount,
											DateTimeOfScrape: DateTimeOfScrape
										})
									}
								} else {
									//Post ommitted in between (a non-post array element saying "View full thread")
									//We need this object in the array, then reply-connect-detect,
									//then filter out the non-posts
									PostGroup.push({
										ReplyConnections: {
											IsViewFullThread: true
										}
									})
								}
							}
							//Now fill out the reply to and from that are inside a box (connect them)
							let PostGroupLengthCache = PostGroup.length
							for (let i = 0; i < PostGroupLengthCache; i++) {
								if (PostGroup[i].ReplyConnections.PostHasRepliesLineBelow && (!PostGroup[i].ReplyConnections.IsViewFullThread)) {
									if (i+1 < PostGroupLengthCache) {
										if (PostGroup[i+1].ReplyConnections.PostIsAReplyLineToAbove && (!PostGroup[i+1].ReplyConnections.IsViewFullThread)) {
											if (!PostGroup[i].RepliesURLs.includes(PostGroup[i+1].PostURL)) {
												PostGroup[i].RepliesURLs.push(PostGroup[i+1].PostURL) //Current post has reply
											}
											if (PostGroup[i+1].ReplyToURL == "") {
												PostGroup[i+1].ReplyToURL = PostGroup[i].PostURL //In reply to a post above
											}
										}
									}
								}
							}
							PostGroup = PostGroup.filter((Post) => {
								return (!Post.ReplyConnections.IsViewFullThread)
							})
							ListOfPosts.push(...PostGroup)
						}
					})
					//Obtain user profile
						let ProfileNode = {}
						
						let UserProfileHandle = [...document.getElementsByTagName("DIV")].find((DivElement) => {
							if (isAncestorsStyleDisplayNone(DivElement)) {
								return false
							}
							let OuterNodeNotAAhref = AscendNode(DivElement, 1)
							if (!OuterNodeNotAAhref.IsSuccessful) {
								return false
							}
							if (!(/^@(?:[a-zA-Z\d\-]+\.)+[a-zA-Z\d\-]+$/.test(DivElement.innerHTML))) {
								return false
							}
							if (OuterNodeNotAAhref.OutputNode.tagName == "A") {
								return false
							}
							ProfileNode = AscendNode(DivElement, 4).OutputNode
							return true
						})
						if (typeof UserProfileHandle != "undefined") {
							
							let ProfileURL = window.location.href
							
							let Profile_UserTitle = ""
							let Node_Profile_UserTitle = DescendNode(ProfileNode, [1,1,0])
							if (Node_Profile_UserTitle.IsSuccessful) {
								Profile_UserTitle = CleanString(Node_Profile_UserTitle.OutputNode.textContent)
							}
							
							let Profile_UserHandle = ""
							let Node_Profile_UserHandle = DescendNode(ProfileNode, [1,1,1])
							if (Node_Profile_UserHandle.IsSuccessful) {
								Profile_UserHandle = CleanString(Node_Profile_UserHandle.OutputNode.textContent)
							}
							
							let Profile_Avatar = ""
							let Node_Profile_Avatar = DescendNode(ProfileNode, [3,0,0,1])
							if (Node_Profile_Avatar.IsSuccessful) {
								Profile_Avatar = Node_Profile_Avatar.OutputNode.src
							}
							
							let Profile_BackgroundImg = ""
							let Node_Profile_BackgroundImg = DescendNode(ProfileNode, [0,0,0,0])
							if (Node_Profile_BackgroundImg.IsSuccessful) {
								Profile_BackgroundImg = Node_Profile_BackgroundImg.OutputNode.src
							}
							
							let Profile_TextContent = {
								Text: ""
							}
							let Node_TextContent = DescendNode(ProfileNode, [1,3])
							if (Node_TextContent.IsSuccessful) {
								Profile_TextContent.Text = Node_TextContent.OutputNode.textContent
								let ListOfLinks = GetLinksURLs(Node_TextContent.OutputNode)
								if (ListOfLinks.length != 0) {
									Profile_TextContent.Links = ListOfLinks
								}
							}
							
							//ProfileNode.childNodes[1].childNodes[3]
							let Profile_FollowCount = ""
							let Profile_FollowingCount = ""
							let Profile_PostCount = ""
							let NodeOfFollowFollowingPost = DescendNode(ProfileNode, [1,2])
							if (NodeOfFollowFollowingPost.IsSuccessful) {
								let ArrayOf_FollowFollowingPost = [...NodeOfFollowFollowingPost.OutputNode.childNodes]
								
								Profile_FollowCount = ArrayOf_FollowFollowingPost[0].textContent.replace(/^([\d\.A-Za-z]+).*$/, "$1")
								Profile_FollowingCount = ArrayOf_FollowFollowingPost[1].textContent.replace(/^([\d\.A-Za-z]+).*$/, "$1")
								Profile_PostCount = ArrayOf_FollowFollowingPost[2].textContent.replace(/^([\d\.A-Za-z]+).*$/, "$1")
							}
							
							Profile = {
								Type: "UserProfile",
								ProfileURL: ProfileURL,
								UserTitle: Profile_UserTitle,
								UserHandle: Profile_UserHandle,
								UserAvatar: Profile_Avatar,
								BackgroundImg: Profile_BackgroundImg,
								TextContent: Profile_TextContent,
								ProfileFollowCount: Profile_FollowCount,
								ProfileFollowingCount: Profile_FollowingCount,
								ProfilePostCount: Profile_PostCount,
								DateTimeOfScrape: DateTimeOfScrape
							}
						}
				} else if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-\.:]+\/post\/[a-zA-Z\d\-]+\/?/.test(window.location.href)) { //Post page or thread page
					//https://bsky.app/profile/<UserHandle>/post/<base64_string>
					//https://bsky.app/profile/did:plc:<base64_string>/post/<base64_string> when "View full thread" is clicked.
					//[post page]
					//First, find an a div containing a timestamp as a reference. We then ascend the nodes to get the lowest node that at least has all the posts.
					//Reason not to get a "a href" link to post is because if there is only 1 post on the page and it is the post you are directly viewing, then
					//there is no a href link we can use as a reference to jump a fixed number of hierarchy levels without being in the wrong node.
					UserPostArea = GetNodeByFooterTimestamp(6)
					
					
					//"UserPostArea" will now contain "boxes" that contains 0 or 1 posts:
					//0 posts if it is a placeholder area or a blank box at the bottom of the page, as well as "Write your Reply"
					
					
					let PostsSeperator = ""
					//^Now, in some time in the future, bsky may be updated to include recommended posts that aren't necessarily a reply to posts above,
					// so this text here serves as a placeholder as the following forEach determine that the adjacent posts are something like "for you"
					// (if such a separator exists, PostsSeperator will update and future boxes in this array will reflect on it (anthing after "for you"))
					
					let PostGroup = []
					UserPostArea.forEach((Box, BoxIndex) => { //Loop each box
						let RepostedByUserTitle = ""
						let PostURL = "" //URL of post (if viewing its URL directly, then it is the browser's [window.location.href])
						
						let PostHasRepliesLineBelow = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
						let PostIsAReplyLineToAbove = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
						let IsCurrentPostURL = false //Used to determine the post that doesn't have a href link to determine the post below it is a reply to it
						let Type = IdentifyPostLayoutType(Box) //Stuff in the column could be a post, a non-post like "Write your Reply"
						
						let ReplyToURL = "" //Reply to post above
						let RepliesURLs = [] //Replies of the current post
						let UserTitle = ""
						let UserHandle = ""
						let UserAvatar = ""
						let PostTimeStamp = {}
						let PostContent = {}
						let ReplyCount = ""
						let RepostCount = ""
						let LikesCount = ""
						
						if (Type == "Post_CurrentlyViewed_AtTop") {
							PostURL = window.location.href
							if (/https:\/\/bsky\.app\/profile\/did:plc/.test(PostURL)) { //"View full thread" button is clicked, goes to a handle-less version of a post URL
								//Replace the "did:plc:<base64_string>" with the handle.
								let UserHandleNoAt = UserHandle.replace(/^@/, "")
								PostURL = PostURL.replace(/(https:\/\/bsky\.app\/profile\/)[a-zA-Z\d\-\.:]+(\/post\/[a-zA-Z\d\-]+\/?)/, "$1" + UserHandleNoAt + "$2")
							}
							
							try {
								UserTitle = Box.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].textContent
							} catch {}
							try {
								UserHandle = CleanString(Box.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].textContent)
							} catch {}
							try {
								UserAvatar = ConvertAvatarImgToFullRes(Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src)
							} catch {}
							PostHasRepliesLineBelow = true
							try {
								let PostAndFooter = [...Box.childNodes[0].childNodes[0].childNodes[1].childNodes]
								let Footer = PostAndFooter.slice(1)
								let ReplyRepostLikes = [...Footer.at(-1).childNodes[0].childNodes]
								
								PostTimeStamp = PostDateInfo(Footer[0].childNodes[0].textContent)
								ReplyCount = ReplyRepostLikes[0].textContent
								RepostCount = ReplyRepostLikes[1].textContent
								LikesCount = ReplyRepostLikes[2].textContent
							} catch (e) {
								alert("Unable to extract footer")
							}
							try {
								PostContent = GetPostContent(Box.childNodes[0].childNodes[0].childNodes[1].childNodes[0])
							} catch {}
						} else if (Type == "Post_CurrentlyViewed_NotAtTop") {
							PostURL = window.location.href
							if (/https:\/\/bsky\.app\/profile\/did:plc/.test(PostURL)) { //"View full thread" button is clicked, goes to a handle-less version of a post URL
								//Replace the "did:plc:<base64_string>" with the handle.
								let UserHandleNoAt = UserHandle.replace(/^@/, "")
								PostURL = PostURL.replace(/(https:\/\/bsky\.app\/profile\/)[a-zA-Z\d\-\.:]+(\/post\/[a-zA-Z\d\-]+\/?)/, "$1" + UserHandleNoAt + "$2")
							}
							try {
								UserTitle = Box.childNodes[0].childNodes[1].childNodes[0].childNodes[1].childNodes[0].childNodes[0].textContent
							} catch {}
							
							try {
								UserHandle = Box.childNodes[0].childNodes[1].childNodes[0].childNodes[1].childNodes[1].childNodes[0].textContent
							} catch {}
							try {
								UserAvatar = ConvertAvatarImgToFullRes(Box.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src)
							} catch{}
							PostHasRepliesLineBelow = true
							try {
								let UpwardPostLine = Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0]
								if (typeof UpwardPostLine != "undefined") {
									PostIsAReplyLineToAbove = true
								}
							} catch {}
							try {
								let PostAndFooter = [...Box.childNodes[0].childNodes[1].childNodes[1].childNodes]
								let Footer = PostAndFooter.slice(1)
								let ReplyRepostLikes = [...Footer.at(-1).childNodes[0].childNodes]
								let a = 0
								PostTimeStamp = PostDateInfo(Footer[0].childNodes[0].textContent)
								ReplyCount = ReplyRepostLikes[0].textContent
								RepostCount = ReplyRepostLikes[1].textContent
								LikesCount = ReplyRepostLikes[2].textContent
							} catch {}
							try {
								PostContent = GetPostContent(Box.childNodes[0].childNodes[1].childNodes[1].childNodes[0], Type)
							} catch {}

							//Box.childNodes[0].childNodes[1].childNodes[1].childNodes[0]
							let NodeOfPostContent = DescendNode(Box, [0,1,1,0])
							if (NodeOfPostContent.IsSuccessful) {
								PostContent = GetPostContent(NodeOfPostContent.OutputNode, Type)
							}
							
						} else if (Type == "Post_NotCurrentlyViewed") {
							try {
								PostURL = Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[2].href
							} catch {}
							try {
								let DownwardPostLine = Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[1]
								if (typeof DownwardPostLine != "undefined") {
									PostHasRepliesLineBelow = true
								}
							} catch {}
							try {
								let UpwardPostLine = Box.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0]
								if (typeof UpwardPostLine != "undefined") {
									PostIsAReplyLineToAbove = true
								}
							} catch {}
							
							try {
								UserTitle = CleanString(Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent)
							} catch {}
							
							try {
								UserHandle = CleanString(Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].textContent)
							} catch {}
							
							try {
								UserAvatar = ConvertAvatarImgToFullRes(Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src)
							} catch {}
							
							try {
								PostTimeStamp = PostDateInfo(Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip)
								
							} catch {}
							
							try {
								PostContent = GetPostContent(Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1], Type)
							} catch {}
							
							try {
								let Footer = [...Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes].at(-1)
								let ReplyRepostLikes = [...Footer.childNodes]
								ReplyCount = ReplyRepostLikes[0].textContent
								RepostCount = ReplyRepostLikes[1].textContent
								LikesCount = ReplyRepostLikes[2].textContent
							} catch {}
						}
						if (/^Post_/.test(Type)&&(PostURL != "")&&(UserTitle != "")&&(UserHandle != "")) {
							PostGroup.push({
								RepostedByUserTitle: RepostedByUserTitle,
								PostURL: PostURL,
								ReplyConnections: {
									PostHasRepliesLineBelow: PostHasRepliesLineBelow,
									PostIsAReplyLineToAbove: PostIsAReplyLineToAbove,
									IsCurrentPostURL: IsCurrentPostURL,
									Type: Type
								},
								ReplyToURL: ReplyToURL,
								RepliesURLs: RepliesURLs,
								UserTitle: UserTitle,
								UserHandle: UserHandle,
								UserAvatar: UserAvatar,
								PostTimeStamp: PostTimeStamp,
								PostContent: PostContent,
								ReplyCount: ReplyCount,
								RepostCount: RepostCount,
								LikesCount: LikesCount,
								DateTimeOfScrape: DateTimeOfScrape
							})
						}
					})
					//Connect replies
					let PostGroupLengthCache = PostGroup.length
					let IndexOfPostCurrentlyViewed = -1
					//^Will be an index value representing the currently viewd post (the one without the a href that you just clicked on)
					// Any posts below it lacking a line pointing upwards are replies to that post
					for (let i = 0; i < PostGroupLengthCache; i++) {
						if (/^Post_CurrentlyViewed/.test(PostGroup[i].ReplyConnections.Type)) {
							IndexOfPostCurrentlyViewed = i
						}
						if ((!PostGroup[i].ReplyConnections.PostIsAReplyLineToAbove) && (i > IndexOfPostCurrentlyViewed) && (IndexOfPostCurrentlyViewed >= 0)) {
							if (!PostGroup[IndexOfPostCurrentlyViewed].RepliesURLs.includes(PostGroup[i].PostURL)) {
								PostGroup[IndexOfPostCurrentlyViewed].RepliesURLs.push(PostGroup[i].PostURL) //Add a reply (without the line pointing upwards) to currently viewed post 
							}
							if (PostGroup[i].ReplyToURL == "") {
								PostGroup[i].ReplyToURL = PostGroup[IndexOfPostCurrentlyViewed].PostURL //In reply to a post above
							}
						}
						if (PostGroup[i].ReplyConnections.PostHasRepliesLineBelow) {
							if (i+1 < PostGroupLengthCache) {
								if (PostGroup[i+1].ReplyConnections.PostIsAReplyLineToAbove) {
									if (!PostGroup[i].RepliesURLs.includes(PostGroup[i+1].PostURL)) {
										PostGroup[i].RepliesURLs.push(PostGroup[i+1].PostURL) //Current post has reply
									}
									if (PostGroup[i+1].ReplyToURL == "") {
										PostGroup[i+1].ReplyToURL = PostGroup[i].PostURL //In reply to a post above
									}
								}
							}
						}
					}
					ListOfPosts.push(...PostGroup)
				} else if (/https:\/\/bsky\.app\/search/.test(window.location.href)) { //Search page
					UserPostArea = GetPostBoxesByLink(9)
					
					UserPostArea.forEach((Post) => {
						if (Post.textContent != "") {
							let RepostedByUserTitle = ""
							let PostURL = "" //URL of post (if viewing its URL directly, then it is the browser's [window.location.href])
							
							let ReplyToURL = "" //Reply to post above
							let RepliesURLs = [] //Replies of the current post
							let UserTitle = ""
							let UserHandle = ""
							let UserAvatar = ""
							let PostTimeStamp = {}
							let PostContent = {}
							let ReplyCount = ""
							let RepostCount = ""
							let LikesCount = ""
							
							//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[2].href
							PostURL = DescendNode(Post, [0,0,1,0,2]).OutputNode.href
							
							//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent
							UserTitle = CleanString(DescendNode(Post, [0,0,1,0,0,0,0,0]).OutputNode.textContent)
							
							//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[1].textContent.replace(/^\s/, "")
							UserHandle = CleanString(DescendNode(Post, [0,0,1,0,0,0,0,1]).OutputNode.textContent)
							
							//Post.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
							//Post.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
							let NodeOfAvatar = DescendNode(Post, [0,0,0,0,0,0,0,0,1])
							if (NodeOfAvatar.IsSuccessful) {
								UserAvatar = ConvertAvatarImgToFullRes(NodeOfAvatar.OutputNode.src)
							}
							
							//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip
							PostTimeStamp = PostDateInfo(DescendNode(Post, [0,0,1,0,2]).OutputNode.dataset.tooltip)
							
							let ReplyToOffset = 0
							//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].textContent
							let NodeOfReplyTo = DescendNode(Post, [0,0,1,1,1])
							if (NodeOfReplyTo.IsSuccessful) {
								if (/^Reply to/.test(NodeOfReplyTo.OutputNode.textContent)) {
									ReplyToOffset++
								}
							}
							
							//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[1]
							PostContent = GetPostContent(DescendNode(Post, [0,0,1,1+ReplyToOffset]).OutputNode, "SearchPage")
							
							//Post.childNodes[0].childNodes[0].childNodes[1].childNodes
							let NodeOfReplyRepostLikes_Array = []
							let NodeOfFoooter = DescendNode(Post, [0,0,1])
							if (NodeOfFoooter.IsSuccessful) {
								let LastNode = [...NodeOfFoooter.OutputNode.childNodes].at(-1)
								let NodeOfFooterDeepest = LastNode
								NodeOfReplyRepostLikes_Array = [...NodeOfFooterDeepest.childNodes]
								
							}
							if (typeof NodeOfReplyRepostLikes_Array[2] != "undefined") { //role="progressbar" - posts not fully loaded
								ReplyCount = NodeOfReplyRepostLikes_Array[0].textContent //prone to errors
								RepostCount = NodeOfReplyRepostLikes_Array[1].textContent
								LikesCount = NodeOfReplyRepostLikes_Array[2].textContent
							}
							if ((PostURL != "")&&(UserTitle != "")&&(UserHandle != "")&&(PostContent.Segments.length != 0)) {
								ListOfPosts.push({
									RepostedByUserTitle: RepostedByUserTitle,
									PostURL: PostURL,
									ReplyToURL: ReplyToURL,
									RepliesURLs: RepliesURLs,
									UserTitle: UserTitle,
									UserHandle: UserHandle,
									UserAvatar: UserAvatar,
									PostTimeStamp: PostTimeStamp,
									PostContent: PostContent,
									ReplyCount: ReplyCount,
									RepostCount: RepostCount,
									LikesCount: LikesCount
								})
							}
						}
						
					})
				} else {
					if (!HaveAlertedUnreconizedURL) {
						window.alert("URL not recognized, please make sure the URL does not contain \"did:plc:<base64string>\" part.")
						HaveAlertedUnreconizedURL = true
					}
				}
				let ListOfPosts_Clean = ListOfPosts.map((ArrayElement) => { //Have a version without ReplyConnections attribute since we do not need it if we are just looking at posts
					return {
						RepostedByUserTitle: ArrayElement.RepostedByUserTitle,
						ReplyToUserTitle: ArrayElement.ReplyToUserTitle,
						PostURL: ArrayElement.PostURL,
						ReplyToURL: ArrayElement.ReplyToURL,
						RepliesURLs: ArrayElement.RepliesURLs,
						UserTitle: ArrayElement.UserTitle,
						UserHandle: ArrayElement.UserHandle,
						UserAvatar: ArrayElement.UserAvatar,
						PostTimeStamp: ArrayElement.PostTimeStamp,
						PostContent: ArrayElement.PostContent,
						ReplyCount: ArrayElement.ReplyCount,
						RepostCount: ArrayElement.RepostCount,
						LikesCount: ArrayElement.LikesCount,
						DateTimeOfScrape: ArrayElement.DateTimeOfScrape
					}
				})
			//Saving...
				if (!ConfirmationPause) {
					//Saving posts
					let SavedBskyPostList = Saved_Extracted_Posts
					ListOfPosts_Clean.forEach((ExtractedPost, ExtractedPostIndex) => {
						//Loop through what we have extracted it, and try to add it to the saved list, unless we already have it, then update it
						let MatchedPostIndex = SavedBskyPostList.findIndex((SavedPost) => { //Search all in the saved list to find a matching post
							return (ExtractedPost.PostURL == SavedPost.PostURL)
						})
						if (MatchedPostIndex == -1) { //If not found, add it to the list
							if (Setting_MaxNumberOfPosts < 0) {
								SavedBskyPostList.push(ListOfPosts_Clean[ExtractedPostIndex])
							} else {
								if (SavedBskyPostList.length < Setting_MaxNumberOfPosts) {
									SavedBskyPostList.push(ListOfPosts_Clean[ExtractedPostIndex])
								} else {
									console.log("Bsky-scrape: post count limit reached.")
								}
							}
						} else {
							//Match occurred, replace it (but keep the list of reply URLs and what's replying to)
							let SavedList_WhatToReplace = SavedBskyPostList[MatchedPostIndex]
							let ExtractList_ReplaceWith = ExtractedPost
							
							let Set_ListOfURLsSaved = new Set(SavedList_WhatToReplace.RepliesURLs) //Start what we have that is saved
							ExtractList_ReplaceWith.RepliesURLs.forEach((Extracted_Replies) => {
								//Loop each reply URLs from what we newly extracted, and add them to the saved version's list of reply URLs,
								//unless if it is already added
								Set_ListOfURLsSaved.add(Extracted_Replies)
							})
							SavedList_WhatToReplace.RepliesURLs = [...Set_ListOfURLsSaved]
							
							if ((SavedList_WhatToReplace.ReplyToURL == "") && (ExtractList_ReplaceWith.ReplyToURL != "")) { //If discovered that the post has a reply, add a URL to it.
								SavedList_WhatToReplace.ReplyToURL = ExtractList_ReplaceWith.ReplyToURL
							}
						}
					})
					await GM.setValue("BSkyScrape_PostList", JSON.stringify(SavedBskyPostList)).then(() => {
						CopiedListOfPosts = JSON.stringify(SavedBskyPostList, null, " ")
						//console.log("Bsky-scrape: extracted post count: " + SavedBskyPostList.length.toFixed(0))
						
						if (Div_PostSaveCount != null) {
							Div_PostSaveCount.textContent = SavedBskyPostList.length.toFixed(0)
						}
					},
					() => {
						window.alert("Bsky-scrape: saving post failed!")
					});
					
					
					//Save profile data
					let SavedBskyProfileList = Saved_Extracted_Profiles
					if ((Object.keys(Profile).length != 0) && (Profile.ProfileURL != "")) {
						let IndexOfSavedMatching = SavedBskyProfileList.findIndex((SavedProfile) => {
							if (SavedProfile.ProfileURL == Profile.ProfileURL) {
								return true
							}
							return false
						})
						
						if (IndexOfSavedMatching == -1) {
							//If haven't add it
							if (Setting_MaxNumberOfProfiles < 0) {
								SavedBskyProfileList.push(Profile)
							} else {
								if (SavedBskyProfileList.length < Setting_MaxNumberOfProfiles) {
									SavedBskyProfileList.push(Profile)
								} else {
									console.log("Bsky-scrape: profile page count limit reached.")
								}
							}
							
						} else {
							//if gotten already, replace it
							SavedBskyProfileList[IndexOfSavedMatching] = Profile
						}
					}
					await GM.setValue("BSkyScrape_ProfileList", JSON.stringify(SavedBskyProfileList)).then(() => {
						CopiedListOfProfiles = JSON.stringify(SavedBskyProfileList, null, " ")
						//console.log("Bsky-scrape: extracted profile count: " + SavedBskyProfileList.length.toFixed(0))
						if (Div_ProfileSaveCount != null) {
							Div_ProfileSaveCount.textContent = SavedBskyProfileList.length.toFixed(0)
						}
					},
					() => {
						window.alert("Bsky-scrape: saving profile failed!")
					});
				} else {
					console.log("Bsky-scrape: Paused")
				}
			
			//Set a breakpoint here after everything loads to test the results stored in "ListOfPosts".
			RaceConditionLock = false
		}
	//reused/helper Functions
		function ConsoleLoggingURL(URL_String) {
			let URL_truncateProof = URL_String.replace(/^http/, "ttp")
			if (!SetOfURLs.has(URL_truncateProof)) {
				console.log(URL_truncateProof)
				SetOfURLs.add(URL_truncateProof)
			}
		}
		function GetPostBoxesByLink(Levels) {
			let ListOfElements = [...document.getElementsByTagName("A")]
			let BoxList = []
			ListOfElements.find((ArrayElement) => { //Search all the a href
				if (!/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+(?:\.[a-zA-Z\d\-]+)*\/?/.test(ArrayElement.href)) { //Is it a link to the profile page?
					return false
				}
				if (!/^@([a-zA-Z\d+]+\.)*[a-zA-Z\d+]+$/.test(CleanString(ArrayElement.textContent))) { //Is the text the user handle? (note the zero-width space, aka. POP DIRECTIONAL FORMATTING - code 202C, and the nbsp it's not a normal space character before the handle)
					return false
				}
				let ReferenceNode = AscendNode(ArrayElement, Levels)
				if (ReferenceNode.LevelsPassed != Levels) {//Did it successfully goes up 8 ancestors so we have all the post in the column?
					return false
				}
				if (isAncestorsStyleDisplayNone(ReferenceNode.OutputNode)) { //Is not in a display-none or inside any element with display-none?
					return false
				}
				BoxList = [...ReferenceNode.OutputNode.childNodes]
				return true
			});
			return BoxList
		}
		function GetNodeByFooterTimestamp(Levels) {
			let ListOfElements = [...document.getElementsByTagName("DIV")]
			let BoxList = []
			ListOfElements.find((ArrayElement) => { //Search all the div
				if (!/^(?:January|February|March|April|May|June|July|August|September|October|November|December) \d+, \d+ at \d+:\d+ (?:A|P)M$/.test(ArrayElement.innerHTML)) { //Is the text the timestamp? (must be the innermost div that contains *JUST* the date)
					return false
				}
				let ReferenceNode = AscendNode(ArrayElement, Levels)
				if (ReferenceNode.LevelsPassed != Levels) {//Did it successfully goes up 5 ancestors so we have all the post in the column?
					return false
				}
				if (isAncestorsStyleDisplayNone(ReferenceNode.OutputNode)) { //Is not in a display-none or inside any element with display-none?
					return false
				}
				BoxList = [...ReferenceNode.OutputNode.childNodes]
				return true
			});
			return BoxList
		}
		function AscendNode(Node, Levels) {
			//Instead of Node.parentNode.parentNode.parentNode... which is prone to errors if there is no parent, this has a check to prevent it.
			//Arguments:
			//-Node: The node in the HTML
			//-Levels: A number, representing how many levels to ascend
			//Will return:
			//-the parent node at "Levels" up, unless it cannot go up any further, then the highest
			//-the number of successful levels it goes up.
			//-the state that is true if it successfully went up the tree without issues, false otherwise
			let CurrentNode = Node
			let ChildCount = 0
			if (typeof Node != "undefined") {
				for (let i = 0; i < Levels; i++) {
					if (typeof CurrentNode.parentNode != "undefined") {
						CurrentNode = CurrentNode.parentNode
						ChildCount++
					} else {
						break
					}
				}
				return {
					OutputNode: CurrentNode,
					LevelsPassed: ChildCount,
					IsSuccessful: (Levels == ChildCount)
				}
			} else {
				return {
					OutputNode: undefined,
					LevelsPassed: -1,
					IsSuccessful: false
				}
				
			}
		}
		function DescendNode(Node, LevelsArray) {
			//Opposite of AscendNode, descends a node without errors. LevelsArray is an array that contains
			//only numbers on what child to descend on.
			let CurrentNode = Node
			if (typeof LevelsArray == "undefined") {
				return "Uhh..."
			}
			let LevelsDown = LevelsArray.length
			let ParentCount = 0
			for (let i = 0; i < LevelsDown; i++) {
				if (typeof CurrentNode.childNodes != "undefined") {
					if (typeof CurrentNode.childNodes[LevelsArray[i]] != "undefined") {
						CurrentNode = CurrentNode.childNodes[LevelsArray[i]]
						ParentCount++
					}
				} else {
					break
				}
			}
			return {
				OutputNode: CurrentNode,
				LevelsPassed: ParentCount,
				IsSuccessful: (ParentCount == LevelsArray.length)
			}
		}
		function GetMediaURLs(Node) {
			//Returns an array whose items are objects representing its URL, type and caption.
			let Output = []
			if (Node.childNodes.length != 0) {
				Output = [...Node.querySelectorAll("img, video")].map((HTMLTag) => {
					//WIP, once bsky allows other media types besides images, this is to be updated to accept multiple tags (img, video, etc.)
					
					let MediaOutput = {
						Type: HTMLTag.tagName,
						URL: ""
					}
					if (/(?:IMG|VIDEO)/.test(HTMLTag.tagName)) {
						MediaOutput.URL = FullResConvert(HTMLTag.src)
						if (HTMLTag.alt) {
							MediaOutput.alt = HTMLTag.alt
						}
						if (HTMLTag.ariaLabel) { //If the post is a video, this is a blob URL, otherwise this would point to the image.
							MediaOutput.ariaLabel = HTMLTag.ariaLabel
						}
						if (HTMLTag.poster) {
							MediaOutput.poster = HTMLTag.poster
						}
					}
					
					return MediaOutput
				}).filter((ArrayElement) => {
					return (ArrayElement != "")
				});
			}
			return Output
		}
		function ConvertAvatarImgToFullRes(ProfileImgURL) {
			let ProcessString = ProfileImgURL
			try {
				if (Setting_ProfileImageFullRes) {
					//https://cdn.bsky.app/img/avatar_thumbnail/plain/did:plc:<base64string>@jpeg
					//https://cdn.bsky.app/img/avatar/plain/did:plc:<base64string>@jpeg
					ProcessString = ProcessString.replace(/cdn.bsky.app\/img\/avatar_thumbnail\//, "cdn.bsky.app/img/avatar/")
				}
			} catch {
				return ""
			}
			return ProcessString
		}
		function GetLinksURLs(Node) {
			//Returns an array listing URLs of outlinks
			let Output = []
			if (Node.childNodes.length != 0) { //embedded posts
				Output = [...Node.getElementsByTagName("a")].map((Links) => {
					return Links.href
				});
			}
			return Output
		}
		function FullResConvert(URLString) {
			//https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:<random_string>/<random_string>@<extension>
			if (Setting_PostImageFullRes) {
				return URLString.replace(/(https?:\/\/cdn\.bsky\.app\/img\/)feed_thumbnail(.*$)/, "$1feed_fullsize$2")
			}
		}
		// Where el is the DOM element you'd like to test for visibility
		function isHidden(el) { //Thanks https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom -> 7ochem
			return (el.offsetParent === null)
		}
		function isAncestorsStyleDisplayNone(Node) {
			//returns true if the ancestors of the node tree contains
			//"display: none"
			let isHidden = false
			let CurrentNode = Node
			if (typeof CurrentNode.style.display != "undefined") { //If right at the node we are just on is hidden, immediately flag this as true
				if ((CurrentNode.style.display == "none")||(getComputedStyle(CurrentNode).display == "none")) {
					return true
				}
			}
			while ((CurrentNode.parentNode != null) && (!isHidden)) {
				CurrentNode = CurrentNode.parentNode
				if (typeof CurrentNode.style != "undefined") {
					if (typeof CurrentNode.style.display != "undefined") {
						if ((CurrentNode.style.display == "none")||(getComputedStyle(CurrentNode).display == "none")) {
							isHidden = true
						}
					}
				}
			}
			return isHidden
		}
		function IdentifyPostLayoutType(PostBox) {
			let BoxChildrenNodes = [...PostBox.childNodes] //As far as my testing, these boxes either have no child nodes or one child nodes.
			if (BoxChildrenNodes.length == 0) {
				return "NonPost_BlankZone"
			}
			let OutputText = ""
			let DateString = ""
			try {
				DateString = PostBox.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].textContent
				if (DateString != "") {
					OutputText = "Post_CurrentlyViewed_AtTop"
				}
			} catch {}
			if (DateString == "") {
				try {
					DateString = PostBox.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip
					if (DateString != "") {
						OutputText = "Post_NotCurrentlyViewed"
					}
				} catch {}
			}
			if (DateString == "") {
				try {
					DateString = PostBox.childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[0].textContent
					if (DateString != "") {
						OutputText = "Post_CurrentlyViewed_NotAtTop"
					}
				} catch {}
			}
			return OutputText
		}
		function PostDateInfo(StringTimestamp) {
			if (typeof StringTimestamp == "undefined") {
				return "Invalid date"
			}
			
			//Info got from: https://stackoverflow.com/questions/78018427/how-do-i-convert-the-local-date-and-time-e-g-est-to-utc
			//
			//One post mentions "It appears this post was in whole or in part created with AI tools. " (got deleted)
			//If anyone spots an error that certain local timezone displays a different UTC time on a post, please report/fork to fix this.
			let DateObjectReadbleString = StringTimestamp.replace(/ at /, " ")
			let TimestampObject = new Date(DateObjectReadbleString)
			
			let TimeZoneString = TimestampObject.toString().match(/\(.+\)/)
			if (TimeZoneString != null) {
				TimeZoneString = TimeZoneString[0]
			} else {
				TimeZoneString = "(unknown timezone)"
			}
			
			if (TimestampObject.toString() != "Invalid Date") {
				let TimestampMillisecondsEpoch = TimestampObject.getTime()
				let UTCString = TimestampObject.toISOString()
				
				let ReturnObject = new Object()
				if (Setting_ShowLocalTimeInTimestamp) {
					ReturnObject.LocalTimeDisplayedOnPage = StringTimestamp + " " + TimeZoneString
				}
				ReturnObject.Date_UTC = UTCString.replace("T", " ").replace(/:\d+\.\d{3}Z$/, "")
				ReturnObject.TimestampMillisecondsEpoch = TimestampMillisecondsEpoch
				
				return ReturnObject
			} else {
				return "Invalid date"
			}
		}
		function ISOString_to_YYYY_MM_DD_HH_MM_SS(ISOString) {
			//YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ
			return ISOString.replace("T", " ").replace(/\.\d{3}Z$/, "") + " UTC"
		}
		function GetPostContent(Node, Type) {
			//Node should be the outermost div tag that covers only the post and not the header/footer
			let PostContent = {}
			
			let PostSegments = [...Node.childNodes].filter((ArrayElement) => {
				return (ArrayElement.tagName == "DIV")
			})
			
			if (Type == "Post_NotCurrentlyViewed") {
				PostSegments = PostSegments.slice(1, PostSegments.length-1)
			} else if (Type == "Post_UserFontPage_InReplyTo") {
				let StartOfContent = 2 //0 would be the UserTitle/Handle/Timestamp
				PostSegments = PostSegments.slice(StartOfContent, PostSegments.length-1)
			}
			
			PostContent.Segments = []
			PostSegments.forEach((PostSegment, PostSegmentIndex) => {
				//one or two segments, if there are 2, the second may contain many sub-compartments
				
				if (PostSegmentIndex == 0 && [...PostSegment.querySelectorAll("img, video")].length == 0 && (!/^\s*$/.test(PostSegment.textContent))) {
					//Plaintext at the top of the post
					let Output = {
						Type: "Text",
						UserPostedText: PostSegment.textContent
					}
					let ListOfLinks = GetLinksURLs(PostSegment)
					if (ListOfLinks.length != 0) {
						Output.Links = ListOfLinks
					}
					PostContent.Segments.push(Output)
				} else {
					//This must be the attachments, often below the text
					let Attachments = [...PostSegment.childNodes[0].childNodes]
					let Output = {
						Type: "Attachments",
						Attachments: []
					}
					Attachments.forEach(Attachment => {
						//Test for embedded posts
							let EmbeddedPostTest_CheckForPostDate = null
							let EmbeddedNode = null
							try {
								//This format occurs if there is only one attachment after the top text.
								EmbeddedPostTest_CheckForPostDate = PostDateInfo(Attachment.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[3].dataset.tooltip)
								EmbeddedNode = Attachment.childNodes[0].childNodes[1]
							} catch {}
							if (EmbeddedPostTest_CheckForPostDate == null) {
								try {
									EmbeddedPostTest_CheckForPostDate = PostDateInfo(Attachment.childNodes[1].childNodes[0].childNodes[0].childNodes[3].dataset.tooltip)
									EmbeddedNode = Attachment.childNodes[1]
								} catch {}
							}
						//test for link previews
							let LinkPreviewNode = null
							try {
								if (Attachment.tagName == "A") {
									if (!(/^https:\/\/bsky\.app\/profile\//.test(Attachment.href))) {
										LinkPreviewNode = Attachment
									}
								}
							} catch {}
							
						if ([...Attachment.querySelectorAll("img, video, a")].length != 0 && /^(?:ALT)*$/.test(Attachment.textContent)) {
							//Media
							let MediaList = GetMediaURLs(Attachment)
							Output.Attachments.push({
								Type: "Media",
								Media: MediaList
							})
						} else if (EmbeddedPostTest_CheckForPostDate != null) {
							//Embedded posts
							let EmbeddedPostObject = GetEmbeddedPost(EmbeddedNode)
							Output.Attachments.push(EmbeddedPostObject)
						} else if (LinkPreviewNode != null) {
							//Link preview
							let LinkPreview = GetExternalLinkPreview(LinkPreviewNode)
							Output.Attachments.push(LinkPreview)
						}
					})
					PostContent.Segments.push(Output)
				}
			})
			return PostContent //Done.
		}
		function GetExternalLinkPreview(Node) {
			let OutputLinkPreview = {
				Type: "LinkPreview",
				Content: []
			}
			OutputLinkPreview.Link = Node.href
			let ImageAndTextPreview = []
			try {
				ImageAndTextPreview = [...Node.childNodes[0].childNodes]
			} catch {}
			ImageAndTextPreview.forEach((Part) => {
				let Image = ""
				try {
					Image = Part.childNodes[0].childNodes[0].src
					if (Setting_PostImageFullRes) {
						Image = Image.replace(/https?:\/\/cdn\.bsky\.app\/img\/feed_thumbnail/, "https://cdn.bsky.app/img/feed_fullsize")
					}
					OutputLinkPreview.Content.push({
						Type: "PreviewImage",
						Image: Image
					})
				} catch {}
				if (!/^\s*$/.test(Part.textContent)) {
					let TextPartDivs = [...Part.querySelectorAll("div")]
					TextPartDivs= TextPartDivs.filter(Ele => {
						if (/^\s*$/.test(Ele.textContent)) {
							return false
						}
						if (Ele.childNodes.length != 1) {
							return false
						}
						if (typeof Ele.childNodes[0].tagName != "undefined") {
							return false
						}
						return true
					})
					TextPartDivs = TextPartDivs.map(Text => Text.textContent)
					OutputLinkPreview.Content.push({
						Type: "PreviewText",
						Text: TextPartDivs
					})
				}
			})
			return OutputLinkPreview
		}
		function GetEmbeddedPost(Node) {
			//This function takes a given "Node" that is a DIV that MUST CONTAIN the lowest DOM node that:
			//-when going lower from this "Node" will be parts of the embedded post, e.g Node.childNodes[0]
			// points to the avatar/user-title/handle
			//-At least all the contents inside the embedded, including images if it has it.
			let EmbeddedContent = {
				Type: "EmbeddedPost",
				Contents: {
					PostURL: "",
					UserTitle: "",
					UserHandle: "",
					UserAvatar: "",
					PostTimeStamp: {},
					PostContent: {
						Segments: []
					}
				}
			}
			try {
				EmbeddedContent.Contents.PostURL = Node.childNodes[0].childNodes[0].childNodes[3].href
				EmbeddedContent.Contents.UserTitle = Node.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent
				EmbeddedContent.Contents.UserHandle = CleanString(Node.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[1].childNodes[0].textContent)
				EmbeddedContent.Contents.UserAvatar = ConvertAvatarImgToFullRes(Node.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src)
				EmbeddedContent.Contents.PostTimeStamp = PostDateInfo(Node.childNodes[0].childNodes[0].childNodes[3].dataset.tooltip)
				
			} catch (e) {
				alert("Failed to extract embedded post")
			}
			let EmbedPostContentCompartments = [...Node.childNodes]
			EmbedPostContentCompartments.shift()
			EmbedPostContentCompartments.forEach((EmbedPart, Index) => {
				let OutputObject = {}
				if (!(/^\s$/.test(EmbedPart)) && ([...EmbedPart.querySelectorAll("img, video")].length == 0)) {
					OutputObject.Type = "Text"
					OutputObject.Text = EmbedPart.textContent
				} else if ([...Node.querySelectorAll("img, video")].length != 0) {
					OutputObject.Type = "Media"
					OutputObject.Content = GetMediaURLs(EmbedPart)
				}
				EmbeddedContent.Contents.PostContent.Segments.push(OutputObject)
			})
			
			return EmbeddedContent
		}
		async function UpdateSavedValues() {
			Saved_Setting_StartStop = await GM.getValue("BskyScrape_StartStopFlag", false).catch( () => {
				GetValueError()
			})
			Saved_Setting_ScanFrequency = await GM.getValue("BskyScrape_ScanFrequency", 1000).catch( () => {
				GetValueError()
			})
			Saved_Extracted_Posts = JSON.parse(await GM.getValue("BSkyScrape_PostList", "[]").catch( () => {
				GetValueError()
			}))
			Saved_Extracted_Profiles = JSON.parse(await GM.getValue("BSkyScrape_ProfileList", "[]").catch( () => {
				GetValueError()
			}))
		}
		function GetValueError() {
			console.log("Bsky-scrape: Error, cannot obtain save value")
		}
		function CleanString(str) { //Removes zero-width characters at the start and end of string. E.g "POP DIRECTIONAL FORMATTING" (code #202C)
			return str.replace(/^(\u202c|\u202a|\s)+/, "").replace(/(\u202c|\u202a|\s)+$/, "")
		}
})();