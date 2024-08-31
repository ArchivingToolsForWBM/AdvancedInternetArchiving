// ==UserScript==
// @name         Notion-scrape
// @namespace    https://*.notion.*/
// @version      0.2
// @description  try to take over the world!
// @include      /https://[a-zA-Z\d_\-]+.notion.site/.*/
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
		const RegExpPreset_BlankOrJustSpaces = /^$[\s\u200B]*/
		const RegExpPreset_ClassNotionBlockName = /notion-(?:text|image|column_list|(?:sub_)+header|toggle)-block/
		const RegExpPreset_NotionPage = /https:\/\/[a-zA-Z\d_\-]+\.notion.[a-zA-Z\d_\-]+\/[a-zA-Z\d_\-]+/
		
		setTimeout(RevealAll, 2000)
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
		
		let CollectedDataOfPage = {
			PageURL: location.href.replace(/\?pvs=\d*$/),
			PageContent: []
		}
		let ReferenceNode = document.querySelector(".layout-content") //Start at the title header
		if (ReferenceNode != null) { //"Content page
				let Contents = [...ReferenceNode.parentElement.childNodes]
			//Rid out blank stuff
				Contents = Contents.filter(ele => {
					if (ele.innerHTML == "") {
						return false
					}
					if (RegExpPreset_BlankOrJustSpaces.test(ele.textContent) && [...ele.querySelectorAll("img")].length == 0) {
						return false
					}
					return true
				})
			//Extract
				let ExtractedPageContent = Contents.map((ContentThing, Index) => {
					let Data = ContentPage_GetContentFromSection(ContentThing, Index)
					return (Data)
				});
				CollectedDataOfPage.PageContent = ExtractedPageContent
			
		} else { //"gallery" page. NOTE: does not fully extract lists that unloads based on scrolling position. Image gallery loads entirely (after all "view" buttons clicked)
			let ReferenceNode = document.querySelector(".notion-scroller,vertical horizontal")
			let Contents = [...ReferenceNode.childNodes]
			Contents.shift()
			Contents.pop()
			
			let ExtractedPageContent = Contents.map((Section, Index) => {
				let OutputObject = GalleryPage_GetContentFromSection(Section, Index)
				return OutputObject
			})
			
			CollectedDataOfPage.PageContent = ExtractedPageContent
		}
		//Handle duplicates
			let DuplicateItemIndex = SavedData.ScrapedContent.findIndex(PageOfContent => { //Find duplicates
				return CollectedDataOfPage.PageURL == PageOfContent.PageURL
			})
			
			if (DuplicateItemIndex == -1) { //If no dupes found, insert it.
				SavedData.ScrapedContent.push(CollectedDataOfPage)
				SaveSavedValues()
			} else { //Otherwise replace what we already have with potentially a newer version
				SavedData.ScrapedContent[DuplicateItemIndex] = CollectedDataOfPage
			}
		
		ExtractorTimeout = setTimeout(ExtractPageContent, SavedData.Settings.ScanFrequency)
	}
	function GalleryPage_GetContentFromSection(node, Index) {
		let OutputObject = {
			Type: "",
			PageType: "GalleryPage"
		}
		if (Index == 0) { //header
			let SubHeader = [...node.childNodes] //Parts of the header data
			let ExtractedHeaderData = SubHeader.map(HeaderSection => {
				let OutputObjectSection = {}
				let Textdata = "";
				try {
					Textdata = HeaderSection.childNodes[1].innerText
				} catch {}
				let Links = ExtractLinks(HeaderSection)
				let Images = ExtractImages(HeaderSection)
				
				if (!RegExpPreset_BlankOrJustSpaces.test(Textdata)) {
					OutputObjectSection.Text = Textdata
				}
				if (Links.length != 0) {
					OutputObjectSection.Links = Links
				}
				if (Images.length != 0) {
					OutputObjectSection.Images = Images
				}
				return OutputObjectSection
			});
			OutputObject.Header = ExtractedHeaderData
		}
		
		
		return OutputObject
	}
	function ContentPage_GetContentFromSection(node, Index) {
		let OutputObject = {
			Type: "",
			PageType: "PostPage",
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
				return "Other"
				
			})(node);

			
		//Extract differently based on type
			if (Index == 0) {
				//Image/mugshot and title.
				let TitleObject = {}
				OutputObject.Type = "Header"
				TitleObject.Title = node.textContent
				TitleObject.Images = ExtractImages(node)
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
			} else if (OutputObject.Type == "Other") {
				let Blocks = GetBlocksRecusively(node.childNodes[0])
				
				OutputObject.Contents = Blocks
			}
		//Done
			return OutputObject
	}
	function GetBlocksRecusively(node) {
		let ListOfElements = [...node.childNodes].filter(ele => {
			let Text = ele.innerText
			let Images = []
			try {
				Images = [...ele.querySelectorAll("img")]
			} catch {}
			if (RegExpPreset_BlankOrJustSpaces.test(Text) && Images.length == 0) {
				return false
			}
			return true
		})
		let OutputBlocksExtracted = ListOfElements.map(Content => {
			//Handle block type stated in the class
				let SubContent = {
					Type: "NestedBlocks",
					Data: {}
				}
				//If it is just plaintext
					if (typeof Content.tagName == "undefined") {
						SubContent.Data = {
							PlainText: Content.textContent
						}
						return SubContent
					}
				let ClassText = (Content.getAttribute("class")) ?? ""
				try {
					ClassText = ClassText.match(/notion-[a-zA-Z\d_\-]+-block/)[0]
				} catch {
					ClassText = ""
				}
			//Dive deeper until a block not containing any other blocks
				if (/notion-(?:image|text|table|collection_view)-block/.test(ClassText)) { //If its a block that CANNOT contain another block, we stop diving deeper
					if (ClassText == "notion-image-block") {
						let Images = ExtractImages(Content)
						SubContent.Data = {
							NotionBlockType: ClassText,
							Images: Images
						}
					} else if (ClassText == "notion-table-block") {
						let Table = Content.querySelector("table")
						let TableHTMLCode = Table.innerHTML
						SubContent.Data = {
							NotionBlockType: ClassText,
							HTMLCode: TableHTMLCode
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
								NotionBlockType: ClassText,
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
									CollectionViewPartType: "Title",
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
										let ItemOutput = {Type: "CollectionViewItem"}
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
						SubContent.Data = OutputCollectionView
					}
				} else {
					let NestedBlock = {
						NotionBlockType: ClassText
					}
					NestedBlock.Contains = GetBlocksRecusively(Content)
					SubContent.Data = NestedBlock
				}
			//done
				return SubContent
		})
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
						URLOutput.push(ele.src)
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
				} catch {}
				
				
				if (OutputString != "") {
					URLOutput.push(OutputString)
				}
			})
			
			
			
			URLOutput = [...new Set(URLOutput)]
			return URLOutput
		}
})();