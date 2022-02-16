import { Path, Point } from 'paper/dist/paper-core'
import { InputOutput, Shape } from '.'

const renderInputOutputMidi = ({ position }: InputOutput) =>
  new Path.Circle({ radius: 6, fillColor: 'black', center: position })

const renderInputOutputTrigger = ({ position, angle }: InputOutput) => {
  const triangle = new Path.RegularPolygon({
    sides: 3,
    radius: 1,
    fillColor: 'black',
  })
  triangle.bounds.width = 12
  triangle.bounds.height = 12
  triangle.bounds.bottomCenter = new Point(position)
  triangle.rotate(angle - 90, triangle.bounds.bottomCenter)
}

const renderProp = ({ x, y }: Point, side: Side) => {
  // const offset = 17.5 * (side === 'left' ? -1 : 1)
  new Path.Circle({
    center: { x, y },
    radius: 7.5,
    fillColor: 'grey',
  })
}

export const renderDebugInformation = (
  inputsOutputs: Shape['inputsOutputs'],
  props: Shape['props']
) => {
  props.left?.three.forEach((prop) => renderProp(prop, 'left'))
  props.right?.three.forEach((prop) => renderProp(prop, 'right'))

  Object.values(inputsOutputs).forEach((handle) =>
    handle.signal === 'midi'
      ? renderInputOutputMidi(handle)
      : renderInputOutputTrigger(handle)
  )
}
