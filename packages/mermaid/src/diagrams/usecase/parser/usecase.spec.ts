// @ts-ignore: jison doesn't export types
import usecase from './usecase.jison';
import db, { type UsecaseDB, UsecaseLink, UsecaseNode } from '../usecaseDB.js';
import { prepareTextForParsing } from '../usecaseUtils.js';
import { setConfig } from '../../../config.js';
// @ts-ignore unused variable
import { log, setLogLevel } from '../../../logger.js';

setConfig({
  securityLevel: 'strict',
});

describe('Usecase diagram', function () {
  describe('when parsing a use case it', function () {
    beforeEach(function () {
      usecase.parser.yy = db;
      usecase.parser.yy.clear();
    });

    it('should handle a basic use case', function () {
      const input = `
        usecase-beta
          User -> (Start)
          User --> (Use the application)
          (Use the application) --> (Another use case)
      `;

      const result = usecase.parse(prepareTextForParsing(input));
      expect(result).toBeTruthy();
      expect(usecase.yy.getDiagramTitle()).toBe('');
      expect(usecase.yy.getSystemBoundaries()).toStrictEqual([]);

      const relationships = usecase.yy.getRelationships();
      expect(relationships).toStrictEqual([
        new UsecaseLink(
          new UsecaseNode('User', 'actor'),
          new UsecaseNode('(Start)', 'usecase'),
          '->',
          ''
        ),
        new UsecaseLink(
          new UsecaseNode('User', 'actor'),
          new UsecaseNode('(Use the application)', 'usecase'),
          '-->',
          ''
        ),
        new UsecaseLink(
          new UsecaseNode('(Use the application)', 'usecase'),
          new UsecaseNode('(Another use case)', 'usecase'),
          '-->',
          ''
        ),
      ]);
    });

    it('should handle a simple use case with system boundary', function () {
      const input = `
        usecase-beta
          title  Simple use case
          systemboundary
            title Acme System
            (Start)
            (Use) as (Use the application)
            (Another use case)
          end
          User -> (Start)
          User --> (Use)
          (Use) --> (Another use case)
      `;

      const result = usecase.parse(prepareTextForParsing(input));
      expect(result).toBeTruthy();
      expect(usecase.yy.getDiagramTitle()).toEqual('Simple use case');

      const boundaries = usecase.yy.getSystemBoundaries();
      expect(boundaries[0].useCases).toStrictEqual(['(Start)', '(Use)', '(Another use case)']);
    });

    it('should handle a complex case', function () {
      const input = `
      usecase-beta
        title Arrows in Use Case diagrams

        actor Student
        actor Admin
        service Authentication
        service Grades
        service Courses

        systemboundary
          title Student Management System
          (Login) {
            - Authenticate
          }
          (Submit Assignment) {
            - Upload Assignment
          }
          (View Grades)
          (Manage Users) {
            - Add User
            - Edit User
            - Delete User
          }
          (Manage Courses) {
            - Add Course
            - Edit Course
            - Delete Course
          }
          (Generate Reports) {
            - Generate User Report
            - Generate Course Report
          }
          (View Grades) {
            - View User Grades
            - View Course Grades
          }
        end

        Student -> (Login) -> Authentication
        Student -> (Submit Assignment) -> Courses
        Student -> (View Grades) -> Grades
        Admin -> (Login) -> Authentication
        Admin -> (Manage Users) -> Courses
        Admin -> (Manage Courses) -> Courses
        Admin -> (Generate Reports) -> Courses, Grades
        Admin -> (View Grades) -> Grades
      `;
      const result = usecase.parse(prepareTextForParsing(input));
      expect(result).toBeTruthy();
      expect(usecase.yy.getDiagramTitle()).toEqual('Arrows in Use Case diagrams');

      const db = usecase.yy as UsecaseDB;

      expect(db.getRelationships()).toContainEqual({
        source: { id: 'Admin', nodeType: 'actor' },
        target: { id: '(Login)', nodeType: 'usecase', extensionPoints: ['Authenticate'] },
        arrow: '->',
        label: '',
      });
    });

    it('should handle aliases', function () {
      const input = `
        usecase-beta
          actor SU as Student Union
          actor University Chancellor
          service PMS as Payment Management System
          SU -> (Pay Dues) -> PMS
        `;
      const result = usecase.parse(prepareTextForParsing(input));
      const db = usecase.yy as UsecaseDB;
      expect(result).toBeTruthy();
      expect(db.getActors()).toStrictEqual(['SU', 'University Chancellor']);
      expect(db.getServices()).toStrictEqual(['PMS']);
      expect(db.getData().nodes.find((n) => n.id === 'SU')?.label).toEqual('Student Union');
      expect(db.getData().nodes.find((n) => n.id === 'University Chancellor')?.label).toEqual(
        'University Chancellor'
      );
      expect(db.getData().nodes.find((n) => n.id === 'PMS')?.label).toEqual(
        'Payment Management System'
      );
    });

    it('should parse system boundary with no extension points', function () {
      const input = `
      usecase-beta
        systemboundary
          (Repair Car)
        end
      `;
      const result = usecase.parse(prepareTextForParsing(input));
      expect(result).toBeTruthy();
      const db = usecase.yy as UsecaseDB;
      expect(db.getSystemBoundaries()[0].useCases).toStrictEqual(['(Repair Car)']);
      expect(db.getUseCases()).toStrictEqual(['(Repair Car)']);
    });

    it('should parse system boundary with extension points', function () {
      const input = `
      usecase-beta
        systemboundary
          (Repair Device) {
            - Login with Secure Token
            -   Run Diagnostics
            - Logout
            - Get Help
          }
        end
      `;
      const result = usecase.parse(prepareTextForParsing(input));
      expect(result).toBeTruthy();
      const db = usecase.yy as UsecaseDB;
      expect(db.getSystemBoundaries()[0].useCases).toStrictEqual(['(Repair Device)']);
      expect(db.getUseCaseExtensionPoints('(Repair Device)')).toStrictEqual([
        'Login with Secure Token',
        'Run Diagnostics',
        'Logout',
        'Get Help',
      ]);
    });
  });
});
