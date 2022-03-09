import { Path, Point } from 'paper/dist/paper-core'
import { ShapeInputOutput, Shape } from '.'
import { PointXY } from './types'
import { perforatePath } from './utils'

const renderInputOutputInset = ({ position }: ShapeInputOutput) =>
  new Path.Circle({ radius: 6, fillColor: 'black', center: position.inset })

const renderInputOutputTouching = ({
  position,
  angle,
  isInOut,
}: ShapeInputOutput) => {
  if (isInOut) return

  const triangle = new Path.RegularPolygon({
    sides: 3,
    radius: 1,
    fillColor: 'black',
  })
  triangle.bounds.width = 12
  triangle.bounds.height = 12
  triangle.bounds.bottomCenter = new Point(position.touching!)
  triangle.rotate(angle - 90, triangle.bounds.bottomCenter)
}

const renderProp = ({ x, y }: PointXY) =>
  new Path.Circle({
    center: { x, y },
    radius: 7.5,
    fillColor: 'grey',
  })

export const renderDebugInformation = (
  outline: paper.Path,
  inputs: Shape['inputs'],
  outputs: Shape['outputs'],
  props: Shape['props']
) => {
  props.left?.three.forEach((prop) => renderProp(prop))
  props.right?.three.forEach((prop) => renderProp(prop))

  const inputsOutputs = [...inputs, ...outputs]
  const holes = inputsOutputs.map((v) => v.offset)
  const { dashArray, dashOffset } = perforatePath(outline.length, holes)
  outline.dashArray = dashArray
  outline.dashOffset = dashOffset

  inputsOutputs.forEach((v) => {
    renderInputOutputInset(v)
    renderInputOutputTouching(v)
  })
}
