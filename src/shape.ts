import { Color, Project } from 'paper/dist/paper-core'
import { renderDebugInformation } from './debug'
import {
  getInputsOutputs,
  hideMarkers as hideInputOutputMarkers,
  ShapeInputOutput,
} from './inputsOutputs'
import { getProps, hideMarkers as hidePropMarkers, PropsSide } from './props'
import { cleanUpSVG, toWidthHeight } from './utils'

export interface Shape {
  id: string
  path: string
  outline: string
  length: number
  size: { width: number; height: number }
  inputsOutputs: Map<ShapeInputOutput['id'], ShapeInputOutput>
  props: { left: PropsSide; right: PropsSide }
}

const exportSVG = (item: paper.Item) =>
  cleanUpSVG(item.exportSVG({ asString: true }) as string)

export const compileShape = (
  svg: string,
  id: string,
  debugCanvas?: HTMLCanvasElement
): Shape => {
  const debug = !!debugCanvas
  const project = new Project(debugCanvas as any)
  const parent = project.importSVG(svg) as paper.Group

  // Get rid of paper's clip mask.
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
    project.view.viewSize = parent.bounds.size.round()
  }

  parent.position = project.view.center
  const outline = path.clone()
  outline.name = 'outline'
  outline.strokeColor = new Color('black')
  const { length } = outline

  const props = getProps(project, path)
  const inputsOutputs = getInputsOutputs(project, path)

  const pathSVG = exportSVG(path)
  const outlineSVG = exportSVG(outline)

  const size = toWidthHeight(project.view.bounds)

  if (debug) {
    renderDebugInformation(outline, inputsOutputs, props)
  } else {
    project.remove()
  }

  return {
    id,
    inputsOutputs,
    props,
    size,
    length,
    path: pathSVG,
    outline: outlineSVG,
  }
}
