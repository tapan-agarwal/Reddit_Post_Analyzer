import {Infographic} from './infographic.js';

class Pie extends Infographic {

    constructor(chart_id, title, width, height, data) {
        super(chart_id, 'pie', title, width, height, data);
    }

}

var processed = JSON.parse(localStorage.getItem("redditDataJSON"));

var data = [processed.upVotes, processed.downEst];
var labels = ["Upvotes", "Downvotes"];
if (processed.upVotes <= 0 && processed.downEst <= 0) {
    data = [-1];
    labels = ["(no votes)"];
}

var pie = new Pie(
    "pie",
    "Upvotes/Downvotes",
    400,
    400,
    [
        {
            name: "Upvotes/Downvotes",
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgb(82,150,221)',
                    'rgb(255,99,20)'
                ]
            }]
        }
    ]
);
