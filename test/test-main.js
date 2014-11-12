/**
 * Created by knut on 14-11-03.
 */
var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/spec\.js$/.test(file)) {
            var file2 = file.substr(10,file.length-13);
            console.log('Testing with: '+file2);

            tests.push(file2);
            //
        }
    }
}
//tests.push('parser/flow.spec');

require.config({
    // Karma serves files from '/base'
    baseUrl: '/base/src',

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});
