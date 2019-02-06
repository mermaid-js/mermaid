import moment from 'moment'
import { logger } from '../../logger'

let dateFormat = ''
let axisFormat = ''
let excludes = []
let title = ''
let sections = []
let tasks = []
let currentSection = ''

export const clear = function () {
  sections = []
  tasks = []
  currentSection = ''
  title = ''
  taskCnt = 0
  lastTask = undefined
  lastTaskID = undefined
  rawTasks = []
}

export const setAxisFormat = function (txt) {
  axisFormat = txt
}

export const getAxisFormat = function () {
  return axisFormat
}

export const setDateFormat = function (txt) {
  dateFormat = txt
}

export const setExcludes = function (txt) {
  excludes = txt.split(' ')
}

export const setTitle = function (txt) {
  title = txt
}

export const getTitle = function () {
  return title
}

export const addSection = function (txt) {
  currentSection = txt
  sections.push(txt)
}

export const getTasks = function () {
  let allItemsPricessed = compileTasks()
  const maxDepth = 10
  let iterationCount = 0
  while (!allItemsPricessed && (iterationCount < maxDepth)) {
    allItemsPricessed = compileTasks()
    iterationCount++
  }

  tasks = rawTasks

  return tasks
}

const getNextValidDate = function (date, dateFormat, excludes) {
  const excludeWeekends = excludes.indexOf('weekend') >= 0 || excludes.indexOf('weekends') >= 0
  const trimmedDateFormat = dateFormat.trim()
  let mDate = moment.isMoment(date) ? date : (moment.isDate(date) ? moment(date) : moment(date, dateFormat, true))

  const isInvalidDate = function (d) {
    return (excludeWeekends && d.isoWeekday() >= 6) || (excludes.indexOf(d.format(trimmedDateFormat)) >= 0)
  }

  while (isInvalidDate(mDate)) {
    mDate = mDate.add(1, 'd')
  }

  return mDate.toDate()
}

const getStartDate = function (prevTime, dateFormat, excludes, str) {
  str = str.trim()

  // Test for after
  const re = /^after\s+([\d\w-]+)/
  const afterStatement = re.exec(str.trim())

  if (afterStatement !== null) {
    const task = findTaskById(afterStatement[1])

    if (typeof task === 'undefined') {
      const dt = new Date()
      dt.setHours(0, 0, 0, 0)
      // return getNextValidDate(dt, dateFormat, excludes)
      return dt
    }
    // return getNextValidDate(task.endTime, dateFormat, excludes)
    return task.endTime
  }

  // Check for actual date set
  let mDate = moment(str, dateFormat.trim(), true)
  if (mDate.isValid()) {
    return getNextValidDate(mDate, dateFormat, excludes)
  } else {
    logger.debug('Invalid date:' + str)
    logger.debug('With date format:' + dateFormat.trim())
  }

  // Default date - now
  return getNextValidDate(new Date(), dateFormat, excludes)
}

const getEndDate = function (prevTime, dateFormat, excludes, str) {
  str = str.trim()

  // Check for actual date
  let mDate = moment(str, dateFormat.trim(), true)
  if (mDate.isValid()) {
    // return getNextValidDate(mDate, dateFormat, excludes)
    return mDate.toDate()
  }

  const d = moment(prevTime)
  // Check for length
  const re = /^([\d]+)([wdhms])/
  const durationStatement = re.exec(str.trim())

  if (durationStatement !== null) {
    switch (durationStatement[2]) {
      case 's':
        d.add(durationStatement[1], 'seconds')
        break
      case 'm':
        d.add(durationStatement[1], 'minutes')
        break
      case 'h':
        d.add(durationStatement[1], 'hours')
        break
      case 'd':
        d.add(durationStatement[1], 'days')
        break
      case 'w':
        d.add(durationStatement[1], 'weeks')
        break
    }
  }
  // Default date - now
  return getNextValidDate(d, dateFormat, excludes)
}

let taskCnt = 0
const parseId = function (idStr) {
  if (typeof idStr === 'undefined') {
    taskCnt = taskCnt + 1
    return 'task' + taskCnt
  }
  return idStr
}
// id, startDate, endDate
// id, startDate, length
// id, after x, endDate
// id, after x, length
// startDate, endDate
// startDate, length
// after x, endDate
// after x, length
// endDate
// length

const compileData = function (prevTask, dataStr) {
  let ds

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length)
  } else {
    ds = dataStr
  }

  const data = ds.split(',')

  const task = {}

  // Get tags like active, done cand crit
  let matchFound = true
  while (matchFound) {
    matchFound = false
    if (data[0].match(/^\s*active\s*$/)) {
      task.active = true
      data.shift(1)
      matchFound = true
    }
    if (data[0].match(/^\s*done\s*$/)) {
      task.done = true
      data.shift(1)
      matchFound = true
    }
    if (data[0].match(/^\s*crit\s*$/)) {
      task.crit = true
      data.shift(1)
      matchFound = true
    }
  }
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim()
  }

  switch (data.length) {
    case 1:
      task.id = parseId()
      task.startTime = prevTask.endTime
      task.endTime = getEndDate(task.startTime, dateFormat, excludes, data[0])
      break
    case 2:
      task.id = parseId()
      task.startTime = getStartDate(undefined, dateFormat, excludes, data[0])
      task.endTime = getEndDate(task.startTime, dateFormat, excludes, data[1])
      break
    case 3:
      task.id = parseId(data[0])
      task.startTime = getStartDate(undefined, dateFormat, excludes, data[1])
      task.endTime = getEndDate(task.startTime, dateFormat, excludes, data[2])
      break
    default:
  }

  return task
}

const parseData = function (prevTaskId, dataStr) {
  let ds
  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length)
  } else {
    ds = dataStr
  }

  const data = ds.split(',')

  const task = {}

  // Get tags like active, done cand crit
  let matchFound = true
  while (matchFound) {
    matchFound = false
    if (data[0].match(/^\s*active\s*$/)) {
      task.active = true
      data.shift(1)
      matchFound = true
    }
    if (data[0].match(/^\s*done\s*$/)) {
      task.done = true
      data.shift(1)
      matchFound = true
    }
    if (data[0].match(/^\s*crit\s*$/)) {
      task.crit = true
      data.shift(1)
      matchFound = true
    }
  }
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim()
  }

  switch (data.length) {
    case 1:
      task.id = parseId()
      task.startTime = { type: 'prevTaskEnd', id: prevTaskId }
      task.endTime = { data: data[0] }
      break
    case 2:
      task.id = parseId()
      task.startTime = { type: 'getStartDate', startData: data[0] }
      task.endTime = { data: data[1] }
      break
    case 3:
      task.id = parseId(data[0])
      task.startTime = { type: 'getStartDate', startData: data[1] }
      task.endTime = { data: data[2] }
      break
    default:
  }

  return task
}

let lastTask
let lastTaskID
let rawTasks = []
const taskDb = {}
export const addTask = function (descr, data) {
  const rawTask = {
    section: currentSection,
    type: currentSection,
    processed: false,
    raw: { data: data },
    task: descr
  }
  const taskInfo = parseData(lastTaskID, data)
  rawTask.raw.startTime = taskInfo.startTime
  rawTask.raw.endTime = taskInfo.endTime
  rawTask.id = taskInfo.id
  rawTask.prevTaskId = lastTaskID
  rawTask.active = taskInfo.active
  rawTask.done = taskInfo.done
  rawTask.crit = taskInfo.crit

  const pos = rawTasks.push(rawTask)

  lastTaskID = rawTask.id
  // Store cross ref
  taskDb[rawTask.id] = pos - 1
}

export const findTaskById = function (id) {
  const pos = taskDb[id]
  return rawTasks[pos]
}

export const addTaskOrg = function (descr, data) {
  const newTask = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr
  }
  const taskInfo = compileData(lastTask, data)
  newTask.startTime = taskInfo.startTime
  newTask.endTime = taskInfo.endTime
  newTask.id = taskInfo.id
  newTask.active = taskInfo.active
  newTask.done = taskInfo.done
  newTask.crit = taskInfo.crit
  lastTask = newTask
  tasks.push(newTask)
}

const compileTasks = function () {
  const compileTask = function (pos) {
    const task = rawTasks[pos]
    let startTime = ''
    switch (rawTasks[pos].raw.startTime.type) {
      case 'prevTaskEnd':
        const prevTask = findTaskById(task.prevTaskId)
        task.startTime = prevTask.endTime
        break
      case 'getStartDate':
        startTime = getStartDate(undefined, dateFormat, excludes, rawTasks[pos].raw.startTime.startData)
        if (startTime) {
          rawTasks[pos].startTime = startTime
        }
        break
    }

    if (rawTasks[pos].startTime) {
      rawTasks[pos].endTime = getEndDate(rawTasks[pos].startTime, dateFormat, excludes, rawTasks[pos].raw.endTime.data)
      if (rawTasks[pos].endTime) {
        rawTasks[pos].processed = true
      }
    }

    return rawTasks[pos].processed
  }

  let allProcessed = true
  for (let i = 0; i < rawTasks.length; i++) {
    compileTask(i)

    allProcessed = allProcessed && rawTasks[i].processed
  }
  return allProcessed
}

export default {
  clear,
  setDateFormat,
  setAxisFormat,
  getAxisFormat,
  setTitle,
  getTitle,
  addSection,
  getTasks,
  addTask,
  findTaskById,
  addTaskOrg,
  setExcludes
}
