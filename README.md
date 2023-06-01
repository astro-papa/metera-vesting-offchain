
## How to create github packages

https://docs.github.com/en/packages/quickstart

## Use tsup to bundle typescript
https://tsup.egoist.dev/

## How to release
https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release

## Create a classic token

https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages#about-scopes-and-permissions-for-package-registries

## Login to npm

```
npm login --scope=@NAMESPACE --auth-type=legacy --registry=https://npm.pkg.github.com
```
https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry

## Semantic versioning
https://semver.org/

## Workflow to create a new Github package release
Here's a step-by-step guide to create a new Github package release:

- Update the code.
- Commit the changes.
- Push the changes to the Github repository.
- Check if the Continuous Integration (CI) passes. If it does, proceed to the next step. If not, address the issues before proceeding further.
- Bump the library version based on the extent of the changes made. Here are the three options to do so:
    * For a small bug fix, run: npm version patch.
    * For adding new functionality in a backward-compatible way, run: npm version minor.
    * For making breaking changes to the code, run: npm version major.
- After bumping the version, go to the Github project's releases page
- Create a new tag with the bumped version number.
- To create a new npm package in the ikigai-github organization, make sure the Node.js package CI succeeds.
- If the CI Action fails, remove the release, tag, and commit the new changes. Then, push the changes and draft a new release.


## Test framework
https://github.com/vitest-dev/vitest

## Local testing
In the main directory

```
npm run build && npm pack
```


## Installing sdk pacakage in local test folder

```
rm -rf node_modules && rm -f package-lock.json && npm install
```


