import type { MessageValue } from './types';

export default {
  site: {
    title: 'Snowiest',
    description: '关于写作、系统与 Web 的记录。',
    sections: {
      journal: 'Snowiest Journal',
      latestPosts: '最新文章',
    },
    nav: {
      home: '首页',
      posts: '文章',
      tags: '标签',
      about: '关于',
    },
    footer: {
      rss: 'RSS',
      about: '关于',
    },
  },
  home: {
    hero: {
      title: '写得清晰，读得从容。',
      description:
        '一个用于承载随笔、笔记与链接整理的博客系统。首页应该先表达立场，再自然地展示最新内容。',
    },
    spotlight: {
      title: '更新节奏',
      description: '围绕产品思考、界面系统与 Web 写作机制展开的长文与短记。',
      cadenceLabel: '频率',
      cadenceValue: '每周',
      formatLabel: '形式',
      formatValue: '随笔 + 笔记',
    },
    posts: {
      heading: '最新发布与草稿',
      archive: '查看归档',
      readArticle: '阅读全文',
    },
    featuredPosts: {
      editorialHomepage: {
        category: '设计',
        title: '把首页当作一张可阅读的编排前页',
        excerpt:
          '首页首先应该是一块阅读界面，其次才是导航容器，信息层级要服务于阅读流。',
      },
      themeTokens: {
        category: '前端',
        title: '以 token 驱动主题，界面决策才会一致',
        excerpt:
          '背景、表面、边框、文字和动作色应该由语义 token 驱动，而不是在组件里散写具体颜色。',
      },
      scannableLayouts: {
        category: '写作',
        title: '博客列表页应先服务扫描，再服务点击',
        excerpt:
          '标题、摘要和元信息要形成稳定节奏，读者才能快速判断哪篇值得深入阅读。',
      },
    },
  },
  controls: {
    theme: {
      label: '主题',
      light: '浅色',
      dark: '深色',
      system: '跟随系统',
    },
    locale: {
      label: '语言',
    },
  },
} as const satisfies MessageValue;
