// ==UserScript==
// @name     Load URLs in a sequence.
// @version  1
// @grant    GM.setValue
// @grant    GM.getValue
// @grant    GM.registerMenuCommand
// @include      *
// @exclude  *.google.com*
// @exclude  https://archive.org/*
// @exclude  https://web.archive.org/*
// @exclude  https://*.developer.mozilla.org/*
// ==/UserScript==
'use strict';

//Notes:
// -Beware of anything that would pause your browser, such as a download prompts and any popup box that you cannot
//  focus on your browser.
// -Sometimes, pages may error out temporally (like error 503). Make sure you have a script that sends info to the
//  web console containing a URL and some string of text that you can find it (e.g ThisURLFailedToLoad:
//  https://example.com) so you can then extract those and retry extracting them.

(async () => {
//Settings
	const TimeBeforeLoadingNextURL = 5000 //How many milliseconds after the page fully loads before loading the next URL.
	const TimeBeforeOrAfterLoad = 0
		//0 = Start timer to load next URL after page fully loads
		//1 = Start timer to load next URL before page fully loads.
//Don't touch unless you know what you're doing
	let RaceConditionLock = false
	setTimeout(Spawn_UI_Panel, 500)
	let TimeoutBeforeNextPage = -1
	let HTMLElement_DivBox = {} //The main div box
	let HTMLElement_DivBox2 = {}
	let HTMLElement_TextareaURLs = {} //The textarea the user enters a string containing URLs
	let HTMLElement_URLCounter = {} //The display on how many unique URLs entered by the user
	let HTMLElement_ProgressNumber = {} //The number input that can be set by the user.
	let HTMLElement_ProgressNumber_ErrorMsg = {} //Error message when the user enters an invalid string for what URL to start at
	let HTMLElement_DelayBeforeNextPage = {} //The input range entered by the user
	let HTMLElement_DelaySettingDisplay = {} //Display how many seconds before loading the next page updated by the setting above
	let HTMLElement_StartStopButton = {} //Start stop button
	let HTMLElement_ClippedDivBox = {} //The div showing the list of unique URLs table
	let HTMLElement_ProgressDisplayText = {} //Shows how many URLs progressed
	let HTMLElement_ProgressDisplayBar = {} //Percentage bar showing progress
	let StorageSaved_URLs = {
		ToggleUISetting: true,
		TextareaURLs: "",
		ListOfURLs: [],
		Running: false,
		ProgressCount_EnteredString: "",
		//^This is a string the user enters, that may not always be a valid string, but saved so it is a QOL. Note that a number here will set ProgressCount to this value -2, (entering a 1 here will set ProgressCount to -1)
		ProgressCount: -1,
		//^Because when you set the "location.href" value, JS will stop executing codes beyond this point, the code has to be structured in a way that when it loads the next page, it first must increment "ProgressCount"
		// before setting "location.href". This means to load the first URL, this has to be -1, then execute LoadAnotherPage, which first increases -1 to 0, then load the URL at index 0.
		TimeoutDelay: 3000
	}
	LoadValuesFromStorage()
	//Menu commands
		GM.registerMenuCommand("Toggle UI", ToggleUI, "");
		function ToggleUI() {
			StorageSaved_URLs.ToggleUISetting = !StorageSaved_URLs.ToggleUISetting
			HTMLElement_DivBox2.hidden = !StorageSaved_URLs.ToggleUISetting
			SaveValuesToStorage()
		}
	async function Spawn_UI_Panel() {
		//Div box
			HTMLElement_DivBox = document.createElement("div")
			
			HTMLElement_DivBox2 = document.createElement("div")
			HTMLElement_DivBox2.hidden = !StorageSaved_URLs.ToggleUISetting
			HTMLElement_DivBox2.setAttribute("style", "position: fixed;top: 20px;right: 20px; z-index: 9999999999; background-color: rgba(64, 64, 64, .90); color: #ffffff; border-radius: 30px; padding: 15px;")
		//Title
			let Title = document.createElement("h2")
			Title.appendChild(document.createTextNode("URL sequence visit"))
			Title.setAttribute("style", "text-align: center;")
			HTMLElement_DivBox2.appendChild(Title)
			
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
		//Label for textarea
			let TextareaLabel = document.createTextNode("Enter your URLs here:")
			HTMLElement_DivBox2.appendChild(TextareaLabel)
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
		//Textarea to enter URLs
			HTMLElement_TextareaURLs = document.createElement("textarea")
			HTMLElement_TextareaURLs.value = StorageSaved_URLs.TextareaURLs
			HTMLElement_TextareaURLs.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #ffffff; color : #000000; font-family: monospace; resize: both; min-width: 300px")
			HTMLElement_TextareaURLs.addEventListener(
				"change",
				function () {
					let ListOfURLs = HTMLElement_TextareaURLs.value.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)
					if (ListOfURLs == null) {
						ListOfURLs = []
					}
					let TableToClear = Array.from(HTMLElement_ClippedDivBox.childNodes).forEach((Child) => { //Clear the table prior to updating
						HTMLElement_ClippedDivBox.removeChild(Child)
					})
					ListOfURLs = Array.from(new Set(ListOfURLs)) // in a set object form, a JSON cannot list set entries...
					
					StorageSaved_URLs.TextareaURLs = this.value
					StorageSaved_URLs.ListOfURLs = ListOfURLs
					
					SaveValuesToStorage()
					DisplayUniqueURLsList(ListOfURLs)
					HTMLElement_URLCounter.textContent = "Number of unique URLs: " + ListOfURLs.length
					HTMLElement_ProgressNumber.max = ListOfURLs.length.toString(10)
					HTMLElement_ProgressNumber.value = "1"
					StorageSaved_URLs.ProgressCount = -1
					
					NumberErrorHandler(HTMLElement_ProgressNumber.value)
					EnableDisableElements()
					UpdateProgressDisplay(StorageSaved_URLs.ProgressCount)
				}
			)
			HTMLElement_DivBox2.appendChild(HTMLElement_TextareaURLs)
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
		//List of unique URLs
			HTMLElement_DivBox2.appendChild(document.createTextNode("List of unique URLs:"))
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
			
			HTMLElement_ClippedDivBox = document.createElement("div")
			HTMLElement_ClippedDivBox.setAttribute("style", "overflow: scroll; border: solid 1px; resize: both; background-color : #000000; color : #ffffff;  height: 200px; font-family: monospace; max-width: 300px")
			DisplayUniqueURLsList(StorageSaved_URLs.ListOfURLs)
			
			HTMLElement_DivBox2.appendChild(HTMLElement_ClippedDivBox)
		//Number of URLs found
			let DivOfURLCount = document.createElement("div")
			DivOfURLCount.setAttribute("style", "font-family: monospace;")
			
			HTMLElement_URLCounter = document.createElement("span")
			HTMLElement_URLCounter.appendChild(document.createTextNode("Number of unique URLs: " + StorageSaved_URLs.ListOfURLs.length))
			DivOfURLCount.appendChild(HTMLElement_URLCounter)
			
			HTMLElement_DivBox2.appendChild(DivOfURLCount)
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
		//Number that indicates progress as well as letting the user enter a value to start at the nth URL
			HTMLElement_ProgressNumber_ErrorMsg = document.createElement("span")
			HTMLElement_ProgressNumber_ErrorMsg.appendChild(document.createTextNode("Error!"))
			HTMLElement_ProgressNumber_ErrorMsg.setAttribute("hidden", "")
		
			HTMLElement_ProgressNumber = document.createElement("input")
			HTMLElement_ProgressNumber.setAttribute("type", "number")
			HTMLElement_ProgressNumber.setAttribute("min", "1")
			HTMLElement_ProgressNumber.setAttribute("max", StorageSaved_URLs.ListOfURLs.length.toString(10))
			HTMLElement_ProgressNumber.value = (StorageSaved_URLs.ProgressCount+2).toString(10)
			HTMLElement_ProgressNumber.setAttribute("style", "font-family: monospace;")
			
			HTMLElement_ProgressNumber.addEventListener(
				"change",
				function () {
					StorageSaved_URLs.ProgressCount_EnteredString = this.value
					let EnteredNumber = checkIsStringValidInteger(this.value)
					if (isNaN(EnteredNumber)) {
						EnteredNumber = -1
					} else {
						if ((EnteredNumber >= 0) && (EnteredNumber < StorageSaved_URLs.ListOfURLs.length+1)) {
							StorageSaved_URLs.ProgressCount = EnteredNumber-2
							SaveValuesToStorage()
							UpdateProgressDisplay(StorageSaved_URLs.ProgressCount)
						}
					}
					//NumberErrorHandler(EnteredNumber)
					NumberErrorHandler(checkIsStringValidInteger(StorageSaved_URLs.ProgressCount_EnteredString))
				}
			)
			HTMLElement_DivBox2.appendChild(document.createTextNode("Next Position:"))
			HTMLElement_DivBox2.appendChild(HTMLElement_ProgressNumber)
			HTMLElement_DivBox2.appendChild(document.createTextNode(" "))
			HTMLElement_DivBox2.appendChild(HTMLElement_ProgressNumber_ErrorMsg)
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
		//Delay
			let DelayLabel = document.createElement("span")
			DelayLabel.appendChild(document.createTextNode("Delay before next:"))
			HTMLElement_DivBox2.appendChild(DelayLabel)
			
			HTMLElement_DelayBeforeNextPage = document.createElement("input")
			HTMLElement_DelayBeforeNextPage.setAttribute("type", "range")
			HTMLElement_DelayBeforeNextPage.setAttribute("min", "500")
			HTMLElement_DelayBeforeNextPage.setAttribute("max", "10000")
			HTMLElement_DelayBeforeNextPage.setAttribute("step", "500")
			HTMLElement_DelayBeforeNextPage.setAttribute("value", StorageSaved_URLs.TimeoutDelay.toString(10))
			HTMLElement_DelayBeforeNextPage.setAttribute("style", "width: 130px")
			HTMLElement_DelayBeforeNextPage.addEventListener(
				"input",
				function () {
					StorageSaved_URLs.TimeoutDelay = HTMLElement_DelayBeforeNextPage.value
					HTMLElement_DelaySettingDisplay.textContent = (parseInt(HTMLElement_DelayBeforeNextPage.value)/1000).toFixed(1) + " sec"
					SaveValuesToStorage()
				}
			)
			HTMLElement_DelaySettingDisplay = document.createElement("span")
			HTMLElement_DelaySettingDisplay.appendChild(document.createTextNode((parseInt(HTMLElement_DelayBeforeNextPage.value)/1000).toFixed(1) + " sec"))
			HTMLElement_DelaySettingDisplay.setAttribute("style", "font-family: monospace;")
			
			
			HTMLElement_DivBox2.appendChild(HTMLElement_DelayBeforeNextPage)
			HTMLElement_DivBox2.appendChild(HTMLElement_DelaySettingDisplay)
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
		//start and stop button
			HTMLElement_StartStopButton = document.createElement("Button")
			HTMLElement_StartStopButton.setAttribute("style", "width: 50px;")
			HTMLElement_StartStopButton.appendChild(document.createTextNode(AlternateStartStop()))
			HTMLElement_StartStopButton.addEventListener(
				"click",
				function () {
					StorageSaved_URLs.Running = !StorageSaved_URLs.Running
					HTMLElement_StartStopButton.textContent = AlternateStartStop()
					SaveValuesToStorage()
					EnableDisableElements()
					
					if (StorageSaved_URLs.Running) {
						LoadAnotherPage()
					} else {
						clearTimeout(TimeoutBeforeNextPage)
					}
				}
			)
			HTMLElement_DivBox2.appendChild(HTMLElement_StartStopButton)
			if (StorageSaved_URLs.ProgressCount >= StorageSaved_URLs.ListOfURLs.length-1) {
				HTMLElement_StartStopButton.setAttribute("disabled", "")
			}
			
			HTMLElement_DivBox2.appendChild(document.createElement("br"))
		//Progress display
			HTMLElement_ProgressDisplayText = document.createElement("span")
			HTMLElement_ProgressDisplayText.setAttribute("style", "font-family: monospace")
			
			HTMLElement_ProgressDisplayBar = document.createElement("div")
			UpdateProgressDisplay(StorageSaved_URLs.ProgressCount)
			HTMLElement_DivBox2.appendChild(HTMLElement_ProgressDisplayText)
			HTMLElement_DivBox2.appendChild(HTMLElement_ProgressDisplayBar)

		//Enable/disable elements
			NumberErrorHandler(checkIsStringValidInteger(StorageSaved_URLs.ProgressCount_EnteredString))
			EnableDisableElements()
		//Remove hidden attribute bc some sites uses it can affect this div box
//			Array.from(HTMLElement_DivBox2.getElementsByTagName("*")).forEach((Element) => {
//				if (Element.textContent != "Error!") {
//					Element.hidden = false
//				}
//			})
		//Add to document
			let Shadow = HTMLElement_DivBox.attachShadow({ mode: "closed" }); //thank you https://stackoverflow.com/questions/59868970/shadow-dom-elements-attached-to-shadow-dom-not-rendering
			Shadow.appendChild(HTMLElement_DivBox2)
			let HTMLBody = Array.from(document.getElementsByTagName("BODY")).find((Element) => {return true})
			let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
			if (InnerNodeOfHTMLBody.IsSuccessful) {
				document.body.insertBefore(HTMLElement_DivBox, HTMLBody.childNodes[0]);
			}
	}
	function AlternateStartStop() {
			let StopStartText = "Start"
			if (StorageSaved_URLs.Running) {
				StopStartText = "Stop"
			}
		return StopStartText
	}
	function DisplayUniqueURLsList(ArrayOfURLs) {
		if (ArrayOfURLs.length != 0) {
			let TableOfUniqueURLs = document.createElement("table")
			let TableRowHeader = document.createElement("tr")
			let TableDataHeaderIndex = document.createElement("th")
			TableDataHeaderIndex.appendChild(document.createTextNode("Position"))
			TableRowHeader.appendChild(TableDataHeaderIndex)
			let TableDataHeaderURL = document.createElement("th")
			TableDataHeaderURL.appendChild(document.createTextNode("URL"))
			TableRowHeader.appendChild(TableDataHeaderURL)
			TableOfUniqueURLs.appendChild(TableRowHeader)
			
			ArrayOfURLs.forEach((URL, Index) => {
				let TableRow = document.createElement("tr")
				let TableCell_Index = document.createElement("td")
				TableCell_Index.appendChild(document.createTextNode(Index+1))
				TableRow.appendChild(TableCell_Index)
				
				let TableCell_URL = document.createElement("td")
				TableCell_URL.appendChild(document.createTextNode(URL))
				TableRow.appendChild(TableCell_URL)
				
				TableOfUniqueURLs.appendChild(TableRow)
			})
			HTMLElement_ClippedDivBox.appendChild(TableOfUniqueURLs)
		}
	}
	if (TimeBeforeOrAfterLoad == 0) {
		window.addEventListener('load', LoadURLAfterTimer)
	} else {
		LoadURLAfterTimer()
	}
	function LoadURLAfterTimer() {
		if (StorageSaved_URLs.ProgressCount != StorageSaved_URLs.ListOfURLs.length-1) {
			TimeoutBeforeNextPage = setTimeout(LoadAnotherPage, StorageSaved_URLs.TimeoutDelay)
		} else {
			//StorageSaved_URLs.ProgressCount = -1
			//HTMLElement_ProgressNumber.value = "1"
			StorageSaved_URLs.Running = false
			HTMLElement_StartStopButton.textContent = AlternateStartStop()
		}
	}
	
	
	async function LoadAnotherPage() {
		if (StorageSaved_URLs.Running) {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				StorageSaved_URLs.ProgressCount++ //Increment to next page
				if (Number.isNaN(StorageSaved_URLs.ProgressCount) || StorageSaved_URLs.ProgressCount >= StorageSaved_URLs.ListOfURLs.length) { //failsafe
					StorageSaved_URLs.ProgressCount = -1
				}
				SaveValuesToStorage()
				if (StorageSaved_URLs.ProgressCount < StorageSaved_URLs.ListOfURLs.length && StorageSaved_URLs.ProgressCount >=0) {
					RaceConditionLock = false
					location.href = StorageSaved_URLs.ListOfURLs[StorageSaved_URLs.ProgressCount] //Code stops executing after this executes.
				}
			}
		}
	}
	function clamp(num, min, max) {
	//Restrict a number within a specified range.
		if (isNaN(num) == true) {
			num = 0
		}
		return num <= min ? min : num >= max ? max : num;
	}
	async function LoadValuesFromStorage() {
		StorageSaved_URLs = JSON.parse(await GM.getValue("SequenceURLVisit_SaveData", JSON.stringify(StorageSaved_URLs)).catch( () => {
			GetValueErrorMessage()
		}))
	}
	async function SaveValuesToStorage() {
		await GM.setValue("SequenceURLVisit_SaveData", JSON.stringify(StorageSaved_URLs)).catch( () => {
			SetValueErrorMessage()
		})
	}
	function GetValueErrorMessage() {
		console.log("TemplateScript - getvalue failed.")
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
	function checkIsStringValidInteger(string) {
		if (!/^\d+$/.test(string)) { //No decimals, no E notation, only pure digits allowed
			return NaN
		}
		return parseInt(string)
	}
	function NumberErrorHandler(EnteredNumber) {
		if (!Number.isNaN(EnteredNumber)) {
			if ((parseInt(EnteredNumber) >= 1) && (parseInt(EnteredNumber) <= StorageSaved_URLs.ListOfURLs.length)) { //In range and valid integer
				if (StorageSaved_URLs.ProgressCount < StorageSaved_URLs.ListOfURLs.length-1) {
					HTMLElement_StartStopButton.removeAttribute("disabled")
				}
				HTMLElement_ProgressNumber_ErrorMsg.setAttribute("hidden", "")
				HTMLElement_ProgressDisplayText.removeAttribute("hidden", "")
				HTMLElement_ProgressDisplayBar.removeAttribute("hidden", "")
				return
			}
		}
		HTMLElement_StartStopButton.setAttribute("disabled", "")
		HTMLElement_ProgressNumber_ErrorMsg.removeAttribute("hidden")
		HTMLElement_ProgressDisplayText.setAttribute("hidden", "")
		HTMLElement_ProgressDisplayBar.setAttribute("hidden", "")
	}
	function EnableDisableElements() {
		if (StorageSaved_URLs.ListOfURLs.length != 0) {
			//If running, disable textarea and the position number
			if (StorageSaved_URLs.ProgressCount < StorageSaved_URLs.ListOfURLs.length-1) {
				HTMLElement_StartStopButton.disabled = false
			}
			HTMLElement_ProgressNumber.disabled = false
			HTMLElement_TextareaURLs.disabled = false
			HTMLElement_TextareaURLs.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #ffffff; color : #000000; font-family: monospace; resize: both;")
			HTMLElement_ProgressNumber.disabled = false
			HTMLElement_DelayBeforeNextPage.disabled = false
			if (StorageSaved_URLs.Running) {
				HTMLElement_TextareaURLs.disabled = true
				HTMLElement_TextareaURLs.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #ffffff; color : #C0C0C0; font-family: monospace; resize: both;")
				HTMLElement_ProgressNumber.disabled = true
				HTMLElement_DelayBeforeNextPage.disabled = true
			}
		} else {
			//If no URLs, disable start/stop and position
			HTMLElement_StartStopButton.disabled = true
			HTMLElement_ProgressNumber.disabled = true
		}
	}
	function UpdateProgressDisplay(ProgressonNumber) {
		let ProgressPercentage = clamp(((ProgressonNumber+1) * 100 / StorageSaved_URLs.ListOfURLs.length), 0, 100)
		
		let ProgressText = "Progress: " + (ProgressonNumber+1).toString(10) + "/" + StorageSaved_URLs.ListOfURLs.length.toString(10) + ", " + ProgressPercentage.toFixed(2) + "%, Remaining: " + (StorageSaved_URLs.ListOfURLs.length - (ProgressonNumber+1)).toString(10)
		HTMLElement_ProgressDisplayText.textContent = ProgressText
		
		HTMLElement_ProgressDisplayBar.setAttribute("style", "background: linear-gradient(to right, #ffffff 0% " + ProgressPercentage.toString(10) + "%, #000000 " + ProgressPercentage.toString(10) + "% 100%); width: 300px; height: 10px; border-radius: 5px")
	}
})();