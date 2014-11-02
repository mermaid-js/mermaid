
//console.log(p.parse('#fcfcfc'));
//console.log(p.parse('background: #fcfcfc'));
//console.log(p.parse('background: black'));
var scope={
	addVertex:function(id,text,type,style){
	console.log('Got node '+id+' '+type+' '+text+' styles: '+JSON.stringify(style));
},
addLink:function(start,end,type,linktext){
	console.log('Got link from '+start+' to '+end+' type:'+type.type+' linktext:'+linktext);
}
};

var p = require('./mermaid.js');
p.parser.yy = scope;


console.log(p.parse('A-->B;'));
console.log(p.parse('A---B;'));
console.log(p.parse('A--xB;'));
console.log(p.parse('A--oB|apan;'));
console.log(p.parse('A--oB|apan hoppar;\nB-->C|apan hoppar vidare;'));

console.log(p.parse('A-->B|apan hoppar;\nB-->C;'));
console.log(p.parse('A-->B|apan hoppar;'));
console.log(p.parse('A[chimpansen hoppar]-->C;'));
console.log(p.parse('A(chimpansen hoppar)-->C;'));

//console.log(p.parse('A{chimpansen hoppar}-->C;'));
console.log(p.parse('style Q background:#fff;'));
console.log(p.parse('style R background:#fff,border:1px solid red;'));
console.log(p.parse('style S background:#aaa;\nstyle T background:#bbb,border:1px solid red;'));
//console.log(p.parse('A;'));

