import { ShapeLabel } from './types'
import { toPoint } from './utils'

export const markerRegExp = new RegExp(/^label([ _-].*)?$/)

const validateMarker = (marker: paper.Path) => {
  if (marker.segments.length !== 2)
    console.warn(
      `Marker '${marker.name}' should only have two segments but has ${marker.segments.length}.`
    )
}

const getMarkers = (project: paper.Project) =>
  project.getItems({
    match: (item: paper.Path) => item.name?.match(markerRegExp),
    recursive: true,
  }) as paper.Path[]

const getMarkerOptions = (marker: paper.Path) => {
  const match = marker.name.match(/[a-zA-Z0-9]+=[a-zA-Z0-9]+/g)
  return (match && Object.fromEntries(match.map((v) => v.split('=')))) ?? {}
}

export const hideLabelMarkers = (project: paper.Project) =>
  getMarkers(project).forEach((v) => (v.visible = false))

export const getLabels = (project: paper.Project): ShapeLabel[] => {
  const markers = getMarkers(project)

  return markers
    .map((marker) => {
      validateMarker(marker)

      const { firstSegment, lastSegment } = marker
      const vector = firstSegment.point.subtract(lastSegment.point)
      const angle = +vector.angle.toFixed(2) - 180
      const position = toPoint(firstSegment.point)
      const { length } = vector

      return { position, angle, length, ...getMarkerOptions(marker) }
    })
    .reverse()
}
