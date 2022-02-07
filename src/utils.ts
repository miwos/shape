const replaceIdWithClass = (svg: string) => svg.replaceAll(' id="', ' class="')

export const removeAttributes = (
  svg: string,
  remove: string[],
  keep: string[] = []
) => {
  const matchAttribute = (name: string, mask: string) =>
    mask.endsWith('*') ? name.startsWith(mask.slice(0, -1)) : name === mask

  return svg.replaceAll(/\s([a-z-]+)="[^"]*"/g, (match, attribute) => {
    const shouldRemove =
      !keep.find((el) => matchAttribute(attribute, el)) &&
      !!remove.find((el) => matchAttribute(attribute, el))

    return shouldRemove ? '' : match
  })
}

export const cleanUpSVG = (svg: string) => {
  svg = replaceIdWithClass(svg)

  const remove = ['style', 'stroke*', 'font*', 'fill*', 'text*']
  const keep = ['stroke-dasharray', 'stroke-dashoffset']
  svg = removeAttributes(svg, remove, keep)

  return svg
}

export const toXY = ({ x, y }: paper.Point) => ({ x, y })

export const toWidthHeight = ({ width, height }: paper.Rectangle) => ({
  width,
  height,
})

export const perforatePath = (
  path: paper.Path,
  points: { x: number; y: number }[],
  holeWidth = 24
) => {
  const offsets = points.map((hole) => path.getOffsetOf(hole as any))
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
