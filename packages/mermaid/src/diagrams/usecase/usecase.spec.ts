import { UsecaseDB } from './usecaseDB.js';

describe('Usecase diagram', function () {
  const db = new UsecaseDB();
  beforeEach(function () {
    db.clear();
  });
  it('should add node when adding participants', function () {
    db.addParticipants({ service: 'Authz' });
    expect(db.getServices()).toStrictEqual(['Authz']);
  });
  it('should add actor when adding relationship', function () {
    db.addRelationship('Student', '(Enrol)', '-->');
    expect(db.getActors()).toStrictEqual(['Student']);
  });
  it('should add use case and service when adding relationship', function () {
    db.addRelationship('(Enrol)', 'Enrolment System', '-->');
    expect(db.getServices()).toStrictEqual(['Enrolment System']);
    expect(db.getUseCases()).toStrictEqual(['(Enrol)']);
  });
});
