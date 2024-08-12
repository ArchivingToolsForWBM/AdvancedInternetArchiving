// ==UserScript==
// @name         WBGS - utility
// @namespace    WBGS_autocheck
// @version      0.1
// @description  Utility for WBGS.
// @include      https://archive.org/services/wayback-gsheets/*
// @exclude      https://archive.org/services/wayback-gsheets/get_progress/*
// @grant        GM.setClipboard
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==

(async () => {
	//Settings
		const IntervalDelay = 100
			//^How many milliseconds between each "scan" of the WBGS page.
			// Had to be an interval instead of a timeout because when you click on links to another WBGS page, that isn't a page refresh
			// rather a dynamic page (https://en.wikipedia.org/wiki/Dynamic_web_page ) similar to being on twitter and clicking on links
			// to another twitter page, which result in this JS code not executing until you refresh the page.
		const DisplayEasyCopyableListOfProcess = true
			//^false = no, true = yes (will print out a statement once per page refresh on the textarea that you can copy in case of a
			// bug of some sort on processes)
		const Setting_http_ttp = false
			//^true = All URLs in the output start with "ttp" instead of "http" (to avoid URL truncation like what firefox does; replacing the middle of string with ellipsis).
			// false = leave it as http
		const Setting_AlternativeProcessActivityLog = true
			//Display alternative process activity log. This is if you want to see the time in UTC conveniently.
			//Note that this is not in sync since despite WBGS updates the display every 10 seconds, that timer starts the moment you start a process, while this script
			//starts when the page first loads (any subsequent loads besides a refresh does not count).
		const Setting_ProcessLogLimit = 10
			//^The maximum number of process logged into the list. Once reached, and a new item is added, the oldest in the array is removed.
			
		const Setting_ProcessActivityLogScanFrequency = 5000
			//^Number of milliseconds each time the alternative logger scans WBGS
	//Don't touch unless you know what you're doing
		setInterval(IntervalCode, IntervalDelay)
		if (Setting_AlternativeProcessActivityLog) {
			setTimeout(AlternativeProcessActivityLoggerStart, 1000)
			
			function AlternativeProcessActivityLoggerStart() {
				setInterval(AlternativeProcessActivityLogger, Setting_ProcessActivityLogScanFrequency)
			}
			
		}
		setTimeout(Spawn_UI_Panel, 500)
		
		
		let RaceConditionLock = false
		let HavePrintedListOfProcess = false
			//^This is a flag to make it only update the text only once (not periodically), until the user refreshes or navigates to another page.
		
		let JSONTextarea = null
		let JSONTextarea_Tracking = null
		let ProcessHistoryList = null
		let ProcessTrackingLog = []
		let Select_ProcessHistoryOrder = null
		let Button_AbortFinishLocked = null
		
		let CurrentWBGSURL = ""
		
		let ProcessHistory = []
		let WBGS_Utility_Settings = {
			ProcessActivityLogOrderByRecent: true,
			ProcessLogOrderByRecent: true,
			ProcessHistoryLogOrderSettings: [
				{
					value: "Old2New",
					visibleText: "Oldest to Newest",
					isSelected: false
				},
				{
					value: "New2Old",
					visibleText: "Newest to oldest",
					isSelected: true
				},
			]
		}
		
		let DivProgressBar = null
		
		
		try {
			ProcessHistory = JSON.parse(await GM.getValue("WBGS_ProcessHistory", "[]").catch(() => {
				console.log("WBGS utility: Loading log failed!")
			}))
			WBGS_Utility_Settings = JSON.parse(await GM.getValue("WBGS_UtilitySettings", JSON.stringify(WBGS_Utility_Settings)).catch(() => {
				console.log("WBGS utility: loading setting failed!")
			}))
		} catch {}
		
		async function SaveWBGSUtilitySettings() {
			try {
				await GM.setValue("WBGS_UtilitySettings", JSON.stringify(WBGS_Utility_Settings)).catch(() => {
					console.log("WBGS utility: saving setting failed!")
				})
			} catch {
				console.log("WBGS utility: saving setting failed!")
			}
		}
		
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
				DivBox.style.maxWidth = "500px"
				DivBox.style.maxHeight = "800px"
				DivBox.style.overflow = "auto"
			//InnerDiv
				let DivBox2 = document.createElement("div")
				//DivBox2.style.overflow = "auto"
			//Title
				let Title = document.createElement("h2")
				//Title.setAttribute("style", "text-align: center;")
				Title.style.textAlign = "center"
				Title.appendChild(document.createTextNode("WBGS process info"))
				DivBox2.appendChild(Title)
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
				DivBox2.appendChild(JSONTextarea)
			//line break
				DivBox2.appendChild(document.createElement("br"))
			//Copy button
				let CopyJSONButton = document.createElement("button")
				CopyJSONButton.appendChild(document.createTextNode("Copy data"))
				CopyJSONButton.addEventListener(
				"click",
					function () {
						GM.setClipboard(JSONTextarea.value)
					}
				)
				DivBox2.appendChild(CopyJSONButton)
			//Refresh button (updates the textarea)
				let RefreshTextareaButton = document.createElement("button")
				RefreshTextareaButton.appendChild(document.createTextNode("Refresh"))
				RefreshTextareaButton.addEventListener(
				"click",
					function () {
						JSONTextarea.value = ""
						HavePrintedListOfProcess = false
						IntervalCode()
					}
				)
				DivBox2.appendChild(RefreshTextareaButton)
			//line seperator
				DivBox2.appendChild(document.createElement("hr"))
			//Tracking textarea
				if (Setting_AlternativeProcessActivityLog) {
					DivBox2.appendChild(document.createElement("br"))
					
					JSONTextarea_Tracking = document.createElement("textarea")
					JSONTextarea_Tracking.style.whiteSpace = "pre"
					JSONTextarea_Tracking.style.overflowWrap = "normal"
					JSONTextarea_Tracking.style.overflowX = "scroll"
					JSONTextarea_Tracking.style.backgroundColor = "#000000"
					JSONTextarea_Tracking.style.color = "#ffffff"
					JSONTextarea_Tracking.style.fontFamily = "monospace"
					JSONTextarea_Tracking.style.resize = "both"
					
					JSONTextarea_Tracking.setAttribute("cols", "50")
					JSONTextarea_Tracking.setAttribute("rows", "10")
					JSONTextarea_Tracking.setAttribute("readonly", "")
					
					DivBox2.appendChild(JSONTextarea_Tracking)
					//Copy log button
						DivBox2.appendChild(document.createElement("br"))
						let CopyAlternativeProcessActivityLogButton = document.createElement("button")
						CopyAlternativeProcessActivityLogButton.appendChild(document.createTextNode("Copy log"))
						CopyAlternativeProcessActivityLogButton.addEventListener(
						"click",
							function () {
								GM.setClipboard(JSONTextarea_Tracking.value)
							}
						)
						DivBox2.appendChild(CopyAlternativeProcessActivityLogButton)
					//Clear button
						let ClearAlternativeProcessActivityLogButton = document.createElement("button")
						ClearAlternativeProcessActivityLogButton.appendChild(document.createTextNode("Clear log"))
						ClearAlternativeProcessActivityLogButton.addEventListener(
						"click",
							function () {
								JSONTextarea_Tracking.value = ""
								ProcessTrackingLog = []
							}
						)
						DivBox2.appendChild(ClearAlternativeProcessActivityLogButton)
					//Checkbox for process order
						DivBox2.appendChild(document.createElement("br"))
						let Label_ProcessActivityLog = document.createElement("label")
						Label_ProcessActivityLog.style.cursor = "pointer"
						
						let Checkbox_ProcessActivityLogOrder = document.createElement("input")
						Checkbox_ProcessActivityLogOrder.type = "checkbox"
						Checkbox_ProcessActivityLogOrder.addEventListener(
							"change",
								function () {
									WBGS_Utility_Settings.ProcessActivityLogOrderByRecent = this.checked
									AlternativeProcessActivityLogger()
									SaveWBGSUtilitySettings()
								}
						)
						Checkbox_ProcessActivityLogOrder.checked = WBGS_Utility_Settings.ProcessActivityLogOrderByRecent
						Label_ProcessActivityLog.appendChild(Checkbox_ProcessActivityLogOrder)
						Label_ProcessActivityLog.appendChild(document.createTextNode("Recent to oldest"))
						
						DivBox2.appendChild(Label_ProcessActivityLog)
				}
			//line seperator
				DivBox2.appendChild(document.createElement("hr"))
			//Process history list
				let ProcessHistoryTitle = document.createElement("h2")
				ProcessHistoryTitle.appendChild(document.createTextNode("Process history"))
				DivBox2.appendChild(ProcessHistoryTitle)
				
				DivBox2.appendChild(document.createTextNode("List order: "))
				Select_ProcessHistoryOrder = CreateSelectElement(WBGS_Utility_Settings.ProcessHistoryLogOrderSettings, false)
				Select_ProcessHistoryOrder.addEventListener(
					"change",
					function () {
						UpdateProcessHistoryList()
					}
				)
				
				DivBox2.appendChild(Select_ProcessHistoryOrder)
				
				let ClippedDiv_ProcessHistoryList = document.createElement("div")
				ClippedDiv_ProcessHistoryList.style.overflow = "auto"
				ClippedDiv_ProcessHistoryList.style.height = "200px"
				ClippedDiv_ProcessHistoryList.style.border = "1px solid"
				ClippedDiv_ProcessHistoryList.style.resize = "both"
				
				ProcessHistoryList = document.createElement("table")
				
				UpdateProcessHistoryList()
				ClippedDiv_ProcessHistoryList.appendChild(ProcessHistoryList)
				DivBox2.appendChild(ClippedDiv_ProcessHistoryList)
			//Button to get process history
				let GetProcessHistoryButton = document.createElement("button")
				GetProcessHistoryButton.appendChild(document.createTextNode("Copy Process History (JSON)"))
				GetProcessHistoryButton.addEventListener(
				"click",
					function () {
						FormattedObject = {
							Order: "",
							Type: "WBGS_StartProcessHistory",
							List: []
						}
						
						if (WBGS_Utility_Settings.ProcessHistoryLogOrderSettings[1].isSelected) {
							FormattedObject.Order = "Newest to oldest"
							FormattedObject.List = ProcessHistory.toReversed()
							GM.setClipboard(JSON.stringify(FormattedObject, "", " "))
						} else {
							FormattedObject.Order = "Oldest to newest"
							FormattedObject.List = ProcessHistory
							GM.setClipboard(JSON.stringify(FormattedObject, "", " "))
						}
					}
				)
				DivBox2.appendChild(GetProcessHistoryButton)
			//Abort button
				DivBox2.appendChild(document.createElement("hr"))
				Button_AbortFinishLocked = document.createElement("button")
				Button_AbortFinishLocked.appendChild(document.createTextNode("Abort all listed finished processes"))
				Button_AbortFinishLocked.addEventListener(
				"click",
					function () {
						let ProcessList = GetWBGSHomepageProcessList()
						if (ProcessList == null) {
							return
						}
						let FinishLockedProcesses = ProcessList.filter(Process => {
							try {
								return (Process.childNodes[4].textContent == "SUCCESS")
							} catch {
								return false
							}
						})
						FinishLockedProcesses.forEach(Process => {
							try {
								let AbortButton = WBGSProcess.childNodes[5].childNodes[1]
								AbortButton.click()
							} catch {}
						})
					}
				)
				DivBox2.appendChild(Button_AbortFinishLocked)
			//Add to document
				DivBox.appendChild(DivBox2)
				let HTMLBody = [...document.getElementsByTagName("BODY")].find((Element) => {return true})
				let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
				if (InnerNodeOfHTMLBody.IsSuccessful) {
					document.body.insertBefore(DivBox, HTMLBody.childNodes[0]);
				}
		}
		
		async function IntervalCode() {
			if (RaceConditionLock) {
				return
			}
			if (JSONTextarea == null || JSONTextarea_Tracking == null) {
				return
			}
			RaceConditionLock = true
			if (CurrentWBGSURL != window.location.href) { //if the user moves to a different URL, we need to update the textarea and clear various data
				HavePrintedListOfProcess = false 
				JSONTextarea.value = "";
				JSONTextarea_Tracking.value = "";
				ProcessTrackingLog = []
			}
			CurrentWBGSURL = window.location.href //Update previous URL
			let CurrentTimeMS = Date.now()
			
			let WBGS_PageInfo = (() => {
				let OutputObject = {
					Type: "",
					IsProcessPage: false,
					IsProcessTrackingURLPage: false
				}
				if (/^https:\/\/archive\.org\/services\/wayback-gsheets\/options/.test(CurrentWBGSURL)) {
					OutputObject.Type = "Homepage"
				} else if (CurrentWBGSURL == "https://archive.org/services/wayback-gsheets/check?method=archive") {
					OutputObject.Type = "ArchiveURLs"
				} else if (CurrentWBGSURL == "https://archive.org/services/wayback-gsheets/check?method=availability") {
					OutputObject.Type = "CheckURLsArchived"
				} else if (CurrentWBGSURL == "https://archive.org/services/wayback-gsheets/check?method=live") {
					OutputObject.Type = "CheckURLsLive"
				}
				if (/^https:\/\/archive\.org\/services\/wayback-gsheets\/check\?/.test(CurrentWBGSURL)) {
					OutputObject.IsProcessPage = true
				}
				if (/^https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id/.test(CurrentWBGSURL)) {
					OutputObject.Type = "ProcessTrackingURLPage"
					OutputObject.IsProcessTrackingURLPage = true
				}
				return OutputObject
			})();
			if (WBGS_PageInfo.Type != "Homepage") { //On any other WBGS page that don't display running processes, disable the abort button.
				if (!Button_AbortFinishLocked.disabled) { //Prevent devtool element tab from constantly highlighting a change
					Button_AbortFinishLocked.disabled = true
				}
			} else { //On homepage, enable the abort button unless done already
				if (Button_AbortFinishLocked.disabled) { //Prevent devtool element tab from constantly highlighting a change
					Button_AbortFinishLocked.disabled = false
				}
			}
			
			//Check the "save results in a new sheets" option
				if (WBGS_PageInfo.Type == "ArchiveURLs") {
					let Element_SaveInNewSheetOption = [...document.querySelectorAll('input[type=checkbox]')].find((CheckBox) => {
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
				let TrackingURL = [...document.querySelectorAll("small")].find((HTMLElement) => {
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
						let JobIDString = ""
						try {
							JobIDString = ProcessTrackingURLString.match(/(?<=https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=)[a-zA-Z\d\-]+/)[0]
						} catch {}
						
						let OBJ_WBGS_TrackingInfo = {
							TrackingURL: HttpToTtp(ProcessTrackingURLString), //URLs in the console log gets truncated and the text may not be preserved depending on browser.
							GoogleSheetURL: HttpToTtp(ProcessTrackingURLString.replace(/^.+?\&google_sheet_url=/g, "").replaceAll("%3A", ":").replaceAll("%2F", "/").replaceAll("%23", "#").replaceAll("%3D", "=").replaceAll("%3F", "?")),
							JobID: JobIDString,
							JSONURLGetProcess: "https://archive.org/services/wayback-gsheets/get_progress/" + JobIDString,
							TimestampOfInitalProcess: ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(CurrentTimeMS).toISOString()),
							ProcessType: ProcessType
						}
						
						let NodeContainingArchiveProcessSettings = [...document.querySelectorAll("button")].find((ele) => ele.textContent == "Archive")
						if (typeof NodeContainingArchiveProcessSettings != "undefined") {
							let SettingsObject = GetProcessSettings(NodeContainingArchiveProcessSettings.parentNode)
							OBJ_WBGS_TrackingInfo.ProcessSettings = SettingsObject //Add a new property referencing to the settings
						}
						
						
						JSONTextarea.value = JSON.stringify(OBJ_WBGS_TrackingInfo, "", " ")
						HavePrintedListOfProcess = true
						
						//Save history to a log
							
							let IndexWithSameProcess = ProcessHistory.findIndex((ArrEle) => { //Find if we already have that process in the list (failsafe)
								return ArrEle.TrackingURL == OBJ_WBGS_TrackingInfo.TrackingURL
							})
							if (IndexWithSameProcess == -1) { //This if statement is a failsafe to prevent duplicate entries
								if (ProcessHistory.length >= Setting_ProcessLogLimit) { //If you somehow have multiple items past the limit, this will remove a number of items to match the maximum.
									ProcessHistory.splice(0, ProcessHistory.length - (Setting_ProcessLogLimit-1)) //Delete oldest item (array will have MaxNumber-1, -1 so we have one empty slot to place)
								}
								ProcessHistory.push(OBJ_WBGS_TrackingInfo)
								await GM.setValue("WBGS_ProcessHistory", JSON.stringify(ProcessHistory)).catch(() => {
									console.log("WBGS utility: Saving log failed!")
								})
							}
						//Update the list
							UpdateProcessHistoryList()
					}
				}
			//Extract info from the WBGS home page
				if (WBGS_PageInfo.Type == "Homepage") {
					Button_AbortFinishLocked.disabled = false
					let JsonExtractedInfo = {
						CurrentDateTime: ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(CurrentTimeMS).toISOString()),
						ListOfProcesses: [],
						SystemQueueMessage: ""
					}
					let ListOfProcessesItems = GetWBGSHomepageProcessList()
					if (ListOfProcessesItems != null) { //If no process exists, don't list it
						
						if (DisplayEasyCopyableListOfProcess && (!HavePrintedListOfProcess) && ListOfProcessesItems.length != 0) {
							//Convert into json info containing process info
								let OBJ_WBGS_ListOfProcesses = ListOfProcessesItems.map((WBGSProcess) => {
									let TrackingURL = WBGSProcess.childNodes[5].childNodes[0].href
									let HowLongAgo = DisplayTimeDuration(CurrentTimeMS - new Date(WBGSProcess.childNodes[1].textContent + " UTC").valueOf()) + " ago"
									return {
										TrackingURL: HttpToTtp(TrackingURL),
										JobID: TrackingURL.match(/(?<=https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=)[a-zA-Z\d\-]+/)[0],
										GoogleSheetURL: HttpToTtp(WBGSProcess.childNodes[0].textContent),
										StartedTime: WBGSProcess.childNodes[1].textContent + " (" + HowLongAgo + ")",
										Status: WBGSProcess.childNodes[4].textContent
									}
								})
								JsonExtractedInfo.ListOfProcesses = OBJ_WBGS_ListOfProcesses
						}
						if (!HavePrintedListOfProcess) {
							//Get queue quantity
								let DivMsgQueueWarning = [...document.querySelectorAll("div")]
								DivMsgQueueWarning = DivMsgQueueWarning.find((Element) => {
									return /^There are \d+ processes waiting in the system queue!/.test(Element.textContent)
								})
								if (typeof DivMsgQueueWarning != "undefined") {
									JsonExtractedInfo.SystemQueueMessage = DivMsgQueueWarning.textContent
								}
							
							//Output the json
								if (JsonExtractedInfo.ListOfProcesses.length != 0 || JsonExtractedInfo.SystemQueueMessage != "") { //If there is something there, then print it.
									JSONTextarea.value = JSON.stringify(JsonExtractedInfo, "", " ")
									HavePrintedListOfProcess = true
								}
						}
					}
				}
			//Display progress bar on process tracking URL pages (not so sure why WBGS not have it on those pages despite being shown on start process page)
				if (WBGS_PageInfo.IsProcessTrackingURLPage) {
					(() => {
						let DivContainingProcessStatus = document.querySelector("div.progress-status, mt-2")
						if (DivContainingProcessStatus == null) {
							return
						}
						let ProcessStatusText = DivContainingProcessStatus.textContent
						if (!/Processed \d+ of \d+/.test(ProcessStatusText)) {
							return
						}
						try {
							let ProcessNumbersSubstring = ProcessStatusText.match(/\d+/g)
							
							if (DivProgressBar == null) { //Create and place progress bar div unless it already have.
								DivProgressBar = document.createElement("div")
								DivProgressBar.style.borderRadius = ".25rem"
								DivProgressBar.style.height = "1rem"
								DivContainingProcessStatus.parentNode.appendChild(DivProgressBar)
							}
							let ProcessedURLsCount = parseInt(ProcessNumbersSubstring[0])
							let TotalURLsCount = parseInt(ProcessNumbersSubstring[1])
							DivProgressBar.style.backgroundImage = CSSBackgroundImageLinearGradiantPercentageBarGraph(ProcessedURLsCount, TotalURLsCount, "to right", "#0000ff", "#c0c0c0")
						} catch (e) {
							console.log("Generating progress bar error")
						}
					})();
				} else {
					DivProgressBar = null //Set back to null when user leaves the process tracking page
				}
			RaceConditionLock = false
		}
		function AlternativeProcessActivityLogger() {
			let CurrentTimeMS = Date.now()
			let CurrentUTCString = ISOString_to_YYYY_MM_DD_HH_MM_SS(new Date(CurrentTimeMS).toISOString())
			
			let StatusText = ""
			let PageType = ""
			let LogToExtract = null
			if (/^https:\/\/archive\.org\/services\/wayback-gsheets\/options.*/.test(CurrentWBGSURL)) { //WBGS home page
				PageType = "WBGS_Homepage"
				LogToExtract = document.querySelector("div.alert, alert-warning")
				
				if (LogToExtract != null) {
					let QueueMsg = LogToExtract.textContent
					if (/There are \d+ processes waiting in the system queue\!/.test(QueueMsg)) {
						try {
							StatusText = QueueMsg
						} catch {}
					}
				}
			} else { //Start process page or process tracking URL page
				PageType = "WBGS_ProcessPage"
				LogToExtract = document.querySelector("textarea.progress-log")
				if (LogToExtract != null) {
					try {
						StatusText = LogToExtract.value.match(/^(.*)$/m)[0].replace(/ \d{1,2}:\d{2}:\d{2} (?:A|P)M$/, "") // StatusText should now contain only the status and not the local time.
					} catch {}
				}
			}
			
			if (LogToExtract != null) {
				if (StatusText != "") {
					let ShouldPushTimeRangeObject = false
					
					let LastLogged = ProcessTrackingLog.at(-1)
					let ProcessLogObject = null
					if (typeof LastLogged != "undefined") { //If there is a last item in the array (not when the array is empty)
						if (LastLogged.Text == StatusText) { //If the text is the same as the one before, merge-with/update the last object instead
							ProcessLogObject = LastLogged
							LastLogged.End = CurrentUTCString
							let DurationMS = new Date(LastLogged.End).getTime() - new Date(LastLogged.Start).getTime()
							let DurationString = "Just started"
							if (DurationMS >= Setting_ProcessActivityLogScanFrequency) {
								DurationString = DisplayTimeDuration(DurationMS)
							}
							LastLogged.Duration = DurationString //Update the "end" time
						} else { //Otherwise create a new separate object
							ProcessLogObject = {
								Start: CurrentUTCString,
								End: CurrentUTCString,
								Duration: "Just started",
								Text: StatusText
							}
							ShouldPushTimeRangeObject = true
						}
					} else { //If array is empty, this is the first item
						ProcessLogObject = {
							Start: CurrentUTCString,
							End: CurrentUTCString,
							Duration: "Just started",
							Text: StatusText
						}
						ShouldPushTimeRangeObject = true
					}
					if (ProcessLogObject == null) {
						return
					}
					if (PageType == "WBGS_ProcessPage") {
						if (/queued/.test(ProcessLogObject.Text)) {
							ProcessLogObject.Color = "#FFFF00"
						} else if (/^Processed [\d,\.]+/.test(ProcessLogObject.Text)) {
							ProcessLogObject.Color = "#0000FF"
							let ProcessNumber = parseInt(ProcessLogObject.Text.match(/(?<=^Processed )[\d,\.]+/)[0].replaceAll(/[,\.]/g, ""))
							ProcessLogObject.BarHeight = ProcessNumber*5
						} else if (/^Finished processing/.test(ProcessLogObject.Text)) {
							ProcessLogObject.Color = "#00FF00"
						}
					} else if (PageType == "WBGS_Homepage") {
						ProcessLogObject.Color = "#0000FF"
						let QueueCountNumber = 5
						try {
							QueueCountNumber = parseInt(StatusText.match(/\d+/)[0])
							ProcessLogObject.BarHeight = QueueCountNumber*5
						} catch {}
					}
					if (ShouldPushTimeRangeObject) {
						ProcessTrackingLog.push(ProcessLogObject)
					}
					let FormattedObject = {
						Order: "",
						Type: PageType,
					}
					if (WBGS_Utility_Settings.ProcessActivityLogOrderByRecent) {
						FormattedObject.Order = "Recent to oldest"
						FormattedObject.List = ProcessTrackingLog.toReversed()
						JSONTextarea_Tracking.value = JSON.stringify(FormattedObject, "", " ")
					} else {
						FormattedObject.Order = "Oldest to recent"
						FormattedObject.List = ProcessTrackingLog
						JSONTextarea_Tracking.value = JSON.stringify(FormattedObject, "", " ")
					}
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
	//helper functions
		function GetProcessSettings(NodeContainingControls) {
			let ListOfUserControllableUI = [...NodeContainingControls.querySelectorAll("input, select")]
			let SettingsObject = {}
			ListOfUserControllableUI.forEach((ele) => {
				try { //Failsafe
					if (ele.tagName == "INPUT" && ele.type == "checkbox") {
						SettingsObject[ele.parentNode.textContent] = ele.checked
					} else if (ele.tagName == "SELECT") {
						let SelectedOption = [...ele.selectedOptions][0]
						let OptionText = ""
						if (SelectedOption != null) {
							OptionText = SelectedOption.textContent
						}
						let PartsOfSelectUI = [...ele.parentNode.childNodes]
						if (PartsOfSelectUI.length == 3) {
							let OptionLabel = PartsOfSelectUI[0].textContent //This assumes the text is to the left of the select element
							SettingsObject[OptionLabel] = OptionText
						}
					}
				} catch {}
			})
			return SettingsObject
		}
		function GetWBGSHomepageProcessList() {
			//Returns a list of process from the WBGS homepage, if entirely doesn't exists, returns null, else if it exists, outputs an array at any length (including zero)
			try {
				let TableElement = document.querySelector("table")
				let TableLists = [...TableElement.querySelectorAll("tr")]
				return TableLists.filter(row => {
					let HasGoogleSheetURL = /https:\/\/docs\.google\.com\/spreadsheets\//.test(row.childNodes[0].textContent) ?? false
					return (row.childNodes.length == 6)&&HasGoogleSheetURL
				})
			} catch {
				return null
			}
		}
		function UpdateProcessHistoryList() {
			try {
				//Start with a clear list
					while (ProcessHistoryList.lastElementChild) {
						ProcessHistoryList.removeChild(ProcessHistoryList.lastElementChild);
					}
				//Table header row
					let ProcessHistoryListHeaderRow = document.createElement("tr")
					
					let DateAndLinkToProcessColumn = document.createElement("th")
					DateAndLinkToProcessColumn.style.border = "1px solid white"
					DateAndLinkToProcessColumn.style.borderCollapse = "collapse"
					DateAndLinkToProcessColumn.appendChild(document.createTextNode("Date & link to process"))
					DateAndLinkToProcessColumn.style.textWrap = "nowrap"
					ProcessHistoryListHeaderRow.appendChild(DateAndLinkToProcessColumn)
					
					let CopyJSONColumn = document.createElement("th")
					CopyJSONColumn.style.border = "1px solid white"
					CopyJSONColumn.style.borderCollapse = "collapse"
					CopyJSONColumn.appendChild(document.createTextNode("JSON"))
					ProcessHistoryListHeaderRow.appendChild(CopyJSONColumn)
					
					let GoogleSheetLinkColumn = document.createElement("th")
					GoogleSheetLinkColumn.style.border = "1px solid white"
					GoogleSheetLinkColumn.style.borderCollapse = "collapse"
					GoogleSheetLinkColumn.appendChild(document.createTextNode("GSheet link"))
					GoogleSheetLinkColumn.style.textWrap = "nowrap"
					ProcessHistoryListHeaderRow.appendChild(GoogleSheetLinkColumn)
					
					let ProcessTypeColumn = document.createElement("th")
					ProcessTypeColumn.style.border = "1px solid white"
					ProcessTypeColumn.style.borderCollapse = "collapse"
					ProcessTypeColumn.appendChild(document.createTextNode("Process type"))
					ProcessTypeColumn.style.textWrap = "nowrap"
					ProcessHistoryListHeaderRow.appendChild(ProcessTypeColumn)
					
					ProcessHistoryList.appendChild(ProcessHistoryListHeaderRow)
				//Get a list by most recent and generate items for each processes
				
					let ProcessListRecentFirst = ProcessHistory
					if (Select_ProcessHistoryOrder.selectedIndex == 1) {
						ProcessListRecentFirst = ProcessHistory.toReversed()
					}
					ProcessListRecentFirst.forEach(Process => {
						let ProcessRow = document.createElement("tr")
						
						let ProcessCell_TimestampAndLinkToProcess = document.createElement("td")
						ProcessCell_TimestampAndLinkToProcess.style.border = "1px solid white"
						ProcessCell_TimestampAndLinkToProcess.style.borderCollapse = "collapse"
						
						let LinkToProcessTracking = document.createElement("a")
						LinkToProcessTracking.href = Process.TrackingURL
						LinkToProcessTracking.target = "_blank"
						LinkToProcessTracking.rel = "noopener noreferrer"
						LinkToProcessTracking.style.fontFamily = "monospace"
						LinkToProcessTracking.style.textWrap = "nowrap"
						LinkToProcessTracking.appendChild(document.createTextNode(Process.TimestampOfInitalProcess))
						ProcessCell_TimestampAndLinkToProcess.appendChild(LinkToProcessTracking)
						ProcessRow.appendChild(ProcessCell_TimestampAndLinkToProcess)
						
						let ProcessCell_JSONCopy = document.createElement("td")
						ProcessCell_JSONCopy.style.border = "1px solid white"
						ProcessCell_JSONCopy.style.borderCollapse = "collapse"
						
						let CopyJSONButton = document.createElement("button")
						CopyJSONButton.appendChild(document.createTextNode("Copy"))
						CopyJSONButton.addEventListener(
							"click",
							function (e) {
								GM.setClipboard(JSON.stringify(Process, null, " "))
							}.bind(Process)
						)
						
						ProcessCell_JSONCopy.appendChild(CopyJSONButton)
						ProcessRow.appendChild(ProcessCell_JSONCopy)
						
						let ProcessCell_GoogleSheetLink = document.createElement("td")
						ProcessCell_GoogleSheetLink.style.border = "1px solid white"
						ProcessCell_GoogleSheetLink.style.borderCollapse = "collapse"
						
						let LinkToGoogleSheet = document.createElement("a")
						LinkToGoogleSheet.href = Process.GoogleSheetURL
						LinkToGoogleSheet.target = "_blank"
						LinkToGoogleSheet.rel = "noopener noreferrer"
						LinkToGoogleSheet.style.fontFamily = "monospace"
						LinkToGoogleSheet.style.textWrap = "nowrap"
						LinkToGoogleSheet.appendChild(document.createTextNode("Link"))
						ProcessCell_GoogleSheetLink.appendChild(LinkToGoogleSheet)
						ProcessRow.appendChild(ProcessCell_GoogleSheetLink)
						
						let ProcessCell_ProcessType = document.createElement("td")
						ProcessCell_ProcessType.style.border = "1px solid white"
						ProcessCell_ProcessType.style.borderCollapse = "collapse"
						ProcessCell_ProcessType.style.fontFamily = "monospace"
						ProcessCell_ProcessType.appendChild(document.createTextNode(Process.ProcessType))
						ProcessCell_ProcessType.style.textWrap = "nowrap"
						ProcessRow.appendChild(ProcessCell_ProcessType)
						
						ProcessHistoryList.appendChild(ProcessRow)
					})
			} catch (e) {
				console.log("Error! ProcessHistoryList not existing!")
			}
		}
		function CreateSelectElement(arrayOptions, allowMultiple) {
			//Input:
			//arrayOptions:
			//	[{value: "ValueString", visibleText: "Text here", isSelected: false}]
			//allowMultiple: false = select only one, true = allow multiple
			let HTML_Element_Select = document.createElement("select")
			HTML_Element_Select.addEventListener(
				"change",
				function () {
					Array.from(this.childNodes).forEach((listedOption, Index) => {
						arrayOptions[Index].isSelected = listedOption.selected
					})
					SaveWBGSUtilitySettings()
				}
			)
			if (allowMultiple) {
				HTML_Element_Select.setAttribute("multiple", "")
			}
			arrayOptions.forEach((listedOption) => {
				let HTML_Element_Option = document.createElement("option")
				HTML_Element_Option.setAttribute("value", listedOption.value)
				if (listedOption.isSelected) {
					HTML_Element_Option.setAttribute("selected", "")
				}
				HTML_Element_Option.appendChild(document.createTextNode(listedOption.visibleText))
				
				HTML_Element_Select.appendChild(HTML_Element_Option)
			})
			
			return HTML_Element_Select
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
				if (LeadingUnitIsNonZero || i == UnitsOfTimeArray.length-1) {
					OutputString += UnitsOfTimeArray[i].Unit + UnitsOfTimeArray[i].UnitName
					if (i != UnitsOfTimeArray.length-1) {
						OutputString += " "
					}
				}
			}
			return OutputString
		}
		function CSSBackgroundImageLinearGradiantPercentageBarGraph(Quantity, MaxQuantity, Direction, Color_Full, Color_Empty) {
			//Returns a percentage displayed as a gradient representing a bar graph as CSS. Preferably as a background image.
			let Percentage = 0
			if (MaxQuantity != 0) {
				Percentage = Quantity * 100/MaxQuantity //Multiply first so that it only rounds at the last step, minimizing rounding errors.
			}
			Percentage = clamp(Percentage, 0, 100)
			return "linear-gradient("+Direction+", "+Color_Full+" "+Percentage+"%, "+Color_Empty+" "+Percentage+"% 100%)"
		}
		function clamp(num, min, max) {
			//Restrict a number within a specified range.
				if (isNaN(num) == true) {
					num = 0
				}
				return num <= min ? min : num >= max ? max : num;
		}
})();