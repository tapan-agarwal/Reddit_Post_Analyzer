var output = null;

function updateDownload() {
    data = localStorage.getItem("redditDataJSON");
    export_button = document.getElementById("export");
    
    if (!(export_button.href == null || export_button.href == "")) {
        URL.revokeObjectURL(export_button.href);
    }
    
    output = new Blob([data], {type: "text/plain"});
    export_button.href = URL.createObjectURL(output);
    
    processed = JSON.parse(data);
    var out = processed.url.split("/");
    filename = (processed.url[processed.url.length - 1] === '/' ? out[out.length - 2] : out[out.length - 1]) + ".json";
    
    export_button.download = filename;
    
    if (Object.keys(processed.stages).length < 5) {
        export_button.onclick = function() { alert("Warning: Reddit post analysis is incomplete. Exported file will only include stages: " + JSON.stringify(processed.stages)); };
    } else {
        export_button.onclick = null;
    }
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if ("action" in request && request.action == "ReloadData") {
        console.log("Updating download...");
        updateDownload();
    }
    sendResponse(null);
});

updateDownload();
