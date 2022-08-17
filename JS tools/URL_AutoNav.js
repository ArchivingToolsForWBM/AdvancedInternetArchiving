// ==UserScript==
// @name        Sequential URL Surfer
// @version     1
// @grant       GM.registerMenuCommand
// @description Opens a sequence of URLs in the current tab with delay in between
// ==/UserScript==
function StartSurf() {
	localStorage.setItem("Sequential_URL_Visitor_OnOff", "On")
	alert("Surf has started! Please refresh the page to apply this")
}
function StoptSurf() {
	localStorage.setItem("Sequential_URL_Visitor_OnOff", "Off")
	alert("Surf has paused")
}
function ResetURLCount() {
	localStorage.setItem("Sequential_URL_Visitor_URLCount", 0)
	alert("Surf URL count has been reset")
}

GM.registerMenuCommand("Start URL auto-surf", StartSurf, "S");
GM.registerMenuCommand("Stop URL auto-surf", StoptSurf, "T");
GM.registerMenuCommand("Reset URL auto-surf URL count", ResetURLCount, "R");

(function() {
	const Delay = 3000
	const ListOfURLs = [
	"https://google.com",
	"https://github.com/"]
	
	let Index = 0
	if (localStorage.getItem("Sequential_URL_Visitor_OnOff")==null) {
		localStorage.setItem("Sequential_URL_Visitor_OnOff", "Off")
	}
	if (localStorage.getItem("Sequential_URL_Visitor_URLCount")==null) {
		localStorage.setItem("Sequential_URL_Visitor_URLCount", 0)
	}
	if (localStorage.getItem("Sequential_URL_Visitor_OnOff")==null) {
		localStorage.setItem("Sequential_URL_Visitor_URLCount", "Off")
	}
	if (localStorage.getItem("Sequential_URL_Visitor_OnOff")=="On"){
		Index = parseInt(localStorage.getItem("Sequential_URL_Visitor_URLCount", 0))
		if (Index < ListOfURLs.length) {
			setTimeout(() => {
				location.href = (ListOfURLs[Index])
				Index++
				localStorage.setItem("Sequential_URL_Visitor_URLCount", Index)
			}, Delay)
		} else {
			alert("Done!")
			localStorage.setItem("Sequential_URL_Visitor_URLCount", 0)
			localStorage.setItem("Sequential_URL_Visitor_OnOff", "Off")
		}
	}
})();