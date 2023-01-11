import { Path, Point as PaperPoint, PointText } from 'paper/dist/paper-core'
import { Point, Shape, ShapeConnector, ShapeLabel } from './types'
import { perforatePath } from './utils'

const renderConnectorInset = ({ positions }: ShapeConnector) =>
  new Path.Circle({ radius: 6, fillColor: 'black', center: positions.inset })

const renderConnectorOutline = ({ positions, angle, thru }: ShapeConnector) => {
  if (thru) return

  const triangle = new Path.RegularPolygon({
    sides: 3,
    radius: 1,
    fillColor: 'black',
  })
  triangle.bounds.width = 12
  triangle.bounds.height = 12
  triangle.bounds.bottomCenter = new PaperPoint(positions.outline!)
  triangle.rotate(angle - 90, triangle.bounds.bottomCenter)
}

const renderProp = ({ x, y }: Point, index: number) => {
  new Path.Circle({
    center: { x, y },
    radius: 7.5,
    fillColor: 'grey',
  })
  new PointText({
    point: { x: x + 10, y },
    content: index + 1,
  })
}

const renderLabel = (label: ShapeLabel) => {
  console.log(label)
  const text = new PointText({
    point: label.position,
    content: 'label',
  })
  text.rotate(label.angle - 180, label.position as any)
}

export const renderDebugInformation = (
  outline: paper.Path,
  inputs: Shape['inputs'],
  outputs: Shape['outputs'],
  props: Shape['props'],
  labels: Shape['labels']
) => {
  props.left?.three.forEach((prop, index) => renderProp(prop, index + 3))
  props.right?.three.forEach((prop, index) => renderProp(prop, index))

  const inputsOutputs = [...inputs, ...outputs]
  const holes = inputsOutputs.map((v) => v.offset)
  const { dashArray, dashOffset } = perforatePath(outline.length, holes)
  outline.dashArray = dashArray
  outline.dashOffset = dashOffset

  inputsOutputs.forEach((v) => {
    renderConnectorInset(v)
    renderConnectorOutline(v)
  })

  labels.forEach(renderLabel)
}
