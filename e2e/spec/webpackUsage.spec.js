/* eslint-env jest */
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

describe('Sequencediagram', () => {
  it('should render a simple sequence diagrams', async () => {
    const url = 'http://localhost:9000/webpackUsage.html'

    await page.goto(url)

    const image = await page.screenshot()

    expect(image).toMatchImageSnapshot()
  })
})
