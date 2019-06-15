/* eslint-env jest */
import { imgSnapshotTest } from '../helpers/util.js'
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

describe('Sequencediagram', () => {
  it('should render a simple info diagrams', async () => {
    await imgSnapshotTest(page, `
    info
       showInfo
      `,
    {})
  })
})
