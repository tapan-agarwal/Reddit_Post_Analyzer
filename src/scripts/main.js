var mainTab = null;
var extensionTab = null;
let placeholder = {};

/** @namespace ChromeExtension */

/**
* This function receives the JSON data from reddit page
* @param {string} data - The downloaded JSON data
* @memberof ChromeExtension
*/
function parseJSON(data) {
    if (data != null)
    {
        process_raw(data, function(stage, processed) {
            if (stage === "ERROR") {
                console.log("Failed to retrieve data.");
            }
            else if (stage === "initial") {
                // Initial post processing is complete
                processed.stages[stage] = 1;
                localStorage.setItem("redditDataJSON", JSON.stringify(processed));
                chrome.tabs.create({url: 'src/ui/output.html'}, function (tab) { extensionTab = tab; });
            }
            else {
                processed.stages[stage] = 1;
                localStorage.setItem("redditDataJSON", JSON.stringify(processed));
                console.log("Stage complete: " + stage);
                // Reload the extension
                if (extensionTab != null) {
                    console.log("Reloading charts data, reached stage: " + stage);
                    chrome.tabs.sendMessage(extensionTab.id, {action: "ReloadData"}, function(response) {
                        // Nothing here needed
                    });
                }
            }
        });
    }
    else if (mainTab != null)
    {
        chrome.tabs.sendMessage(mainTab.id, {action: "Popup"}, function(response) {
            // Nothing here needed
        });
    }
    mainTab = null;
}

/**
* Called when the toolbar button is clicked.
* @param {object} tab - The current open tab.
* @memberof ChromeExtension
*/
function main(tab) {
    extensionTab = null;
    mainTab = tab;
    download_raw(tab.url, parseJSON);
}

chrome.browserAction.onClicked.addListener(main);
