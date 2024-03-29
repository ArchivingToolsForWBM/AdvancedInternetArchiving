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
	// replaced with ellipsis).
	//-Chrome will truncate object parts printed on the console log, and those aren't preserved
	//-Chrome, for some reason have "innerText" be a blank string if it is an element far offscreen. However this code does have a failsafe that if such data is missing (like user handle),
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
			//^true = all image URLs in the post will be full resolution versions
			// false = use potentially downsized resolution from the HTML.
		const Setting_MaxNumberOfPosts = -1
			//^-1 = No limit on how many posts
			// <any positive number> = The maximum number of post can be saved. Once reached, any new post won't
			// be added and console log will state that the max is reached. It does not delete any posts in the
			// list if above the limit
		const Setting_MaxNumberOfProfiles = 100
			//^-1 = no limit
			// <any positive number> = The maximum number of profiles can be saved. Same as above.

	//Stuff you don't touch unless you know what you're doing.
		let RaceConditionLock = false
			//^This prevents concurrent runs of the code as a failsafe.
		let ConfirmationPause = false
			//^This makes the reset function not fail should the main code execute right when the user
			// selects reset.
		//no duplicates on the console log
			const SetOfURLs = new Set()
			const SetOfPostsURLs = new Set()
		//Some load/save values (note that here execute only once and during a page load)
			let Saved_Setting_StartStop = false
			let Saved_Setting_ScanFrequency = 1000
			let Saved_Extracted_Posts = []
			let Saved_Extracted_Profiles = []
			
			UpdateSavedValues()
			
			let ID_TimeoutMainCode = 0
		//Run code
			//Code that spawns the UI on the bottom right
				setTimeout(LoadScrapeUI, 1500)
			//Main code
				if (Saved_Setting_StartStop) {
					ID_TimeoutMainCode = setTimeout(MainCode, 2000)
				}
			
		//Copy to clipboard
			let CopiedListOfPosts = ""
			let CopiedListOfProfiles = ""
		//If for some reason the site started using element IDs that this script is using, change them.
			const Setting_BskyReservedElementID_PostSavedCount = "BskyScrape_Info_PostSavedCount"
			const Setting_BskyReservedElementID_ProfileSavedCount = "BskyScrape_Info_ProfileSavedCount"
			const Setting_BskyReservedElementID_StartStopButtonText = "BskyScrape_StopStartButton"
			const Setting_BskyReservedElementID_ScanFrequency = "BskyScrape_Input_ScanFrequency"
			const Setting_BskyReservedElementID_ScanFrequencyNumberDisplay = "BskyScrape_Info_ScanSec"
		//Counters for display
			let Counter_Profile_Saved = 0
			let Counter_Post_Saved = 0
	//Spawn a UI
		async function LoadScrapeUI() {
			//div box
			let BoxOfUI = document.createElement("div")
			BoxOfUI.setAttribute("style", "position: fixed;bottom: 40px;right: 40px;z-index: 999; background-color: rgba(64, 64, 64, .5); color: #ffffff; border-radius: 30px; padding: 15px;")
			
			let Title = document.createElement("h2")
			Title.appendChild(document.createTextNode("Blue sky scraper"))
			Title.setAttribute("style", "text-align: center;")
			BoxOfUI.appendChild(Title)
			
			//Start/stop button
			let StartStopButton = document.createElement("button")
			StartStopButton.setAttribute("style", "width: 50px;")
			StartStopButton.setAttribute("id", Setting_BskyReservedElementID_StartStopButtonText)
			let BskyScrape_StartStopFlag = Saved_Setting_StartStop
			let StartStopButton_Text = "Start"
			if (BskyScrape_StartStopFlag) {
				StartStopButton_Text = "Stop"
			}
			StartStopButton.appendChild(document.createTextNode(StartStopButton_Text))
			StartStopButton.addEventListener(
				"click",
				async function () {
					BskyScrape_StartStopFlag = !BskyScrape_StartStopFlag
					
					if (BskyScrape_StartStopFlag) {
						this.innerText = "Stop"
						MainCode()
						ID_TimeoutMainCode = setTimeout(MainCode, Saved_Setting_ScanFrequency)
					} else {
						this.innerText = "Start"
						if (typeof ID_TimeoutMainCode != "undefined") {
							clearTimeout(ID_TimeoutMainCode);
						}
					}
					
					await GM.setValue("BskyScrape_StartStopFlag", BskyScrape_StartStopFlag)
				}
			)
			BoxOfUI.appendChild(StartStopButton)
			
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
						document.getElementById(Setting_BskyReservedElementID_StartStopButtonText).innerText = "Start"
						if (typeof ID_TimeoutMainCode != "undefined") {
							clearTimeout(ID_TimeoutMainCode);
						}
						
						Saved_Extracted_Posts = []
						Saved_Extracted_Profiles = []
						await GM.setValue("BSkyScrape_PostList", "[]")
						await GM.setValue("BSkyScrape_ProfileList", "[]")
						
						let Element_ProfileSavedCount = document.getElementById(Setting_BskyReservedElementID_ProfileSavedCount)
						if (Element_ProfileSavedCount != null) {
							Element_ProfileSavedCount.innerText = "0"
						}
						
						let Element_PostSavedCount = document.getElementById(Setting_BskyReservedElementID_PostSavedCount)
						if (Element_PostSavedCount != null) {
							Element_PostSavedCount.innerText = "0"
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
			let ScrapeFrequency_InputRange = document.createElement("input")
			ScrapeFrequency_InputRange.setAttribute("id", Setting_BskyReservedElementID_ScanFrequency)
			ScrapeFrequency_InputRange.setAttribute("type", "range")
			ScrapeFrequency_InputRange.setAttribute("min", "500")
			ScrapeFrequency_InputRange.setAttribute("max", "10000")
			ScrapeFrequency_InputRange.setAttribute("step", "500")
			ScrapeFrequency_InputRange.setAttribute("value", Saved_Setting_ScanFrequency.toString(10))
			ScrapeFrequency_InputRange.addEventListener(
			"input",
			async function () {
				document.getElementById(Setting_BskyReservedElementID_ScanFrequencyNumberDisplay).innerText = (parseInt(this.value)/1000).toFixed(1)
				await GM.setValue("BskyScrape_ScanFrequency", this.value.toString(10))
			})
			TableCell_0_1.appendChild(ScrapeFrequency_InputRange)
			TableCell_0_1.appendChild(document.createElement("br"))
			TableCell_0_1.setAttribute("style", "text-align: center;")
			
			let ScrapeFrequency_SecDisplay = document.createElement("span")
			ScrapeFrequency_SecDisplay.setAttribute("id", Setting_BskyReservedElementID_ScanFrequencyNumberDisplay)
			ScrapeFrequency_SecDisplay.appendChild(document.createTextNode((Saved_Setting_ScanFrequency/1000).toFixed(1)))
			TableCell_0_1.appendChild(ScrapeFrequency_SecDisplay)
			TableCell_0_1.appendChild(document.createTextNode(" sec"))
			TableRow0.appendChild(TableCell_0_1)
			
			//Row - "Number of posts saved: "
			let TableRow1 = document.createElement("tr")
			TableUI.appendChild(TableRow1)
			
			let TableCell_1_0 = document.createElement("td")
			TableCell_1_0.appendChild(document.createTextNode("Number of posts saved: "))
			TableRow1.appendChild(TableCell_1_0)
			
			let TableCell_1_1 = document.createElement("td")
			let PostCountNumberSpan = document.createElement("span")
			PostCountNumberSpan.setAttribute("id", Setting_BskyReservedElementID_PostSavedCount)
			PostCountNumberSpan.appendChild(document.createTextNode(Saved_Extracted_Posts.length.toString(10)))
			TableCell_1_1.appendChild(PostCountNumberSpan)
			TableRow1.appendChild(TableCell_1_1)
			
			
			//Row - Number of profiles
			let TableRow2 = document.createElement("tr")
			TableUI.appendChild(TableRow2
			)
			let TableCell_2_0 = document.createElement("td")
			TableCell_2_0.appendChild(document.createTextNode("Number of profiles saved: "))
			TableRow2.appendChild(TableCell_2_0)
			
			let TableCell_2_1 = document.createElement("td")
			let ProfileCountNumberSpan = document.createElement("span")
			ProfileCountNumberSpan.setAttribute("id", Setting_BskyReservedElementID_ProfileSavedCount)
			ProfileCountNumberSpan.appendChild(document.createTextNode(Saved_Extracted_Profiles.length.toString(10)))
			TableCell_2_1.appendChild(ProfileCountNumberSpan)
			TableRow2.appendChild(TableCell_2_1)
			
			BoxOfUI.appendChild(TableUI)
			
			
			//Add the box to the HTML
			let HTMLBody = Array.from(document.getElementsByTagName("BODY")).find((Element) => {return true})
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
	//MainCode, runs periodically and used to extract page content.
		async function MainCode() {
			if (!RaceConditionLock) {
				UpdateSavedValues()
				
				RaceConditionLock = true
				//Code here
					let DateTimeOfScrape = ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(Date.now()).toISOString())
					
					let isLoggedIn = false
					{
						let SignUpButton = Array.from(document.getElementsByTagName("BUTTON")).find((Button) => {
							return (Button.innerText == "Sign up")
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
						UserPostArea = GetPostBoxesByLink(9)
						
						//"UserPostArea" will now contain "boxes" that may either be a horizontal line, containing 1 or 2 posts (2 if it has replies, with a vertical line between 2 avatars)
						UserPostArea.forEach((Box, BoxIndex) => { // Loop each box
							//[profile page]
							if (typeof Box.childNodes != "undefined") {
								let BoxListingPosts = Array.from(Box.childNodes)
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
									//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1].childNodes[1] - Post content (text, media, and quotes)
									//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[X] - each segment of above
									//Box.childNodes[X].childNodes[0].childNodes[1].childNodes[1].childNodes[2] - Replies, reposts, and likes.
									
									let RepostedByUserTitle = ""
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
									
									if (Post.innerText != "View full thread") {
										//RepostedByUser
										{
											let RepostElement = DescendNode(Post, [0, 0, 0, 1, 0, 1, 1])
											if (RepostElement.IsSuccessful) {
												RepostedByUserTitle = RepostElement.OutputNode.textContent
											}
										}
										
										//Link to post
										{
											let AHrefElement = DescendNode(Post, [0, 0, 1, 1, 0, 2])
											if (AHrefElement.IsSuccessful) {
												if (AHrefElement.OutputNode.href != "") {
													PostURL = HttpToTtp(AHrefElement.OutputNode.href)
												}
											}
										}
										//Reply downwards line
										{
											let LineElement = DescendNode(Post, [0, 0, 1, 0, 1])
											if (LineElement.IsSuccessful) {
												PostHasRepliesLineBelow = true
											}
										}
										//Reply upwards line
										{
											let LineElement = DescendNode(Post, [0, 0, 0, 0, 0])
											if (LineElement.IsSuccessful) {
												PostIsAReplyLineToAbove = true
											}
										}
										//User title
										{
											let UserTitleElement = DescendNode(Post, [0, 0, 1, 1, 0, 0, 0, 0])
											if (UserTitleElement.IsSuccessful) {
												UserTitle = UserTitleElement.OutputNode.textContent
											}
										}
										//User handle
										{
											let UserHandleElement = DescendNode(Post, [0, 0, 1, 1, 0, 0, 0, 2])
											if (UserHandleElement.IsSuccessful) {
												UserHandle = UserHandleElement.OutputNode.innerText
											}
										}
										//User Avatar
										{
											//Post.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1]
											let AvatarImgElement = DescendNode(Post, [0, 0, 1, 0, 0, 0, 0, 1])
											if (AvatarImgElement.IsSuccessful) {
												if (typeof AvatarImgElement.OutputNode.src != "undefined") {
													UserAvatar = HttpToTtp(AvatarImgElement.OutputNode.src)
												}
											}
										}
										//Post time stamp
										{
											let PostTimeStampElement = DescendNode(Post, [0, 0, 1, 1, 0, 2])
											if (PostTimeStampElement.IsSuccessful) {
												if (typeof PostTimeStampElement.OutputNode.dataset.tooltip != "undefined") {
													PostTimeStamp = PostDateInfo(PostTimeStampElement.OutputNode.dataset.tooltip)
												}
											}
										}
										//Thankfully, unlike being at the post page, the text content and quotes are in a INNER node, meaning
										//the header (user title, handle, timestamp) and footer (comments, repost, and likes) are not in the
										//same hierarchy as in between, and it also doesn't matter how many stuff in between, since it won't
										//affect the header and footer index locations.
										
										//Post.childNodes[0].childNodes[1].childNodes[1].childNodes[1]
										
										//Post content format:
										// Post.childNodes[0].childNodes[1].childNodes[1].childNodes[0] - User title, handle, timestamp
										// Post.childNodes[0].childNodes[1].childNodes[1].childNodes[1] - content
										// Post.childNodes[0].childNodes[1].childNodes[1].childNodes[2] - Footer of post containing the counters
										
										//If it contains "Reply to <user title>"
										//https://bsky.app/profile/dumjaveln.bsky.social
										// Post.childNodes[0].childNodes[1].childNodes[1].childNodes[0] - User title, handle, timestamp
										// Post.childNodes[0].childNodes[1].childNodes[1].childNodes[1] - reply to <UserTitle>
										// Post.childNodes[0].childNodes[1].childNodes[1].childNodes[2] - content
										// Post.childNodes[0].childNodes[1].childNodes[1].childNodes[3] - Footer of post containing the counters
										
										//Post.childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[1]
										
										let ReplyToOffset = 0
										let NodeOfReplyTo = DescendNode(Post, [0,0,1,1,1,1])
										if (NodeOfReplyTo.IsSuccessful) {
											if (/^Reply to/.test(NodeOfReplyTo.OutputNode.innerText)) {
												//let ReplyToLink = Array.from(NodeOfReplyTo.OutputNode.getElementsByTagName("a"))
												//if (ReplyToLink.length != 0) {
													ReplyToOffset++
												//}
											}
										}
										if (PostURL == "https://bsky.app/profile/00sunmoon.bsky.social/post/3kmofkyrfcm23") {
											let breakpoint = 0
										}
										let NodeOfPostContent = DescendNode(Post, [0,0,1,1,1+ReplyToOffset])
										if (NodeOfPostContent.IsSuccessful) {
											PostContent = GetPostContent(NodeOfPostContent.OutputNode, "Post_UserFontPage")
										}
										
										
										//Reply, repost, and likes
										{
											let NodeOfReplyRepostLikes_Array = []
											//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[N]
											//where N is the last element because sometimes a post have duplicate counts between the date and timestamp at the bottom
											let NodeOfFoooter = DescendNode(Post, [0,0,1,1])
											if (NodeOfFoooter.IsSuccessful) {
												let LastNode = Array.from(NodeOfFoooter.OutputNode.childNodes).at(-1)
												NodeOfReplyRepostLikes_Array = Array.from(LastNode.childNodes)
											}
											if (typeof NodeOfReplyRepostLikes_Array[2] != "undefined") { //role="progressbar" - posts not fully loaded
												ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText //prone to errors
												RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
												LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
											}
											
										}
										if ((PostURL != "")&&(UserTitle != "")&&(UserHandle != "")) {
											PostGroup.push({
												RepostedByUserTitle: RepostedByUserTitle,
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
							
							let UserProfileHandle = Array.from(document.getElementsByTagName("DIV")).find((DivElement) => {
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
								
								let ProfileURL = HttpToTtp(window.location.href)
								
								let Profile_UserTitle = ""
								let Node_Profile_UserTitle = DescendNode(ProfileNode, [1,1,0])
								if (Node_Profile_UserTitle.IsSuccessful) {
									Profile_UserTitle = Node_Profile_UserTitle.OutputNode.textContent
								}
								
								let Profile_UserHandle = ""
								let Node_Profile_UserHandle = DescendNode(ProfileNode, [1,1,1])
								if (Node_Profile_UserHandle.IsSuccessful) {
									Profile_UserHandle = Node_Profile_UserHandle.OutputNode.innerText
								}
								
								let Profile_Avatar = ""
								let Node_Profile_Avatar = DescendNode(ProfileNode, [3,0,0,1])
								if (Node_Profile_Avatar.IsSuccessful) {
									Profile_Avatar = HttpToTtp(Node_Profile_Avatar.OutputNode.src)
								}
								
								let Profile_BackgroundImg = ""
								let Node_Profile_BackgroundImg = DescendNode(ProfileNode, [0,0,0,0])
								if (Node_Profile_BackgroundImg.IsSuccessful) {
									Profile_BackgroundImg = HttpToTtp(Node_Profile_BackgroundImg.OutputNode.src)
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
									let ArrayOf_FollowFollowingPost = Array.from(NodeOfFollowFollowingPost.OutputNode.childNodes)
									
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
					} else if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-\.:]+\/post\/[a-zA-Z\d\-]+\/?/.test(window.location.href)) { //Post page
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
								PostURL = HttpToTtp(window.location.href)
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0]
								UserTitle = DescendNode(Box, [0,0,0,1,0,0,0]).OutputNode.textContent
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[0]
								UserHandle = DescendNode(Box, [0,0,0,1,1,0,0]).OutputNode.innerText 
								
								if (/https:\/\/bsky\.app\/profile\/did:plc/.test(PostURL)) { //"View full thread" button is clicked, goes to a handle-less version of a post URL
									//Replace the "did:plc:<base64_string>" with the handle.
									let UserHandleNoAt = UserHandle.replace(/^@/, "")
									PostURL = PostURL.replace(/(https:\/\/bsky\.app\/profile\/)[a-zA-Z\d\-\.:]+(\/post\/[a-zA-Z\d\-]+\/?)/, "$1" + UserHandleNoAt + "$2")
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1]
								let NodeOfAvatarImg = DescendNode(Box, [0,0,0,0,0,0,0,1])
								if (NodeOfAvatarImg.IsSuccessful) {
									UserAvatar = HttpToTtp(NodeOfAvatarImg.OutputNode.src)
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0]
								PostTimeStamp = PostDateInfo(DescendNode(Box, [0,0,1,1,0]).OutputNode.innerText)
								
								let NodeOfPostContent = DescendNode(Box, [0,0,1,0])
								if (NodeOfPostContent.IsSuccessful) {
									PostContent = GetPostContent(NodeOfPostContent.OutputNode)
								}
								
								
								let NodeOfReplyRepostLikes_Array = []
								//Box.childNodes[0].childNodes[0].childNodes[1].childNodes[N]
								//where N is the last element because sometimes a post have duplicate counts between the date and timestamp at the bottom
								let NodeOfFoooter = DescendNode(Box, [0,0,1])
								if (NodeOfFoooter.IsSuccessful) {
									let LastNode = Array.from(NodeOfFoooter.OutputNode.childNodes).at(-1)
									let NodeOfFooterDeepest = DescendNode(LastNode, [0])
									if (NodeOfFooterDeepest.IsSuccessful) {
										NodeOfReplyRepostLikes_Array = Array.from(NodeOfFooterDeepest.OutputNode.childNodes)
									}
								}
								if (typeof NodeOfReplyRepostLikes_Array[2] != "undefined") { //role="progressbar" - posts not fully loaded
									ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText //prone to errors
									RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
									LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
								}
								
								
							} else if (Type == "Post_CurrentlyViewed_NotAtTop") {
								PostURL = HttpToTtp(window.location.href)
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0]
								let ReplyLineUpNode = DescendNode(Box, [0,0,0,0])
								if (ReplyLineUpNode.IsSuccessful) {
									if (typeof ReplyLineUpNode.OutputNode.style != "undefined") {
										if (ReplyLineUpNode.OutputNode.style.length > 1) {
											PostIsAReplyLineToAbove = true
										}
									}
								}
								
								//Box.childNodes[0].childNodes[1].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].textContent
								UserTitle = DescendNode(Box, [0,1,0,1,0,0,0]).OutputNode.textContent
								
								//Box.childNodes[0].childNodes[1].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[0].innerText
								UserHandle = DescendNode(Box, [0,1,0,1,1,0,0]).OutputNode.innerText
								
								if (/https:\/\/bsky\.app\/profile\/did:plc/.test(PostURL)) { //"View full thread" button is clicked, goes to a handle-less version of a post URL
									//Replace the "did:plc:<base64_string>" with the handle.
									let UserHandleNoAt = UserHandle.replace(/^@/, "")
									PostURL = PostURL.replace(/(https:\/\/bsky\.app\/profile\/)[a-zA-Z\d\-\.:]+(\/post\/[a-zA-Z\d\-]+\/?)/, "$1" + UserHandleNoAt + "$2")
								}
								
								//Box.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
								let NodeOfAvatarImg = DescendNode(Box, [0,1,0,0,0,0,0,1])
								if (NodeOfAvatarImg.IsSuccessful) {
									UserAvatar = HttpToTtp(NodeOfAvatarImg.OutputNode.src)
								}
								
								//Box.childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[0].innerText
								PostTimeStamp = PostDateInfo(DescendNode(Box, [0,1,1,1,0]).OutputNode.innerText)
								

								//Box.childNodes[0].childNodes[1].childNodes[1].childNodes[0]
								let NodeOfPostContent = DescendNode(Box, [0,1,1,0])
								if (NodeOfPostContent.IsSuccessful) {
									PostContent = GetPostContent(NodeOfPostContent.OutputNode, Type)
								}
								
								//Box.childNodes[0].childNodes[1].childNodes[1] - get the footer (position varies)
								let PostFooter = Array.from(DescendNode(Box, [0,1,1]).OutputNode.childNodes)
								PostFooter = PostFooter.at(-1)
								NodeOfReplyRepostLikes_Array = Array.from(DescendNode(PostFooter, [0]).OutputNode.childNodes)
								
								if (typeof NodeOfReplyRepostLikes_Array[2] != "undefined") { //role="progressbar" - posts not fully loaded
									ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText //prone to errors
									RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
									LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
								}
							} else if (Type == "Post_NotCurrentlyViewed") {
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[2].href
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[2]
								PostURL = HttpToTtp(DescendNode(Box, [0,0,0,1,1,0,2]).OutputNode.href)
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[1].style
								let ReplyLineDownNode = DescendNode(Box, [0,0,0,1,0,1])
								if (ReplyLineDownNode.IsSuccessful) {
									if (typeof ReplyLineDownNode.OutputNode.style != "undefined") {
										PostHasRepliesLineBelow = true
									}
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].style
								let ReplyLineUpNode = DescendNode(Box, [0,0,0,0,0,0])
								if (ReplyLineUpNode.IsSuccessful) {
									if (typeof ReplyLineUpNode.OutputNode.style != "undefined") {
										if (ReplyLineUpNode.OutputNode.style.length > 1) {
											PostIsAReplyLineToAbove = true
										}
									}
								}
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent
								UserTitle = DescendNode(Box, [0,0,0,1,1,0,0,0,0]).OutputNode.textContent
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText
								UserHandle = DescendNode(Box, [0,0,0,1,1,0,0,0,2]).OutputNode.innerText
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
								let NodeOfAvatarImg = DescendNode(Box, [0,0,0,1,0,0,0,0,1])
								if (NodeOfAvatarImg.IsSuccessful) {
									UserAvatar = HttpToTtp(NodeOfAvatarImg.OutputNode.src)
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip
								PostTimeStamp = PostDateInfo(DescendNode(Box, [0,0,0,1,1,0,2]).OutputNode.dataset.tooltip)
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1] - This also contains the header and footer...
								let NodeOfPostContent = DescendNode(Box, [0,0,0,1,1])
								if (NodeOfPostContent.IsSuccessful) {
									PostContent = GetPostContent(NodeOfPostContent.OutputNode, Type)
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[N]
								let NodeOfReplyRepostLikes_Array = []
								let NodeOfFoooter = DescendNode(Box, [0,0,0,1,1])
								if (NodeOfFoooter.IsSuccessful) {
									let LastNode = Array.from(NodeOfFoooter.OutputNode.childNodes).at(-1)
									let NodeOfFooterDeepest = LastNode
									NodeOfReplyRepostLikes_Array = Array.from(NodeOfFooterDeepest.childNodes)
									
								}
								if (typeof NodeOfReplyRepostLikes_Array[2] != "undefined") { //role="progressbar" - posts not fully loaded
									ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText //prone to errors
									RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
									LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
								}
								
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
						UserPostArea = GetPostBoxesByLink(7)
						
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
								PostURL = HttpToTtp(DescendNode(Post, [0,0,1,0,2]).OutputNode.href)
								
								//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent
								UserTitle = DescendNode(Post, [0,0,1,0,0,0,0]).OutputNode.textContent
								
								//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText
								UserHandle = DescendNode(Post, [0,0,1,0,0,0,2]).OutputNode.innerText
								
								//Post.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
								let NodeOfAvatar = DescendNode(Post, [0,0,0,0,0,0,1])
								if (NodeOfAvatar.IsSuccessful) {
									UserAvatar = HttpToTtp(NodeOfAvatar.OutputNode.src)
								}
								
								//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip
								PostTimeStamp = PostDateInfo(DescendNode(Post, [0,0,1,0,2]).OutputNode.dataset.tooltip)
								
								
								let ReplyToOffset = 0
								let NodeOfReplyTo = DescendNode(Post, [0,0,1,1])
								if (NodeOfReplyTo.IsSuccessful) {
									if (/^Reply to/.test(NodeOfReplyTo.OutputNode.innerText)) {
										//let ReplyToLink = Array.from(NodeOfReplyTo.OutputNode.getElementsByTagName("a"))
										//if (ReplyToLink.length != 0) {
											ReplyToOffset++
										//}
									}
								}
								
								
								//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[1]
								PostContent = GetPostContent(DescendNode(Post, [0,0,1,1+ReplyToOffset]).OutputNode)
								
								//Post.childNodes[0].childNodes[0].childNodes[1].childNodes
								let NodeOfReplyRepostLikes_Array = []
								let NodeOfFoooter = DescendNode(Post, [0,0,1])
								if (NodeOfFoooter.IsSuccessful) {
									let LastNode = Array.from(NodeOfFoooter.OutputNode.childNodes).at(-1)
									let NodeOfFooterDeepest = LastNode
									NodeOfReplyRepostLikes_Array = Array.from(NodeOfFooterDeepest.childNodes)
									
								}
								if (typeof NodeOfReplyRepostLikes_Array[2] != "undefined") { //role="progressbar" - posts not fully loaded
									ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText //prone to errors
									RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
									LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
								}
								if ((PostURL != "")&&(UserTitle != "")&&(UserHandle != "")) {
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
					}
					let ListOfPosts_Clean = ListOfPosts.map((ArrayElement) => { //Have a version without ReplyConnections attribute since we do not need it if we are just looking at posts
						return {
							RepostedByUserTitle: ArrayElement.RepostedByUserTitle,
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
							if (ExtractedPostIndex == 5) {
								let bp = 0
								
							}
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
								SavedList_WhatToReplace.RepliesURLs = Array.from(Set_ListOfURLsSaved)
								
								if ((SavedList_WhatToReplace.ReplyToURL == "") && (ExtractList_ReplaceWith.ReplyToURL != "")) { //If discovered that the post has a reply, add a URL to it.
									SavedList_WhatToReplace.ReplyToURL = ExtractList_ReplaceWith.ReplyToURL
								}
							}
						})
						await GM.setValue("BSkyScrape_PostList", JSON.stringify(SavedBskyPostList)).then(() => {
							CopiedListOfPosts = JSON.stringify(SavedBskyPostList, null, " ")
							//console.log("Bsky-scrape: extracted post count: " + SavedBskyPostList.length.toString(10))
							
							let ElementOfUI_PostCount = document.getElementById(Setting_BskyReservedElementID_PostSavedCount)
							if (ElementOfUI_PostCount != null) {
								ElementOfUI_PostCount.innerText = SavedBskyPostList.length.toString(10)
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
							//console.log("Bsky-scrape: extracted profile count: " + SavedBskyProfileList.length.toString(10))
							let ElementOfUI_ProfileCount = document.getElementById(Setting_BskyReservedElementID_ProfileSavedCount)
							if (ElementOfUI_ProfileCount != null) {
								ElementOfUI_ProfileCount.innerText = SavedBskyProfileList.length.toString(10)
							}
						},
						() => {
							window.alert("Bsky-scrape: saving profile failed!")
						});
					} else {
						console.log("Bsky-scrape: Paused")
					}
				
				if (Saved_Setting_StartStop) {
					ID_TimeoutMainCode = setTimeout(MainCode, Saved_Setting_ScanFrequency)
				}
				
				//Set a breakpoint here after everything loads to test the results stored in "ListOfPosts".
				RaceConditionLock = false
			}
		}
	//UI functions
		function UpdateDisplay_ScanFrequency() {
			let a = 0
			
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
			let ListOfElements = Array.from(document.getElementsByTagName("A"))
			let BoxList = []
			ListOfElements.find((ArrayElement) => { //Search all the a href
				if (!/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\/?/.test(ArrayElement.href)) { //Is it a link to the profile page?
					return false
				}
				if (!/@[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+$/.test(ArrayElement.innerText)) { //Is the text the user handle?
					return false
				}
				let ReferenceNode = AscendNode(ArrayElement, Levels)
				if (ReferenceNode.LevelsPassed != Levels) {//Did it successfully goes up 8 ancestors so we have all the post in the column?
					return false
				}
				if (isAncestorsStyleDisplayNone(ReferenceNode.OutputNode)) { //Is not in a display-none or inside any element with display-none?
					return false
				}
				BoxList = Array.from(ReferenceNode.OutputNode.childNodes)
				return true
			});
			return BoxList
		}
		function GetNodeByFooterTimestamp(Levels) {
			let ListOfElements = Array.from(document.getElementsByTagName("DIV"))
			let BoxList = []
			ListOfElements.find((ArrayElement) => { //Search all the div
				if (!/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+, \d+ at \d+:\d+ (?:A|P)M$/.test(ArrayElement.innerHTML)) { //Is the text the timestamp? (must be the innermost div that contains *JUST* the date)
					return false
				}
				let ReferenceNode = AscendNode(ArrayElement, Levels)
				if (ReferenceNode.LevelsPassed != Levels) {//Did it successfully goes up 5 ancestors so we have all the post in the column?
					return false
				}
				if (isAncestorsStyleDisplayNone(ReferenceNode.OutputNode)) { //Is not in a display-none or inside any element with display-none?
					return false
				}
				BoxList = Array.from(ReferenceNode.OutputNode.childNodes)
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
				Output = Array.from(Node.getElementsByTagName("img")).map((HTMLTag) => {
					//WIP, once bsky allows other media types besides images, this is to be updated to accept multiple tags (img, video, etc.)
					let MediaOutput = {
						Type: HTMLTag.tagName,
						URL: ""
					}
					switch (HTMLTag.tagName) {
						case "IMG":
							MediaOutput.URL = HttpToTtp(FullResConvert(HTMLTag.src))
							if (HTMLTag.alt) {
								MediaOutput.alt = HTMLTag.alt
							}
//							{(() => { //Need this curly braces on outermost so it doesn't cause promise issues (scoping issue)
//								let ButtonForLabel = AscendNode(HTMLTag, 3)
//								if (!ButtonForLabel.IsSuccessful) {
//									return
//								}
//								if (ButtonForLabel.OutputNode.tagName != "BUTTON") {
//									return
//								}
//								if (/^(?:Image)?$/.test(ButtonForLabel.OutputNode.ariaLabel)) {
//									return
//								}
//								MediaOutput.Caption = ButtonForLabel.OutputNode.ariaLabel
//								
//							})();}
							break
					}
					
					return MediaOutput
				}).filter((ArrayElement) => {
					return (ArrayElement != "")
				});
			}
			return Output
		}
		function GetLinksURLs(Node) {
			//Returns an array listing URLs of outlinks
			let Output = []
			if (Node.childNodes.length != 0) { //Quoted posts
				Output = Array.from(Node.getElementsByTagName("a")).map((Links) => {
					return HttpToTtp(Links.href)
				});
			}
			return Output
		}
		function HttpToTtp(URLString) {
			if (typeof URLString == "undefined") {
				return ""
			}
			if (Setting_http_ttp) {
				return URLString.replace(/^http/, "ttp")
			}
			return URLString
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
			let BoxChildrenNodes = Array.from(PostBox.childNodes) //As far as my testing, these boxes either have no child nodes or one child nodes.
			if (BoxChildrenNodes.length == 0) {
				return "NonPost_BlankZone"
			} else if (BoxChildrenNodes.length == 1) {
				//Figure out the node tree type of each posts on the post page
				let NodeToLookAt_ReplyButton = DescendNode(PostBox, [0, 0])
				let NodeToLookAt_BlankBottom = DescendNode(PostBox, [0])
				let NodeToLookAt_TimeStampCurrentlyViewedPostTop = DescendNode(PostBox, [0,0,0,1,0,0])
				let NodeToLookAt_TimeStampCurrentlyViewedPostNotTop = DescendNode(PostBox, [0,1,0,1,0,0,1])
				let NodeToLookAt_TimeStampOtherThanCurrentPost = DescendNode(PostBox, [0,0,0,1,1,0,2])
				let IdentifiedType = ""
				if (NodeToLookAt_ReplyButton.LevelsPassed == 2) {
					if (NodeToLookAt_ReplyButton.OutputNode.tagName == "BUTTON") {
						return "NonPost_ReplyButton"
					}
				}
				if (NodeToLookAt_BlankBottom.LevelsPassed == 1) {
					if (NodeToLookAt_BlankBottom.OutputNode.innerHTML == "") {
						return "NonPost_BlankBottom"
					}
				}
				if ((NodeToLookAt_TimeStampCurrentlyViewedPostTop.LevelsPassed == 6)&&(!NodeToLookAt_TimeStampOtherThanCurrentPost.IsSuccessful)) {
					if (typeof NodeToLookAt_TimeStampCurrentlyViewedPostTop.OutputNode.dataset != "undefined") {
						let IsPotentialAhref = Array.from(NodeToLookAt_TimeStampCurrentlyViewedPostTop.OutputNode.getElementsByTagName("a")).find((ArrayElement) => {
							return ArrayElement.hasAttribute("href")
						})
						if (typeof IsPotentialAhref == "undefined"){
							return "Post_CurrentlyViewed_AtTop"
						}
					}
				}
				if (NodeToLookAt_TimeStampCurrentlyViewedPostNotTop.LevelsPassed == 7) {
					let IsPotentialAhref = Array.from(NodeToLookAt_TimeStampCurrentlyViewedPostNotTop.OutputNode.getElementsByTagName("a")).find((ArrayElement) => {
						return ArrayElement.hasAttribute("href")
					})
					if (typeof IsPotentialAhref == "undefined"){
						return "Post_CurrentlyViewed_NotAtTop"
					}
				}
				if (NodeToLookAt_TimeStampOtherThanCurrentPost.IsSuccessful) {
					if (typeof NodeToLookAt_TimeStampOtherThanCurrentPost.OutputNode.href != "undefined") {
						return "Post_NotCurrentlyViewed"
					}
				}
				return "Post_CurrentlyViewed_NotAtTop"
			} else if (BoxChildrenNodes.length == 2) {
				return "Post_NotCurrentlyViewed"
			}
			return ""
		}
		function PostDateInfo(StringTimestamp) {
			if (typeof StringTimestamp == "undefined") {
				return "uhh"
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
				return({
					Error: "Invalid date"
				})
			}
		}
		function ISOString_to_YYYY_MM_DD_HH_MM_SS(ISOString) {
			//YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ
			return ISOString.replace("T", " ").replace(/\.\d{3}Z$/, "") + " UTC"
		}
		
		function GetPostContent(Node, Type) {
			//Node should be the outermost div tag that covers only the post and not the header/footer
			let PostContent = {}
			
			let PostSegments = Array.from(Node.childNodes).filter((ArrayElement) => {
				return (ArrayElement.tagName == "DIV")
			})
			//If post has text and images:
			// PostSegments[0] - text
			// PostSegments[1] - image gallery
			//If it is a quote:
			// PostSegments[0] - text
			// PostSegments[1] - collection of quotes
			
			if (Type == "Post_NotCurrentlyViewed") {
				PostSegments = PostSegments.slice(1, PostSegments.length-1)
			} else if (Type == "Post_UserFontPage_InReplyTo") {
				let StartOfContent = 2 //0 would be the UserTitle/Handle/Timestamp
				PostSegments = PostSegments.slice(StartOfContent, PostSegments.length-1)
			}
			
			PostContent.Segments = []
			PostSegments.forEach((PostSegment) => { //Each post segments
				if (!(/(?:^(?:ALT)?$)/.test(PostSegment.innerText))) { //Content has text (besides blank or "ALT")
					if (typeof PostSegment.childNodes != "undefined") { //Has children
						let NodeForDivs = DescendNode(PostSegment, [0])
						if (NodeForDivs.IsSuccessful) {
							if (typeof NodeForDivs.OutputNode.getElementsByTagName === "function") {
								//^"Reply to ..." can happen if this code executes before their "Reply to" fully loads, causing NodeForDivs.OutputNode to be a text node instead of a tag node
								if (Array.from(NodeForDivs.OutputNode.getElementsByTagName("DIV")).length == 0) { //If there is no more div levels down, then this is user-posted text
									let TextContentObject = {
										ContentType: "Text",
										UserPostedText: PostSegment.textContent
									}
									let ListOfLinks = GetLinksURLs(PostSegment)
									if (ListOfLinks.length != 0) {
										TextContentObject.Links = ListOfLinks
									}
									PostContent.Segments.push(TextContentObject)
								} else {
									//PostSegment contains multiple sub-boxes here
									//https://bsky.app/profile/dumjaveln.bsky.social/post/3klkgthv63q2z quoted post
									let Node_QuoteSubBox = DescendNode(PostSegment, [0]) //Go down a div level
									if (Node_QuoteSubBox.IsSuccessful) {
										if (Node_QuoteSubBox.OutputNode.tagName != "A") {
											let SubBoxesContent = []
											let SubBoxes = Array.from(Node_QuoteSubBox.OutputNode.childNodes)
											SubBoxes.forEach((SubBox) => { //Loop each inner boxes (text, images, quotes)
												if (!(/(?:^$|^(?:ALT\n)*ALT$)/.test(SubBox.innerText))) {
													//Test if there is a post date
													//SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[3].dataset.tooltip
													let NodeOfPostDate = DescendNode(SubBox, [0,0,0,3])
													
													//SubBox.childNodes[0].childNodes[0].childNodes[3].dataset.tooltip
													//https://bsky.app/profile/kimscaravelli.bsky.social/post/3klaue65stp2x
													let NodeOfPostDate1 = DescendNode(SubBox, [0,0,3])
													
													
													if (NodeOfPostDate.IsSuccessful) { //This HAS to be a quote (if attachments have both a media and a quote, thus both wrapped in a div)
														if (NodeOfPostDate.OutputNode.dataset.tooltip != "") { //If has a date
															SubBoxesContent.push(GetQuoteBoxData(SubBox.childNodes[0]))
														}
													} else if (NodeOfPostDate1.IsSuccessful) { //If there is only a single attachment, then this isn't div-wrapped
														if (NodeOfPostDate1.OutputNode.dataset.tooltip != "") {
															SubBoxesContent.push(GetQuoteBoxData(SubBox))
														}
													}
												} else {
													//Post has quotes and media
													let QuoteMedia = {
														ContentType: "Media"
													}
													let MediaURLs = GetMediaURLs(SubBox)
													if (MediaURLs.length != 0) {
														QuoteMedia.MediaURLs = MediaURLs
														SubBoxesContent.push(QuoteMedia)
													}
												}
											})
											PostContent.Segments.push({
												ContentType: "Attachment",
												Content: SubBoxesContent
											})
										} else { //Link to external site, have a preview of the page, e.g. https://bsky.app/profile/pappahutten.bsky.social/post/3klxhuy6wbc2h
											let LinkPreview = Node_QuoteSubBox.OutputNode
											let LinkPreviewObject = LinkPreviewNodeToJson(LinkPreview)
											PostContent.Segments.push(LinkPreviewObject)
										}
									}
								}
							} else {
								return "Error"
							}
						}
					}
				} else {
					let MediaContent = {
						ContentType: "Media"
					}
					let MediaURLs = GetMediaURLs(PostSegment)
					if (MediaURLs.length != 0) {
						MediaContent.MediaURLs = MediaURLs
						PostContent.Segments.push(MediaContent)
					}
				}
			})
			return PostContent
		}
		function GetQuoteBoxData(Node_SubBox) {
			let DescendMap_PostURLAndTimestamp = [0,0,3]
			let DescendMap_UserTitle = [0,0,1,0,0]
			let DescendMap_UserHandle = [0,0,1,0,2]
			let DescendMap_UserAvatar = [0,0,0,0,0,1]
			let DescendMap_PostContentText = [1,0]
			
			let OutputObject = {
				ContentType: "Quote"
			}
			
			OutputObject.PostURL = HttpToTtp(DescendNode(Node_SubBox, DescendMap_PostURLAndTimestamp).OutputNode.href)
			
			//Node_SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0]
			OutputObject.UserTitle = DescendNode(Node_SubBox, DescendMap_UserTitle).OutputNode.textContent
			
			//Node_SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[2].innerText
			OutputObject.UserHandle = DescendNode(Node_SubBox, DescendMap_UserHandle).OutputNode.innerText
			
			//Node_SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
			OutputObject.UserAvatar = ""
			let NodeOfAvatarImg = DescendNode(Node_SubBox, DescendMap_UserAvatar)
			if (NodeOfAvatarImg.IsSuccessful) {
				OutputObject.UserAvatar = HttpToTtp(NodeOfAvatarImg.OutputNode.src)
			}
			
			OutputObject.PostTimeStamp = PostDateInfo(DescendNode(Node_SubBox, DescendMap_PostURLAndTimestamp).OutputNode.dataset.tooltip)
			
			
			OutputObject.PostContentText = ""
			OutputObject.QuotedMedia = []
			let QuoteContentArray = Array.from(Node_SubBox.childNodes).slice(1) //Get everything after the user title/handle/timestamp
			QuoteContentArray.forEach((QuotePiece, Index) => {
				if (Index == 0) {
					if (QuotePiece.textContent != "" && (OutputObject.PostContentText == "")) {
						OutputObject.PostContentText = QuotePiece.textContent
					}
				}
				if (QuotePiece.tagName != "A") {
					OutputObject.QuotedMedia = GetMediaURLs(QuotePiece)
				}
				if (QuotePiece.tagName == "A") {
					OutputObject.LinkPreviewObject = LinkPreviewNodeToJson(QuotePiece)
				}
			})
			
			//Node_SubBox.childNodes[0].childNodes[1].childNodes[0].textContent
			//Postception - https://bsky.app/profile/anyainlove.bsky.social/post/3klxhf4wnoi2z (post containing a quote containing a link preview)
			
			return OutputObject
		}
		
		function LinkPreviewNodeToJson(Node) {
			let LinkPreviewObject = {
				ContentType: "LinkPreview",
				LinkTo: HttpToTtp(Node.href)
			}
			let ImagePreviewURL = ""
			
			//Node.childNodes[0].childNodes[0].childNodes[0].childNodes[0]
			let NodeOfImage = DescendNode(Node, [0,0,0,0])
			if (NodeOfImage.IsSuccessful) {
				if (NodeOfImage.OutputNode.tagName == "IMG") {
					ImagePreviewURL = HttpToTtp(FullResConvert(NodeOfImage.OutputNode.src))
				}
			}
			LinkPreviewObject.ImagePreviewURL = ImagePreviewURL
			
			//Node.childNodes[0].childNodes[1] - text content
			let NodeOfTextContent_LinkPreview = DescendNode(Node, [0,1])
			if (NodeOfTextContent_LinkPreview.IsSuccessful) {
				let TextArray = Array.from(NodeOfTextContent_LinkPreview.OutputNode.childNodes)
				TextArray.forEach((Part, Index) => {
					if (Index == 0) {
						LinkPreviewObject.ExternalLink_DomainName = Part.innerText
					} else if (Index == 1) {
						LinkPreviewObject.ExternalLink_Title = Part.innerText
						
					} else {
						LinkPreviewObject.ExternalLink_PreviewTextContent = Part.innerText
					}
				})
			} else { //No image preview
				//https://bsky.app/profile/socialmedialab.ca/post/3kklyg6hlss2b
				//Node.childNodes[0].childNodes[0].childNodes
				let TextOnlyLinkPreview = DescendNode(Node, [0,0])
				if (TextOnlyLinkPreview.IsSuccessful) {
					let TextArray = Array.from(TextOnlyLinkPreview.OutputNode.childNodes)
					TextArray.forEach((Part, Index) => {
						if (Index == 0) {
							LinkPreviewObject.ExternalLink_DomainName = Part.innerText
						} else if (Index == 1) {
							LinkPreviewObject.ExternalLink_Title = Part.innerText
						} else {
							LinkPreviewObject.ExternalLink_PreviewTextContent = Part.innerText
						}
					})
				}
			}
			return LinkPreviewObject
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
})();