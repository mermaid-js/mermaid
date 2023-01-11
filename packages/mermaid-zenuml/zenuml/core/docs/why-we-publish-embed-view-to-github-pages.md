We have got two options to host the embed view: on GitHub pages or
Cloudflare pages (or other third party).

The benefit of Cloudflare pages is:

1. It offers multiple versions. Basically every publish will generate
   a standalone url with current commit hash.
2. It does not require commit the `dist` folder to the repository.

The benefit of using GitHub Pages:

1. It will definitely be easier to set up for collaborators on GitHub,
   because they do not need a Cloudflare account.

Easy collaboration is more important to us, so we will host this on
GitHub Pages.
