import {Infographic} from './infographic.js';

class DonutChart extends Infographic {

	constructor(chart_id, title, width, height, data) {
        super(chart_id, 'doughnut', title, width, height, data);
	}

}

function generateDonutChart(processed) {
    // Data format is {"label": "", "data": null}
    var links = [];
    var user_subreddits = [];

    // Only allow a certain number of data points to be shown
    var dataLimit = 10;

    // Chart colours
    var colours = [
        'rgb(82,150,221)',
        'rgb(255,99,20)',
				'#CC00FF',
				'#FF0003',
				'#33FF00',
				'#00B3FF',
				'#FF0085',
				'#006315',
				'#FFFA00',
				'#0005FF',
				'#DA259E',
				'#DABC25',
				'#1ECBE1',
				'#25DA61',
				'#FC00BE',
				'#00FF73',
				'#000CFF',
				'#FF008C',
				'#FFF300',
				'#F807C9'
    ];

    // Check what stages are complete
    var hasLinksData = false;
    var hasCommentsData = false;
    var linksLoaded = "links" in processed.stages && processed.stages.links >= 1;
    var commentsLoaded = "comments" in processed.stages && processed.stages.comments >= 1;

    // Links data
    if (linksLoaded) {
        for (let i = 0; i < processed.postLinks.length; i++) {
            var keys = Object.keys(processed.postLinks[i].subreddits);
            if (!hasLinksData && keys.length > 0) {
                hasLinksData = true;
            }
            for (let a = 0; a < keys.length; a++) {
                links.push({
                    "label": processed.postLinks[i].subreddits[keys[a]].name,
                    "data": processed.postLinks[i].subreddits[keys[a]].locations.length
                });
            }

            // Sort the data
            links.sort(function(a, b) {
                if (a.data > b.data) {
                    return -1;
                } else if (a.data < b.data) {
                    return 1;
                }
                return 0;
            });
        }

        if (!hasLinksData) {
            links.push({"label": "No data available", "data": -1});
        }
    }

    // User subreddits data
    if (commentsLoaded) {
        if (!hasCommentsData) {
            keys = Object.keys(processed.commenters.subreddits);

            var counti = keys.length;
            for (let i = 0; i < counti; i++) {
                user_subreddits.push({
                    "label": keys[i],
                    "data": processed.commenters.subreddits[keys[i]]
                });
            }

            if (counti > 0) {
                hasCommentsData = true;

                // Sort the data
                user_subreddits.sort(function(a, b) {
                    if (a.data > b.data) {
                        return -1;
                    } else if (a.data < b.data) {
                        return 1;
                    }
                    return 0;
                });
            }
        }

        if (!hasCommentsData) {
            user_subreddits.push({"label": "No data available", "data": -1});
        }
    }

    // Reformat data into arrays for donut chart input
    var labels = {"links": [], "user_subreddits": []};
    var data = {"links": [], "user_subreddits": []};

    var subkeys = Object.keys(user_subreddits);
    var counti = subkeys.length;
    for (let i = 0; i < counti; i++) {
        if (i > dataLimit) {
            // Add to "Other" section
            data.user_subreddits[dataLimit] += user_subreddits[i].data;
        } else if (i == dataLimit) {
            labels.user_subreddits.push("Other subreddits (" + (counti - i) + ")");
            data.user_subreddits.push(user_subreddits[i].data);
        } else {
            labels.user_subreddits.push(user_subreddits[i].label);
            data.user_subreddits.push(user_subreddits[i].data);
        }
    }

    var linkeys = Object.keys(links);
    counti = linkeys.length;
    for (let i = 0; i < counti; i++) {
        if (i > dataLimit) {
            // Add to "Other links" section
            data.links[dataLimit] += links[i].data;
        } else if (i == dataLimit) {
            labels.links.push("Other links (" + (counti - i) + ")");
            data.links.push(links[i].data);
        } else {
            labels.links.push(links[i].label);
            data.links.push(links[i].data);
        }
    }

    // Finally, return the data formatted for the chart
    return [
        {
            name: "Link Occurrences",
            labels: labels.links,
            datasets: [
                {
                    data: data.links,
                    backgroundColor: colours
                }
            ]
        },
        {
            name: "Commenter Subreddits",
            labels: labels.user_subreddits,
            datasets: [
                {
                    data: data.user_subreddits,
                    backgroundColor: colours
                }
            ]
        }
    ];
}

// The line chart reference
var donut = null;

// Loads the chart data
function loadChartsData() {
    var processed = JSON.parse(localStorage.getItem("redditDataJSON"));

    if (donut == null) {
        donut = new DonutChart(
            "donut",
            "Donut Chart",
            400,
            400,
            generateDonutChart(processed)
        );
    } else {
        // Regenerate from the updated data
        donut.update(generateDonutChart(processed));
    }
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if ("action" in request && request.action == "ReloadData") {
        loadChartsData();
    }
    sendResponse(null);
});

// First time initialisation
loadChartsData();
