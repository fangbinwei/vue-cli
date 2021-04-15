/* eslint-disable no-unused-vars */
const { insertPluginByStage, arrangePlugins, DEFAULT_STAGE } = require('../lib/pluginOrder.js')

/**
 *
 * @param {string} id
 * @param {number} stage
 * @param {string|Array<string>} after
 * @returns
 */
function newPlugin (id, stage, after) {
  const apply = () => {}
  apply.stage = stage
  apply.after = after
  return {
    id,
    apply
  }
}
/**
 *
 * @param {Array<{name: string, stage?: number, after?: string|Array<string>}>} props
 */
function newPlugins (props) {
  const res = []
  props.forEach(p => {
    res.push(newPlugin(p.name, p.stage, p.after))
  })
  return res
}

test('insertPluginByStage: No stage specified', () => {
  const plugins = [
    newPlugin('foo'),
    newPlugin('bar'),
    newPlugin('baz')
  ]
  const pluginsOrder = []
  insertPluginByStage(pluginsOrder, plugins[0])
  insertPluginByStage(pluginsOrder, plugins[1])
  insertPluginByStage(pluginsOrder, plugins[2])

  expect(pluginsOrder[0]).toMatchObject({ id: 'foo', stage: DEFAULT_STAGE, after: new Set() })
  expect(pluginsOrder[1]).toMatchObject({ id: 'bar', stage: DEFAULT_STAGE, after: new Set() })
  expect(pluginsOrder[2]).toMatchObject({ id: 'baz', stage: DEFAULT_STAGE, after: new Set() })
})

test('insertPluginByStage: stage specified', () => {
  const plugins = [
    newPlugin('foo'),
    newPlugin('bar', 0),
    newPlugin('baz', 200)
  ]
  const pluginsOrder = []
  insertPluginByStage(pluginsOrder, plugins[0])
  insertPluginByStage(pluginsOrder, plugins[1])
  insertPluginByStage(pluginsOrder, plugins[2])

  expect(pluginsOrder[0]).toMatchObject({ id: 'bar', stage: 0, after: new Set() })
  expect(pluginsOrder[1]).toMatchObject({ id: 'foo', stage: DEFAULT_STAGE, after: new Set() })
  expect(pluginsOrder[2]).toMatchObject({ id: 'baz', stage: 200, after: new Set() })
})
