const replaceIdWithClass = (svg: string) => svg.replaceAll(' id="', ' class="')

const removeAttributes = (
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

const cleanUpSVG = (svg: string) => {
  svg = replaceIdWithClass(svg)
  svg = removeAttributes(svg, ['style', 'stroke*', 'font*', 'fill*', 'text*'])
  return svg
}

export const exportSVG = (item: paper.Item) =>
  cleanUpSVG(item.exportSVG({ asString: true }) as string)
