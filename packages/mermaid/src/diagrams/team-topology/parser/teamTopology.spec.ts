import teamTopologyDb from '../teamTopologyDb.js';
import teamTopology from './teamTopology.jison';

describe('when parsing team topology', function () {
  beforeEach(function () {
    teamTopology.parser.yy = teamTopologyDb;
    teamTopology.parser.yy.clear();
  });
  it('should handle topology with two teams and one interaction', function () {
    const res = teamTopology.parser.parse(`f1#Stream
f2#Stream
f1--XaaS->f2`);

    expect(res).toBe(true);

    const teams = teamTopologyDb.getTeams();
    const interactions = teamTopologyDb.getInteractions();

    expect(teams).toEqual({ f1: 'Stream', f2: 'Stream' });
    expect(interactions).toEqual({ f1: { XaaS: ['f2'] } });
  });
});
