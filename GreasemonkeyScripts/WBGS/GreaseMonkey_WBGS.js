// ==UserScript==
// @name         WBGS - utility
// @namespace    WBGS_autocheck
// @version      0.1
// @description  Utility for WBGS.
// @include      https://archive.org/services/wayback-gsheets/*
// @grant        GM.setClipboard
// ==/UserScript==

(function() {
	//Settings
		const IntervalDelay = 100
			//^How many milliseconds between each "scan" of the WBGS page.
			// Had to be an interval instead of a timeout because when you click on links to another WBGS page, that isn't a page refresh
			// rather a dynamic page (https://en.wikipedia.org/wiki/Dynamic_web_page ) similar to being on twitter and clicking on links
			// to another twitter page, which result in this JS code not executing until you refresh the page.
		const MaxClickAllAborts = 1
			//^Option to auto-click each "abort" button on processes that finished-locked - processes that have finished but didn't
			// disappear on the WBGS home page. 0 = no, 1 = yes, 2+ = number of times to click each abort button (if it doesn't
			// respond).
		const DisplayEasyCopyableListOfProcess = true
			//^false = no, true = yes (will print out a statement once per page refresh on the console log that you can copy in case of a
			// bug of some sort on processes)
		const Setting_http_ttp = false
			//^true = All URLs in the output start with "ttp" instead of "http" (to avoid URL truncation like what firefox does; replacing the middle of string with ellipsis).
			// false = leave it as http
	//Don't touch unless you know what you're doing
		setInterval(Code, IntervalDelay)
		setTimeout(Spawn_UI_Panel, 500)
		
		
		let RaceConditionLock = false
		let ClickAllAbortsCount = 0
		let HavePrintedListOfProcess = false
		
		let JSONTextarea = {}
		
		let CurrentWBGSURL = ""
		
		async function Spawn_UI_Panel() {
			//Element of the main UI
				let DivBox = document.createElement("div")
				DivBox.setAttribute("style", "position: fixed;bottom: 40px;right: 40px;z-index: 999; background-color: rgba(64, 64, 64, .5); color: #ffffff; border-radius: 30px; padding: 15px;")
			//Title
				let Title = document.createElement("h2")
				Title.setAttribute("style", "text-align: center;")
				Title.appendChild(document.createTextNode("WBGS process info"))
				DivBox.appendChild(Title)
			//JSON textarea
				JSONTextarea = document.createElement("textarea")
				JSONTextarea.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #000000; color : #ffffff; font-family: monospace; resize: both;")
				JSONTextarea.setAttribute("cols", "50")
				JSONTextarea.setAttribute("rows", "10")
				JSONTextarea.setAttribute("readonly", "")
				DivBox.appendChild(JSONTextarea)
			//line break
				DivBox.appendChild(document.createElement("br"))
			//Copy button
				let CopyJSONButton = document.createElement("button")
				CopyJSONButton.appendChild(document.createTextNode("Copy data"))
				CopyJSONButton.addEventListener(
				"click",
					function () {
						GM.setClipboard(JSONTextarea.textContent)
					}
				
				)
				DivBox.appendChild(CopyJSONButton)
			//Refresh button (updates the textarea)
				let RefreshTextareaButton = document.createElement("button")
				RefreshTextareaButton.appendChild(document.createTextNode("Refresh"))
				RefreshTextareaButton.addEventListener(
				"click",
					function () {
						JSONTextarea.textContent = ""
						HavePrintedListOfProcess = false
						Code()
					}
				
				)
				DivBox.appendChild(RefreshTextareaButton)
			//Add to document
				let HTMLBody = Array.from(document.getElementsByTagName("BODY")).find((Element) => {return true})
				let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
				if (InnerNodeOfHTMLBody.IsSuccessful) {
					document.body.insertBefore(DivBox, HTMLBody.childNodes[0]);
				}
		}
		
		function Code() {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				if (CurrentWBGSURL != window.location.href) {
					HavePrintedListOfProcess = false //if the user moves to a different URL, we need to update the textarea
				}
				CurrentWBGSURL = window.location.href
				if (CurrentWBGSURL == "https://archive.org/services/wayback-gsheets/check?method=archive") {
					let Element_SaveInNewSheetOption = Array.from(document.querySelectorAll('input[type=checkbox]')).find((CheckBox) => {
						return CheckBox.parentElement.innerText == "Save results in a new Sheet."
					});
					if (typeof Element_SaveInNewSheetOption != "undefined") {
						if (!Element_SaveInNewSheetOption.checked) {
							Element_SaveInNewSheetOption.click()
						}
					}
					//^Had to use .click() instead of just directly setting the checked state to true bc if user interacts with other inputs, it will uncheck it.
					// Probably because of this: https://stackoverflow.com/questions/30488218/checkbox-onchange-event-not-firing that JS setting checked to true
					// does not fire the onchange event because it is changing the attribute.
				}
				let ProcessTrackingURLString = ""
				if (document.querySelectorAll("small")[1] !== undefined) {
					if (/^Tracking URL/.test(document.querySelectorAll("small")[1].innerText)) {
						if (!HavePrintedListOfProcess) {
							ProcessTrackingURLString = document.querySelectorAll("small")[1].innerText.match(/https:\/\/archive\.org\/services\/wayback-gsheets\/check[^\s]+$/)[0]
							//console.log("Tracking URL: " + ProcessTrackingURLString.replace(/^https/, "ttps")) //URLs in the console log gets truncated and the text may not be preserved depending on browser.
							let OBJ_WBGS_TrackingURL = {
								TrackingURL: HttpToTtp(ProcessTrackingURLString), //URLs in the console log gets truncated and the text may not be preserved depending on browser.
								GoogleSheetURL: HttpToTtp(ProcessTrackingURLString.replace(/^.+?\&google_sheet_url=/g, "").replaceAll("%3A", ":").replaceAll("%2F", "/").replaceAll("%23", "#").replaceAll("%3D", "=")),
								JobID: ProcessTrackingURLString.match(/(?<=https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=)[a-zA-Z\d\-]+/)[0],
								TimestampOfInitalProcess: ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(Date.now()).toISOString())
							}
							
							JSONTextarea.textContent = JSON.stringify(OBJ_WBGS_TrackingURL, "", " ")
							HavePrintedListOfProcess = true
						}
					}
				}
				if (/https:\/\/archive\.org\/services\/wayback-gsheets\/options.*/.test(CurrentWBGSURL)) { //While on WBGS home page
					let TableListingProcess = document.getElementsByClassName("table table-bordered table-sm") //Get entire table of running processes
					if (TableListingProcess.length != 0) {
						let ListOfProcesses = TableListingProcess[0]
						let ListOfProcessesItems = Array.from(ListOfProcesses.getElementsByTagName("tr")).filter((WBGSProcess) => { //Get the running processes
							let ColCountCorrect = WBGSProcess.childNodes.length == 6 //Get only items that have 6 columns (exclude row with "There are no running processes.")
							let IsRowAProcess = /https:\/\/docs\.google\.com\/spreadsheets\//.test(WBGSProcess.childNodes[0].innerText) //Exclude the table headers row
							return (ColCountCorrect && IsRowAProcess)
						})
						if (DisplayEasyCopyableListOfProcess && (!HavePrintedListOfProcess) && ListOfProcessesItems.length != 0) {
							let OBJ_WBGS_Info = ListOfProcessesItems.map((WBGSProcess) => {
								let TrackingURL = WBGSProcess.childNodes[5].childNodes[0].href
								return {
									TrackingURL: HttpToTtp(TrackingURL),
									JobID: TrackingURL.match(/(?<=https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=)[a-zA-Z\d\-]+/)[0],
									GSheetURL: HttpToTtp(WBGSProcess.childNodes[0].innerText),
									StartedTime: WBGSProcess.childNodes[1].innerText,
									Status: WBGSProcess.childNodes[4].innerText
								}
							})
							JSONTextarea.textContent = "WBGS homepage info obtained on " + ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(Date.now()).toISOString()) + " \n" + JSON.stringify(OBJ_WBGS_Info, "", " ")
							HavePrintedListOfProcess = true
						}
						
						let ListOfFinishLockedProcesses = ListOfProcessesItems.filter((WBGSProcess) => {
							return WBGSProcess.childNodes[4].innerText == "SUCCESS" //Find only processes that are labeled "SUCCESS"
						})
						if ((ClickAllAbortsCount < MaxClickAllAborts)&&(ListOfFinishLockedProcesses.length != 0)) {
							ListOfFinishLockedProcesses.forEach((WBGSProcess) => {
								let AbortButton = WBGSProcess.childNodes[5].childNodes[1]
								AbortButton.click()
							})
							ClickAllAbortsCount++
						}
					}
				}
				RaceConditionLock = false
			}
		}
		function ISOString_to_YYYY_MM_DD_HH_MM_SS(ISOString) {
			//YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ
			return ISOString.replace("T", " ").replace(/\.\d{3}Z$/, "") + " UTC"
		}
		function HttpToTtp(URLString) {
			if (Setting_http_ttp) {
				return URLString.replace(/^http/, "ttp")
			}
			return URLString
		}
		
		
	//Reused functions
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
})();