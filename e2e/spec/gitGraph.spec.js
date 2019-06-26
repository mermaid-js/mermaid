/* eslint-env jest */
import { imgSnapshotTest } from '../helpers/util.js'
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

describe('Sequencediagram', () => {
  it('should render a simple git graph', async () => {
    await imgSnapshotTest(page, `
    gitGraph:
      options
      {
          "nodeSpacing": 150,
          "nodeRadius": 10
      }
      end
      commit
      branch newbranch
      checkout newbranch
      commit
      commit
      checkout master
      commit
      commit
      merge newbranch
      `,
    {})
  })
})
