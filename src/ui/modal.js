
document.getElementById("JSON").onchange = ImportJSON ;
document.getElementById("JSON").onclick = function() {
  this.value = null;
}

var closeButton = document.getElementById("rpa_modal_close_button");

closeButton.onclick = function() {
    // Send message to tab
    parent.postMessage('_rpa_close_popup', '*');
};

/** @namespace ChromeExtension */

/** This function imports a processed JSON file and opens the infographics page
* @memberof ChromeExtension
*/
function ImportJSON() {
  var reader = new FileReader();
  reader.readAsText(this.files[0]);
  reader.onload = function() {
    localStorage.setItem("redditDataJSON", reader.result);
    chrome.tabs.create({url: 'src/ui/output.html'});
  }
}
