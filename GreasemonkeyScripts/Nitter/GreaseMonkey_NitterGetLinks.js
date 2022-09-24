// ==UserScript==
// @name         Extract nitter links, videos (internal) and images
// @namespace    nitter.net
// @version      0.2
// @description  Extracts links from nitter, converting them to twitter equivilants.
// @include      https://nitter.net/*
// ==/UserScript==
const Setting_LogTwitterURLs = true;
const Setting_LogNitterURLs = false;

(function() {
    'use strict';
    const all = window.allLink = new Set();
    function getLink() {
        Array.from(document.querySelectorAll('a[href*="/"]')).forEach(link=>{ //User's home page
            if(!all.has(link.href)&&link.href.match(/nitter\.net\/(?!privacy|notifications|messages|home|explore|search-advanced|tos|search|fonts|about)[^\\?&\\.\\/\\:]+$/)) {
                all.add(link.href);
                if (Setting_LogNitterURLs) {
                    console.log(link.href);
                }
                if (Setting_LogTwitterURLs) {
                    console.log((link.href).replace("nitter.net", "twitter.com"));
                }
            }
        });
        Array.from(document.querySelectorAll('a[href*="/status/"]')).forEach(link=>{ //User's tweets
            if(!all.has(link.href)&&link.href.match(/nitter\.net\/(?!i\/).+?\/status\/\d+/)) {
                all.add(link.href);
                if (Setting_LogNitterURLs) {
                    console.log(link.href);
                }
                if (Setting_LogTwitterURLs) {
                    console.log(((link.href).replace("nitter.net", "twitter.com")).replace(/#.*$/, ""));
                }
            }
        });
        Array.from(document.querySelectorAll('img[src*="/pic/"], video[poster*="/pic/"]')).forEach(link=>{ //Tweet images.
            if(!all.has(link.src)) {
                all.add(link.src);
                if (Setting_LogNitterURLs) {
                    console.log(link.src);
                }
                if (Setting_LogTwitterURLs) {
                    if(/nitter\.net\/pic\/media/.test(link.src)) {
                        console.log((link.src).replace("nitter.net/pic/", "pbs.twimg.com/").replace(/%3(f|F)/, "?").replace(/%2(f|F)/, "/").replace(/%3(d|D)/, "=").replace(/\?.+$/, "").replace(/%3(a|A)[a-zA-Z]+$/, ""));
                    }
                }
            }
        });
        Array.from(document.querySelectorAll('video[poster*="/pic/"]')).forEach(link=>{ //Video thumbnail
            if(!all.has(link.poster)) {
                all.add(link.poster);
                if (Setting_LogNitterURLs) {
                    console.log(link.poster);
                }
                if (Setting_LogTwitterURLs) {
                    console.log((link.poster).replace("https://nitter.net/pic/", "https://pbs.twimg.com/").replaceAll(/%2(f|F)/g, "/").replace(/%3(a|A).+$/, "").replace(/%3(F|f).+/, ""));
                }
            }
        });
        Array.from(document.querySelectorAll('source[src*="/pic/"]')).forEach(link=>{ //Video
            if(!all.has(link.src)) {
                all.add(link.src);
                if (Setting_LogNitterURLs) {
                    console.log(link.src);
                }
                if (Setting_LogTwitterURLs) {
                    console.log((link.src).replace("https://nitter.net/pic/", "https://").replaceAll(/%2(f|F)/g, "/").replace(/%3(a|A).+$/, ""));
                }
            }
        });
    }
    getLink();
    window.addEventListener('scroll',getLink);
})();