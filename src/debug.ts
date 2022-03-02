import { Path, Point } from 'paper/dist/paper-core'
import { InputOutput, Shape } from '.'
import { perforatePath } from './utils'

const renderInputOutputInset = ({ position }: InputOutput) =>
  new Path.Circle({ radius: 6, fillColor: 'black', center: position.inset })

const renderInputOutputTouching = ({
  direction,
  position,
  angle,
}: InputOutput) => {
  if (direction === 'inout') return

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

const renderProp = ({ x, y }: Point) =>
  new Path.Circle({
    center: { x, y },
    radius: 7.5,
    fillColor: 'grey',
  })

export const renderDebugInformation = (
  outline: paper.Path,
  inputsOutputs: Shape['inputsOutputs'],
  props: Shape['props']
) => {
  props.left?.three.forEach((prop) => renderProp(prop))
  props.right?.three.forEach((prop) => renderProp(prop))

  const holes = Object.values(inputsOutputs)
    .map((v) => v.intersectionOffset)
    .flat()

  const { dashArray, dashOffset } = perforatePath(outline.length, holes)
  outline.dashArray = dashArray
  outline.dashOffset = dashOffset

  Object.values(inputsOutputs).forEach((v) => {
    renderInputOutputInset(v)
    renderInputOutputTouching(v)
  })
}
