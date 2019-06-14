/* eslint-env jest */
import { imgSnapshotTest } from '../helpers/util.js'
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

describe('Sequencediagram', () => {
  it('should render a simple sequence diagrams', async () => {
    await imgSnapshotTest(page, `
      sequenceDiagram
        participant Alice
        participant Bob
        participant John as John<br/>Second Line
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
          else or this
          Alice->>John: No
          else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
        Alice -->> Bob: Parallel message 1
        and
        Alice -->> John: Parallel message 2
        end
      `,
    {})
  })
})
