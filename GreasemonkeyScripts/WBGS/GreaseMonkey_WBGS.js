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
		const Setting_AlternativeProcessActivityLog = true
			//Display alternative process activity log. This is if you want to see the time in UTC conveniently.
			//Note that this is not in sync since despite WBGS updates the display every 10 seconds, that timer starts the moment you start a process, while this script
			//starts when the page first loads (any subsequent loads besides a refresh does not count).
	//Don't touch unless you know what you're doing
		setInterval(Code, IntervalDelay)
		if (Setting_AlternativeProcessActivityLog) {
			setTimeout(AlternativeProcessActivityLoggerStart, 1000)
			
			function AlternativeProcessActivityLoggerStart() {
				setInterval(AlternativeProcessActivityLogger, 10000)
			}
			
		}
		setTimeout(Spawn_UI_Panel, 500)
		
		
		let RaceConditionLock = false
		let ClickAllAbortsCount = 0
		let HavePrintedListOfProcess = false
			//^This is a flag to make it only update the text only once (not periodically), until the user refreshes or navigates to another page.
		
		let JSONTextarea = {}
		let TrackingTextarea = {}
		let ProcessTrackingLog = []
		
		let CurrentWBGSURL = ""
		
		async function Spawn_UI_Panel() {
			//Element of the main UI
				let DivBox = document.createElement("div")
				DivBox.style.position = "fixed"
				DivBox.style.bottom = "40px"
				DivBox.style.right = "40px"
				DivBox.style.zIndex = "999"
				DivBox.style.backgroundColor = "rgba(64, 64, 64, .5)"
				DivBox.style.color = "#ffffff"
				DivBox.style.borderRadius = "30px"
				DivBox.style.padding = "15px"
			//Title
				let Title = document.createElement("h2")
				//Title.setAttribute("style", "text-align: center;")
				Title.style.textAlign = "center"
				Title.appendChild(document.createTextNode("WBGS process info"))
				DivBox.appendChild(Title)
			//JSON textarea
				JSONTextarea = document.createElement("textarea")
				JSONTextarea.style.whiteSpace = "pre"
				JSONTextarea.style.overflowWrap = "normal"
				JSONTextarea.style.overflowX = "scroll"
				JSONTextarea.style.backgroundColor = "#000000"
				JSONTextarea.style.color = "#ffffff"
				JSONTextarea.style.fontFamily = "monospace"
				JSONTextarea.style.resize = "both"
				
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
			//line seperator
				DivBox.appendChild(document.createElement("hr"))
			//Tracking textarea
				if (Setting_AlternativeProcessActivityLog) {
					DivBox.appendChild(document.createElement("br"))
					
					TrackingTextarea = document.createElement("textarea")
					TrackingTextarea.style.whiteSpace = "pre"
					TrackingTextarea.style.overflowWrap = "normal"
					TrackingTextarea.style.overflowX = "scroll"
					TrackingTextarea.style.backgroundColor = "#000000"
					TrackingTextarea.style.color = "#ffffff"
					TrackingTextarea.style.fontFamily = "monospace"
					TrackingTextarea.style.resize = "both"
					
					TrackingTextarea.setAttribute("cols", "50")
					TrackingTextarea.setAttribute("rows", "10")
					TrackingTextarea.setAttribute("readonly", "")
					
					DivBox.appendChild(TrackingTextarea)
					//Copy log button
						DivBox.appendChild(document.createElement("br"))
						let CopyAlternativeProcessActivityLogButton = document.createElement("button")
						CopyAlternativeProcessActivityLogButton.appendChild(document.createTextNode("Copy log"))
						CopyAlternativeProcessActivityLogButton.addEventListener(
						"click",
							function () {
								GM.setClipboard(TrackingTextarea.textContent)
							}
						)
						DivBox.appendChild(CopyAlternativeProcessActivityLogButton)
					//Clear button
						let ClearAlternativeProcessActivityLogButton = document.createElement("button")
						ClearAlternativeProcessActivityLogButton.appendChild(document.createTextNode("Clear log"))
						ClearAlternativeProcessActivityLogButton.addEventListener(
						"click",
							function () {
								TrackingTextarea.textContent = ""
								ProcessTrackingLog = []
							}
						)
						DivBox.appendChild(ClearAlternativeProcessActivityLogButton)
				}
				
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
				let CurrentTimeMS = Date.now()
				
				//Check the "save results in a new sheets" option
					if (CurrentWBGSURL == "https://archive.org/services/wayback-gsheets/check?method=archive") {
						let Element_SaveInNewSheetOption = Array.from(document.querySelectorAll('input[type=checkbox]')).find((CheckBox) => {
							return CheckBox.parentElement.textContent == "Save results in a new Sheet."
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
				//On any given start process page, get the process tracking URL and extract various info from it, and write it to the textarea
					let ProcessTrackingURLString = ""
					let TrackingURL = Array.from(document.querySelectorAll("small")).find((HTMLElement) => {
						return /Tracking URL: https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=/.test(HTMLElement.textContent)
					})
					if (typeof TrackingURL !== "undefined") {
						if (!HavePrintedListOfProcess) {
							ProcessTrackingURLString = TrackingURL.textContent.match(/https:\/\/archive\.org\/services\/wayback-gsheets\/check[^\s]+$/)[0]
							//console.log("Tracking URL: " + ProcessTrackingURLString.replace(/^https/, "ttps")) //URLs in the console log gets truncated and the text may not be preserved depending on browser.
							let ProcessType = ((URL) => {
								let TypeInURL = ""
								try {
									TypeInURL = URL.match(/(?<=check\?method=).*$/)[0]
								} catch {
									TypeInURL = ""
								}
								let ListOfProcessTypes = { //Object literal technique -> mapping strings to another string, credit - FlutterMapp on youtube.
									"archive": "Archive URLs",
									"availability": "Check if URLs are archived in the Wayback Machine",
									"live": "Check if URLs are available in the Live Web"
								}
								return ListOfProcessTypes[TypeInURL] ?? "Unknown"
							})(window.location.href);
							
							let OBJ_WBGS_TrackingURL = {
								TrackingURL: HttpToTtp(ProcessTrackingURLString), //URLs in the console log gets truncated and the text may not be preserved depending on browser.
								GoogleSheetURL: HttpToTtp(ProcessTrackingURLString.replace(/^.+?\&google_sheet_url=/g, "").replaceAll("%3A", ":").replaceAll("%2F", "/").replaceAll("%23", "#").replaceAll("%3D", "=")),
								JobID: ProcessTrackingURLString.match(/(?<=https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=)[a-zA-Z\d\-]+/)[0],
								TimestampOfInitalProcess: ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(CurrentTimeMS).toISOString()),
								ProcessType: ProcessType
							}
							
							JSONTextarea.textContent = JSON.stringify(OBJ_WBGS_TrackingURL, "", " ")
							HavePrintedListOfProcess = true
						}
					}
				//Extract info from the WBGS home page
					if (/https:\/\/archive\.org\/services\/wayback-gsheets\/options.*/.test(CurrentWBGSURL)) {
						let JsonExtractedInfo = {
							CurrentDateTime: ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(CurrentTimeMS).toISOString()),
							ListOfProcesses: [],
							SystemQueueMessage: ""
						}
						let TableListingProcess = document.querySelector("table") //Get entire table of running processes
						if (TableListingProcess != null) {
							let ListOfProcesses = Array.from(TableListingProcess.querySelectorAll("tr"))
							let ListOfProcessesItems = ListOfProcesses.filter((WBGSProcess) => { //Get the running processes
								let ColCountCorrect = WBGSProcess.childNodes.length == 6 //Get only items that have 6 columns (exclude row with "There are no running processes.")
								let IsRowAProcess = /https:\/\/docs\.google\.com\/spreadsheets\//.test(WBGSProcess.childNodes[0].textContent) //Exclude the table headers row
								return (ColCountCorrect && IsRowAProcess)
							})
							if (DisplayEasyCopyableListOfProcess && (!HavePrintedListOfProcess) && ListOfProcessesItems.length != 0) {
								//Convert into json info containing process info
									let OBJ_WBGS_ListOfProcesses = ListOfProcessesItems.map((WBGSProcess) => {
										let TrackingURL = WBGSProcess.childNodes[5].childNodes[0].href
										let HowLongAgo = DisplayTimeDuration(CurrentTimeMS - new Date(WBGSProcess.childNodes[1].textContent + " UTC").valueOf()) + " ago"
										return {
											TrackingURL: HttpToTtp(TrackingURL),
											JobID: TrackingURL.match(/(?<=https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=)[a-zA-Z\d\-]+/)[0],
											GSheetURL: HttpToTtp(WBGSProcess.childNodes[0].textContent),
											StartedTime: WBGSProcess.childNodes[1].textContent + " (" + HowLongAgo + ")",
											Status: WBGSProcess.childNodes[4].textContent
										}
									})
									JsonExtractedInfo.ListOfProcesses = OBJ_WBGS_ListOfProcesses
								//Get queue quantity
									let DivMsgQueueWarning = Array.from(document.querySelectorAll("div"))
									DivMsgQueueWarning = DivMsgQueueWarning.find((Element) => {
										return /^There are \d+ processes waiting in the system queue!/.test(Element.textContent)
									})
									if (typeof DivMsgQueueWarning != "undefined") {
										JsonExtractedInfo.SystemQueueMessage = DivMsgQueueWarning.textContent
									}
								
								//Output the json
									JSONTextarea.textContent = JSON.stringify(JsonExtractedInfo, "", " ")
									HavePrintedListOfProcess = true
							}
							
							let ListOfFinishLockedProcesses = ListOfProcessesItems.filter((WBGSProcess) => {
								return WBGSProcess.childNodes[4].textContent == "SUCCESS" //Find only processes that are labeled "SUCCESS"
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
		function AlternativeProcessActivityLogger() {
			let CurrentTimeMS = Date.now()
			let WBGSProgressLog = document.querySelector("textarea.progress-log")
			if (WBGSProgressLog != null) {
				let CurrentUTC = ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(CurrentTimeMS).toISOString())
				let RecentLine = WBGSProgressLog.value.match(/^(.*)$/m)
				if (RecentLine != null) {
					RecentLine = RecentLine[0]
				}
				if (RecentLine != "") {
					RecentLine = RecentLine.replace(/ \d{1,2}:\d{2}:\d{2} (?:A|P)M$/, "")
				}
				// RecentLine should now contain only the status and not the local time.
					if (RecentLine != "") {
						let LastLogged = ProcessTrackingLog.at(-1)
						let ProcessLogObject = null
						if (typeof LastLogged != "undefined") { //If there is a last item in the array (not when the array is empty)
							if (LastLogged.Text == RecentLine) { //If the text is the same as the one before, merge with the last object
								LastLogged.End = CurrentUTC
								let DurationMS = new Date(LastLogged.End).getTime() - new Date(LastLogged.Start).getTime()
								let DurationString = "Just started"
								if (DurationMS >= 10000) {
									DurationString = DisplayTimeDuration(DurationMS)
								}
								LastLogged.Duration = DurationString
							} else { //Otherwise create a separate object
								ProcessLogObject = {
									Start: CurrentUTC,
									End: CurrentUTC,
									Duration: "Just started",
									Text: RecentLine
								}
								
							}
						} else { //If array is empty, this is the first item
							ProcessLogObject = {
								Start: CurrentUTC,
								End: CurrentUTC,
								Duration: "Just started",
								Text: RecentLine
							}
						}
						if (ProcessLogObject != null) {
							if (/queued/.test(ProcessLogObject.Text)) {
								ProcessLogObject.Color = "#FFFF00"
							} else if (/^Processed \d+/.test(ProcessLogObject.Text)) {
								ProcessLogObject.Color = "#0000FF"
							} else if (/^Finished processing/.test(ProcessLogObject.Text)) {
								ProcessLogObject.Color = "#00FF00"
							}
							
							ProcessTrackingLog.push(ProcessLogObject)
						}
						TrackingTextarea.textContent = JSON.stringify(ProcessTrackingLog, "", " ")
					}

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
		function CreateProcessLog() {
			
			
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
		function DisplayTimeDuration(Duration) {
			let OutputString = ""
			
			Duration = Math.abs(Duration)
			
			let UnitsOfTimeArray = []
			let Seconds = Math.floor(Duration/1000)
			UnitsOfTimeArray.unshift({Unit: Seconds % 60, UnitName: "s"})
			
			let Minute = Math.floor(Seconds/60)
			UnitsOfTimeArray.unshift({Unit: Minute % 60, UnitName: "m"})
			
			let Hour = Math.floor(Minute/60)
			UnitsOfTimeArray.unshift({Unit: Hour % 24, UnitName: "h"})
			
			let Day = Math.floor(Hour/24)
			UnitsOfTimeArray.unshift({Unit: Day, UnitName: "d"})
			
			let LeadingUnitIsNonZero = false
			for (let i = 0; i < UnitsOfTimeArray.length; i++) {
				if (UnitsOfTimeArray[i].Unit != 0) {
					LeadingUnitIsNonZero = true //Once it's true, stays true. All remaining units are significant
				}
				if (LeadingUnitIsNonZero) {
					OutputString += UnitsOfTimeArray[i].Unit + UnitsOfTimeArray[i].UnitName
					if (i != UnitsOfTimeArray.length-1) {
						OutputString += " "
					}
				}
			}
			return OutputString
		}
})();