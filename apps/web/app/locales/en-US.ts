import type { MessageValue } from './types'

export default {
  site: {
    title: 'Snowiest',
    description: 'Notes on writing, systems, and the web.',
    sections: {
      journal: 'Snowiest Journal',
      latestPosts: 'Latest Posts',
    },
    nav: {
      home: 'Home',
      posts: 'Posts',
      tags: 'Tags',
      about: 'About',
    },
    footer: {
      rss: 'RSS',
      about: 'About',
    },
  },
  home: {
    hero: {
      title: 'Write clearly. Read slowly.',
      description: 'A blog system for essays, notes, and collected links. The homepage should frame a point of view, then surface recent writing without feeling crowded.',
    },
    spotlight: {
      title: 'Publishing rhythm',
      description: 'Essays on product thinking, interface systems, and the mechanics of writing on the web.',
      cadenceLabel: 'Cadence',
      cadenceValue: 'Weekly',
      formatLabel: 'Format',
      formatValue: 'Essay + Notes',
    },
    posts: {
      heading: 'Recent writing and drafts',
      archive: 'View archive',
      readArticle: 'Read article',
    },
    featuredPosts: {
      editorialHomepage: {
        category: 'Design',
        title: 'Designing a homepage that reads like an editorial front page',
        excerpt: 'Treat the homepage as a reading surface first, then layer navigation and metadata around that reading flow.',
      },
      themeTokens: {
        category: 'Frontend',
        title: 'Token-driven themes keep interface decisions coherent',
        excerpt: 'Use semantic tokens for background, surface, border, text, and actions, then let components compose from them.',
      },
      scannableLayouts: {
        category: 'Writing',
        title: 'A blog layout should optimize for scanning before commitment',
        excerpt: 'Headlines, summaries, and metadata need a stable rhythm so readers can decide what deserves a closer read.',
      },
    },
  },
  controls: {
    theme: {
      label: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    locale: {
      label: 'Language',
    },
  },
} as const satisfies MessageValue
