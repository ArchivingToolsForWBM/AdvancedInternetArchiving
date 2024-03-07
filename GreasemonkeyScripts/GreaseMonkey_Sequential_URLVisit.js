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
	let HTMLElement_URLCounter = {}
	let ClippedDivBox = {}
	let StorageSaved_URLs = {
		TextareaURLs: "",
		ListOfURLs: []
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
			let Textarea_userEntersURLs = document.createElement("textarea")
			Textarea_userEntersURLs.value = StorageSaved_URLs.TextareaURLs
			Textarea_userEntersURLs.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll; background-color : #ffffff; color : #000000; font-family: monospace; resize: both;")
			Textarea_userEntersURLs.addEventListener(
				"input",
				function () {
					let ListOfURLs = Textarea_userEntersURLs.value.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)
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
				}
			)
			DivBox.appendChild(Textarea_userEntersURLs)
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
		//Add to document
			let HTMLBody = Array.from(document.getElementsByTagName("BODY")).find((Element) => {return true})
			let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
			if (InnerNodeOfHTMLBody.IsSuccessful) {
				document.body.insertBefore(DivBox, HTMLBody.childNodes[0]);
			}
	}
	function DisplayUniqueURLsList(ArrayOfURLs) {
		if (ArrayOfURLs.length != 0) {
			let TableOfUniqueURLs = document.createElement("table")
			let TableRowHeader = document.createElement("tr")
			let TableDataHeaderIndex = document.createElement("th")
			TableDataHeaderIndex.appendChild(document.createTextNode("Index"))
			TableRowHeader.appendChild(TableDataHeaderIndex)
			let TableDataHeaderURL = document.createElement("th")
			TableDataHeaderURL.appendChild(document.createTextNode("URL"))
			TableRowHeader.appendChild(TableDataHeaderURL)
			TableOfUniqueURLs.appendChild(TableRowHeader)
			
			ArrayOfURLs.forEach((URL, Index) => {
				let TableRow = document.createElement("tr")
				let TableCell_Index = document.createElement("td")
				TableCell_Index.appendChild(document.createTextNode(Index))
				TableRow.appendChild(TableCell_Index)
				
				let TableCell_URL = document.createElement("td")
				TableCell_URL.appendChild(document.createTextNode(URL))
				TableRow.appendChild(TableCell_URL)
				
				TableOfUniqueURLs.appendChild(TableRow)
			})
			ClippedDivBox.appendChild(TableOfUniqueURLs)
		}
	}
	async function Reset() {
		await GM.setValue("URLIndex", -1);
		await GM.setValue("URLSequence", false);
	}
	GM.registerMenuCommand("Stop and reset URL sequence", Reset, "R");
	
	async function StartSequence() {
		await GM.setValue("URLIndex", -1);
		await GM.setValue("URLSequence", true);
		LoadURLAfterTimer()
	}
	GM.registerMenuCommand("Start URL sequence", StartSequence, "S");
	
	if (TimeBeforeOrAfterLoad == 0) {
		window.addEventListener('load', LoadURLAfterTimer)
	} else {
		LoadURLAfterTimer()
	}
	
	function LoadURLAfterTimer() {
		setTimeout(LoadAnotherPage, TimeBeforeLoadingNextURL)
	}
	
	
	async function LoadAnotherPage() {
		let IsSequenceOn = await GM.getValue("URLSequence", false);
		if (IsSequenceOn) {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				let URL_index = await GM.getValue("URLIndex", -1);
				URL_index++
				if (Number.isNaN(URL_index)||URL_index>=ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length) {
					URL_index = -1
				}
				await GM.setValue("URLIndex", URL_index);
				if (URL_index < ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length&&URL_index>=0) {
					console.log("Sequence URL progress: " + BigInt(URL_index+1).toString(10) + "/" + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length).toString(10) + " (" + clamp(((URL_index+1)*100)/ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length).toFixed(2) + "%, " + BigInt(ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g).length-URL_index-1).toString(10) + " remaining, Visiting: " + ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] + " )")
					RaceConditionLock = false
					location.href = ListOfURLs.match(/http(s)?\:\/\/(?!data:)[^\s\"\']+/g)[URL_index] //Code stops executing after this executes.
				} else {
					alert("Done!")
					Reset()
					RaceConditionLock = false
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
})();