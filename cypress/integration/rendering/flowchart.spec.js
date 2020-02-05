/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('Flowchart', () => {
  it('1: should render a simple flowchart no htmlLabels', () => {
    imgSnapshotTest(
      `graph TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('2: should render a simple flowchart with htmlLabels', () => {
    imgSnapshotTest(
      `graph TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { htmlLabels: true } }
    );
  });

  it('3: should render a simple flowchart with line breaks', () => {
    imgSnapshotTest(
      `
    graph TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me thinksssss<br/>ssssssssssssssssssssss<br/>sssssssssssssssssssssssssss}
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[Car]
      `,
      {}
    );
  });

  it('4: should render a simple flowchart with trapezoid and inverse trapezoid vertex options.', () => {
    imgSnapshotTest(
      `
    graph TD
      A[/Christmas\\]
      A -->|Get money| B[\\Go shopping/]
      B --> C{Let me thinksssss<br/>ssssssssssssssssssssss<br/>sssssssssssssssssssssssssss}
      C -->|One| D[/Laptop/]
      C -->|Two| E[\\iPhone\\]
      C -->|Three| F[Car]
      `,
      {}
    );
  });

  it('5: should style nodes via a class.', () => {
    imgSnapshotTest(
      `
    graph TD
      1A --> 1B
      1B --> 1C
      1C --> D
      1C --> E

      classDef processHead fill:#888888,color:white,font-weight:bold,stroke-width:3px,stroke:#001f3f
      class 1A,1B,D,E processHead
      `,
      {}
    );
  });

  it('6: should render a flowchart full of circles', () => {
    imgSnapshotTest(
      `
    graph LR
      47(SAM.CommonFA.FMESummary)-->48(SAM.CommonFA.CommonFAFinanceBudget)
      37(SAM.CommonFA.BudgetSubserviceLineVolume)-->48(SAM.CommonFA.CommonFAFinanceBudget)
      35(SAM.CommonFA.PopulationFME)-->47(SAM.CommonFA.FMESummary)
      41(SAM.CommonFA.MetricCost)-->47(SAM.CommonFA.FMESummary)
      44(SAM.CommonFA.MetricOutliers)-->47(SAM.CommonFA.FMESummary)
      46(SAM.CommonFA.MetricOpportunity)-->47(SAM.CommonFA.FMESummary)
      40(SAM.CommonFA.OPVisits)-->47(SAM.CommonFA.FMESummary)
      38(SAM.CommonFA.CommonFAFinanceRefund)-->47(SAM.CommonFA.FMESummary)
      43(SAM.CommonFA.CommonFAFinancePicuDays)-->47(SAM.CommonFA.FMESummary)
      42(SAM.CommonFA.CommonFAFinanceNurseryDays)-->47(SAM.CommonFA.FMESummary)
      45(SAM.CommonFA.MetricPreOpportunity)-->46(SAM.CommonFA.MetricOpportunity)
      35(SAM.CommonFA.PopulationFME)-->45(SAM.CommonFA.MetricPreOpportunity)
      41(SAM.CommonFA.MetricCost)-->45(SAM.CommonFA.MetricPreOpportunity)
      41(SAM.CommonFA.MetricCost)-->44(SAM.CommonFA.MetricOutliers)
      39(SAM.CommonFA.ChargeDetails)-->43(SAM.CommonFA.CommonFAFinancePicuDays)
      39(SAM.CommonFA.ChargeDetails)-->42(SAM.CommonFA.CommonFAFinanceNurseryDays)
      39(SAM.CommonFA.ChargeDetails)-->41(SAM.CommonFA.MetricCost)
      39(SAM.CommonFA.ChargeDetails)-->40(SAM.CommonFA.OPVisits)
      35(SAM.CommonFA.PopulationFME)-->39(SAM.CommonFA.ChargeDetails)
      36(SAM.CommonFA.PremetricCost)-->39(SAM.CommonFA.ChargeDetails)
      `,
      {}
    );
  });

  it('7: should render a flowchart full of icons', () => {
    imgSnapshotTest(
      `
    graph TD
      9e122290_1ec3_e711_8c5a_005056ad0002("fa:fa-creative-commons My System | Test Environment")
      82072290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs Shared Business Logic Server:Service 1")
      db052290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs Shared Business Logic Server:Service 2")
      4e112290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs Shared Report Server:Service 1")
      30122290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs Shared Report Server:Service 2")
      5e112290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs Dedicated Test Business Logic Server:Service 1")
      c1112290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs Dedicated Test Business Logic Server:Service 2")
      b7042290_1ec3_e711_8c5a_005056ad0002("fa:fa-circle [DBServer\\SharedDbInstance].[SupportDb]")
      8f102290_1ec3_e711_8c5a_005056ad0002("fa:fa-circle [DBServer\\SharedDbInstance].[DevelopmentDb]")
      0e102290_1ec3_e711_8c5a_005056ad0002("fa:fa-circle [DBServer\\SharedDbInstance].[TestDb]")
      07132290_1ec3_e711_8c5a_005056ad0002("fa:fa-circle [DBServer\\SharedDbInstance].[SharedReportingDb]")
      c7072290_1ec3_e711_8c5a_005056ad0002("fa:fa-server Shared Business Logic Server")
      ca122290_1ec3_e711_8c5a_005056ad0002("fa:fa-server Shared Report Server")
      68102290_1ec3_e711_8c5a_005056ad0002("fa:fa-server Dedicated Test Business Logic Server")
      f4112290_1ec3_e711_8c5a_005056ad0002("fa:fa-database [DBServer\\SharedDbInstance]")
      d6072290_1ec3_e711_8c5a_005056ad0002("fa:fa-server DBServer")
      71082290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs DBServer\\:MSSQLSERVER")
      c0102290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs DBServer\\:SQLAgent")
      9a072290_1ec3_e711_8c5a_005056ad0002("fa:fa-cogs DBServer\\:SQLBrowser")
      1d0a2290_1ec3_e711_8c5a_005056ad0002("fa:fa-server VmHost1")
      200a2290_1ec3_e711_8c5a_005056ad0002("fa:fa-server VmHost2")
      1c0a2290_1ec3_e711_8c5a_005056ad0002("fa:fa-server VmHost3")
      9e122290_1ec3_e711_8c5a_005056ad0002-->82072290_1ec3_e711_8c5a_005056ad0002
      9e122290_1ec3_e711_8c5a_005056ad0002-->db052290_1ec3_e711_8c5a_005056ad0002
      9e122290_1ec3_e711_8c5a_005056ad0002-->4e112290_1ec3_e711_8c5a_005056ad0002
      9e122290_1ec3_e711_8c5a_005056ad0002-->30122290_1ec3_e711_8c5a_005056ad0002
      9e122290_1ec3_e711_8c5a_005056ad0002-->5e112290_1ec3_e711_8c5a_005056ad0002
      9e122290_1ec3_e711_8c5a_005056ad0002-->c1112290_1ec3_e711_8c5a_005056ad0002
      82072290_1ec3_e711_8c5a_005056ad0002-->b7042290_1ec3_e711_8c5a_005056ad0002
      82072290_1ec3_e711_8c5a_005056ad0002-->8f102290_1ec3_e711_8c5a_005056ad0002
      82072290_1ec3_e711_8c5a_005056ad0002-->0e102290_1ec3_e711_8c5a_005056ad0002
      82072290_1ec3_e711_8c5a_005056ad0002-->c7072290_1ec3_e711_8c5a_005056ad0002
      db052290_1ec3_e711_8c5a_005056ad0002-->c7072290_1ec3_e711_8c5a_005056ad0002
      db052290_1ec3_e711_8c5a_005056ad0002-->82072290_1ec3_e711_8c5a_005056ad0002
      4e112290_1ec3_e711_8c5a_005056ad0002-->b7042290_1ec3_e711_8c5a_005056ad0002
      4e112290_1ec3_e711_8c5a_005056ad0002-->8f102290_1ec3_e711_8c5a_005056ad0002
      4e112290_1ec3_e711_8c5a_005056ad0002-->0e102290_1ec3_e711_8c5a_005056ad0002
      4e112290_1ec3_e711_8c5a_005056ad0002-->07132290_1ec3_e711_8c5a_005056ad0002
      4e112290_1ec3_e711_8c5a_005056ad0002-->ca122290_1ec3_e711_8c5a_005056ad0002
      30122290_1ec3_e711_8c5a_005056ad0002-->ca122290_1ec3_e711_8c5a_005056ad0002
      30122290_1ec3_e711_8c5a_005056ad0002-->4e112290_1ec3_e711_8c5a_005056ad0002
      5e112290_1ec3_e711_8c5a_005056ad0002-->8f102290_1ec3_e711_8c5a_005056ad0002
      5e112290_1ec3_e711_8c5a_005056ad0002-->68102290_1ec3_e711_8c5a_005056ad0002
      c1112290_1ec3_e711_8c5a_005056ad0002-->68102290_1ec3_e711_8c5a_005056ad0002
      c1112290_1ec3_e711_8c5a_005056ad0002-->5e112290_1ec3_e711_8c5a_005056ad0002
      b7042290_1ec3_e711_8c5a_005056ad0002-->f4112290_1ec3_e711_8c5a_005056ad0002
      8f102290_1ec3_e711_8c5a_005056ad0002-->f4112290_1ec3_e711_8c5a_005056ad0002
      0e102290_1ec3_e711_8c5a_005056ad0002-->f4112290_1ec3_e711_8c5a_005056ad0002
      07132290_1ec3_e711_8c5a_005056ad0002-->f4112290_1ec3_e711_8c5a_005056ad0002
      c7072290_1ec3_e711_8c5a_005056ad0002-->1d0a2290_1ec3_e711_8c5a_005056ad0002
      ca122290_1ec3_e711_8c5a_005056ad0002-->200a2290_1ec3_e711_8c5a_005056ad0002
      68102290_1ec3_e711_8c5a_005056ad0002-->1c0a2290_1ec3_e711_8c5a_005056ad0002
      f4112290_1ec3_e711_8c5a_005056ad0002-->d6072290_1ec3_e711_8c5a_005056ad0002
      f4112290_1ec3_e711_8c5a_005056ad0002-->71082290_1ec3_e711_8c5a_005056ad0002
      f4112290_1ec3_e711_8c5a_005056ad0002-->c0102290_1ec3_e711_8c5a_005056ad0002
      f4112290_1ec3_e711_8c5a_005056ad0002-->9a072290_1ec3_e711_8c5a_005056ad0002
      d6072290_1ec3_e711_8c5a_005056ad0002-->1c0a2290_1ec3_e711_8c5a_005056ad0002
      71082290_1ec3_e711_8c5a_005056ad0002-->d6072290_1ec3_e711_8c5a_005056ad0002
      c0102290_1ec3_e711_8c5a_005056ad0002-->d6072290_1ec3_e711_8c5a_005056ad0002
      c0102290_1ec3_e711_8c5a_005056ad0002-->71082290_1ec3_e711_8c5a_005056ad0002
      9a072290_1ec3_e711_8c5a_005056ad0002-->d6072290_1ec3_e711_8c5a_005056ad0002
      9a072290_1ec3_e711_8c5a_005056ad0002-->71082290_1ec3_e711_8c5a_005056ad0002
      `,
      {}
    );
  });

  it('8: should render labels with numbers at the start', () => {
    imgSnapshotTest(
      `
    graph TB;subgraph "number as labels";1;end;
      `,
      {}
    );
  });

  it('9: should render subgraphs', () => {
    imgSnapshotTest(
      `
    graph TB
      subgraph One
        a1-->a2
      end
      `,
      {}
    );
  });

  it('10: should render subgraphs with a title starting with a digit', () => {
    imgSnapshotTest(
      `
    graph TB
      subgraph 2Two
        a1-->a2
      end
      `,
      {}
    );
  });

  it('11: should render styled subgraphs', () => {
    imgSnapshotTest(
      `
    graph TB
      A
      B
      subgraph foo[Foo SubGraph]
        C
        D
      end
      subgraph bar[Bar SubGraph]
        E
        F
      end
      G

      A-->B
      B-->C
      C-->D
      B-->D
      D-->E
      E-->A
      E-->F
      F-->D
      F-->G
      B-->G
      G-->D

      style foo fill:#F99,stroke-width:2px,stroke:#F0F
      style bar fill:#999,stroke-width:10px,stroke:#0F0
      `,
      {}
    );
  });

  it('12: should render a flowchart with long names and class definitions', () => {
    imgSnapshotTest(
      `graph LR
      sid-B3655226-6C29-4D00-B685-3D5C734DC7E1["

      提交申请
      熊大
      "];
      class sid-B3655226-6C29-4D00-B685-3D5C734DC7E1 node-executed;
      sid-4DA958A0-26D9-4D47-93A7-70F39FD7D51A["
      负责人审批
      强子
      "];
      class sid-4DA958A0-26D9-4D47-93A7-70F39FD7D51A node-executed;
      sid-E27C0367-E6D6-497F-9736-3CDC21FDE221["
      DBA审批
      强子
      "];
      class sid-E27C0367-E6D6-497F-9736-3CDC21FDE221 node-executed;
      sid-BED98281-9585-4D1B-934E-BD1AC6AC0EFD["
      SA审批
      阿美
      "];
      class sid-BED98281-9585-4D1B-934E-BD1AC6AC0EFD node-executed;
      sid-7CE72B24-E0C1-46D3-8132-8BA66BE05AA7["
      主管审批
      光头强
      "];
      class sid-7CE72B24-E0C1-46D3-8132-8BA66BE05AA7 node-executed;
      sid-A1B3CD96-7697-4D7C-BEAA-73D187B1BE89["
      DBA确认
      强子
      "];
      class sid-A1B3CD96-7697-4D7C-BEAA-73D187B1BE89 node-executed;
      sid-3E35A7FF-A2F4-4E07-9247-DBF884C81937["
      SA确认
      阿美
      "];
      class sid-3E35A7FF-A2F4-4E07-9247-DBF884C81937 node-executed;
      sid-4FC27B48-A6F9-460A-A675-021F5854FE22["
      结束
      "];
      class sid-4FC27B48-A6F9-460A-A675-021F5854FE22 node-executed;
      sid-19DD9E9F-98C1-44EE-B604-842AFEE76F1E["
      SA执行1
      强子
      "];
      class sid-19DD9E9F-98C1-44EE-B604-842AFEE76F1E node-executed;
      sid-6C2120F3-D940-4958-A067-0903DCE879C4["
      SA执行2
      强子
      "];
      class sid-6C2120F3-D940-4958-A067-0903DCE879C4 node-executed;
      sid-9180E2A0-5C4B-435F-B42F-0D152470A338["
      DBA执行1
      强子
      "];
      class sid-9180E2A0-5C4B-435F-B42F-0D152470A338 node-executed;
      sid-03A2C3AC-5337-48A5-B154-BB3FD0EC8DAD["
      DBA执行3
      强子
      "];
      class sid-03A2C3AC-5337-48A5-B154-BB3FD0EC8DAD node-executed;
      sid-D5E1F2F4-306C-47A2-BF74-F66E3D769756["
      DBA执行2
      强子
      "];
      class sid-D5E1F2F4-306C-47A2-BF74-F66E3D769756 node-executed;
      sid-8C3F2F1D-F014-4F99-B966-095DC1A2BD93["
      DBA执行4
      强子
      "];
      class sid-8C3F2F1D-F014-4F99-B966-095DC1A2BD93 node-executed;
      sid-1897B30A-9C5C-4D5B-B80B-76A038785070["
      负责人确认
      梁静茹
      "];
      class sid-1897B30A-9C5C-4D5B-B80B-76A038785070 node-executed;
      sid-B3655226-6C29-4D00-B685-3D5C734DC7E1-->sid-7CE72B24-E0C1-46D3-8132-8BA66BE05AA7;
      sid-4DA958A0-26D9-4D47-93A7-70F39FD7D51A-->sid-1897B30A-9C5C-4D5B-B80B-76A038785070;
      sid-E27C0367-E6D6-497F-9736-3CDC21FDE221-->sid-A1B3CD96-7697-4D7C-BEAA-73D187B1BE89;
      sid-BED98281-9585-4D1B-934E-BD1AC6AC0EFD-->sid-3E35A7FF-A2F4-4E07-9247-DBF884C81937;
      sid-19DD9E9F-98C1-44EE-B604-842AFEE76F1E-->sid-6C2120F3-D940-4958-A067-0903DCE879C4;
      sid-9180E2A0-5C4B-435F-B42F-0D152470A338-->sid-D5E1F2F4-306C-47A2-BF74-F66E3D769756;
      sid-03A2C3AC-5337-48A5-B154-BB3FD0EC8DAD-->sid-8C3F2F1D-F014-4F99-B966-095DC1A2BD93;
      sid-6C2120F3-D940-4958-A067-0903DCE879C4-->sid-4DA958A0-26D9-4D47-93A7-70F39FD7D51A;
      sid-1897B30A-9C5C-4D5B-B80B-76A038785070-->sid-4FC27B48-A6F9-460A-A675-021F5854FE22;
      sid-3E35A7FF-A2F4-4E07-9247-DBF884C81937-->sid-19DD9E9F-98C1-44EE-B604-842AFEE76F1E;
      sid-A1B3CD96-7697-4D7C-BEAA-73D187B1BE89-->sid-9180E2A0-5C4B-435F-B42F-0D152470A338;
      sid-A1B3CD96-7697-4D7C-BEAA-73D187B1BE89-->sid-03A2C3AC-5337-48A5-B154-BB3FD0EC8DAD;
      sid-D5E1F2F4-306C-47A2-BF74-F66E3D769756-->sid-4DA958A0-26D9-4D47-93A7-70F39FD7D51A;
      sid-8C3F2F1D-F014-4F99-B966-095DC1A2BD93-->sid-4DA958A0-26D9-4D47-93A7-70F39FD7D51A;
      sid-7CE72B24-E0C1-46D3-8132-8BA66BE05AA7-->sid-BED98281-9585-4D1B-934E-BD1AC6AC0EFD;
      sid-7CE72B24-E0C1-46D3-8132-8BA66BE05AA7-->sid-E27C0367-E6D6-497F-9736-3CDC21FDE221;
      sid-3E35A7FF-A2F4-4E07-9247-DBF884C81937-->sid-6C2120F3-D940-4958-A067-0903DCE879C4;
      sid-7CE72B24-E0C1-46D3-8132-8BA66BE05AA7-->sid-4DA958A0-26D9-4D47-93A7-70F39FD7D51A;
      sid-7CE72B24-E0C1-46D3-8132-8BA66BE05AA7-->sid-4FC27B48-A6F9-460A-A675-021F5854FE22;
      `,
      {}
    );
  });

  it('13: should render color of styled nodes', () => {
    imgSnapshotTest(
      `
      graph LR
        foo-->bar

        classDef foo fill:lightblue,color:green,stroke:#FF9E2C,font-weight:bold
        style foo fill:#F99,stroke-width:2px,stroke:#F0F
        style bar fill:#999,color: #00ff00, stroke-width:10px,stroke:#0F0
      `,
      {
        listUrl: false,
        listId: 'color styling',
        logLevel: 0
      }
    );
  });

  it('14: should render hexagons', () => {
    imgSnapshotTest(
      `
      graph TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{{Let me think...<br />Do I want something for work,<br />something to spend every free second with,<br />or something to get around?}}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[Car]
        click A "index.html#link-clicked" "link test"
        click B testClick "click test"
        classDef someclass fill:#f96;
        class A someclass;
        class C someclass;
      `,
      {
        listUrl: false,
        listId: 'color styling',
        logLevel: 0
      }
    );
  });

  it('15: should render a simple flowchart with comments', () => {
    imgSnapshotTest(
      `graph TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      %% this is a comment
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('16: Render Stadium shape', () => {
    imgSnapshotTest(
      ` graph TD
      A([stadium shape test])
      A -->|Get money| B([Go shopping])
      B --> C([Let me think...<br />Do I want something for work,<br />something to spend every free second with,<br />or something to get around?])
      C -->|One| D([Laptop])
      C -->|Two| E([iPhone])
      C -->|Three| F([Car<br/>wroom wroom])
      click A "index.html#link-clicked" "link test"
      click B testClick "click test"
      classDef someclass fill:#f96;
      class A someclass;
      class C someclass;
      `,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('17: Render multiline texts', () => {
    imgSnapshotTest(
      `graph LR
        A1[Multi<br>Line] -->|Multi<br>Line| B1(Multi<br>Line)
        C1[Multi<br/>Line] -->|Multi<br/>Line| D1(Multi<br/>Line)
        E1[Multi<br />Line] -->|Multi<br />Line| F1(Multi<br />Line)
        A2[Multi<br>Line] -->|Multi<br>Line| B2(Multi<br>Line)
        C2[Multi<br/>Line] -->|Multi<br/>Line| D2(Multi<br/>Line)
        E2[Multi<br />Line] -->|Multi<br />Line| F2(Multi<br />Line)
        linkStyle 0 stroke:DarkGray,stroke-width:2px
        linkStyle 1 stroke:DarkGray,stroke-width:2px
        linkStyle 2 stroke:DarkGray,stroke-width:2px
      `,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('18: Chaining of nodes', () => {
    imgSnapshotTest(
      `graph LR
        a --> b --> c
      `,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('19: Multiple nodes and chaining in one statement', () => {
    imgSnapshotTest(
      `graph LR
        a --> b & c--> d
      `,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('20: Multiple nodes and chaining in one statement', () => {
    imgSnapshotTest(
      `graph TD
      A[ h ] -- hello --> B[" test "]:::exClass & C --> D;
      classDef exClass background:#bbb,border:1px solid red;
      `,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('21: Render cylindrical shape', () => {
    imgSnapshotTest(
      `graph LR
      A[(cylindrical<br />shape<br />test)]
      A -->|Get money| B1[(Go shopping 1)]
      A -->|Get money| B2[(Go shopping 2)]
      A -->|Get money| B3[(Go shopping 3)]
      C[(Let me think...<br />Do I want something for work,<br />something to spend every free second with,<br />or something to get around?)]
      B1 --> C
      B2 --> C
      B3 --> C
      C -->|One| D[(Laptop)]
      C -->|Two| E[(iPhone)]
      C -->|Three| F[(Car)]
      click A "index.html#link-clicked" "link test"
      click B testClick "click test"
      classDef someclass fill:#f96;
      class A someclass;`,
      { flowchart: { htmlLabels: false } }
    );
  });

  it('22: Render a simple flowchart with nodeSpacing set to 100', () => {
    imgSnapshotTest(
      `graph TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      %% this is a comment
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { nodeSpacing: 50 } }
    );
  });

  it('23: Render a simple flowchart with rankSpacing set to 100', () => {
    imgSnapshotTest(
      `graph TD
      A[Christmas] -->|Get money| B(Go shopping)
      B --> C{Let me think}
      %% this is a comment
      C -->|One| D[Laptop]
      C -->|Two| E[iPhone]
      C -->|Three| F[fa:fa-car Car]
      `,
      { flowchart: { rankSpacing: '100' } }
    );
  });

  it('24: Keep node label text (if already defined) when a style is applied', () => {
    imgSnapshotTest(
      `graph LR
      A(( )) -->|step 1| B(( ))
      B(( )) -->|step 2| C(( ))
      C(( )) -->|step 3| D(( ))
      linkStyle 1 stroke:greenyellow,stroke-width:2px
      style C fill:greenyellow,stroke:green,stroke-width:4px
      `,
      { flowchart: { htmlLabels: false } }
    );
  });
it('25: Handle link click events (link, anchor, mailto, other protocol, script)', () => {
    imgSnapshotTest(
      `graph TB
      TITLE["Link Click Events<br>(click the nodes below)"]
      A[link test]
      B[anchor test]
      C[mailto test]
      D[other protocol test]
      E[script test]
      TITLE --> A & B & C & D & E
      click A "https://mermaid-js.github.io/mermaid/#/" "link test"
      click B "#link-clicked" "anchor test"
      click C "mailto:user@user.user" "mailto test"
      click D "notes://do-your-thing/id" "other protocol test"
      click E "javascript:alert('test')" "script test"
      `,
      { securityLevel: 'loose' }
      );
  });

  it('26: Set text color of nodes and links according to styles when html labels are enabled', () => {
    imgSnapshotTest(
      `graph LR
      A[red<br>text] -->|red<br>text| B(blue<br>text)
      C[/red<br/>text/] -->|blue<br/>text| D{blue<br/>text}
      E{{default<br />style}} -->|default<br />style| F([default<br />style])
      linkStyle default color:Sienna;
      linkStyle 0 color:red;
      linkStyle 1 stroke:DarkGray,stroke-width:2px,color:#0000ff
      style A color:red;
      style B color:blue;
      style C stroke:#ff0000,fill:#ffcccc,color:#ff0000
      style D stroke:#0000ff,fill:#ccccff,color:#0000ff
      click B "index.html#link-clicked" "link test"
      click D testClick "click test"
      `,
      { flowchart: { htmlLabels: true } }
    );
  });

  it('27: Set text color of nodes and links according to styles when html labels are disabled', () => {
    imgSnapshotTest(
      `graph LR
      A[red<br>text] -->|red<br>text| B(blue<br>text)
      C[/red<br/>text/] -->|blue<br/>text| D{blue<br/>text}
      E{{default<br />style}} -->|default<br />style| F([default<br />style])
      linkStyle default color:Sienna;
      linkStyle 0 color:red;
      linkStyle 1 stroke:DarkGray,stroke-width:2px,color:#0000ff
      style A color:red;
      style B color:blue;
      style C stroke:#ff0000,fill:#ffcccc,color:#ff0000
      style D stroke:#0000ff,fill:#ccccff,color:#0000ff
      click B "index.html#link-clicked" "link test"
      click D testClick "click test"
      `,
      { flowchart: { htmlLabels: false } }
    );
  });
  it('30: Possibility to style text color of nodes and subgraphs as well as apply classes to subgraphs', () => {
    imgSnapshotTest(
      `graph LR
      subgraph id1 [title is set]
        A-->B
      end
      subgraph id2 [title]
        E
      end

      B-->C

      subgraph id3
      C-->D
      end
      class id3,id2,A redBg;
      class id3,A whiteTxt;
      classDef redBg fill:#622;
      classDef whiteTxt color: white;
      `,
      { flowchart: { htmlLabels: false } }
    );
  });
});
