# How to contribute

Great that you want to be involved in this project! Contributing is fun and contributions are GREAT! :)

This page is currently a starting point and is not so rigorous to start with.

Some important guidlines:

* The work will be organized using the issues list
    * In the list there will be the bugs/enhancements etc we are working with in the project
    * There will be milestones outlineing the roadmap ahead
    * There will issues marked with help wanted

The issue list and the items marked with **help wanted** is a good starting point if you want to do some work.

## Guidelines for avoiding duplicate work

Contributing is great. It is not so fun when you are done with your issue and just before you're about to push your
change you can't because someone else just pushed the same fix so you have wasted your time. The guidelines below are in
place to prevent this:

* Comment in the issue that you are working on it. You will then be added as an assignee (eventually).
* When you pick an issue to work on.
    * Check that the issue not assigned
    * Also check the comments so that no one has started working on it before beeing officially assigned.


## Submitting changes
Please send a GitHub Pull Request with a clear list of what you've done (read more about pull requests). When you send
a pull request, we will love you forever if you include jasmine tests. We can always use more test coverage.

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger changes should look like this:

$ git commit -m "A brief summary of the commit
> 
> A paragraph describing what changed and its impact."
Coding conventions
Start reading our code and you'll get the hang of it. We optimize for readability:

This is open source software. Consider the people who will read your code, and make it look nice for them. It's sort of
like driving a car: Perhaps you love doing donuts when you're alone, but with passengers the goal is to make the ride as
smooth as possible.

So that we can consistently serve images from the CDN, always use image_path or image_tag when referring to images.
Never prepend "/images/" when using image_path or image_tag.
Also for the CDN, always use cwd-relative paths rather than root-relative paths in image URLs in any CSS. So instead of
url('/images/blah.gif'), use url('../images/blah.gif').

# Build instructions
Fork, then:

```
npm install
```

Then the dependencies will have been installed. You use gulp and npm calls as build tools.

The following targets are probably interesting:

* jison - compiles the jison grammars to parser files

for instance:
```
gulp jison
```
To run the tests:
```
npm run karma
```

To build the /dist directory
```
npm run dist
```

Thanks, Knut Sveidqvist
