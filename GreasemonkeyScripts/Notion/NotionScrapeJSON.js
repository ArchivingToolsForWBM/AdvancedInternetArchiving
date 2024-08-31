// ==UserScript==
// @name         Notion-scrape
// @namespace    https://*.notion.*/
// @version      0.2
// @description  try to take over the world!
// @include      https://*.notion.site/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// ==/UserScript==

(() => {
	//Notes
	//-Make sure you do not click on anything that would bring up a popup box of another page. This script runs a code that clicks every "show more"
	// buttons at an interval to ensure all its content is loaded prior to grabbing content. To avoid this, always open the links in a new tab.
	
	
	
	
	
	//Initialize some values
		let SavedData = {
			Settings: {
				OnOffState: false,
				ScanFrequency: 3000
			},
			ScrapedContent: []
		}
		LoadSavedValues()
	//Don't touch
		let RegExpPreset_BlankOrJustSpaces = /^$[\s\u200B]*/
		let RegExpPreset_ClassNotionBlockName = /notion-(?:text|image|column_list|(?:sub_)+header|toggle)-block/
		
		setInterval(RevealAll, 2000)
		setTimeout(SpawnUI, 2000)
		let ExtractorTimeout = setTimeout(ExtractPageContent, SavedData.Settings.ScanFrequency)
	//Elements to remember (best not to touch)
		let UI_Button_OnOff = null
		let UI_TextDisplay_ScrapedPageCount = null
		let UI_InputRange_ScanFrequency_Display = null
	
	
	function RevealAll() {
		//This finds all the "chevron" or any buttons that reveal content without opening an entire new page
		let ClickToViewButtons = [...document.querySelectorAll("svg")].filter(ele => {
			try {
				if (!ele.classList[0] == "triangle") {
					return false
				}
				let ClickableElementToTrigger = ele.parentElement
				if (ClickableElementToTrigger.ariaExpanded != "false") {
					return false
				}
				return true
			} catch {
				return false
			}
		})
		ClickToViewButtons.forEach(ele => {
			let ClickableElementToTrigger = ele.parentElement
			ClickableElementToTrigger.click()
		})
		let CheveronButtons = [...document.querySelectorAll("svg")].filter(ele => {
			try {
				if (!(/(?:chevronDown|chevronDownThin)/).test(ele.classList[0])) {
					return false
				}
				let ListOfPageFilters = ele.parentElement.parentElement.parentElement
				if (ListOfPageFilters != null) {
					let ListOfPageFilterArr = [...ListOfPageFilters.childNodes]
					
					if (ListOfPageFilterArr.at(-1).textContent == "Add filter") {
						return false
					}
				}
				let ClickableElementToTrigger = ele
				if (ClickableElementToTrigger.style.transform == "rotate(180deg)") {
					return false
				}
				return true
			} catch {
				return false
			}
			
		})
		CheveronButtons.forEach(ele => {
			try {
				ele.parentNode.click()
			} catch {}
			
		})
		let LoadMoreButtons = getElementsByText(document, /Load more/, "*")
		LoadMoreButtons.forEach(ele => ele.click())
		let ShowDescriptionButtons = [...document.querySelectorAll("div")].filter(ele => {
			try {
				let Text = ele.childNodes[1].textContent
				if (Text != "Show description") {
					return false
				}
				return true
			} catch {
				return false
			}
		})
		ShowDescriptionButtons.forEach(ele => ele.click())
	}
	function SpawnUI() {
		let DivBox = document.createElement("div")
		//BoxOfUI.setAttribute("style", "position: fixed;bottom: 40px;right: 40px;z-index: 999; background-color: rgba(64, 64, 64, .5); color: #ffffff; border-radius: 30px; padding: 15px;")
		DivBox.style.position = "fixed"
		DivBox.style.bottom = "40px"
		DivBox.style.right = "40px"
		DivBox.style.zIndex = "999"
		DivBox.style.backgroundColor = "rgba(64, 64, 64, .5)"
		DivBox.style.color = "#ffffff"
		DivBox.style.borderRadius = "30px"
		DivBox.style.padding = "15px"
		
		
		try {
			let DivBoxToPlaceIn = document.querySelector("body")
			DivBoxToPlaceIn.appendChild(DivBox)
		} catch (e) {
			window.alert("Failed to place notion scrape UI")
		}
		//On off button
			UI_Button_OnOff = document.createElement("button")
			UI_Button_OnOff.textContent = "Start"
			if (SavedData.Settings.OnOffState) {
				UI_Button_OnOff.textContent = "Stop"
			}
			UI_Button_OnOff.style.width = "50px"
			UI_Button_OnOff.style.color = "#000000"
			UI_Button_OnOff.addEventListener(
				"click",
				function () {
					SavedData.Settings.OnOffState = !SavedData.Settings.OnOffState
					this.textContent = "Start"
					if (SavedData.Settings.OnOffState) {
						this.textContent = "Stop"
						ExtractPageContent()
					} else {
						clearTimeout(ExtractorTimeout)
					}
					SaveSavedValues()
				}
			)
			DivBox.appendChild(UI_Button_OnOff)
		//Copy scraped data
			let UI_CopyScrapeJson = document.createElement("button")
			UI_CopyScrapeJson.textContent = "Copy Scraped data"
			UI_CopyScrapeJson.style.color = "#000000"
			UI_CopyScrapeJson.addEventListener(
				"click",
				function () {
					GM.setClipboard(JSON.stringify(SavedData.ScrapedContent, null, " "))
				}
			)
			DivBox.appendChild(UI_CopyScrapeJson)
		//Clear scraped data
			let UI_ClearScrapedData = document.createElement("button")
			UI_ClearScrapedData.textContent = "Clear Scraped data"
			UI_ClearScrapedData.style.color = "#000000"
			UI_ClearScrapedData.addEventListener(
				"click",
				function () {
					if (window.confirm("Are you sure you want to clear it?")) {
						SavedData.ScrapedContent = []
						SaveSavedValues()
					}
				}
			)
			DivBox.appendChild(UI_ClearScrapedData)
			DivBox.appendChild(document.createElement("br"))
		//Table of settings
			let UI_TableSettings = document.createElement("table")
			
			let UI_TableSettings_Row_ScanFrequency = document.createElement("tr")
			UI_TableSettings.appendChild(UI_TableSettings_Row_ScanFrequency)
			
			let UI_TableSettings_Cell_ScanFrequency_Key = document.createElement("td")
			UI_TableSettings_Cell_ScanFrequency_Key.style.padding = "5px"
			UI_TableSettings_Cell_ScanFrequency_Key.appendChild(document.createTextNode("Scan frequency"))
			UI_TableSettings_Cell_ScanFrequency_Key.style.alignContent = "center"
			UI_TableSettings_Row_ScanFrequency.appendChild(UI_TableSettings_Cell_ScanFrequency_Key)
			
			let UI_TableSettings_Cell_ScanFrequency_Value = document.createElement("td")
			UI_TableSettings_Cell_ScanFrequency_Value.style.padding = "5px"
			UI_TableSettings_Cell_ScanFrequency_Value.style.textAlign = "center"
			UI_TableSettings_Row_ScanFrequency.appendChild(UI_TableSettings_Cell_ScanFrequency_Value)
			
			DivBox.appendChild(UI_TableSettings)
		//Scan frequency
			let UI_InputRange_ScanFrequency = document.createElement("input")
			UI_InputRange_ScanFrequency.type = "range"
			UI_InputRange_ScanFrequency.min = "500"
			UI_InputRange_ScanFrequency.max = "10000"
			UI_InputRange_ScanFrequency.step = "500"
			UI_InputRange_ScanFrequency.style.appearance = "auto"
			UI_InputRange_ScanFrequency.value = SavedData.Settings.ScanFrequency.toString(10)
			UI_InputRange_ScanFrequency.addEventListener(
				"input",
				function () {
					let NumberValue = parseInt(this.value)
					SavedData.Settings.ScanFrequency = NumberValue
					SaveSavedValues()
					UI_InputRange_ScanFrequency_Display.textContent = (NumberValue/1000).toFixed(1) + " Sec"
				}
			)
			UI_TableSettings_Cell_ScanFrequency_Value.appendChild(UI_InputRange_ScanFrequency)
			UI_TableSettings_Cell_ScanFrequency_Value.appendChild(document.createElement("br"))
			
			UI_InputRange_ScanFrequency_Display = document.createElement("span")
			UI_InputRange_ScanFrequency_Display.style.fontFamily = "monospace"
			UI_InputRange_ScanFrequency_Display.style.textAlign = "center"
			UI_InputRange_ScanFrequency_Display.appendChild(document.createTextNode((SavedData.Settings.ScanFrequency/1000).toFixed(1) + " Sec" ))
			UI_TableSettings_Cell_ScanFrequency_Value.appendChild(UI_InputRange_ScanFrequency_Display)
		//Statistics
			let StatisticsTable = document.createElement("table")
			let StatisticsTable_Row_ScrapePageCount = document.createElement("tr")
			StatisticsTable.appendChild(StatisticsTable_Row_ScrapePageCount)
			
			let StatisticsTable_Cell_ScrapeCountKey = document.createElement("td")
			StatisticsTable_Cell_ScrapeCountKey.style.fontFamily = "monospace"
			StatisticsTable_Cell_ScrapeCountKey.appendChild(document.createTextNode("Number of scraped pages: "))
			StatisticsTable_Cell_ScrapeCountKey.style.padding = "5px"
			StatisticsTable_Row_ScrapePageCount.appendChild(StatisticsTable_Cell_ScrapeCountKey)
			
			let StatisticsTable_Cell_ScrapeCountValue = document.createElement("td")
			StatisticsTable_Cell_ScrapeCountValue.style.fontFamily = "monospace"
			UI_TextDisplay_ScrapedPageCount = StatisticsTable_Cell_ScrapeCountValue
			StatisticsTable_Cell_ScrapeCountValue.appendChild(document.createTextNode("0"))
			StatisticsTable_Cell_ScrapeCountValue.style.padding = "5px"
			StatisticsTable_Row_ScrapePageCount.appendChild(StatisticsTable_Cell_ScrapeCountValue)
			
			UI_TextDisplay_ScrapedPageCount.textContent = SavedData.ScrapedContent.length.toString(10)
			
			DivBox.appendChild(StatisticsTable)
			
			UpdateUIInfoDisplay()
	}
	function ExtractPageContent() {
		if (!SavedData.Settings.OnOffState) {
			return
		}
		
		let CollectedDataOfPage = {
			PageURL: location.href.replace(/\?pvs=\d*$/),
			PageContent: []
		}
		let ReferenceNode = document.querySelector(".layout-content") //Start at the title header
		if (ReferenceNode != null) { //Rid out blank stuff
			let Contents = [...ReferenceNode.parentElement.childNodes]
			Contents = Contents.filter(ele => {
				if (ele.innerHTML == "") {
					return false
				}
				if (RegExpPreset_BlankOrJustSpaces.test(ele.textContent) && [...ele.querySelectorAll("img")].length == 0) {
					return false
				}
				return true
			})
			
			let ExtractedPageContent = Contents.map((ContentThing, Index) => {
				let Data = GetContentFromSection(ContentThing, Index)
				return (Data)
			});
			CollectedDataOfPage.PageContent = ExtractedPageContent
			
			let DuplicateItemIndex = SavedData.ScrapedContent.findIndex(PageOfContent => { //Find duplicates
				return CollectedDataOfPage.PageURL == PageOfContent.PageURL
			})
			
			if (DuplicateItemIndex == -1) { //If no dupes found, insert it.
				SavedData.ScrapedContent.push(CollectedDataOfPage)
				SaveSavedValues()
			} else { //Otherwise replace what we already have with potentially a newer version
				SavedData.ScrapedContent[DuplicateItemIndex] = CollectedDataOfPage
			}

		} else { //"gallery" page
			
			
		}
		ExtractorTimeout = setTimeout(ExtractPageContent, SavedData.Settings.ScanFrequency)
	}
	
	function GetContentFromSection(node, Index) {
		let OutputObject = {
			Type: "",
			Contents: []
		}
		//Identify type
			OutputObject.Type = (() => {
				try {
					let Role = node.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].role ?? ""
					if (Role == "table") {
						return "Table"
					}
					let ColumnGalleryNode = [...node.childNodes[0].childNodes]
					let NonNotionBlock = ColumnGalleryNode.find(ColumnGalleryBlock => { //Try to find a thing that isn't a notion block content
						return (!RegExpPreset_ClassNotionBlockName.test(ColumnGalleryBlock.getAttribute("class")))
					})
					
					if (typeof NonNotionBlock == "undefined") {
						return "ContentColumn"
					}
					
					let a = 0
				} catch (e) {
					return "Unknown"
				}
				
				
			})(node);

			
		//Extract differently based on type
			if (Index == 0) {
				//Image/mugshot and title.
				let TitleObject = {}
				OutputObject.Type = "Header"
				TitleObject.Title = node.textContent
				TitleObject.Images = [...node.querySelectorAll("img")].map(Image => FormatNotionImageURL(FormatNotionImageURL(Image.src)))
				OutputObject.Contents.push(TitleObject)
			} else if (OutputObject.Type == "Table") {
				//Table
				let TableRows = [...node.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes]
				OutputTableObjectFormatted = TableRows.map(Row => {
					let OutputTableRows = {}
					let Cells = [...Row.childNodes[0].childNodes]
					OutputTableRows.TableKey = Cells[0].textContent
					OutputTableRows.TableValue = {
						Text: Cells[1].innerText
					}
					try {
						OutputTableRows.TableValue.HTMLCode = Cells[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].innerHTML ?? "?" //SVG, background images, images, so innerHTML works here.
					} catch {}
					let Links = ExtractLinks(Cells[1])
					if (Links.length != 0) {
						OutputTableRows.Links = Links
					}
					
					return OutputTableRows
				})
				OutputObject.Contents = OutputTableObjectFormatted
			} else if (OutputObject.Type == "ContentColumn") {
				
				let ContentColumn = [...node.childNodes[0].childNodes]
				OutputNotionColumnConverted = ContentColumn.map(NotionBlock => {
					try {
						let NotionBlockName = (NotionBlock.getAttribute("class")).match(RegExpPreset_ClassNotionBlockName)[0]
						if (NotionBlockName == "notion-image-block") {
							let Image = NotionBlock.querySelector("img")
							let ImageURL = FormatNotionImageURL(Image.src)
							return {
								Image: ImageURL
							}
						} else if (/notion-(?:text|(?:sub_)+header)-block/.test(NotionBlockName)) {
							let OutputNotionBlock = {
								Text: NotionBlock.innerText
							}
							let Links = ExtractLinks(NotionBlock)
							if (Links.length != 0) {
								OutputNotionBlock.Links = Links
							}
							return OutputNotionBlock
						} else if (NotionBlockName == "notion-column_list-block") {
							let NotionListBlock = {Type: "List"}
							let SubBlocksNode = NotionBlock.childNodes[0]
							let OutputList = GetListSubBlocks(SubBlocksNode)
							NotionListBlock.Contents = OutputList
							return NotionListBlock
						} else if (NotionBlockName == "notion-toggle-block") {
							let SubBlocksToggle = GetToggleBlockData(NotionBlock.childNodes[0].childNodes[1])
							return SubBlocksToggle
						}
					} catch {
						return {
							Error: "Unknown ContentColumn format",
							HTMLContent: NotionBlock.innerHTML
						}
					}
				})
				OutputObject.Contents = OutputNotionColumnConverted
			}
		//Done
			return OutputObject
	}
	function GetListSubBlocks(node) {
		let ListOfBlocks = [...node.querySelectorAll(".notion-image-block,notion-text-block")]
		OutputList = ListOfBlocks.map(Block => {
			try {
				let BlockType = Block.getAttribute("class").match(RegExpPreset_ClassNotionBlockName)[0]
				if (BlockType == "notion-image-block") {
					let ImageTag = Block.querySelector("img")
					let ImageURL = FormatNotionImageURL(ImageTag.src)
					return {
						Image: ImageURL
					}
				} else if (BlockType == "notion-text-block") {
					let OutputNotionBlock = {
						Text: Block.innerText
					}
					let Links = ExtractLinks(Block)
					if (Links.length != 0) {
						OutputNotionBlock.Links = Links
					}
					return OutputNotionBlock
				}
			} catch (e) {
				return {
					Error: "Unknown subblocks type",
					ErrorTitle: e,
					HTMLCode: Block.innerHTML
				}
			}
		})
		return OutputList
	}
	function GetNotionBlocks(node) {
		let BlocksArray = [...node.childNodes]
		let OutputObjectArr = BlocksArray.map(Block => {
			try {
				let BlockType = Block.getAttribute("class").match(RegExpPreset_ClassNotionBlockName)[0]
				if (BlockType == "notion-text-block") {
					let OutputObject = {
						ToggleTitleText: Block.innerText,
					}
					let Links = ExtractLinks(Block)
					if (Links.length != 0) {
						OutputObject.Links = Links
					}
					return OutputObject
				} else if (BlockType == "notion-image-block") {
					let Images = [...Block.querySelectorAll("img")].map(Image => FormatNotionImageURL(FormatNotionImageURL(Image.src)))
					return {Images: Images}
				}
			} catch {
				return {
					Error: "Error. Unknown format",
					HTML: Block.innerHTML
				}
			}
			
		})
		return OutputObjectArr
	}
	//Saved and Statistics
		async function LoadSavedValues() {
			try {
				SavedData = JSON.parse(await GM.getValue("Notion_Scrape_SavedData", JSON.stringify(SavedData)))
			} catch (e) {
				window.alert("Issue with Loading data. " + e)
			}
			
		}
		async function SaveSavedValues() {
			try {
				await GM.setValue("Notion_Scrape_SavedData", JSON.stringify(SavedData))
				UpdateUIInfoDisplay()
			} catch (e) {
				window.alert("Issue with Saving data. " + e)
			}
		}
		function UpdateUIInfoDisplay() {
			UI_TextDisplay_ScrapedPageCount.textContent = SavedData.ScrapedContent.length.toString(10)
		}
	function GetToggleBlockData(node) {
		let Output = {Type: "Toggle"}
		let ListOfDivs = [...node.childNodes]
		let OutputToggleList = ListOfDivs.map((ToggleBlock, Index) => {
			if ((!RegExpPreset_BlankOrJustSpaces.test(ToggleBlock.innerText)) && Index == 0) {
				let Text = ToggleBlock.innerText
				return {
					Title: ToggleBlock.innerText
				}
			} else {
				try {
					let NotionBlocksOfToggle = GetNotionBlocks(ToggleBlock.childNodes[0])
					return NotionBlocksOfToggle
				} catch (e) {
					return "Error! Unknown format"
				}
			}
			
		})
		Output.ToggleItems = OutputToggleList
		return Output
	}
	//Helper
		function getElementsByText(ObjReference, RegexText, Tag) {
			return Array.prototype.slice.call(ObjReference.getElementsByTagName(Tag)).filter(el => RegexText.test(el.textContent.trim())).filter((el) => (el.children.length == 0)&&(el.tagName != "SCRIPT"));
		}
		function AscendParentElement(ElementToAscend, NumberOfTimes) {
			try {
				for (let i=0; i<NumberOfTimes; i++) {
					ElementToAscend = ElementToAscend.parentNode
				}
				return ElementToAscend
			} catch {
				return undefined
			}
		}
		function isAncestorsStyleDisplayNone(Node) {
			//returns true if the ancestors of the node tree contains
			//"display: none"
			let isHidden = false
			let CurrentNode = Node
			if (typeof CurrentNode.style.display != "undefined") { //If right at the node we are just on is hidden, immediately flag this as true
				if ((CurrentNode.style.display == "none")||(getComputedStyle(CurrentNode).display == "none")) {
					return true
				}
			}
			while ((CurrentNode.parentNode != null) && (!isHidden)) {
				CurrentNode = CurrentNode.parentNode
				if (typeof CurrentNode.style != "undefined") {
					if (typeof CurrentNode.style.display != "undefined") {
						if ((CurrentNode.style.display == "none")||(getComputedStyle(CurrentNode).display == "none")) {
							isHidden = true
						}
					}
				}
			}
			return isHidden
		}
		function FormatNotionImageURL(string) {
			let RegexToFindReplace = /^(https:\/\/[a-zA-Z0-9_\-]+\.notion\.site\/image\/https%3A%2F%2F(s3-us-west-2\.amazonaws\.com|prod-files-secure\.s3\.us-west-2\.amazonaws\.com)%2F(?:(?!&width=\d+).)*).*$/ //thank you https://stackoverflow.com/a/3850095/11030779 , match all string, up to but not including "&width=<number>"
			return string.replace(RegexToFindReplace, "$1")
		}
		function ExtractLinks(Node) {
			let Links = [...Node.querySelectorAll("a")].filter(Link => {
				if (typeof Link.href == "undefined") { //Failsafe if there are anchor tags without a link to another page
					return false
				}
				return true
			}).map(Link => Link.href)
			return Links
		}
})();