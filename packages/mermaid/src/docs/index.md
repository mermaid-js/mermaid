---
layout: home

title: Mermaid
titleTemplate: Diagramming and charting tool

hero:
  name: Mermaid
  text: Diagramming and charting tool
  tagline: JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically.
  image:
    src: /mermaid-logo.svg
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
    details: Easily create and render detailed diagrams and charts with the Mermaid Live Editor.
    link: https://mermaid.live/
  - title: 🎥 Video Tutorials!
    details: Curated list of video tutorials and examples created by the community.
    link: ../../config/Tutorials.html
  - title: 🧩 Integrations available!
    details: Use Mermaid with your favorite applications, check out the integrations list.
    link: ../../misc/integrations.md
  - title: 🏆 Award winning!
    details: 2019 JavaScript Open Source Award winner for "The Most Exciting Use of Technology".
    link: https://osawards.com/javascript/2019
---

<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const websiteSVG = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-globe"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'
}

const members = [
  {
    avatar: "https://avatars.githubusercontent.com/u/5837277?v=4",
    name: "Knut Sveidqvist",
    title: "Creator",
    links: [{ icon: "github", link: "https://github.com/knsv" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/58763315?v=4",
    name: "Neil Cuzon",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/NeilCuzon" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/733544?v=4",
    name: "Tyler Liu",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/tylerlong" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/10703445?v=4",
    name: "Sidharth Vinod",
    title: "Developer",
    links: [
      { icon: "github", link: "https://github.com/sidharthv96" },
      { icon: websiteSVG, link: "https://sidharth.dev" },
      { icon: "linkedin", link: "https://www.linkedin.com/in/sidharth-vinod/" },
    ],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/16836093?v=4",
    name: "Ashish Jain",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/ashishjain0512" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/6032561?v=4",
    name: "Matthieu Morel",
    title: "Developer",
    links: [
      { icon: "github", link: "https://github.com/mmorel-35" },
      {
        icon: "linkedin",
        link: "https://www.linkedin.com/in/matthieumorel35/",
      },
    ],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/6552521?v=4",
    name: "Christian Klemm",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/klemmchr" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/19716675?v=4",
    name: "Alois Klink",
    title: "Developer",
    links: [
      { icon: "github", link: "https://github.com/aloisklink" },
      { icon: websiteSVG, link: "https://aloisklink.com" },
      { icon: "linkedin", link: "https://www.linkedin.com/in/aloisklink/" },
    ],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/114684273?v=4",
    name: "Per Brolin",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/pbrolin47" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/53054099?v=4",
    name: "Yash Singh",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/Yash-Singh1" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/1912783?v=4",
    name: "Marc Faber",
    title: "Developer",
    links: [
      { icon: "github", link: "https://gdfaber.github.io/" },
      { icon: "linkedin", link: "https://www.linkedin.com/in/marc-faber/" },
    ],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/12032557?v=4",
    name: "Mindaugas Laganeckas",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/MindaugasLaganeckas" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/300077?v=4",
    name: "Justin Greywolf",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/jgreywolf" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/1564825?v=4",
    name: "Nacho Orlandoni",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/IOrlandoni" }],
  },
  {
    avatar: "https://avatars.githubusercontent.com/u/19526120?v=4",
    name: "Adrian Hall",
    title: "Developer",
    links: [{ icon: "github", link: "https://github.com/spopida" }],
  },
];

</script>

<div class="vp-doc" >
  <h2 id="meet-the-team"> Meet The Team </h2>
  <VPTeamMembers size="small" :members="members" />
</div>

<style>
  .image-container .image-src {
    margin: 1rem auto;
    max-width: 100%;
    width: 100%;
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
