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
	let SavedData = []
	
	let RegExpPreset_BlankOrJustSpaces = /^$[\s\u200B]*/
	let RegExpPreset_ClassNotionBlockName = /notion-(?:text|image|column_list|(?:sub_)+header|toggle)-block/
	
	setInterval(RevealAll, 2000)
	setTimeout(ExtractPageContent, 4000)
	
	let Object_SvgPathsToName = {
		"M1.5,1.5 L1.5,14.5 L14.5,14.5 L14.5,1.5 L1.5,1.5 Z M0,0 L16,0 L16,16 L0,16 L0,0 Z": false, //A square box indicating uncheck checkbox
		"5.5 11.9993304 14 3.49933039 12.5 2 5.5 8.99933039 1.5 4.9968652 0 6.49933039": true, //Checked checkbox
	}
	
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
	
	function ExtractPageContent() {
		let CollectedDataObject = {
			PageURL: location.href,
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
			
			Contents.forEach((ContentThing, Index) => {
				let Data = GetContentFromSection(ContentThing, Index)
				CollectedDataObject.PageContent.push(Data)
			});
			
			
		} else { //"gallery" page
			
			
		}
		
		GM.setClipboard(JSON.stringify(CollectedDataObject, null, " "))
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
					return OutputTableRows
				})
				OutputObject.Contents.push(OutputTableObjectFormatted)
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
	
	
	async function LoadSavedValues() {
		try {
			SavedData = await GM.getValue("Notion_Scrape_SavedData", "[]")
		} catch (e) {
			alert(e)
		}
		
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