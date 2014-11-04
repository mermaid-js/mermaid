/**
 * Created by knut on 14-11-03.
 */
define('parser/scope',function() {
    var scope = {
        addVertex: function (id, text, type, style) {
            console.log('Got node ' + id + ' ' + type + ' ' + text + ' styles: ' + JSON.stringify(style));
        },
        addLink: function (start, end, type, linktext) {
            console.log('Got link from ' + start + ' to ' + end + ' type:' + type.type + ' linktext:' + linktext);
        },
        getLinks: function () {
            return 'apa';
        }
    };

    return scope;
});
