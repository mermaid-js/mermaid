/**
 * Created by knut on 14-11-18.
 */
describe('when using the ganttDb',function() {
    var gDb;
    var moment = require('moment');
    
    beforeEach(function () {
        //gantt = require('./parser/gantt').parser;

        gDb = require('./ganttDb');
        gDb.clear();
        //ex.yy.parseError = parseError;
    });

    it('should handle an fixed dates', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2013-01-12');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-12', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].task).toEqual('test1');
    });
    it('should handle duration (days) instead of fixed date to determine end date', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2d');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-03', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].task).toEqual('test1');
    });
    it('should handle duration (hours) instead of fixed date to determine end date', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2h');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-01 2:00', 'YYYY-MM-DD hh:mm').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].task).toEqual('test1');
    });
    it('should handle duration (minutes) instead of fixed date to determine end date', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2m');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-01 00:02', 'YYYY-MM-DD hh:mm').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].task).toEqual('test1');
    });
    it('should handle duration (seconds) instead of fixed date to determine end date', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2s');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-01 00:00:02', 'YYYY-MM-DD hh:mm:ss').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].task).toEqual('test1');
    });
    it('should handle duration (weeks) instead of fixed date to determine end date', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].task).toEqual('test1');
    });
    
    it('should handle relative start date based on id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','id2,after id1,1d');
        
        var tasks = gDb.getTasks();
        
        expect(tasks[1].startTime  ).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[1].id         ).toEqual('id2');
        expect(tasks[1].task).toEqual('test2');
    });
    
    it('should handle relative start date based on id when id is invalid', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','id2,after id3,1d');
        var tasks = gDb.getTasks();
        expect(tasks[1].startTime).toEqual(new Date((new Date()).setHours(0,0,0,0)));
        expect(tasks[1].id       ).toEqual('id2');
        expect(tasks[1].task).toEqual('test2');
    });

    it('should handle fixed dates without id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','2013-01-01,2013-01-12');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-12', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('task1');
        expect(tasks[0].task).toEqual('test1');
    });

    it('should handle duration instead of a fixed date to determine end date without id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','2013-01-01,4d');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-05', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('task1');
        expect(tasks[0].task).toEqual('test1');
    });

    it('should handle relative start date of a fixed date to determine end date without id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','after id1,1d');

        var tasks = gDb.getTasks();

        expect(tasks[1].startTime  ).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[1].id         ).toEqual('task1');
        expect(tasks[1].task).toEqual('test2');
    });
    it('should handle a new task with only an end date as definition', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','2013-01-26');

        var tasks = gDb.getTasks();

        expect(tasks[1].startTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[1].endTime  ).toEqual(moment('2013-01-26', 'YYYY-MM-DD').toDate());
        expect(tasks[1].id       ).toEqual('task1');
        expect(tasks[1].task).toEqual('test2');
    });
    it('should handle a new task with only an end date as definition', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','2d');

        var tasks = gDb.getTasks();

        expect(tasks[1].startTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[1].endTime  ).toEqual(moment('2013-01-17', 'YYYY-MM-DD').toDate());
        expect(tasks[1].id       ).toEqual('task1');
        expect(tasks[1].task).toEqual('test2');
    });
    it('should handle relative start date based on id regardless of sections', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','id2,after id3,1d');
        gDb.addSection('testa2');
        gDb.addTask('test3','id3,after id1,2d');

        var tasks = gDb.getTasks();

        expect(tasks[1].startTime  ).toEqual(moment('2013-01-17', 'YYYY-MM-DD').toDate());
        expect(tasks[1].endTime  ).toEqual(moment('2013-01-18', 'YYYY-MM-DD').toDate());
        expect(tasks[1].id         ).toEqual('id2');
        expect(tasks[1].task).toEqual('test2');

        expect(tasks[2].id         ).toEqual('id3');
        expect(tasks[2].task).toEqual('test3');
        expect(tasks[2].startTime  ).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[2].endTime  ).toEqual(moment('2013-01-17', 'YYYY-MM-DD').toDate());
    });

});

// Ogiltigt id i after id
