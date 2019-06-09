import moment from 'moment-mini'
import { logger } from '../../logger'

let dateFormat = ''
let axisFormat = ''
let excludes = []
let title = ''
let sections = []
let tasks = []
let currentSection = ''
const tags = ['active', 'done', 'crit', 'milestone']

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
  excludes = txt.toLowerCase().split(/[\s,]+/)
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

const isInvalidDate = function (date, dateFormat, excludes) {
  if (date.isoWeekday() >= 6 && excludes.indexOf('weekends') >= 0) {
    return true
  }
  if (excludes.indexOf(date.format('dddd').toLowerCase()) >= 0) {
    return true
  }
  return excludes.indexOf(date.format(dateFormat.trim())) >= 0
}

const checkTaskDates = function (task, dateFormat, excludes) {
  if (!excludes.length || task.manualEndTime) return
  let startTime = moment(task.startTime, dateFormat, true)
  startTime.add(1, 'd')
  let endTime = moment(task.endTime, dateFormat, true)
  let renderEndTime = fixTaskDates(startTime, endTime, dateFormat, excludes)
  task.endTime = endTime.toDate()
  task.renderEndTime = renderEndTime
}

const fixTaskDates = function (startTime, endTime, dateFormat, excludes) {
  let invalid = false
  let renderEndTime = null
  while (startTime.date() <= endTime.date()) {
    if (!invalid) {
      renderEndTime = endTime.toDate()
    }
    invalid = isInvalidDate(startTime, dateFormat, excludes)
    if (invalid) {
      endTime.add(1, 'd')
    }
    startTime.add(1, 'd')
  }
  return renderEndTime
}

const getStartDate = function (prevTime, dateFormat, str) {
  str = str.trim()

  // Test for after
  const re = /^after\s+([\d\w-]+)/
  const afterStatement = re.exec(str.trim())

  if (afterStatement !== null) {
    const task = findTaskById(afterStatement[1])

    if (typeof task === 'undefined') {
      const dt = new Date()
      dt.setHours(0, 0, 0, 0)
      return dt
    }
    return task.endTime
  }

  // Check for actual date set
  let mDate = moment(str, dateFormat.trim(), true)
  if (mDate.isValid()) {
    return mDate.toDate()
  } else {
    logger.debug('Invalid date:' + str)
    logger.debug('With date format:' + dateFormat.trim())
  }

  // Default date - now
  return new Date()
}

const getEndDate = function (prevTime, dateFormat, str) {
  str = str.trim()

  // Check for actual date
  let mDate = moment(str, dateFormat.trim(), true)
  if (mDate.isValid()) {
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
  return d.toDate()
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

  // Get tags like active, done, crit and milestone
  getTaskTags(data, task, tags)

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i].trim()
  }

  let endTimeData = ''
  switch (data.length) {
    case 1:
      task.id = parseId()
      task.startTime = prevTask.endTime
      endTimeData = data[0]
      break
    case 2:
      task.id = parseId()
      task.startTime = getStartDate(undefined, dateFormat, data[0])
      endTimeData = data[1]
      break
    case 3:
      task.id = parseId(data[0])
      task.startTime = getStartDate(undefined, dateFormat, data[1])
      endTimeData = data[2]
      break
    default:
  }

  if (endTimeData) {
    task.endTime = getEndDate(task.startTime, dateFormat, endTimeData)
    task.manualEndTime = endTimeData === moment(task.endTime).format(dateFormat.trim())
    checkTaskDates(task, dateFormat, excludes)
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

  // Get tags like active, done, crit and milestone
  getTaskTags(data, task, tags)

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
    manualEndTime: false,
    renderEndTime: null,
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
  rawTask.milestone = taskInfo.milestone

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
  newTask.milestone = taskInfo.milestone
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
        startTime = getStartDate(undefined, dateFormat, rawTasks[pos].raw.startTime.startData)
        if (startTime) {
          rawTasks[pos].startTime = startTime
        }
        break
    }

    if (rawTasks[pos].startTime) {
      rawTasks[pos].endTime = getEndDate(rawTasks[pos].startTime, dateFormat, rawTasks[pos].raw.endTime.data)
      if (rawTasks[pos].endTime) {
        rawTasks[pos].processed = true
        rawTasks[pos].manualEndTime = rawTasks[pos].raw.endTime.data === moment(rawTasks[pos].endTime).format(dateFormat.trim())
        checkTaskDates(rawTasks[pos], dateFormat, excludes)
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

function getTaskTags (data, task, tags) {
  let matchFound = true
  while (matchFound) {
    matchFound = false
    tags.forEach(function (t) {
      const pattern = '^\\s*' + t + '\\s*$'
      const regex = new RegExp(pattern)
      if (data[0].match(regex)) {
        task[t] = true
        data.shift(1)
        matchFound = true
      }
    })
  }
}
