import dayjs from 'dayjs';
import { log } from '../../logger.js';
import {
  select,
  scaleTime,
  min,
  max,
  scaleLinear,
  interpolateHcl,
  axisBottom,
  axisTop,
  timeFormat,
  timeMillisecond,
  timeSecond,
  timeMinute,
  timeHour,
  timeDay,
  timeMonday,
  timeTuesday,
  timeWednesday,
  timeThursday,
  timeFriday,
  timeSaturday,
  timeSunday,
  timeMonth,
} from 'd3';
import common from '../common/common.js';
import { getConfig } from '../../config.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';

export const setConf = function () {
  log.debug('Something is calling, setConf, remove the call');
};

/**
 * This will map any day of the week that can be set in the `weekday` option to
 * the corresponding d3-time function that is used to calculate the ticks.
 */
const mapWeekdayToTimeFunction = {
  monday: timeMonday,
  tuesday: timeTuesday,
  wednesday: timeWednesday,
  thursday: timeThursday,
  friday: timeFriday,
  saturday: timeSaturday,
  sunday: timeSunday,
};

/**
 * For this issue:
 * https://github.com/mermaid-js/mermaid/issues/1618
 *
 * Finds the number of intersections between tasks that happen at any point in time.
 * Used to figure out how many rows are needed to display the tasks when the display
 * mode is set to 'compact'.
 *
 * @param tasks
 * @param orderOffset
 */
const getMaxIntersections = (tasks, orderOffset) => {
  let timeline = [...tasks].map(() => -Infinity);
  let sorted = [...tasks].sort((a, b) => a.startTime - b.startTime || a.order - b.order);
  let maxIntersections = 0;
  for (const element of sorted) {
    for (let j = 0; j < timeline.length; j++) {
      if (element.startTime >= timeline[j]) {
        timeline[j] = element.endTime;
        element.order = j + orderOffset;
        if (j > maxIntersections) {
          maxIntersections = j;
        }
        break;
      }
    }
  }

  return maxIntersections;
};

let w;
export const draw = function (text, id, version, diagObj) {
  const conf = getConfig().gantt;

  const securityLevel = getConfig().securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  const elem = doc.getElementById(id);
  w = elem.parentElement.offsetWidth;

  if (w === undefined) {
    w = 1200;
  }

  if (conf.useWidth !== undefined) {
    w = conf.useWidth;
  }

  const taskArray = diagObj.db.getTasks();

  // Set height based on number of tasks

  let categories = [];

  for (const element of taskArray) {
    categories.push(element.type);
  }

  categories = checkUnique(categories);
  const categoryHeights = {};

  let h = 2 * conf.topPadding;
  if (diagObj.db.getDisplayMode() === 'compact' || conf.displayMode === 'compact') {
    const categoryElements = {};
    for (const element of taskArray) {
      if (categoryElements[element.section] === undefined) {
        categoryElements[element.section] = [element];
      } else {
        categoryElements[element.section].push(element);
      }
    }

    let intersections = 0;
    for (const category of Object.keys(categoryElements)) {
      const categoryHeight = getMaxIntersections(categoryElements[category], intersections) + 1;
      intersections += categoryHeight;
      h += categoryHeight * (conf.barHeight + conf.barGap);
      categoryHeights[category] = categoryHeight;
    }
  } else {
    h += taskArray.length * (conf.barHeight + conf.barGap);
    for (const category of categories) {
      categoryHeights[category] = taskArray.filter((task) => task.type === category).length;
    }
  }

  // Set viewBox
  elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  const svg = root.select(`[id="${id}"]`);

  // Set timescale
  const timeScale = scaleTime()
    .domain([
      min(taskArray, function (d) {
        return d.startTime;
      }),
      max(taskArray, function (d) {
        return d.endTime;
      }),
    ])
    .rangeRound([0, w - conf.leftPadding - conf.rightPadding]);

  /**
   * @param a
   * @param b
   */
  function taskCompare(a, b) {
    const taskA = a.startTime;
    const taskB = b.startTime;
    let result = 0;
    if (taskA > taskB) {
      result = 1;
    } else if (taskA < taskB) {
      result = -1;
    }
    return result;
  }

  // Sort the task array using the above taskCompare() so that
  // tasks are created based on their order of startTime
  taskArray.sort(taskCompare);

  makeGant(taskArray, w, h);

  configureSvgSize(svg, h, w, conf.useMaxWidth);

  svg
    .append('text')
    .text(diagObj.db.getDiagramTitle())
    .attr('x', w / 2)
    .attr('y', conf.titleTopMargin)
    .attr('class', 'titleText');

  /**
   * @param tasks
   * @param pageWidth
   * @param pageHeight
   */
  function makeGant(tasks, pageWidth, pageHeight) {
    const barHeight = conf.barHeight;
    const gap = barHeight + conf.barGap;
    const topPadding = conf.topPadding;
    const leftPadding = conf.leftPadding;

    const colorScale = scaleLinear()
      .domain([0, categories.length])
      .range(['#00B9FA', '#F95002'])
      .interpolate(interpolateHcl);

    drawExcludeDays(
      gap,
      topPadding,
      leftPadding,
      pageWidth,
      pageHeight,
      tasks,
      diagObj.db.getExcludes(),
      diagObj.db.getIncludes()
    );
    makeGrid(leftPadding, topPadding, pageWidth, pageHeight);
    drawRects(tasks, gap, topPadding, leftPadding, barHeight, colorScale, pageWidth, pageHeight);
    vertLabels(gap, topPadding, leftPadding, barHeight, colorScale);
    drawToday(leftPadding, topPadding, pageWidth, pageHeight);
  }

  /**
   * @param theArray
   * @param theGap
   * @param theTopPad
   * @param theSidePad
   * @param theBarHeight
   * @param theColorScale
   * @param w
   */
  function drawRects(theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w) {
    // Get unique task orders. Required to draw the background rects when display mode is compact.
    const uniqueTaskOrderIds = [...new Set(theArray.map((item) => item.order))];
    const uniqueTasks = uniqueTaskOrderIds.map((id) => theArray.find((item) => item.order === id));

    // Draw background rects covering the entire width of the graph, these form the section rows.
    svg
      .append('g')
      .selectAll('rect')
      .data(uniqueTasks)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', function (d, i) {
        // Ignore the incoming i value and use our order instead
        i = d.order;
        return i * theGap + theTopPad - 2;
      })
      .attr('width', function () {
        return w - conf.rightPadding / 2;
      })
      .attr('height', theGap)
      .attr('class', function (d) {
        for (const [i, category] of categories.entries()) {
          if (d.type === category) {
            return 'section section' + (i % conf.numberSectionStyles);
          }
        }
        return 'section section0';
      });

    // Draw the rects representing the tasks
    const rectangles = svg.append('g').selectAll('rect').data(theArray).enter();

    const links = diagObj.db.getLinks();

    // Render the tasks with links
    // Render the other tasks
    rectangles
      .append('rect')
      .attr('id', function (d) {
        return d.id;
      })
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('x', function (d) {
        if (d.milestone) {
          return (
            timeScale(d.startTime) +
            theSidePad +
            0.5 * (timeScale(d.endTime) - timeScale(d.startTime)) -
            0.5 * theBarHeight
          );
        }
        return timeScale(d.startTime) + theSidePad;
      })
      .attr('y', function (d, i) {
        // Ignore the incoming i value and use our order instead
        i = d.order;
        return i * theGap + theTopPad;
      })
      .attr('width', function (d) {
        if (d.milestone) {
          return theBarHeight;
        }
        return timeScale(d.renderEndTime || d.endTime) - timeScale(d.startTime);
      })
      .attr('height', theBarHeight)
      .attr('transform-origin', function (d, i) {
        // Ignore the incoming i value and use our order instead
        i = d.order;

        return (
          (
            timeScale(d.startTime) +
            theSidePad +
            0.5 * (timeScale(d.endTime) - timeScale(d.startTime))
          ).toString() +
          'px ' +
          (i * theGap + theTopPad + 0.5 * theBarHeight).toString() +
          'px'
        );
      })
      .attr('class', function (d) {
        const res = 'task';

        let classStr = '';
        if (d.classes.length > 0) {
          classStr = d.classes.join(' ');
        }

        let secNum = 0;
        for (const [i, category] of categories.entries()) {
          if (d.type === category) {
            secNum = i % conf.numberSectionStyles;
          }
        }

        let taskClass = '';
        if (d.active) {
          if (d.crit) {
            taskClass += ' activeCrit';
          } else {
            taskClass = ' active';
          }
        } else if (d.done) {
          if (d.crit) {
            taskClass = ' doneCrit';
          } else {
            taskClass = ' done';
          }
        } else {
          if (d.crit) {
            taskClass += ' crit';
          }
        }

        if (taskClass.length === 0) {
          taskClass = ' task';
        }

        if (d.milestone) {
          taskClass = ' milestone ' + taskClass;
        }

        taskClass += secNum;

        taskClass += ' ' + classStr;

        return res + taskClass;
      });

    // Append task labels
    rectangles
      .append('text')
      .attr('id', function (d) {
        return d.id + '-text';
      })
      .text(function (d) {
        return d.task;
      })
      .attr('font-size', conf.fontSize)
      .attr('x', function (d) {
        let startX = timeScale(d.startTime);
        let endX = timeScale(d.renderEndTime || d.endTime);
        if (d.milestone) {
          startX += 0.5 * (timeScale(d.endTime) - timeScale(d.startTime)) - 0.5 * theBarHeight;
        }
        if (d.milestone) {
          endX = startX + theBarHeight;
        }
        const textWidth = this.getBBox().width;

        // Check id text width > width of rectangle
        if (textWidth > endX - startX) {
          if (endX + textWidth + 1.5 * conf.leftPadding > w) {
            return startX + theSidePad - 5;
          } else {
            return endX + theSidePad + 5;
          }
        } else {
          return (endX - startX) / 2 + startX + theSidePad;
        }
      })
      .attr('y', function (d, i) {
        // Ignore the incoming i value and use our order instead
        i = d.order;
        return i * theGap + conf.barHeight / 2 + (conf.fontSize / 2 - 2) + theTopPad;
      })
      .attr('text-height', theBarHeight)
      .attr('class', function (d) {
        const startX = timeScale(d.startTime);
        let endX = timeScale(d.endTime);
        if (d.milestone) {
          endX = startX + theBarHeight;
        }
        const textWidth = this.getBBox().width;

        let classStr = '';
        if (d.classes.length > 0) {
          classStr = d.classes.join(' ');
        }

        let secNum = 0;
        for (const [i, category] of categories.entries()) {
          if (d.type === category) {
            secNum = i % conf.numberSectionStyles;
          }
        }

        let taskType = '';
        if (d.active) {
          if (d.crit) {
            taskType = 'activeCritText' + secNum;
          } else {
            taskType = 'activeText' + secNum;
          }
        }

        if (d.done) {
          if (d.crit) {
            taskType = taskType + ' doneCritText' + secNum;
          } else {
            taskType = taskType + ' doneText' + secNum;
          }
        } else {
          if (d.crit) {
            taskType = taskType + ' critText' + secNum;
          }
        }

        if (d.milestone) {
          taskType += ' milestoneText';
        }

        // Check id text width > width of rectangle
        if (textWidth > endX - startX) {
          if (endX + textWidth + 1.5 * conf.leftPadding > w) {
            return classStr + ' taskTextOutsideLeft taskTextOutside' + secNum + ' ' + taskType;
          } else {
            return (
              classStr +
              ' taskTextOutsideRight taskTextOutside' +
              secNum +
              ' ' +
              taskType +
              ' width-' +
              textWidth
            );
          }
        } else {
          return classStr + ' taskText taskText' + secNum + ' ' + taskType + ' width-' + textWidth;
        }
      });

    const securityLevel = getConfig().securityLevel;

    // Wrap the tasks in an a tag for working links without javascript
    if (securityLevel === 'sandbox') {
      let sandboxElement;
      sandboxElement = select('#i' + id);
      const doc = sandboxElement.nodes()[0].contentDocument;

      rectangles
        .filter(function (d) {
          return links[d.id] !== undefined;
        })
        .each(function (o) {
          var taskRect = doc.querySelector('#' + o.id);
          var taskText = doc.querySelector('#' + o.id + '-text');
          const oldParent = taskRect.parentNode;
          var Link = doc.createElement('a');
          Link.setAttribute('xlink:href', links[o.id]);
          Link.setAttribute('target', '_top');
          oldParent.appendChild(Link);
          Link.appendChild(taskRect);
          Link.appendChild(taskText);
        });
    }
  }
  /**
   * @param theGap
   * @param theTopPad
   * @param theSidePad
   * @param w
   * @param h
   * @param tasks
   * @param {unknown[]} excludes
   * @param {unknown[]} includes
   */
  function drawExcludeDays(theGap, theTopPad, theSidePad, w, h, tasks, excludes, includes) {
    if (excludes.length === 0 && includes.length === 0) {
      return;
    }

    let minTime;
    let maxTime;
    for (const { startTime, endTime } of tasks) {
      if (minTime === undefined || startTime < minTime) {
        minTime = startTime;
      }
      if (maxTime === undefined || endTime > maxTime) {
        maxTime = endTime;
      }
    }

    if (!minTime || !maxTime) {
      return;
    }

    if (dayjs(maxTime).diff(dayjs(minTime), 'year') > 5) {
      log.warn(
        'The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.'
      );
      return;
    }

    const dateFormat = diagObj.db.getDateFormat();
    const excludeRanges = [];
    let range = null;
    let d = dayjs(minTime);
    while (d.valueOf() <= maxTime) {
      if (diagObj.db.isInvalidDate(d, dateFormat, excludes, includes)) {
        if (!range) {
          range = {
            start: d,
            end: d,
          };
        } else {
          range.end = d;
        }
      } else {
        if (range) {
          excludeRanges.push(range);
          range = null;
        }
      }
      d = d.add(1, 'd');
    }

    const rectangles = svg.append('g').selectAll('rect').data(excludeRanges).enter();

    rectangles
      .append('rect')
      .attr('id', function (d) {
        return 'exclude-' + d.start.format('YYYY-MM-DD');
      })
      .attr('x', function (d) {
        return timeScale(d.start) + theSidePad;
      })
      .attr('y', conf.gridLineStartPadding)
      .attr('width', function (d) {
        const renderEnd = d.end.add(1, 'day');
        return timeScale(renderEnd) - timeScale(d.start);
      })
      .attr('height', h - theTopPad - conf.gridLineStartPadding)
      .attr('transform-origin', function (d, i) {
        return (
          (
            timeScale(d.start) +
            theSidePad +
            0.5 * (timeScale(d.end) - timeScale(d.start))
          ).toString() +
          'px ' +
          (i * theGap + 0.5 * h).toString() +
          'px'
        );
      })
      .attr('class', 'exclude-range');
  }

  /**
   * @param theSidePad
   * @param theTopPad
   * @param w
   * @param h
   */
  function makeGrid(theSidePad, theTopPad, w, h) {
    let bottomXAxis = axisBottom(timeScale)
      .tickSize(-h + theTopPad + conf.gridLineStartPadding)
      .tickFormat(timeFormat(diagObj.db.getAxisFormat() || conf.axisFormat || '%Y-%m-%d'));

    const reTickInterval = /^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/;
    const resultTickInterval = reTickInterval.exec(
      diagObj.db.getTickInterval() || conf.tickInterval
    );

    if (resultTickInterval !== null) {
      const every = resultTickInterval[1];
      const interval = resultTickInterval[2];
      const weekday = diagObj.db.getWeekday() || conf.weekday;

      switch (interval) {
        case 'millisecond':
          bottomXAxis.ticks(timeMillisecond.every(every));
          break;
        case 'second':
          bottomXAxis.ticks(timeSecond.every(every));
          break;
        case 'minute':
          bottomXAxis.ticks(timeMinute.every(every));
          break;
        case 'hour':
          bottomXAxis.ticks(timeHour.every(every));
          break;
        case 'day':
          bottomXAxis.ticks(timeDay.every(every));
          break;
        case 'week':
          bottomXAxis.ticks(mapWeekdayToTimeFunction[weekday].every(every));
          break;
        case 'month':
          bottomXAxis.ticks(timeMonth.every(every));
          break;
      }
    }

    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')')
      .call(bottomXAxis)
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('fill', '#000')
      .attr('stroke', 'none')
      .attr('font-size', 10)
      .attr('dy', '1em');

    if (diagObj.db.topAxisEnabled() || conf.topAxis) {
      let topXAxis = axisTop(timeScale)
        .tickSize(-h + theTopPad + conf.gridLineStartPadding)
        .tickFormat(timeFormat(diagObj.db.getAxisFormat() || conf.axisFormat || '%Y-%m-%d'));

      if (resultTickInterval !== null) {
        const every = resultTickInterval[1];
        const interval = resultTickInterval[2];
        const weekday = diagObj.db.getWeekday() || conf.weekday;

        switch (interval) {
          case 'millisecond':
            topXAxis.ticks(timeMillisecond.every(every));
            break;
          case 'second':
            topXAxis.ticks(timeSecond.every(every));
            break;
          case 'minute':
            topXAxis.ticks(timeMinute.every(every));
            break;
          case 'hour':
            topXAxis.ticks(timeHour.every(every));
            break;
          case 'day':
            topXAxis.ticks(timeDay.every(every));
            break;
          case 'week':
            topXAxis.ticks(mapWeekdayToTimeFunction[weekday].every(every));
            break;
          case 'month':
            topXAxis.ticks(timeMonth.every(every));
            break;
        }
      }

      svg
        .append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(' + theSidePad + ', ' + theTopPad + ')')
        .call(topXAxis)
        .selectAll('text')
        .style('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('stroke', 'none')
        .attr('font-size', 10);
      // .attr('dy', '1em');
    }
  }

  /**
   * @param theGap
   * @param theTopPad
   */
  function vertLabels(theGap, theTopPad) {
    let prevGap = 0;

    const numOccurances = Object.keys(categoryHeights).map((d) => [d, categoryHeights[d]]);

    svg
      .append('g') // without doing this, impossible to put grid lines behind text
      .selectAll('text')
      .data(numOccurances)
      .enter()
      .append(function (d) {
        const rows = d[0].split(common.lineBreakRegex);
        const dy = -(rows.length - 1) / 2;

        const svgLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgLabel.setAttribute('dy', dy + 'em');

        for (const [j, row] of rows.entries()) {
          const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('alignment-baseline', 'central');
          tspan.setAttribute('x', '10');
          if (j > 0) {
            tspan.setAttribute('dy', '1em');
          }
          tspan.textContent = row;
          svgLabel.appendChild(tspan);
        }
        return svgLabel;
      })
      .attr('x', 10)
      .attr('y', function (d, i) {
        if (i > 0) {
          for (let j = 0; j < i; j++) {
            prevGap += numOccurances[i - 1][1];
            return (d[1] * theGap) / 2 + prevGap * theGap + theTopPad;
          }
        } else {
          return (d[1] * theGap) / 2 + theTopPad;
        }
      })
      .attr('font-size', conf.sectionFontSize)
      .attr('class', function (d) {
        for (const [i, category] of categories.entries()) {
          if (d[0] === category) {
            return 'sectionTitle sectionTitle' + (i % conf.numberSectionStyles);
          }
        }
        return 'sectionTitle';
      });
  }

  /**
   * @param theSidePad
   * @param theTopPad
   * @param w
   * @param h
   */
  function drawToday(theSidePad, theTopPad, w, h) {
    const todayMarker = diagObj.db.getTodayMarker();
    if (todayMarker === 'off') {
      return;
    }

    const todayG = svg.append('g').attr('class', 'today');
    const today = new Date();
    const todayLine = todayG.append('line');

    todayLine
      .attr('x1', timeScale(today) + theSidePad)
      .attr('x2', timeScale(today) + theSidePad)
      .attr('y1', conf.titleTopMargin)
      .attr('y2', h - conf.titleTopMargin)
      .attr('class', 'today');

    if (todayMarker !== '') {
      todayLine.attr('style', todayMarker.replace(/,/g, ';'));
    }
  }

  /**
   * From this stack exchange question:
   * http://stackoverflow.com/questions/1890203/unique-for-arrays-in-javascript
   *
   * @param arr
   */
  function checkUnique(arr) {
    const hash = {};
    const result = [];
    for (let i = 0, l = arr.length; i < l; ++i) {
      if (!Object.prototype.hasOwnProperty.call(hash, arr[i])) {
        // it works with objects! in FF, at least
        hash[arr[i]] = true;
        result.push(arr[i]);
      }
    }
    return result;
  }
};

export default {
  setConf,
  draw,
};
