/**
 * Created by knut on 14-11-18.
 */
var sq = require('./parser/sequence').parser;

//console.log(sq.parse('a12:d12\na24:d24'));

str = 'a12:d12\n\na24:d24';
//console.log(str);
//console.log(sq.parse(str));
//console.log(sq.parse('[]\n[]'));

str = 'bfs:queue\n\nbfs3:queue\n';
str =  str + 'bfs:message=someNode.setLevel\n';
str =  str + 'bfs:message2=someNode.setLevel2';
console.log(str);
console.log(sq.parse(str));

str = 'bfs:BFS\n';
str = str + 'someNode:SomeNode\n';
str = str + 'bfs:queue.new\n';
str = str + 'bfs:someNode.setLevel';
//console.log(str);
//console.log(sq.parse(str));
