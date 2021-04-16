const { insertPluginByStage, topologicalSorting, arrangePlugins } = require('../lib/pluginOrder.js')

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
  test(`using default 'stage' will preserve sort order`, () => {
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

  test(`using same 'stage' will preserve sort order`, () => {
    const plugins = [
      plugin('foo', { stage: 200 }),
      plugin('bar', { stage: 200 }),
      plugin('baz', { stage: 200 })
    ]
    const orderPlugins = []
    insertPluginByStage(orderPlugins, plugins[0])
    insertPluginByStage(orderPlugins, plugins[1])
    insertPluginByStage(orderPlugins, plugins[2])

    expect(orderPlugins).toEqual(plugins)
  })

  test(`several different 'stage'`, () => {
    const plugins = [
      plugin('foo'),
      plugin('zot', { stage: 200 }),
      plugin('fum', { stage: 100 }),
      plugin('bar', { stage: 0 }),
      plugin('baz', { stage: 200 })
    ]
    const orderPlugins = []
    insertPluginByStage(orderPlugins, plugins[0])
    insertPluginByStage(orderPlugins, plugins[1])
    insertPluginByStage(orderPlugins, plugins[2])
    insertPluginByStage(orderPlugins, plugins[3])
    insertPluginByStage(orderPlugins, plugins[4])

    expect(orderPlugins).toEqual([
      plugin('bar', { stage: 0 }),
      plugin('foo'),
      plugin('fum', { stage: 100 }),
      plugin('zot', { stage: 200 }),
      plugin('baz', { stage: 200 })
    ])
  })
})

describe('topologicalSorting', () => {
  test(`no specifying 'after' will preserve sort order`, () => {
    const plugins = [
      plugin('foo'),
      plugin('bar'),
      plugin('baz')
    ]
    const orderPlugins = topologicalSorting(plugins)
    expect(orderPlugins).toEqual(plugins)
  })

  test(`'after' specified`, () => {
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

  test(`'after' can be Array<string>`, () => {
    const plugins = [
      plugin('foo', { after: ['bar', 'baz'] }),
      plugin('bar'),
      plugin('baz')
    ]
    const orderPlugins = topologicalSorting(plugins)
    expect(orderPlugins).toEqual([
      plugin('bar'),
      plugin('baz'),
      plugin('foo', { after: ['bar', 'baz'] })
    ])
  })

  test('it is not possible to order plugins because of cyclic graph, return original plugins directly', () => {
    let plugins = [
      plugin('foo', { after: 'bar' }),
      plugin('bar', { after: 'baz' }),
      plugin('baz', { after: 'foo' })
    ]
    let orderPlugins = topologicalSorting(plugins)
    expect(orderPlugins).toEqual(plugins)

    plugins = [
      plugin('foo', { after: 'bar' }),
      plugin('bar', { after: 'foo' }),
      plugin('baz')
    ]
    orderPlugins = topologicalSorting(plugins)
    expect(orderPlugins).toEqual(plugins)
  })
})

describe('arrangePlugins', () => {
  test(`arrange plugins which already ordered by 'stage'`, () => {
    const plugins = [
      plugin('bar', { stage: 100, after: 'foo' }),
      plugin('foo', { stage: 100 }),
      plugin('fum', { stage: 200, after: 'baz' }),
      plugin('zot', { stage: 200, after: 'baz' }),
      plugin('baz', { stage: 200 })
    ]
    const orderPlugins = arrangePlugins(plugins)
    expect(orderPlugins).toEqual([
      plugin('foo', { stage: 100 }),
      plugin('bar', { stage: 100, after: 'foo' }),
      plugin('baz', { stage: 200 }),
      plugin('fum', { stage: 200, after: 'baz' }),
      plugin('zot', { stage: 200, after: 'baz' })
    ])
  })

  test(`'stage' has a higher priority than 'after'`, () => {
    const plugins = [
      plugin('bar', { stage: 0, after: 'foo' }),
      plugin('foo', { stage: 100 })
    ]
    const orderPlugins = arrangePlugins(plugins)
    expect(orderPlugins).toEqual(plugins)
  })
})
