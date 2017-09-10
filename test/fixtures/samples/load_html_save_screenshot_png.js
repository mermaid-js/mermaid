
// usage: ../../../node_modules/.bin/phantomjs <html> <png>
import system from 'system'
import webpage from 'webpage'

const html = system.args[1]
const png = system.args[2]
console.log('png:', png)

const page = webpage.create()

page.open(html)
page.onLoadFinished = function () {
  page.render(png)
  global.phantom.exit()
}
