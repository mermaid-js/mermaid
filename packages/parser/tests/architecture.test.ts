import { describe, expect, it } from 'vitest';

import { Architecture } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, architectureParse as parse } from './test-util.js';

describe('architecture', () => {
  describe('should handle architecture definition', () => {
    it.each([
      `architecture-beta`,
      `  architecture-beta  `,
      `\tarchitecture-beta\t`,
      `
        \tarchitecture-beta
        `,
    ])('should handle regular architecture', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
    });

    it('should not allow architecture-beta & group in same line', () => {
      const result = parse(`architecture-beta group api(cloud)[API]`);
      expect(result.parserErrors.length).toBeGreaterThan(0);
    });
  });

  describe('should handle TitleAndAccessibilities', () => {
    it.each([
      `architecture-beta title sample title`,
      `  architecture-beta  title sample title  `,
      `\tarchitecture-beta\ttitle sample title\t`,
      `architecture-beta
            \ttitle sample title
            `,
    ])('should handle regular architecture + title in same line', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title } = result.value;
      expect(title).toBe('sample title');
    });

    it.each([
      `architecture-beta
            title sample title`,
      `architecture-beta
            title sample title
            `,
    ])('should handle regular architecture + title in next line', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title } = result.value;
      expect(title).toBe('sample title');
    });

    it('should handle regular architecture + title + accTitle + accDescr', () => {
      const context = `architecture-beta
            title sample title
            accTitle: sample accTitle
            accDescr: sample accDescr
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title, accTitle, accDescr } = result.value;
      expect(title).toBe('sample title');
      expect(accTitle).toBe('sample accTitle');
      expect(accDescr).toBe('sample accDescr');
    });

    it('should handle regular architecture + title + accTitle + multi-line accDescr', () => {
      const context = `architecture-beta
            title sample title
            accTitle: sample accTitle
            accDescr {
                sample accDescr
            }
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title, accTitle, accDescr } = result.value;
      expect(title).toBe('sample title');
      expect(accTitle).toBe('sample accTitle');
      expect(accDescr).toBe('sample accDescr');
    });
  });

  describe('should handle groups', () => {
    it('should handle a diagram with groups', () => {
      const context = `architecture-beta
                group api
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBeUndefined();
      expect(groups[0].label).toBeUndefined();
    });

    it('should handle special characters in a label', () => {
      const context = `architecture-beta
       group api('cloud')["a.b-t"]`;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBe('a.b-t');
      expect(groups[0].in).toBeUndefined();
    });

    it('should handle special characters like email in a label', () => {
      const context = `architecture-beta
          group api('cloud')["user:password@some_domain.com"]`;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBe('user:password@some_domain.com');
      expect(groups[0].in).toBeUndefined();
    });

    it.each([
      'group api("cloud")[`The **cat** in the _hat_`]',
      'group api("cloud")["`The **cat** in the _hat_`"]',
      'group api("cloud")[\'`The **cat** in the _hat_`\']',
    ])('should handle markdown in a label', (context: string) => {
      const str = `architecture-beta
        ${context}`;
      const result = parse(str);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBe('`The **cat** in the _hat_`');
      expect(groups[0].in).toBeUndefined();
    });
    it('should handle markdown in a label', () => {
      const context = `architecture-beta
       group api('cloud')["\`The *bat*
        in the chat\`"]
      `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBe(`\`The *bat*
        in the chat\``);
      expect(groups[0].in).toBeUndefined();
    });

    it('should handle unicode', () => {
      const result = parse(`architecture-beta
      group api('cloud')["Начало"]`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { groups } = result.value;
      expect(groups[0].label).toBe('Начало');
    });

    it('should handle escaping "', () => {
      const result = parse('architecture-beta\ngroup api("cloud")["\\"Начало\\""]');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { groups } = result.value;
      expect(groups[0].label).toBe('"Начало"');
    });
    it('should handle a group with icon', () => {
      const context = `architecture-beta
                group api('cloud')
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBeUndefined();
      expect(groups[0].in).toBeUndefined();
    });

    it('should handle a group with label', () => {
      const context = `architecture-beta
                group api['API']
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBeUndefined();
      expect(groups[0].label).toBe('API');
      expect(groups[0].in).toBeUndefined();
    });

    it('should handle a group with in', () => {
      const context = `architecture-beta
                group api in cloud
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBeUndefined();
      expect(groups[0].label).toBeUndefined();
      expect(groups[0].in).toBe('cloud');
    });

    it('should handle a group with icon and label', () => {
      const context = `architecture-beta
                group api("cloud")['API']
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBe('API');
    });

    it('should handle a group with icon and label and in', () => {
      const context = `architecture-beta
                group api('cloud')['API'] in cloud
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBe('API');
      expect(groups[0].in).toBe('cloud');
    });

    it('should handle a group with icon and label and in with spaces', () => {
      const context = `architecture-beta
                group api ( 'cloud' ) [ 'API' ] in cloud
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups } = result.value;
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('api');
      expect(groups[0].icon).toBe('cloud');
      expect(groups[0].label).toBe('API');
      expect(groups[0].in).toBe('cloud');
    });

    it('should not handle a group with bad order of icon and label', () => {
      const context = `architecture-beta
                group api['API']('cloud')
                `;
      const result = parse(context);
      expect(result.lexerErrors).toHaveLength(0);
      expect(result.parserErrors).toHaveLength(1);
    });
  });

  describe('should handle services', () => {
    it('should handle a diagram with services', () => {
      const context = `architecture-beta
                service api
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBeUndefined();
      expect(services[0].iconText).toBeUndefined();
      expect(services[0].label).toBeUndefined();
      expect(services[0].in).toBeUndefined();
    });

    it('should handle a service with icon', () => {
      const context = `architecture-beta
                service api('cloud')
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBe('cloud');
      expect(services[0].iconText).toBeUndefined();
      expect(services[0].label).toBeUndefined();
    });

    it('should handle a service with iconText', () => {
      const context = `architecture-beta
                service api 'cloud'
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBeUndefined();
      expect(services[0].iconText).toBe('cloud');
      expect(services[0].label).toBeUndefined();
    });

    it('should handle a service with label', () => {
      const context = `architecture-beta
                service api['API']
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBeUndefined();
      expect(services[0].iconText).toBeUndefined();
      expect(services[0].label).toBe('API');
    });

    it('should handle a service with in', () => {
      const context = `architecture-beta
                service api in cloud
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBeUndefined();
      expect(services[0].iconText).toBeUndefined();
      expect(services[0].label).toBeUndefined();
      expect(services[0].in).toBe('cloud');
    });

    it('should handle a service with icon, label and in', () => {
      const context = `architecture-beta
                service api('cloud')['API'] in cloud
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBe('cloud');
      expect(services[0].iconText).toBeUndefined();
      expect(services[0].label).toBe('API');
      expect(services[0].in).toBe('cloud');
    });

    it('should handle a service with iconText, label and in', () => {
      const context = `architecture-beta
                service api 'cloud' ['API'] in cloud
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBeUndefined();
      expect(services[0].iconText).toBe('cloud');
      expect(services[0].label).toBe('API');
      expect(services[0].in).toBe('cloud');
    });

    it('should handle a service with iconText, icon and label without spaces', () => {
      const context = `architecture-beta
                service api"cloud"['API']
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { services } = result.value;
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('api');
      expect(services[0].icon).toBeUndefined();
      expect(services[0].iconText).toBe('cloud');
      expect(services[0].label).toBe('API');
    });
  });

  describe('should handle junctions', () => {
    it('should handle a diagram with junctions', () => {
      const context = `architecture-beta
                junction api
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { junctions } = result.value;
      expect(junctions).toHaveLength(1);
      expect(junctions[0].id).toBe('api');
    });
    it('should handle a junction with in', () => {
      const context = `architecture-beta
                junction api in cloud
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { junctions } = result.value;
      expect(junctions).toHaveLength(1);
      expect(junctions[0].id).toBe('api');
      expect(junctions[0].in).toBe('cloud');
    });
  });

  describe('should handle edges', () => {
    it.each([
      'left: L--R :right',
      'left: L -- R :right',
      'left:L--R:right',
      'left : L -- R : right',
    ])('should handle a diagram with edges %s', (context: string) => {
      const result = parse(`architecture-beta
                ${context}
                `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { edges } = result.value;
      expect(edges).toHaveLength(1);
      expect(edges[0].lhsId).toBe('left');
      expect(edges[0].lhsGroup).toBe(false);
      expect(edges[0].rhsId).toBe('right');
      expect(edges[0].rhsGroup).toBe(false);
      expect(edges[0].lhsDir).toBe('L');
      expect(edges[0].lhsInto).toBe(false);
      expect(edges[0].label).toBeUndefined();
      expect(edges[0].rhsInto).toBe(false);
      expect(edges[0].rhsDir).toBe('R');
    });

    it('should handle an edge with bidirectional arrows', () => {
      const context = `architecture-beta
                top : T <--> B : bottom
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { edges } = result.value;
      expect(edges).toHaveLength(1);
      expect(edges[0].lhsId).toBe('top');
      expect(edges[0].lhsGroup).toBe(false);
      expect(edges[0].rhsId).toBe('bottom');
      expect(edges[0].rhsGroup).toBe(false);
      expect(edges[0].lhsDir).toBe('T');
      expect(edges[0].lhsInto).toBe(true);
      expect(edges[0].label).toBeUndefined();
      expect(edges[0].rhsInto).toBe(true);
      expect(edges[0].rhsDir).toBe('B');
    });

    it('should handle an edge with unidirectional arrows', () => {
      const context = `architecture-beta
                top : T --> B : bottom
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { edges } = result.value;
      expect(edges).toHaveLength(1);
      expect(edges[0].lhsId).toBe('top');
      expect(edges[0].lhsGroup).toBe(false);
      expect(edges[0].rhsId).toBe('bottom');
      expect(edges[0].rhsGroup).toBe(false);
      expect(edges[0].lhsDir).toBe('T');
      expect(edges[0].lhsInto).toBe(false);
      expect(edges[0].label).toBeUndefined();
      expect(edges[0].rhsInto).toBe(true);
      expect(edges[0].rhsDir).toBe('B');
    });

    it('should handle an edge with bidirectional group edges', () => {
      const context = `architecture-beta
                left{group} : L--R : right{group}
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { edges } = result.value;
      expect(edges).toHaveLength(1);
      expect(edges[0].lhsId).toBe('left');
      expect(edges[0].lhsGroup).toBe(true);
      expect(edges[0].rhsId).toBe('right');
      expect(edges[0].rhsGroup).toBe(true);
      expect(edges[0].lhsDir).toBe('L');
      expect(edges[0].lhsInto).toBe(false);
      expect(edges[0].label).toBeUndefined();
      expect(edges[0].rhsInto).toBe(false);
      expect(edges[0].rhsDir).toBe('R');
    });

    it('should handle an edge with unidirectional group edges', () => {
      const context = `architecture-beta
                left{group} : L-->R : right
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { edges } = result.value;
      expect(edges).toHaveLength(1);
      expect(edges[0].lhsId).toBe('left');
      expect(edges[0].lhsGroup).toBe(true);
      expect(edges[0].rhsId).toBe('right');
      expect(edges[0].rhsGroup).toBe(false);
      expect(edges[0].lhsDir).toBe('L');
      expect(edges[0].lhsInto).toBe(false);
      expect(edges[0].label).toBeUndefined();
      expect(edges[0].rhsInto).toBe(true);
      expect(edges[0].rhsDir).toBe('R');
    });

    it('should handle an edge with label', () => {
      const context = `architecture-beta
                left : L-['My Edge Label']-R : right
                `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { edges } = result.value;
      expect(edges).toHaveLength(1);
      expect(edges[0].lhsId).toBe('left');
      expect(edges[0].lhsGroup).toBe(false);
      expect(edges[0].rhsId).toBe('right');
      expect(edges[0].rhsGroup).toBe(false);
      expect(edges[0].lhsDir).toBe('L');
      expect(edges[0].lhsInto).toBe(false);
      expect(edges[0].label).toBe('My Edge Label');
      expect(edges[0].rhsInto).toBe(false);
      expect(edges[0].rhsDir).toBe('R');
    });
  });
  describe('should handle whole architecture diagram', () => {
    it('should handle a simple architecture diagram with groups', () => {
      const context = `architecture-beta
                group api('cloud')['API']
                service db('database')['Database'] in api
                service disk1('disk')['Storage'] in api
                service disk2('disk')['Storage'] in api
                service server('server')['Server'] in api
                service gateway('internet')['Gateway'] 
                db:L--R:server
                disk1:T--B:server
                disk2:T--B:db
                server:T--B:gateway
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
    });

    it('should handle an architecture diagram with markdown labels', () => {
      const context = `architecture-beta
                group api('cloud')['\`**API**\`']

                service db('database')[\`_Database_\`] in api
                service disk1('disk')[\`_Storage_\`] in api
                service disk2('disk')[\`_Storage_\`] in api
                service server('server')[\`_Server_\`] in api
                service gateway('internet')[\`_Gateway_\`] 

                db:L - ["\`**Bold Label**\`"] - R:server
                disk1:T - ["\`**Bold Label**\`"] - B:server
                disk2:T - ["\`_Italic Label_\`"] - B: db
                server:T - ["\`_Italic Label_\`"] - B: gateway
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
    });
    it('should handle a complex architecture diagram', () => {
      const context = `architecture-beta
      group federated('cloud')['Federated Environment']
          service server1('server')['System'] in federated
          service edge('server')['Edge Device'] in federated
          server1:R -- L:edge

      group on_prem('cloud')['Hub']
          service firewall('server')['Firewall Device'] in on_prem
          service server('server')['Server'] in on_prem
          firewall:R -- L:server

          service db1('database')['db1'] in on_prem
          service db2('database')['db2'] in on_prem
          service db3('database')['db3'] in on_prem
          service db4('database')['db4'] in on_prem
          service db5('database')['db5'] in on_prem
          service db6('database')['db6'] in on_prem

          junction mid in on_prem
          server:B -- T:mid

          junction left_of_mid_1 in on_prem
          left_of_mid_1:R -- L:mid
          left_of_mid_1:B -- T:db1

          junction left_of_mid_2 in on_prem
          left_of_mid_2:R -- L:left_of_mid_1
          left_of_mid_2:B -- T:db2

          junction left_of_mid_3 in on_prem
          left_of_mid_3:R -- L:left_of_mid_2
          left_of_mid_3:B -- T:db3

          junction right_of_mid_1 in on_prem
          mid:R -- L:right_of_mid_1
          right_of_mid_1:B -- T:db4
          
          junction right_of_mid_2 in on_prem
          1RightOfMid:R -- L:right_of_mid_2
          right_of_mid_2:B -- T:db5        
          
          junction right_of_mid_3 in on_prem
          right_of_mid_2:R -- L:right_of_mid_3
          right_of_mid_3:B -- T:db6         

          edge:R -- L:firewall
      `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      const { groups, services, junctions, edges } = result.value;
      expect(groups).toHaveLength(2);
      expect(services).toHaveLength(10);
      expect(junctions).toHaveLength(7);
      expect(edges).toHaveLength(16);
    });
  });
});
