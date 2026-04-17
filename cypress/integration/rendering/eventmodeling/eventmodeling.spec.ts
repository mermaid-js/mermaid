import { imgSnapshotTest } from '../../../helpers/util.ts';

/**
 * Check whether the SVG Element has an Event Modeling root
 *
 * @param $p - The element to check.
 */
function shouldHaveRoot($p: JQuery<SVGSVGElement>) {
  const svgElement = $p[0];
  expect(svgElement.nodeName).equal('svg');

  const emBoxes = svgElement.getElementsByClassName('em-box');
  expect(emBoxes).to.have.lengthOf.at.least(1);
}

describe('Event Modeling Diagram', () => {
  it('renders a state view pattern', () => {
    imgSnapshotTest(
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 evt ItemAdded
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('renders a state change pattern', () => {
    imgSnapshotTest(
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 evt ItemAdded
tf 04 cmd RemoveItem
tf 05 evt ItemRemoved
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('renders a translation pattern', () => {
    imgSnapshotTest(
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 evt ItemAdded
tf 04 rmo CartItems ->> 03
tf 05 evt AccountingItemAdded
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('renders with data block reference', () => {
    imgSnapshotTest(
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem { productId: 7 }
tf 03 evt ItemAdded [[ItemAddedData]]

data ItemAddedData
{
  productId: 7,
  quantity: 1
}
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('renders with qualified names', () => {
    imgSnapshotTest(
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd Inventory.AddItem
tf 03 evt Inventory.ItemAdded
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });

  it('renders with multiple source relations', () => {
    imgSnapshotTest(
      `eventmodeling

tf 01 ui CartScreen
tf 02 cmd AddItem
tf 03 cmd RemoveItem
tf 04 evt ItemChanged ->> 02 ->> 03
    `,
      {},
      undefined,
      shouldHaveRoot
    );
  });
});
