var gantt = require('./parser/gantt').parser;
gantt.yy = require('./ganttDb');
var d3 = require('./d3');

var conf = {
    titleTopMargin:25,
    barHeight:20,
    barGap:4,
    topPadding:75,
    sidePadding:75
};
module.exports.setConf = function(cnf){
    var keys = Object.keys(cnf);

    keys.forEach(function(key){
        conf[key] = cnf[key];
    });
};
var w;
module.exports.draw = function (text, id) {
    gantt.yy.clear();
    gantt.parse(text);
    var elem = document.getElementById(id);
    w = elem.offsetWidth;
    
    if(typeof w === 'undefined'){
        w = 800;
    }
    
    var taskArray = gantt.yy.getTasks();
    
    // Set height based on number of tasks
    var h = taskArray.length*(conf.barHeight+conf.barGap)+2*conf.topPadding;

    elem.style.height = h+'px';
    var svg = d3.select('#'+id);

// http://codepen.io/anon/pen/azLvWR


    var dateFormat = d3.time.format("%Y-%m-%d");

    // Set timescale
    var timeScale = d3.time.scale()
        .domain([d3.min(taskArray, function (d) {
            return d.startTime;
        }),
            d3.max(taskArray, function (d) {
                return d.endTime;
            })])
        .range([0, w - 150]);

    var categories = [];

    for (var i = 0; i < taskArray.length; i++) {
        categories.push(taskArray[i].type);
    }

    var catsUnfiltered = categories; //for vert labels

    categories = checkUnique(categories);


    makeGant(taskArray, w, h);

    var title = svg.append("text")
        .text(gantt.yy.getTitle())
        .attr("x", w / 2)
        .attr("y", conf.titleTopMargin)
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("fill", "#009FFC");


    function makeGant(tasks, pageWidth, pageHeight) {

        var barHeight = conf.barHeight;
        var gap = barHeight + conf.barGap;
        var topPadding = conf.topPadding;
        var sidePadding = conf.sidePadding;

        var colorScale = d3.scale.linear()
            .domain([0, categories.length])
            .range(["#00B9FA", "#F95002"])
            .interpolate(d3.interpolateHcl);

        makeGrid(sidePadding, topPadding, pageWidth, pageHeight);
        drawRects(tasks, gap, topPadding, sidePadding, barHeight, colorScale, pageWidth, pageHeight);
        vertLabels(gap, topPadding, sidePadding, barHeight, colorScale);

    }


    function drawRects(theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w, h) {

        var bigRects = svg.append("g")
            .selectAll("rect")
            .data(theArray)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function (d, i) {
                return i * theGap + theTopPad - 2;
            })
            .attr("width", function (d) {
                return w - theSidePad / 2;
            })
            .attr("height", theGap)
            .attr("stroke", "none")
            .attr("fill", function (d) {
                for (var i = 0; i < categories.length; i++) {
                    if (d.type === categories[i]) {
                        return d3.rgb(theColorScale(i));
                    }
                }
            })
            .attr("opacity", 0.2);


        var rectangles = svg.append('g')
            .selectAll("rect")
            .data(theArray)
            .enter();


        var innerRects = rectangles.append("rect")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("x", function (d) {
                return timeScale(d.startTime) + theSidePad;
            })
            .attr("y", function (d, i) {
                return i * theGap + theTopPad;
            })
            .attr("width", function (d) {
                return (timeScale(d.endTime) - timeScale(d.startTime));
            })
            .attr("height", theBarHeight)
            .attr("stroke", "none")
            .attr("fill", function (d) {
                for (var i = 0; i < categories.length; i++) {
                    if (d.type === categories[i]) {
                        return d3.rgb(theColorScale(i));
                    }
                }
            });


        var rectText = rectangles.append("text")
            .text(function (d) {
                return d.task;
            })
            .attr("font-size", 11)
            .attr("x", function (d) {
                var startX = timeScale(d.startTime),
                    endX = timeScale(d.endTime),
                    textWidth = this.getBBox().width;
                
                // Check id text width > width of rectangle
                if(textWidth>(endX-startX)){
                    if (endX + textWidth > w){
                        return startX + theSidePad;
                    }else {
                        return endX + theSidePad;
                    }
                }else{
                    return (endX - startX) / 2 + startX + theSidePad;
                }
            })
            .attr("y", function (d, i) {
                return i * theGap + 14 + theTopPad;
            })
            //.attr("text-anchor", "middle")
            .attr("text-height", theBarHeight)
            .attr("class",function (d) {
                var startX = timeScale(d.startTime),
                    endX = timeScale(d.endTime),
                    textWidth = this.getBBox().width;
                
                // Check id text width > width of rectangle
                if(textWidth>(endX-startX)) {
                    if (endX + textWidth > w){
                        return 'taskTextOutsideLeft';
                    }else {
                        return 'taskTextOutsideRight';
                    }
                }else{
                    return 'taskText';
                }
            });

    }


    function makeGrid(theSidePad, theTopPad, w, h) {

        var xAxis = d3.svg.axis()
            .scale(timeScale)
            .orient('bottom')
            //.ticks(d3.time.days, 5)
            .tickSize(-h + theTopPad + 20, 0, 0)
            .tickFormat(d3.time.format('%d %b'));

        var grid = svg.append('g')
            .attr('class', 'grid')
            .attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')')
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("fill", "#000")
            .attr("stroke", "none")
            .attr("font-size", 10)
            .attr("dy", "1em");
    }

    function vertLabels(theGap, theTopPad, theSidePad, theBarHeight, theColorScale) {
        var numOccurances = [];
        var prevGap = 0;

        for (var i = 0; i < categories.length; i++) {
            numOccurances[i] = [categories[i], getCount(categories[i], catsUnfiltered)];
        }

        var axisText = svg.append("g") //without doing this, impossible to put grid lines behind text
            .selectAll("text")
            .data(numOccurances)
            .enter()
            .append("text")
            .text(function (d) {
                return d[0];
            })
            .attr("x", 10)
            .attr("y", function (d, i) {
                if (i > 0) {
                    for (var j = 0; j < i; j++) {
                        prevGap += numOccurances[i - 1][1];
                        // console.log(prevGap);
                        return d[1] * theGap / 2 + prevGap * theGap + theTopPad;
                    }
                } else {
                    return d[1] * theGap / 2 + theTopPad;
                }
            })
            .attr("font-size", 11)
            .attr("text-anchor", "start")
            .attr("text-height", 14)
            .attr("fill", function (d) {
                for (var i = 0; i < categories.length; i++) {
                    if (d[0] === categories[i]) {
                        //  console.log("true!");
                        return d3.rgb(theColorScale(i)).darker();
                    }
                }
            });

    }

//from this stackexchange question: http://stackoverflow.com/questions/1890203/unique-for-arrays-in-javascript
    function checkUnique(arr) {
        var hash = {}, result = [];
        for (var i = 0, l = arr.length; i < l; ++i) {
            if (!hash.hasOwnProperty(arr[i])) { //it works with objects! in FF, at least
                hash[arr[i]] = true;
                result.push(arr[i]);
            }
        }
        return result;
    }

//from this stackexchange question: http://stackoverflow.com/questions/14227981/count-how-many-strings-in-an-array-have-duplicates-in-the-same-array
    function getCounts(arr) {
        var i = arr.length, // var to loop over
            obj = {}; // obj to store results
        while (i){
            obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
        } 
        return obj;
    }

// get specific from everything
    function getCount(word, arr) {
        return getCounts(arr)[word] || 0;
    }
};