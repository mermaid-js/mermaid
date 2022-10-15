---
layout: home

title: Mermaid
titleTemplate: Diagramming and charting tool

hero:
  name: Mermaid
  text: Diagramming and charting tool
  tagline: JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically.
  image:
    src: /header.png
    alt: Mermaid
  actions:
    - theme: brand
      text: Get Started
      link: /intro/
    - theme: alt
      text: View on GitHub
      link: https://github.com/mermaid-js/mermaid

features:
  - title: ➕ Easy to use!
    details: Mermaid allows even non-programmers to easily create detailed and diagrams through the Mermaid Live Editor.
  - title: 🎥 Video Tutorials!
    details: Has video tutorials for beginners and advanced users.
  - title: 🏆 Award winner!
    details: Mermaid was nominated and won the JS Open Source Awards (2019) in the category "The most exciting use of technology"!!!
  - title: 🧩 Integrations available!
    details: Use Mermaid with your favorite applications, check out the list of Integrations and Usages of Mermaid.
---

<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/5837277?v=4',
    name: 'Knut Sveidqvist',
    title: 'Creator',
    links: [
      { icon: 'github', link: 'https://github.com/knsv' },
    ]
  },
   {
    avatar: 'https://avatars.githubusercontent.com/u/1912783?v=4',
    name: 'Marc Faber',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://gdfaber.github.io/' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/marc-faber/' },      
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/1564825?v=4',
    name: 'Nacho Orlandoni',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/IOrlandoni' },
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/6552521?v=4',
    name: 'Christian Klemm',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/klemmchr' },
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/12032557?v=4',
    name: 'Mindaugas Laganeckas',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/MindaugasLaganeckas' },
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/58763315?v=4',
    name: 'Neil Cuzon',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/NeilCuzon' },
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/19526120?v=4',
    name: 'Adrian Hall',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/spopida' },
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/53054099?v=4',
    name: 'Yash Singh',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/Yash-Singh1' },
    ]
  },
]
</script>

<div class="vp-doc" >
  <h2 id="meet-the-team"> Meet The Team </h2>
  <VPTeamMembers size="small" :members="members" />
</div>

<style>
  .image-container .image-src {
    margin: 1rem auto;
    max-width: 100%;
  }

  .dark .image-src{
    filter: invert(1) hue-rotate(217deg)  contrast(0.72);
    max-width: 100%;
  }

  .vp-doc {
    align-items: center;
    flex-direction: column;
    display: flex;
    margin-top: 2.5rem;
  }

  .vp-doc h2 {
    margin: 48px 0 16px;
    border-top: 1px solid var(--vp-c-divider-light);
    padding-top: 24px;
    letter-spacing: -.02em;
    line-height: 32px;
    font-size: 24px;
}
</style>
