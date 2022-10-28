export const perforatePath = (
  pathLength: number,
  holeOffsets: number[],
  holeWidth = 24
) => {
  const sortedOffsets = holeOffsets.sort((a, b) => a - b)

  let dashOffset = 0
  const dashArray = []

  let lastOffset = 0
  for (const offset of sortedOffsets) {
    const holeStart = offset - holeWidth / 2
    const holeEnd = offset + holeWidth / 2
    dashArray.push(holeStart - lastOffset, holeWidth)
    lastOffset = holeEnd
  }
  dashArray.push(pathLength - lastOffset)

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

  return { dashArray, dashOffset }
}
