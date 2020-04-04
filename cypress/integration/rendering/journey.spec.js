/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util.js';

describe('User journey diagram', () => {
  it('Simple test', () => {
    imgSnapshotTest(
      `journey
title Adding journey diagram functionality to mermaid
section Order from website
    `,
      {}
    );
  });

  it('should render a user journey chart', () => {
    imgSnapshotTest(
      `
    journey
      title Go shopping

      section Get to the shops
      Get car keys: Dad
      Get into car: Dad, Mum, Child#1, Child#2
      Drive to supermarket: Dad

      section Do shopping
      Do actual shop: Mum
      Get in the way: Dad, Child#1, Child#2
      `,
      {}
    );
  });
});
