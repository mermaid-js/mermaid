# Gitgraph Diagrams

**Edit this Page** [![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/gitgraph.md)
> A Git Graph is a pictorial representation of git commits and git actions(commands) on various branches.

These kind of diagram are particularyly helpful to developers and devops teams to share their Git branching strategies. For example, it makes it easier to visualize how git flow works.

Mermaid can render Git diagrams

```mermaid-example
    gitGraph
       commit
       commit
       branch develop
       checkout develop
       commit
       commit
       checkout main
       merge develop
       commit
       commit
```

In Mermaid, we support the basic git operations like:
- *commit* : Representing a new commit on the current branch.
- *branch* : To create & switch to a new branch, setting it as the current branch.
- *checkout* : To checking out an existing branch and setting it as the current branch.
- *merge* : To merge an existing branch onto the current branch.

With the help of these key git commands, you will be able to draw a gitgraph in Mermaid very easily and quickly.
Entity names are often capitalised, although there is no accepted standard on this, and it is not required in Mermaid.


## Syntax
Mermaid syntax for Gitgraph is very straigth-forward and simple. It follows a declarative-approach, where each commit is drawn on the timeline in the diagram, in order of its occurance/presence in code. Basically, it follows the insertion order for each command.

First thing you do is to declare your diagram type using the **gitgraph** keyword. This `gitgraph` keyword, tells Mermaid that you wish to draw a gitgraph, and parse the diagram code accordingly.

Each gitgraph, is initialized with ***main*** branch. So unless you create a different branch, by-default the commits will go to the main branch. This is driven with how git works, where in the begging you always start with the main branch (formerly called as ***master*** branch). And by-default, `main` branch is set as your ***current branch***.


You make use of ***commit*** keyword to register a commit on the current branch. Let see how this works:

A simple gitgraph showing three commits on the default (***main***) branch:
```mermaid-example
    gitGraph
       commit
       commit
       commit
```
If you look closely at the previous example, you can see the default branch `main` along with three commits. Also, notice, the by-default each commit has been given a unique & random Id. What if you would want to give your own custom ID to a commit? Yes, it is possible to do that with Mermaid.

### Adding custom commit id

For a given commit you may specify a custom id at the time of declaring it using the `id` attribute, followed by `:` and your custom value within `""` quote. For example: `commit id: "your_custom_id"`

Let us see how this works with the help of the following diagram:

```mermaid-example
    gitGraph
       commit id: "Alpha"
       commit id: "Beta"
       commit id: "Gamma"
```

In this example, we have given our custom id's to the commits.

### Modifying commit type

In Mermaid, a commit can be of three type, which render a bit different in the diagram. These types are:
- `NORMAL` : Default commit type. Represented by a solid circle in the diagram
- `REVERSE` : To emphasize a commit as a reverse commit. Represented by a crossed solid circle in the diagram.
- `HIGHLIGHT` : To highlight a particular commit in the diagram. Represented by a filled rectangle in the diagram.

For a given commit you may specify its type at the time of declaring it using the `type` attribute, followed by `:` and the required type option discussed above. For example: `commit type: HIGHLIGHT`

NOTE: If no commit type is specified, `NORMAL` is picked as default.

Let us see how these different commit type look with the help of the following diagram:

```mermaid-example
    gitGraph
       commit id: "Normal"
       commit id: "Reverse" type: REVERSE
       commit id: "Hightlight" type: HIGHLIGHT
```

In this example, we have specified different types to each commit. Also, see how we have clubbed both `id` and `type` together at the time of declaring our commits.

### Adding Tags

For a given commit you may decorate it as a **tag**, similar to the concept of tags or release version in git world.
You can attach a custom tag at the time of declaring a commit using the `tag` attribute, followed by `:` and your custom value within `""` quote. For example: `commit tag: "your_custom_tag"`

Let us see how this works with the help of the following diagram:

```mermaid-example
    gitGraph
       commit id: "Normal" tag: "v1.0.0"
       commit id: "Reverse" type: REVERSE tag: "RC_1"
       commit id: "Hightlight" type: HIGHLIGHT tag: "8.8.4"
```

In this example, we have given custom tags to the commits. Also, see how we have combined all thress attributes in a single commit declaration. You can mix-match these attributes as you like.

### Create a new branch
In Mermaid, in-order to create a new branch, you make use of the `branch` keyword. You also need to provide a name of the new branch. The name has to be unique and cannot be that of an existing branch. Usage example: `branch develop`

When Mermaid, reads the `branch` keyword, it creates a new branch and sets it as the current branch. Equivalent to you creating a  new branch and checking it out in Git world.

Let see this in an example:

```mermaid-example
    gitGraph
       commit
       commit
       branch develop
       commit
       commit
       commit
```
In this example, see how we started with default `main` branch, and pushed to commits on that.
Then we created the `develop` branch, and all commits afterwards are put on the `develop` branch as it became the current branch.

### Checking out an existing branch
In Mermaid, in-order to switch to an existing branch, you make use of the `checkout` keyword. You also need to provide a name of an existing branch. If no branch is found with the given name, it will result in console error. Usage example: `checkout develop`

When Mermaid, reads the `checkout` keyword, it finds the given branch and sets it as the current branch. Equivalent to  checking out a branch in Git world.

Let see modify our previous example:

```mermaid-example
    gitGraph
       commit
       commit
       branch develop
       commit
       commit
       commit
       checkout main
       commit
       commit
```
In this example, see how we started with default `main` branch, and pushed to commits on that.
Then we created the `develop` branch, and all three commits afterwards are put on the `develop` branch as it became the current branch.
After this we made use of the `checkout` keyword to set the current branch as `main`, and all commit that follow are registered against the current branch, i.e. `main`.

### Merging two branches
In Mermaid, in-order to merge or join  to an existing branch, you make use of the `merge` keyword. You also need to provide a name of an existing branch to merge from. If no branch is found with the given name, it will result in console error. Also, if you can only merge two separate branches, and cannot merge a branch with itself. In such case an error is throw.

Usage example: `merge develop`

When Mermaid, reads the `merge` keyword, it finds the given branch and its head commit (the last commit on that branch), and joins it with the head commit on the **current branch**. Each merge result in a ***merge commit***, represented in the diagram with **filled double circle**.

Let see modify our previous example to merge our two branches:

```mermaid-example
    gitGraph
       commit
       commit
       branch develop
       commit
       commit
       commit
       checkout main
       commit
       commit
       merge develop
       commit
       commit
```
In this example, see how we started with default `main` branch, and pushed to commits on that.
Then we created the `develop` branch, and all three commits afterwards are put on the `develop` branch as it became the current branch.
After this we made use of the `checkout` keyword to set the current branch as `main`, and all commit that follow are registered against the current branch, i.e. `main`.
After this we merge the `develop` branch onto the current branch `main`, resulting in a merge commit.
Since the current branch at this point is still `main`, the last two commits are registered against that.
