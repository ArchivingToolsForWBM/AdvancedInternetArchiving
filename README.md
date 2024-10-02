# AdvancedInternetArchiving

# Introduction
This is a tool/tutorial I made for saving URLs in bulk to the wayback machine using their [SPN2](https://blog.archive.org/2019/10/23/the-wayback-machines-save-page-now-is-new-and-improved/) automated system. It will extract or search URLs of the saved results to see which URLs you sent have issue(s). 

Most of the easy-to-use tools is in the folder “JS tools” where you can run the HTMLs in your browser (and make sure you have JS enabled, obviously). All other stuff besides that are outdated and likely not useful. The other files provided here are really old but I choose to keep them here in case for future reference

Although I still recommend using notepad++ and other tools that would format the URLs correctly.

I made the URL-save-checking tool because when you sent a list of URLs and obtain the results back, it is not always that all URLs will be successfully saved, and you may want to retry saving those URLs, and repeat until all saveable URLs are successfully saved. Furthermore, random redirects can occur (sites like twitter redirects to random json files or a malicious ad to go to some random sites) and would show the status misleadingly:
* On email, it would not show the source URL it was redirected from and may flag based on the destination site than the primary site (a long time ago, before twitter changed its site layout to a web app, saving a tweet may redirect to a json text page labeled as success than showing an error, for example). The order of URLs you get from the result are seemingly randomized, therefore the user is not informed which URL is redirected from.
* On WBGS, because it either:
** leaves the original URLs you want to archive intact (column A on google sheets)
** If you have &ldquo;Save results in a new Sheet.&rdquo; checked, it will copy a new sheet, also having your entered URLs in column A
It is easily distinguishable which URLs have redirected, but just like the email, it does not have a reliable explicit indicator (like having a text saying “redirect” or “a redirect have occured, redirected to &lt;redirect destination&gt;”). A standard CTRL+F will not help because it is a pattern-based detection, finding a string with portions that matches.

There are also additional tools I made that formats URLs (very useful for saving image URLs that have a full-resolution version, for example), remove duplicates in a list, and others that makes obtaining URLs to save much easier.

# Sample Screenshots
## WBGS
Sample save results (copy columns A-F), after the process have finished
```
https://example.com	Already captured	-	https://web.archive.org/web/20210101000000/https://example.com	0	
https://exampleFirstArchive.com	New capture	-	https://web.archive.org/web/20210101000000/https://exampleFirstArchive.com	0	First Archive
https://exampleRedirectFrom.com	Already captured	-	https://web.archive.org/web/20210101000000/https://exampleRedirectTo.com	0	
https://exampleError.com	Already captured	-	Service Unavailable for https://exampleError.com (HTTP status=503)	0	
https://exampleBlankColumnD.com	Already captured	-		0	
https://exampleNoResultsAtAll.com					
https://exampleSavedButHTTP4xx	Already captured	429	https://web.archive.org/web/20210101000000/https://exampleSavedButHTTP4xx	0	
https://exampleBlockListed			This URL is in the Save Page Now service block list and cannot be captured	0 outlinks captured	
https://exampleError404			The target server cannot find the requested resource https://exampleError404 (HTTP status=404).	0 outlinks captured	
https://exampleError403			The capture failed because Save Page Now does not have access rights for https://exampleError403 (HTTP status=403).		
```
![image](https://github.com/user-attachments/assets/c1bc74c7-1154-4a96-a53a-6c42424956f1)
![image](https://github.com/user-attachments/assets/624fd2c6-4add-483d-b6ed-e8742d54fbd8)



# Email-based SPN

URLs sent:
```
https://example.com
https://exampleFirstArchive.com
https://exampleRedirectedFromOrMissing.com
https://exampleError.com
```
URLs recieved:
```
https://web.archive.org/web/20210101000000/https://example.com Seed URL
https://web.archive.org/web/20210101000000/https://exampleFirstArchive.com First Archive Seed URL
https://web.archive.org/web/20210101000000/https://exampleRedirectTo.com Seed URL
https://exampleError.com Error! Cannot fetch the target URL due to system overload.
```
![image](https://github.com/user-attachments/assets/7ab32836-1e29-4af3-9aff-ac87b8864ecf)
