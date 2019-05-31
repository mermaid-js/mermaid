import { Base64 } from 'js-base64'

/**
 * ##contentLoaded
 * Callback function that is called when page is loaded. This functions fetches configuration for mermaid rendering and
 * calls init for rendering the mermaid diagrams on the page.
 */
const contentLoaded = function () {
  let pos = document.location.href.indexOf('?graph=')
  if (pos > 0) {
    pos = pos + 7
    const graphBase64 = document.location.href.substr(pos)
    const graphObj = JSON.parse(Base64.decode(graphBase64))
    // const graph = 'hello'
    console.log(graphObj)
    const div = document.createElement('div')
    div.id = 'block'
    div.className = 'mermaid'
    div.innerHTML = graphObj.code
    document.getElementsByTagName('body')[0].appendChild(div)
    global.mermaid.initialize(graphObj.mermaid)
    global.mermaid.init()
  }
}

if (typeof document !== 'undefined') {
  /*!
   * Wait for document loaded before starting the execution
   */
  window.addEventListener(
    'load',
    function () {
      contentLoaded()
    },
    false
  )
}
