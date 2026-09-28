/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 节假日数据接口地址，来自 .env，禁止写死在代码里 */
  readonly VITE_HOLIDAY_API?: string;
  /** 数据拉取超时（毫秒） */
  readonly VITE_HOLIDAY_TIMEOUT?: string;
}
