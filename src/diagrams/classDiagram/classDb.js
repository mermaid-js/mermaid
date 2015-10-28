
import * as Logger from '../../logger';
var log = new Logger.Log();

var relations = [];
var classes = {};

// Functions to be run after graph rendering
var funs = [];
/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 */
exports.addClass = function (id) {
    console.log('Adding: '+id);
    if(typeof classes.id === 'undefined'){
        classes[id] = {
            id:id,
            methods:[]
        };
    }
};

exports.clear = function () {
    relations = [];
    classes = {};
};

module.exports.getClass = function (id) {
    return classes[id];
};

exports.addRelation = function (relation) {
    console.log('Adding relation: ' + JSON.stringify(relation));
    exports.addClass(relation.id1);
    exports.addClass(relation.id2);

    //var id1, id2, type1, type2, relationTitle1, relationTitle2, title,label;
    //id1=tuple.id1;
    //id2=tuple.id2;
    //type1=tuple.type1;
    //type2=tuple.type2;
    //relationTitle1=tuple.relationTitle1;
    //relationTitle2=tuple.relationTitle1;
    //
    //log.debug('Got edge', start, end);
    //var edge = {
    //    id1: id1,
    //    id2: id2,
    //    type1: type1,
    //    type2: type2,
    //    relationTitle1:relationTitle1,
    //    relationTitle2:relationTitle2,
    //    title:title
    //};
    relations.push(relation);
};

exports.addMembers = function (className, MembersArr) {
};

exports.lineType = {
    LINE:0,
    DOTTED_LINE:1
};

exports.relationType = {
    AGGREGATION:0,
    EXTENSION:1,
    COMPOSITION:2,
    DEPENDENCY:3
};