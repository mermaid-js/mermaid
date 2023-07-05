<script setup lang="ts">
import { VPTeamMembers } from 'vitepress/theme';
import { teamMembers } from '../contributors';
</script>

<template>
  <div class="content">
    <div class="content-container">
      <main class="main">
        <div class="vp-doc" flex flex-col items-center mt-10>
          <h2 id="meet-the-team" op50 font-normal p="t-10 b-2">Meet The Team</h2>
          <div w-full p-10>
            <VPTeamMembers size="small" :members="teamMembers" />
          </div>
          <h2 id="the-team" op50 font-normal pt-5 pb-2>Contributors</h2>
          <p text-lg max-w-200 text-center leading-7>
            <Contributors />
            <br />
            <a href="https://join.slack.com/t/mermaid-talk/shared_invite/enQtNzc4NDIyNzk4OTAyLWVhYjQxOTI2OTg4YmE1ZmJkY2Y4MTU3ODliYmIwOTY3NDJlYjA0YjIyZTdkMDMyZTUwOGI0NjEzYmEwODcwOTE" rel="noopener noreferrer">Join the community</a> and
            get involved!
          </p>
        </div>
      </main>
    </div>
  </div>
</template>
