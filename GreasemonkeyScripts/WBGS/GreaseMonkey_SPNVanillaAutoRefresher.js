// ==UserScript==
// @name         SPN session error refresher
// @namespace    SPN_Refresher
// @version      0.1
// @description  Auto refreshes WBM saving if session limit reached
// @include      https://web.archive.org/save/*
// ==/UserScript==
(async () => {
	//Settings
		const Setting_RefreshDelay_Min = 10 //Number of seconds before a refresh occurs, minimum
		const Setting_RefreshDelay_Max = 60 //Same as above but max
	//Don't touch
		let CountdownValue = -1
		let HTMLElement_DivCountdownDisplayDivBackground = {}
		let HTMLElement_DivCountdownDisplay_TextDiv = {}
		let HTMLElement_DivCountdownDisplay_TimerProgressbar = {}
		let HaveRefreshed = false //Prevents if loading a page takes longer than a seconds and ends re-executing the refresh
		
		setTimeout(SpawnUI, 500)
		let RandomDelay = getRandomInt(Setting_RefreshDelay_Min, Setting_RefreshDelay_Max+1)
		CountdownValue = RandomDelay
		
	//Spawn UI
		function SpawnUI() {
			let UIPlacementReference = document.querySelector("body")
			if (UIPlacementReference == null) {
				window.alert("Body missing")
				return
			}
			
			HTMLElement_DivCountdownDisplayDivBackground = document.createElement("div")
			HTMLElement_DivCountdownDisplayDivBackground.style.fontFamily = "monospace"
			HTMLElement_DivCountdownDisplayDivBackground.style.position = "fixed"
			HTMLElement_DivCountdownDisplayDivBackground.style.bottom = "40px"
			HTMLElement_DivCountdownDisplayDivBackground.style.right = "40px"
			HTMLElement_DivCountdownDisplayDivBackground.style.zIndex = "999999"
			HTMLElement_DivCountdownDisplayDivBackground.style.backgroundColor = "rgba(64, 64, 64, .5)"
			HTMLElement_DivCountdownDisplayDivBackground.style.color = "#ffffff"
			HTMLElement_DivCountdownDisplayDivBackground.style.borderRadius = "30px"
			HTMLElement_DivCountdownDisplayDivBackground.style.padding = "15px"
			HTMLElement_DivCountdownDisplayDivBackground.style.minWidth = "250px"
			
			HTMLElement_DivCountdownDisplay_TextDiv = document.createElement("div")
			HTMLElement_DivCountdownDisplay_TextDiv.appendChild(document.createTextNode("Auto refresh in: " + CountdownValue.toFixed(0)))
			HTMLElement_DivCountdownDisplayDivBackground.appendChild(HTMLElement_DivCountdownDisplay_TextDiv)
			
			HTMLElement_DivCountdownDisplay_TimerProgressbar = document.createElement("div")
			HTMLElement_DivCountdownDisplay_TimerProgressbar.style.width = "200px"
			HTMLElement_DivCountdownDisplay_TimerProgressbar.style.height = "4px"
			HTMLElement_DivCountdownDisplay_TimerProgressbar.style.backgroundImage = CSSBackgroundImageLinearGradiantPercentageBarGraph(RandomDelay-CountdownValue, RandomDelay, "to right", "#0000ff", "#808080")
			HTMLElement_DivCountdownDisplayDivBackground.appendChild(HTMLElement_DivCountdownDisplay_TimerProgressbar)
			
			UIPlacementReference.appendChild(HTMLElement_DivCountdownDisplayDivBackground)
			
		}
	//Code
		
		let IntervalID = setInterval(Code, 1000)
		
		function Code() {
			if (CountdownValue != 0) {
				CountdownValue--
			}
			HTMLElement_DivCountdownDisplay_TextDiv.textContent = "Auto refresh in: " + CountdownValue.toFixed(0)
			HTMLElement_DivCountdownDisplay_TimerProgressbar.style.backgroundImage = CSSBackgroundImageLinearGradiantPercentageBarGraph(RandomDelay-CountdownValue, RandomDelay, "to right", "#0000ff", "#808080")
			if (CountdownValue < 1) {
				let IndexOfSessionLimitMsg = [...document.querySelectorAll("p")].findIndex((Ele) => {
					return (/^(?:You have already reached the limit of active Save Page Now sessions\.|The server didn't respond in time for|Job failed|The capture failed because Save Page Now does not have access rights for)/.test(Ele.textContent))
				})
			
				if (IndexOfSessionLimitMsg != -1 && (!HaveRefreshed)) {
					window.location.reload();
					HaveRefreshed = true
				}
			}
		}
		
	//Reused codes
		function getRandomInt(min, max) { //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
			const minCeiled = Math.ceil(min);
			const maxFloored = Math.floor(max);
			return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
		}
		function CSSBackgroundImageLinearGradiantPercentageBarGraph(Quantity, MaxQuantity, Direction, Color_Full, Color_Empty) {
			//Returns a percentage displayed as a gradient representing a bar graph as CSS. Preferably as a background image.
			let Percentage = 0
			if (MaxQuantity != 0) {
				Percentage = Quantity * 100/MaxQuantity //Multiply first so that it only rounds at the last step, minimizing rounding errors.
			}
			Percentage = clamp(Percentage, 0, 100)
			return "linear-gradient("+Direction+", "+Color_Full+" "+Percentage+"%, "+Color_Empty+" "+Percentage+"% 100%)"
		}
		function clamp(num, min, max) {
			//Restrict a number within a specified range.
				if (isNaN(num) == true) {
					num = 0
				}
				return num <= min ? min : num >= max ? max : num;
		}
})();