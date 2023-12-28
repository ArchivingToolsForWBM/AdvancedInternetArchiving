// ==UserScript==
// @name         Github link revealer
// @namespace    any site
// @version      0.2
// @description  Gets number of pagination of repositories, auto-opens parts of the html to view download links in releases.
// @include      https://github.com/*
// @grant        none
// ==/UserScript==

//This userscript does various things, mostly to reveal so-called "hidden" links like loading parts of the page to reveal a URL, as well
//as generating links. Use this along with another provided userscript to extract links.

(function() {
	//Settings
		const Github_UsernamePart = "(?:(?!(?:about|codespaces|collections|contact|customer\\-stories|enterprise|features|git\\-guides|images|login|mobile|organizations|orgs|premium-support|pricing|readme|search|security|signup|sitemap|solutions|sponsors|team|topics|trending|users))[A-Za-z0-9\\-]+)"
		//Quantities to determine how many paginated list pages to have all of them. For example: if there are a total of 123 items
		//and is divided into 30 items per page, that would be 5 pages - first 4 pages having 30 items, with the last one having 3.
		//Effectively, this is used to generate the last page via GeneralURLProcessor.html's pagination feature to get all pages.
		//
		//It is calculated [NumberOfPages = ceiling(TotalNumberOfItems/MaxItemsPerPage)]
		
		//These are the numbers at max of how many items per page.
			const Github_Number_of_Repository_per_page = 30 //When viewing the user profile page, it grabs the number from the repository tab.
			const Github_Number_of_Releases_per_page = 10 //When viewing a repository, it grabs the number of releases (not the tags)
			const Github_Number_of_Issues_per_page = 25 //When viewing the number of opened issues of a repository
		
		const Github_IntervalScan = 100
			//^Number of milliseconds between each execution this script runs. Because github doesn't refresh the page and it is a dynamic web page (much like twitter) when clicking on links,
			// This code NEEDs to run periodically to catch any changes the page when you click on links.
			// Make sure this number is less than the interval of the other script that would auto-click links to another page so that this script doesn't miss anything.
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
			} else if (RegExp("(?<=https:\\/\\/github\\.com\\/orgs\\/)" + Github_UsernamePart).test(Github_Current_URL)) {
				Github_Current_URL_Username = Github_Current_URL.match(RegExp("(?<=(?:https:\\/\\/github\\.com\\/orgs\\/))" + Github_UsernamePart))[0] //e.g. https://github.com/orgs/Psiphon-Inc/repositories?page=2
			}
			let Github_Current_URL_RepositoryName = ""
			if (RegExp("(?<=https:\\/\\/github\\.com\\/)" + Github_UsernamePart + "\\/[A-Za-z0-9_.\-]+").test(Github_Current_URL)) {
				Github_Current_URL_RepositoryName = Github_Current_URL.match(RegExp("(?<=(?:https:\\/\\/github\\.com\\/" + Github_UsernamePart + "\\/))[A-Za-z0-9_.\-]+"))[0]
			}
			{ //User home page
				//Get number of paginated pages for repositories e.g. https://github.com/ArchLeaders?page=1&tab=repositories
				//also another format: https://github.com/orgs/Psiphon-Inc/repositories?page=2
				if (RegExp("(?<=(https:\\/\\/github\\.com\\/(orgs\\/)?))" + Github_UsernamePart).test(Github_Current_URL)) {
					let Github_NumberOfRepositories = -1
					let Github_NumberOfPagesOfRepositories = -1
					let Github_UserIsOrganization = false
					
					let ElementOfRepositoryCount = Array.from(document.getElementsByTagName("a")).find((ArrayElement) => {
						return /Repositories\n\d+/.test(ArrayElement.innerText)
					});
					
					if (typeof ElementOfRepositoryCount != "undefined") {
						if (/Repositories\n\d+/.test(ElementOfRepositoryCount.innerText) && RegExp("https:\\/\\/github\\.com\\/(" + Github_UsernamePart + "\\?tab=repositories|orgs\\/" + Github_UsernamePart + "\\/repositories)").test(ElementOfRepositoryCount.href)) {
							Github_NumberOfRepositories = parseInt(ElementOfRepositoryCount.innerText.match(/(?<=(Repositories\n))\d+/)[0])
							Github_NumberOfPagesOfRepositories = Math.ceil(Github_NumberOfRepositories/Github_Number_of_Repository_per_page)
							
							Github_UserIsOrganization = (RegExp("https:\\/\\/github\\.com\\/orgs\\/").test(ElementOfRepositoryCount))
							
							if (!Github_UserIsOrganization) {
								ConsoleLoggingURL("https://github.com/" + Github_Current_URL_Username + "?page=" + (Github_NumberOfPagesOfRepositories).toString(10) + "&tab=repositories")
							} else {
								ConsoleLoggingURL("https://github.com/orgs/" + Github_Current_URL_Username + "/repositories?page=" + (Github_NumberOfPagesOfRepositories).toString(10))
							}
						}
					}
				}
			}
			{
				if (RegExp("(?<=(https:\\/\\/github\\.com\\/))" + Github_UsernamePart + "\\/[A-Za-z0-9_.\-]+$").test(Github_Current_URL)) { //Being on a repository
					{
						//Get number of paginated pages for releases e.g. https://github.com/adam-p/markdown-here
						let Github_NumberOfReleases = -1
						let Github_NumberOfReleasesPageCount = -1
						let LookingForReleasesCount = Array.from(document.getElementsByTagName("a"))
						let ReleaseCountString = LookingForReleasesCount.find((ArrayElement) => {
							//Make sure it is an href link and in a way that it is by github rather than finding an a href by the user.
							return RegExp("https:\\/\\/github\\.com\\/" + Github_UsernamePart + "\\/[A-Za-z0-9_.\-]+\\/releases").test(ArrayElement.href) && /Releases \d+/.test(ArrayElement.innerText)
						});
						
						if (typeof ReleaseCountString != "undefined") {
							Github_NumberOfReleases = parseInt(ReleaseCountString.innerText.match(/\d+$/)[0])
							Github_NumberOfReleasesPageCount = Math.ceil(Github_NumberOfReleases/Github_Number_of_Releases_per_page)
							
							if (Github_NumberOfReleasesPageCount > 0) {
								//https://github.com/adam-p/markdown-here/releases?page=2
								ConsoleLoggingURL("https://github.com/" + Github_Current_URL_Username + "/" + Github_Current_URL_RepositoryName + "/releases?page=" + (Github_NumberOfReleasesPageCount).toString(10))
							}
						}
					}
					{
						//Get number of paginated opened issues
						let Github_NumberOfOpenedIssues = -1
						let Github_NumberOfOpenedIssuesPageCount = -1
						if (document.getElementById("issues-tab") != null) {
							if ((/Issues\n\d+/).test(document.getElementById("issues-tab").innerText)) {
								Github_NumberOfOpenedIssues = parseInt(document.getElementById("issues-tab").innerText.match(/(?<=Issues\n)\d+$/))
								Github_NumberOfOpenedIssuesPageCount = Math.ceil(Github_NumberOfOpenedIssues/Github_Number_of_Issues_per_page)
								
								//https://github.com/UserName/RepositoryName/issues?page=2&q=is%3Aissue+is%3Aopen
								if (Github_NumberOfOpenedIssuesPageCount > 0) {
									ConsoleLoggingURL("https://github.com/" + Github_Current_URL_Username + "/" + Github_Current_URL_RepositoryName + "/issues?page=" + (Github_NumberOfOpenedIssuesPageCount).toString(10) + "&q=is%3Aissue+is%3Aopen")
								}
							}
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