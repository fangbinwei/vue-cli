const { insertPluginByStage, topologicalSorting } = require('../lib/pluginOrder.js')

/**
 *
 * @param {string} id
 * @param {{stage: number, after: string|Array<string>}} [order]
 */
function plugin (id, order) {
  order = order || {}
  const { stage, after } = order

  // use object instead of function here
  const apply = {}
  apply.stage = stage
  apply.after = after
  return {
    id,
    apply
  }
}

describe('insertPluginByStage', () => {
  test('No stage specified', () => {
    const plugins = [
      plugin('foo'),
      plugin('bar'),
      plugin('baz')
    ]
    const orderPlugins = []
    insertPluginByStage(orderPlugins, plugins[0])
    insertPluginByStage(orderPlugins, plugins[1])
    insertPluginByStage(orderPlugins, plugins[2])

    expect(orderPlugins).toEqual(plugins)
  })

  test('stage specified', () => {
    const plugins = [
      plugin('foo'),
      plugin('bar', { stage: 0 }),
      plugin('baz', { stage: 200 })
    ]
    const orderPlugins = []
    insertPluginByStage(orderPlugins, plugins[0])
    insertPluginByStage(orderPlugins, plugins[1])
    insertPluginByStage(orderPlugins, plugins[2])

    expect(orderPlugins).toEqual([
      plugin('bar', { stage: 0 }),
      plugin('foo'),
      plugin('baz', { stage: 200 })
    ])
  })
})

describe('topologicalSorting', () => {
  test('no after specified', () => {
    const plugins = [
      plugin('foo'),
      plugin('bar'),
      plugin('baz')
    ]
    const orderPlugins = topologicalSorting(plugins)
    expect(orderPlugins).toEqual(plugins)
  })

  test('after specified', () => {
    const plugins = [
      plugin('foo', { after: 'bar' }),
      plugin('bar', { after: 'baz' }),
      plugin('baz')
    ]
    const orderPlugins = topologicalSorting(plugins)
    expect(orderPlugins).toEqual([
      plugin('baz'),
      plugin('bar', { after: 'baz' }),
      plugin('foo', { after: 'bar' })
    ])
  })

  test('it is not possible to order plugin because of cyclic graph, return plugins directly', () => {
    const plugins = [
      plugin('foo', { after: 'bar' }),
      plugin('bar', { after: 'baz' }),
      plugin('baz', { after: 'foo' })
    ]
    const orderPlugins = topologicalSorting(plugins)
    expect(orderPlugins).toEqual(plugins)
  })
})

describe('arrangePlugins', () => {
  // TODO:
})
