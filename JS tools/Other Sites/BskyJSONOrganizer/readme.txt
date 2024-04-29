These HTML files contained here manages a given JSON format representing
a post and profile and:
-BskyJsonMerger.html -> Merges JSON object with the same post URL, ideal
 for removing duplicates and combining a list of posts and profiles.
-BskyJsonOrganizer.html -> Organizes (sort and filter) content.

JSON format must be, as an example:
{
 "ListOfProfiles": [
  {
   "Type": "UserProfile",
   "ProfileURL": "https://bsky.app/profile/bsky.app",
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihagr2cmvl2jt4mgx3sppwe2it3fwolkrbtjrhcnwjk4jdijhsoze@jpeg",
   "BackgroundImg": "https://cdn.bsky.app/img/banner/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreichzyovokfzmymz36p5jibbjrhsur6n7hjnzxrpbt5jaydp2szvna@jpeg",
   "TextContent": {
    "Text": "Official Bluesky account (check domain👆)\n\nFollow for updates and announcements"
   },
   "ProfileFollowCount": "910K",
   "ProfileFollowingCount": "2",
   "ProfilePostCount": "268",
   "DateTimeOfScrape": "2024-04-29 22:36:20 UTC"
  }
 ],
 "ListOfPosts": [
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqy4mjw5eo2t",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kqy4o6slll2m"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 25, 2024 at 3:17 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-25 19:17",
    "TimestampMillisecondsEpoch": 1714072620000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "The skies just got a little more blue... you can now post GIFs!\n\nWe're starting with a set list of GIFs from Tenor. You can turn off auto-play in your settings. \n\nCustom uploaded GIFs and video coming soon! 🔜\n\nShare Bluesky with a friend: bsky.app/download 💙",
      "Links": [
       "https://bsky.app/download"
      ]
     },
     {
      "Type": "Attachment",
      "AttachmentContents": [
       {
        "Type": "VIDEO",
        "URL": "https://t.gifs.bsky.app/3GgX9XG4fe0AAAP3/blue-fly.webm"
       }
      ]
     }
    ]
   },
   "ReplyCount": "591",
   "RepostCount": "2145",
   "LikesCount": "7091",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqy4o6slll2m",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kqy4mjw5eo2t",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kqy4pvvxce2h"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 25, 2024 at 3:18 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-25 19:18",
    "TimestampMillisecondsEpoch": 1714072680000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Os céus acabaram de ficar um pouco mais azuis... os GIFs estão aqui!\n\nEstamos começando com uma lista fixa de GIFs do Tenor. Você pode desativar a reprodução automática nas suas configurações.\n\nEm breve teremos GIFs e vídeos personalizados! 🔜\n\nCompartilhe o Bluesky com um amigo: bsky.app/download 💙",
      "Links": [
       "https://bsky.app/download"
      ]
     },
     {
      "Type": "Attachment",
      "AttachmentContents": [
       {
        "Type": "VIDEO",
        "URL": "https://t.gifs.bsky.app/4IkfSV_2jxQAAAP3/sky-sun.webm"
       }
      ]
     }
    ]
   },
   "ReplyCount": "53",
   "RepostCount": "188",
   "LikesCount": "868",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqy4pvvxce2h",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kqy4o6slll2m",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 25, 2024 at 3:19 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-25 19:19",
    "TimestampMillisecondsEpoch": 1714072740000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "空が少し青くなりました... これからGIFを投稿できます！\n\nまずはTenorからのGIFリストでスタートします。設定で自動再生をオフにすることができます\n\nカスタムアップロードのGIFとビデオがもうすぐ登場します！🔜\n\nBlueskyを友達と共有しましょう: bsky.app/download 💙",
      "Links": [
       "https://bsky.app/download"
      ]
     },
     {
      "Type": "Attachment",
      "AttachmentContents": [
       {
        "Type": "VIDEO",
        "URL": "https://t.gifs.bsky.app/gznLWsJjaMAAAAP3/daytime-miving.webm"
       }
      ]
     }
    ]
   },
   "ReplyCount": "19",
   "RepostCount": "1826",
   "LikesCount": "2483",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqxv2mnjs327",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kqxv5yeof32a"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 25, 2024 at 1:02 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-25 17:02",
    "TimestampMillisecondsEpoch": 1714064520000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.79 is rolling out now (1/5)\n\nYou can now attach GIFs from Tenor on your posts!\n\nAutoplay can be disabled in the “Accessibility” section of settings."
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreifr7jds7mfgsak52t3a3gnmi46mrpmnmrn5gory2axbxx4hirbpka@jpeg",
        "alt": "A screenshot of the composer with the GIF button circled and the label \"Add GIF\""
       },
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreiaw35yj4ppvxzxaqw7idv63vu54ng5vy57ao6kagqu3qomsl6he5u@jpeg",
        "alt": "A screenshot of the gif search interface"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqxv5yeof32a",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kqxv2mnjs327",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kqxvd53nbc2b"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 25, 2024 at 1:04 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-25 17:04",
    "TimestampMillisecondsEpoch": 1714064640000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.79 is rolling out now (2/5)\n\nFor added account security, you can now enable 2FA via email.\n\nWhen enabled, you will be sent a security code via email when signing in."
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreicvfdq7jwqiozrprxslh6iva5brnisjk32qry7aag5cbissh4rgam@jpeg",
        "alt": "A screenshot of the settings page\nChange handle\nTwo-factor authentication\nA toggle: Require email code to log into your account\nAccount\nChange password"
       },
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreig6f6gkektmfbincvpx2w6pfhvbws6a7gadv5nvvza2yp27dygtcy@jpeg",
        "alt": "A screenshot of the login screen\nHosting provider\nBluesky social\nAccount\nThe username and password have been covered\n2FA confirmation\nAn input asking for the confirmation code\nIt is labeled \"Check your email for a login code and enter it here.\""
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqxvd53nbc2b",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kqxv5yeof32a",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 25, 2024 at 1:07 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-25 17:07",
    "TimestampMillisecondsEpoch": 1714064820000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.79 is rolling out now (5/5)\n\nAs always, we’d like to thank our GitHub contributors tkusano, Hima-Zinn, surfdude29, Signez, jaoler, Yangbblood, middlingphys, quiple, auroursa, mary-ext, ivanbea, gildaswise, gleydson, Dovgonosyk, imax9000, and the many others who worked on translations off site!"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqjaq2begs2s",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 19, 2024 at 5:21 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-19 21:21",
    "TimestampMillisecondsEpoch": 1713561660000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "We're always excited to welcome journalists and news organizations to Bluesky! 🗞️\n\nJournalists have continuously been one of the backbones of social media. It's incredibly important to have a space for healthy real-time discussion.\n\n📧 press@blueskyweb.xyz\n🙋 Press FAQ: bsky.social/about/blog/p...",
      "Links": [
       "https://bsky.social/about/blog/press-faq"
      ]
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreif5bxpqjyyjmsqphbuvloo5c7ieqqs54i4wychem2ebvpw7uaxasy@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "Bluesky Social",
         "Bluesky for Journalists - Bluesky"
        ]
       }
      ],
      "Link": "https://bsky.social/about/blog/press-faq"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqipr2lq2t27",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 19, 2024 at 12:17 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-19 16:17",
    "TimestampMillisecondsEpoch": 1713543420000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "You can share Bluesky posts on other sites, articles, newsletters, and more. ✍️\n\nHere's a user guide on how to embed a Bluesky post on your website or blog!"
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreigc2us7zhxsit6offrcgqvlrkpbnejz5tkmycam7ngnpii5zjoy4u@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "Bluesky Social",
         "How to embed a Bluesky post on your website or blog - Bluesky",
         "Share Bluesky posts on other sites, articles, newsletters, and more."
        ]
       }
      ],
      "Link": "https://bsky.social/about/blog/post-embeds-guide"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kqblykw4wn2u",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 16, 2024 at 4:21 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-16 20:21",
    "TimestampMillisecondsEpoch": 1713298860000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.78 is a bugfix for account creation\n\nIn some cases, it was possible for the app to hang indefinitely while creating an account. The update fixed that issue!"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kq7ezofqak2f",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kq7f2zpost2y"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 15, 2024 at 7:11 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-15 23:11",
    "TimestampMillisecondsEpoch": 1713222660000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.77 is rolling out now (1/7)\n\nWe’ve got a big update for yall! This includes:\n\n• Hover cards and embedding posts on Web\n• Ability to turn off vibrations\n• Fixed profile scrolling on iOS\n• and more!\n\nRead on for details 🧵"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kq7f2zpost2y",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kq7ezofqak2f",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kq7fi2p63t25"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 15, 2024 at 7:12 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-15 23:12",
    "TimestampMillisecondsEpoch": 1713222720000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.77 is rolling out now (2/7)\n\nWe heard your feedback, and we’ve added the ability to turn off vibrations in the app. In your Settings page, this is the “Disable haptics” setting."
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreic3pm63dv4ciqfwl6nwmxv4gbv2mlumamlsibybgv2nd7t725v4va@jpeg",
        "alt": "A screenshot of the Bluesky settings page. Under \"Advanced,\" the option to \"Disable haptics\" is highlighted"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kq7fi2p63t25",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kq7f2zpost2y",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 15, 2024 at 7:19 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-15 23:19",
    "TimestampMillisecondsEpoch": 1713223140000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.77 is rolling out now (8/7)\n\nOne more thing!\n\nSearch got some improvements. You should get better results when searching for users, and searching in Japanese should work much better."
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kq7aeuwbg42k",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kq7b33tovk2f"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 15, 2024 at 5:48 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-15 21:48",
    "TimestampMillisecondsEpoch": 1713217680000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Just shipped: Bluesky posts embeds! Now you can see Bluesky posts in their natural habitat.\n\nSimply right-click on the post you want to embed, or paste its URL in embed.bsky.app for the code snippet.",
      "Links": [
       "https://embed.bsky.app/"
      ]
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreiazh3nvedkdyiz76jnmzzid3gukitchr6fee7czggxbno4uxqpgr4@jpeg",
        "alt": "Screenshot of the post embed interface available at embed.bsky.app. There is an input field for the post URL, and an arrow that points to how the embed appears."
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kq7b33tovk2f",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kq7aeuwbg42k",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kq7b424rmz2v"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 15, 2024 at 6:01 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-15 22:01",
    "TimestampMillisecondsEpoch": 1713218460000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Agora você pode incorporar postagens do Bluesky diretamente em outro site, como uma notícia.\n\nBasta clicar com o botão direito na postagem que deseja incorporar ou colar seu URL em embed.bsky.app para obter o trecho de código.",
      "Links": [
       "https://embed.bsky.app/"
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kq7b424rmz2v",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kq7b33tovk2f",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 15, 2024 at 6:01 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-15 22:01",
    "TimestampMillisecondsEpoch": 1713218460000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Bluesky の投稿をニュース記事など、別の Web サイトに直接埋め込むことができるようになりました。\n\n埋め込みたい投稿を右クリックするか、コード スニペットの embed.bsky.app にその URL を貼り付けるだけです。",
      "Links": [
       "https://embed.bsky.app/"
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "Bluesky",
   "PostURL": "https://bsky.app/profile/bnewbold.net/post/3kpxav2hkah2x",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "bryan newbold",
   "UserHandle": "@bnewbold.net",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 12, 2024 at 1:36 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-12 17:36",
    "TimestampMillisecondsEpoch": 1712943360000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "こんにちは日本🇯🇵\n\n投稿（まだプロフィールではない）内の日本語テキストを検索するためにいくつかの変更を加えました。 あなたがどう思うか興味があります！\n\n[この投稿は機械翻訳を使用しました]"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kpwzxrcdyv2r",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 12, 2024 at 11:32 AM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-12 15:32",
    "TimestampMillisecondsEpoch": 1712935920000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "By the way... we lifted our \"no heads of state\" policy. 🤐"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kpss6h56pr2w",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 10, 2024 at 7:02 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-10 23:02",
    "TimestampMillisecondsEpoch": 1712790120000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Olá, falantes de português! 👋 Traduzimos nosso FAQ do usuário aqui:\n\nbsky.social/about/blog/0...",
      "Links": [
       "https://bsky.social/about/blog/04-10-2024-user-faq-br"
      ]
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreibmmpwets4yzpqjyewrvrr6wkfbswtvrknhbse5wa2zkkzuqhcetq@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "Bluesky Social",
         "Perguntas Frequentes do Usuário Bluesky (Português) - Bluesky",
         "Bem-vindo ao aplicativo Bluesky! Este é um guia do usuário que responde a algumas perguntas comuns."
        ]
       }
      ],
      "Link": "https://bsky.social/about/blog/04-10-2024-user-faq-br"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kpsprrzdo52u",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kpsps7lrxe2q"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 10, 2024 at 6:19 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-10 22:19",
    "TimestampMillisecondsEpoch": 1712787540000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "No Bluesky, existem *muitos* algoritmos – você pode escolher seu próprio feed! \n\nPor exemplo, aqui está um que mostra as últimas postagens de tendências na rede. (Certifique-se de que sua configuração de idioma do conteúdo seja português para ver as postagens.)\n\nbsky.app/profile/did:...",
      "Links": [
       "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/feed/hot-classic"
      ]
     },
     {
      "Type": "Attachment",
      "AttachmentContents": []
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kpsps7lrxe2q",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kpsprrzdo52u",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 10, 2024 at 6:19 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-10 22:19",
    "TimestampMillisecondsEpoch": 1712787540000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Explore mais feeds aqui:\n\nbsky.app/feeds",
      "Links": [
       "https://bsky.app/feeds"
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "Bluesky",
   "PostURL": "https://bsky.app/profile/emilyliu.me/post/3kps6p2bjzz2t",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Emily 🦋",
   "UserHandle": "@emilyliu.me",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 10, 2024 at 1:13 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-10 17:13",
    "TimestampMillisecondsEpoch": 1712769180000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "👋🇧🇷 Queremos fazer do Bluesky um ótimo lugar para você. Se você tiver tempo, agradeceríamos sua opinião:\n\n• Como você ouviu falar do Bluesky?\n\n• Para que você usa o Bluesky?\n\n• Quais comunidades você deseja ver mais no Bluesky?"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kps226nfyb25",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 10, 2024 at 11:50 AM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-10 15:50",
    "TimestampMillisecondsEpoch": 1712764200000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.76 is rolling out now (1/3)\n\nThis release includes some bugfixes that have been bothering everybody.\n\n• iOS: We fixed the issue with the composer’s autocomplete inserting garbage into your posts.\n\n• Android: We fixed another issue that would cause the back button to stop working."
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "Bluesky",
   "PostURL": "https://bsky.app/profile/jay.bsky.team/post/3kpnkbc3ruc2a",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Jay 🦋",
   "UserHandle": "@jay.bsky.team",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 8, 2024 at 4:57 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-08 20:57",
    "TimestampMillisecondsEpoch": 1712609820000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Adoraríamos compartilhar mais sobre o Bluesky com o Brasil! Que jornais ou sites você lê?\n\n👋 Os jornalistas podem nos enviar um e-mail para press@blueskyweb.xyz"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kpllkdgtqu2v",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 7, 2024 at 10:15 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-08 02:15",
    "TimestampMillisecondsEpoch": 1712542500000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "👋 Olá, Brasil! Estamos muito entusiasmados em recebê-lo (novamente).\n\nCompartilhe Bluesky com um amigo (não é necessário código de convite)! bsky.app 💌",
      "Links": [
       "https://bsky.app/"
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kp3ochslat2c",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Apr 1, 2024 at 2:22 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-04-01 18:22",
    "TimestampMillisecondsEpoch": 1711995720000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Stop, stare, and share. 📹\n\nWe’re so excited to announce Bluesky Shorts! \n\nbsky.social/about/blog/0...",
      "Links": [
       "https://bsky.social/about/blog/04-01-2024-bluesky-shorts"
      ]
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihvs567yabgxcn4p7mjnzo4oxkb4ugajt7ju2papos2h4upcpqdke@jpeg",
        "alt": "An image of Bluesky Shorts"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3ko5iiv6b662s",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3ko5ijpa7nm2g"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 20, 2024 at 2:18 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-20 18:18",
    "TimestampMillisecondsEpoch": 1710958680000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.73 is rolling out now (1/3)\n\nIntroducing community labelers, a new tool for users to run independent moderation. Watch the video below for a quick overview, or read the blogpost from last week: bsky.social/about/blog/0...",
      "Links": [
       "https://bsky.social/about/blog/03-12-2024-stackable-moderation"
      ]
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreidyc5ikta3pgsarvl53npqaehysagpv5dwowgm3jwwrz6m6cgv5w4@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "youtu.be",
         "Labelers on Bluesky",
         "A quick tour of how to use Labelers on Bluesky."
        ]
       }
      ],
      "Link": "https://youtu.be/GOvbRTWOI4g?feature=shared"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3ko5ijpa7nm2g",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3ko5iiv6b662s",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3ko5il54qtl2j"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 20, 2024 at 2:18 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-20 18:18",
    "TimestampMillisecondsEpoch": 1710958680000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.73 is rolling out now (2/3)\n\nAdditionally:\n\n• Mute words are now smarter at handling punctuation\n• Multiple localization improvements\n• Various bugfixes and improvements"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3ko5il54qtl2j",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3ko5ijpa7nm2g",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 20, 2024 at 2:19 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-20 18:19",
    "TimestampMillisecondsEpoch": 1710958740000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.73 is rolling out now (3/3)\n\nAs always, we’d like to thank our GitHub contributors Dovgonosyk, Titianbeetle, alexkuz, cdfzo, gildaswise, ivanbea, jaoler, mitian233, quiple, surfdude29, and the many others who helped with translations."
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3knqry2nkek2u",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3knqrynjfmd2r"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 15, 2024 at 1:03 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-15 17:03",
    "TimestampMillisecondsEpoch": 1710522180000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Today we’re rolling out the first iteration of stackable moderation for Web users. Subscribe to user-operated labelers to make Bluesky a better place for you. Mobile users will receive this update soon.\n\nwww.youtube.com/watch?v=GOvb...",
      "Links": [
       "https://www.youtube.com/watch?v=GOvbRTWOI4g"
      ]
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreibq5hgx2urxusrpfnyyeulpzx23bwp7d3hnuzfhefhpx2ml7pj7i4@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "www.youtube.com",
         "Labelers on Bluesky",
         "A quick tour of how to use Labelers on Bluesky."
        ]
       }
      ],
      "Link": "https://www.youtube.com/watch?v=GOvbRTWOI4g"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3knqrynjfmd2r",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3knqry2nkek2u",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3knqrzq3wsc2q"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 15, 2024 at 1:03 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-15 17:03",
    "TimestampMillisecondsEpoch": 1710522180000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Anyone interested in running their own Labeling service can check out Ozone, our open-source moderation tool. At this stage, Ozone is for highly technical users as it requires operating your own server.\n\ngithub.com/bluesky-soci...",
      "Links": [
       "https://github.com/bluesky-social/ozone/"
      ]
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreidv6a7boszn75yzqv6a3wqgvjbcv72us3iq7k7r5cm5e22sokstwq@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "github.com",
         "GitHub - bluesky-social/ozone: web interface for labeling content in atproto / Bluesky",
         "web interface for labeling content in atproto / Bluesky - bluesky-social/ozone"
        ]
       }
      ],
      "Link": "https://github.com/bluesky-social/ozone/"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3knqrzq3wsc2q",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3knqrynjfmd2r",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 15, 2024 at 1:04 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-15 17:04",
    "TimestampMillisecondsEpoch": 1710522240000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Read a more in-depth technical overview of the new moderation architecture here:"
     },
     {
      "Type": "Attachment",
      "AttachmentContents": [
       {
        "Type": "QuotedPost",
        "Contents": {
         "PostURL": "https://bsky.app/profile/atproto.com/post/3knqrsjeees23",
         "UserTitle": "AT Protocol Developers",
         "UserHandle": "@atproto.com",
         "UserAvatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:ewvi7nxzyoun6zhxrhs64oiz/bafkreibjfgx2gprinfvicegelk5kosd6y2frmqpqzwqkg7usac74l3t2v4@jpeg",
         "PostTimeStamp": {
          "LocalTimeDisplayedOnPage": "Mar 15, 2024 at 1:00 PM (Eastern Daylight Time)",
          "Date_UTC": "2024-03-15 17:00",
          "TimestampMillisecondsEpoch": 1710522000000
         },
         "PostContent": {
          "Segments": [
           {
            "Type": "Text",
            "UserPostedText": "Moderation is a crucial aspect of social networks. However, traditional moderation systems leave communities vulnerable to sudden policy changes and mismanagement.\n\nTo build a better social media ecosystem, it's necessary to try new approaches.\n\ndocs.bsky.app/blog/bluesky..."
           },
           {
            "Type": "LinkPreview",
            "Content": [
             {
              "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:ewvi7nxzyoun6zhxrhs64oiz/bafkreidjuhbpj2ln3ve5umgs3zltahsed4bmzg6bovit3iigdneoqceqta@jpeg"
             },
             {
              "ExternalLinkTexts": [
               "docs.bsky.app",
               "Bluesky's Moderation Architecture | Bluesky",
               "Moderation is a crucial aspect of any social network. However, traditional moderation systems often lack transparency and user control, leaving communities vulnerable to sudden policy changes and pote..."
              ]
             }
            ],
            "Link": "https://docs.bsky.app/blog/blueskys-moderation-architecture"
           }
          ]
         }
        }
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3knk6xt7j2c26",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3knk7kdr7hk2w"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 12, 2024 at 10:07 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-13 02:07",
    "TimestampMillisecondsEpoch": 1710295620000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.71 is rolling out now!\n\nThis one's mainly bugfixes and some improvements to a11y, but it also includes a fancy new context menu which, on mobile, is now a full bottom sheet:"
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreicor2ubcdhfajj6ubzaen5mvtwhwqxdth5nhs4nrgsdlrxdqxqdqq@jpeg",
        "alt": "A screenshot of the bluesky post menu\n\nTranslate\nCopy post text\nShare\nMute thread\nMute words & tags\nHide post\nReport post"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3knk7kdr7hk2w",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3knk6xt7j2c26",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 12, 2024 at 10:17 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-13 02:17",
    "TimestampMillisecondsEpoch": 1710296220000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "1.72* sorry   —paul"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "Bluesky",
   "PostURL": "https://bsky.app/profile/safety.bsky.app/post/3knjj6y6yoi2i",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky Safety",
   "UserHandle": "@safety.bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 12, 2024 at 3:37 PM (Eastern Daylight Time)",
    "Date_UTC": "2024-03-12 19:37",
    "TimestampMillisecondsEpoch": 1710272220000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Bluesky is built to give users control over their social spaces online. Today, we’re open sourcing Ozone, a tool that lets users collaboratively inspect and label content on the network.\n\nLater this week, we’re opening up the ability for users to run their own independent moderation services."
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:eon2iu7v3x2ukgxkqaf7e5np/bafkreif5bxpqjyyjmsqphbuvloo5c7ieqqs54i4wychem2ebvpw7uaxasy@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "Bluesky Social",
         "Bluesky’s Stackable Approach to Moderation - Bluesky",
         "Today, we’re open sourcing Ozone, a tool that lets a team of moderators or curators collaboratively review reports, create labels, and inspect content on the atproto network. Later this week, we’re op..."
        ]
       }
      ],
      "Link": "https://bsky.social/about/blog/03-12-2024-stackable-moderation"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kn2fgg6nns2o",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kn2fibrddk2q"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 6, 2024 at 2:20 PM (Eastern Standard Time)",
    "Date_UTC": "2024-03-06 19:20",
    "TimestampMillisecondsEpoch": 1709752800000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.71 is rolling out now (1/3)\n\nWe’ve added a hashtag view page that should feel a little nicer than jumping to search"
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreiaorhyotvgsnkaezr535xtwnmzieagskivktc6oax7tp6yzl7mgqq@jpeg",
        "alt": "#cats\nToby @tobytwistycat.bsky.social 1 hour ago\nSo #WhiskersWednesday has come around again! #cats #cats of bluesky\n\nTwo pictures of cats"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kn2fibrddk2q",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kn2fgg6nns2o",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kn2fjdiscl2h"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 6, 2024 at 2:21 PM (Eastern Standard Time)",
    "Date_UTC": "2024-03-06 19:21",
    "TimestampMillisecondsEpoch": 1709752860000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.71 is rolling out now (2/3)\n\n• Mutewords now apply to link cards and more effectively catch quoted posts\n• Mutewords no longer mute your own posts\n• Hashtags may now start with numbers\n• Fixed some handling of zero-width characters with hashtags"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kn2fjdiscl2h",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kn2fibrddk2q",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Mar 6, 2024 at 2:21 PM (Eastern Standard Time)",
    "Date_UTC": "2024-03-06 19:21",
    "TimestampMillisecondsEpoch": 1709752860000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.71 is rolling out now (3/3)\n\n• The #️⃣ emoji no longer works as a hashtag (sorry everyone!)\n• Fixed some issues with removing mutewords that start with a #\n• Fixed issues with the external link warning\n• Other small bugfixes"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kmjbfqrrbu2t",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kmjbk3eiec2m"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 28, 2024 at 6:52 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-28 23:52",
    "TimestampMillisecondsEpoch": 1709164320000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.70 is rolling out now (1/6)\n\nHashtags! You can now use #hashtags in your posts. When you tap them, you’ll get a menu with lots of handy options:"
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreib5rlz2v4kabbstwsxuimgelmuksqztxuspc7hkdyvppcmavpnira@jpeg",
        "alt": "A screenshot of Bluesky. A menu is open over a post\n\nThe post says “#Hashtag incoming”\n\nThe menu items are\n“See #Hashtag posts”\n“See #Hashtag posts by this user”\n“Mute #Hashtag posts”"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kmjbk3eiec2m",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kmjbfqrrbu2t",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kmjbp4dmcx2u"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 28, 2024 at 6:55 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-28 23:55",
    "TimestampMillisecondsEpoch": 1709164500000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.70 is rolling out now (2/6)\n\nMute words! In the Moderation screen, you can now add mute words which target either hashtags or the full content of a post (text, alt text, and hashtags)."
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreids5qy72px6yeqwxwdwynqv2oom5zrhqab7hfpv5lgtfpsh46nbfe@jpeg",
        "alt": "A screenshot of the Bluesky side menu\n\nSearch\nHome\nNotifications\nFeeds\nLists\nModeration\nProfile\nSettings\n\nA red arrow is pointed at Moderation"
       },
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreidlcpvkrimoizqs522ds6ztuuafljcx5i4eub4kvsszqx3lhvbb3m@jpeg",
        "alt": "A screenshot of the Moderation screen\n\nContent filtering\nMuted words & tags\nModeration lists\nMuted accounts\nBlocked accounts\n\nA red arrow is pointed at Muted words & tags"
       },
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreidgukpqxkrdnbhdgmecgwj3xqf2jwqj6cfcmelpdwua7moobu3c3e@jpeg",
        "alt": "A screenshot of the mute words menu\n\nAdd muted words and tags\n\nPosts can be muted based on their text, their tags, or both.\n\nEnter a word or tag\n\nMute in text & tags\nMute in tags only\n\nAdd +\n\nWe recommend avoiding common words that appear in many posts, since it can result in no posts being shown."
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kmjbp4dmcx2u",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kmjbk3eiec2m",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 28, 2024 at 6:58 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-28 23:58",
    "TimestampMillisecondsEpoch": 1709164680000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.70 is rolling out now (6/6)\n\nAnd finally: we fixed the bug that caused posts to show up under the wrong users.\n\nWe hope you enjoy this update!"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kmeaguzk7524",
   "ReplyToURL": "",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kmeal6cyzj2k"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 26, 2024 at 6:52 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-26 23:52",
    "TimestampMillisecondsEpoch": 1708991520000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 App Version 1.69 is rolling out now (1/3)\n\nWe’ve improved dark mode and dim mode. Dim is now lighter, and dark’s contrast is now higher.\n\nYou can choose between these in your settings."
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihjsr22e36wqazige5r5fqe5k6ayievvo5k6gbiuhz7r7ld4cdhn4@jpeg",
        "alt": "A screenshot showing the Dim mode in settings\n\nSettings\n+ Add account\nAccessibility\nRequire alt text before posting\nAppearance\nSystem Light Dark (selected)\nDark theme\nDim (selected) Dark\nBasics\nFollowing Feed Preferences\nThread Preferences\nMy Saved Feeds\nLanguages"
       },
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreififg5gi4fjdntika5sodpqw2ellx642txp54by2uswtwkkbpwh6q@jpeg",
        "alt": "A screenshot showing the Dark mode in settings\n\nSettings\n+ Add account\nAccessibility\nRequire alt text before posting\nAppearance\nSystem Light Dark (selected)\nDark theme\nDim Dark (selected)\nBasics\nFollowing Feed Preferences\nThread Preferences\nMy Saved Feeds\nLanguages"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kmeal6cyzj2k",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kmeaguzk7524",
   "RepliesURLs": [
    "https://bsky.app/profile/bsky.app/post/3kmeamlthh62r"
   ],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 26, 2024 at 6:54 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-26 23:54",
    "TimestampMillisecondsEpoch": 1708991640000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.69 is rolling out now (2/3)\n\nWe improved signup. A username-checker helps find the perfect handle, and you don’t need a phone number to sign up anymore. (You do a captcha instead)."
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3kmeamlthh62r",
   "ReplyToURL": "https://bsky.app/profile/bsky.app/post/3kmeal6cyzj2k",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 26, 2024 at 6:55 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-26 23:55",
    "TimestampMillisecondsEpoch": 1708991700000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "📢 1.69 is rolling out now (3/3)\n\n• We fixed some issues that were causing text to disappear, both when looking at posts and when composing posts.\n• Of course: bugfixes and performance improvements."
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3klzrudt4uk2z",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 22, 2024 at 3:04 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-22 20:04",
    "TimestampMillisecondsEpoch": 1708632240000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "We just crossed 5M people total on the network!  🎉"
     },
     {
      "Type": "Media",
      "MediaURLs": [
       {
        "Type": "IMG",
        "URL": "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihp6pc6vauqyeply3tec2rd2mjho2ebrj74nnwq2p7luiuell6vuy@jpeg",
        "alt": "5,004,009 users"
       }
      ]
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  },
  {
   "RepostedByUserTitle": "",
   "PostURL": "https://bsky.app/profile/bsky.app/post/3klzn456sls2w",
   "ReplyToURL": "",
   "RepliesURLs": [],
   "UserTitle": "Bluesky",
   "UserHandle": "@bsky.app",
   "UserAvatar": "",
   "PostTimeStamp": {
    "LocalTimeDisplayedOnPage": "Feb 22, 2024 at 1:39 PM (Eastern Standard Time)",
    "Date_UTC": "2024-02-22 18:39",
    "TimestampMillisecondsEpoch": 1708627140000
   },
   "PostContent": {
    "Segments": [
     {
      "Type": "Text",
      "UserPostedText": "Today, we’re excited to announce that the Bluesky network is federating, or opening up in a way that allows you to host your own data!\n\nRead more here for how this will affect your experience on Bluesky (in short: it won’t) and why this matters. \n\nbsky.social/about/blog/0...",
      "Links": [
       "https://bsky.social/about/blog/02-22-2024-open-social-web"
      ]
     },
     {
      "Type": "LinkPreview",
      "Content": [
       {
        "ExternalLinkImage": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreif5bxpqjyyjmsqphbuvloo5c7ieqqs54i4wychem2ebvpw7uaxasy@jpeg"
       },
       {
        "ExternalLinkTexts": [
         "Bluesky Social",
         "Bluesky: An Open Social Web - Bluesky",
         "Today, we’re excited to announce that the Bluesky network is federating, or opening up in a way that allows you to host your own data."
        ]
       }
      ],
      "Link": "https://bsky.social/about/blog/02-22-2024-open-social-web"
     }
    ]
   },
   "ReplyCount": "",
   "RepostCount": "",
   "LikesCount": "",
   "DateTimeOfScrape": "2024-04-29 22:36:19 UTC"
  }
 ]
}