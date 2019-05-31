import { Base64 } from 'js-base64'

const mermaidUrl = (graphStr, options) => {
  const obj = {
    code: graphStr,
    mermaid: options
  }
  const objStr = JSON.stringify(obj)
  // console.log(Base64)
  return 'http://localhost:9000/e2e.html?graph=' + Base64.encodeURI(objStr)
}

export default mermaidUrl
