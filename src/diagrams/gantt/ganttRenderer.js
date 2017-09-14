
import moment from 'moment'

import { parser } from './parser/gantt'
import ganttDb from './ganttDb'
import d3 from '../../d3'

parser.yy = ganttDb

let daysInChart
const conf = {
  titleTopMargin: 25,
  barHeight: 20,
  barGap: 4,
  topPadding: 50,
  rightPadding: 75,
  leftPadding: 75,
  gridLineStartPadding: 35,
  fontSize: 11,
  fontFamily: '"Open-Sans", "sans-serif"'
}
export const setConf = function (cnf) {
  const keys = Object.keys(cnf)

  keys.forEach(function (key) {
    conf[key] = cnf[key]
  })
}
let w
export const draw = function (text, id) {
  parser.yy.clear()
  parser.parse(text)

  const elem = document.getElementById(id)
  w = elem.parentElement.offsetWidth

  if (typeof w === 'undefined') {
    w = 1200
  }

  if (typeof conf.useWidth !== 'undefined') {
    w = conf.useWidth
  }

  const taskArray = parser.yy.getTasks()

  // Set height based on number of tasks
  const h = taskArray.length * (conf.barHeight + conf.barGap) + 2 * conf.topPadding

  elem.setAttribute('height', '100%')
  // Set viewBox
  elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h)
  const svg = d3.select('#' + id)

  const startDate = d3.min(taskArray, function (d) {
    return d.startTime
  })
  const endDate = d3.max(taskArray, function (d) {
    return d.endTime
  })

  // Set timescale
  const timeScale = d3.time.scale()
    .domain([d3.min(taskArray, function (d) {
      return d.startTime
    }),
      d3.max(taskArray, function (d) {
        return d.endTime
      })])
    .rangeRound([0, w - conf.leftPadding - conf.rightPadding])

  let categories = []

  daysInChart = moment.duration(endDate - startDate).asDays()

  for (let i = 0; i < taskArray.length; i++) {
    categories.push(taskArray[i].type)
  }

  const catsUnfiltered = categories // for vert labels

  categories = checkUnique(categories)

  makeGant(taskArray, w, h)
  if (typeof conf.useWidth !== 'undefined') {
    elem.setAttribute('width', w)
  }

  svg.append('text')
    .text(parser.yy.getTitle())
    .attr('x', w / 2)
    .attr('y', conf.titleTopMargin)
    .attr('class', 'titleText')

  function makeGant (tasks, pageWidth, pageHeight) {
    const barHeight = conf.barHeight
    const gap = barHeight + conf.barGap
    const topPadding = conf.topPadding
    const leftPadding = conf.leftPadding

    const colorScale = d3.scale.linear()
      .domain([0, categories.length])
      .range(['#00B9FA', '#F95002'])
      .interpolate(d3.interpolateHcl)

    makeGrid(leftPadding, topPadding, pageWidth, pageHeight)
    drawRects(tasks, gap, topPadding, leftPadding, barHeight, colorScale, pageWidth, pageHeight)
    vertLabels(gap, topPadding, leftPadding, barHeight, colorScale)
    drawToday(leftPadding, topPadding, pageWidth, pageHeight)
  }

  function drawRects (theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w, h) {
    svg.append('g')
      .selectAll('rect')
      .data(theArray)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', function (d, i) {
        return i * theGap + theTopPad - 2
      })
      .attr('width', function () {
        return w - conf.rightPadding / 2
      })
      .attr('height', theGap)
      .attr('class', function (d) {
        for (let i = 0; i < categories.length; i++) {
          if (d.type === categories[i]) {
            return 'section section' + (i % conf.numberSectionStyles)
          }
        }
        return 'section section0'
      })

    const rectangles = svg.append('g')
      .selectAll('rect')
      .data(theArray)
      .enter()

    rectangles.append('rect')
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('x', function (d) {
        return timeScale(d.startTime) + theSidePad
      })
      .attr('y', function (d, i) {
        return i * theGap + theTopPad
      })
      .attr('width', function (d) {
        return (timeScale(d.endTime) - timeScale(d.startTime))
      })
      .attr('height', theBarHeight)
      .attr('class', function (d) {
        const res = 'task '

        let secNum = 0
        for (let i = 0; i < categories.length; i++) {
          if (d.type === categories[i]) {
            secNum = (i % conf.numberSectionStyles)
          }
        }

        if (d.active) {
          if (d.crit) {
            return res + ' activeCrit' + secNum
          } else {
            return res + ' active' + secNum
          }
        }

        if (d.done) {
          if (d.crit) {
            return res + ' doneCrit' + secNum
          } else {
            return res + ' done' + secNum
          }
        }

        if (d.crit) {
          return res + ' crit' + secNum
        }

        return res + ' task' + secNum
      })

    rectangles.append('text')
      .text(function (d) {
        return d.task
      })
      .attr('font-size', conf.fontSize)
      .attr('x', function (d) {
        const startX = timeScale(d.startTime)
        const endX = timeScale(d.endTime)
        const textWidth = this.getBBox().width

        // Check id text width > width of rectangle
        if (textWidth > (endX - startX)) {
          if (endX + textWidth + 1.5 * conf.leftPadding > w) {
            return startX + theSidePad - 5
          } else {
            return endX + theSidePad + 5
          }
        } else {
          return (endX - startX) / 2 + startX + theSidePad
        }
      })
      .attr('y', function (d, i) {
        return i * theGap + (conf.barHeight / 2) + (conf.fontSize / 2 - 2) + theTopPad
      })
      .attr('text-height', theBarHeight)
      .attr('class', function (d) {
        const startX = timeScale(d.startTime)
        const endX = timeScale(d.endTime)
        const textWidth = this.getBBox().width
        let secNum = 0
        for (let i = 0; i < categories.length; i++) {
          if (d.type === categories[i]) {
            secNum = (i % conf.numberSectionStyles)
          }
        }

        let taskType = ''
        if (d.active) {
          if (d.crit) {
            taskType = 'activeCritText' + secNum
          } else {
            taskType = 'activeText' + secNum
          }
        }

        if (d.done) {
          if (d.crit) {
            taskType = taskType + ' doneCritText' + secNum
          } else {
            taskType = taskType + ' doneText' + secNum
          }
        } else {
          if (d.crit) {
            taskType = taskType + ' critText' + secNum
          }
        }

        // Check id text width > width of rectangle
        if (textWidth > (endX - startX)) {
          if (endX + textWidth + 1.5 * conf.leftPadding > w) {
            return 'taskTextOutsideLeft taskTextOutside' + secNum + ' ' + taskType
          } else {
            return 'taskTextOutsideRight taskTextOutside' + secNum + ' ' + taskType
          }
        } else {
          return 'taskText taskText' + secNum + ' ' + taskType
        }
      })
  }

  function makeGrid (theSidePad, theTopPad, w, h) {
    const pre = [
      ['.%L', function (d) {
        return d.getMilliseconds()
      }],
      [':%S', function (d) {
        return d.getSeconds()
      }],
      // Within a hour
      ['h1 %I:%M', function (d) {
        return d.getMinutes()
      }]]
    const post = [
      ['%Y', function () {
        return true
      }]]

    let mid = [
      // Within a day
      ['%I:%M', function (d) {
        return d.getHours()
      }],
      // Day within a week (not monday)
      ['%a %d', function (d) {
        return d.getDay() && d.getDate() !== 1
      }],
      // within a month
      ['%b %d', function (d) {
        return d.getDate() !== 1
      }],
      // Month
      ['%B', function (d) {
        return d.getMonth()
      }]
    ]
    let formatter
    if (typeof conf.axisFormatter !== 'undefined') {
      mid = []
      conf.axisFormatter.forEach(function (item) {
        const n = []
        n[0] = item[0]
        n[1] = item[1]
        mid.push(n)
      })
    }
    formatter = pre.concat(mid).concat(post)

    let xAxis = d3.svg.axis()
      .scale(timeScale)
      .orient('bottom')
      .tickSize(-h + theTopPad + conf.gridLineStartPadding, 0, 0)
      .tickFormat(d3.time.format.multi(formatter))

    if (daysInChart > 7 && daysInChart < 230) {
      xAxis = xAxis.ticks(d3.time.monday.range)
    }

    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')')
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('fill', '#000')
      .attr('stroke', 'none')
      .attr('font-size', 10)
      .attr('dy', '1em')
  }

  function vertLabels (theGap, theTopPad) {
    const numOccurances = []
    let prevGap = 0

    for (let i = 0; i < categories.length; i++) {
      numOccurances[i] = [categories[i], getCount(categories[i], catsUnfiltered)]
    }

    svg.append('g') // without doing this, impossible to put grid lines behind text
      .selectAll('text')
      .data(numOccurances)
      .enter()
      .append('text')
      .text(function (d) {
        return d[0]
      })
      .attr('x', 10)
      .attr('y', function (d, i) {
        if (i > 0) {
          for (let j = 0; j < i; j++) {
            prevGap += numOccurances[i - 1][1]
            return d[1] * theGap / 2 + prevGap * theGap + theTopPad
          }
        } else {
          return d[1] * theGap / 2 + theTopPad
        }
      })
      .attr('class', function (d) {
        for (let i = 0; i < categories.length; i++) {
          if (d[0] === categories[i]) {
            return 'sectionTitle sectionTitle' + (i % conf.numberSectionStyles)
          }
        }
        return 'sectionTitle'
      })
  }

  function drawToday (theSidePad, theTopPad, w, h) {
    const todayG = svg.append('g')
      .attr('class', 'today')

    const today = new Date()

    todayG.append('line')
      .attr('x1', timeScale(today) + theSidePad)
      .attr('x2', timeScale(today) + theSidePad)
      .attr('y1', conf.titleTopMargin)
      .attr('y2', h - conf.titleTopMargin)
      .attr('class', 'today')
  }

  // from this stackexchange question: http://stackoverflow.com/questions/1890203/unique-for-arrays-in-javascript
  function checkUnique (arr) {
    const hash = {}
    const result = []
    for (let i = 0, l = arr.length; i < l; ++i) {
      if (!hash.hasOwnProperty(arr[i])) { // it works with objects! in FF, at least
        hash[arr[i]] = true
        result.push(arr[i])
      }
    }
    return result
  }

  // from this stackexchange question: http://stackoverflow.com/questions/14227981/count-how-many-strings-in-an-array-have-duplicates-in-the-same-array
  function getCounts (arr) {
    let i = arr.length // const to loop over
    const obj = {} // obj to store results
    while (i) {
      obj[arr[--i]] = (obj[arr[i]] || 0) + 1 // count occurrences
    }
    return obj
  }

  // get specific from everything
  function getCount (word, arr) {
    return getCounts(arr)[word] || 0
  }
}

export default {
  setConf,
  draw
}
