// ==UserScript==
// @name         Template
// @version      0.2
// @description  try to take over the world!
// @include      *
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==
(function() {
	//Settings
		const Setting_Delay = 1000

	//Stuff you don't touch unless you know what you're doing.
		let RaceConditionLock = false
			//^This prevents concurrent runs of the code as a failsafe.
		//no duplicates on the console log
			const SetOfURLs = new Set()
		//Run code periodically (recommended for dynamic web pages, infinite scrolling)
			window.onload = setInterval(MainCode, Setting_Delay)
			
			window.addEventListener("load",function(event) {
				setInterval(MainCode, Setting_Delay)
				setTimeout(Spawn_UI_Panel, 1000)
			},false);
		//Load save values
			let StorageSaved_Textarea = ""
			let StorageSaved_Checkbox = false
			let StorageSaved_Select = [true, false, false]
			LoadValuesFromStorage()
			let a = 0
	//UI panel
		async function Spawn_UI_Panel() {
			//Spawn elements
				let DivBox = document.createElement("div")
				DivBox.setAttribute("style", "position: fixed;bottom: 40px;right: 40px;z-index: 999; background-color: rgba(64, 64, 64, .5); color: #ffffff; border-radius: 30px; padding: 15px;")
				//select
					let SelectList = [
						{value:"Option1", visibleText: "Option one"},
						{value:"Option2", visibleText: "Option two"},
						{value:"Option2", visibleText: "Option three"}
					]
					let SelectElement = document.createElement("select")
					SelectList.forEach((SelectOption, Index) => {
						let SelectOptionElement = document.createElement("option")
						SelectOptionElement.setAttribute("value", SelectOption.value)
						SelectOptionElement.appendChild(document.createTextNode(SelectOption.visibleText))
						if (StorageSaved_Select[Index]) {
							SelectOptionElement.setAttribute("selected", "")
						}
						SelectElement.appendChild(SelectOptionElement)
					})
					
					SelectElement.addEventListener(
						"change",
						function () {
							StorageSaved_Select = Array.from(SelectElement.childNodes).map((SelectOption) => {
								return SelectOption.selected
							})
							SaveValuesToStorage()
						}
					)
					
					DivBox.appendChild(SelectElement)
					DivBox.appendChild(document.createElement("br"))
				//Checkbox
					let Label_For_Checkbox = document.createElement("label")
					let CheckBoxElement = document.createElement("input")
					CheckBoxElement.setAttribute("type", "checkbox")
					if (StorageSaved_Checkbox) {
						CheckBoxElement.setAttribute("checked", "")
					}
					CheckBoxElement.addEventListener(
						"change",
						function () {
							StorageSaved_Checkbox = this.checked
							SaveValuesToStorage()
						}
					)
					
					Label_For_Checkbox.appendChild(CheckBoxElement)
					Label_For_Checkbox.appendChild(document.createTextNode("Text here"))
					DivBox.appendChild(Label_For_Checkbox)
					DivBox.appendChild(document.createElement("br"))
				//Textarea
					let Textarea_test = document.createElement("textarea")
					Textarea_test.setAttribute("style", "white-space: pre; overflow-wrap: normal; overflow-x: scroll;")
					Textarea_test.appendChild(document.createTextNode(StorageSaved_Textarea)) //setAttribute on value does not work, since value attribute is not supported in this way
					Textarea_test.addEventListener(
						"input",
						function () {
							StorageSaved_Textarea = this.value
							SaveValuesToStorage()
						}
					)
				
				
				DivBox.appendChild(Textarea_test)
			
			//Add to document
				let HTMLBody = Array.from(document.getElementsByTagName("BODY")).find((Element) => {return true})
				let InnerNodeOfHTMLBody = DescendNode(HTMLBody, [0])
				if (InnerNodeOfHTMLBody.IsSuccessful) {
					document.body.insertBefore(DivBox, HTMLBody.childNodes[0]);
				}
		}
	//MainCode, runs periodically and used to extract page content.
		function MainCode() {
			if (!RaceConditionLock) {
				RaceConditionLock = true
				//Code here
				RaceConditionLock = false
			}
		}
	//reused Functions
		function ConsoleLoggingURL(URL_String) {
			let URL_truncateProof = URL_String.replace(/^http/, "ttp")
			if (!SetOfURLs.has(URL_truncateProof)) {
				console.log(URL_truncateProof)
				SetOfURLs.add(URL_truncateProof)
			}
		}
	//Load/save values from storage
		async function LoadValuesFromStorage() {
			StorageSaved_Textarea = await GM.getValue("TemplateSaveTest_Textarea", "").catch( () => {
				GetValueErrorMessage()
			})
			StorageSaved_Checkbox = await GM.getValue("TemplateSaveTest_CheckBox", false).catch( () => {
				GetValueErrorMessage()
			})
			StorageSaved_Select = await GM.getValue("TemplateSaveTest_Select", "[true, false, false]").catch( () => {
				GetValueErrorMessage()
			})
			StorageSaved_Select = JSON.parse(StorageSaved_Select)
		}
		function GetValueErrorMessage() {
			console.log("TemplateScript - getvalue failed.")
		}
		async function SaveValuesToStorage() {
			StorageSaved_Textarea = await GM.setValue("TemplateSaveTest_Textarea", StorageSaved_Textarea).catch( () => {
				SetValueErrorMessage()
			})
			StorageSaved_Checkbox= await GM.setValue("TemplateSaveTest_CheckBox", StorageSaved_Checkbox).catch( () => {
				GetValueErrorMessage()
			})
			StorageSaved_Select = await GM.setValue("TemplateSaveTest_Select", JSON.stringify(StorageSaved_Select)).catch( () => {
				GetValueErrorMessage()
			})
		}
		function SetValueErrorMessage() {
			console.log("TemplateScript - setvalue failed.")
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
		function AscendNode(Node, Levels) {
			//Instead of Node.parentNode.parentNode.parentNode... which is prone to errors if there is no parent, this has a check to prevent it.
			//Arguments:
			//-Node: The node in the HTML
			//-Levels: A number, representing how many levels to ascend
			//Will return:
			//-the parent node at "Levels" up, unless it cannot go up any further, then the highest
			//-the number of successful levels it goes up.
			let CurrentNode = Node
			let ChildCount = 0
			if (typeof Node != "undefined") {
				for (let i = 0; i < Levels; i++) {
					if (typeof CurrentNode.parentNode != "undefined") {
						CurrentNode = CurrentNode.parentNode
						ChildCount++
					} else {
						break
					}
				}
				return {
					OutputNode: CurrentNode,
					LevelsPassed: ChildCount,
					IsSuccessful: (Levels == ChildCount)
				}
			} else {
				return {
					OutputNode: undefined,
					LevelsPassed: -1,
					IsSuccessful: false
				}
				
			}
		}
})();