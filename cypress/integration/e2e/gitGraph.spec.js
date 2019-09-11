/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util.js'

describe('Sequencediagram', () => {
  it('should render a simple git graph', () => {
    imgSnapshotTest(`
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
