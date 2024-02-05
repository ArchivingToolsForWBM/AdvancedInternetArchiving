// ==UserScript==
// @name         WBGS - utility
// @namespace    WBGS_autocheck
// @version      0.1
// @description  So duped processes don't overwrite save results.
// @include      https://archive.org/services/wayback-gsheets/*
// @grant        none
// ==/UserScript==

(function() {
	//Settings
		const IntervalDelay = 100
			//^Had to be an interval instead of a timeout because when you click on links to another WBGS page, that isn't a page refresh
			// rather a dynamic page (https://en.wikipedia.org/wiki/Dynamic_web_page ) similar to being on twitter and clicking on links
			// to another twitter page, which result in this JS code not executing until you refresh the page.
		const MaxClickAllAborts = 0
			//^Option to auto-click each "abort" button on processes that finished-locked - processes that have finished but didn't
			// disappear on the WBGS home page. 0 = no, 1 = yes, 2+ = number of times to click each abort button (if it doesn't
			// respond).
		const DisplayEasyCopyableListOfProcess = true
			//^false = no, true = yes (will print out a statement once per page refresh on the console log that you can copy in case of a
			// bug of some sort on processes)
	//Don't touch unless you know what you're doing
		setInterval(Code, IntervalDelay)
		const ListOfTrackingURLs = new Set()
		let RaceConditionLock = false
		let ClickAllAbortsCount = 0
		let HavePrintedListOfProcess = false
		
		
		function Code() {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				let CurrentWBGSURL = window.location.href
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
						ProcessTrackingURLString = document.querySelectorAll("small")[1].innerText.match(/https:\/\/archive\.org\/services\/wayback-gsheets\/check[^\s]+$/)[0]
						if (ListOfTrackingURLs.has(ProcessTrackingURLString)==false) {
							console.log("Tracking URL: " + ProcessTrackingURLString.replace(/^https/, "ttps")) //URLs in the console log gets truncated and the text may not be preserved depending on browser.
							ListOfTrackingURLs.add(ProcessTrackingURLString)
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
								return {
									TrackingURL: WBGSProcess.childNodes[5].childNodes[0].href,
									JobID: WBGSProcess.childNodes[5].childNodes[0].href.match(/(?<=https:\/\/archive\.org\/services\/wayback-gsheets\/check\?job_id=)[a-zA-Z\d\-]+/)[0],
									GSheetURL: WBGSProcess.childNodes[0].innerText,
									StartedTime: WBGSProcess.childNodes[1].innerText,
									Status: WBGSProcess.childNodes[4].innerText
								}
							})
							console.log(JSON.stringify(OBJ_WBGS_Info, "", " "))
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
})();