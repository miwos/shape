import paper from 'paper'
import { perforatePath, toXY } from './utils'

let isSetup = false
const markerRegExp = new RegExp(/^(midi|data)-(in|out|inout)/)

/**
 * Pass an optional canvas element to `paper.setup()`. Useful for debugging.
 * If this function isn't called manually, `compileShape()` will take care of
 * the setup.
 */
export const setup = (canvas?: HTMLCanvasElement) => {
  // @ts-ignore
  paper.setup(canvas)
  isSetup = true
}

interface Handle {
  id: `${Handle['type']}-${Handle['index']}`
  type: `${'midi' | 'data'}-${'in' | 'out' | 'inout'}`
  index: number
  angle: number
  delta: { x: number; y: number }
  point: { x: number; y: number }
}

const getHandles = (markers: paper.Path[], shape: paper.Path) => {
  const indexes: Record<string, number> = { in: 0, out: 0, inout: 0 }

  return markers.map((marker) => {
    const match = marker.name.match(markerRegExp)
    const [, signal, direction] = match!

    const index = indexes[direction]++
    const type = `${signal}-${direction}` as Handle['type']
    const id = `${type}-${index}` as Handle['id']

    const vector = marker.firstSegment.point.subtract(marker.lastSegment.point)
    vector.angle -= 90
    const angle = +vector.angle.toFixed(2)

    const { point } = shape.getIntersections(marker)[0]
    const delta = point.subtract(vector.normalize().multiply(14)).round()

    return { id, type, index, angle, delta: toXY(delta), point: toXY(point) }
  })
}

export const compileShape = (svg: string) => {
  if (!isSetup) setup()

  const parent = paper.project.importSVG(svg) as paper.Group
  // Get rid of the background layer.
  parent.firstChild.remove()

  // @ts-ignore
  const shape = parent.children['shape'] as paper.Path

  const markers = parent.getItems((item: paper.Path) =>
    item.name.match(markerRegExp)
  ) as paper.Path[]

  // Fit the view to the shape (without the markers).
  markers.forEach((el) => (el.visible = false))
  paper.view.viewSize = parent.bounds.size.round()
  parent.position = paper.view.center

  const outline = shape.clone()
  outline.name = 'outline'
  outline.strokeColor = new paper.Color('black')

  const handles = getHandles(markers, shape)

  const pointsOnOutline = handles.map((el) => el.point)
  perforatePath(outline, pointsOnOutline)

  markers.forEach((el) => el.remove())
  svg = paper.project.exportSVG({ asString: true }) as string

  return { handles, svg }
}
