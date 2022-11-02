# Pull Request auto merge action
[![](https://github.com/davideviolante/pr-automerge-action/workflows/Node.js%20CI/badge.svg)](https://github.com/DavideViolante/pr-automerge-action/actions?query=workflow%3A%22Node.js+CI%22) [![Coverage Status](https://coveralls.io/repos/github/DavideViolante/pr-automerge-action/badge.svg?branch=master)](https://coveralls.io/github/DavideViolante/pr-automerge-action?branch=master) [![Maintainability](https://api.codeclimate.com/v1/badges/60f9b3a6b4177a0bfe77/maintainability)](https://codeclimate.com/github/DavideViolante/pr-automerge-action/maintainability) [![Donate](https://img.shields.io/badge/paypal-donate-179BD7.svg)](https://www.paypal.me/dviolante)

GitHub Action to automatically merge pull requests when some conditions are met.

## Inputs

### merge-method

Pull request merge method: "merge", "squash", "rebase". Default is "squash".

### min-approvals

Minimum number of approvals needed on a pull request to be merged. Default is 2.

### base-ref

Base ref branch to filter pull requests. Default is "dev".

## Example usage

```yaml
name: PRs auto merge

on:
  schedule:
    # Every friday every hour between 12 and 15 UTC
    - cron: "0 12-15 * * 5"

jobs:
  pr-automerge:
    runs-on: ubuntu-latest
    steps:
    - uses: davideviolante/pr-automerge-action@v1.3.2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        merge-method: 'squash' # Default 'squash'
        min-approvals: 2 # Default 2
        base-ref: 'dev' # Default 'dev'
```

## Bug or feedback?
Please open an issue.

## Author
- [Davide Violante](https://github.com/DavideViolante)
