// ==UserScript==
// @name         Notion-scrape
// @namespace    https://*.notion.*/
// @version      0.2
// @description  Collects notion content
// @include      /^https://[a-zA-Z\d_\-]+.notion.site/.*/
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// ==/UserScript==

(() => {
	//Notes
	//-Make sure you do not click on anything that would bring up a popup box of another page. This script runs a code that clicks every "show more"
	// buttons at an interval to ensure all its content is loaded prior to grabbing content. To avoid this, always open the links in a new tab.
	//
	//Note to self
	//-Elements of notion blocks conveniently have [data-block-id="<NotionBlockId>"] in the HTML tags, where <NotionBlockId> is the ID formatted
	// ********-****-****-****-************ where the "*" is a number and letter (both upper and lowercase).
	//
	
	
	
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
		const RegExpPreset_BlankOrJustSpaces = /^$[\s\u200B]*/
		const RegExpPreset_ClassNotionBlockName = /notion-(?:text|image|column_list|(?:sub_)+header|toggle)-block/
		const RegExpPreset_NotionPage = /https:\/\/[a-zA-Z\d_\-]+\.notion.[a-zA-Z\d_\-]+\/[a-zA-Z\d_\-]+/
		
		setInterval(RevealAll, 1000)
		setTimeout(SpawnUI, 2000)
		let ExtractorTimeout = setTimeout(ExtractPageContent, SavedData.Settings.ScanFrequency)
		let FunctionRecursionCounter = 0 //Prevents recursive functions from potentially cause out-of-memory errors
		const FunctionRecursionCounter_Limit = 100
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
			UI_ClearScrapedData.textContent = "Reset"
			UI_ClearScrapedData.style.color = "#000000"
			UI_ClearScrapedData.addEventListener(
				"click",
				function () {
					if (window.confirm("Are you sure you want to clear it?")) {
						SavedData.ScrapedContent = []
						clearTimeout(ExtractorTimeout)
						SavedData.OnOffState = false
						UI_Button_OnOff.textContent = "Start"
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
		
		let OutputPageData = {
			PageURL: location.href.replace(/\?pvs=\d*$/),
			PageContent: {}
		}
		
		let ReferenceNode_HeaderStuff = null
		try {
			ReferenceNode_HeaderStuff = document.querySelector(".notion-frame").childNodes[0].childNodes[0].childNodes[1].childNodes[1]
		} catch {}
		let ReferenceNode_MainContentBlocks = null
		try {
			ReferenceNode_MainContentBlocks = document.querySelector(".notion-frame").childNodes[0].childNodes[0]
		} catch {
			window.alert("Unknown page type for getting main content blocks")
			return
		}
		OutputPageData.PageContent.PageHeader = []
		OutputPageData.PageContent.PageHeader = GetPageHeader(ReferenceNode_HeaderStuff)
		OutputPageData.PageContent.ContentBlocks = GetBlocksRecusively(ReferenceNode_MainContentBlocks)
		
		//Handle duplicates
			let DuplicateItemIndex = SavedData.ScrapedContent.findIndex(PageOfContent => { //Find duplicates
				return OutputPageData.PageURL == PageOfContent.PageURL
			})
			
			if (DuplicateItemIndex == -1) { //If no dupes found, insert it.
				SavedData.ScrapedContent.push(OutputPageData)
				SaveSavedValues()
			} else { //Otherwise replace what we already have with potentially a newer version
				SavedData.ScrapedContent[DuplicateItemIndex] = OutputPageData
			}
		
		ExtractorTimeout = setTimeout(ExtractPageContent, SavedData.Settings.ScanFrequency)
	}
	function GetPageHeader(node) {
		let OutputStuff = [...node.childNodes].filter(ele => {
			let IsNotationPageBlockExists = ele.querySelector(".notion-page-block")
			if (IsNotationPageBlockExists == null) {
				return false
			}
			return true
		})
		OutputStuff.pop() //Remove content page part
		
		OutputStuff = OutputStuff.map(ele => {
			let ReturnedObject = {
				HTMLCode: ele.innerHTML
			}
			let WhatToGetFrom = ele
			let Table = ele.querySelector("div[role=table]")
			if (Table != null) {
				WhatToGetFrom = Table
			}
			let Text = ExtractInnerText(WhatToGetFrom)
			if (Text != null) {
				ReturnedObject.Text = Text
			}
			let Links = ExtractLinks(WhatToGetFrom)
			if (Links.length != 0) {
				ReturnedObject.Links = Links
			}
			let Images = ExtractImages(WhatToGetFrom)
			if (Images.length != 0) {
				ReturnedObject.Images = Images
			}
			return ReturnedObject
		});
		return OutputStuff
	}
	function GetBlocksRecusively(node) {
		//Recursive function, the main code that grabs main constent stuff.
		
		FunctionRecursionCounter++
		if (FunctionRecursionCounter >= FunctionRecursionCounter_Limit) {
			window.alert("GetBlocksRecusively maxed out the recusion limit")
		}
		let ListOfElements = [...node.childNodes].filter(ele => {
			try {
				if (typeof ele.tagName == "undefined" && (!RegExpPreset_BlankOrJustSpaces.test(ele.textContent))) {
					return true
				}
				let IsThereANotionBlockDownThisBranch = ele.querySelector("[data-block-id]")
				let CurrentEleIsDataBlock = ele.getAttribute("data-block-id")
				
				let IsSelfAnImage = false
				if (typeof ele.tagName != "undefined") {
					if (ele.tagName == "IMG") {
						IsSelfAnImage = true
					}
				}
				
				if ((IsThereANotionBlockDownThisBranch == null) && (CurrentEleIsDataBlock == null) && (!IsNodeContainingSomething(ele)) && (!IsSelfAnImage)) {
					return false
				}
			} catch {
				return false
			}
			return true
		})
		//DEBUG: Content.querySelector("data-block-id")
		let OutputBlocksExtracted = ListOfElements.map(Content => {
			//Handle block type stated in the class
				let SubContent = {
					NotionBlockType: "",
					NotionBlockId: "",
					Data: {}
				}
				try {
					SubContent.NotionBlockId = Content.getAttribute("data-block-id") ?? "" //Get block ID
				} catch {}
				
				//If it is just plaintext
					if (typeof Content.tagName == "undefined") {
						SubContent.Data = {
							PlainText: Content.textContent
						}
						return SubContent
					}
					if (Content.tagName == "IMG") {
						let Images = ExtractImages(Content.parentElement)
						SubContent.Data = {
							Images: Images
						}
						return SubContent
					}
				//Identify class
					let ClassText = (Content.getAttribute("class")) ?? ""
					try {
						ClassText = ClassText.match(/notion-[a-zA-Z\d_\-]+-block/)[0]
					} catch {
						ClassText = ""
					}
					SubContent.NotionBlockType = ClassText
			//Miscellaneous item layouts
				if (Content.role == "table") {
					//Table that typically appears in character pages bio
						SubContent.Data = {
							HTMLCode: Content.innerHTML
						}
						let Links = ExtractLinks(Content)
						if (Links.length != 0) {
							SubContent.Data.Links = Links
						}
						let Images = ExtractImages(Content)
						if (Images.length != 0) {
							SubContent.Data.Images = Images
						}
						return SubContent
				}
			//Dive deeper until a block not containing any other blocks
				if (/notion-(?:callout|collection_view|column_list|image|table|text|toggle)-block/.test(ClassText)) { //If its a block that CANNOT contain another block, we stop diving deeper
					if (ClassText == "notion-image-block") {
						let Images = ExtractImages(Content)
						SubContent.Data = {
							Images: Images
						}
					} else if (ClassText == "notion-table-block") {
						let Table = Content.querySelector("table")
						let HTMLCode = Table.innerHTML
						SubContent.Data = {
							HTMLCode: HTMLCode
						}
						let Links = ExtractLinks(Content)
						if (Links.length != 0) {
							SubContent.Data.Links = Links
						}
						let Images = ExtractImages(Content)
						if (Images.length != 0) {
							SubContent.Data.Images = Images
						}
					} else if (ClassText == "notion-text-block") {
						try {
							let HTMLCode = Content.childNodes[0].childNodes[0].childNodes[0].innerHTML //HTML code can contain images that are emojis
							SubContent.Data = {
								HTMLCode: HTMLCode
							}
							let Links = ExtractLinks(Content)
							if (Links.length != 0) {
								SubContent.Data.Links = Links
							}
							let Images = ExtractImages(Content)
							if (Images.length != 0) {
								SubContent.Data.Images = Images
							}
						} catch (e) {
							SubContent.Data = {
								Error: "Error on GetBlocksRecusively function - unknown format"
							}
						}
						
					} else if (ClassText == "notion-collection_view-block") {
						let CollectionViewObject = {
							Title: "",
							ListOfCollectionItems: []
						}
						let CollectionViewParts = [...Content.childNodes]
						CollectionViewParts = CollectionViewParts.filter(Parts => {
							let Text = Parts.innerText
							let Images = [...Parts.querySelectorAll("img")]
							if (RegExpPreset_BlankOrJustSpaces.test(Text) && Images.length == 0) {
								return false
							}
							return true
						})
						let OutputCollectionView = CollectionViewParts.map((Part, Index) => {
							if (Index == 0) {
								return {
									CollectionViewPartTitle: Part.textContent
								}
							} else {
								try {
									let CollectionItems = [...Part.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes]
									CollectionItems = CollectionItems.filter(Item => {
										let Text = Item.innerText
										let Images = [...Item.querySelectorAll("img")]
										if (RegExpPreset_BlankOrJustSpaces.test(Text) && Images.length == 0) {
											return false
										}
										return true
									})
									let OutputCollectionItems = CollectionItems.map(Item => {
										let ItemOutput = {
											NotionBlockId: "",
											Type: "CollectionViewItem"
										}
										let NotionBlockId = ""
										try {
											ItemOutput.NotionBlockId = Item.getAttribute("data-block-id") ?? ""
										} catch {}
										let Text = Item.innerText
										if (!RegExpPreset_BlankOrJustSpaces.test(Text)) {
											ItemOutput.Text = Text
										}
										let Links = ExtractLinks(Item)
										if (Links.length != 0) {
											ItemOutput.Links = Links
										}
										let Images = ExtractImages(Item)
										if (Images.length != 0) {
											ItemOutput.Images = Images
										}
										return ItemOutput
									})
									return OutputCollectionItems
								} catch {
									return {
										Error: "Unknown collection view format"
									}
								}
							}
						})
						SubContent.Data = {
							Type: "CollectionView",
							BlockType: ClassText,
							Data: OutputCollectionView
						}
					} else if (ClassText == "notion-toggle-block") {
						try {
							let ToggleContents = [...Content.childNodes[0].childNodes[1].childNodes]
							ToggleContents = ToggleContents.map((TogglePart, Index) => {
								if (Index == 0) {
									return {
										ToggleTitle: TogglePart.innerText
									}
								} else {
									let NextBlockLayer = TogglePart.childNodes[0]
									let ToggleContent = GetBlocksRecusively(NextBlockLayer)
									return ToggleContent
								}
							})
							SubContent.Data = {
								Type: ClassText,
								ToggledContent: ToggleContents
							}
						} catch {
							return {
								Error: "Unknown Toggle Format"
							}
						}
						
					} else if (ClassText == "notion-column_list-block") {
						let a = 0
						try {
							let DescendedNode = DescendNodeTilSplitOrNotionBlock(Content)
							let ColumnListContent = GetBlocksRecusively(DescendedNode)
							SubContent.Data = {
								Type: ClassText,
								Data: ColumnListContent
							}
							
						} catch (e) {
							return {
								Error: "Unknown column list block format." + e
							}
						}
					} else if (ClassText == "notion-callout-block") {
						SubContent.Data = {
							Type: ClassText
						}
						let DescendedNode = DescendNodeTilSplitOrNotionBlock(Content)
						CalloutBlockItems = GetBlocksRecusively(DescendedNode)
						SubContent.Data.Data = CalloutBlockItems
					}
				} else {
					let NestedBlock = {
						NotionBlockType: ClassText
					}
					let DescendedNode = DescendNodeTilSplitOrNotionBlock(Content)
					
					NestedBlock.Contains = GetBlocksRecusively(DescendedNode)
					SubContent.Data = NestedBlock
				}
			//done
				return SubContent
		})
		FunctionRecursionCounter--
		return OutputBlocksExtracted
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
					let Images = ExtractImages(Block)
					return {Images: Images}
				}
			} catch {
				return {
					Error: "Error. Unknown format",
					HTMLCode: Block.innerHTML
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
			let RegexToFindReplace = /^(https:\/\/[a-zA-Z\d_\-]+\.notion\.site\/image\/https%3A%2F%2F(s3-us-west-2\.amazonaws\.com|prod-files-secure\.s3\.us-west-2\.amazonaws\.com)%2F(?:(?!&width=\d+).)*).*$/ //thank you https://stackoverflow.com/a/3850095/11030779 , match all string, up to but not including "&width=<number>"
			return string.replace(RegexToFindReplace, "$1")
		}
		function ExtractLinks(node) {
			let Links = [...node.querySelectorAll("a")].filter(Link => {
				if (typeof Link.href == "undefined") { //Failsafe if there are anchor tags without a link to another page
					return false
				}
				if (RegExpPreset_BlankOrJustSpaces.test(Link.href)) {
					return false
				}
				return true
			}).map(Link => {
				let URL = Link.href
				if (RegExpPreset_NotionPage.test(URL)) {
					URL = URL.replace(/\?pvs=\d+/, "")
				}
				return URL
			})
			Links = [...new Set(Links)]
			return Links
		}
		function ExtractImages(node) {
			let URLOutput = []
			let Images = [...node.querySelectorAll("*")].forEach(ele => {
				let OutputString = ""
				if (ele.tagName == "IMG") {
					if (typeof ele.src != "undefined") {
						let ConvertedURL = FormatNotionImageURL(ele.src)
						URLOutput.push(ConvertedURL)
					}
				}
				try {
					let TLD = window.location.href.match(/https?:\/\/[a-zA-Z\d-\.]+/)[0]
					let BackgroundImgURL = ele.style.backgroundImage
					if (/url\(\".*"\)/.test(BackgroundImgURL)) {
						BackgroundImgURL = BackgroundImgURL.replace(/url\(\"/, "").replace(/\"\)$/, "")
						if (!/^https?:\/\//.test(BackgroundImgURL)) {
							OutputString = TLD + BackgroundImgURL
						} else {
							OutputString = BackgroundImgURL
						}
					}
					OutputString = FormatNotionImageURL(OutputString)
				} catch {}
				
				if (OutputString != "") {
					URLOutput.push(OutputString)
				}
			})
			URLOutput = [...new Set(URLOutput)]
			return URLOutput
		}
		function ExtractInnerText(node) { //Easier to detect if it just spaces by just making it null if it happens
			let OutputString = node.innerText
			if (RegExpPreset_BlankOrJustSpaces.test(OutputString)) {
				return null
			}
			return OutputString
		}
		function DescendNodeTilSplitOrNotionBlock(node) {
			let DescendedNode = node
			while (true) { //If there are a series of descending a node leads to another node having 1 child, avoid having unnecessary nesting object
				if ([...DescendedNode.children].length != 1) {
					break
				}
				DescendedNode = DescendedNode.children[0]
				try {
					if ((DescendedNode.getAttribute("data-block-id") != null)||([...DescendedNode.children].length == 0)||(typeof ele.tagName == "undefined")) {
						DescendedNode = DescendedNode.parentElement
						break
					}
				} catch {}
			}
			return DescendedNode
		}
		function IsNodeContainingSomething(node) {
			let HasText = (!RegExpPreset_BlankOrJustSpaces.test(node.innerText))
			let HasImages = node.querySelectorAll("img").length != 0
			return (HasText||HasImages)
		}
})();