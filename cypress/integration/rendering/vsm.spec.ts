import { imgSnapshotTest } from '../../helpers/util.ts';

describe('vsm diagram', () => {
  it('should render a simple vsm diagram', () => {
    imgSnapshotTest(
      `vsm
        from "Start" >> step1 >> to "End"

        step1 "My Step"
            cycletime 1s
      `
    );
  });

  it('should render a vsm diagram with title', () => {
    imgSnapshotTest(
      `vsm
        title Widget Production

        supplier "Steel Co" >> stamping >> customer "Customer"

        stamping "Stamping"
            cycletime 1s
            push
      `
    );
  });

  it('should render a vsm diagram with queues and timeline', () => {
    imgSnapshotTest(
      `vsm
        from "Start" >> step1 >> step2 >> to "End"

        step1 "Step One"
            cycletime 5m
            push

        queue 3d

        step2 "Step Two"
            cycletime 10m
            pull
      `
    );
  });

  it('should render a vsm diagram with duration ranges', () => {
    imgSnapshotTest(
      `vsm
        from "Start" >> step1 >> step2 >> to "End"

        step1 "Step One"
            cycletime 1h-1d
            push

        queue 2d-3d

        step2 "Step Two"
            cycletime 30m-2h
            pull
      `
    );
  });

  it('should render a vsm diagram with data boxes', () => {
    imgSnapshotTest(
      `vsm
        from "Start" >> step1 >> step2 >> to "End"

        step1 "Step One"
            cycletime 5m
            changeover 30m
            push

        queue 2d

        step2 "Step Two"
            cycletime 10m
            changeover 1h
            pull
      `
    );
  });

  it('should render a vsm diagram with summary all', () => {
    imgSnapshotTest(
      `vsm
        from "Start" >> step1 >> step2 >> to "End"

        step1 "Step One"
            cycletime 5m
            push

        queue 3d

        step2 "Step Two"
            cycletime 10m
            pull

        queue 1d

        summary all
      `
    );
  });

  it('should render a vsm diagram with selective summary', () => {
    imgSnapshotTest(
      `vsm
        from "Start" >> step1 >> to "End"

        step1 "Step One"
            cycletime 5m

        queue 3d

        summary
            leadtime
            efficiency
      `
    );
  });

  it('should render a full vsm diagram', () => {
    imgSnapshotTest(
      `vsm
        title Expense Report Process

        from "Start" >> review >> digitize >> fill >> submit >> to "Accounting"

        review "Review Receipts"
            cycletime 1m-5m
            push

        queue 0m

        digitize "Digitize Receipts"
            cycletime 1m-10m
            push

        queue 0m

        fill "Complete Expense Form"
            cycletime 10m-15m

        queue 0m

        submit "Send"
            cycletime 1m-2m

        summary all
      `
    );
  });

  it('should render a vsm diagram with from/to aliases', () => {
    imgSnapshotTest(
      `vsm
        supplier "Vendor" >> process1 >> customer "Client"

        process1 "Processing"
            cycletime 2h
            changeover 30m
            push
      `
    );
  });
});
