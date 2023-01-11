// Fix some missing method overloads for paper.js
declare global {
  namespace paper {
    interface Point {
      rotate(angel: number): paper.Point
    }
  }
}

export interface Point {
  x: number
  y: number
}

export type Side = 'left' | 'right'

export interface Shape {
  id: string
  path: string
  outline: string
  length: number
  size: { width: number; height: number }
  inputs: ShapeConnector[]
  outputs: ShapeConnector[]
  props: { left: ShapeProps; right: ShapeProps }
  labels: ShapeLabel[]
}

export interface ShapeProps {
  one: Point
  two: [Point, Point]
  three: [Point, Point, Point]
}

export interface ShapeLabel {
  position: Point
  angle: number
  length: number
  align?: 'left' | 'right' | 'center'
}

export interface ShapeConnector {
  angle: number
  offset: number
  positions: {
    outline?: Point
    inset: Point
  }
  thru?: boolean
}
