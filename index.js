
const core = require('@actions/core');
const axios = require('axios');

const { createMapping } = require('./functions');

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL } = process.env;
const AUTH_HEADER = {
  Authorization: `token ${GITHUB_TOKEN}`,
};
const GITHUB_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}`;
const WAIT_MS = 5000;

/**
 * Get Pull Requests
 * @return {Array} array of pull requests
 */
function getPullRequests() {
  return axios({
    method: 'GET',
    url: `${GITHUB_ENDPOINT}/pulls`,
    headers: AUTH_HEADER,
  });
}

/**
 * Get Pull Request reviews from ID
 * @param {Number} number Pull Request ID
 * @return {Array} Array of reviews
 */
function getPullRequestReviews(number) {
  return axios({
    method: 'GET',
    url: `${GITHUB_ENDPOINT}/pulls/${number}/reviews`,
    headers: AUTH_HEADER,
  });
}

/**
 * Merge a Pull Request
 * @param {Number} number Pull Request ID
 * @param {String} mergeMethod Merge method
 * @return {void}
 */
function mergePullRequest(number, mergeMethod) {
  return axios({
    method: 'PUT',
    url: `${GITHUB_ENDPOINT}/pulls/${number}/merge`,
    headers: AUTH_HEADER,
    data: {
      merge_method: mergeMethod,
    },
  });
}

/**
 * Delete a ref
 * @param {String} ref GitHub ref to delete
 * @return {void}
 */
function deleteHeadRef(ref) {
  return axios({
    method: 'DELETE',
    url: `${GITHUB_ENDPOINT}/git/refs/heads/${ref}`,
    headers: AUTH_HEADER,
  });
}

/**
 * Filter Pull Requests based on ref
 * @param {Array} pullRequests Array of Pull Requests
 * @param {String} ref GitHub ref
 * @return {Array} Array of Pull Requests filtered
 */
function filterByBaseRef(pullRequests, ref) {
  return pullRequests.filter((pr) => pr.base.ref === ref);
}

/**
 * Get promises and refs of Pull Requests reviews
 * @param {Array} pullRequests Array of Pull Requests
 * @return {Object} Object with promises and refs
 */
function getPromisesAndRefs(pullRequests) {
  const promises = [];
  const refs = {};
  for (const pr of pullRequests) {
    promises.push(getPullRequestReviews(pr.number));
    refs[pr.number] = pr.head.ref;
  }
  return { promises, refs };
}

/**
 * Wait ms
 * @param {Number} ms ms to wait
 * @return {void}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  try {
    const mergeMethod = core.getInput('merge-method');
    const minApprovals = core.getInput('min-approvals');
    const baseRef = core.getInput('base-ref');
    core.info('Getting open pull requests...');
    let pullRequests = await getPullRequests();
    pullRequests = filterByBaseRef(pullRequests.data, baseRef);
    // eslint-disable-next-line max-len
    core.info(`There are ${pullRequests.length} open PRs with "${baseRef}" base ref`);
    core.info(`Getting their reviews...`);
    const { promises, refs } = getPromisesAndRefs(pullRequests);
    const pullRequestsReviewsResolved = await Promise.all(promises);
    const pullRequestsReviews = createMapping(pullRequestsReviewsResolved);
    for (const [prNumber, approvals] of Object.entries(pullRequestsReviews)) {
      if (approvals >= +minApprovals) {
        core.info(`Automerging PR #${prNumber} (${minApprovals} approvals)`);
        await mergePullRequest(prNumber, mergeMethod);
        core.info(`Waiting ${WAIT_MS / 1000}s before next merge...`);
        await sleep(WAIT_MS);
        await deleteHeadRef(refs[prNumber]);
      } else {
        core.info(`Skipping PR #${prNumber} (${approvals} approvals)`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
