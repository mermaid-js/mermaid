# Development and Contribution 🙌

So you want to help? That's great!

![Image of happy people jumping with excitement](https://media.giphy.com/media/BlVnrxJgTGsUw/giphy.gif)

Here are a few things to know to get you started on the right path.

**The Docs Structure is dictated by [sidebar.md](https://github.com/mermaid-js/mermaid/edit/develop/docs/_sidebar.md)**

**Note: Commits and Pull Requests should be directed to the develop branch.**

## Branching

Mermaid uses a [Git Flow](https://guides.github.com/introduction/flow/)–inspired approach to branching. So development is done in the `develop` branch.

Once development is done we branch a `release` branch from `develop` for testing.

Once the release happens we merge the `release` branch with `master` and kill the `release` branch.

This means that **you should branch off your pull request from develop** and direct all Pull Requests to it.

## Contributing Code

We make all changes via Pull Requests. As we have many Pull Requests from developers new to mermaid, we have put in place a process, wherein *knsv, Knut Sveidqvist* is the primary reviewer of changes and merging pull requests. The process is as follows:

* Large changes reviewed by knsv or other developer asked to review by knsv
* Smaller, low-risk changes like dependecies, documentation, etc. can be merged by active collaborators
* Documentation (we encourage updates to the docs folder; you can submit them via direct commits)

When you commit code, create a branch with the following naming convention:

Start with the type, such as **feature** or **bug**, followed by the issue number for reference, and a text that describes the issue.

**One example:**

`feature/945_state_diagrams`

**Another example:**

`bug/123_nasty_bug_branch`

## Contributing to Documentation

If it is not in the documentation, it's like it never happened. Wouldn't that be sad? With all the effort that was put into the feature?

The docs are located in the `docs` folder and are written in Markdown. Just pick the right section and start typing. If you want to propose changes to the structure of the documentation, such as adding a new section or a new file you do that via the **[sidebar](https://github.com/mermaid-js/mermaid/edit/develop/docs/_sidebar.md)**.

> **All the documents displayed in the github.io page are listed in [sidebar.md](https://github.com/mermaid-js/mermaid/edit/develop/docs/_sidebar.md)**.

The contents of [https://mermaid-js.github.io/mermaid/](https://mermaid-js.github.io/mermaid/) are based on the docs from the `master` branch. Updates commited to the `master` branch are reflected in the [Mermaid Docs](https://mermaid-js.github.io/mermaid/) once released.

## How to Contribute to Documentation

We are a little less strict here, it is OK to commit directly in the `develop` branch if you are a collaborator.

The documentation is located in the `docs` directory and organized according to relevant subfolder.

We encourage contributions to the documentation at [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs). We publish documentation using GitHub Pages with [Docsify](https://www.youtube.com/watch?v=TV88lp7egMw&t=3s)

### Add Unit Tests for Parsing

This is important so that, if someone that does not know about this great feature suggests a change to the grammar, they get notified early on when that change breaks the parser. Another important aspect is that, without proper parsing, tests refactoring is pretty much impossible.

### Add E2E Tests

This tests the rendering and visual apearance of the diagrams. This ensures that the rendering of that feature in the e2e will be reviewed in the release process going forward. Less chance that it breaks!

To start working with the e2e tests:

1. Run `yarn dev` to start the dev server
2. Start **Cypress** by running `cypress open` in the **mermaid** folder.  
(Make sure you have path to Cypress in order, the binary is located in `node_modules/.bin`).

The rendering tests are very straightforward to create. There is a function `imgSnapshotTest`, which takes a diagram in text form and the mermaid options, and it renders that diagram in Cypress.

When running in CI it will take a snapshot of the rendered diagram and compare it with the snapshot from last build and flag it for review if it differs.

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

### Any Questions or Suggestions?

After logging in at [GitHub.com](https://www.github.com), open or append to an issue [using the GitHub issue tracker of the mermaid-js repository](https://github.com/mermaid-js/mermaid/issues?q=is%3Aissue+is%3Aopen+label%3A%22Area%3A+Documentation%22).

### How to Contribute a Suggestion

Markdown is used to format the text, for more information about Markdown [see the GitHub Markdown help page](https://help.github.com/en/github/writing-on-github/basic-writing-and-formatting-syntax).

To edit Docs on your computer:

1. Find the Markdown file (.md) to edit in the [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs) directory in the `develop` branch.
2. Create a fork of the develop branch.
3. Make changes or add new documentation.
4. Commit changes to your fork and push it to GitHub.
5. Create a Pull Request of your fork.

To edit Docs on GitHub:

1. Login to [GitHub.com](https://www.github.com).
2. Navigate to [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs).
3. To edit a file, click the pencil icon at the top-right of the file contents panel.
4. Describe what you changed in the **Propose file change** section, located at the bottom of the page.
5. Submit your changes by clicking the button **Propose file change** at the bottom (by automatic creation of a fork and a new branch).
6. Create a Pull Request of your newly forked branch by clicking the green **Create Pull Request** button.

## Last Words

Don't get daunted if it is hard in the beginning. We have a great community with only encouraging words. So, if you get stuck, ask for help and hints in the Slack forum. If you want to show off something good, show it off there.

[Join our Slack community if you want closer contact!](https://join.slack.com/t/mermaid-talk/shared_invite/enQtNzc4NDIyNzk4OTAyLWVhYjQxOTI2OTg4YmE1ZmJkY2Y4MTU3ODliYmIwOTY3NDJlYjA0YjIyZTdkMDMyZTUwOGI0NjEzYmEwODcwOTE)

![Image of superhero wishing you good luck](https://media.giphy.com/media/l49JHz7kJvl6MCj3G/giphy.gif)
