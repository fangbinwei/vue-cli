const DEFAULT_STAGE = 100

exports.DEFAULT_STAGE = DEFAULT_STAGE
/** @typedef {{after?: string|Array<string>, stage?: number)}} Apply */
/** @typedef {{apply: Apply, after: Set<string>, stage: number}} Plugin */

/**
 * Insertion sort, 'stage' ascending order
 * The default stage of plugin is 100
 * @param {Array<Plugin>} plugins
 * @param {Plugin} item
 */
exports.insertPluginByStage = (plugins, item) => {
  const { apply } = item

  let after = new Set()
  if (typeof apply.after === 'string') {
    after = new Set([apply.after])
  } else if (Array.isArray(apply.after)) {
    after = new Set(apply.after)
  }

  let stage = DEFAULT_STAGE
  if (typeof apply.stage === 'number') {
    stage = apply.stage
  }

  let i = plugins.length
  while (i > 0) {
    i--
    const x = plugins[i]
    plugins[i + 1] = x
    const xStage = x.stage
    if (xStage > stage) {
      continue
    }
    i++
    break
  }
  plugins[i] = Object.assign(item, { stage, after })
}

/**
 * See leetcode 210
 * @param {Array<Plugin>} plugins
 * @returns {Array<Plugin>}
 */
function TopologicalSorting (plugins) {
  /** @type {Map<id, Plugin>} */
  const pluginsMap = new Map(plugins.map(p => [p.id, p]))

  /** @type {Map<Plugin, number>} */
  const indegrees = new Map()

  /** @type {Map<Plugin, Array<Plugin>>} */
  const graph = new Map()

  plugins.forEach(p => {
    indegrees.set(p, p.after.size)
    if (p.after.size > 0) {
      for (const id of p.after) {
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
  // TODO: show warning to user when invalid? or return plugins directly
  // return valid ? res : []
  return valid ? res : plugins
}

/**
 * Arrange plugins by 'after' property. Plugins should be sorted by 'stage' property firstly.
 * @param {Array<Plugin>} plugins
 * @returns {Array<Plugin>}
 */
exports.arrangePlugins = (plugins) => {
  if (plugins.length < 2) return plugins

  /** @type {Array<Plugin>} */
  const res = []

  /** @type {Map<number, Array<Plugin>>} */
  const stageGroup = new Map()

  for (let i = 0; i < plugins.length; i++) {
    const cur = plugins[i]
    const stage = cur.stage
    if (!stageGroup.has(stage)) {
      stageGroup.set(stage, [])
    }
    stageGroup.get(stage).push(cur)
  }

  stageGroup.forEach((stageGroupPlugins, stage) => {
    res.push(...TopologicalSorting(stageGroupPlugins))
  })
  return res
}
