
import * as Logger from '../../logger';
var log = new Logger.Log();

var relations = [];
let classes = new Map();

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
    if(typeof classes.get(id) === 'undefined'){
        classes.set(id, {
            id:id,
            methods:[]
        });
    }
};

exports.clear = function () {
    relations = [];
    classes.clear();
};

module.exports.getClass = function (id) {
    return classes.get(id);
};
module.exports.getClasses = function (id) {
    return classes;
};

module.exports.getRelations = function (id) {
    return relations;
};

exports.addRelation = function (relation) {
    console.log('Adding relation: ' + JSON.stringify(relation));
    exports.addClass(relation.id1);
    exports.addClass(relation.id2);

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