/* eslint-env jest */
import mermaidUrl from '../helpers/util.js'
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

describe('Google', () => {
  it('should apa', async () => {
    const url = mermaidUrl(`graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
    `, {})

    await page.goto(url)

    const image = await page.screenshot()

    expect(image).toMatchImageSnapshot()
  })
})
