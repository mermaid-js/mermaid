---
sort: 1
title: Development and Contribution
---

# Development 🙌


So you want to help? That's great!

![Image of happy people jumping with excitement](https://media.giphy.com/media/BlVnrxJgTGsUw/giphy.gif)

Here are a few things to know to get you started on the right path.

**All the documents displayed in the github.io page are listed in [sidebar.md](https://github.com/mermaid-js/mermaid/edit/develop/docs/assets/_sidebar.md)**
 
**Note:You will have to edit the document to see its contents. Commits and PR's should be directed to the develop branch.**

## Branching

Going forward we will use a **Git Flow** inspired approach to branching. So development is done in the `develop` branch. 

Once development is done we branch a release branch from develop for testing.

Once the release happens we merge the release branch to master and kill the release branch.

This means... **you should branch off your pull request from develop** and direct all Pull Requests to it.   

## Contributing Code

We make all changes via pull requests. As we have many pull requests from developers new to mermaid, we have put in place a process, wherein *knsv, Knut Sveidqvist* is the primary reviewer of changes and merging pull requests. It is as follows:

* Large changes reviewed by knsv or other developer asked to review by knsv
* Smaller low-risk changes like dependecies, documentation etc can be merged by active collaborators
* documentation (updates to the docs folder are enocouraged and also allowed via direct commits)

When you commit code, create a branch, let it start with the type like feature or bug followed by the issue number for reference and text that describes the issue. 


**One example:**

`feature/945_state_diagrams`

**Another:**

`bug/123_nasty_bug_branch`


## Contributing to documentation
If it is not in the documentation, it's like it never happened. Wouldn't that be sad? With all the effort that was put into the feature?

The docs are located in the `docs` folder and are written in MarkDown. Just pick the right section and start typing. If you want to propose changes to the structure of the documentation: 

**All the documents displayed in the github.io page are listed in [sidebar.md](https://github.com/mermaid-js/mermaid/edit/develop/docs/assets/_sidebar.md). Click edit it to see them. 

The contents of http://mermaid-js.github.io/mermaid/ are based on the docs from **Master** Branch. 

## How to Contribute to Docs

We are a little less strict here, it is OK to commit directly in the `develop` branch if you are a collaborator.

The documentation is located in the `docs` directory and organized according to relevant subfolder. 

We encourage contributions to the documentation at [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs). We publish documentation using GitHub Pages with [jekyll-rtd-theme](https://github.com/rundocs/jekyll-rtd-theme).

## Preview
If you want to preview the documentation site on your machine, you will need to install  [Ruby development environment](https://jekyllrb.com/docs/installation/):

1. Install a full [Ruby development environment](https://jekyllrb.com/docs/installation/)
2. Change into docs directory
```sh
make
```
3. Build the site and make it available on a local server
```sh
make server
```
4. Browse to [http://localhost:4000/mermaid/](http://localhost:4000/mermaid/)

### **Add unit tests for the parsing part**

This is important so that, if someone else does a change to the grammar that does not know about this great feature, gets notified early on when that change breaks the parser. Another important aspect is that without proper parsing tests refactoring is pretty much impossible.

### **Add e2e tests**

This tests the rendering and visual apearance of the diagram. This ensures that the rendering of that feature in the e2e will be reviewed in the release process going forward. Less chance that it breaks!

To start working with the e2e tests, run `yarn dev` to start the dev server, after that start cypress by running `cypress open` in the mermaid folder. (Make sure you have path to cypress in order, the binary is located in node_modules/.bin).

The rendering tests are very straightforward to create. There is a function imgSnapshotTest. This function takes a diagram in text form, the mermaid options and renders that diagram in cypress.

When running in ci it will take a snapshot of the rendered diagram and compare it with the snapshot from last build and flag for review it if it differs.

This is what a rendering test looks like:
```
  it('should render forks and joins', () => {
    imgSnapshotTest(
      `
    stateDiagram
    state fork_state &lt;&lt;fork&gt;&gt;
      [*] --> fork_state
      fork_state --> State2
      fork_state --> State3

      state join_state &lt;&lt;join&gt;&gt;
      State2 --> join_state
      State3 --> join_state
      join_state --> State4
      State4 --> [*]
    `,
      { logLevel: 0 }
    );
    cy.get('svg');
  });
  ```


### **Docs or it Didn't Happen**

Finally, if it is not in the documentation, no one will know about it and then **no one will use it**. Wouldn't that be sad? With all the effort that was put into the feature?

The docs are located in the docs folder and are ofc written in markdown. Just pick the right section and start typing. If you want to add to the structure as in adding a new section and new file you do that via the _navbar.md.

The changes in master is reflected in http://mermaid-js.github.io/mermaid/ once released the updates are commited to https://mermaid-js.github.io/#/

### Questions and/or suggestions ?
After logging in at [GitHub.com](https://www.github.com), open or append to an issue [using the GitHub issue tracker of the mermaid-js repository](https://github.com/mermaid-js/mermaid/issues?q=is%3Aissue+is%3Aopen+label%3A%22Area%3A+Documentation%22).

### How to contribute a suggestion
Markdown is used to format the text, for more information about Markdown [see the GitHub Markdown help page](https://help.github.com/en/github/writing-on-github/basic-writing-and-formatting-syntax).

If you want to use an editor on your own computer, you may follow these steps:
* Find the Markdown file (.md) to edit in the [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs) directory on the develop branch.
* Create a fork of the develop branch.
* Make changes or add new documentation.
* Commit changes to your fork and push it to GitHub.
* Create a pull request of your fork.

If you don't have such editor on your computer, you may follow these steps:
* Login at [GitHub.com](https://www.github.com).
* Navigate to [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs).
* To edit a file, click the pencil icon at the top-right of the file contents panel.
* Describe what you changed in the "Propose file change" section, located at the bottom of the page.
* Submit your changes by clicking the button "Propose file change" at the bottom (by automatic creation of a fork and a new branch).
* Create a pull request of your newly forked branch, by clicking the green "Create pull request" button.

## Last words

Don't get daunted if it is hard in the beginning. We have a great community with only encouraging words. So if you get stuck, ask for help and hints in the slack forum. If you want to show off something good, show it off there.

[Join our slack community if you want closer contact!](https://join.slack.com/t/mermaid-talk/shared_invite/enQtNzc4NDIyNzk4OTAyLWVhYjQxOTI2OTg4YmE1ZmJkY2Y4MTU3ODliYmIwOTY3NDJlYjA0YjIyZTdkMDMyZTUwOGI0NjEzYmEwODcwOTE)


![Image of superhero wishing you good luck](https://media.giphy.com/media/l49JHz7kJvl6MCj3G/giphy.gif)
