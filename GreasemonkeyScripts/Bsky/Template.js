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
						
//						let i = 0
//						for (i=0; i<5;i++) {
//							if (typeof CurrentParentNode.parentNode != "undefined") {
//								CurrentParentNode = CurrentParentNode.parentNode
//							} else {
//								break
//							}
//						}
						let OuterNodesOfPost = AscendNode(ImgSrc, 5)

						let FollowUserButton = Array.from(OuterNodesOfPost.OutputNode.getElementsByTagName("button")).find((ArrayElement) => {
							return /^Follow/.test(ArrayElement.innerText)
						});
						if (typeof FollowUserButton != "undefined" && OuterNodesOfPost.LevelsPassed == 5) {
							FollowUserButtonExist = true
						}
						
						return IsUserAvatar && (!FollowUserButtonExist)
					})
					ListOfPosts = ListOfPosts.map((ArrayElement) => { //Get entire post
						//return ArrayElement.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
						return AscendNode(ArrayElement, 6).OutputNode
					})
					ListOfPosts = ListOfPosts.map((ArrayElement) => {
						let RepostedByUserTitle = ""
						let CurrentPostURL = "" //URL of post (if viewing its URL directly, then it is the browser's [window.location.href])
						let ReplyToURL = "" //Reply to post above
						let RepliesURL = "" //Replies of the current post
						let UserTitle = ""
						let Username = ""
						let PostTimeStamp = ""
						let PostText = ""
						let LinksToAnotherPage = []
						let MediaList = []
						
						if (ArrayElement.childNodes[0].innerText == "") { //Gap above top post
							UserTitle = DescendNode(ArrayElement, [1, 1, 0, 0, 0, 0]).OutputNode.textContent
							Username = DescendNode(ArrayElement, [1, 1, 0, 0, 0, 2]).OutputNode.innerText
							PostTimeStamp = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode.dataset.tooltip
							PostText = DescendNode(ArrayElement, [1, 1, 1]).OutputNode.innerText
							MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 1]).OutputNode)
							
						} else { //Reposts
							RepostedByUserTitle = DescendNode(ArrayElement, [0, 1, 0, 1, 1]).OutputNode.textContent
							UserTitle = DescendNode(ArrayElement, [1, 1, 0, 0 ,0 ,0]).OutputNode.textContent
							Username = DescendNode(ArrayElement, [1, 1, 0, 0, 0, 2]).OutputNode.innerText
							PostTimeStamp = DescendNode(ArrayElement, [1, 1, 0, 2]).OutputNode.dataset.tooltip
							PostText = DescendNode(ArrayElement, [1, 1, 1, 0]).OutputNode.innerText
							MediaList = GetMediaURLs(DescendNode(ArrayElement, [1, 1, 1]).OutputNode)
						}
						return {
							RepostedByUserTitle: RepostedByUserTitle,
							CurrentPostURL: CurrentPostURL,
							ReplyToURL: ReplyToURL,
							RepliesURL: RepliesURL,
							UserTitle: UserTitle,
							Username: Username,
							PostTimeStamp: PostTimeStamp,
							PostText: PostText,
							LinksToAnotherPage: LinksToAnotherPage,
							MediaList: MediaList
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
			let i = 0
			for (i = 0; i < LevelsDown; i++) {
				if (typeof CurrentNode.childNodes != "undefined") {
					if (typeof CurrentNode.childNodes[LevelsArray[i]] != "undefined") {
						CurrentNode = CurrentNode.childNodes[LevelsArray[i]]
					}
				} else {
					break
				}
			}
			return {
				OutputNode: CurrentNode,
				LevelsPassed: i
			}
		}
		function GetMediaURLs(Node) {
			//Returns an array listing URLs of media
			let Output = Array.from(Node.getElementsByTagName("img")).map((HTMLTag) => {
				let URLOfSource = ""
				if (HTMLTag.tagName == "IMG") {
					URLOfSource = HTMLTag.src
				}
				
				return URLOfSource
			});
			//May need to filter to remove unwanted tags once we use the "*" for getting other media besides images
			return Output
		}
})();