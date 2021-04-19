// @ts-check
const { warn } = require('./logger')
const DEFAULT_STAGE = 100

/** @typedef {{after?: string|Array<string>, stage?: number}} Apply */
/** @typedef {{id: string, apply: Apply}} Plugin */
/** @typedef {{after: Set<string>, stage: number}} OrderParams */

/** @type {Map<string, OrderParams>} */
const orderParamsCache = new Map()

/**
 *
 * @param {Plugin} plugin
 * @returns {OrderParams}
 */
function getOrderParams (plugin) {
  if (!process.env.VUE_CLI_TEST && orderParamsCache.has(plugin.id)) {
    return orderParamsCache.get(plugin.id)
  }
  const apply = plugin.apply

  let stage = DEFAULT_STAGE
  if (typeof apply.stage === 'number') {
    stage = apply.stage
  }

  let after = new Set()
  if (typeof apply.after === 'string') {
    after = new Set([apply.after])
  } else if (Array.isArray(apply.after)) {
    after = new Set(apply.after)
  }
  if (!process.env.VUE_CLI_TEST) {
    orderParamsCache.set(plugin.id, { stage, after })
  }

  return { stage, after }
}

/**
 * Insertion sort, 'stage' ascending order
 * The default stage of plugin is 100
 * @param {Array<Plugin>} plugins
 * @param {Plugin} item
 */
function insertPluginByStage (plugins, item) {
  const { stage } = getOrderParams(item)

  let i = plugins.length
  while (i > 0) {
    i--
    const x = plugins[i]
    plugins[i + 1] = x
    const xStage = getOrderParams(x).stage
    if (xStage > stage) {
      continue
    }
    i++
    break
  }
  plugins[i] = item
}

/**
 *
 * @param {Array<Plugin>} plugins
 * @returns {Array<Plugin>}
 */
function sortPluginsByStage (plugins) {
  const sorted = []
  plugins.forEach(p => {
    insertPluginByStage(sorted, p)
  })

  return sorted
}

/**
 * See leetcode 210
 * @param {Array<Plugin>} plugins
 * @returns {Array<Plugin>}
 */
function topologicalSorting (plugins) {
  /** @type {Map<string, Plugin>} */
  const pluginsMap = new Map(plugins.map(p => [p.id, p]))

  /** @type {Map<Plugin, number>} */
  const indegrees = new Map()

  /** @type {Map<Plugin, Array<Plugin>>} */
  const graph = new Map()

  plugins.forEach(p => {
    const after = getOrderParams(p).after
    indegrees.set(p, after.size)
    if (after.size === 0) return
    for (const id of after) {
      const prerequisite = pluginsMap.get(id)
      // remove invalid data
      if (!prerequisite) {
        indegrees.set(p, indegrees.get(p) - 1)
        continue
      }

      if (!graph.has(prerequisite)) {
        graph.set(prerequisite, [])
      }
      graph.get(prerequisite).push(p)
    }
  })

  const res = []
  const queue = []
  indegrees.forEach((d, p) => {
    if (d === 0) queue.push(p)
  })
  while (queue.length) {
    const cur = queue.shift()
    res.push(cur)
    const neighbors = graph.get(cur)
    if (!neighbors) continue

    neighbors.forEach(n => {
      const degree = indegrees.get(n) - 1
      indegrees.set(n, degree)
      if (degree === 0) {
        queue.push(n)
      }
    })
  }
  const valid = res.length === plugins.length
  if (!valid) {
    warn(`No proper plugin execution order found.`)
    return plugins
  }
  return res
}

/**
 * Plugins will be sorted by 'stage' property firstly.
 * Then arrange plugins by 'after' property.
 * @param {Array<Plugin>} plugins
 * @returns {Array<Plugin>}
 */
function sortPlugins (plugins) {
  if (plugins.length < 2) return plugins

  const stagePlugins = sortPluginsByStage(plugins)

  /** @type {Array<Plugin>} */
  const res = []

  /** @type {Map<number, Array<Plugin>>} */
  const stageGroup = new Map()

  for (let i = 0; i < stagePlugins.length; i++) {
    const cur = stagePlugins[i]
    const stage = getOrderParams(cur).stage
    if (!stageGroup.has(stage)) {
      stageGroup.set(stage, [])
    }
    stageGroup.get(stage).push(cur)
  }

  stageGroup.forEach((stageGroupPlugins) => {
    res.push(...topologicalSorting(stageGroupPlugins))
  })
  return res
}

module.exports = {
  insertPluginByStage,
  sortPluginsByStage,
  topologicalSorting,
  sortPlugins
}
