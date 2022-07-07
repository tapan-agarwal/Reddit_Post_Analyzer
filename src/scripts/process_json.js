var asyncRequest = true;

if (typeof XMLHttpRequest === 'undefined') {
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}

var retries = {};

/** @namespace Processing */

/** Enumerated logging levels */
const LogLevel = Object.freeze({"verbose": 0, "info": 1, "warning": 2, "error": 3});

/** The current logging level */
var logging = LogLevel.info;

/**
 * Set the console logging level.
 *@param {string} level - What log level to use. Use the LogLevel values.
 *@memberof Processing
 */
function setLogLevel(level) {
    if (level in LogLevel) {
        logging = LogLevel[level];
    }
}

/**
 * Custom console logging.
 */
var log = {
    "verbose": function() {
        if (logging <= LogLevel.verbose) {
            console.log.apply(console, arguments);
        }
    },
    "info": function() {
        if (logging <= LogLevel.info) {
            console.log.apply(console, arguments);
        }
    },
    "warning": function() {
        if (logging <= LogLevel.warning) {
            console.log.apply(console, arguments);
        }
    },
    "error": function() {
        if (logging <= LogLevel.error) {
            console.log.apply(console, arguments);
        }
    }
};

/**
 * Pause for the specified number of milliseconds,
 * either synchronously or asynchronously depending upon
 * the value of the global asyncRequest variable.
 * @param {int} ms - How many milliseconds to wait.
 * @param {function} onFinish - A function called when waiting is over.
 */
function wait(ms, onFinish) {
    if(asyncRequest){
        setTimeout(onFinish, ms);
    }else{
        date = new Date();
        while((new Date()) - date <= ms){
            /** wait here */
        }
        onFinish();
    }
}

/**
 * The retry_request function takes the url and tries to make an HTTP request up to three times with a 500ms delay.
 *@param {string} url - The url of the page.
 *@param {string} original_request - The original request.
 *@param {function} callback - A callback function called when the request is finished.
 *@memberof Processing
 */
function retry_request(url, original_request, callback, waitTime) {
    onWait = function() {
        if (retries[url] < 3) {
            retries[url]++;
            let xhttpr = new XMLHttpRequest();
            xhttpr.open("GET", url, asyncRequest);
            xhttp.setRequestHeader("Content-Type", "text/plain");
            xhttpr.onreadystatechange = function() { handle_http_response(url, xhttpr, callback); };
            log.info("HTTP response " + original_request.status);
            xhttpr.send();
        } else {
            log.error("ERROR: Reached maximum retry attempts for URL " + url);
            log.error("Response text: " + original_request.responseText);
            callback(null, original_request.status);
        }
    };
    wait(waitTime, onWait);


}

/**
 * The handle_http_response function checks the ready state of the request and responds appropriately.
 *@param {string} url - The url of the page.
 *@param {object} http_request - The http request.
 *@param {function} callback - A callback function called when the request is finished.
 *@memberof Processing
 */

function handle_http_response(url, http_request, callback) {
    if (http_request.readyState == 4) {
        if (http_request.status == 200) {
            callback(http_request.responseText, http_request.status);
        } else if (http_request.status >= 301 && http_request.status <= 308) {
            // Redirect, make a new request
            let xhttpr = new XMLHttpRequest();
            let mainurl = http_request.getResponseHeader("Location");
            xhttpr.open("GET", mainurl, asyncRequest);
            xhttpr.setRequestHeader("Content-Type", "text/plain");
            xhttpr.onreadystatechange = function() { handle_http_response(mainurl, xhttpr, callback); };
            log.info("REDIRECT - HTTP response " + http_request.status + " - NEW URL: " + mainurl);
            xhttpr.send();
        } else if (http_request.status == 429) {
            retry_request(url, http_request, callback, 5000);

        }
        else {
            /*if (http_request.status == 0) {
                // Retry the request
                retry_request(url, http_request, callback);
            } else {*/
            log.error("ERROR: Received HTTP status code " + http_request.status + " on URL " + url);
            log.error("Response text: " + http_request.responseText);
            callback(null, http_request.status);
            //}
        }
    }
}

// Requests actively downloading.
//download_requests = [];


// Asynchronous data download.

/**
* This function downloads data from the URL input as JSON. Does not return anything.
* @param {string} url - The url of the reddit post.
* @param {function} parseDataCallback - A callback which parses the downloaded data. If data is null, an error has occurred.
 *@memberof Processing
*/
function download_raw(url, parseDataCallback, extension = ".json") {
    url = encodeURI(url);
    var domain = new URL(url).hostname;
    // TODO: edge case handling
    isReddit = (String(domain).includes("reddit.com") && (url.includes("/comments/") || url.includes("/duplicates/") || url.includes("/user/") || url.includes("/u/")));
    isPushshift = String(domain).includes("pushshift.io");
    if (isPushshift || isReddit)
    {
        let mainurl = url + extension;
        var xhttp = new XMLHttpRequest();
        //download_requests.push(xhttp);

        xhttp.open("GET", mainurl, asyncRequest);

        xhttp.setRequestHeader("Content-Type", "text/plain");

        xhttp.onreadystatechange = function() { handle_http_response(mainurl, xhttp, parseDataCallback); };
        log.verbose("Sending HTTP request to " + mainurl);
        xhttp.send();
    } else {
        // Webpage isn't on Reddit or Pushshift
        log.error("ERROR: Webpage is not a valid data source.");
        parseDataCallback(null);
    }
}

var redditRequestCount = 1;
var redditDelayTime = 0;
// Unfortunately, one must rate-limit requests to reddit.
const interval = 10000;

/**
 * Wrapper for download_raw() that ensures the reddit rate limit is respected (60 requests per minute).
 * @param {string} url - The url of the reddit post.
 * @param {function} parseDataCallback - A callback which parses the downloaded data. If data is null, an error has occurred.
 * @param {string} extension - Optional file extension to append to end of URL. Defaults to ".json".
 * @memberof Processing
*/
function redditDownload(url, parseDataCallback, extension = ".json") {
    redditRequestCount++;
    if (redditRequestCount > 60) {
        log.info("Hit reddit request limit, waiting with delay = " + redditDelayTime + "ms");
        redditDelayTime += interval;
        wait(interval, function() { if (redditDelayTime >= interval) { redditDelayTime -= interval; } });
        redditRequestCount = 0;
    }
    wait(redditDelayTime, function() {
        if (redditDelayTime != 0) {
            redditRequestCount = 0;
        }
        download_raw(url, parseDataCallback, extension = ".json");
    });
}

 /**
  * The extract_urls function looks up text and extracts urls into a list.
  * @param {array} post - The list of urls.
  * @memberof Processing
  */
function extract_urls(post) {
    var postLinks = [];

    var foundIndex = 0;
    do {
        foundIndex = post.indexOf("://", foundIndex);
        if (foundIndex >= 0) {
            // First make sure link is http or https
            var isSecure = foundIndex > 4 && post.slice(foundIndex - 5, foundIndex) === "https";
            if (foundIndex >= 4 && post.slice(foundIndex - 4, foundIndex) === "http" || isSecure) {

                // TODO: make sure foundindex - 5 or - 6 is valid
                var hasOpenBracket = post[foundIndex - (isSecure ? 6 : 5)] == '(';
                var numOpenBrackets = hasOpenBracket ? 1 : 0;

                // TODO: search both http and https occurrences
                // TODO: handle case where a link is followed by link markup e.g. https%3A%2F%2Fwww.reddit.com%2Fr%2Faww%2Fnew.json%5D(https%3A%2F%2Fwww.reddit.com%2Fr%2Faww%2Fnew.json%5D)
                var url = isSecure ? "https" : "http";
                var allowedCharacters = "!#$&'()*+,/:;=?@[]abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~%";
                for (var c = foundIndex; c < post.length; c++) {

                    var cc = post[c].charCodeAt(0);
                    var isValid = (cc === 33 || (cc >= 35 && cc <= 59) ||
                    cc === 61 || (cc >= 63 && cc <= 91) ||
                    cc === 93 || cc === 95 ||
                    (cc >= 97 && cc <= 122) || cc === 126);

                    if (cc == 40) {
                        numOpenBrackets++;
                    }
                    if (cc == 41)
                    {
                        numOpenBrackets--;
                        if (numOpenBrackets <= 0 && hasOpenBracket)
                        {
                            isValid = false;
                        }
                    }

                    if (!isValid) {
                        break;
                    }

                    url = url + String(post[c]);
                }

                postLinks.push(url);
                total_links++;
            }
            foundIndex += 1;
        }
    } while (foundIndex >= 0 && foundIndex < post.length);

    return postLinks;
}

var total_links = 0;
var rawPostLinks = [];

// How long to wait between link queries to avoid HTTP code 429.
var linkQueryDelay = 500;

/**
 * The proccess_links function analyses the links within a post and queries to pushshift to extract data and determine occurences of these links across reddit.
 * @param {string} data - The raw json data.
 * @param {string} proccessed - The processed json data.
 * @param {function} onComplete - The callback function executed when processing of links is finished.
 * @memberof Processing
 */
function process_links(data, processed, onComplete) {
    var postLinks = [];
    rawPostLinks = [];
    processed.postLinks = [];

    // First, analyse the post itself
    for (var i = 0, counti = data[0].data.children.length; i < counti; i++) {
        post = data[0].data.children[i].data.selftext;

        postLinks = extract_urls(post);
    }

    log.info("Found links:");
    for (plink in postLinks) {
        log.info(String(plink) + ": " + String(postLinks[plink]));
    }

    var query = "http://api.pushshift.io/reddit/submission/search/?q="

    if (postLinks.length == 0) {
        onComplete();
    }
    // Now convert links to searchable URI strings and search with pushshift
    for (let i = 0, counti = postLinks.length; i < counti; i++) {
        rawPostLinks.push(postLinks[i]);
        postLinks[i] = encodeURIComponent(postLinks[i]);
        log.info("\nSearching Reddit for occurrence of link:\n" + postLinks[i]);

        // Pushshift limits number of queries that are allowed, hence waiting between requests.
        wait(i * linkQueryDelay, function() {
            download_raw(query + postLinks[i], function(raw, httpCode) {
                total_links--;
                if (raw == null) {
                    log.warning("WARNING: Failed link query.");
                } else {
                    results = JSON.parse(raw);

                    // Index could vary due to asynchronous nature and the possibility of a download failure.
                    i = processed.postLinks.length;

                    // Metadata for each processed link
                    processed.postLinks.push({
                        "url" : rawPostLinks[i],
                        "subreddits" : {},
                        "occurrences" : 0,
                        "numSubreddits" : 0
                    });

                    // Using the query results, determine occurrences and which subreddits the links appear in.
                    for (var j = 0, countj = results.data.length; j < countj; j++) {
                        processed.postLinks[i].occurrences++;
                        if (!(results.data[j].subreddit_id in processed.postLinks[i])) {
                            processed.postLinks[i].subreddits[results.data[j].subreddit_id] = {};
                            processed.postLinks[i].numSubreddits++;
                        }
                        processed.postLinks[i].subreddits[results.data[j].subreddit_id].name = results.data[j].subreddit;
                        if (!("locations" in processed.postLinks[i].subreddits[results.data[j].subreddit_id])) {
                            processed.postLinks[i].subreddits[results.data[j].subreddit_id].locations = [];
                            processed.postLinks[i].subreddits[results.data[j].subreddit_id].datesms = [];
                        }
                        processed.postLinks[i].subreddits[results.data[j].subreddit_id].locations.push(results.data[j].url);
                        processed.postLinks[i].subreddits[results.data[j].subreddit_id].datesms.push(results.data[j].created_utc * 1000);
                    }
                    log.info("Received link query results for URL: " + rawPostLinks[i]);
                }
                // Once there are no more links to process, complete this stage.
                if (total_links <= 0) {
                    onComplete();
                }

            }, "");
        });

    }

}

var totalCommentsProcessed = 0;
var complete = 0;
var stepCount = 0;
var recursiveSteps = 0;
var commentThreadIds = {};
var progression = 0;
var other_downloads = 0;
var allCommenterNames = {};

/**
 * Processes all commenters in a post and finds the data of each commenters previous comments on different subreddits
 * @param {object} processed - The processed JSON data.
 * @param {object} children - The JSON data.
 * @param {array} moreComments - Additional comment thread ids.
 * @param {function} onComplete - The callback function to be executed when all comments have been processed.
 * @memberof Processing
 */
function recurseComments(processed, children, moreComments, onComplete) {
    recursiveSteps++;

    if (moreComments == null) {
        moreComments = [];
    }

    allCommenterNames = {};

    for (var i = 0; i < children.length && !(children[i] instanceof String); i++) {
        if (children[i].kind === "more") {
            for (var j = 0; j < children[i].data.children.length; j++) {
                //if (!seenComments.has(children[i].data.children[j])) {
                    moreComments.push(children[i].data.children[j]);
                //    seenComments.add(children[i].data.children[j]);
                //}
            }
        } else {
            // Process replies
            if (children[i].data.replies != null && children[i].data.replies != "" && children[i].data.replies.data != null && children[i].data.replies.data.children != "") {
                recurseComments(processed, children[i].data.replies.data.children, moreComments, onComplete);
            }

            // Process individual comment data
            if (children[i].data.controversiality > 0) {
                processed.contCount++;
            }

            // User subreddit analysis
            var commenter_name = children[i].data.author;

            if (!(commenter_name in allCommenterNames) && commenter_name != "[deleted]") {
                other_downloads++;
                allCommenterNames[commenter_name] = 1;
                redditDownload("https://www.reddit.com/user/" + commenter_name, function(raw) {
                    other_downloads--;
                    if (raw == null) {
                        // Error
                    } else {
                        var user = JSON.parse(raw);
                        var subreddits = {};

                        // Count unique subreddits
                        for (var j = 0; j < user.data.children.length; j++) {
                            var subreddit = user.data.children[j].data.subreddit;
                            if (!(subreddit in subreddits)) {
                                subreddits[subreddit] = 1;
                                if (subreddit in processed.commenters.subreddits) {
                                    processed.commenters.subreddits[subreddit]++;
                                } else {
                                    processed.commenters.subreddits[subreddit] = 1;
                                }
                            }
                        }
                    }

                    // Async stage completion
                    if (recursiveSteps == 0 && progression == 0 && other_downloads == 0) {
                        onComplete();
                        stepCount = 0;
                    }
                });
            }

            processed.comments.push({
                "timestamp" : children[i].data.created_utc,
                "controversial" : children[i].data.controversiality > 0
            });

            //log.info("timestamp = " + children[i].data.created_utc + ", date = " + new Date(children[i].data.created_utc));

            totalCommentsProcessed++;
        }
    }
    log.info("Processed " + totalCommentsProcessed + "/~" + processed.numComments + " comments.");

    // Download and process further comments
    for (i = 0; i < moreComments.length; i++) {
        // Make sure duplicates don't get processed.
        let id = moreComments[i];
        if (!(id in commentThreadIds)) {
            stepCount++;
            commentThreadIds[id] = 1;
            progression++;
            //log.info("Requesting comment " + id + " progression = " + progression);
            redditDownload(processed.url + id, function(raw) {
                progression--;
                if (raw != null) {
                    complete++;
                    log.info("Received " + id + ". Downloaded " + complete + "/" + stepCount + " comment threads.");
                    recurseComments(processed, (JSON.parse(raw))[1].data.children, null, onComplete);
                } else {
                    log.warning("WARNING: Failed to download comment thread " + id + "/");
                    stepCount--;
                }
            });
        }
    }

    recursiveSteps--;
    if (recursiveSteps == 0 && progression == 0 && other_downloads == 0) {
        onComplete();
        stepCount = 0;
    }
}

/**
 * The proccess_meta function updates the processed json data in order for it to be displayed on the html page.
 *@param {object} data - The original post data.
 *@param {object} proccessed - The processed json data.
 *@memberof Processing
 */
function process_meta(data, processed) {
    // Basic post data
    totalCommentsProcessed = 0;
    processed.contCount =0; // num controversial comments
    processed.date = new Date(); // date now
    processed.subreddit = data[0].data.children[0].data.subreddit; // subreddit
    processed.url = "https://www.reddit.com" + data[0].data.children[0].data.permalink; // original post url
    processed.postDate = data[0].data.children[0].data.created_utc; // date post created
    processed.title = data[0].data.children[0].data.title; // title
    processed.upVotes =  data[0].data.children[0].data.ups; // net upvotes
    processed.downEst = Math.round(((processed.upVotes / (data[0].data.children[0].data.upvote_ratio * 100)) * 100) - processed.upVotes); // estimated downvotes
    processed.numComments = data[0].data.children[0].data.num_comments; // num comments
    processed.totalAwards = data[0].data.children[0].data.total_awards_received; // num awards
    processed.crossPosts = data[0].data.children[0].data.num_crossposts; // num crossposts
    processed.commenters = {"subreddits": {}};
    // Processed comments
    processed.comments = [];
    // Which processing stages are complete
    processed.stages = {};
}

/**
 * The proccess_reposts function proccesses all commenters in a post and finds the data of each commenters previous comments on different subreddits.
 *@param {object} data - The original post data.
 *@param {object} proccesed - The processed json data.
 *@param {function} onComplete - The callback function that is executed when reposts have been processed.
 *@memberof Processing
 */

 function process_reposts(data, processed, onComplete){
     let duplicate_url = processed.url.replace("/comments/", "/duplicates/");
     processed.duplicates = {};
     processed.duplicates.url = [];
     processed.duplicates.data = [];
     log.info("Processing reposts...");
     redditDownload(duplicate_url, function(raw_json) {
         if (raw_json == null) {
             return;
         }
         data = JSON.parse(raw_json);
         for (var i = 0; i < data[1].data.children.length; i++) {
           var checkIf = processed.duplicates.url
           if (checkIf.includes(data[1].data.children[i].data.permalink)) {
           } else {
               processed.duplicates.url.push(data[1].data.children[i].data.permalink);
           }
         }

         let total_reposts = processed.duplicates.url.length;
         if (total_reposts == 0) {
             onComplete();
         }
         for (var i = 0; i < processed.duplicates.url.length; i++) {
             var repost_url = ("https://www.reddit.com" + processed.duplicates.url[i]);
             redditDownload(repost_url, function(duplicate_json) {
                 if (duplicate_json == null) {
                     // uh oh
                     return;
                 }
                 process_raw(
                     duplicate_json,
                     function(stage, repost_data) {
                         log.info("Repost " + repost_data.url + " stage completed: " + stage);
                         repost_data.stages[stage] = 1;

                         // TODO: wtf is this condition for? surely reposts stage onComplete can happen out of order?
                         if (
                             "meta" in repost_data.stages &&
                             "initial" in repost_data.stages
                         ) {
                             processed.duplicates.data.push(repost_data);
                             total_reposts--;
                           //  processed.duplicates.data.push(repost_data);
                             log.info("Repost " + repost_data.url + " processing finished, " + total_reposts + " repost(s) remaining.");
                             if (total_reposts <= 0) {
                                 onComplete();
                             }
                         }
                     },

                 false);

             },);
         }
     });

 }

/**
 * Takes the raw json data and processes it to a form ready for further data manipulation.
 *@param {string} raw_json - The original post data.
 *@param {function} onStageComplete - Callback function that is called when each stage is completed.
 *@param {boolean} process_duplicates - Makes sure reposts aren't infinitely processed.
 *@memberof Processing
 */

function process_raw(raw_json, onStageComplete, process_duplicates = true) {
    var data = JSON.parse(raw_json);
    var processed = {};

    if (data.length > 0) {

        // Main post data
        process_meta(data, processed);
        onStageComplete("meta", processed);

        // Now process reposts
        if (process_duplicates) {
          process_reposts(data, processed, function() { onStageComplete("reposts", processed); });
          // Comments
          recurseComments(
              processed,
              data[1].data.children,
              null,
              function() {
                  onStageComplete("comments", processed);
              }
          );
          log.info("Processed primary comments.");
          // Extract URLs in post and query pushshift
          // TODO: do the same for links in comments
          process_links(data, processed, function() { onStageComplete("links", processed); });
        }

        // There may be further downloads and processing pending, but initial processing is complete.
        onStageComplete("initial", processed);

    } else {
        onStageComplete("ERROR", null);
    }
}
/**
 * This function toggles the download between synchronous to asynchronous.
 *@param {boolean} async - Makes downloads synchronous or asynchronous.
 *@memberof Processing
 */
function setAsync(async){
    asyncRequest = async;
}

repost_json = [];
if (typeof module !== 'undefined') {
    module.exports = { download_raw, process_raw, process_meta, extract_urls, process_links, process_reposts, recurseComments, setAsync, setLogLevel, redditDownload};
}
