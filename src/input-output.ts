import { Path } from 'paper/dist/paper-core'
import { toXY } from './utils'

export const markerRegExp = new RegExp(/^(midi|trigger)-(inout|in|out)/)

export interface InputOutput {
  id: `${InputOutput['signal']}-${InputOutput['direction']}-${InputOutput['index']}`
  index: number
  signal: 'midi' | 'trigger'
  direction: 'in' | 'out' | 'inout'
  angle: number
  position: { x: number; y: number }
}

const validateMarker = (
  marker: paper.Path,
  direction: InputOutput['direction'],
  intersectionsCount: number
) => {
  if (marker.segments.length !== 2) {
    console.warn(
      `Marker '${marker.name}' should only have two segments but has ${marker.segments.length}.`
    )
  }

  let error

  if (direction === 'inout') {
    if (intersectionsCount < 2)
      error = `Marker '${marker.name}' needs two intersections with shape but has only ${intersectionsCount}.`
  } else {
    if (!intersectionsCount)
      error = `Marker '${marker.name}' needs an intersection with shape.`

    if (intersectionsCount > 1)
      console.warn(
        `Marker '${marker.name}' should only have one intersection with shape but has ${intersectionsCount}.`
      )
  }

  return { error }
}

const getMarkers = (project: paper.Project) =>
  project.getItems({
    match: (item: paper.Path) => item.name?.match(markerRegExp),
    recursive: true,
  }) as paper.Path[]

export const hideMarkers = (project: paper.Project) =>
  getMarkers(project).forEach((v) => (v.visible = false))

const getMidiPosition = (vector: paper.Point, intersection: paper.Point) =>
  intersection
    // @ts-ignore (wrong paper types)
    .add(vector.multiply(14))
    .round()

const getTriggerPosition = (
  vector: paper.Point,
  intersection: paper.Point,
  shape: paper.Path
) => {
  // @ts-ignore
  const offset = vector.rotate(-90).multiply(6)
  const p = intersection.add(offset)
  const line = new Path.Line(p, p.add(vector.multiply(10)))
  const touchingPoint = shape.getIntersections(line)[0].point
  return touchingPoint.subtract(offset)
}

export const getInputsOutputsAndIntersections = (
  project: paper.Project,
  shape: paper.Path
) => {
  const markers = getMarkers(project)

  // Start with a one-based index to be consistent with lua.
  const indexes: Record<string, number> = { in: 1, out: 1, inout: 1 }
  const intersections: paper.Point[] = []

  const inputsOutputs = Object.fromEntries(
    markers.map((marker) => {
      const match = marker.name.match(markerRegExp)
      const signal = match![1] as InputOutput['signal']
      const direction = match![2] as InputOutput['direction']

      const index = indexes[direction]++
      const id = `${signal}-${direction}-${index}` as InputOutput['id']

      const markerIntersections = shape.getIntersections(marker)
      const { length } = markerIntersections
      const { firstSegment, lastSegment } = marker

      const { error } = validateMarker(marker, direction, length)
      if (error) throw new Error(error)

      const vector = firstSegment.point.subtract(lastSegment.point).normalize()
      const angle = +vector.angle.toFixed(2)
      let position = null

      if (direction === 'inout') {
        const a = markerIntersections[0].point
        const b = markerIntersections[length - 1].point
        intersections.push(a, b)
        position = a.add(b.subtract(a).multiply(0.5))
      } else {
        const { point } = markerIntersections[0]
        if (signal === 'midi') intersections.push(point)

        position =
          signal === 'midi'
            ? getMidiPosition(vector, point)
            : getTriggerPosition(vector, point, shape)
      }

      // Make sure we only return x and y values and not a full `paper.Point`.
      position = toXY(position)
      const inputOutput = { id, index, signal, direction, angle, position }
      return [id, inputOutput]
    })
  )

  return { inputsOutputs, intersections }
}
