// @ts-ignore: jison doesn't export types
import usecase from './usecase.jison';
import db, { UsecaseLink, UsecaseNode } from '../usecaseDB.js';
import { cleanupComments } from '../../../diagram-api/comments.js';
import { prepareTextForParsing } from '../usecaseUtils.js';
import * as fs from 'fs';
import * as path from 'path';

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
        new UsecaseLink(new UsecaseNode('User'), new UsecaseNode('(Start)'), '->'),
        new UsecaseLink(new UsecaseNode('User'), new UsecaseNode('(Use the application)'), '-->'),
        new UsecaseLink(
          new UsecaseNode('(Use the application)'),
          new UsecaseNode('(Another use case)'),
          '-->'
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
      // console.log(usecase.yy.getRelationships());
      // console.log(usecase.yy.getSystemBoundaries());
    });
  });
});
