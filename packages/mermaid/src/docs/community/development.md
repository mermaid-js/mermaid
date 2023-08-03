<script setup lang="ts">
import { ref } from 'vue';
type Platform = "native" | "docker";
const selectedPlatform = ref<Platform>("native");
const handlePlatformChange = (newPlatform: Platform) => {
  selectedPlatform.value = newPlatform;
}
</script>

<style>

.platform-button {
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  border: 1px solid transparent;
  border-color: var(--vp-button-alt-border);
  color: var(--vp-button-alt-text);
  background-color: var(--vp-button-alt-bg);
}

.platform-button:hover {
  border-color: var(--vp-button-alt-hover-border);
  color: var(--vp-button-alt-hover-text);
  background-color: var(--vp-button-alt-hover-bg);
}

.platform-button--selected {
  border-color: var(--vp-button-brand-border);
  color: var(--vp-button-brand-text);
  background-color: var(--vp-button-brand-bg);
}

.platform-button--selected:hover {
  border-color: var(--vp-button-brand-hover-border);
  color: var(--vp-button-brand-hover-text);
  background-color: var(--vp-button-brand-hover-bg);
}
</style>

# Contributing to Mermaid

## Contents

- [Technical Requirements and Setup](#technical-requirements-and-setup)
- [Contributing Code](#contributing-code)
- [Contributing Documentation](#contributing-documentation)
- [Questions or Suggestions?](#questions-or-suggestions)
- [Last Words](#last-words)

---

So you want to help? That's great!

![Image of happy people jumping with excitement](https://media.giphy.com/media/BlVnrxJgTGsUw/giphy.gif)

Here are a few things to get you started on the right path.

## Get the Source Code

In GitHub, you first **fork** a repository when you are going to make changes and submit pull requests.

Then you **clone** a copy to your local development machine (e.g. where you code) to make a copy with all the files to work with.

[Fork mermaid](https://github.com/mermaid-js/mermaid/fork) to start contributing to the main project and its documentaion, or [search for other repositories](https://github.com/orgs/mermaid-js/repositories).

[Here is a GitHub document that gives an overview of the process.](https://docs.github.com/en/get-started/quickstart/fork-a-repo)

## Install the Requirements

For [mermaid repository](https://github.com/mermaid-js/mermaid) we also support local development in Docker.
So you can install everything natively on your machine or in Docker by your choice.

<div class="platform space-x-2 flex rounded-lg items-center">
  <p class="font-semibold">Platform:</p>
  <button class="platform-button font-semibold rounded-full px-4 py-1" :class="{ 'platform-button--selected': selectedPlatform === 'native' }" @click="handlePlatformChange('native')">
    Native
  </button>
  <button class="platform-button font-semibold rounded-full px-4 py-1" :class="{ 'platform-button--selected': selectedPlatform === 'docker' }" @click="handlePlatformChange('docker')">
    Docker
  </button>
</div>

<div v-if="selectedPlatform === 'native'">

These are the tools we use for working with the code and documentation:

- [volta](https://volta.sh/) to manage node versions.
- [Node.js](https://nodejs.org/en/). `volta install node`
- [pnpm](https://pnpm.io/) package manager. `volta install pnpm`
- [npx](https://docs.npmjs.com/cli/v8/commands/npx) the packaged executor in npm. This is needed [to install pnpm.](#install-packages)

Follow [the setup steps below](#setup) to install them and start the development

</div>

<div v-if="selectedPlatform === 'docker'">

[Install Docker](https://docs.docker.com/engine/install/). And that is pretty much all you need.

Optionally, to run GUI (Cypress) within Docker you will also need X11 server insatlled.
Maybe you already have it installed, so check it first:

```bash
echo $DISPLAY
```
If variable `$DISPLAY` is not empty, then it must be working. Otherwise install it.

</div>

## Setup and Launch

<div class="platform space-x-2 flex rounded-lg items-center">
  <p class="font-semibold">Platform:</p>
  <button class="platform-button font-semibold rounded-full px-4 py-1" :class="{ 'platform-button--selected': selectedPlatform === 'native' }" @click="handlePlatformChange('native', '#setup')">
    Native
  </button>
  <button class="platform-button font-semibold rounded-full px-4 py-1" :class="{ 'platform-button--selected': selectedPlatform === 'docker' }" @click="handlePlatformChange('docker', '#setup')">
    Docker
  </button>
</div>

### Switch to project

Once you have cloned the repository onto your development machine, change into the `mermaid` project folder (the top level directory of the mermaid project repository)

```bash
cd mermaid
```

<div v-if="selectedPlatform === 'native'">
</div>

<div v-if="selectedPlatform === 'docker'">

### Make `./run` executable

For development using Docker there is a self-documented `run` bash script, which provides convenient aliases for `docker compose` commands.

Ensure `./run` script is executable:

```bash
chmod +x run
```

::: tip
To get detailed help simply type `./run` or `./run help`.
It also has short _Development quick start guide_ embedded.
:::
</div>

### Install packages

<div v-if="selectedPlatform === 'native'">

Run `npx pnpm install`. You will need `npx` for this because volta doesn't support it yet.

```bash
npx pnpm install # npx is required for first install
```
</div>

<div v-if="selectedPlatform === 'docker'">

```bash
./run pnpm install  # Install packages
```
</div>

### Launch

<div v-if="selectedPlatform === 'native'">

```bash
npx pnpm run dev
```
</div>
<div v-if="selectedPlatform === 'docker'">

```bash
./run dev
```
</div>

Open http://localhost:9000 and you will see demo pages.

> Now you are ready to make your changes!
> Edit whichever files in `src` as required.
> 
> Open <http://localhost:9000> in your browser, after starting the dev server.
> There is a list of demos that can be used to see and test your changes.
> 
> If you need a specific diagram, you can duplicate the `example.html` file in `/demos/dev` and add your own mermaid code to your copy.
> That will be served at <http://localhost:9000/dev/your-file-name.html>.
> After making code changes, the dev server will rebuild the mermaid library. You will need to reload the browser page yourself to see the changes. (PRs for auto reload are welcome!)
> 

### Verify Everything Is Working

> Once you have installed pnpm, you can run the `test` script to verify that pnpm is working _and_ that the repository has been cloned correctly:
> ```bash
> pnpm test
> ```
> The `test` script and others are in the top-level `package.json` file.
> All tests should run successfully without any errors or failures. (You might see _lint_ or _formatting_ "warnings"; those are ok during this step.)



<div v-if="selectedPlatform === 'native'">

You can run the `test` script to verify that pnpm is working _and_ that the repository has been cloned correctly:

```bash
pnpm test
```
</div>

<div v-if="selectedPlatform === 'docker'">

```bash
./run pnpm test
```

</div>

The `test` script and others are in the top-level `package.json` file.

All tests should run successfully without any errors or failures. (You might see _lint_ or _formatting_ warnings; those are ok during this step.)


## Last Words

Don't get daunted if it is hard in the beginning. We have a great community with only encouraging words. So, if you get stuck, ask for help and hints in the Slack forum. If you want to show off something good, show it off there.

[Join our Slack community if you want closer contact!](https://join.slack.com/t/mermaid-talk/shared_invite/enQtNzc4NDIyNzk4OTAyLWVhYjQxOTI2OTg4YmE1ZmJkY2Y4MTU3ODliYmIwOTY3NDJlYjA0YjIyZTdkMDMyZTUwOGI0NjEzYmEwODcwOTE)

![Image of superhero wishing you good luck](https://media.giphy.com/media/l49JHz7kJvl6MCj3G/giphy.gif)
