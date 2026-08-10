import { imgSnapshotTest } from '../../../helpers/util';

describe('neural network diagram', () => {
  it('should render a simple sequential neural network', () => {
    imgSnapshotTest(
      `neuralnet sequential
        title My CNN
        Input[28, 28, 1]
        Conv2D[32, 3x3, relu]
        MaxPool2D[2x2]
        Flatten
        Dense[128, relu]
        Dense[10, softmax]
      `
    );
  });

  it('should render a graph neural network with skip connections', () => {
    imgSnapshotTest(
      `neuralnet
        a: Input[28, 28, 1]
        b: Conv2D[32, 3x3, relu]
        c: MaxPool2D[2x2]
        d: Flatten
        e: Dense[128, relu]
        f: Dense[10, softmax]
        a --> b
        b --> c
        c --> d
        d --> e
        e --> f
        b --> e
      `
    );
  });
});
