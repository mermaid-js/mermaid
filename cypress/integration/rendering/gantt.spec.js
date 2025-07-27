import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('Gantt diagram', () => {
  beforeEach(() => {
    cy.clock(new Date('1010-10-10').getTime());
  });
  it('should render a gantt chart', () => {
    imgSnapshotTest(
      `
    gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      section A section
      Completed task            :done,    des1, 2014-01-06,2014-01-08
      Active task               :active,  des2, 2014-01-09, 3d
      Future task               :         des3, after des2, 5d
      Future task2               :         des4, after des3, 5d

      section Critical tasks
      Completed task in the critical line :crit, done, 2014-01-06,24h
      Implement parser and jison :crit, done, after des1, 2d
      Create tests for parser             :crit, active, 3d
      Future task in critical line        :crit, 5d
      Create tests for renderer           :2d
      Add to mermaid                      :1d

      section Documentation
      Describe gantt syntax               :active, a1, after des1, 3d
      Add gantt diagram to demo page      :after a1  , 20h
      Add another diagram to demo page    :doc1, after a1  , 48h

      section Last section
      Describe gantt syntax               :after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      {}
    );
  });
  it('Handle multiline section titles with different line breaks', () => {
    imgSnapshotTest(
      `
      gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title       GANTT diagram with multiline section titles
      excludes    weekdays 2014-01-10

      section A section<br>multiline
      Completed task            : done,    des1, 2014-01-06,2014-01-08
      Active task               : active,  des2, 2014-01-09, 3d
      Future task               :          des3, after des2, 5d
      Future task2              :          des4, after des3, 5d

      section Critical tasks<br/>multiline
      Completed task in the critical line : crit, done, 2014-01-06, 24h
      Implement parser and jison          : crit, done, after des1, 2d
      Create tests for parser             : crit, active, 3d
      Future task in critical line        : crit, 5d
      Create tests for renderer           : 2d
      Add to mermaid                      : 1d

      section Documentation<br />multiline
      Describe gantt syntax               : active, a1, after des1, 3d
      Add gantt diagram to demo page      : after a1, 20h
      Add another diagram to demo page    : doc1, after a1, 48h

      section Last section<br	/>multiline
      Describe gantt syntax               : after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      {}
    );
  });
  it('Multiple dependencies syntax', () => {
    imgSnapshotTest(
      `
      gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      apple :a, 2017-07-20, 1w
      banana :crit, b, 2017-07-23, 1d
      cherry :active, c, after b a, 1d
      `,
      {}
    );
  });
  it('should handle multiple dependencies syntax with after and until', () => {
    imgSnapshotTest(
      `
      gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10
      todayMarker off

      section team's critical event
      deadline A           :milestone, crit, deadlineA, 2024-02-01, 0
      deadline B           :milestone, crit, deadlineB, 2024-02-15, 0
      boss on leave        :bossaway, 2024-01-28, 2024-02-11

      section new intern
      onboarding           :onboarding, 2024-01-02, 1w
      literature review    :litreview, 2024-01-02, 10d
      project A            :projectA, after onboarding litreview, until deadlineA bossaway
      chilling             :chilling, after projectA, until deadlineA
      project B            :projectB, after deadlineA, until deadlineB
      `,
      {}
    );
  });
  it('should FAIL rendering a gantt chart for issue #1060 with invalid date', () => {
    imgSnapshotTest(
      `
      gantt
      excludes weekdays 2017-01-10
      title Projects Timeline

      section asdf
          specs :done, :ps, 2019-05-10, 50d
          Plasma      :pc, 2019-06-20, 60d
          Rollup  :or, 2019-08-20, 50d

      section CEL

          plasma-chamber      :done, :pc, 2019-05-20, 60d
          Plasma Implementation (Rust)      :por, 2019-06-20, 120d
          Predicates (Atomic Swap)      :pred, 2019-07-20, 60d

      section DEX

          History zkSNARK  :hs, 2019-08-10, 40d
          Exit           :vs, after hs, 60d
          PredicateSpec          :ps, 2019-09-1, 20d
          PlasmaIntegration     :pi, after ps,40d


      section Events

      ETHBoston :done, :eb, 2019-09-08, 3d
      DevCon :active, :dc, 2019-10-08, 3d

      section Plasma Calls & updates
          OVM      :ovm, 2019-07-12, 120d
      Plasma call 26 :pc26, 2019-08-21, 1d
      Plasma call 27 :pc27, 2019-09-03, 1d
      Plasma call 28 :pc28, 2019-09-17, 1d
        `,
      {}
    );
  });

  it('should default to showing today marker', () => {
    // This test only works if the environment thinks today is 1010-10-10
    imgSnapshotTest(
      `
      gantt
        title Show today marker (vertical line should be visible)
        dateFormat YYYY-MM-DD
        axisFormat %d
        %% Should default to being on
        %% todayMarker on
        section Section1
         Yesterday: 1010-10-09, 1d
         Today: 1010-10-10, 1d
      `,
      {}
    );
  });

  it('should hide today marker', () => {
    imgSnapshotTest(
      `
      gantt
        title Hide today marker (vertical line should not be visible)
        dateFormat YYYY-MM-DD
        axisFormat %d
        todayMarker off
        section Section1
         Yesterday: 1010-10-09, 1d
         Today: 1010-10-10, 1d
      `,
      {}
    );
  });

  it('should style today marker', () => {
    imgSnapshotTest(
      `
    gantt
      title Style today marker (vertical line should be 5px wide and half-transparent blue)
      dateFormat YYYY-MM-DD
      axisFormat %d
      todayMarker stroke-width:5px,stroke:#00f,opacity:0.5
      section Section1
       Yesterday: 1010-10-09, 1d
       Today: 1010-10-10, 1d
      `,
      {}
    );
  });

  it('should handle milliseconds', () => {
    imgSnapshotTest(
      `
    gantt
      title A Gantt Diagram
      dateFormat x
      axisFormat %L
      section Section
      A task           :a1, 0, 30ms
      Another task     :after a1, 20ms
      section Another
      Another another task      :b1, 20, 12ms
      Another another another task     :after b1, 0.024s
        `,
      {}
    );
  });

  it('should render a gantt diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `
    gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      section A section
      Completed task            :done,    des1, 2014-01-06,2014-01-08
      Active task               :active,  des2, 2014-01-09, 3d
      Future task               :         des3, after des2, 5d
      Future task2               :         des4, after des3, 5d

      section Critical tasks
      Completed task in the critical line :crit, done, 2014-01-06,24h
      Implement parser and jison :crit, done, after des1, 2d
      Create tests for parser             :crit, active, 3d
      Future task in critical line        :crit, 5d
      Create tests for renderer           :2d
      Add to mermaid                      :1d

      section Documentation
      Describe gantt syntax               :active, a1, after des1, 3d
      Add gantt diagram to demo page      :after a1  , 20h
      Add another diagram to demo page    :doc1, after a1  , 48h

      section Last section
      Describe gantt syntax               :after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      { gantt: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      // expect(svg).to.have.attr('height');
      // use within because the absolute value can be slightly different depending on the environment ±5%
      // const height = parseFloat(svg.attr('height'));
      // expect(height).to.be.within(484 * 0.95, 484 * 1.05);
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).to.be.within(
        Cypress.config().viewportWidth * 0.95,
        Cypress.config().viewportWidth * 1.05
      );
    });
  });

  it('should render a gantt diagram when useMaxWidth is false', () => {
    renderGraph(
      `
    gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      section A section
      Completed task            :done,    des1, 2014-01-06,2014-01-08
      Active task               :active,  des2, 2014-01-09, 3d
      Future task               :         des3, after des2, 5d
      Future task2               :         des4, after des3, 5d

      section Critical tasks
      Completed task in the critical line :crit, done, 2014-01-06,24h
      Implement parser and jison :crit, done, after des1, 2d
      Create tests for parser             :crit, active, 3d
      Future task in critical line        :crit, 5d
      Create tests for renderer           :2d
      Add to mermaid                      :1d

      section Documentation
      Describe gantt syntax               :active, a1, after des1, 3d
      Add gantt diagram to demo page      :after a1  , 20h
      Add another diagram to demo page    :doc1, after a1  , 48h

      section Last section
      Describe gantt syntax               :after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      { gantt: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      const width = parseFloat(svg.attr('width'));
      expect(width).to.be.within(
        Cypress.config().viewportWidth * 0.95,
        Cypress.config().viewportWidth * 1.05
      );
      expect(svg).to.not.have.attr('style');
    });
  });
  it('should render a gantt diagram with data labels at the top when topAxis is true', () => {
    imgSnapshotTest(
      `
    gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      section A section
      Completed task            :done,    des1, 2014-01-06,2014-01-08
      Active task               :active,  des2, 2014-01-09, 3d
      Future task               :         des3, after des2, 5d
      Future task2               :         des4, after des3, 5d

      section Critical tasks
      Completed task in the critical line :crit, done, 2014-01-06,24h
      Implement parser and jison :crit, done, after des1, 2d
      Create tests for parser             :crit, active, 3d
      Future task in critical line        :crit, 5d
      Create tests for renderer           :2d
      Add to mermaid                      :1d

      section Documentation
      Describe gantt syntax               :active, a1, after des1, 3d
      Add gantt diagram to demo page      :after a1  , 20h
      Add another diagram to demo page    :doc1, after a1  , 48h

      section Last section
      Describe gantt syntax               :after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      { gantt: { topAxis: true } }
    );
  });

  it('should render a gantt diagram with a vert tag', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   ss
        axisFormat   %Ss

        section Section
        A task           : a1, 00, 6s
        Milestone     : vert, 01,
        section Another
        Task in sec      : 06, 3s
        another task     : 3s
      `
    );
  });
  it('should render a gantt diagram with tick is 2 milliseconds', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   SSS
        axisFormat   %Lms
        tickInterval 2millisecond
        excludes     weekends

        section Section
        A task           : a1, 000, 6ms
        Another task     : after a1, 6ms
        section Another
        Task in sec      : a2, 006, 3ms
        another task     : 3ms
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 2 seconds', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   ss
        axisFormat   %Ss
        tickInterval 2second
        excludes     weekends

        section Section
        A task           : a1, 00, 6s
        Another task     : after a1, 6s
        section Another
        Task in sec      : 06, 3s
        another task     : 3s
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 15 minutes', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %H:%M
        tickInterval 15minute
        excludes     weekends

        section Section
        A task           : a1, 2022-10-03, 6h
        Another task     : after a1, 6h
        section Another
        Task in sec      : 2022-10-03, 3h
        another task     : 3h
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 6 hours', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %d %H:%M
        tickInterval 6hour
        excludes     weekends

        section Section
        A task           : a1, 2022-10-03, 1d
        Another task     : after a1, 2d
        section Another
        Task in sec      : 2022-10-04, 2d
        another task     : 2d
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 1 day', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %m-%d
        tickInterval 1day
        excludes     weekends

        section Section
        A task           : a1, 2022-10-01, 30d
        Another task     : after a1, 20d
        section Another
        Task in sec      : 2022-10-20, 12d
        another task     : 24d
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 1 week', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %m-%d
        tickInterval 1week
        excludes     weekends

        section Section
        A task           : a1, 2022-10-01, 30d
        Another task     : after a1, 20d
        section Another
        Task in sec      : 2022-10-20, 12d
        another task     : 24d
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 1 week, with the day starting on monday', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %m-%d
        tickInterval 1week
        weekday      monday
        excludes     weekends

        section Section
        A task           : a1, 2022-10-01, 30d
        Another task     : after a1, 20d
        section Another
        Task in sec      : 2022-10-20, 12d
        another task     : 24d
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 1 month', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %m-%d
        tickInterval 1month
        excludes     weekends

        section Section
        A task           : a1, 2022-10-01, 30d
        Another task     : after a1, 20d
        section Another
        Task in sec      : 2022-10-20, 12d
        another task     : 24d
      `,
      {}
    );
  });

  it('should render a gantt diagram with tick is 1 day and topAxis is true', () => {
    imgSnapshotTest(
      `
      gantt
        title A Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %m-%d
        tickInterval 1day
        excludes     weekends

        section Section
        A task           : a1, 2022-10-01, 30d
        Another task     : after a1, 20d
        section Another
        Task in sec      : 2022-10-20, 12d
        another task     : 24d
      `,
      { gantt: { topAxis: true } }
    );
  });

  it('should render when there is a date-only dateRange with both start and end dates', () => {
    imgSnapshotTest(
      `
      gantt
        title GANTT with date-only startDate and endDate dateRange
        dateFormat  YYYY-MM-DD
        dateRange   2022-01-01,2022-03-31
        axisFormat  %m-%d
        tickInterval 1week
        section DB Clean
        Clean: 2022-01-01, 2d
        Clean: 2022-01-05, 3d
        Clean: 2022-01-30, 6d
        Clean: 2022-02-02, 3d
        Clean: 2022-02-15, 6d
        Clean: 2022-03-10, 1d
        Clean: 2022-03-29, 1d
        section Sessions
        A: 2022-01-01, 3d
        B: 2022-01-07, 4d
        C: 2022-01-31, 5d
        D: 2022-02-03, 6d
        E: 2022-02-22, 1d
        F: 2022-02-25, 2d
        G: 2022-03-01, 12d
        H: 2022-03-19, 8d
        I: 2022-03-23, 7d
    `,
      {}
    );
  });

  it('should render when there is a date-only dateRange with a startDate only', () => {
    imgSnapshotTest(
      `
      gantt
        title GANTT with date-only startDate dateRange
        dateFormat  YYYY-MM-DD
        dateRange   2022-01-01
        axisFormat  %m-%d
        tickInterval 1week
        section DB Clean
        Clean: 2022-01-01, 2d
        Clean: 2022-01-05, 3d
        Clean: 2022-01-30, 6d
        Clean: 2022-02-02, 3d
        Clean: 2022-02-15, 6d
        Clean: 2022-03-10, 1d
        Clean: 2022-03-29, 1d
        section Sessions
        A: 2022-01-01, 3d
        B: 2022-01-07, 4d
        C: 2022-01-31, 5d
        D: 2022-02-03, 6d
        E: 2022-02-22, 1d
        F: 2022-02-25, 2d
        G: 2022-03-01, 12d
        H: 2022-03-19, 8d
        I: 2022-03-23, 7d
    `,
      {}
    );
  });

  it('should render when there is a date-only dateRange with an endDate only', () => {
    imgSnapshotTest(
      `
      gantt
        title GANTT with date-only endDate dateRange
        dateFormat  YYYY-MM-DD
        dateRange   ,2022-03-31
        axisFormat  %m-%d
        tickInterval 1week
        section DB Clean
        Clean: 2022-01-01, 2d
        Clean: 2022-01-05, 3d
        Clean: 2022-01-30, 6d
        Clean: 2022-02-02, 3d
        Clean: 2022-02-15, 6d
        Clean: 2022-03-10, 1d
        Clean: 2022-03-29, 1d
        section Sessions
        A: 2022-01-01, 3d
        B: 2022-01-07, 4d
        C: 2022-01-31, 5d
        D: 2022-02-03, 6d
        E: 2022-02-22, 1d
        F: 2022-02-25, 2d
        G: 2022-03-01, 12d
        H: 2022-03-19, 8d
        I: 2022-03-23, 7d
    `,
      {}
    );
  });

  it('should render when there is a date-only dateRange with startDate and endDate, with tasks before and after the dateRange', () => {
    imgSnapshotTest(
      `gantt
        title Gantt diagram with date-only date range and tasks before and after the date range
        dateFormat  YYYY-MM-DD
        dateRange   2022-01-01,2022-03-31
        axisFormat  %m-%d
        tickInterval 1week
        section Section
        A task before     : 2021-12-01, 20d
        A task starting before and completing within: 2021-12-25, 10d 
        A task within     : 2022-01-15, 40d
        A task starting within and ending after: 2022-03-25, 10d
        A task after      : 2022-04-01, 20d
        section Another
        A task before     : 2021-11-01, 40d
        A task within     : 2022-02-15, 30d
        A task after      : 2023-04-01, 20d
      `,
      {}
    );
  });

  it('should render when there is a time-only dateRange with both start and end dates', () => {
    imgSnapshotTest(
      `
      gantt
        title GANTT with time-only startDate and endDate dateRange
        dateFormat  HH:mm:ss
        dateRange   12:30:00,13:30:00
        axisFormat  %Hh%M
        section DB Clean
        Clean: 12:30:00, 12m
        Clean: 13:00:00, 8m
        Clean: 13:20:00, 9m
        section Sessions
        B: 12:30:00, 12m
        C: 13:05:00, 12m
        D: 13:06:00, 33m
        E: 13:15:00, 55m
        F: 13:20:00, 10m
    `,
      {}
    );
  });

  it('should render when there is a time-only dateRange with a startDate only', () => {
    imgSnapshotTest(
      `
      gantt
        title GANTT with time-Only startDate dateRange
        dateFormat  HH:mm:ss
        dateRange   12:30:00
        axisFormat  %Hh%M
        section DB Clean
        Clean: 12:30:00, 12m
        Clean: 13:00:00, 8m
        Clean: 13:30:00, 9m
        Clean: 14:00:00, 13m
        Clean: 14:30:00, 10m
        Clean: 15:00:00, 11m
        section Sessions
        A: 12:30:00, 12m
        B: 13:05:00, 12m
        C: 13:06:00, 33m
        D: 13:15:00, 55m
        E: 13:20:00, 12m
        F: 13:32:00, 18m
        G: 13:50:00, 20m
        H: 14:10:00, 10m
    `,
      {}
    );
  });

  it('should render when there is a time-only dateRange with an endDate only', () => {
    imgSnapshotTest(
      `
      gantt
        title GANTT with time-Only endDate dateRange
        dateFormat  HH:mm:ss
        dateRange   ,13:30:00
        axisFormat  %Hh%M
        section DB Clean
        Clean: 12:00:00, 10m
        Clean: 12:30:00, 12m
        Clean: 13:00:00, 8m
        section Sessions
        A: 12:00:00, 63m
        B: 12:30:00, 12m
        C: 13:05:00, 12m
        D: 13:06:00, 33m
        E: 13:15:00, 55m
        F: 13:20:00, 10m
    `,
      {}
    );
  });

  it('should render when there is a time-only dateRange with startDate and endDate, with tasks before and after the dateRange', () => {
    imgSnapshotTest(
      `gantt
        title Gantt diagram with time-only date range and tasks before and after the date range
        dateFormat  HH:mm:ss
        dateRange   12:00:00, 18:00:00
        axisFormat  %Hh%M
        tickInterval 1week
        section Section
        A task before     : 11:30:00, 25m
        A task starting before and completing within: 11:00:00, 2h 
        A task within     : 12:05:00, 60m
        A task starting within and ending after: 17:30:00, 75m
        A task after      : 18:30:00, 30m
        section Another
        A task before     : 10:00:00, 119m
        A task within     : 12:00:00, 6h
        A task after      : 20:00:00, 4h
      `,
      {}
    );
  });

  it('should render when there is a date and time dateRange, with both start and end dates, and tasks before and after the dateRange', () => {
    imgSnapshotTest(
      `gantt
        title Gantt diagram with time-only date range and tasks before and after the date range
        dateFormat  DD-MM-YYYY HH:mm:ss
        dateRange   01-01-2021 12:00:00, 08-01-2021 18:00:00
        axisFormat  %m-%d
        tickInterval 1week
        section Section
        A task before     : 01-01-2021 11:30:00, 25m
        A task starting before and completing within: 01-01-2021 10:00:00, 2d
        A task within     : 02-01-2021 12:05:00, 4d
        A task starting within and ending after: 05-01-2021 12:30:00, 4d
        A task after      : 08-01-2021 18:30:00, 30m
        section Another
        A task before     : 31-12-2020 10:00:00, 1d
        A task within     : 01-01-2021 12:00:00, 7d
        A task after      : 15-01-2021 12:00:00, 1d
      `,
      {}
    );
  });

  // TODO: fix it
  //
  // This test is skipped deliberately
  // because it fails and blocks our development pipeline
  // It was added as an attempt to fix gantt performance issues
  //
  // https://github.com/mermaid-js/mermaid/issues/3274
  //
  it.skip('should render a gantt diagram with very large intervals, skipping excludes if interval > 5 years', () => {
    imgSnapshotTest(
      `gantt
        title A long Gantt Diagram
        dateFormat   YYYY-MM-DD
        axisFormat   %m-%d
        tickInterval 1day
        excludes     weekends
        section Section
        A task           : a1, 9999-10-01, 30d
        Another task     : after a1, 20d
        section Another
        Task in sec      : 2022-10-20, 12d
        another task     : 24d
      `
    );
  });
  it('should render a gantt diagram excluding friday and saturday', () => {
    imgSnapshotTest(
      `gantt
      title A Gantt Diagram
      dateFormat  YYYY-MM-DD
      excludes weekends
      weekend friday
      section Section1
      A task :a1, 2024-02-28, 10d`
    );
  });
  it('should render a gantt diagram excluding saturday and sunday', () => {
    imgSnapshotTest(
      `gantt
      title A Gantt Diagram
      dateFormat  YYYY-MM-DD
      excludes weekends
      weekend saturday
      section Section1
      A task :a1, 2024-02-28, 10d`
    );
  });
  it('should render when compact is true', () => {
    imgSnapshotTest(
      `
      ---
      displayMode: compact
      ---
      gantt
        title GANTT compact
        dateFormat  HH:mm:ss
        axisFormat  %Hh%M

        section DB Clean
        Clean: 12:00:00, 10m
        Clean: 12:30:00, 12m
        Clean: 13:00:00, 8m
        Clean: 13:30:00, 9m
        Clean: 14:00:00, 13m
        Clean: 14:30:00, 10m
        Clean: 15:00:00, 11m

        section Sessions
        A: 12:00:00, 63m
        B: 12:30:00, 12m
        C: 13:05:00, 12m
        D: 13:06:00, 33m
        E: 13:15:00, 55m
        F: 13:20:00, 12m
        G: 13:32:00, 18m
        H: 13:50:00, 20m
        I: 14:10:00, 10m
    `,
      {}
    );
  });

  it("should render when there's a semicolon in the title", () => {
    imgSnapshotTest(
      `
      gantt
      title ;Gantt With a Semicolon in the Title
      dateFormat  YYYY-MM-DD
      section Section
      A task           :a1, 2014-01-01, 30d
      Another task     :after a1  , 20d
      section Another
      Task in sec      :2014-01-12  , 12d
      another task      : 24d
    `,
      {}
    );
  });

  it("should render when there's a semicolon in a section is true", () => {
    imgSnapshotTest(
      `
      gantt
      title Gantt Digram
      dateFormat  YYYY-MM-DD
      section ;Section With a Semicolon
      A task           :a1, 2014-01-01, 30d
      Another task     :after a1  , 20d
      section Another
      Task in sec      :2014-01-12  , 12d
      another task      : 24d
    `,
      {}
    );
  });

  it("should render when there's a semicolon in the task data", () => {
    imgSnapshotTest(
      `
      gantt
      title Gantt Digram
      dateFormat  YYYY-MM-DD
      section Section
      ;A task with a semicolon           :a1, 2014-01-01, 30d
      Another task     :after a1  , 20d
      section Another
      Task in sec      :2014-01-12  , 12d
      another task      : 24d
    `,
      {}
    );
  });

  it("should render when there's a hashtag in the title", () => {
    imgSnapshotTest(
      `
      gantt
      title #Gantt With a Hashtag in the Title
      dateFormat  YYYY-MM-DD
      section Section
      A task           :a1, 2014-01-01, 30d
      Another task     :after a1  , 20d
      section Another
      Task in sec      :2014-01-12  , 12d
      another task      : 24d
    `,
      {}
    );
  });

  it("should render when there's a hashtag in a section is true", () => {
    imgSnapshotTest(
      `
      gantt
      title Gantt Digram
      dateFormat  YYYY-MM-DD
      section #Section With a Hashtag
      A task           :a1, 2014-01-01, 30d
      Another task     :after a1  , 20d
      section Another
      Task in sec      :2014-01-12  , 12d
      another task      : 24d
    `,
      {}
    );
  });

  it("should render when there's a hashtag in the task data", () => {
    imgSnapshotTest(
      `
      gantt
      title Gantt Digram
      dateFormat  YYYY-MM-DD
      section Section
      #A task with a hashtag           :a1, 2014-01-01, 30d
      Another task     :after a1  , 20d
      section Another
      Task in sec      :2014-01-12  , 12d
      another task      : 24d
    `,
      {}
    );
  });
});
