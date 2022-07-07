#!/usr/bin/env node

const processor = require("./process_json");
const unit_tests = require("./unit_tests");
const stress_test = require("./stress_test");
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const fs = require('fs');
const path = require('path');

var outputData = [];
var outputDir = "";
var urls = [];
var posts_completed = 0;
var post_requests = 0;
var stages_complete = 0;

/** @namespace NodeStandalone */

/**
* This function receives the JSON data from reddit page
* @param {string} data - The downloaded JSON data
* @memberof NodeStandalone
*/
function receiveJSON(data) {
    if (data == null) {
        console.log("Fatal error receiving post data!");
        posts_completed++;
        if (posts_completed >= post_requests) {
            process.exit();
        }
    }

    // Process data
    processor.process_raw(data, function(stage, processed) {
        console.log("Processor completed stage: " + stage);
        if (stage === "ERROR") {
            console.log("Failed to retrieve JSON data.");
            outputData.push(null);
            posts_completed++;
        } else {
            processed.stages[stage] = 1;
            if ("meta" in processed.stages &&
                "comments" in processed.stages &&
                "links" in processed.stages &&
                "reposts" in processed.stages
            ) {
                // Finished!
                outputData.push(JSON.stringify(processed));
                posts_completed++;
                console.log("\nFinished processing " + posts_completed + "/" + post_requests + " post(s).\n");

                // Save when all posts are finished.
                if (posts_completed >= post_requests) {
                    saveOutputData();
                    process.exit();
                } else {
                    start_processing();
                }
            }
        }
    });
}

/**
* Save processed JSON to file(s)
* @memberof NodeStandalone
*/
function saveOutputData() {
    for (i = 0, counti = outputData.length; i < counti; i++) {
        if (outputData[i] == null) {
            // If outputData is invalid, skip
            continue;
        }
        var out = urls[i].split("/");
        var fpath = path.join(
            outputDir,
            String(i).padStart(String(counti).length, '0') + "_" +
                (urls[i][urls[i].length - 1] === '/' ? out[out.length - 2] : out[out.length - 1]) + ".json"
        );
        fs.writeFileSync(fpath, outputData[i]);

        console.log("Saved processed JSON file '" + fpath + "'.");
    }
}
/**
* This function starts downloading and processing posts
* @memberof NodeStandalone
*/
function start_processing() {
    if (post_requests > posts_completed) {
        console.log("Downloading JSON from URL: " + urls[posts_completed]);
        processor.download_raw(urls[posts_completed], receiveJSON);
        console.log("Awaiting processing results...");
    }
}

if (process.argv.length > 2) {
    var nextArgIsDirectory = false;
    var runTests = false;
    var stressTest = false;

    for (i = 2; i < process.argv.length; i++) {
        if (process.argv[i] == "-o" || process.argv[i] == "--output") {
            nextArgIsDirectory = true;
        } else if (nextArgIsDirectory) {
            outputDir = process.argv[i];
            nextArgIsDirectory = false;
        } else if (process.argv[i] == "-t" || process.argv[i] == "--test") {
            runTests = true;
        } else if (process.argv[i] == "-s" || process.argv[i] == "--stress-test") {
            stressTest = true;
        } else if (process.argv[i] == "--verbose") {
            processor.setLogLevel("verbose");
        } else {
            urls.push(process.argv[i]);
            post_requests++;
        }
    }

    // If no directory output specified in cmd args, ask for one.
    if (runTests) {
        unit_tests.run_unit_tests();
    } else if (stressTest) {
        stress_test.run_stress_tests();
    }

    else if (outputDir == "") {
        readline.question("Please specify a directory to export the processed JSON file(s): ", dir => {
            outputDir = dir;
            readline.close();
            start_processing();
        });
    } else {
        start_processing();
    }
}
else {
    console.log("No arguments provided, please specify one or more Reddit post URLs to process.");
    console.log(process.argv);
}
