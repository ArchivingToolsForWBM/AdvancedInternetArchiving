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
			
			let a = 0
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
			try {
				let Role = node.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].role
				OutputObject.Type = Role ?? ""
			} catch (e) {
				let a = 0
			}
		//Extract differently based on  type
			if (Index == 0) {
				//Image/mugshot and title.
				let TitleObject = {}
				OutputObject.Type = "Header"
				TitleObject.Title = node.textContent
				TitleObject.Images = [...node.querySelectorAll("img")].map(Image => FormatNotionImageURL(Image.src))
				OutputObject.Contents.push(TitleObject)
			} else if (OutputObject.Type == "table") {
				//Table
				let TableRows = [...node.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes]
				OutputTableObjectFormatted = TableRows.map(Row => {
					let OutputTableRows = {}
					let Cells = [...Row.childNodes[0].childNodes]
					OutputTableRows.TableKey = Cells[0].textContent
					OutputTableRows.TableValue = {
						HTMLCode: Cells[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].innerHTML, //SVG, background images, images, so innerHTML works here.
						Text: Cells[1].innerText
					}
					return OutputTableRows
				})
				OutputObject.Contents.push(OutputTableObjectFormatted)
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
	
	function GetContent(node) {
		let Childrens = [...node.childNodes]
		let CurrentNodeTagName = node.tagName ?? ""
		let CurrentNodeRole = node.role ?? ""
		if (CurrentNodeTagName == "DIV" && CurrentNodeRole == "table") {
			//Table content
			let TableContent = {
				Type: "NameValueTable",
				Content: []
			}
			let TableItems = [...node.childNodes]
			TableItems.forEach(Item => {
				try {
					let OutputObject = {}
					let TableCellsInRow = [...Item.childNodes[0].childNodes]
					let Name = TableCellsInRow[0].textContent
					let Value = TableCellsInRow[1].textContent
					OutputObject[Name] = Value
					TableContent.Content.push(OutputObject)
				} catch (e) {}
				ObjectRecursionOutput.push(TableContent)
			})
			let a = 0
		} else if (Childrens.length != 0) {
			for (let i=0; i<Childrens.length; i++) {
				let CurrentChild = Childrens[i]
				GetContent(CurrentChild) //Recursively descend the DOM node
			}
		} else { //No more to descend node
			let ReturnObject = {}
			if (CurrentNodeTagName == "") {
				ReturnObject.Text = node.textContent
			} else {
				switch (CurrentNodeTagName) {
					case "DIV":
						ReturnObject.Text = node.textContent
						break
					case "H1":
						ReturnObject.Text = node.textContent
						break
					case "IMG":
						ReturnObject.ImageURL = node.src
						break
					case "A":
						ReturnObject.Text = node.textContent
						ReturnObject.Link = node.href
						break
					default:
						ReturnObject.Error = "Unknown type"
				}
			}
			if (typeof ReturnObject.Text != "undefined") {
				if (/^[\s\u200B]*$/.test(ReturnObject.Text)) {
					return
				}
			}
			if (typeof ReturnObject.Error == "undefined") {
				ObjectRecursionOutput.push({
					Type: "Other",
					Content: ReturnObject
				})
			}
		}
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
})();