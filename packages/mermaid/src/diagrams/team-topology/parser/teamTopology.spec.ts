import teamTopologyDb from '../teamTopologyDb.js';
import tt from './teamTopology.jison';

describe('when parsing team topology', function () {
  beforeEach(function () {
    tt.parser.yy = teamTopologyDb;
    tt.parser.yy.clear();
  });
  it('should handle topology with two teams and one interaction', function () {
    const res = tt.parser.parse(`f1#Stream
f2#Stream
f1--XaaS->f2`);

    expect(res).toBe(true);

    const teams = teamTopologyDb.getTeams();
    const interactions = teamTopologyDb.getInteractions();

    expect(teams).toEqual({ f1: 'Stream', f2: 'Stream' });
    expect(interactions).toEqual({ f1: { XaaS: ['f2'] } });
  });
});
