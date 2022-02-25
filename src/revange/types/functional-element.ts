import { HTMLResult } from '../template/html-result'
import { RevangeElement } from './revange-element'

export interface FE {
  (elementRef: RevangeElement): {
    (): HTMLResult
  }
}
