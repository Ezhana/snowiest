---
title: 'After Moving the Blog to Astro'
description: 'From a static template to Astro content collections, routing, and image handling — and the parts that actually got easier afterward.'
pubDate: '2026-6-12'
tags:
  - engineering
  - design
heroImage: '../../../assets/blog-placeholder-1.jpg'
lang: en
---

The easiest thing to overestimate when migrating a blog is how much a new framework will solve. The easiest thing to underestimate is the content structure itself. With Astro, most of the change happens at three boundaries: content, routing, and the build.

## Content is a collection

Posts no longer have to be welded to a page template. They live as a set of files under `src/content/blog/`, and the title, summary, date, tags, and cover image are declared in frontmatter. Pages only consume that data.

As a result, the listing, tag pages, RSS, and the homepage timeline all read from the same source, so you never get a listing that updated while the RSS feed didn't.

## Routing comes from folders

A post's folder name is part of its URL. The upside is a very low mental load; the cost is that renaming a folder renames the link, so once something is published, keep the folder name stable. The Markdown filename inside can change freely.

## Images are the build's job

Cover images are imported from `src/assets/`, and Astro generates the right sizes and formats. For a personal blog this is more valuable than it sounds: no hand-exported thumbnail set.

## Next

Finishing the migration is not the same as finishing content organization. If tags, drafts, and ordering rules aren't settled up front, every new post repeats the same decision. I'd rather write the rules down first, then start writing.
