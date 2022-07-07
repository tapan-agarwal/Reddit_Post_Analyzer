const processor = require("./process_json");

test_num = [];
counter = 0;
finish_test = 0;
tests_complete = false;
test_check = false;
test_group = {};
test_averages = {};

function run_test(test){
    var d = new Date();
    test_num.push(d.getTime());
    try {
        test(counter);
        console.log("Test " + counter + " completed");
    }   catch (err) {
        console.log("Test " + counter + " failed (exception occurred)!");
        console.log(err);
    }
    counter++;
}

function on_finish(test_index, nextTest = null){
    finish_test++;
    test_num[test_index] = (new Date()).getTime() - test_num[test_index];
    console.log("Test " + test_index + " finished!");
    if (nextTest != null) {
        nextTest();
    } else if (finish_test >= counter && tests_complete) {
        console.log("Completed: " + test_num + "miliseconds");
        console.log("Average test results:");
        var keys = Object.keys(test_group);
        for (var i = 0; i < keys.length; i++) {
            if (!(test_group[keys[i]] in test_averages)) {
                test_averages[test_group[keys[i]] + "avg"] = 0;
                test_averages[test_group[keys[i]] + "count"] = 0;
            }
            test_averages[test_group[keys[i]] + "avg"] += test_num[keys[i]];
            test_averages[test_group[keys[i]] + "count"]++;
        }
        
        keys = Object.keys(test_averages);
        for (var i = 0; i < keys.length; i++) {
            console.log("Average time for group " + (i + 1) + " = " + (test_averages[test_group[keys[i]] + "avg"] / test_averages[test_group[keys[i]] + "count"]));
        }
        
        test_check = true;
    }
}

function commentsTest(url_list, i) {
    processor.redditDownload(url_list[i], function(downloaded){
        if (downloaded != null) {
            let post = JSON.parse(downloaded);
            let jsonData = {};
            processor.process_meta(post, jsonData);
            
            let func = null;
            if (i < url_list.length - 1) {
                let urls = url_list;
                let index = i;
                func = function() { commentsTest(urls, index + 1); }
            }
            
            run_test(function(test_index) {
                test_group[test_index] = 2;
                processor.process_links(post, jsonData, function() {
                    on_finish(test_index, func);
                });
            });
            
            /*run_test(function(test_index) {
                test_group[test_index] = 3;
                processor.recurseComments(
                    jsonData,
                    post[1].data.children,
                    null,
                    function() {
                    on_finish(test_index, func);
                });
            });*/
            
        }
    });
}

function run_stress_tests() {
//    processor.setAsync(false);
    processor.setLogLevel("verbose");
    url_list = [
        //"https://www.reddit.com/r/todayilearned/comments/n7mz21/til_british_parliament_had_an_official_discussion/",
        "https://www.reddit.com/r/YouShouldKnow/comments/4jrvvb/ysk_about_these_useful_websites/",
        "https://www.reddit.com/r/YouShouldKnow/comments/4jrvvb/ysk_about_these_useful_websites/",
        "https://www.reddit.com/r/YouShouldKnow/comments/4jrvvb/ysk_about_these_useful_websites/",
        "https://www.reddit.com/r/YouShouldKnow/comments/4jrvvb/ysk_about_these_useful_websites/",
        "https://www.reddit.com/r/YouShouldKnow/comments/4jrvvb/ysk_about_these_useful_websites/"
        /*"https://www.reddit.com/r/MaliciousCompliance/comments/n78uit/ice_cream_shop_server_tells_me_that_i_cant_buy_a/",
        "https://www.reddit.com/r/comedyheaven/comments/n78p0u/squid/",
        "https://www.reddit.com/r/nextfuckinglevel/comments/n7hvz0/this_idea_is_brilliant_really_makes_you_think_and/",
        "https://www.reddit.com/r/stocks/comments/n7eybf/96_of_us_users_opt_out_of_app_tracking_in_ios_145/",
        "https://www.reddit.com/r/space/comments/mr1ah1/blue_origin_new_shepard_booster_landing_after/",
        "https://www.reddit.com/r/funny/comments/mrbpn6/kpop_shadow_is_coming_for_you/",
        "https://www.reddit.com/r/IdiotsInCars/comments/mr4gku/driver_takes_exit_ramp_way_too_fast/",
        "https://www.reddit.com/r/worldnews/comments/mrbh71/worlds_8_richest_people_now_have_a_combined_net/",
        "https://www.reddit.com/r/nba/comments/mr724l/highlight_luka_throws_it_in_to_win_the_game/"*/
    ];

    console.log("Total URLs = " + url_list.length);
    /*for (i = 0; i < url_list.length; i++) {
        run_test(function(test_index) {
            test_group[test_index] = 1;
            processor.redditDownload(url_list[i], function(data) {
                if (data != null) {
                    var processed = {};
                    processor.process_meta(JSON.parse(data), processed);
                }
                on_finish(test_index);
            });
        });
    }*/
    
    commentsTest(url_list, 0);
    
    tests_complete = true;
    console.log("Completed: "+ test_num);

}


if (typeof module !== 'undefined') {
    module.exports = { run_stress_tests };
}
