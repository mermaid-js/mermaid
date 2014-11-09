
require.config({
    // Karma serves files from '/base'
    baseUrl: './'

});

require(['mermaid'],function(mermaid){
   mermaid.init();
});