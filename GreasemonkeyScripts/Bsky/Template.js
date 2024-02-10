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
		const Setting_http_ttp = true
			//^true = All URLs in the output start with "ttp" instead of "http" (to avoid URL truncation like what firefox does; replacing the middle of string with ellipsis).
			// false = leave it as http
		const Setting_PostImageFullRes = true
			//^true = all image URLs in the post will be full resolution versions
			// false = use resolution from the HTML.

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
					let ListOfPosts = []
					if (!/https:\/\/bsky\.app\/feeds.*$/.test(window.location.href)) {
						ListOfPosts = Array.from(document.getElementsByTagName("img")).filter((ImgSrc) => { //Get post by avatar images
							let IsUserAvatar = /https:\/\/cdn\.bsky\.app\/img\/avatar\//.test(ImgSrc.src)
							let FollowUserButtonExist = false
							let CurrentParentNode = ImgSrc
							let OuterNodesOfPost = AscendNode(ImgSrc, 5)
	
							let FollowUserButton = Array.from(OuterNodesOfPost.OutputNode.getElementsByTagName("button")).find((ArrayElement) => {
								return /^Follow/.test(ArrayElement.innerText)
							});
							if (typeof FollowUserButton != "undefined" && OuterNodesOfPost.LevelsPassed == 5) {
								FollowUserButtonExist = true
							}
							
							
							return IsUserAvatar && (!FollowUserButtonExist) && (!isHidden(ImgSrc))
						})
					}
					ListOfPosts = ListOfPosts.map((ArrayElement) => { //Get outermost of the post
						return AscendNode(ArrayElement, 6).OutputNode
					})
					ListOfPosts = ListOfPosts.map((ArrayElement) => { //On each post, create an object with the data extracted
						let RepostedByUserTitle = ""
						let PostURL = "" //URL of post (if viewing its URL directly, then it is the browser's [window.location.href])
						
						let PostHasRepliesLineBelow = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
						let PostIsAReplyLineToAbove = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
						let IsCurrentPostURL = false //Used to determine the post that doesn't have a href link to determine the post below it is a reply to it
						
						let ReplyToURL = "" //Reply to post above
						let RepliesURLs = [] //Replies of the current post
						let UserTitle = ""
						let Username = ""
						let UserAvatar = ""
						let PostTimeStamp = ""
						let PostText = ""
						let LinksToAnotherPage = []
						let MediaList = []
						let ReplyCount = ""
						let RepostCount = ""
						let LikesCount = ""
						
						//Although I could use set, but then there is a bug with mozilla that made me use array instead: If printed to the console log
						//and you try to copy, it will appear as "{}", and if you try to copy just this set, "Copy Message" is greyed out. So for some
						//I can't copy a set from the console log. Tested on version 122.0.1 (64-bit).
						
						//template:
						//DescendNode(ArrayElement, []).OutputNode
						//MediaList = GetMediaURLs(DescendNode(ArrayElement, []).OutputNode)
						//LinksToAnotherPage = GetLinksURLs(DescendNode(ArrayElement, []).OutputNode)
						
						//This area handles different post dom tree structures. They very depending if it is a repost,
						//a reply to a post, or the current post being replied.
						if (ArrayElement.childNodes[0].innerText == "") { //Gap above top post
							//The majority of posts when being on the profile page
							UserTitle = DescendNode(ArrayElement, [1, 1, 0, 0, 0, 0]).OutputNode.textContent
							Username = DescendNode(ArrayElement, [1, 1, 0, 0, 0, 2]).OutputNode.innerText
							
							let NodeOfAvatar = DescendNode(ArrayElement, [1, 0])
							if (NodeOfAvatar.LevelsPassed == 2) {
								let AvatarImgTag = Array.from(NodeOfAvatar.OutputNode.getElementsByTagName("IMG"))
								if (AvatarImgTag.length != 0) {
									UserAvatar = HttpToTtp(AvatarImgTag[0].src)
								}
							}

							let NodeOfLink = DescendNode(ArrayElement, [1, 1, 0, 2])
							PostTimeStamp = NodeOfLink.OutputNode.dataset.tooltip
							
							if (typeof NodeOfLink != "undefined" && typeof NodeOfLink.OutputNode.href != "undefined") {
								PostURL = HttpToTtp(NodeOfLink.OutputNode.href)
							}
							PostText = DescendNode(ArrayElement, [1, 1, 1]).OutputNode.innerText
							LinksToAnotherPage = GetLinksURLs(DescendNode(ArrayElement, [1, 1, 1]).OutputNode)
							
							MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 1]).OutputNode)
							
							ReplyCount = DescendNode(ArrayElement, [1, 1, 2, 0]).OutputNode.innerText
							RepostCount = DescendNode(ArrayElement, [1, 1, 2, 1]).OutputNode.innerText
							LikesCount =  DescendNode(ArrayElement, [1, 1, 2, 2]).OutputNode.innerText
							
							PostIsAReplyLineToAbove = (DescendNode(ArrayElement, [0, 0, 0]).LevelsPassed == 3) //Line connector up
							PostHasRepliesLineBelow = (DescendNode(ArrayElement, [1, 0, 1]).LevelsPassed == 3) //Line connector down
							let a = 0
						} else if (!/@[a-zA-Z\d\-]+.[a-zA-Z\d\-]+.[a-zA-Z\d\-]+/.test(DescendNode(ArrayElement, [0, 1, 1, 0]).OutputNode.innerText)) {
							//Reposts (found on user home page)
							RepostedByUserTitle = DescendNode(ArrayElement, [0, 1, 0, 1, 1]).OutputNode.textContent
							UserTitle = DescendNode(ArrayElement, [1, 1, 0, 0 ,0 ,0]).OutputNode.textContent
							Username = DescendNode(ArrayElement, [1, 1, 0, 0, 0, 2]).OutputNode.innerText
							
							let NodeOfAvatar = DescendNode(ArrayElement, [1, 0])
							if (NodeOfAvatar.LevelsPassed == 2) {
								let AvatarImgTag = Array.from(NodeOfAvatar.OutputNode.getElementsByTagName("IMG"))
								if (AvatarImgTag.length != 0) {
									UserAvatar = HttpToTtp(AvatarImgTag[0].src)
								}
							}
							
							let NodeOfLink = DescendNode(ArrayElement, [1, 1, 0, 2])
							PostTimeStamp = NodeOfLink.OutputNode.dataset.tooltip
							if (typeof NodeOfLink.OutputNode != "undefined") {
								if (NodeOfLink.OutputNode.tagName == "A" && typeof NodeOfLink.OutputNode.href != "undefined") {
									PostURL = HttpToTtp(NodeOfLink.OutputNode.href)
								}
							}
							PostText = DescendNode(ArrayElement, [1, 1, 1, 0]).OutputNode.innerText
							LinksToAnotherPage = GetLinksURLs(DescendNode(ArrayElement, [1, 1, 1, 0 ]).OutputNode)
							MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 1, 1]).OutputNode)
							
							ReplyCount = DescendNode(ArrayElement, [1, 1, 2, 0]).OutputNode.innerText
							RepostCount = DescendNode(ArrayElement, [1, 1, 2, 1]).OutputNode.innerText
							LikesCount =  DescendNode(ArrayElement, [1, 1, 2, 2]).OutputNode.innerText
							
							let a = 0
						} else if (/@[a-zA-Z\d\-]+.[a-zA-Z\d\-]+.[a-zA-Z\d\-]+/.test(DescendNode(ArrayElement, [0, 1, 1, 0]).OutputNode.innerText)) {
							//Here seems to only happen to posts that you are on, where it lacks the a href link to the post (because it is not necessary).
							let UserTitleOfQuoted = DescendNode(ArrayElement, [0, 1, 0, 0, 0, 0, 0]).OutputNode.textContent
							if (UserTitleOfQuoted != "") {
								UserTitle = UserTitleOfQuoted
								Username = DescendNode(ArrayElement, [0, 1, 1, 0]).OutputNode.innerText
								PostTimeStamp = DescendNode(ArrayElement, [0, 1, 0, 0, 1]).OutputNode.dataset.tooltip
								PostURL = HttpToTtp(window.location.href) //Post lacks a a href link to post
								IsCurrentPostURL = true
								PostText = DescendNode(ArrayElement, [1, 0, 0]).OutputNode.innerText
								LinksToAnotherPage = GetLinksURLs(DescendNode(ArrayElement, [1, 0, 0]).OutputNode)
								MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 0]).OutputNode)
								
								let CommentsRepostLikes = DescendNode(ArrayElement, [1, 3, 0])
								if (CommentsRepostLikes.LevelsPassed == 3) {
									ReplyCount = DescendNode(CommentsRepostLikes.OutputNode, [0]).OutputNode.innerText
									RepostCount = DescendNode(CommentsRepostLikes.OutputNode, [1]).OutputNode.innerText
									LikesCount =  DescendNode(CommentsRepostLikes.OutputNode, [2]).OutputNode.innerText
								} else {
									CommentsRepostLikes = DescendNode(ArrayElement, [1, 2, 0])
									ReplyCount = DescendNode(CommentsRepostLikes.OutputNode, [0]).OutputNode.innerText
									RepostCount = DescendNode(CommentsRepostLikes.OutputNode, [1]).OutputNode.innerText
									LikesCount =  DescendNode(CommentsRepostLikes.OutputNode, [2]).OutputNode.innerText
								}
								
								let a = 0
							} else {
								//Quoted post (I think never have vertical lines connecting avatar pic unless you visit the post directly)
								UserTitle = DescendNode(ArrayElement, [0, 0, 1, 0, 0]).OutputNode.textContent
								Username = DescendNode(ArrayElement, [0, 0, 1, 0, 2]).OutputNode.innerText
								PostTimeStamp = DescendNode(ArrayElement, [0, 0, 3]).OutputNode.dataset.tooltip
								PostURL = HttpToTtp(DescendNode(ArrayElement, [0, 0, 3]).OutputNode.href)
								PostText = DescendNode(ArrayElement, [1]).OutputNode.innerText
								LinksToAnotherPage = GetLinksURLs(ArrayElement)
								MediaList = GetMediaURLs(ArrayElement)
								
								let a = 0
							}
						} else {
							let a = 0 //In case there is another format I haven't discovered
						}
						return {
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
							Username: Username,
							UserAvatar: UserAvatar,
							PostTimeStamp: PostTimeStamp,
							PostText: PostText,
							LinksToAnotherPage: LinksToAnotherPage,
							MediaList: MediaList,
							ReplyCount: ReplyCount,
							RepostCount: RepostCount,
							LikesCount: LikesCount
						}
					})
					//Connect replies
					let ForLoopCache = ListOfPosts.length
					for (let i = 0; i < ForLoopCache; i++) {
						if (i+1 < ForLoopCache) { //adjacent posts and that "i" is not beyond the last element
							if (ListOfPosts[i].ReplyConnections.PostHasRepliesLineBelow && ListOfPosts[i+1].ReplyConnections.PostIsAReplyLineToAbove) {
								//If two adjacent posts have a line connecting the two, have the former's replies list added a URL of the replying post
								//and the reply post have the URL it is replying to.
								if (!ListOfPosts[i].RepliesURLs.includes(ListOfPosts[i+1].PostURL)) { //Can't use "new Set()" bc firefox glitch
									ListOfPosts[i].RepliesURLs.push(ListOfPosts[i+1].PostURL)
								}
								if (ListOfPosts[i+1].ReplyToURL == ""){
									ListOfPosts[i+1].ReplyToURL = ListOfPosts[i].PostURL
								}
							}
							if (/https:\/\/bsky\.app\/profile\/[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\.[a-zA-Z\d\-]+\/post\//.test(window.location.href)) { //While being on a post page
								if (ListOfPosts[i].ReplyConnections.PostHasRepliesLineBelow && (!ListOfPosts[i+1].ReplyConnections.PostIsAReplyLineToAbove)) {
									//A post that is a reply to above in which the above's vertical line gets cut off.
									if (!ListOfPosts[i].RepliesURLs.includes(ListOfPosts[i+1].PostURL)) { //Can't use "new Set()" bc firefox glitch
										ListOfPosts[i].RepliesURLs.push(ListOfPosts[i+1].PostURL)
									}
									if (ListOfPosts[i+1].ReplyToURL == ""){
										ListOfPosts[i+1].ReplyToURL = ListOfPosts[i].PostURL
									}
								}
								if (ListOfPosts[i].ReplyConnections.IsCurrentPostURL) {
									//Get posts below it that has no line above the avatar picture
									for (let j = i+1; j < ForLoopCache; j++) { //The posts below the current post
										if (!ListOfPosts[j].ReplyConnections.PostIsAReplyLineToAbove) { //Not have a connecting line above it (not even a cutoff line)
											if (!ListOfPosts[i].RepliesURLs.includes(ListOfPosts[j].PostURL)) { //Can't use "new Set()" bc firefox glitch
												ListOfPosts[i].RepliesURLs.push(ListOfPosts[j].PostURL)
											}
											if (ListOfPosts[j].ReplyToURL == ""){
												ListOfPosts[j].ReplyToURL = ListOfPosts[i].PostURL
											}
										}
										
									}
								}
							}
						}
					}
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
			
			let i = 0
			for (i = 0; i < Levels; i++) {
				if (typeof CurrentNode.parentNode != "undefined") {
					CurrentNode = CurrentNode.parentNode
				} else {
					break
				}
			}
			return {
				OutputNode: CurrentNode,
				LevelsPassed: i
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
			//Returns an array listing URLs of media
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
})();