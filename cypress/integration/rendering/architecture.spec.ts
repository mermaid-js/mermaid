import { imgSnapshotTest, urlSnapshotTest } from '../../helpers/util.ts';

describe.skip('architecture diagram', () => {
  it('should render a simple architecture diagram with groups', () => {
    imgSnapshotTest(
      `architecture-beta
                group api(cloud)[API]

                service db(database)[Database] in api
                service disk1(disk)[Storage] in api
                service disk2(disk)[Storage] in api
                service server(server)[Server] in api
                service gateway(internet)[Gateway] 

                db L--R server
                disk1 T--B server
                disk2 T--B db
                server T--B gateway
            `
    );
  });
  it('should render an architecture diagram with groups within groups', () => {
    imgSnapshotTest(
      `architecture-beta
                group api[API]
                group public[Public API] in api
                group private[Private API] in api
        
                service serv1(server)[Server] in public
        
                service serv2(server)[Server] in private
                service db(database)[Database] in private
        
                service gateway(internet)[Gateway] in api
        
                serv1 B--T serv2
                serv2 L--R db
                serv1 L--R gateway
            `
    );
  });
  it('should render an architecture diagram with the fallback icon', () => {
    imgSnapshotTest(
      `architecture-beta
                service unknown(iconnamedoesntexist)[Unknown Icon]
            `
    );
  });
  it('should render an architecture diagram with split directioning', () => {
    imgSnapshotTest(
      `architecture-beta
                service db(database)[Database]
                service s3(disk)[Storage]
                service serv1(server)[Server 1]
                service serv2(server)[Server 2]
                service disk(disk)[Disk]
        
                db L--R s3
                serv1 L--T s3
                serv2 L--B s3
                serv1 T--B disk
            `
    );
  });
  it('should render an architecture diagram with directional arrows', () => {
    imgSnapshotTest(
      `architecture-beta
                service servC(server)[Server 1]
                service servL(server)[Server 2]
                service servR(server)[Server 3]
                service servT(server)[Server 4]
                service servB(server)[Server 5]
        
                servC (L--R) servL
                servC (R--L) servR
                servC (T--B) servT
                servC (B--T) servB
        
                servL (T--L) servT
                servL (B--L) servB
                servR (T--R) servT
                servR (B--R) servB
            `
    );
  });
  it('should render an architecture diagram with group edges', () => {
    imgSnapshotTest(
      `architecture-beta
                group left_group(cloud)[Left]
                group right_group(cloud)[Right]
                group top_group(cloud)[Top]
                group bottom_group(cloud)[Bottom]
                group center_group(cloud)[Center]
        
                service left_disk(disk)[Disk] in left_group
                service right_disk(disk)[Disk] in right_group
                service top_disk(disk)[Disk] in top_group
                service bottom_disk(disk)[Disk] in bottom_group
                service center_disk(disk)[Disk] in center_group
        
                left_disk{group} (R--L) center_disk{group}
                right_disk{group} (L--R) center_disk{group}
                top_disk{group} (B--T) center_disk{group}
                bottom_disk{group} (T--B) center_disk{group}
            `
    );
  });
  it('should render an architecture diagram with edge labels', () => {
    imgSnapshotTest(
      `architecture-beta
                service servC(server)[Server 1]
                service servL(server)[Server 2]
                service servR(server)[Server 3]
                service servT(server)[Server 4]
                service servB(server)[Server 5]
        
                servC L-[Label]-R servL
                servC R-[Label]-L servR
                servC T-[Label]-B servT
                servC B-[Label]-T servB
        
                servL T-[Label]-L servT
                servL B-[Label]-L servB
                servR T-[Label]-R servT
                servR B-[Label]-R servB
            `
    );
  });
  it('should render an architecture diagram with simple junction edges', () => {
    imgSnapshotTest(
      `architecture-beta
                service left_disk(disk)[Disk]
                service top_disk(disk)[Disk]
                service bottom_disk(disk)[Disk]
                service top_gateway(internet)[Gateway]
                service bottom_gateway(internet)[Gateway]
                junction juncC
                junction juncR
        
                left_disk R--L juncC
                top_disk B--T juncC
                bottom_disk T--B juncC
                juncC R--L juncR
                top_gateway B--T juncR
                bottom_gateway T--B juncR
            `
    );
  });
  it('should render an architecture diagram with complex junction edges', () => {
    imgSnapshotTest(
      `architecture-beta
                group left
                group right
                service left_disk(disk)[Disk] in left
                service top_disk(disk)[Disk] in left
                service bottom_disk(disk)[Disk] in left
                service top_gateway(internet)[Gateway] in right
                service bottom_gateway(internet)[Gateway] in right
                junction juncC in left
                junction juncR in right
        
                left_disk R--L juncC
                top_disk B--T juncC
                bottom_disk T--B juncC
        
        
                top_gateway (B--T juncR
                bottom_gateway (T--B juncR
        
                juncC{group} R--L) juncR{group}
            `
    );
  });

  it('should render an architecture diagram with a resonable height', () => {
    imgSnapshotTest(
      `architecture-beta
              group federated(cloud)[Federated Environment]
                  service server1(server)[System] in federated
                  service edge(server)[Edge Device] in federated
                  server1:R -- L:edge

              group on_prem(cloud)[Hub]
                  service firewall(server)[Firewall Device] in on_prem
                  service server(server)[Server] in on_prem
                  firewall:R -- L:server

                  service db1(database)[db1] in on_prem
                  service db2(database)[db2] in on_prem
                  service db3(database)[db3] in on_prem
                  service db4(database)[db4] in on_prem
                  service db5(database)[db5] in on_prem
                  service db6(database)[db6] in on_prem

                  junction mid in on_prem
                  server:B -- T:mid

                  junction 1Leftofmid in on_prem
                  1Leftofmid:R -- L:mid
                  1Leftofmid:B -- T:db1

                  junction 2Leftofmid in on_prem
                  2Leftofmid:R -- L:1Leftofmid
                  2Leftofmid:B -- T:db2

                  junction 3Leftofmid in on_prem
                  3Leftofmid:R -- L:2Leftofmid
                  3Leftofmid:B -- T:db3

                  junction 1RightOfMid in on_prem
                  mid:R -- L:1RightOfMid
                  1RightOfMid:B -- T:db4
                  
                  junction 2RightOfMid in on_prem
                  1RightOfMid:R -- L:2RightOfMid
                  2RightOfMid:B -- T:db5        
                  
                  junction 3RightOfMid in on_prem
                  2RightOfMid:R -- L:3RightOfMid
                  3RightOfMid:B -- T:db6         

                  edge:R -- L:firewall
      `
    );
  });
});

// Skipped as the layout is not deterministic, and causes issues in E2E tests.
describe.skip('architecture - external', () => {
  it('should allow adding external icons', () => {
    urlSnapshotTest('http://localhost:9000/architecture-external.html');
  });
});
