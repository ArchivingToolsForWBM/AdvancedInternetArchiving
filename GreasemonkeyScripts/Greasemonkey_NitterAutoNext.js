// ==UserScript==
// @name          Nitter - Auto next page
// @version       1
// @description   Automatically clicks on "Load more", for AFK extracting links
// @include       https://nitter.net/*
// @grant         none
// ==/UserScript==


(function(){
	window.addEventListener('load', LoadURLAfterTimer)
	
	function LoadURLAfterTimer() {
		setTimeout(ClickLoadMore, 500)
	}
	
	function ClickLoadMore() {
		//Find the "Load more" button
			let IndexOfClassThatIsLoadMore = -1
			for (let i = 0; i < document.getElementsByClassName("show-more").length && IndexOfClassThatIsLoadMore == -1; i++) {
				if (/\<a href=\".+\"\>Load more/.test(document.getElementsByClassName("show-more")[i].innerHTML)) {
					IndexOfClassThatIsLoadMore = i
				}
			}
			if (IndexOfClassThatIsLoadMore != -1) { //If found
				document.getElementsByClassName("show-more")[IndexOfClassThatIsLoadMore].children[0].click()
			}
		if (document.getElementsByClassName("timeline-end").length != 0) { //Nitter tends to end up "No More Items" when there are actually more tweets, when this happens, reload
			let FoundNoMoreItems = false
			for (let i = 0; i < document.getElementsByClassName("timeline-end").length && FoundNoMoreItems == false; i++) {
				if (document.getElementsByClassName("timeline-end")[i].innerHTML == "No more items") {
					FoundNoMoreItems = true
				}
			}
			if (FoundNoMoreItems) {
				location.reload()
			}
		}
	}
})();