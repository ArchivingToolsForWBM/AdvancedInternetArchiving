# AdvancedInternetArchiving

# Introduction
This is a tool/tutorial I made for saving URLs in bulk to the wayback machine using their [SPN2](https://blog.archive.org/2019/10/23/the-wayback-machines-save-page-now-is-new-and-improved/) automated system. It will extract or search URLs of the saved results to see which URLs you sent have issue(s). 

Most of the easy-to-use tools is in the folder “JS tools” where you can run the HTMLs in your browser (and make sure you have JS enabled). All other stuff besides that are outdated and likely not useful. The other files provided here are really old but I choose to keep them here in case for future reference

Although I still recommend using notepad++ and other tools that would format the URLs correctly.

I made the URL-save-checking tool because when you sent a list of URLs and obtain the results back, it is not always that all URLs will be successfully saved, and you may want to retry saving those URLs, and repeat until all saveable URLs are successfully saved. Furthermore, random redirects can occur (sites like twitter redirects to random json files or a malicious ad to go to some random sites) and would show the status misleadingly:
* On email, it would not show the source URL it was redirected from and may flag based on the destination site than the primary site (saving a tweet may redirect to a json text page labeled as success than showing an error, for example). The order of URLs you get from the result are seemingly randomized, therefore the user is not informed which URL is redirected from.
* On WBGS, because it leaves the original URLs you want to archive intact (column A on google sheets), it is easily distinguishable which URLs have redirected, but just like the email, it does not have a reliable explicit indicator (like having a text saying “redirect” or “a redirect have occured, redirected to &lt;redirect destination&gt;”). A standard CTRL+F will not help because it is a pattern-based detection, finding a string with portions that matches.

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
```
![image](https://user-images.githubusercontent.com/89951208/208203542-55853962-a25b-47c9-a6c0-12f79efafc6e.png)
![image](https://user-images.githubusercontent.com/89951208/208203561-034b85ab-23c5-4418-8017-360aea499a49.png)
![image](https://user-images.githubusercontent.com/89951208/208203583-37878df0-c016-4c0e-afe3-f0b7a23413f5.png)

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
![alt text](https://user-images.githubusercontent.com/13095760/132143025-1af377b7-26c9-48d6-8bf0-f1c903295f20.png)
![alt text](https://user-images.githubusercontent.com/13095760/132143121-9945cb7e-5205-4448-a796-72245e045a6c.png)
