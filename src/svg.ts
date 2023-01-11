import { Color, Project, Size } from 'paper/dist/paper-core'
import {
  getConnectors,
  hideConnectorMarkers as hideInputOutputMarkers,
} from './connectors'
import { renderDebugInformation } from './debug'
import { getLabels, hideLabelMarkers } from './labels'
import { getProps, hidePropMarkers } from './props'
import { Shape } from './types'
import { exportSVG } from './utils'

export const parseSVG = (
  id: string,
  svg: string,
  debugCanvas?: HTMLCanvasElement
): Shape => {
  const debug = !!debugCanvas
  const project = new Project(debugCanvas ?? new Size(100, 100))
  const parent = project.importSVG(svg) as paper.Group

  // Remove paper's clip mask.
  parent.firstChild.remove()

  // @ts-ignore
  const path = parent.getItem({
    match: (item: paper.Item) => item.name?.startsWith('shape'),
    recursive: true,
  }) as paper.Path

  // It's import to hide all markers so they don't interfere with the
  // positioning.
  if (!debug) {
    hideInputOutputMarkers(project)
    hidePropMarkers(project)
    hideLabelMarkers(project)
    project.view.viewSize = parent.bounds.size.round()
  }

  parent.position = project.view.center
  const outline = path.clone()
  outline.name = 'outline'
  outline.strokeColor = new Color('black')
  const { length } = outline

  const props = getProps(project, path)
  const { inputs, outputs } = getConnectors(project, path)
  const labels = getLabels(project)

  const pathSVG = exportSVG(path)
  const outlineSVG = exportSVG(outline)

  const { width, height } = project.view.bounds
  const size = { width, height }

  if (debug) {
    renderDebugInformation(outline, inputs, outputs, props, labels)
  } else {
    project.remove()
  }

  return {
    id,
    props,
    size,
    length,
    inputs,
    outputs,
    labels,
    path: pathSVG,
    outline: outlineSVG,
  }
}
