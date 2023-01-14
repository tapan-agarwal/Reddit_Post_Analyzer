# RedditPostAnalyser
A Chrome extension for processing and analyzing metadata on specific Reddit posts.

Can also be used as a standalone Node command line application.

## Usage
First of all, download this repository and extract it (or `git clone`).

As a Chrome extension, you need to add it via the extensions menu:

1. In Chrome, click on the 3 dots menu in the upper right corner and hover over the "More tools" section, then click "Extensions"
2. Enable developer mode with the toggle in the top right of the page
3. Click "Load Unpacked"
4. Locate the repository folder and select it
5. Pin the extension by clicking the puzzle piece icon and the pin button next to "Reddit Post Analyser"
6. You can now navigate to any reddit post in the browser and click on the extension tool bar button to analyse it.

As a standalone command line application:

1. Install Node
2. Run `npm install` in the root repository directory
3. Once installed, run `node . <reddit post URL(s)> -o .` to process reddit posts and output to JSON files in the current directory.




