import { Path } from 'paper/dist/paper-core'
import { toXY } from './utils'

export const markerRegExp = new RegExp(/^(inout|in|out)([_-].*)?$/)

export interface ShapeInputOutput {
  id: `${ShapeInputOutput['direction']}-${ShapeInputOutput['index']}`
  index: number
  direction: 'in' | 'out' | 'inout'
  angle: number
  offset: number
  position: {
    touching?: Point
    inset: Point
  }
  isInOut?: boolean
}

const validateMarker = (
  marker: paper.Path,
  direction: ShapeInputOutput['direction'],
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

const getInsetPosition = (vector: paper.Point, intersection: paper.Point) =>
  intersection
    // @ts-ignore (wrong paper types)
    .add(vector.multiply(14))
    .round()

const getTouchingPosition = (
  vector: paper.Point,
  intersection: paper.Point,
  shape: paper.Path
) => {
  // We make sure that the icon is fitting on the shape and no gap is left. For
  // curved shapes, we therefore need to push the icon into the shape a bit.
  // We first determine where the bottom right corner of the icon would be.
  // @ts-ignore (wrong paper types)
  const iconBaseHalf = vector.rotate(-90).multiply(6)
  const iconBaseRight = intersection.add(iconBaseHalf)
  // Then we create a line at that position pointing into the shape.
  const line = new Path.Line(
    iconBaseRight.subtract(vector.multiply(10)),
    iconBaseRight.add(vector.multiply(10))
  )
  // Where the line intersects with the shape tells us how much we have to push
  // the icon into the shape.
  const touchingPointRight = shape.getIntersections(line)[0].point
  const touchingPointCenter = touchingPointRight.subtract(iconBaseHalf)
  return touchingPointCenter
}

export const getInputsOutputs = (
  project: paper.Project,
  shape: paper.Path
): Record<ShapeInputOutput['id'], ShapeInputOutput> => {
  const markers = getMarkers(project)
  // Start with a one-based index to be consistent with lua.
  const indexes: Record<string, number> = { in: 1, out: 1 }

  const inputsOutputs: Record<ShapeInputOutput['id'], ShapeInputOutput> = {}
  for (const marker of markers) {
    const match = marker.name.match(markerRegExp)
    const direction = match![1] as ShapeInputOutput['direction']

    const markerIntersections = shape.getIntersections(marker)
    const { length } = markerIntersections
    const { firstSegment, lastSegment } = marker

    const { error } = validateMarker(marker, direction, length)
    if (error) throw new Error(error)

    const vector = firstSegment.point.subtract(lastSegment.point).normalize()
    const markerAngle = +vector.angle.toFixed(2)

    if (direction === 'inout') {
      // A marker with direction `inout` is basically a way to add a special
      // input and output that share the same position. So for each `inout`
      // we add an input and and output.
      const a = markerIntersections[0].point
      const b = markerIntersections[length - 1].point
      const position = { inset: toXY(a.add(b.subtract(a).multiply(0.5))) }
      const isInOut = true

      let index = indexes['in']++
      let id = `in-${index}` as ShapeInputOutput['id']
      let offset = shape.getOffsetOf(b)
      let angle = markerAngle + 180
      const input = { id, index, direction, position, angle, offset, isInOut }

      index = indexes['out']++
      id = `out-${index}` as ShapeInputOutput['id']
      offset = shape.getOffsetOf(a)
      angle = markerAngle
      const output = { id, index, direction, position, angle, offset, isInOut }

      inputsOutputs[input.id] = input
      inputsOutputs[output.id] = output
    } else {
      const index = indexes[direction]++
      const id = `${direction}-${index}` as ShapeInputOutput['id']
      const { point } = markerIntersections[0]
      const offset = shape.getOffsetOf(point)
      const position = {
        inset: toXY(getInsetPosition(vector, point)),
        touching: toXY(getTouchingPosition(vector, point, shape)),
      }
      const angle = markerAngle

      inputsOutputs[id] = { id, index, direction, angle, offset, position }
    }
  }

  return inputsOutputs
}
