import paper from 'paper'

export const toXY = (point: paper.Point) => ({ x: point.x, y: point.y })

export const perforatePath = (
  path: paper.Path,
  points: { x: number; y: number }[],
  holeWidth = 24
) => {
  const offsets = points.map((hole) => path.getOffsetOf(new paper.Point(hole)))
  const sorted = offsets.sort((a, b) => a - b)

  let dashOffset = 0
  const dashArray = []

  let lastOffset = 0
  for (const offset of sorted) {
    const holeStart = offset - holeWidth / 2
    const holeEnd = offset + holeWidth / 2
    dashArray.push(holeStart - lastOffset, holeWidth)
    lastOffset = holeEnd
  }
  dashArray.push(path.length - lastOffset)

  const [firstDash] = dashArray
  if (firstDash < 0) {
    dashOffset = firstDash * -1
    dashArray[dashArray.length - 1] += firstDash
    dashArray.push(firstDash * -1)
    dashArray[0] = 0
  }

  const lastDash = dashArray[dashArray.length - 1]
  if (lastDash < 0) {
    dashOffset = lastDash
    dashArray[0] += lastDash
    dashArray[dashArray.length - 1] *= -1
  }

  path.dashArray = dashArray
  path.dashOffset = dashOffset
}
