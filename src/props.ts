import { Path, Point } from 'paper/dist/paper-core'
import { toXY } from './utils'
// @ts-ignore
import { OffsetUtils } from './OffsetUtils.js'

export interface PropsSide {
  one: Point
  two: Point[]
  three: Point[]
}

const propGap = 30 //px

const validateMarker = (marker: paper.Path, intersectionsCount: number) => {
  let error

  if (marker.segments.length !== 2) {
    console.warn(
      `Marker '${marker.name}' should only have two segments but has ${marker.segments.length}.`
    )
  }

  if (!intersectionsCount) {
    error = `Marker '${marker.name}' needs an intersection with shape.`
  }

  if (intersectionsCount > 1)
    console.warn(
      `Marker '${marker.name}' should only have one intersection with shape but has ${intersectionsCount}.`
    )

  return { error }
}

const validateMarkers = (markers: paper.Path[]) => {
  let error
  if (markers.length > 2) {
    error = `There shouldn't be more then two props-anchors, found ${markers.length}.`
  }
  return { error }
}

const getMarkers = (project: paper.Project) =>
  project.getItems({
    match: (item: paper.Item) => item.name?.startsWith('props'),
    recursive: true,
  }) as paper.Path[]

export const hideMarkers = (project: paper.Project) =>
  getMarkers(project).forEach((v) => (v.visible = false))

const getPropPosition = (
  reference: paper.Point,
  side: 'left' | 'right',
  shape: paper.Path
) => {
  const line = new Path.Line(shape.bounds.topLeft, shape.bounds.topRight)
  line.position.y = reference.y

  const intersections = shape
    .getIntersections(line)
    .sort((a, b) => a.point.x - b.point.x)

  if (side === 'left') intersections.reverse()

  return toXY(
    intersections[intersections.length - 1]?.point ??
      new Point(shape.getNearestPoint(reference).x, reference.y)
  )
}

const getPropPositions = (
  marker: paper.Path,
  shape: paper.Path,
  offsetShape: paper.Path,
  side: 'left' | 'right'
): PropsSide => {
  const intersections = shape.getIntersections(marker)

  const { error } = validateMarker(marker, intersections.length)
  if (error) throw new Error(error)

  const { point } = shape.getIntersections(marker)[0]

  return {
    one: getPropPosition(point, side, offsetShape),
    two: [
      getPropPosition(
        point.add({ x: 0, y: propGap / 2 } as any),
        side,
        offsetShape
      ),
      getPropPosition(
        point.add({ x: 0, y: -propGap / 2 } as any),
        side,
        offsetShape
      ),
    ],
    three: [
      getPropPosition(
        point.add({ x: 0, y: propGap } as any),
        side,
        offsetShape
      ),
      getPropPosition(point, side, offsetShape),
      getPropPosition(
        point.add({ x: 0, y: -propGap } as any),
        side,
        offsetShape
      ),
    ],
  }
}

export const getProps = (project: paper.Project, shape: paper.Path) => {
  const markers = getMarkers(project)
  if (markers.length === 0) throw new Error('No prop markers found.')

  const { error } = validateMarkers(markers)
  if (error) throw new Error(error)

  // Create an offset of shape that we can use as the gap between the props
  // and the original shape.
  const flattenedShape = shape.clone()
  // Flattening seems necessary to prevent some offsetting edge cases.
  flattenedShape.flatten()
  // A round stroke join seems to yield the most consistent results.
  flattenedShape.strokeJoin = 'round'
  let offsetShape = OffsetUtils.offsetPath(flattenedShape, 20)
  offsetShape = offsetShape.unite()

  // For debugging only:
  offsetShape.strokeColor = 'blue'
  project.activeLayer.addChild(offsetShape)

  // The right side is the default side and the left side is only used if the
  // right side is full. So if only one marker is present, we expect it to be
  // the right side marker.
  markers.sort((a, b) => b.position.x - a.position.x)
  const [rightMarker, leftMarker] = markers

  return {
    left:
      leftMarker && getPropPositions(leftMarker, shape, offsetShape, 'left'),
    right:
      rightMarker && getPropPositions(rightMarker, shape, offsetShape, 'right'),
  }
}
