import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration.js';
import type { DurationUnitsObjectType } from 'dayjs/plugin/duration.js';
import { log } from '../../logger.js';
import {
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
import type { CountableTimeInterval, ScaleLinear } from 'd3';
import common from '../common/common.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { getRequiredConfig } from '../../diagram-api/requiredConfig.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getDiagramRoot } from '../../utils/diagramRoot.js';
import { requiredGet } from '../../utils/guards.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
import type { GanttDB, Task, Weekday } from './ganttDb.js';

dayjs.extend(dayjsDuration);

/** A range of consecutive excluded days, used to draw the exclude rects. */
interface ExcludeRange {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

export const setConf = function () {
  log.debug('Something is calling, setConf, remove the call');
};

/**
 * This will map any day of the week that can be set in the `weekday` option to
 * the corresponding d3-time function that is used to calculate the ticks.
 */
const mapWeekdayToTimeFunction: Record<Weekday, CountableTimeInterval> = {
  monday: timeMonday,
  tuesday: timeTuesday,
  wednesday: timeWednesday,
  thursday: timeThursday,
  friday: timeFriday,
  saturday: timeSaturday,
  sunday: timeSunday,
};

/**
 * Maps the non-week tick interval units accepted in `tickInterval` to the
 * corresponding d3-time interval (weeks are resolved via
 * {@link mapWeekdayToTimeFunction} instead, as they depend on the configured
 * weekday).
 */
const mapIntervalToTimeFunction: Partial<Record<string, CountableTimeInterval>> = {
  millisecond: timeMillisecond,
  second: timeSecond,
  minute: timeMinute,
  hour: timeHour,
  day: timeDay,
  month: timeMonth,
};

/**
 * For this issue:
 * https://github.com/mermaid-js/mermaid/issues/1618
 *
 * Finds the number of intersections between tasks that happen at any point in time.
 * Used to figure out how many rows are needed to display the tasks when the display
 * mode is set to 'compact'.
 *
 * @param tasks - The tasks to check for intersections.
 * @param orderOffset - The number of rows occupied by earlier sections.
 */
const getMaxIntersections = (tasks: Task[], orderOffset: number) => {
  const timeline = [...tasks].map(() => -Infinity);
  const sorted = [...tasks].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime() || a.order - b.order
  );
  let maxIntersections = 0;
  for (const element of sorted) {
    for (let j = 0; j < timeline.length; j++) {
      if (element.startTime.getTime() >= timeline[j]) {
        timeline[j] = element.endTime.getTime();
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

let w: number | undefined;
const MAX_TICK_COUNT = 10000;
export const draw: DrawDefinition = function (text, id, version, diagObj) {
  const conf = getRequiredConfig('gantt');
  const db = diagObj.db as GanttDB;

  db.setDiagramId(id);

  const securityLevel = getConfig().securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  const { root, doc } = getDiagramRoot(id, securityLevel);

  const elem = doc.getElementById(id);
  if (!elem) {
    throw new Error(`Gantt diagram element with id "${id}" not found`);
  }
  w = elem.parentElement?.offsetWidth;
  w ??= 1200;

  if (conf.useWidth !== undefined) {
    w = conf.useWidth;
  }

  const taskArray = db.getTasks();

  // Filter out vertical markers to ensure they don't take up rows
  const tasksWithoutVert = taskArray.filter((task) => !task.vert);

  // Set height based on number of tasks

  let categories: string[] = [];

  for (const element of tasksWithoutVert) {
    categories.push(element.type);
  }

  categories = checkUnique(categories);
  const categoryHeights: Record<string, number> = {};

  let h = 2 * conf.topPadding;
  if (db.getDisplayMode() === 'compact' || conf.displayMode === 'compact') {
    const categoryElements: Record<string, Task[]> = {};
    for (const element of tasksWithoutVert) {
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
    h += tasksWithoutVert.length * (conf.barHeight + conf.barGap);
    for (const category of categories) {
      categoryHeights[category] = tasksWithoutVert.filter((task) => task.type === category).length;
    }
  }

  // Set viewBox
  elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  const svg = root.select<SVGSVGElement>(`[id="${id}"]`);

  // Set timescale
  // The non-null assertions match the previous runtime behavior: `min`/`max`
  // only return `undefined` for an empty task array, in which case the
  // undefined domain values were (and are) passed to d3 as-is.
  const timeScale = scaleTime()
    .domain([
      min(taskArray, function (d) {
        return d.startTime;
      })!,
      max(taskArray, function (d) {
        return d.endTime;
      })!,
    ])
    .rangeRound([0, w - conf.leftPadding - conf.rightPadding]);

  /**
   * @param a - The first task to compare.
   * @param b - The second task to compare.
   */
  function taskCompare(a: Task, b: Task) {
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

  makeGantt(taskArray, w, h);

  configureSvgSize(svg, h, w, conf.useMaxWidth);

  svg
    .append('text')
    .text(db.getDiagramTitle())
    .attr('x', w / 2)
    .attr('y', conf.titleTopMargin)
    .attr('class', 'titleText');

  /**
   * @param tasks - The tasks to draw.
   * @param pageWidth - The width of the page.
   * @param pageHeight - The height of the page.
   */
  function makeGantt(tasks: Task[], pageWidth: number, pageHeight: number) {
    const barHeight = conf.barHeight;
    const gap = barHeight + conf.barGap;
    const topPadding = conf.topPadding;
    const leftPadding = conf.leftPadding;

    const colorScale = scaleLinear<string>()
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
      db.getExcludes(),
      db.getIncludes()
    );
    makeGrid(leftPadding, topPadding, pageWidth, pageHeight);
    drawRects(tasks, gap, topPadding, leftPadding, barHeight, colorScale, pageWidth, pageHeight);
    vertLabels(gap, topPadding, leftPadding, barHeight, colorScale);
    drawToday(leftPadding, topPadding, pageWidth, pageHeight);
  }

  /**
   * @param theArray - The tasks to draw.
   * @param theGap - The gap between the task rows.
   * @param theTopPad - The top padding.
   * @param theSidePad - The side padding.
   * @param theBarHeight - The height of the task bars.
   * @param theColorScale - The color scale for the sections.
   * @param w - The width of the page.
   * @param _h - The height of the page (unused).
   */
  function drawRects(
    theArray: Task[],
    theGap: number,
    theTopPad: number,
    theSidePad: number,
    theBarHeight: number,
    theColorScale: ScaleLinear<string, string>,
    w: number,
    _h: number
  ) {
    // Sort theArray so that tasks with `vert` come last
    theArray.sort((a, b) => (a.vert === b.vert ? 0 : a.vert ? 1 : -1));
    // Filter out vertical markers from background rects so that they don't take up rows
    const tasksWithoutVert = theArray.filter((task) => !task.vert);
    // Get the first task of each unique task order. Required to draw the background rects when
    // display mode is compact.
    const firstTaskPerOrder = new Map<number, Task>();
    for (const item of tasksWithoutVert) {
      if (!firstTaskPerOrder.has(item.order)) {
        firstTaskPerOrder.set(item.order, item);
      }
    }
    const uniqueTasks = [...firstTaskPerOrder.values()];
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
      })
      .enter();

    // Draw the rects representing the tasks
    const rectangles = svg.append('g').selectAll('rect').data(theArray).enter();

    const links = db.getLinks();

    // Render the tasks with links
    // Render the other tasks
    rectangles
      .append('rect')
      .attr('id', function (d) {
        return id + '-' + d.id;
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
        if (d.vert) {
          return conf.gridLineStartPadding;
        }
        return i * theGap + theTopPad;
      })
      .attr('width', function (d) {
        if (d.milestone) {
          return theBarHeight;
        }
        if (d.vert) {
          return 0.08 * theBarHeight;
        }
        return timeScale(d.renderEndTime || d.endTime) - timeScale(d.startTime);
      })
      .attr('height', function (d) {
        if (d.vert) {
          return tasksWithoutVert.length * (conf.barHeight + conf.barGap) + conf.barHeight * 2;
        }
        return theBarHeight;
      })
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
        if (d.vert) {
          taskClass = ' vert ' + taskClass;
        }

        taskClass += secNum;

        taskClass += ' ' + classStr;

        return res + taskClass;
      });

    // Append task labels
    rectangles
      .append('text')
      .attr('id', function (d) {
        return id + '-' + d.id + '-text';
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
          endX = startX + theBarHeight;
        }

        if (d.vert) {
          return timeScale(d.startTime) + theSidePad;
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
        if (d.vert) {
          return (
            conf.gridLineStartPadding +
            tasksWithoutVert.length * (conf.barHeight + conf.barGap) +
            60
          );
        }
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

        if (d.vert) {
          taskType += ' vertText';
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

    // Wrap the tasks in a tag for working links without javascript
    if (securityLevel === 'sandbox') {
      rectangles
        .filter(function (d) {
          return links.has(d.id);
        })
        .each(function (o) {
          const taskRect = doc.querySelector('#' + CSS.escape(id + '-' + o.id));
          const taskText = doc.querySelector('#' + CSS.escape(id + '-' + o.id + '-text'));
          if (!taskRect?.parentNode || !taskText) {
            throw new Error(`Expected drawn gantt task "${o.id}" to exist in the document`);
          }
          const oldParent = taskRect.parentNode;
          const Link = doc.createElement('a');
          Link.setAttribute('xlink:href', requiredGet(links, o.id, 'gantt task link'));
          Link.setAttribute('target', '_top');
          oldParent.appendChild(Link);
          Link.appendChild(taskRect);
          Link.appendChild(taskText);
        });
    }
  }
  /**
   * @param theGap - The gap between the task rows.
   * @param theTopPad - The top padding.
   * @param theSidePad - The side padding.
   * @param w - The width of the page.
   * @param h - The height of the page.
   * @param tasks - The tasks to check for excluded days.
   * @param excludes - Dates or days to exclude.
   * @param includes - Dates to always include, even if they match the excludes.
   */
  function drawExcludeDays(
    theGap: number,
    theTopPad: number,
    theSidePad: number,
    w: number,
    h: number,
    tasks: Task[],
    excludes: string[],
    includes: string[]
  ) {
    if (excludes.length === 0 && includes.length === 0) {
      return;
    }

    let minTime: Date | undefined;
    let maxTime: Date | undefined;
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

    const dateFormat = db.getDateFormat();
    const excludeRanges: ExcludeRange[] = [];
    let range: ExcludeRange | null = null;
    let d = dayjs(minTime);
    while (d.valueOf() <= maxTime.getTime()) {
      if (db.isInvalidDate(d, dateFormat, excludes, includes)) {
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
      .attr('id', (d) => id + '-exclude-' + d.start.format('YYYY-MM-DD'))
      .attr('x', (d) => timeScale(d.start.startOf('day')) + theSidePad)
      .attr('y', conf.gridLineStartPadding)
      .attr('width', (d) => timeScale(d.end.endOf('day')) - timeScale(d.start.startOf('day')))

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
   * Calculates the estimated number of ticks based on the time domain and tick interval.
   * Returns the estimated number of ticks as a number.
   * @param minTime - The minimum time in the domain
   * @param maxTime - The maximum time in the domain
   * @param every - The interval count (e.g., 1 for "1second")
   * @param interval - The interval unit (e.g., "second", "day")
   * @returns The estimated number of ticks
   */
  function getEstimatedTickCount(minTime: Date, maxTime: Date, every: number, interval: string) {
    if (every <= 0 || minTime > maxTime) {
      return Infinity;
    }
    const timeDiffMs = maxTime.getTime() - minTime.getTime();
    const intervalMs = dayjs
      .duration({ [interval ?? 'day']: every } as DurationUnitsObjectType)
      .asMilliseconds();
    if (intervalMs <= 0) {
      return Infinity;
    }
    return Math.ceil(timeDiffMs / intervalMs);
  }

  /**
   * @param theSidePad - The side padding.
   * @param theTopPad - The top padding.
   * @param w - The width of the page.
   * @param h - The height of the page.
   */
  function makeGrid(theSidePad: number, theTopPad: number, w: number, h: number) {
    const dateFormat = db.getDateFormat();
    const userAxisFormat = db.getAxisFormat();
    let axisFormat: string;
    if (userAxisFormat) {
      axisFormat = userAxisFormat;
    } else if (dateFormat === 'D') {
      axisFormat = '%d';
    } else {
      axisFormat = conf.axisFormat ?? '%Y-%m-%d';
    }

    const bottomXAxis = axisBottom<Date>(timeScale)
      .tickSize(-h + theTopPad + conf.gridLineStartPadding)
      .tickFormat(timeFormat(axisFormat));

    const reTickInterval = /^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/;
    const resultTickInterval = reTickInterval.exec(db.getTickInterval() || conf.tickInterval);

    if (resultTickInterval !== null) {
      const every = parseInt(resultTickInterval[1], 10);
      if (isNaN(every) || every <= 0) {
        log.warn(
          `Invalid tick interval value: "${resultTickInterval[1]}". Skipping custom tick interval.`
        );
        // Skip applying custom ticks
      } else {
        const interval = resultTickInterval[2];
        const weekday = db.getWeekday() || conf.weekday;

        // Get the time domain to check tick count
        const domain = timeScale.domain();
        const minTime = domain[0];
        const maxTime = domain[1];
        const estimatedTicks = getEstimatedTickCount(minTime, maxTime, every, interval);

        if (estimatedTicks > MAX_TICK_COUNT) {
          log.warn(
            `The tick interval "${every}${interval}" would generate ${estimatedTicks} ticks, ` +
              `which exceeds the maximum allowed (${MAX_TICK_COUNT}). ` +
              `This may indicate an invalid date or time range. Skipping custom tick interval.`
          );
          // D3 will use its default automatic tick generation
        } else {
          const timeFunction =
            interval === 'week'
              ? mapWeekdayToTimeFunction[weekday]
              : mapIntervalToTimeFunction[interval];
          const tickInterval = timeFunction?.every(every);
          if (tickInterval) {
            bottomXAxis.ticks(tickInterval);
          }
        }
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

    if (db.topAxisEnabled() || conf.topAxis) {
      const topXAxis = axisTop<Date>(timeScale)
        .tickSize(-h + theTopPad + conf.gridLineStartPadding)
        .tickFormat(timeFormat(axisFormat));

      if (resultTickInterval !== null) {
        const every = parseInt(resultTickInterval[1], 10);
        if (isNaN(every) || every <= 0) {
          log.warn(
            `Invalid tick interval value: "${resultTickInterval[1]}". Skipping custom tick interval.`
          );
          // Skip applying custom ticks
        } else {
          const interval = resultTickInterval[2];
          const weekday = db.getWeekday() || conf.weekday;

          // Get the time domain to check tick count
          const domain = timeScale.domain();
          const minTime = domain[0];
          const maxTime = domain[1];
          const estimatedTicks = getEstimatedTickCount(minTime, maxTime, every, interval);

          // Only apply custom ticks if the count is reasonable
          if (estimatedTicks <= MAX_TICK_COUNT) {
            const timeFunction =
              interval === 'week'
                ? mapWeekdayToTimeFunction[weekday]
                : mapIntervalToTimeFunction[interval];
            const tickInterval = timeFunction?.every(every);
            if (tickInterval) {
              topXAxis.ticks(tickInterval);
            }
          }
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
   * @param theGap - The gap between the task rows.
   * @param theTopPad - The top padding.
   * @param _theSidePad - The side padding (unused).
   * @param _theBarHeight - The height of the task bars (unused).
   * @param _theColorScale - The color scale for the sections (unused).
   */
  function vertLabels(
    theGap: number,
    theTopPad: number,
    _theSidePad: number,
    _theBarHeight: number,
    _theColorScale: ScaleLinear<string, string>
  ) {
    let prevGap = 0;

    const numOccurrences = Object.keys(categoryHeights).map((d): [string, number] => [
      d,
      categoryHeights[d],
    ]);

    svg
      .append('g') // without doing this, impossible to put grid lines behind text
      .selectAll('text')
      .data(numOccurrences)
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
        // The original code looped `for (let j = 0; j < i; j++)` here, but always
        // returned on the first iteration, so it was equivalent to this `if`.
        if (i > 0) {
          prevGap += numOccurrences[i - 1][1];
          return (d[1] * theGap) / 2 + prevGap * theGap + theTopPad;
        }
        return (d[1] * theGap) / 2 + theTopPad;
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
   * @param theSidePad - The side padding.
   * @param theTopPad - The top padding.
   * @param w - The width of the page.
   * @param h - The height of the page.
   */
  function drawToday(theSidePad: number, theTopPad: number, w: number, h: number) {
    const todayMarker = db.getTodayMarker();
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
   * @param arr - The array to remove duplicates from.
   */
  function checkUnique(arr: string[]) {
    const hash: Record<string, boolean> = {};
    const result: string[] = [];
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
