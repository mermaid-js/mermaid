import { describe, test, expect } from 'vitest';
import type { Link, RawLink } from './contextMap.js';
import { mapEdgeLabels } from './contextMap.js';

describe('graph construction', () => {
  test.each([
    {
      rawLink: {
        source: { id: 'CargoBookingContext', type: ['SK'] },
        target: {
          id: 'VoyagePlanningContextVoyagePlanningContextVoyagePlanningContext',
          type: ['SK'],
        },
        arrow: ['left', 'right'],
      },
      link: {
        source: { id: 'CargoBookingContext', boxText: undefined, bodyText: undefined },
        target: {
          id: 'VoyagePlanningContextVoyagePlanningContextVoyagePlanningContext',
          boxText: undefined,
          bodyText: undefined,
        },
        middleText: 'Shared Kernel',
      },
    },
    {
      rawLink: {
        source: { id: 'CustomerSelfServiceContext', type: ['D', 'C'] },
        target: { id: 'CustomerManagementContext', type: ['U', 'S'] },
        arrow: ['right'],
      },
      link: {
        source: { id: 'CustomerSelfServiceContext', boxText: 'D', bodyText: undefined },
        target: { id: 'CustomerManagementContext', boxText: 'U', bodyText: undefined },
        middleText: 'Customer/Supplier',
      },
    },
    {
      rawLink: {
        source: { id: 'CustomerManagementContext', type: ['D', 'ACL'] },
        target: { id: 'PrintingContext', type: ['U', 'OHS', 'PL'] },
        arrow: ['right'],
      },
      link: {
        source: { id: 'CustomerManagementContext', boxText: 'D', bodyText: 'ACL' },
        target: { id: 'PrintingContext', boxText: 'U', bodyText: 'OHS, PL' },
        middleText: undefined,
      },
    },
    {
      rawLink: {
        source: { id: 'PrintingContext', type: ['U', 'OHS', 'PL'] },
        target: { id: 'PolicyManagementContext', type: ['D', 'ACL'] },
        arrow: ['right'],
      },
      link: {
        source: { id: 'PrintingContext', boxText: 'U', bodyText: 'OHS, PL' },
        target: { id: 'PolicyManagementContext', boxText: 'D', bodyText: 'ACL' },
        middleText: undefined,
      },
    },
    {
      rawLink: {
        source: { id: 'RiskManagementContext', type: ['P'] },
        target: { id: 'PolicyManagementContext', type: ['P'] },
        arrow: ['left', 'right'],
      },
      link: {
        source: { id: 'RiskManagementContext', boxText: undefined, bodyText: undefined },
        target: { id: 'PolicyManagementContext', boxText: undefined, bodyText: undefined },
        middleText: 'Partnership',
      },
    },
    {
      rawLink: {
        source: { id: 'PolicyManagementContext', type: ['D', 'CF'] },
        target: { id: 'CustomerManagementContext', type: ['U', 'OHS', 'PL'] },
        arrow: ['right'],
      },
      link: {
        source: { id: 'PolicyManagementContext', boxText: 'D', bodyText: 'CF' },
        target: { id: 'CustomerManagementContext', boxText: 'U', bodyText: 'OHS, PL' },
        middleText: undefined,
      },
    },
    {
      rawLink: {
        source: { id: 'DebtCollection', type: ['D', 'ACL'] },
        target: { id: 'PrintingContext', type: ['U', 'OHS', 'PL'] },
        arrow: ['right'],
      },
      link: {
        source: { id: 'DebtCollection', boxText: 'D', bodyText: 'ACL' },
        target: { id: 'PrintingContext', boxText: 'U', bodyText: 'OHS, PL' },
        middleText: undefined,
      },
    },
    {
      rawLink: {
        source: { id: 'CustomersBackofficeTeam', type: ['U', 'S'] },
        target: { id: 'CustomersFrontofficeTeam', type: ['D', 'C'] },
        arrow: ['right'],
      },
      link: {
        source: { id: 'CustomersBackofficeTeam', boxText: 'U', bodyText: undefined },
        target: { id: 'CustomersFrontofficeTeam', boxText: 'D', bodyText: undefined },
        middleText: 'Customer/Supplier',
      },
    },
  ] as { rawLink: RawLink; link: Link }[])(
    'map labels for source: $rawLink.source.type, and target: $rawLink.target.type',
    ({ rawLink, link }: { rawLink: RawLink; link: Link }) => {
      expect(mapEdgeLabels(rawLink)).toStrictEqual(link);
    }
  );
});
