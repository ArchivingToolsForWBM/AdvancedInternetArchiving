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
	//-Best to have URLs have the "http" substring replaced with "ttps" because firefox truncate long links and doesn't keep the original full URL when copying them (the middle is
	// replaced with ellipsis).
	//-Chrome will truncate object parts printed on the console log, and those aren't preserved
	//-If you navigate to (click on links) another bsky page, the list of process stored here will not unload posts that are no longer visible that were once visible before you navigate
	// due to the entire page not refreshing. This means that if you say navigate from the user profile page to a posts, several posts from the profile page persist while being on a
	// post page. This script will detect loaded-but-invisible lists and ignore them.
	//-This scripts assumes that the reply post system follows a "tree structure": https://en.wikipedia.org/wiki/Tree_(data_structure) - The first post that isn't a reply to anything is
	// the "root" post each post can have multiple replies, but what it's replying to only goes to 1 post. Therefore the attribute "ReplyToURL" only contains 1 URL, and "RepliesURLs" is
	// a list of replies to the post.
	//-This script will work on post pages if you are logged in, because the dom tree layout of posts are different when viewing a post vs not logged in. I strongly recommend that you
	// are because users can sometimes have their post content hidden from public view.
	//Settings
		const Setting_Delay = 3000
			//^Number of milliseconds between each re-execution of this script.
		const Setting_http_ttp = false
			//^true = All URLs in the output start with "ttp" instead of "http" (to avoid URL truncation like what firefox does; replacing the middle of string with ellipsis).
			// false = leave it as http
		const Setting_ShowLocalTimeInTimestamp = true
			//^true = PostTimeStamp sub-object will contain the local timestamp
			//^false = no (will only show the UTC and milliseconds (page only shows minutes as lowest units of time, so it assumes whole minutes) since epoch)
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
					let ListOfPosts = [] //List of each individual posts
					if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\/?$/.test(window.location.href)) { //profile page
						//First, find an a href link to a profile as a reference. We get the lowest node that at least has all the posts on the page
						UserPostArea = GetPostBoxesByLink(8)
						
						let a = 0
						
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
											let RepostElement = DescendNode(Post, [0, 0, 1, 0, 1, 1])
											if (RepostElement.IsSuccessful) {
												RepostedByUserTitle = RepostElement.OutputNode.textContent
											}
										}
										
										//Link to post
										{
											let AHrefElement = DescendNode(Post, [0, 1, 1, 0, 2])
											if (AHrefElement.IsSuccessful) {
												if (AHrefElement.OutputNode.href != "") {
													PostURL = HttpToTtp(AHrefElement.OutputNode.href)
												}
											}
										}
										//Reply downwards line
										{
											let LineElement = DescendNode(Post, [0, 1, 0, 1])
											if (LineElement.IsSuccessful) {
												PostHasRepliesLineBelow = true
											}
										}
										//Reply upwards line
										{
											let LineElement = DescendNode(Post, [0, 0, 0, 0])
											if (LineElement.IsSuccessful) {
												PostHasRepliesLineBelow = true
											}
										}
										//User title
										{
											let UserTitleElement = DescendNode(Post, [0, 1, 1, 0, 0, 0, 0])
											if (UserTitleElement.IsSuccessful) {
												UserTitle = UserTitleElement.OutputNode.textContent
											}
										}
										//User handle
										{
											let UserHandleElement = DescendNode(Post, [0, 1, 1, 0, 0, 0, 2])
											if (UserHandleElement.IsSuccessful) {
												UserHandle = UserHandleElement.OutputNode.innerText
											}
										}
										//User Avatar
										{
											//Post.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1]
											let AvatarImgElement = DescendNode(Post, [0, 1, 0, 0, 0, 0, 1])
											if (AvatarImgElement.IsSuccessful) {
												if (typeof AvatarImgElement.OutputNode.src != "undefined") {
													UserAvatar = HttpToTtp(AvatarImgElement.OutputNode.src)
												}
											}
										}
										//Post time stamp
										{
											let PostTimeStampElement = DescendNode(Post, [0, 1, 1, 0, 2])
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
										let a = 0
										
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
										let NodeOfReplyTo = DescendNode(Post, [0,1,1,1,1])
										if (NodeOfReplyTo.IsSuccessful) {
											if (/^Reply to/.test(NodeOfReplyTo.OutputNode.innerText)) {
												let ReplyToLink = Array.from(NodeOfReplyTo.OutputNode.getElementsByTagName("a"))
												if (ReplyToLink.length != 0) {
													ReplyToOffset++
												}
											}
										}
										let NodeOfPostContent = DescendNode(Post, [0,1,1,1+ReplyToOffset])
										if (NodeOfPostContent.IsSuccessful) {
											PostContent = GetPostContent(NodeOfPostContent.OutputNode, "Post_UserFontPage")
										}
										
										
										//Reply, repost, and likes
										{
											let NodeOfReplyRepostLikes_Array = []
											//Post.childNodes[0].childNodes[0].childNodes[1].childNodes[N]
											//where N is the last element because sometimes a post have duplicate counts between the date and timestamp at the bottom
											let NodeOfFoooter = DescendNode(Post, [0,1,1])
											if (NodeOfFoooter.IsSuccessful) {
												let LastNode = Array.from(NodeOfFoooter.OutputNode.childNodes).at(-1)
												NodeOfReplyRepostLikes_Array = Array.from(LastNode.childNodes)
											}
											ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText
											RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
											LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
										}
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
											LikesCount: LikesCount
										})
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
						
					} else if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-\.]+\/post\/[a-zA-Z\d\-]+\/?/.test(window.location.href)) { //Post page
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
								ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText
								RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
								LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
								
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
								
								ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText
								RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
								LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
								let a = 0
							} else if (Type == "Post_NotCurrentlyViewed") {
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[2].href
								PostURL = HttpToTtp(DescendNode(Box, [0,0,0,0,1,1,0,2]).OutputNode.href)
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[1].style
								let ReplyLineDownNode = DescendNode(Box, [0,0,0,0,1,0,1])
								if (ReplyLineDownNode.IsSuccessful) {
									if (typeof ReplyLineDownNode.OutputNode.style != "undefined") {
										PostHasRepliesLineBelow = true
									}
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].style
								let ReplyLineUpNode = DescendNode(Box, [0,0,0,0,0,0,0])
								if (ReplyLineUpNode.IsSuccessful) {
									if (typeof ReplyLineUpNode.OutputNode.style != "undefined") {
										if (ReplyLineUpNode.OutputNode.style.length > 1) {
											PostIsAReplyLineToAbove = true
										}
									}
								}
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent
								UserTitle = DescendNode(Box, [0,0,0,0,1,1,0,0,0,0]).OutputNode.textContent
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText
								UserHandle = DescendNode(Box, [0,0,0,0,1,1,0,0,0,2]).OutputNode.innerText
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
								let NodeOfAvatarImg = DescendNode(Box, [0,0,0,0,1,0,0,0,0,1])
								if (NodeOfAvatarImg.IsSuccessful) {
									UserAvatar = HttpToTtp(NodeOfAvatarImg.OutputNode.src)
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip
								PostTimeStamp = PostDateInfo(DescendNode(Box, [0,0,0,0,1,1,0,2]).OutputNode.dataset.tooltip)
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1] - This also contains the header and footer...
								let NodeOfPostContent = DescendNode(Box, [0,0,0,0,1,1])
								if (NodeOfPostContent.IsSuccessful) {
									PostContent = GetPostContent(NodeOfPostContent.OutputNode, Type)
								}
								
								//Box.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[N]
								let NodeOfReplyRepostLikes_Array = []
								let NodeOfFoooter = DescendNode(Box, [0,0,0,0,1,1])
								if (NodeOfFoooter.IsSuccessful) {
									let LastNode = Array.from(NodeOfFoooter.OutputNode.childNodes).at(-1)
									let NodeOfFooterDeepest = LastNode
									NodeOfReplyRepostLikes_Array = Array.from(NodeOfFooterDeepest.childNodes)
									
								}
								ReplyCount = NodeOfReplyRepostLikes_Array[0].innerText
								RepostCount = NodeOfReplyRepostLikes_Array[1].innerText
								LikesCount = NodeOfReplyRepostLikes_Array[2].innerText
								
							}
							if (/^Post_/.test(Type)) {
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
									LikesCount: LikesCount
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
					LevelsPassed: ChildCount
				}
			} else {
				return {
					OutputNode: undefined,
					LevelsPassed: -1
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
				if (CurrentNode.style.display == "none") {
					return true
				}
			}
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
				let NodeToLookAt_TimeStampOtherThanCurrentPost = DescendNode(PostBox, [0,0,0,0,1,1,0,2])
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
				if (NodeToLookAt_TimeStampCurrentlyViewedPostTop.LevelsPassed == 6) {
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
				if (NodeToLookAt_TimeStampOtherThanCurrentPost.LevelsPassed == 8) {
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
						if (Array.from(PostSegment.childNodes[0].getElementsByTagName("DIV")).length == 0) { //If there is no more div levels down, then this is user-posted text
							PostContent.Segments.push({
								ContentType: "Text",
								UserPostedText: PostSegment.textContent,
								Links: GetLinksURLs(PostSegment)
							})
						} else {
							//PostSegment contains multiple sub-boxes here
							//https://bsky.app/profile/dumjaveln.bsky.social/post/3klkgthv63q2z quoted post
							let Node_QuoteSubBox = DescendNode(PostSegment, [0]) //Go down a div level
							if (Node_QuoteSubBox.IsSuccessful) {
								if (Node_QuoteSubBox.OutputNode.tagName != "A") {
									let SubBoxesContent = []
									let SubBoxes = Array.from(Node_QuoteSubBox.OutputNode.childNodes)
									SubBoxes.forEach((SubBox) => { //Loop each inner boxes (text, images, quotes)
										if (SubBox.innerText != "") {
											//Test if there is a post date
											//SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[3].dataset.tooltip
											let NodeOfPostDate = DescendNode(SubBox, [0,0,0,3])
											
											//SubBox.childNodes[0].childNodes[0].childNodes[3].dataset.tooltip
											//https://bsky.app/profile/kimscaravelli.bsky.social/post/3klaue65stp2x
											let NodeOfPostDate1 = DescendNode(SubBox, [0,0,3])
											
											
											if (NodeOfPostDate.IsSuccessful) { //This HAS to be a quote (if attachments have both a media and a quote, thus both wrapped in a div)
												if (NodeOfPostDate.OutputNode.dataset.tooltip != "") { //If has a date
													let PostURL = HttpToTtp(NodeOfPostDate.OutputNode.href)
													
													//SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0]
													let UserTitle = DescendNode(SubBox, [0,0,0,1,0,0]).OutputNode.textContent
													
													//SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[2].innerText
													let UserHandle = DescendNode(SubBox, [0,0,0,1,0,2]).OutputNode.innerText
													
													//SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
													let UserAvatar = ""
													let NodeOfAvatarImg = DescendNode(SubBox, [0,0,0,0,0,0,1])
													if (NodeOfAvatarImg.IsSuccessful) {
														UserAvatar = HttpToTtp(NodeOfAvatarImg.OutputNode.src)
													}
													
													let PostTimeStamp = PostDateInfo(NodeOfPostDate.OutputNode.dataset.tooltip)
													
													//SubBox.childNodes[0].childNodes[1].childNodes[0].textContent
													let PostContentText = ""
													let NodeOfPostContentText = DescendNode(SubBox, [0,1,0])
													if (NodeOfPostContentText.IsSuccessful) {
														PostContentText = NodeOfPostContentText.OutputNode.textContent
													}
													
													let a = 0
													SubBoxesContent.push({
														ContentType: "Quote",
														PostURL: PostURL,
														UserTitle: UserTitle,
														UserHandle: UserHandle,
														UserAvatar: UserAvatar,
														PostTimeStamp: PostTimeStamp,
														PostContentText: PostContentText
													})
												}
											} else if (NodeOfPostDate1.IsSuccessful) { //If there is only a single attachment, then this isn't div-wrapped
												if (NodeOfPostDate1.OutputNode.dataset.tooltip != "") {
													//SubBox.childNodes[0] - header
													//SubBox.childNodes[1+] - content
													//
													//https://bsky.app/profile/anyainlove.bsky.social/post/3klxhf4wnoi2z - postception
													//
													let PostURL = HttpToTtp(NodeOfPostDate1.OutputNode.href)
													
													//SubBox.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].textContent
													let UserTitle = DescendNode(SubBox, [0,0,1,0,0]).OutputNode.textContent
													
													//SubBox.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[2].innerText
													let UserHandle = DescendNode(SubBox, [0,0,1,0,2]).OutputNode.textContent
													
													//SubBox.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].src
													let UserAvatar = ""
													let NodeOfAvatarImg = DescendNode(SubBox, [0,0,0,0,0,1])
													if (NodeOfAvatarImg.IsSuccessful) {
														UserAvatar = HttpToTtp(NodeOfAvatarImg.OutputNode.src)
													}
													
													let PostTimeStamp = PostDateInfo(NodeOfPostDate1.OutputNode.dataset.tooltip)
													
													//SubBox.childNodes[1+]
													//https://bsky.app/profile/dumjaveln.bsky.social/post/3kls5tyrvdd2v
													
													//SubBox.childNodes[1].childNodes[0].textContent
													let PostContentText = ""
													let NodeOfPostContentText = DescendNode(SubBox, [1,0])
													if (NodeOfPostContentText.IsSuccessful) {
														PostContentText = NodeOfPostContentText.OutputNode.textContent
													}
													
													
													SubBoxesContent.push({
														ContentType: "Quote",
														PostURL: PostURL,
														UserTitle: UserTitle,
														UserHandle: UserHandle,
														UserAvatar: UserAvatar,
														PostTimeStamp: PostTimeStamp,
														PostContentText: PostContentText
													})
												}
											}
										} else {
											//Post has quotes and media
											SubBoxesContent.push({
												ContentType: "Media",
												MediaURLs: GetMediaURLs(SubBox)
											})
										}
										let a = 0
									})
									PostContent.Segments.push({
										ContentType: "Attachment",
										Content: SubBoxesContent
									})
								} else { //Link to external site, have a preview of the page, e.g. https://bsky.app/profile/pappahutten.bsky.social/post/3klxhuy6wbc2h
									let LinkPreview = Node_QuoteSubBox.OutputNode
									let LinkPreviewObject = LinkPreviewNodeToJson(LinkPreview)
									let a = 0
									PostContent.Segments.push(LinkPreviewObject)
								}
							}
						}
					}
				} else {
					PostContent.Segments.push({
						ContentType: "Media",
						MediaURLs: GetMediaURLs(PostSegment)
					})
				}
			})
			return PostContent
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
			}
			return LinkPreviewObject
		}
})();