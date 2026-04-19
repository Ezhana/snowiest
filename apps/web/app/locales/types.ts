export type MessageValue = string | { [key: string]: MessageValue }

export type AppLocale = 'zh-CN' | 'en-US'

export type MessageRecord = { [key: string]: MessageValue }

export type LeafPaths<T> = T extends string
  ? never
  : {
      [K in keyof T & string]:
        T[K] extends string
          ? K
          : T[K] extends MessageRecord
            ? `${K}.${LeafPaths<T[K]>}`
            : never
    }[keyof T & string]
