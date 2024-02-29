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
			let StorageSaved_Select = [
				{value:"Option1", visibleText: "Option one", isSelected: true},
				{value:"Option2", visibleText: "Option two",  isSelected: false},
				{value:"Option2", visibleText: "Option three",  isSelected: false}
			]
			let StorageSaved_Select2 = [
				{value:"Option1", visibleText: "Option one", isSelected: false},
				{value:"Option2", visibleText: "Option two",  isSelected: false},
				{value:"Option2", visibleText: "Option three",  isSelected: false}
			]
			let StorageSaved_Radio = [
				{visibleText: "Radio1", isSelected: true},
				{visibleText: "Radio2", isSelected: false},
				{visibleText: "Radio3", isSelected: false}
			]
			LoadValuesFromStorage()
			let a = 0
	//UI panel
		async function Spawn_UI_Panel() {
			//Spawn elements
				let DivBox = document.createElement("div")
				DivBox.setAttribute("style", "position: fixed;bottom: 40px;right: 40px;z-index: 999; background-color: rgba(64, 64, 64, .5); color: #ffffff; border-radius: 30px; padding: 15px;")
				//select
					let SelectElement = CreateSelectElement(StorageSaved_Select, false)
					
					DivBox.appendChild(SelectElement)
					DivBox.appendChild(document.createElement("br"))
				//Select, multiple
					let SelectElement2 = CreateSelectElement(StorageSaved_Select2, true)
					
					DivBox.appendChild(SelectElement2)
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
				//radio
					let Div_RadioButtons = CreateRadioList(StorageSaved_Radio, true)
					
					DivBox.appendChild(Div_RadioButtons)
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
			StorageSaved_Select = JSON.parse(await GM.getValue("TemplateSaveTest_Select", JSON.stringify(StorageSaved_Select)).catch( () => {
				GetValueErrorMessage()
			}))
			
			StorageSaved_Select2 = JSON.parse(await GM.getValue("TemplateSaveTest_Select2", JSON.stringify(StorageSaved_Select2)).catch( () => {
				GetValueErrorMessage()
			}))
			
			StorageSaved_Radio = JSON.parse(await GM.getValue("TemplateSaveTest_Radio", JSON.stringify(StorageSaved_Radio)).catch( () => {
				GetValueErrorMessage()
			}))
		}
		function GetValueErrorMessage() {
			console.log("TemplateScript - getvalue failed.")
		}
		async function SaveValuesToStorage() {
			await GM.setValue("TemplateSaveTest_Textarea", StorageSaved_Textarea).catch( () => {
				SetValueErrorMessage()
			})
			await GM.setValue("TemplateSaveTest_CheckBox", StorageSaved_Checkbox).catch( () => {
				GetValueErrorMessage()
			})
			await GM.setValue("TemplateSaveTest_Select", JSON.stringify(StorageSaved_Select)).catch( () => {
				GetValueErrorMessage()
			})
			await GM.setValue("TemplateSaveTest_Select2", JSON.stringify(StorageSaved_Select2)).catch( () => {
				GetValueErrorMessage()
			})
			await GM.setValue("TemplateSaveTest_Radio", JSON.stringify(StorageSaved_Radio)).catch( () => {
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
		function CreateSelectElement(arrayOptions, allowMultiple) {
			//Input:
			//arrayOptions:
			//	[{value: "ValueString", visibleText: "Text here", isSelected: false}]
			//allowMultiple: false = select only one, true = allow multiple
			let HTML_Element_Select = document.createElement("select")
			HTML_Element_Select.addEventListener(
				"change",
				function () {
					Array.from(this.childNodes).forEach((listedOption, Index) => {
						arrayOptions[Index].isSelected = listedOption.selected
					})
					SaveValuesToStorage()
				}
			)
			if (allowMultiple) {
				HTML_Element_Select.setAttribute("multiple", "")
			}
			arrayOptions.forEach((listedOption) => {
				let HTML_Element_Option = document.createElement("option")
				HTML_Element_Option.setAttribute("value", listedOption.value)
				if (listedOption.isSelected) {
					HTML_Element_Option.setAttribute("selected", "")
				}
				HTML_Element_Option.appendChild(document.createTextNode(listedOption.visibleText))
				
				HTML_Element_Select.appendChild(HTML_Element_Option)
			})
			
			return HTML_Element_Select
		}
		function CreateRadioList(arrayRadios, elementName, lineBreakEach) {
			//Input:
			//arrayRadios:
			//	[{visibleText: "Radio1", isSelected: true}]
			//elementName: the name for radio group
			let HTML_Element_Div = document.createElement("div")
			
			arrayRadios.forEach((radioItem) => {
				let HTML_Element_Label = document.createElement("label")
				
				let HTML_Element_Radio = document.createElement("input")
				HTML_Element_Radio.setAttribute("type", "radio")
				HTML_Element_Radio.setAttribute("name", "elementName")
				HTML_Element_Radio.addEventListener(
					"change",
					function () {
						Array.from(this.parentNode.parentNode.childNodes).forEach((radioOption, Index) => {
							arrayRadios[Index].isSelected = radioOption.childNodes[0].checked
						})
						SaveValuesToStorage()
					}
				)
				
				if (radioItem.isSelected) {
					HTML_Element_Radio.setAttribute("checked", "")
				}
				HTML_Element_Label.appendChild(HTML_Element_Radio)
				HTML_Element_Label.appendChild(document.createTextNode(radioItem.visibleText))
				HTML_Element_Div.appendChild(HTML_Element_Label)
				if (lineBreakEach) {
					HTML_Element_Div.appendChild(document.createElement("br"))
				}
			})
			return HTML_Element_Div
		}
})();