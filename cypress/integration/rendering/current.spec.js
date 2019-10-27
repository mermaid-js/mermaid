/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util';

describe('State diagram', () => {
  it('should render a flowchart full of circles', () => {
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
});
