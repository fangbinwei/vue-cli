const pluginRE = /^(@vue\/|vue-|@[\w-]+(\.)?[\w-]+\/vue-)cli-plugin-/
const scopeRE = /^@[\w-]+(\.)?[\w-]+\//
const officialRE = /^@vue\//
const DEFAULT_STAGE = 100

const officialPlugins = [
  'babel',
  'e2e-cypress',
  'e2e-nightwatch',
  'e2e-webdriverio',
  'eslint',
  'pwa',
  'router',
  'typescript',
  'unit-jest',
  'unit-mocha',
  'vuex',
  'webpack-4'
]

exports.isPlugin = id => pluginRE.test(id)

exports.isOfficialPlugin = id => exports.isPlugin(id) && officialRE.test(id)

exports.toShortPluginId = id => id.replace(pluginRE, '')

exports.resolvePluginId = id => {
  // already full id
  // e.g. vue-cli-plugin-foo, @vue/cli-plugin-foo, @bar/vue-cli-plugin-foo
  if (pluginRE.test(id)) {
    return id
  }

  if (id === '@vue/cli-service') {
    return id
  }

  if (officialPlugins.includes(id)) {
    return `@vue/cli-plugin-${id}`
  }
  // scoped short
  // e.g. @vue/foo, @bar/foo
  if (id.charAt(0) === '@') {
    const scopeMatch = id.match(scopeRE)
    if (scopeMatch) {
      const scope = scopeMatch[0]
      const shortId = id.replace(scopeRE, '')
      return `${scope}${scope === '@vue/' ? `` : `vue-`}cli-plugin-${shortId}`
    }
  }
  // default short
  // e.g. foo
  return `vue-cli-plugin-${id}`
}

exports.matchesPluginId = (input, full) => {
  const short = full.replace(pluginRE, '')
  return (
    // input is full
    full === input ||
    // input is short without scope
    short === input ||
    // input is short with scope
    short === input.replace(scopeRE, '')
  )
}

exports.getPluginLink = id => {
  if (officialRE.test(id)) {
    return `https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-${
      exports.toShortPluginId(id)
    }`
  }
  let pkg = {}
  try {
    pkg = require(`${id}/package.json`)
  } catch (e) {}
  return (
    pkg.homepage ||
    (pkg.repository && pkg.repository.url) ||
    `https://www.npmjs.com/package/${id.replace(`/`, `%2F`)}`
  )
}

/**
 * Insertion sort, 'stage' ascending order
 * The default stage of plugin is 100
 * @typedef {{after?: string|Array<string>, stage?: number)}} Apply
 * @typedef {{id: string, apply: Apply, options: any, after: Set<string>, stage: number}} Plugin
 * @param {Array<Plugin>} plugins
 * @param {Plugin} item
 */
exports.insertPluginByStage = (plugins, item) => {
  const { id, apply, options } = item

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
  plugins[i] = { id, apply, options, stage, after }
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
  const indegree = new Map()

  /** @type {Map<Plugin, Array<Plugin>>} */
  const graph = new Map()

  plugins.forEach(p => {
    indegree.set(p, p.after.size)
    if (p.after.size > 0) {
      for (const id of p.after) {
        const prrerequisite = pluginsMap.get(id)
        // remove invalid data
        if (!prrerequisite) {
          indegree.set(p, indegree.get(p) - 1)
          continue
        }

        if (!graph.has(prrerequisite)) {
          graph.set(prrerequisite, [])
        }
        graph.get(prrerequisite).push(p)
      }
    }
  })

  const res = []
  const queue = []
  indegree.forEach((d, p) => {
    if (d === 0) queue.push(p)
  })
  while (queue.length) {
    const cur = queue.shift()
    res.push(cur)
    const toEnQueue = graph.get(cur)
    if (toEnQueue && toEnQueue.length) {
      toEnQueue.forEach(next => {
        const newIndegree = indegree.get(next) - 1
        indegree.set(next, newIndegree)
        if (newIndegree === 0) {
          queue.push(next)
        }
      })
    }
  }
  const valid = res.length === plugins.length
  // TODO: show warning to user when invalid? or return plugins directly
  // return valid ? res : []
  return valid ? res : plugins
}

/**
 * Arrange plugins by 'after' property
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
