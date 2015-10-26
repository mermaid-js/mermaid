
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
exports.addClass = function (id, text, type, style) {
    var txt;

    if(typeof id === 'undefined'){
        return;
    }
    if(id.trim().length === 0){
        return;
    }

    if (typeof vertices[id] === 'undefined') {
        vertices[id] = {id: id, styles: [], classes:[]};
    }
    if (typeof text !== 'undefined') {
        txt = text.trim();

        // strip quotes if string starts and exnds with a quote
        if(txt[0] === '"' && txt[txt.length-1] === '"'){
            txt = txt.substring(1,txt.length-1);
        }

        vertices[id].text = txt;
    }
    if (typeof type !== 'undefined') {
        vertices[id].type = type;
    }
    if (typeof type !== 'undefined') {
        vertices[id].type = type;
    }
    if (typeof style !== 'undefined') {
        if (style !== null) {
            style.forEach(function (s) {
                vertices[id].styles.push(s);
            });
        }
    }
};

exports.addRelation = function (id1, id2, type1, type2, relationTitle1, relationTitle2, title) {
    log.debug('Got edge', start, end);
    var edge = {
        id1: id1,
        id2: id2,
        type1: type1,
        type2: type2,
        relationTitle1:relationTitle1,
        relationTitle2:relationTitle2,
        title:title
    };
    relations.push(edge);
};