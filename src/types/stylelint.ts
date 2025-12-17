import stylelint from 'stylelint';

type ConfigExtends = string[];
type ConfigRules = Record<string, stylelint.ConfigRuleSettings<any, object>>;

export interface StylelintOptions {
  plugins?: string[];
  extends?: ConfigExtends;
  overrides?: ConfigRules;
  ignores?: string[];
}
