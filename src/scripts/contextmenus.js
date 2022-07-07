let context_api, tabs_api;
if (chrome) {
    context_api = chrome.contextMenus;
    tabs_api = chrome.tabs;
} else if (browser) {
    context_api = browser.menus;
    tabs_api = browser.tabs;
} else {
    throw new Error('Could not find browser extension sdk');
}
const actions = {
      github: 'https://github.com/SpectralCascade/RedditPostAnalyser'
};

const context_listener = (info, tab) => {
    if (info.menuItemId in actions) {
        tabs_api.create({
            url: actions[info.menuItemId]
        })
      }
    else
    {
      tabs_api.create({url: "src/ui/modal.html"});
    }
  };
const context_defs = [{
        id: 'import',
        type: 'normal',
        title: 'Import JSON from file'
    },
    {
        id: 'github',
        type: 'normal',
        title: 'Github page'
    }
];
context_defs.forEach(context => {
    context['contexts'] = ['browser_action', 'page_action'];
    context_api.create(context);
});
context_api.onClicked.addListener(context_listener);
