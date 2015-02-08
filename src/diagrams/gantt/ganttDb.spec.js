/**
 * Created by knut on 14-11-18.
 */
describe('when using the ganttDb',function() {
    var parseError, gantt;
    var moment = require('moment');
    
    beforeEach(function () {
        //gantt = require('./parser/gantt').parser;
        
        gDb = require('./ganttDb');
        gDb.clear();
        parseError = function(err, hash) {
            console.log('Syntax error:' + err);
        };
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
        expect(tasks[0].description).toEqual('test1');
    });
    it('should handle duration instead of fixed date to determine end date', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2d');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-03', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].description).toEqual('test1');
    });
    it('should handle duration instead of fixed date to determine end date', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2h');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-01 2:00', 'YYYY-MM-DD hh:mm').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].description).toEqual('test1');
    });
    it('should handle ', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('id1');
        expect(tasks[0].description).toEqual('test1');
    });
    
    it('should handle relative start date based on id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','id2,after id1,1d');
        
        var tasks = gDb.getTasks();
        
        expect(tasks[1].startTime  ).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[1].id         ).toEqual('id2');
        expect(tasks[1].description).toEqual('test2');
    });
    
    it('should handle relative start date based on id when id is invalid', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','id2,after id3,1d');
        var tasks = gDb.getTasks();
        expect(tasks[1].startTime).toEqual(new Date((new Date()).setHours(0,0,0,0)));
        expect(tasks[1].id       ).toEqual('id2');
        expect(tasks[1].description).toEqual('test2');
    });

    it('should handle fixed dates without id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','2013-01-01,2013-01-12');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-12', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('task1');
        expect(tasks[0].description).toEqual('test1');
    });

    it('should handle duration instead of a fixed date to determine end date without id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','2013-01-01,4d');
        var tasks = gDb.getTasks();
        expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate());
        expect(tasks[0].endTime  ).toEqual(moment('2013-01-05', 'YYYY-MM-DD').toDate());
        expect(tasks[0].id       ).toEqual('task1');
        expect(tasks[0].description).toEqual('test1');
    });

    it('should handle relative start date of a fixed date to determine end date without id', function () {
        gDb.setDateFormat('YYYY-MM-DD');
        gDb.addSection('testa1');
        gDb.addTask('test1','id1,2013-01-01,2w');
        gDb.addTask('test2','after id1,1d');

        var tasks = gDb.getTasks();

        expect(tasks[1].startTime  ).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate());
        expect(tasks[1].id         ).toEqual('task1');
        expect(tasks[1].description).toEqual('test2');
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
        expect(tasks[1].description).toEqual('test2');
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
        expect(tasks[1].description).toEqual('test2');
    });

});

// Ogiltigt id i after id
