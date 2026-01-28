export const defaultDesignTokens: Record<string, string> = {
  /* ================= 基础颜色 ================= */
  '--ob-white': '#ffffff',
  '--ob-black': '#000000',

  '--ob-gray-1': '#fbfcfe',
  '--ob-gray-2': '#f5f7fc',
  '--ob-gray-3': '#ebeff7',
  '--ob-gray-4': '#e2e8f3',
  '--ob-gray-5': '#cdd5e4',
  '--ob-gray-6': '#b6c0d4',
  '--ob-gray-7': '#8592ad',
  '--ob-gray-8': '#5c6b8a',
  '--ob-gray-9': '#3b4a69',
  '--ob-gray-10': '#132039',

  '--ob-blue-1': '#f3f8fe',
  '--ob-blue-2': '#b3d3ff',
  '--ob-blue-3': '#619ef3',
  '--ob-blue-4': '#0d6cf2',
  '--ob-blue-5': '#0852bb',
  '--ob-blue-6': '#0d3c80',

  '--ob-green-1': '#f5faf8',
  '--ob-green-2': '#b3e6d5',
  '--ob-green-3': '#79d1b4',
  '--ob-green-4': '#16b882',
  '--ob-green-5': '#0a8c61',
  '--ob-green-6': '#09593f',

  '--ob-orange-1': '#fff9ee',
  '--ob-orange-2': '#ffe7c2',
  '--ob-orange-3': '#fac373',
  '--ob-orange-4': '#f49f25',
  '--ob-orange-5': '#ac690b',
  '--ob-orange-6': '#6c4408',

  '--ob-red-1': '#fff2f2',
  '--ob-red-2': '#ffd6d6',
  '--ob-red-3': '#f69898',
  '--ob-red-4': '#eb4242',
  '--ob-red-5': '#b52727',
  '--ob-red-6': '#8a1b1b',

  '--ob-fuchsia-1': '#faf0fc',
  '--ob-fuchsia-2': '#e8caee',
  '--ob-fuchsia-3': '#d88ee7',
  '--ob-fuchsia-4': '#b04ec4',
  '--ob-fuchsia-5': '#802792',
  '--ob-fuchsia-6': '#580e67',

  /* ================= 语义颜色：背景 ================= */
  '--ob-color-bg-default': '#ffffff',
  '--ob-color-bg-primary': '#fbfcfe',
  '--ob-color-bg-secondary': '#f5f7fc',
  '--ob-color-bg-hover': '#f5f7fc',
  '--ob-color-bg-hover-secondary': '#ebeff7',
  '--ob-color-bg-focus': '#ebeff7',
  '--ob-color-bg-selected': '#0d6cf2',
  '--ob-color-bg-disabled': '#ebeff7',

  /* ================= 边框色 ================= */
  '--ob-color-divider': '#e2e8f3',
  '--ob-color-border-default': '#cdd5e4',
  '--ob-color-border-container': '#e2e8f3',
  '--ob-color-border-inverse': '#ffffff',
  '--ob-color-border-hover': '#8592ad',
  '--ob-color-border-focus': '#0d6cf2',
  '--ob-color-border-error': '#eb4242',
  '--ob-color-border-warning': '#f49f25',

  /* ================= 文本色 ================= */
  '--ob-color-text-default': '#132039',
  '--ob-color-text-navigation': '#3b4a69',
  '--ob-color-text-label': '#5c6b8a',
  '--ob-color-text-description': '#8592ad',
  '--ob-color-text-disabled': '#b6c0d4',
  '--ob-color-text-focus': '#132039',
  '--ob-color-text-selected': '#0d6cf2',
  '--ob-color-text-link': '#0d6cf2',
  '--ob-color-text-inverse': '#ffffff',

  /* ================= 图标色 ================= */
  '--ob-color-icon-default': '#5c6b8a',
  '--ob-color-icon-hover': '#0d6cf2',
  '--ob-color-icon-disabled': '#b6c0d4',
  '--ob-color-icon-focus': '#0d6cf2',
  '--ob-color-icon-inverse': '#ffffff',
  '--ob-color-icon-info': '#0d6cf2',
  '--ob-color-icon-warning': '#f49f25',
  '--ob-color-icon-success': '#16b882',
  '--ob-color-icon-error': '#eb4242',

  /* ================= 状态色 ================= */
  '--ob-color-default-text': '#132039',
  '--ob-color-default-icon': '#5c6b8a',
  '--ob-color-default-fill': '#f5f7fc',
  '--ob-color-default-border': '#f5f7fc',

  '--ob-color-info-text': '#0d3c80',
  '--ob-color-info-icon': '#0d3c80',
  '--ob-color-info-fill': '#f3f8fe',
  '--ob-color-info-border': '#619ef3',

  '--ob-color-success-text': '#09593f',
  '--ob-color-success-icon': '#09593f',
  '--ob-color-success-fill': '#f5faf8',
  '--ob-color-success-border': '#79d1b4',

  '--ob-color-warning-text': '#6c4408',
  '--ob-color-warning-icon': '#6c4408',
  '--ob-color-warning-fill': '#fff9ee',
  '--ob-color-warning-border': '#fac373',

  '--ob-color-error-text': '#8a1b1b',
  '--ob-color-error-icon': '#8a1b1b',
  '--ob-color-error-fill': '#fff2f2',
  '--ob-color-error-border': '#f69898',

  '--ob-color-critical-text': '#580e67',
  '--ob-color-critical-icon': '#580e67',
  '--ob-color-critical-fill': '#faf0fc',
  '--ob-color-critical-border': '#d88ee7',

  /* ================= 字体 ================= */
  '--ob-font-family-default':
    "Inter, 'Noto Sans', sans-serif, Roboto, 'Open Sans', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, 'Apple Color Emoji'",

  '--ob-font-weight-sm': '300',
  '--ob-font-weight-md': '500',
  '--ob-font-weight-lg': '600',

  '--ob-font-size-300': '12px',
  '--ob-font-size-325': '13px',
  '--ob-font-size-400': '16px',
  '--ob-font-size-450': '18px',
  '--ob-font-size-500': '20px',

  '--ob-font-line-height-500': '20px',
  '--ob-font-line-height-600': '24px',
  '--ob-font-line-height-650': '26px',
  '--ob-font-line-height-700': '28px',

  '--ob-font-h1': '500 20px/28px var(--ob-font-family-default)',
  '--ob-font-h2': '500 18px/26px var(--ob-font-family-default)',
  '--ob-font-h3': '500 16px/24px var(--ob-font-family-default)',
  '--ob-font-h4': '500 13px/20px var(--ob-font-family-default)',
  '--ob-font-body1': '400 13px/20px var(--ob-font-family-default)',
  '--ob-font-body2': '400 12px/20px var(--ob-font-family-default)',
  '--ob-font-caption': '400 12px/20px var(--ob-font-family-default)',

  /* ================= 圆角 ================= */
  '--ob-radius-sm': '4px',
  '--ob-radius-md': '6px',
  '--ob-radius-lg': '8px',

  /* ================= 阴影 ================= */
  '--ob-shadow-1-top': '0px -1px 2px 0px hsla(219, 50%, 15%, 0.1)',
  '--ob-shadow-1-bottom': '0px 1px 2px 0px hsla(219, 50%, 15%, 0.1)',
  '--ob-shadow-1-left': '-1px 0px 2px 0px hsla(219, 50%, 15%, 0.1)',
  '--ob-shadow-1-right': '1px 0px 2px 0px hsla(219, 50%, 15%, 0.1)',
  '--ob-shadow-2':
    '0 6px 16px 0 rgba(54, 69, 99, 0.08), 0 3px 6px -4px rgba(54, 69, 99, 0.12), 0 9px 28px 8px rgba(54, 69, 99, 0.05)',

  /* ================= 间距 ================= */
  '--ob-space-0': '0px',
  '--ob-space-50': '2px',
  '--ob-space-100': '4px',
  '--ob-space-150': '6px',
  '--ob-space-200': '8px',
  '--ob-space-300': '12px',
  '--ob-space-400': '16px',
  '--ob-space-500': '20px',
  '--ob-space-600': '24px',
  '--ob-space-800': '32px',

  /* ================= 组件 ================= */
  '--ob-navi-color-bg': '#f1f6ff',
  '--ob-navi-color-bg-hover': '#e8effb',
  '--ob-navi-color-bg-focus': '#e8effb',

  '--ob-btn-color-primary-bg': '#0d6cf2',
  '--ob-btn-color-primary-bg-hover': '#0852bb',
  '--ob-btn-color-primary-bg-disabled': '#619ef3',
  '--ob-btn-color-primary-text': '#ffffff',
  '--ob-btn-color-primary-icon': '#ffffff',

  '--ob-btn-color-secondary-border': '#0d6cf2',
  '--ob-btn-color-secondary-text': '#0d6cf2',
  '--ob-btn-color-secondary-icon': '#0d6cf2',

  '--ob-btn-color-danger-border': '#eb4242',
  '--ob-btn-color-danger-text': '#eb4242',

  '--ob-progress-color-bg-default': '#e2e8f3',
  '--ob-progress-color-bg-loading': '#0d6cf2',
  '--ob-progress-color-bg-success': '#16b882',
  '--ob-progress-color-bg-error': '#eb4242',

  '--ob-switch-color-bg-default': '#8592ad',
  '--ob-switch-color-bg-disabled': '#e2e8f3',
  '--ob-switch-color-bg-active': '#0d6cf2',
  '--ob-switch-color-bg-disabled-selected': '#cdd5e4',
};
