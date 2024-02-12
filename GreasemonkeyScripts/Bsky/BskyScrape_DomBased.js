// ==UserScript==
// @name         Bsky-scrape
// @namespace    https://bsky.app/
// @version      0.2
// @description  try to take over the world!
// @include      https://bsky.app/*
// @grant       GM.setValue
// @grant       GM.getValue
// ==/UserScript==
(function() {
	//NOTES:
	//Best works on firefox because of my testing:
	//-URLs have the "http" substring replaced with "ttps" because firefox truncate long links and doesn't keep the original full URL when copying them (the middle is replaced with
	// ellipsis).
	//-Chrome will truncate object parts printed on the console log, and those aren't preserved
	//-If you navigate to (click on links) another bsky page, the list of process stored here will not unload posts that are no longer visible that were once visible before you navigate
	// due to the entire page not refreshing. This means that if you say navigate from the user profile page to a posts, several posts from the profile page persist while being on a
	// post page.
	//-This scripts assumes that the reply post system follows a "tree structure": https://en.wikipedia.org/wiki/Tree_(data_structure) - The first post that isn't a reply to anything is
	// the "root" post each post can have multiple replies, but what it's replying to only goes to 1 post. Therefore the attribute "ReplyToURL" only contains 1 URL, and "RepliesURLs" is
	// a list of replies to the post.
	//Settings
		const Setting_Delay = 1000
			//^Number of milliseconds between each re-execution of this script.
		const Setting_http_ttp = true
			//^true = All URLs in the output start with "ttp" instead of "http" (to avoid URL truncation like what firefox does; replacing the middle of string with ellipsis).
			// false = leave it as http
		const Setting_PostImageFullRes = true
			//^true = all image URLs in the post will be full resolution versions
			// false = use potentially downsized resolution from the HTML.

	//Stuff you don't touch unless you know what you're doing.
		let RaceConditionLock = false
			//^This prevents concurrent runs of the code as a failsafe.
		//no duplicates on the console log
			const SetOfURLs = new Set()
			const SetOfPostsURLs = new Set()
		//Run code periodically (recommended for dynamic web pages, infinite scrolling)
			window.onload = setInterval(MainCode, Setting_Delay)
	//MainCode, runs periodically and used to extract page content.
		function MainCode() {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				//Code here
					let UserPostArea = []
					let ListOfPosts = [] //List of each individual posts
					if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\/?$/.test(window.location.href)) { //profile page
						//First, find an a href link to a profile as a reference. We get a node that at least has all the posts
						let ListOfLinks = Array.from(document.getElementsByTagName("A"))
						ListOfLinks.find((ArrayElement) => { //Search all the a href
							if (ArrayElement.hasAttribute("href")) { //failsafe, does it has the href attribute?
								if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\/?/.test(ArrayElement.href)) { //Is it a link to the profile page?
									if (/@[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+$/.test(ArrayElement.innerText)) { //Is the text the user handle?
										let ReferenceNode = AscendNode(ArrayElement, 8)
										if (ReferenceNode.LevelsPassed == 8) {//Did it successfully goes up 8 ancestors so we have all the post in the column?
											if (!isAncestorsStyleDisplayNone(ReferenceNode.OutputNode)) {
												UserPostArea = Array.from(ReferenceNode.OutputNode.childNodes)
												return true
											}
										}
									}
								}
							}
							return false
						});
//						UserPostArea.filter((Box) => { //Rid out hidden elements
//							return (!isHidden(Box))
//						})
						
						//"UserPostArea" will now contain "boxes" that may either be a horizontal line, containing 1 or 2 posts (2 if it has replies, with a vertical line between 2 avatars)
						UserPostArea.forEach((Box, BoxIndex) => { // Loop each box
							if (BoxIndex == 2) {
								let a = 0
								
							}
							if (typeof Box.childNodes != "undefined") {
								let BoxListingPosts = Array.from(Box.childNodes)
								let BoxListingPostsLengthCache = BoxListingPosts.length
								let PostGroup = []
								for (let i = 0; i < BoxListingPostsLengthCache; i ++) { //Loop each posts (BoxListingPosts[i] should return a post), within a box
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
									let PostTimeStamp = ""
									let PostText = ""
									let LinksToAnotherPage = []
									let MediaList = []
									let ReplyCount = ""
									let RepostCount = ""
									let LikesCount = ""
									
									let Post = BoxListingPosts[i]
									
									if (i == 1) {
										let a = 0
									}
									//RepostedByUser
									{
										let RepostElement = DescendNode(Post, [0, 0, 1, 0, 1, 1])
										if (RepostElement.LevelsPassed == 6) {
											RepostedByUserTitle = RepostElement.OutputNode.textContent
										}
									}
									
									//Link to post
									{
										let AHrefElement = DescendNode(Post, [0, 1, 1, 0, 2])
										if (AHrefElement.LevelsPassed == 5) {
											if (typeof AHrefElement.OutputNode.href != "undefined") {
												PostURL = HttpToTtp(AHrefElement.OutputNode.href)
											}
										}
									}
									//Reply downwards line
									{
										let LineElement = DescendNode(Post, [0, 1, 0, 1])
										if (LineElement.LevelsPassed == 4) {
											PostHasRepliesLineBelow = true
										}
									}
									//Reply upwards line
									{
										let LineElement = DescendNode(Post, [0, 0, 0, 0])
										if (LineElement.LevelsPassed == 4) {
											PostHasRepliesLineBelow = true
										}
									}
									//User title
									{
										let UserTitleElement = DescendNode(Post, [0, 1, 1, 0, 0, 0, 0])
										if (UserTitleElement.LevelsPassed == 7) {
											UserTitle = UserTitleElement.OutputNode.textContent
										}
									}
									//User handle
									{
										let UserHandleElement = DescendNode(Post, [0, 1, 1, 0, 0, 0, 2])
										if (UserHandleElement.LevelsPassed == 7) {
											UserTitle = UserHandleElement.OutputNode.innerText
										}
									}
									//User Avatar
									{
										//Post.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1]
										let AvatarImgElement = DescendNode(Post, [0, 1, 0, 0, 0, 0, 1])
										if (AvatarImgElement.LevelsPassed == 7) {
											if (typeof AvatarImgElement.OutputNode.src != "undefined") {
												UserAvatar = HttpToTtp(AvatarImgElement.OutputNode.src)
											}
										}
									}
									//Post time stamp
									{
										let PostTimeStampElement = DescendNode(Post, [0, 1, 1, 0, 2])
										if (PostTimeStampElement.LevelsPassed == 5) {
											if (typeof PostTimeStampElement.OutputNode.dataset.tooltip != "undefined") {
												PostTimeStamp = HttpToTtp(PostTimeStampElement.OutputNode.dataset.tooltip)
											}
										}
									}
									//Post text
									{
										let PostTextElement = DescendNode(Post, [0, 1, 1, 1, 0, 0])
										if (PostTextElement.LevelsPassed == 6) {
											PostText = PostTextElement.OutputNode.textContent
										}
									}
									//Links to another page
									{
										let PostAreaToFindLinks = DescendNode(Post, [0, 1, 1, 1])
										if (PostAreaToFindLinks.LevelsPassed == 4) {
											LinksToAnotherPage = GetLinksURLs(PostAreaToFindLinks.OutputNode)
										}
										
									}
									//Media list
									{
										let PostAreaToFindImgs = DescendNode(Post, [0, 1, 1, 1])
										if (PostAreaToFindImgs.LevelsPassed == 4) {
											MediaList = GetMediaURLs(PostAreaToFindImgs.OutputNode)
										}
									}
									//Reply, repost, and likes
									{
										let ReplyRepostLikesNode = DescendNode(Post, [0, 1, 1, 2])
										if (ReplyRepostLikesNode.LevelsPassed == 4) {
											let NodesOfReplyRepostLikes = Array.from(ReplyRepostLikesNode.OutputNode.childNodes)
											if (NodesOfReplyRepostLikes.length >= 3) {
												ReplyCount = NodesOfReplyRepostLikes[0].innerText
												RepostCount = NodesOfReplyRepostLikes[1].innerText
												LikesCount = NodesOfReplyRepostLikes[2].innerText
											}
										}
									}
									PostGroup.push({
										RepostedByUserTitle: RepostedByUserTitle,
										PostURL: PostURL,
										ReplyConnections: {
											PostHasRepliesLineBelow: PostHasRepliesLineBelow,
											PostIsAReplyLineToAbove: PostIsAReplyLineToAbove,
											IsCurrentPostURL: IsCurrentPostURL
										},
										ReplyToURL: ReplyToURL,
										RepliesURLs: RepliesURLs,
										UserTitle: UserTitle,
										UserHandle: UserHandle,
										UserAvatar: UserAvatar,
										PostTimeStamp: PostTimeStamp,
										PostText: PostText,
										LinksToAnotherPage: LinksToAnotherPage,
										MediaList: MediaList,
										ReplyCount: ReplyCount,
										RepostCount: RepostCount,
										LikesCount: LikesCount
									})
								}
								//Now fill out the reply to and from that are inside a box
								let PostGroupLengthCache = PostGroup.length
								for (let i = 0; i < PostGroupLengthCache; i++) {
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
							}
						})
						
					} else if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\/post\/[a-zA-Z\d\-]+\/?/.test(window.location.href)) { //Post page
						//First, find an a href link to a profile as a reference. We get a node that at least has all the posts
						let ListOfLinks = Array.from(document.getElementsByTagName("A"))
						ListOfLinks.find((ArrayElement) => { //Search all the a href
							if (ArrayElement.hasAttribute("href")) { //failsafe, does it has the href attribute?
								if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\/?/.test(ArrayElement.href)) { //Is it a link to the profile page?
									if (/@[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+$/.test(ArrayElement.innerText)) { //Is the text the user handle?
										let ReferenceNode = AscendNode(ArrayElement, 10)
										if (!isHidden(ReferenceNode.OutputNode.childNodes)) {
											if (ReferenceNode.LevelsPassed == 10) {//Did it successfully goes up 10 ancestors so we have all the post in the column?
												if (!isAncestorsStyleDisplayNone(ReferenceNode.OutputNode)) {
													UserPostArea = Array.from(ReferenceNode.OutputNode.childNodes)
													return true
												}
											}
										}
									}
								}
							}
							return false
						});
//						UserPostArea.filter((Box) => { //Rid out hidden elements
//							return (!isHidden(Box))
//						})
						//"UserPostArea" will now contain "boxes" that contains 0 or 1 posts (even if it is a reply post, there is no div that surround 2 posts)
						
						
						let PostsSeperator = ""
						//^Now, in some time in the future, bsky may be updated to include recommended posts that aren't necessarily a reply to posts above,
						// so this text here serves as a placeholder as the following foreach determine that the adjacent posts are something like "for you"
						// (if such a separator exists, PostsSeperator will update and future boxes in this array will reflect on it (anthing after "for you"))
						
						let PostGroup = []
						UserPostArea.forEach((Box, BoxIndex) => { //Loop each box
							let RepostedByUserTitle = ""
							let PostURL = "" //URL of post (if viewing its URL directly, then it is the browser's [window.location.href])
							
							let PostHasRepliesLineBelow = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
							let PostIsAReplyLineToAbove = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
							let IsCurrentPostURL = false //Used to determine the post that doesn't have a href link to determine the post below it is a reply to it
							let Type = "" //Stuff in the column could be a post, a non-post like "Write your Reply"
							
							let ReplyToURL = "" //Reply to post above
							let RepliesURLs = [] //Replies of the current post
							let UserTitle = ""
							let UserHandle = ""
							let UserAvatar = ""
							let PostTimeStamp = ""
							let PostText = ""
							let LinksToAnotherPage = []
							let MediaList = []
							let ReplyCount = ""
							let RepostCount = ""
							let LikesCount = ""
							
							let BoxChildrenNodes = Array.from(Box.childNodes) //As far as my testing, these boxes either have no child nodes or one child nodes.
							if (BoxChildrenNodes.length == 0) {
								Type = "NonPost_BlankZone"
							} else if (BoxChildrenNodes.length == 1) {
								//Figure out the node tree type of each posts on the post page
								let a = 0
								let NodeToLookAt_ReplyButton = DescendNode(Box, [0, 0])
								let NodeToLookAt_BlankBottom = DescendNode(Box, [0])
								let NodeToLookAt_TimeStampCurrentlyViewedPostTop = DescendNode(Box, [0,0,0,1,0,0,1])
								let NodeToLookAt_TimeStampCurrentlyViewedPostNotTop = DescendNode(Box, [0,1,0,1,0,0,1])
								let NodeToLookAt_TimeStampOtherThanCurrentPost = DescendNode(Box, [0,0,0,0,1,1,0,2])
								
								
								//Now I have to use (Type == "") because the inner if statement could cause an error for trying to assess properties of potentially
								//a nonexistent attribute. This means if this is an elseif on the outer, failing the inner if statement would skip all the later checks
								//which I do not want.
								if ((Type == "") && NodeToLookAt_ReplyButton.LevelsPassed == 2) {
									if (NodeToLookAt_ReplyButton.OutputNode.tagName == "BUTTON") {
										Type = "NonPost_ReplyButton"
									}
								}
								if ((Type == "") && NodeToLookAt_BlankBottom.LevelsPassed == 1) {
									if (NodeToLookAt_BlankBottom.OutputNode.innerHTML == "") {
										Type = "NonPost_BlankBottom"
									}
								}
								if ((Type == "") && NodeToLookAt_TimeStampCurrentlyViewedPostTop.LevelsPassed == 7) {
									if (typeof NodeToLookAt_TimeStampCurrentlyViewedPostTop.OutputNode.dataset != "undefined") {
										let IsPotentialAhref = Array.from(NodeToLookAt_TimeStampCurrentlyViewedPostTop.OutputNode.getElementsByTagName("a")).find((ArrayElement) => {
											return ArrayElement.hasAttribute("href")
										})
										if (typeof IsPotentialAhref == "undefined"){
											Type = "Post_CurrentlyViewedAtTop"
										}
									}
								}
								if ((Type =="") && NodeToLookAt_TimeStampCurrentlyViewedPostNotTop.LevelsPassed == 7) {
										let IsPotentialAhref = Array.from(NodeToLookAt_TimeStampCurrentlyViewedPostNotTop.OutputNode.getElementsByTagName("a")).find((ArrayElement) => {
											return ArrayElement.hasAttribute("href")
										})
										if (typeof IsPotentialAhref == "undefined"){
											Type = "Post_CurrentlyViewedNotAtTop"
										}
								}
								if ((Type == "") && NodeToLookAt_TimeStampOtherThanCurrentPost.LevelsPassed == 8) {
									if (typeof NodeToLookAt_TimeStampOtherThanCurrentPost.OutputNode.href != "undefined") {
										Type = "Post_NotCurrentlyViewed"
									}
								}
							}
							let ChildIngToUserTitle = []
							let ChildIngToUserHandle = []
							let ChildingToAvatar = []
							let ChildingToTimeStamp = []
							let ChildingToTimeStampLinkToPostUrl = []
							let ChildingToPostText = []
							let ChildingToMedia = []
							let ChildingToReplyRepostLike = []
							
							let ChildingToReplyLineDown = []
							let ChildingToReplyLineUp = []
							
							switch (Type) {
								case "Post_CurrentlyViewedAtTop":
									ChildIngToUserTitle = [0,0,0,1,0,0,0,0]
									ChildIngToUserHandle = [0,0,0,1,1]
									ChildingToAvatar = [0,0,0,0,0,0,0,1]
									ChildingToTimeStamp = [0,0,0,1,0,0,1]
									ChildingToPostText = [0,0,1,0,0]
									ChildingToMedia = [0,0,1,0]
									ChildingToReplyRepostLike = [0,0,1,3,0]
									//Currently viewed at the top never has lines below it as it seems.
									break
								case "Post_CurrentlyViewedNotAtTop":
									ChildIngToUserTitle = [0,1,0,1,0,0,0]
									ChildIngToUserHandle = [0,1,0,1,1,0]
									ChildingToAvatar = [0,1,0,0,0,0,0,1]
									ChildingToTimeStamp = [0,1,0,1,0,0,1]
									ChildingToPostText = [0,1,1,0,0]
									ChildingToMedia = [0,1,1,0]
									ChildingToReplyRepostLike = [0,1,1,3,0]
									ChildingToReplyLineUp = [0,0,0,0]
									break
								case "Post_NotCurrentlyViewed":
									ChildIngToUserTitle = [0,0,0,0,1,1,0,0,0,0]
									ChildIngToUserHandle = [0,0,0,0,1,1,0,0,0,2]
									ChildingToAvatar = [0,0,0,0,1,0,0,0,0,1]
									ChildingToTimeStamp = [0,0,0,0,1,1,0,2]
									ChildingToTimeStampLinkToPostUrl = [0,0,0,0,1,1,0,2]
									ChildingToPostText = [0,0,0,0,1,1,1]
									ChildingToMedia = [0,0,0,0,1,1]
									ChildingToReplyRepostLike = [0,0,0,0,1,1,2]
									
									ChildingToReplyLineDown = [0,0,0,0,1,0,1]
									ChildingToReplyLineUp = [0,0,0,0,0,0,0]
									break
							}
							if (/^Post_/.test(Type)) { //For boxes that are posts.
								if (/^Post_CurrentlyViewed/.test(Type)) {
									PostURL = HttpToTtp(window.location.href)
								} else {
									let NodeToLookAt_LinkInTimestamp = DescendNode(Box, ChildingToTimeStampLinkToPostUrl)
									if (NodeToLookAt_LinkInTimestamp.LevelsPassed == ChildingToTimeStampLinkToPostUrl.length) {
										if (typeof NodeToLookAt_LinkInTimestamp.OutputNode.href != "undefined") {
											PostURL = HttpToTtp(NodeToLookAt_LinkInTimestamp.OutputNode.href)
										}
										
									}
								}
								UserTitle = DescendNode(Box, ChildIngToUserTitle).OutputNode.textContent
								UserHandle = DescendNode(Box, ChildIngToUserHandle).OutputNode.innerText
								{
									//Check for avatar
									//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
									let NodeToLookAt_AvatarImg = DescendNode(Box, ChildingToAvatar)
									if (NodeToLookAt_AvatarImg.LevelsPassed == ChildingToAvatar.length) {
										UserAvatar = HttpToTtp(NodeToLookAt_AvatarImg.OutputNode.src)
									}
								}
								{
									let NodeToLookAt_TimeStamp = DescendNode(Box, ChildingToTimeStamp)
									if (NodeToLookAt_TimeStamp.LevelsPassed == ChildingToTimeStamp.length) {
										if (typeof NodeToLookAt_TimeStamp.OutputNode.dataset != "undefined") {
											if (typeof NodeToLookAt_TimeStamp.OutputNode.dataset.tooltip != "undefined"){
												PostTimeStamp = NodeToLookAt_TimeStamp.OutputNode.dataset.tooltip
											}
										}
									}
								}
								{
									let PostTextArea = DescendNode(Box, ChildingToPostText)
									if (PostTextArea.LevelsPassed == ChildingToPostText.length) {
										PostText = PostTextArea.OutputNode.textContent
										LinksToAnotherPage = GetLinksURLs(PostTextArea.OutputNode)
									}
								}
								{
									let MediaArea = DescendNode(Box, ChildingToMedia)
									if (MediaArea.LevelsPassed == ChildingToMedia.length) {
										MediaList = GetMediaURLs(MediaArea.OutputNode)
									}
								}
								{
									//Box.childNodes[0].childNodes[0].childNodes[1].childNodes[3].childNodes[0].childNodes 
									let ReplyRepostLikesNode = DescendNode(Box, ChildingToReplyRepostLike)
									if (ReplyRepostLikesNode.LevelsPassed == ChildingToReplyRepostLike.length) {
										let ReplyRepostLikesNodeBoxes = Array.from(ReplyRepostLikesNode.OutputNode.childNodes)
										ReplyCount = ReplyRepostLikesNodeBoxes[0].innerText
										RepostCount = ReplyRepostLikesNodeBoxes[1].innerText
										LikesCount = ReplyRepostLikesNodeBoxes[2].innerText
									}
								}
								//Handle vertical lines indicating a reply
								{
									let ReplyLineDownNode = DescendNode(Box, ChildingToReplyLineDown)
									if (ReplyLineDownNode.LevelsPassed == ChildingToReplyLineDown.length) {
										if (typeof ReplyLineDownNode.OutputNode.style != "undefined") {
											if (Type == "Post_NotCurrentlyViewed") {
												PostHasRepliesLineBelow = true
											}
										}
									}
									let ReplyLineUpNode = DescendNode(Box, ChildingToReplyLineUp)
									if (ReplyLineUpNode.LevelsPassed == ChildingToReplyLineUp.length) {
										if (typeof ReplyLineUpNode.OutputNode.style != "undefined") {
											if (ReplyLineUpNode.OutputNode.style.length > 1) {
												PostIsAReplyLineToAbove = true
											}
										}
									}
								}
								
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
									PostText: PostText,
									LinksToAnotherPage: LinksToAnotherPage,
									MediaList: MediaList,
									ReplyCount: ReplyCount,
									RepostCount: RepostCount,
									LikesCount: LikesCount
								})
							}
						})
						let a = 0
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
										let a = 0
									}
								}
							}
						}
						ListOfPosts.push(...PostGroup)
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
							PostText: ArrayElement.PostText,
							LinksToAnotherPage: ArrayElement.LinksToAnotherPage,
							MediaList: ArrayElement.MediaList,
							ReplyCount: ArrayElement.ReplyCount,
							RepostCount: ArrayElement.RepostCount,
							LikesCount: ArrayElement.LikesCount
						}
					})
				//Set a breakpoint here after everything loads to test the results stored in "ListOfPosts".
				RaceConditionLock = false
			}
		}
	//reused Functions
		function ConsoleLoggingURL(URL_String) {
			let URL_truncateProof = URL_String.replace(/^http/, "ttp")
			if (!SetOfURLs.has(URL_truncateProof)) {
				console.log(URL_truncateProof)
				SetOfURLs.add(URL_truncateProof)
			}
		}
		function AscendNode(Node, Levels) {
			//Instead of Node.parentNode.parentNode.parentNode... which is prone to errors if there is no parent, this has a check to prevent it.
			//Arguments:
			//-Node: The node in the HTML
			//-Levels: A number, representing how many levels to ascend
			//Will return:
			//-the parent node at "Levels" up, unless it cannot go up any further, then the highest
			//-the number of successful levels it goes up.
			let CurrentNode = Node
			let ChildCount = 0
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
				LevelsPassed: ChildCount
			}
		}
		function DescendNode(Node, LevelsArray) {
			//Opposite of AscendNode, descends a node without errors. LevelsArray is an array that contains
			//only numbers on what child to descend on.
			let CurrentNode = Node
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
				LevelsPassed: ParentCount
			}
		}
		function GetMediaURLs(Node) {
			//Returns an array listing URLs of media
			let Output = []
			if (Node.childNodes.length != 0) {
				Output = Array.from(Node.getElementsByTagName("img")).map((HTMLTag) => {
					let URLOfSource = ""
					if (HTMLTag.tagName == "IMG") {
						URLOfSource = HTMLTag.src
					}
					
					return HttpToTtp(FullResConvert(URLOfSource))
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
			while ((CurrentNode.parentNode != null) && (!isHidden)) {
				CurrentNode = CurrentNode.parentNode
				if (typeof CurrentNode.style != "undefined") {
					if (typeof CurrentNode.style.display != "undefined") {
						if (CurrentNode.style.display == "none") {
							isHidden = true
						}
					}
				}
			}
			return isHidden
		}
})();