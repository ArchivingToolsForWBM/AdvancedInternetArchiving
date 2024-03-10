// ==UserScript==
// @name         Extract any links from any site (recursive window)
// @namespace    any site
// @version      0.2
// @description  try to take over the world!
// @include      *
// @grant    GM.setValue
// @grant    GM.getValue
// @grant    GM.setClipboard
// @exclude  *.google*
// @grant    GM.registerMenuCommand
// ==/UserScript==

//Credit goes to hacker09 on GreasyFork: https://greasyfork.org/en/discussions/requests/65921-feature-request-extract-links-as-the-user-scroll-down-general-purpose-any-site
//for hints on how to set up a code to read the document to obtain links.
//
//Notes:
//- This was tested on firefox.
//- If you are extracting a large number of links, make sure:
//-- On firefox, go on the search bar and enter "about:config", "Accept the Risk and Continue" and type "HUD" and find these settings:
//--- devtools.hud.loglimit (this is the console log limit for the console.log per-tab)
//--- devtools.hud.loglimit.console (same as above but for firefox's browser console: https://firefox-source-docs.mozilla.org/devtools-user/browser_console/index.html )
//   And set them to a number: 2147483647 else the log may DELETE entries to make more room.
//- Make sure you have "Persist Logs"/"Preserve log" enabled. Loading a different page on the main window or if the page have "console.clear()" in its code will
//  delete your console.log. At the time of writing this (2022-08-14), I've discovered that firefox doesn't have the ability to disobey console.clear(): https://bugzilla.mozilla.org/show_bug.cgi?id=1267856

(function() {
	//Settings
		const Interval_captureLinks = true //Capture based on intervals (run this code periodically), false = no, true = yes.
		const CaptureLinksInterval = 100 //Time (milliseconds) between each execution of code to extract links, used when Interval_captureLinks = true.
		const IframeMaxRecursion = 50
			//^When there is an iframe and multiple windows, this is the max recursion before cutting off further inner windows (failsafe to stop potential infinite loops/stack overload)
	//Don't touch
		let IframeRecursionCount = 0 //Tracks how many levels deep sub-window frames to scan into.
		let AntiRaceCondition = false //This script uses setInterval(), which is an asynchronous function. We don't want potential unintentional overwriting cause by race condition.
		let IntervalID_ExtractURLs = 0
		let IntervalID_DisplayURLCount = 0
		
	//Save data and having elements in memory
		let StorageSaved_ExtractLinks = {
			ToggleUISetting: true,
			Running: false,
			ListOfURLs: [],
			CopiedURLSort: [
				{value:"Sort_None", visibleText: "No sort", isSelected: true},
				{value:"AlphabeticallyAscend", visibleText: "Alphabetically ascend",  isSelected: false},
				{value:"AlphabeticallyDescend", visibleText: "Alphabetically descend",  isSelected: false}
			]
		}
		LoadValuesFromStorage()
	//Elements to remember
		let HTMLElement_DivBox = {}
		let HTMLElement_DivBox2 = {}
		let HTMLElement_StartStopButton = {}
		let HTMLElement_URLExtractedCount = {}
	//timeout for 1-time execution
		setTimeout(Spawn_UI_Panel, 200)
		setTimeout(InitalizeInterval, 500)
	//Initalize interval
		function InitalizeInterval() {
			if (StorageSaved_ExtractLinks.Running) { //This code must execute after the await finishes when loading values from storage
				IntervalID_ExtractURLs = setInterval(ExtractLinksOnWindow, CaptureLinksInterval, window)
			}
		}
		IntervalID_DisplayURLCount = setInterval(UpdateDisplayNumberOfURLs, CaptureLinksInterval, window)
	//Menu commands
		GM.registerMenuCommand("Toggle UI", ToggleUI, "");
		function ToggleUI() {
			StorageSaved_ExtractLinks.ToggleUISetting = !StorageSaved_ExtractLinks.ToggleUISetting
			HTMLElement_DivBox2.hidden = !StorageSaved_ExtractLinks.ToggleUISetting
			SaveValuesToStorage()
		}
	//UI stuff
		async function Spawn_UI_Panel() {
			//Div box
				HTMLElement_DivBox = document.createElement("div")
				
				HTMLElement_DivBox2 = document.createElement("div")
				HTMLElement_DivBox2.hidden = !StorageSaved_ExtractLinks.ToggleUISetting
				HTMLElement_DivBox2.setAttribute("style", "position: fixed;bottom: 20px;left: 20px; z-index: 9999999999; background-color: rgba(64, 64, 64, .90); color: #ffffff; border-radius: 30px; padding: 15px;")
			//Title
				let TitleHeader = document.createElement("h2")
				TitleHeader.appendChild(document.createTextNode("Link extractor"))
				TitleHeader.setAttribute("style", "text-align: center;")
				HTMLElement_DivBox2.appendChild(TitleHeader)
				HTMLElement_DivBox2.appendChild(document.createElement("br"))
			//Start/stop button:
				HTMLElement_StartStopButton = document.createElement("Button")
				HTMLElement_StartStopButton.setAttribute("style", "width: 50px;")
				HTMLElement_StartStopButton.appendChild(document.createTextNode(AlternateStartStop()))
				HTMLElement_StartStopButton.addEventListener(
					"click",
					function () {
						StorageSaved_ExtractLinks.Running = !StorageSaved_ExtractLinks.Running
						HTMLElement_StartStopButton.textContent = AlternateStartStop()
						SaveValuesToStorage()
						
						if (StorageSaved_ExtractLinks.Running) {
							IntervalID_ExtractURLs = setInterval(ExtractLinksOnWindow, CaptureLinksInterval, window)
						} else {
							clearInterval(IntervalID_ExtractURLs)
						}
					}
				)
				HTMLElement_DivBox2.appendChild(HTMLElement_StartStopButton)
				HTMLElement_DivBox2.appendChild(document.createElement("br"))
			//Copy URL list
				let HTMLElement_CopyList = document.createElement("Button")
				HTMLElement_CopyList.textContent = "Copy list of URLs"
				HTMLElement_CopyList.addEventListener(
					"click",
					function () {
						let URLText = ""
						let URLArray = StorageSaved_ExtractLinks.ListOfURLs
						if (StorageSaved_ExtractLinks.CopiedURLSort[1].isSelected) {
							//Sort Alphabetically ascending...
							URLArray = URLArray.toSorted()
						} else if (StorageSaved_ExtractLinks.CopiedURLSort[2].isSelected) {
							//...descending
							URLArray = URLArray.toSorted((a,b) => {
								if (a==b) {
									return 0
								} else {
									return (a < b) ? 1 : -1;
								}
							});
						}
						URLArray.forEach((URLItem, Index, List) => {
							URLText += URLItem
							if (Index != List.length-1) {
								URLText += "\n"
							}
						})
						GM.setClipboard(URLText)
					}
				)
				HTMLElement_DivBox2.appendChild(HTMLElement_CopyList)
			//Sort settings
				let HTMLElement_SortSelect = CreateSelectElement(StorageSaved_ExtractLinks.CopiedURLSort, false)
				HTMLElement_DivBox2.appendChild(HTMLElement_SortSelect)
				HTMLElement_DivBox2.appendChild(document.createElement("br"))
			//clear list button
				let HTMLElement_ClearURLList = document.createElement("Button")
				HTMLElement_ClearURLList.textContent = "Clear URL list"
				HTMLElement_ClearURLList.addEventListener(
					"click",
					function () {
						if (window.confirm("Are you sure?")) {
							StorageSaved_ExtractLinks.ListOfURLs = []
							StorageSaved_ExtractLinks.Running = false
							HTMLElement_StartStopButton.textContent = AlternateStartStop()
							HTMLElement_URLExtractedCount.textContent = "URLs extracted: 0"
							SaveValuesToStorage()
							clearInterval(IntervalID_ExtractURLs)
						}
					}
				)
				HTMLElement_DivBox2.appendChild(HTMLElement_ClearURLList)
				HTMLElement_DivBox2.appendChild(document.createElement("br"))
			//Number of extracted links
				HTMLElement_URLExtractedCount = document.createElement("span")
				HTMLElement_URLExtractedCount.setAttribute("style", "font-family: monospace;")
				
				let Text_URLCount = document.createTextNode("URLs extracted: " + StorageSaved_ExtractLinks.ListOfURLs.length.toString(10))
				HTMLElement_URLExtractedCount.appendChild(Text_URLCount)
				
				HTMLElement_DivBox2.appendChild(HTMLElement_URLExtractedCount)
			//Add to document
				let Shadow = HTMLElement_DivBox.attachShadow({ mode: "closed" }); //thank you https://stackoverflow.com/questions/59868970/shadow-dom-elements-attached-to-shadow-dom-not-rendering
				Shadow.appendChild(HTMLElement_DivBox2)
				let HTMLBody = Array.from(document.getElementsByTagName("BODY")).find((Element) => {return true})
				let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
				if (InnerNodeOfHTMLBody.IsSuccessful) {
					document.body.insertBefore(HTMLElement_DivBox, HTMLBody.childNodes[0]);
				}
			}
	//Extractor
		function ExtractLinksFromPage(PageDocument) {
			Array.from(PageDocument.getElementsByTagName('*')).forEach((Element) => {
				AddLinksToSaveList(Element.href, Element.tagName + " tag") //a href
				AddLinksToSaveList(Element.src, Element.tagName + " tag") //images and video
				AddLinksToSaveList(Element.style.backgroundImage.slice(5, -2), "background-image attribute") //background image
			})
		}
		function AddLinksToSaveList(String_URL = "", ObtainedFrom = "") {
			if (typeof String_URL != "string") { //failsafe, sometimes attributes contains non-string data such as objects.
				return
			}
			if (String_URL == "") {
				return
			}
			if (/^\s*javascript:.*$/.test(String_URL)) {
				return
			}
			if (String_URL=="none") {
				return
			}
			if (/^r-gradient.*$/.test(String_URL)) {
				return
			}
			if (/^data:/.test(String_URL)) {
				return
			}
			let CorrectedURL = String_URL.replace(/#.*$/, "") //get rid of fragment identifier (it's technically not an address), also prevents same URLs with different fragments from filling up the set.
			if (/^\/+/.test(String_URL)) {
				CorrectedURL = String_URL.replace(/^\/+/, "https://") // "/example.com" or "//example.com"
			} else if (/^(?!http(s)?:\/\/)/.test(String_URL)) {
				CorrectedURL = String_URL.replace(/^/, "https://") // "example.com" (note the missing "https://")
			}
			let UniqueListOfURLs = new Set(StorageSaved_ExtractLinks.ListOfURLs) //Get a set, to remove dupes
			UniqueListOfURLs.add(CorrectedURL) //Add only new items in the set
			StorageSaved_ExtractLinks.ListOfURLs = Array.from(UniqueListOfURLs) //And place it back
		}
		function addEventListenersToPages(Input_Window) {
			//This adds even listeners to each window when the main window is first loaded, then if there are subwindow, do this recursively on each.
			Input_Window.addEventListener('scroll',ExtractLinksFromPage.bind(null, Input_Window.document));
			Input_Window.addEventListener('load',ExtractLinksFromPage.bind(null, Input_Window.document));
			for (let i=0; ((i<Input_Window.frames.length)&&(IframeRecursionCount<IframeMaxRecursion));i++) {
				IframeRecursionCount++
				addEventListenersToPages(Input_Window.frames[i])
				IframeRecursionCount-- //Don't count as total number of function calls, just how many levels deep.
			}
		}
		function ExtractLinksOnWindow(Input_Window) {
			if (!AntiRaceCondition) {
				AntiRaceCondition = true
				//This extracts links in the current window, then searches for any subwindow, calls itself recursively
				//to extract its links and across multiple windows (multiple windows that aren't inside of another). Best used
				//when the subwindows loaded a different document but the main window didn't, by calling this function again.
				ExtractLinksFromPage(Input_Window.document)
				for (let i=0; ((i<Input_Window.frames.length)&&(IframeRecursionCount<IframeMaxRecursion));i++) {
					IframeRecursionCount++
					ExtractLinksOnWindow(Input_Window.frames[i])
					IframeRecursionCount-- //Don't count as total number of function calls, just how many levels deep.
				}
				SaveValuesToStorage()
				AntiRaceCondition = false
			}
		}
		function UpdateDisplayNumberOfURLs() {
			HTMLElement_URLExtractedCount.textContent = "URLs extracted: " + StorageSaved_ExtractLinks.ListOfURLs.length.toString(10)
		}
		
//		window.addEventListener('scroll',addEventListenersToPages.bind(null, window));
//		window.addEventListener('load',addEventListenersToPages.bind(null, window));
//		if (Interval_captureLinks) {
//			IntervalID_ExtractURLs = setInterval(ExtractLinksOnWindow, CaptureLinksInterval, window)
//		}

	//Reused code
		async function LoadValuesFromStorage() {
			StorageSaved_ExtractLinks = JSON.parse(await GM.getValue("ExtractLinks_SaveData", JSON.stringify(StorageSaved_ExtractLinks)).catch( () => {
				GetValueErrorMessage()
			}))
		}
		async function SaveValuesToStorage() {
			await GM.setValue("ExtractLinks_SaveData", JSON.stringify(StorageSaved_ExtractLinks)).catch( () => {
				SetValueErrorMessage()
			})
		}
		function GetValueErrorMessage() {
			console.log("Extract Links - getvalue failed.")
		}
	
		function AlternateStartStop() {
				let StopStartText = "Start"
				if (StorageSaved_ExtractLinks.Running) {
					StopStartText = "Stop"
				}
			return StopStartText
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
					SaveValuesToStorage()
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
})();