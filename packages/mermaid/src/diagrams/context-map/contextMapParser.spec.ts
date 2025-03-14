import { parser } from './contextMapParser.js';
import contextMapDb from './contextMapDb.js';

describe('check context map syntax', () => {
  beforeEach(() => {
    contextMapDb.clear();
  });

  it('comments are ignored', async () => {
    const grammar = `
context-map-beta

/* Note that the splitting of the LocationContext is not mentioned in the original DDD sample of Evans.
* However, locations and the management around them, can somehow be seen as a separated concept which is used by other
* bounded contexts. But this is just an example, since we want to demonstrate our DSL with multiple bounded contexts.
*/
ContextMap DDDSampleMap {

}

`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({ contextMap: 'DDDSampleMap', nodes: [], edges: [] });
  });

  it('recognize empty contextMap block', async () => {
    const grammar = `
context-map-beta

ContextMap DDDSampleMap {
		
}

`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({ contextMap: 'DDDSampleMap', nodes: [], edges: [] });
  });

  it('recognize contains as nodes', async () => {
    const grammar = `
context-map-beta

ContextMap DDDSampleMap {
	contains CargoBookingContext
	contains VoyagePlanningContext
	contains LocationContext
}
`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({
      contextMap: 'DDDSampleMap',
      nodes: [
        { id: 'CargoBookingContext' },
        { id: 'VoyagePlanningContext' },
        { id: 'LocationContext' },
      ],
      edges: [],
    });
  });

  it('recognize simple edges', async () => {
    const grammar = `
context-map-beta
ContextMap DDDSampleMap {
	contains CargoBookingContext
	contains VoyagePlanningContext
  
	CargoBookingContext <-> VoyagePlanningContext
	CargoBookingContext <- VoyagePlanningContext 
	CargoBookingContext -> VoyagePlanningContext
}

`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({
      contextMap: 'DDDSampleMap',
      nodes: [{ id: 'CargoBookingContext' }, { id: 'VoyagePlanningContext' }],
      edges: [
        {
          source: { id: 'CargoBookingContext', type: [] },
          target: { id: 'VoyagePlanningContext', type: [] },
          arrow: ['left', 'right'],
        },
        {
          source: { id: 'CargoBookingContext', type: [] },
          target: { id: 'VoyagePlanningContext', type: [] },
          arrow: ['left'],
        },
        {
          source: { id: 'CargoBookingContext', type: [] },
          target: { id: 'VoyagePlanningContext', type: [] },
          arrow: ['right'],
        },
      ],
    });
  });

  it('recognize complex edge', async () => {
    const grammar = `
context-map-beta

ContextMap DDDSampleMap {
	contains CargoBookingContext
	contains VoyagePlanningContext
	contains LocationContext
  
	CargoBookingContext [SK]<->[SK] VoyagePlanningContext
}

`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({
      contextMap: 'DDDSampleMap',
      nodes: [
        { id: 'CargoBookingContext' },
        { id: 'VoyagePlanningContext' },
        { id: 'LocationContext' },
      ],
      edges: [
        {
          source: { id: 'CargoBookingContext', type: ['SK'] },
          target: { id: 'VoyagePlanningContext', type: ['SK'] },
          arrow: ['left', 'right'],
        },
      ],
    });
  });

  it('recognize mutiple edges and multiple types', async () => {
    const grammar = `
context-map-beta

ContextMap DDDSampleMap {
	contains CargoBookingContext
	contains VoyagePlanningContext
	contains LocationContext
  
	CargoBookingContext [SK]<->[SK] VoyagePlanningContext
	CargoBookingContext [D]<-[U,OHS,PL] LocationContext
	VoyagePlanningContext [D]<-[U,OHS,PL] LocationContext
}

`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({
      contextMap: 'DDDSampleMap',
      nodes: [
        { id: 'CargoBookingContext' },
        { id: 'VoyagePlanningContext' },
        { id: 'LocationContext' },
      ],
      edges: [
        {
          source: { id: 'CargoBookingContext', type: ['SK'] },
          target: { id: 'VoyagePlanningContext', type: ['SK'] },
          arrow: ['left', 'right'],
        },
        {
          source: { id: 'CargoBookingContext', type: ['D'] },
          target: { id: 'LocationContext', type: ['U', 'OHS', 'PL'] },
          arrow: ['left'],
        },
        {
          source: { id: 'VoyagePlanningContext', type: ['D'] },
          target: { id: 'LocationContext', type: ['U', 'OHS', 'PL'] },
          arrow: ['left'],
        },
      ],
    });
  });

  it('recognize edges and nodes with comments', async () => {
    const grammar = `
context-map-beta

/* The DDD Cargo sample application modeled in CML. Note that we split the application into multiple bounded contexts. */
ContextMap DDDSampleMap {
	contains CargoBookingContext
	contains VoyagePlanningContext
	contains LocationContext
	
	/* As Evans mentions in his book (Bounded Context chapter): The voyage planning can be seen as 
	* separated bounded context. However, it still shares code with the booking application (CargoBookingContext).
	* Thus, they are in a 'Shared-Kernel' relationship.
	*/
	CargoBookingContext [SK]<->[SK] VoyagePlanningContext
	
	/* Note that the splitting of the LocationContext is not mentioned in the original DDD sample of Evans.
	* However, locations and the management around them, can somehow be seen as a separated concept which is used by other
	* bounded contexts. But this is just an example, since we want to demonstrate our DSL with multiple bounded contexts.
	*/
	CargoBookingContext [D]<-[U,OHS,PL] LocationContext
	
	VoyagePlanningContext [D]<-[U,OHS,PL] LocationContext
	
}

`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({
      contextMap: 'DDDSampleMap',
      nodes: [
        { id: 'CargoBookingContext' },
        { id: 'VoyagePlanningContext' },
        { id: 'LocationContext' },
      ],
      edges: [
        {
          source: { id: 'CargoBookingContext', type: ['SK'] },
          target: { id: 'VoyagePlanningContext', type: ['SK'] },
          arrow: ['left', 'right'],
        },
        {
          source: { id: 'CargoBookingContext', type: ['D'] },
          target: { id: 'LocationContext', type: ['U', 'OHS', 'PL'] },
          arrow: ['left'],
        },
        {
          source: { id: 'VoyagePlanningContext', type: ['D'] },
          target: { id: 'LocationContext', type: ['U', 'OHS', 'PL'] },
          arrow: ['left'],
        },
      ],
    });
  });

  it('recognize edges and nodes of another example', async () => {
    const grammar = `
context-map-beta

/* Example Context Map written with 'ContextMapper DSL' */
ContextMap InsuranceContextMap {
	  
	/* Add bounded contexts to this context map: */
	contains CustomerManagementContext
	contains CustomerSelfServiceContext
	contains PrintingContext
	contains PolicyManagementContext
	contains RiskManagementContext
	contains DebtCollection

	/* Define the context relationships: */ 

	CustomerSelfServiceContext [D,C]<-[U,S] CustomerManagementContext

	CustomerManagementContext [D,ACL]<-[U,OHS,PL] PrintingContext

	PrintingContext [U,OHS,PL]->[D,ACL] PolicyManagementContext

	RiskManagementContext [P]<->[P] PolicyManagementContext

	PolicyManagementContext [D,CF]<-[U,OHS,PL] CustomerManagementContext

	DebtCollection [D,ACL]<-[U,OHS,PL] PrintingContext

	PolicyManagementContext [SK]<->[SK] DebtCollection	
}

`;
    await parser.parse(grammar);
    expect(contextMapDb.getGraph()).toEqual({
      contextMap: 'InsuranceContextMap',
      nodes: [
        { id: 'CustomerManagementContext' },
        { id: 'CustomerSelfServiceContext' },
        { id: 'PrintingContext' },
        { id: 'PolicyManagementContext' },
        { id: 'RiskManagementContext' },
        { id: 'DebtCollection' },
      ],
      edges: [
        {
          source: { id: 'CustomerSelfServiceContext', type: ['D', 'C'] },
          target: { id: 'CustomerManagementContext', type: ['U', 'S'] },
          arrow: ['left'],
        },
        {
          source: { id: 'CustomerManagementContext', type: ['D', 'ACL'] },
          target: { id: 'PrintingContext', type: ['U', 'OHS', 'PL'] },
          arrow: ['left'],
        },
        {
          source: { id: 'PrintingContext', type: ['U', 'OHS', 'PL'] },
          target: { id: 'PolicyManagementContext', type: ['D', 'ACL'] },
          arrow: ['right'],
        },
        {
          source: { id: 'RiskManagementContext', type: ['P'] },
          target: { id: 'PolicyManagementContext', type: ['P'] },
          arrow: ['left', 'right'],
        },
        {
          source: { id: 'PolicyManagementContext', type: ['D', 'CF'] },
          target: { id: 'CustomerManagementContext', type: ['U', 'OHS', 'PL'] },
          arrow: ['left'],
        },
        {
          source: { id: 'DebtCollection', type: ['D', 'ACL'] },
          target: { id: 'PrintingContext', type: ['U', 'OHS', 'PL'] },
          arrow: ['left'],
        },
        {
          source: { id: 'PolicyManagementContext', type: ['SK'] },
          target: { id: 'DebtCollection', type: ['SK'] },
          arrow: ['left', 'right'],
        },
      ],
    });
  });
});
