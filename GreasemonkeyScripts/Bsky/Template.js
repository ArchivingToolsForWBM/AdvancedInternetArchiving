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
	//-URLs have the "http" substring replaced with "ttps" because firefox truncate links and doesn't keep the original full URL when copying them (the middle is replaced with ellipsis).
	//-Chrome will truncate object parts printed on the console log, and those aren't preserved
	//-If you navigate to (click on links) another bsky page, the list of process stored here will not unload posts that are no longer visible that were once visible before you navigate
	// due to the entire page not refreshing. This means that if you say navigate from the user profile page to a posts, several posts from the profile page persist while being on a
	// post page.
	// 
	//Settings
		const Setting_Delay = 1000
		const Setting_ParentElementCount = 3

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
					let ListOfPosts = Array.from(document.getElementsByTagName("img")).filter((ImgSrc) => { //Get post by avatar images
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
						
						return IsUserAvatar && (!FollowUserButtonExist)
					})
					ListOfPosts = ListOfPosts.map((ArrayElement) => { //Get outermost of the post
						return AscendNode(ArrayElement, 6).OutputNode
					})
					ListOfPosts = ListOfPosts.map((ArrayElement) => { //On each post, create an object with the data extracted
						let RepostedByUserTitle = ""
						let PostURL = "" //URL of post (if viewing its URL directly, then it is the browser's [window.location.href])
						let PostHasRepliesBelow = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
						let PostIsAReplyToAbove = false //Used to determine if it has a reply or a reply to above (based on the vertical line between avatars).
						let ReplyToURL = "" //Reply to post above
						let RepliesURL = [] //Replies of the current post
						let UserTitle = ""
						let Username = ""
						let PostTimeStamp = ""
						let PostText = ""
						let LinksToAnotherPage = []
						let MediaList = []
						let CommentsCount = ""
						let RepostCount = ""
						let LikesCount = ""
						
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
							PostTimeStamp = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode.dataset.tooltip
							
							let NodeOfLink = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode
							if (typeof NodeOfLink != "undefined") {
								PostURL = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode.href.replace(/^http/, "ttp")
							}
							PostText = DescendNode(ArrayElement, [1, 1, 1]).OutputNode.innerText
							LinksToAnotherPage = GetLinksURLs(DescendNode(ArrayElement, [1, 1, 1]).OutputNode)
							
							MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 1]).OutputNode)
							
							CommentsCount = DescendNode(ArrayElement, [1, 1, 2, 0]).OutputNode.innerText
							RepostCount = DescendNode(ArrayElement, [1, 1, 2, 1]).OutputNode.innerText
							LikesCount =  DescendNode(ArrayElement, [1, 1, 2, 2]).OutputNode.innerText
							
							PostIsAReplyToAbove = (DescendNode(ArrayElement, [0, 0, 0]).LevelsPassed == 3) //Line connector up
							PostHasRepliesBelow = (DescendNode(ArrayElement, [1, 0, 1]).LevelsPassed == 3) //Line connector down
							let a = 0
						} else if (!/@[a-zA-Z\d\-]+.[a-zA-Z\d\-]+.[a-zA-Z\d\-]+/.test(DescendNode(ArrayElement, [0, 1, 1, 0]).OutputNode.innerText)) {
							//Reposts (found on user home page)
							RepostedByUserTitle = DescendNode(ArrayElement, [0, 1, 0, 1, 1]).OutputNode.textContent
							UserTitle = DescendNode(ArrayElement, [1, 1, 0, 0 ,0 ,0]).OutputNode.textContent
							Username = DescendNode(ArrayElement, [1, 1, 0, 0, 0, 2]).OutputNode.innerText
							PostTimeStamp = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode.dataset.tooltip
							let NodeOfLink = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode
							if (typeof NodeOfLink != "undefined") {
								if (NodeOfLink.tagName == "A") {
									PostURL = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode.href.replace(/^http/, "ttp")
								}
							}
							PostText = DescendNode(ArrayElement, [1, 1, 1, 0]).OutputNode.innerText
							LinksToAnotherPage = GetLinksURLs(DescendNode(ArrayElement, [1, 1, 1, 0 ]).OutputNode)
							MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 1, 1]).OutputNode)
							
							CommentsCount = DescendNode(ArrayElement, [1, 1, 2, 0]).OutputNode.innerText
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
								PostURL = window.location.href.replace(/^http/, "ttp")
								PostText = DescendNode(ArrayElement, [1, 0, 0]).OutputNode.innerText
								LinksToAnotherPage = GetLinksURLs(DescendNode(ArrayElement, [1, 0, 0]).OutputNode)
								MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 0]).OutputNode)
								
								CommentsCount = DescendNode(ArrayElement, [1, 3, 0, 0]).OutputNode.innerText
								RepostCount = DescendNode(ArrayElement, [1, 3, 0, 1]).OutputNode.innerText
								LikesCount =  DescendNode(ArrayElement, [1, 3, 0, 2]).OutputNode.innerText
								
								let a = 0
							} else {
								//Quoted post (I think never have vertical lines connecting avatar pic unless you visit the post directly)
								UserTitle = DescendNode(ArrayElement, [0, 0, 1, 0, 0]).OutputNode.textContent
								Username = DescendNode(ArrayElement, [0, 0, 1, 0, 2]).OutputNode.innerText
								PostTimeStamp = DescendNode(ArrayElement, [0, 0, 3]).OutputNode.dataset.tooltip
								PostURL = DescendNode(ArrayElement, [0, 0, 3]).OutputNode.href.replace(/^http/, "ttp")
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
							PostHasRepliesBelow: PostHasRepliesBelow,
							PostIsAReplyToAbove: PostIsAReplyToAbove,
							ReplyToURL: ReplyToURL,
							RepliesURL: RepliesURL,
							UserTitle: UserTitle,
							Username: Username,
							PostTimeStamp: PostTimeStamp,
							PostText: PostText,
							LinksToAnotherPage: LinksToAnotherPage,
							MediaList: MediaList,
							CommentsCount: CommentsCount,
							RepostCount: RepostCount,
							LikesCount: LikesCount
						}
					})
					
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
					
					return URLOfSource.replace(/^http/, "ttp")
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
					return Links.href.replace(/^http/, "ttp")
				});
			}
			return Output
		}
})();