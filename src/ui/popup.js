/** @namespace ChromeExtension */

/** Generates popup iframe
* @memberof ChromeExtension
*/
function Popup() {
    var iFrame  = document.getElementById("_rpa_modal_popup_frame");
    if (iFrame != null) {
        iFrame.remove();
    }

    iFrame = document.createElement ("iframe");
    iFrame.id = "_rpa_modal_popup_frame";

    iFrame.src  = chrome.extension.getURL ("src/ui/modal.html");
    iFrame.width = 500;
    iFrame.height = 200;

    // Make sure the popup sits on top of the page in a fixed position
    iFrame.style.position = "fixed";
    iFrame.style.zIndex = 9999999;
    iFrame.style.display = "Block";
    iFrame.style.right = 0;
    iFrame.style.top = 0;
    iFrame.style.borderWidth = 0;

    // Close button message handler - needed to allow cross-origin scripting.
    window.onmessage = function (event) {
        if (event.data === "_rpa_close_popup") {
            iFrame.remove();
        }
    };

    document.body.insertBefore (iFrame, document.body.firstChild);

}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    Popup();
    sendResponse(null);
});
