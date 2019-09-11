/* eslint-env jest */
import { imgSnapshotTest } from '../helpers/util.js'
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

/* eslint-disable */
describe('XSS', () => {
  it('should handle xss in tags', () => {
    // const str = 'graph LR;\nB-->D(<img onerror=location=`javascript\u003aalert\u0028document.domain\u0029` src=x>);'
    const str = 'eyJjb2RlIjoiXG5ncmFwaCBMUlxuICAgICAgQi0tPkQoPGltZyBvbmVycm9yPWxvY2F0aW9uPWBqYXZhc2NyaXB0XFx1MDAzYXhzc0F0dGFja1xcdTAwMjhkb2N1bWVudC5kb21haW5cXHUwMDI5YCBzcmM9eD4pOyIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19';
    imgSnapshotTest(str,
    {}, true)
  })
})
