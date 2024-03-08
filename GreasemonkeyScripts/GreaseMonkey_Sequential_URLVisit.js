// ==UserScript==
// @name     Load URLs in a sequence.
// @version  1
// @grant    GM.setValue
// @grant    GM.getValue
// @grant    GM.registerMenuCommand
// @include      *
// ==/UserScript==
'use strict';

//Notes:
// -Anytime you edit this script and save, make sure you refresh the page so the loaded JS code reflect the changes.
// -Also, every time you start this script, ALWAYS reset this by going onto the Greasemonkey script menu on
//  "User Script Commands..." and click on "Stop and reset URL sequence" just in case the script bugs out and start
//  on whatever position last set.
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
	let HTMLElement_TextareaURLs = {}
	let HTMLElement_URLCounter = {}
	let HTMLElement_ProgressNumber = {}
	let HTMLElement_ProgressNumber_ErrorMsg = {}
	let HTMLElement_StartStopButton = {}
	let ClippedDivBox = {}
	let HTMLElement_ProgressDisplayText = {}
	let HTMLElement_ProgressDisplayBar = {}
	let StorageSaved_URLs = {
		TextareaURLs: "",
		ListOfURLs: [],
		Running: false,
		ProgressCount_EnteredString: "",
		ProgressCount: -1
	}
	LoadValuesFromStorage()
//-----------------------------------------------------------
	const ListOfURLs = `
https://google.com
https://wikipedia.org
	`
//-----------------------------------------------------------
	async function Spawn_UI_Panel() {
		//Div box
			let DivBox = document.createElement("div")
			DivBox.setAttribute("style", "position: fixed;top: 20px;right: 20px; z-index: 9999; background-color: rgba(64, 64, 64, .5); color: #ffffff; border-radius: 30px; padding: 15px;")
		//Title
			let Title = document.createElement("h2")
			Title.appendChild(document.createTextNode("URL sequence visit"))
			Title.setAttribute("style", "text-align: center;")
			DivBox.appendChild(Title)
			
			DivBox.appendChild(document.createElement("br"))
		//Label for textarea
			let TextareaLabel = document.createTextNode("Enter your URLs here:")
			DivBox.appendChild(TextareaLabel)
			DivBox.appendChild(document.createElement("br"))
		//Textarea to enter URLs
			HTMLElement_TextareaURLs = document.createElement("textarea")
			HTMLElement_TextareaURLs.value = StorageSaved_URLs.TextareaURLs
			HTMLElement_TextareaURLs.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #ffffff; color : #000000; font-family: monospace; resize: both; min-width: 300px")
			HTMLElement_TextareaURLs.addEventListener(
				"input",
				function () {
					let ListOfURLs = HTMLElement_TextareaURLs.value.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)
					if (ListOfURLs == null) {
						ListOfURLs = []
					}
					let TableToClear = Array.from(ClippedDivBox.childNodes).forEach((Child) => { //Clear the table prior to updating
						ClippedDivBox.removeChild(Child)
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
					UpdateProgressDisplay()
				}
			)
			DivBox.appendChild(HTMLElement_TextareaURLs)
			DivBox.appendChild(document.createElement("br"))
		//List of unique URLs
			DivBox.appendChild(document.createTextNode("List of unique URLs:"))
			DivBox.appendChild(document.createElement("br"))
			
			ClippedDivBox = document.createElement("div")
			ClippedDivBox.setAttribute("style", "overflow: scroll; border: solid 1px; resize: both; background-color : #000000; color : #ffffff;  height: 200px; font-family: monospace; max-width: 300px")
			DisplayUniqueURLsList(StorageSaved_URLs.ListOfURLs)
			
			DivBox.appendChild(ClippedDivBox)
		//Number of URLs found
			let DivOfURLCount = document.createElement("div")
			DivOfURLCount.setAttribute("style", "font-family: monospace;")
			
			HTMLElement_URLCounter = document.createElement("span")
			HTMLElement_URLCounter.appendChild(document.createTextNode("Number of unique URLs: " + StorageSaved_URLs.ListOfURLs.length))
			DivOfURLCount.appendChild(HTMLElement_URLCounter)
			
			DivBox.appendChild(DivOfURLCount)
			DivBox.appendChild(document.createElement("br"))
		//Number that indicates progress as well as letting the user enter a value to start at the nth URL
			HTMLElement_ProgressNumber_ErrorMsg = document.createElement("span")
			HTMLElement_ProgressNumber_ErrorMsg.appendChild(document.createTextNode("Error!"))
			HTMLElement_ProgressNumber_ErrorMsg.setAttribute("hidden", "")
		
			HTMLElement_ProgressNumber = document.createElement("input")
			HTMLElement_ProgressNumber.setAttribute("type", "number")
			HTMLElement_ProgressNumber.setAttribute("min", "1")
			HTMLElement_ProgressNumber.setAttribute("max", StorageSaved_URLs.ListOfURLs.length.toString(10))
			HTMLElement_ProgressNumber.value = (StorageSaved_URLs.ProgressCount+2).toString(10)
			
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
							UpdateProgressDisplay()
						}
					}
					//NumberErrorHandler(EnteredNumber)
					NumberErrorHandler(checkIsStringValidInteger(StorageSaved_URLs.ProgressCount_EnteredString))
				}
			)
			DivBox.appendChild(document.createTextNode("Next Position:"))
			DivBox.appendChild(HTMLElement_ProgressNumber)
			DivBox.appendChild(document.createTextNode(" "))
			DivBox.appendChild(HTMLElement_ProgressNumber_ErrorMsg)
			DivBox.appendChild(document.createElement("br"))
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
					
					LoadAnotherPage()
				}
			)
			DivBox.appendChild(HTMLElement_StartStopButton)
			DivBox.appendChild(document.createElement("br"))
		//Progress display
			HTMLElement_ProgressDisplayText = document.createElement("span")
			HTMLElement_ProgressDisplayText.setAttribute("style", "font-family: monospace")
			
			HTMLElement_ProgressDisplayBar = document.createElement("div")
			UpdateProgressDisplay()
			DivBox.appendChild(HTMLElement_ProgressDisplayText)
			DivBox.appendChild(HTMLElement_ProgressDisplayBar)

		//Enable/disable elements
			NumberErrorHandler(checkIsStringValidInteger(StorageSaved_URLs.ProgressCount_EnteredString))
			EnableDisableElements()
		//Add to document
			let HTMLBody = Array.from(document.getElementsByTagName("BODY")).find((Element) => {return true})
			let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
			if (InnerNodeOfHTMLBody.IsSuccessful) {
				document.body.insertBefore(DivBox, HTMLBody.childNodes[0]);
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
			ClippedDivBox.appendChild(TableOfUniqueURLs)
		}
	}
	
	if (TimeBeforeOrAfterLoad == 0) {
		window.addEventListener('load', LoadURLAfterTimer)
	} else {
		LoadURLAfterTimer()
	}
	
	function LoadURLAfterTimer() {
		setTimeout(LoadAnotherPage, TimeBeforeLoadingNextURL)
	}
	
	
	async function LoadAnotherPage() {
		if (StorageSaved_URLs.Running) {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				StorageSaved_URLs.ProgressCount++
				if (Number.isNaN(StorageSaved_URLs.ProgressCount) || StorageSaved_URLs.ProgressCount >= StorageSaved_URLs.ListOfURLs.length) {
					StorageSaved_URLs.ProgressCount = -1
				}
				SaveValuesToStorage()
				if (StorageSaved_URLs.ProgressCount <  StorageSaved_URLs.ListOfURLs.length && StorageSaved_URLs.ProgressCount >=0) {
					RaceConditionLock = false
					location.href = StorageSaved_URLs.ListOfURLs[StorageSaved_URLs.ProgressCount] //Code stops executing after this executes.
				} else {
					alert("Done!")
					StorageSaved_URLs.ProgressCount = -1
					StorageSaved_URLs.Running = false
					RaceConditionLock = false
					HTMLElement_StartStopButton.textContent = AlternateStartStop()
					EnableDisableElements()
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
				HTMLElement_StartStopButton.removeAttribute("disabled")
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
			HTMLElement_StartStopButton.disabled = false
			HTMLElement_ProgressNumber.disabled = false
			HTMLElement_TextareaURLs.disabled = false
			HTMLElement_TextareaURLs.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #ffffff; color : #000000; font-family: monospace; resize: both;")
			HTMLElement_ProgressNumber.disabled = false
			if (StorageSaved_URLs.Running) {
				HTMLElement_TextareaURLs.disabled = true
				HTMLElement_TextareaURLs.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #ffffff; color : #C0C0C0; font-family: monospace; resize: both;")
				HTMLElement_ProgressNumber.disabled = true
			}
		} else {
			//If no URLs, disable start/stop and position
			HTMLElement_StartStopButton.disabled = true
			HTMLElement_ProgressNumber.disabled = true
		}
	}
	function UpdateProgressDisplay() {
		let ProgressPercentage = clamp(((StorageSaved_URLs.ProgressCount+1) * 100 / StorageSaved_URLs.ListOfURLs.length), 0, 100)
		
		let ProgressText = "Progress: " + (StorageSaved_URLs.ProgressCount+1).toString(10) + "/" + StorageSaved_URLs.ListOfURLs.length.toString(10) + ", " + ProgressPercentage.toFixed(2) + "%, Remaining: " + (StorageSaved_URLs.ListOfURLs.length - (StorageSaved_URLs.ProgressCount+1)).toString(10)
		HTMLElement_ProgressDisplayText.textContent = ProgressText
		
		HTMLElement_ProgressDisplayBar.setAttribute("style", "background: linear-gradient(to right, #ffffff 0% " + ProgressPercentage.toString(10) + "%, #000000 " + ProgressPercentage.toString(10) + "% 100%); width: 300px; height: 10px; border-radius: 5px")
	}
})();