/* eslint-env jest */
import { imgSnapshotTest } from '../helpers/util.js'
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

describe('Pie Chart simple', () => {
  it('should render a simple Pie chart diagram', async () => {
    await imgSnapshotTest(page, `
    pie
    "Ash" : 40
    "Bat" : 50
      `,
    {})
  })
})
