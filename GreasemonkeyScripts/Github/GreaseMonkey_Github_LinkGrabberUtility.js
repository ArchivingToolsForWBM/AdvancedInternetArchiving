// ==UserScript==
// @name         Github link revealer
// @namespace    any site
// @version      0.2
// @description  Gets number of pagination of repositories, auto-opens parts of the html to view download links in releases.
// @include      https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
	//Settings
		const Github_UsernamePart = "(?:(?!(?:about|codespaces|collections|contact|customer\\-stories|enterprise|features|git\\-guides|images|login|mobile|organizations|orgs|premium-support|pricing|readme|search|security|signup|sitemap|solutions|sponsors|team|topics|trending|users))[A-Za-z0-9\\-]+)"
		const Github_Number_of_Repository_per_page = 30
			//^Number of repositories per page when viewing the list of repositories. Use to determine what page number is the last page.
		const Github_Number_of_Releases_per_page = 10
			//^Same as above but for releases (seen in the front page of the repository)
		const Github_IntervalScan = 100
			//^Number of milliseconds between each execution this script runs. Because github doesn't refresh the page and it is a dynamic web page (much like twitter) when clicking on links,
			// This code NEEDs to run periodically to catch any changes the page when you click on links.
	//Stuff you don't touch unless you know what you're doing.
		let RaceConditionLock = false
			//^This prevents concurrent runs of the code as a failsafe.
	
	const SetOfURLs = new Set()
	window.onload = setInterval(MainCode, Github_IntervalScan)
	
	function MainCode() {
		if (!RaceConditionLock) {
			RaceConditionLock = true
			let Github_Current_URL = window.location.href
			let Github_Current_URL_Username = ""
			if (RegExp("(?<=https:\\/\\/github\\.com\\/)" + Github_UsernamePart).test(Github_Current_URL)) {
				Github_Current_URL_Username = Github_Current_URL.match(RegExp("(?<=(?:https:\\/\\/github\\.com\\/))" + Github_UsernamePart))[0] //e.g. https://github.com/ArchLeaders
			}
			let Github_Current_URL_RepositoryName = ""
			if (RegExp("(?<=https:\\/\\/github\\.com\\/)" + Github_UsernamePart + "\\/[A-Za-z0-9_.\-]+").test(Github_Current_URL)) {
				Github_Current_URL_RepositoryName = Github_Current_URL.match(RegExp("(?<=(?:https:\\/\\/github\\.com\\/" + Github_UsernamePart + "\\/))[A-Za-z0-9_.\-]+"))[0]
			}
			{
				//Get number of paginated pages for repositories e.g. https://github.com/ArchLeaders?page=1&tab=repositories
				if (RegExp("(?<=(https:\\/\\/github\\.com\\/))" + Github_UsernamePart).test(Github_Current_URL)) {
					let Github_NumberOfRepositories = -1
					let LookingForRepositoryCount = Array.from(document.getElementsByTagName("a"))
					let RepositoryCountString = LookingForRepositoryCount.find((ArrayElement) => {
						return /Repositories\n\d+/.test(ArrayElement.innerText)
					});
					if (typeof RepositoryCountString != "undefined") {
						Github_NumberOfRepositories = parseInt((RepositoryCountString.innerText).match("(?<=(Repositories\n))\\d+")[0])
						if (Github_NumberOfRepositories != -1) {
							ConsoleLoggingURL("https://github.com/" + Github_Current_URL_Username + "?page=" + (Math.ceil(Github_NumberOfRepositories/Github_Number_of_Repository_per_page)).toString(10) + "&tab=repositories")
						}
					}
				}
			}
			{
				//Get number of paginated pages for releases e.g. https://github.com/adam-p/markdown-here
				if (RegExp("(?<=(https:\\/\\/github\\.com\\/))" + Github_UsernamePart + "\\/[A-Za-z0-9_.\-]+$").test(Github_Current_URL)) {
					let Github_NumberOfReleases = -1
					let LookingForReleasesCount = Array.from(document.getElementsByTagName("a"))
					let ReleaseCountString = LookingForReleasesCount.find((ArrayElement) => {
						//Make sure it is an href link and in a way that it is by github rather than finding an a href by the user.
						return RegExp("https:\\/\\/github\\.com\\/" + Github_UsernamePart + "\\/[A-Za-z0-9_.\-]+\\/releases").test(ArrayElement.href) && /Releases \d+/.test(ArrayElement.innerText)
					});
					
					if (typeof ReleaseCountString != "undefined") {
						Github_NumberOfReleases = parseInt(ReleaseCountString.innerText.match(/\d+$/)[0])
						if (Github_NumberOfReleases != -1) {
							//https://github.com/adam-p/markdown-here/releases?page=2
							ConsoleLoggingURL("https://github.com/" + Github_Current_URL_Username + "/" + Github_Current_URL_RepositoryName + "/releases?page=" + Math.ceil(Github_NumberOfReleases/Github_Number_of_Releases_per_page).toString(10))
						}
					}
					
				}
			}
			{
				//Auto-opens a show/hide that involves requesting data to server (e.g on https://github.com/adam-p/markdown-here/releases?page=2 the assets are hidden completely on the HTML until it is clicked
				//and it happens to be <details data-view-component="true" open=""></details>). Make sure you have another userscript that extract URLs from general sites (strongly recommend it uses setinterval
				//in the case it first runs its code, before this userscript you are reading right now executes, causing it to miss).
				//
				//Note that they also must be scrolled on-screen and fully load to appear in the html.
				if (RegExp("https:\\/\\/github\\.com\\/" + Github_UsernamePart + "\\/[A-Za-z0-9_.\-]+/releases").test(Github_Current_URL) && document.getElementsByTagName("details").length != 0) {
					let DetailsToReveal = Array.from(document.getElementsByTagName("details"))
					DetailsToReveal.forEach((HTMLToReveal) => {
						if (/Assets? \d+/.test(HTMLToReveal.innerText)) {
							HTMLToReveal.setAttribute("open", "")
						}
					});
				}
			}
			RaceConditionLock = false
		}
	}
	
	function ConsoleLoggingURL(URL_String) {
		let URL_truncateProof = URL_String.replace(/^http/, "ttp")
		if (!SetOfURLs.has(URL_truncateProof)) {
			console.log(URL_truncateProof)
			SetOfURLs.add(URL_truncateProof)
		}
	}
})();