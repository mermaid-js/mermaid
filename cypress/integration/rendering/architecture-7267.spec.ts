import { imgSnapshotTest } from '../../helpers/util.ts';

describe('architecture diagram - issue #7267', () => {
  it('should position nodes correctly for the provided example (admin not off-screen)', () => {
    imgSnapshotTest(
      `architecture-beta
    group a1(internet)[Internet]
    service modem(server)[ModemBox] in a1

    group router(cloud)[MT Router]

    group netBridge(cloud)[Bridge] in router

    group vlMgmt(cloud)[vl Mgmt] in netBridge
    group vlIot(cloud)[vl IoT] in netBridge
    group vlSip(cloud)[vl SIP] in netBridge
    group vlGuest(cloud)[vl Guest] in netBridge
    group vlIntern(cloud)[vl Internal] in netBridge

    service ppp(internet)[Upstream] in router
    service svc(server)[Service Port] in router
    
    service admin(cloud)[Admin]

    service snIntern[subN 10] in vlIntern
    service snIot[subN 30] in vlIot
    service snGuest[subN 31] in vlGuest
    service snSip[subN 40] in vlSip
    service snMgmt[subN 99] in vlMgmt

    ppp:T -- B:modem{group}

    svc:R -[here be problems]- L:admin{group}
`,
      {},
      false,
      (svg: JQuery<SVGElement>) => {
        const el = svg.find('#service-admin')[0];
        // ensure element exists
        expect(Boolean(el)).to.equal(true, 'service-admin element exists');
        const transform = el.getAttribute('transform') ?? '';
        // Expect a translate(...) transform and reasonable coordinates
        const m = /translate\(([\d.-]+),\s*([\d.-]+)\)/.exec(transform);
        expect(m !== null).to.equal(true, 'transform contains translate with numbers');
        if (m) {
          const x = parseFloat(m[1]);
          const y = parseFloat(m[2]);
          // coordinates should be within a reasonable viewport (not absurdly large)
          expect(Math.abs(x)).to.be.lessThan(5000);
          expect(Math.abs(y)).to.be.lessThan(5000);
        }
      }
    );
  });
});
