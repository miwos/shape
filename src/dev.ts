import svg from '../../app/src/assets/shapes/Input.svg'
import { parseSVG } from './svg'

parseSVG(svg, 'shape', document.querySelector('canvas')!)
