require.config({
    baseUrl: '.',
    paths: {
        // the left side is the module ID,
        // the right side is the path to
        // the jQuery file, relative to baseUrl.
        // Also, the path should NOT include
        // the '.js' file extension. This example
        // is using jQuery 1.9.0 located at
        // js/lib/jquery-1.9.0.js, relative to
        // the HTML page.
        mermaid: 'bower_components/mermaid/dist/mermaid.full'
    }
});

// Start the main app logic.
requirejs(['simple','mermaid'],
    function   (simple) {
        //jQuery, canvas and the app/sub module are all
        //loaded and can be used here now.
        mermaid.init();
    });