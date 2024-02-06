This userscript will:

-Auto-click and check "Save results in a new Sheet" on "Archive URLs" page This is to prevent a glitch that a process duplicate and overwrites existing
 save results on the google sheet by making it write its save results in a different sheet.
 
-[Optionally] Auto-click "abort" on processes that are "finish-locked"- processes that have traversed all URLs, with "SUCCESS" on the status, and should've
 disappear from the WBGS list on the WBGS home page.
 
-Console logs (press F12 to open devtools and on the "Console" tab) various information obtained from the page onto the console log (easy to copy). This
 makes keeping track of processes easier since WBGS sometimes fails to display processes that exists, or that information on the page disappear before
 you can report it.