import { Color, Project } from 'paper/dist/paper-core'
import { getInputsOutputsAndIntersections } from '.'
import { renderDebugInformation } from './debug'
import {
  InputOutput,
  hideMarkers as hideInputOutputMarkers,
} from './input-output'
import { getProps, PropsSide, hideMarkers as hidePropMarkers } from './prop'
import { perforatePath, removeAttributes, toWidthHeight } from './utils'

export interface Shape {
  id: string
  path: string
  outline: string
  size: { width: number; height: number }
  inputsOutputs: Record<InputOutput['id'], InputOutput>
  props: { left: PropsSide; right: PropsSide }
}

const exportSVG = (item: paper.Item, keepAttributes: string[] = []) => {
  const svg = item.exportSVG({ asString: true }) as string
  return removeAttributes(
    svg,
    ['id', 'style', 'stroke*', 'font*', 'fill*', 'text*'],
    keepAttributes
  )
}

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
    parent.position = project.view.center
  }

  const props = getProps(project, path)!

  const outline = path.clone()
  outline.name = 'outline'
  outline.strokeColor = new Color('black')

  const { inputsOutputs, intersections } = getInputsOutputsAndIntersections(
    project,
    path
  )
  perforatePath(outline, intersections)

  const pathSVG = exportSVG(path)
  const outlineSVG = exportSVG(outline, [
    'stroke-dasharray',
    'stroke-dashoffset',
  ])

  const size = toWidthHeight(project.view.bounds)

  if (debug) {
    renderDebugInformation(inputsOutputs, props)
  } else {
    project.remove()
  }

  return { id, inputsOutputs, props, size, path: pathSVG, outline: outlineSVG }
}
