import { stylelint } from './configs/stylelint';
import { StylelintOptions } from './types/stylelint';

export function OBStylelintCfg(options?: StylelintOptions) {
  return stylelint(options);
}
