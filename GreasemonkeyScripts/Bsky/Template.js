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
						
						let i = 0
						for (i=0; i<5;i++) {
							if (typeof CurrentParentNode.parentNode != "undefined") {
								CurrentParentNode = CurrentParentNode.parentNode
							} else {
								break
							}
						}
						let FollowUserButton = Array.from(CurrentParentNode.getElementsByTagName("button")).find((ArrayElement) => {
							return ArrayElement.innerText == "Follow"
						});
						if (typeof FollowUserButton != "undefined" && i == 5) {
							FollowUserButtonExist = true
						}
						
						return IsUserAvatar && (!FollowUserButtonExist)
					})
					ListOfPosts = ListOfPosts.map((ArrayElement) => { //Get entire post
						return ArrayElement.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
					})
					let a = 0
					ListOfPosts = ListOfPosts.map((ArrayElement) => {
						let UserTitle = ""
						let Username = ""
						let PostTimeStamp = ""
						let PostText = ""
						let MediaList = []
						
						if (ArrayElement.childNodes[0].innerText == "") { //Gap above top post
							UserTitle = ArrayElement.childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent
							Username = ArrayElement.childNodes[1].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText
							PostTimeStamp = ArrayElement.childNodes[1].childNodes[1].childNodes[0].childNodes[2].dataset.tooltip
							PostText = ArrayElement.childNodes[1].childNodes[1].childNodes[1].innerText
							MediaList = Array.from(ArrayElement.childNodes[1].childNodes[1].getElementsByTagName("img")).map((Images) => {
								return Images.src
							})
						} else {
							
							let a = 0
						}
						return {
							UserTitle: UserTitle,
							Username: Username,
							PostTimeStamp: PostTimeStamp,
							PostText: PostText,
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
})();