/* eslint-env jest */
import { Base64 } from 'js-base64'

export const mermaidUrl = (graphStr, options) => {
  const obj = {
    code: graphStr,
    mermaid: options
  }
  const objStr = JSON.stringify(obj)
  // console.log(Base64)
  return 'http://localhost:9000/e2e.html?graph=' + Base64.encodeURI(objStr)
}

export const imgSnapshotTest = async (page, graphStr, options) => {
  return new Promise(async resolve => {
    const url = mermaidUrl(graphStr, options)

    await page.goto(url)

    const image = await page.screenshot()

    expect(image).toMatchImageSnapshot()
    resolve()
  })
  // page.close()
}
