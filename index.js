
const core = require('@actions/core');
const axios = require('axios');

const { createMapping } = require("./functions");

const GITHUB_API_URL = 'https://api.github.com';
const { GITHUB_TOKEN, GITHUB_REPOSITORY } = process.env;
const AUTH_HEADER = {
  Authorization: `token ${GITHUB_TOKEN}`
};
const GITHUB_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}`;
const WAIT_MS = 5000;

function getPullRequests() {
  return axios({
    method: 'GET',
    url: `${GITHUB_ENDPOINT}/pulls`,
    headers: AUTH_HEADER
  });
}

function getPullRequestReviews(number) {
  return axios({
    method: 'GET',
    url: `${GITHUB_ENDPOINT}/pulls/${number}/reviews`,
    headers: AUTH_HEADER
  });
}

function mergePullRequest(number, merge_method) {
  return axios({
    method: 'PUT',
    url: `${GITHUB_ENDPOINT}/pulls/${number}/merge`,
    headers: AUTH_HEADER,
    data: {
      merge_method,
    }
  });
}

function deleteHeadRef(ref) {
  return axios({
    method: 'DELETE',
    url: `${GITHUB_ENDPOINT}/git/refs/heads/${ref}`,
    headers: AUTH_HEADER
  });
}

function filterByBaseRef(pullRequests, ref) {
  return pullRequests.filter(pr => pr.base.ref === ref);
}

function getPromisesAndRefs(pullRequests) {
  const promises = [];
  const refs = {};
  for (const pr of pullRequests) {
    promises.push(getPullRequestReviews(pr.number));
    refs[pr.number] = pr.head.ref;
  }
  return { promises, refs };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    const merge_method = core.getInput('merge-method');
    const minApprovals = core.getInput('min-approvals');
    const baseRef = core.getInput('base-ref');
    core.info('Getting open pull requests...');
    let pullRequests = await getPullRequests();
    pullRequests = filterByBaseRef(pullRequests.data, baseRef);
    core.info(`There are ${pullRequests.length} open PRs with "${baseRef}" base ref`);
    core.info(`Getting their reviews...`);
    const { promises, refs } = getPromisesAndRefs(pullRequests);
    const pullRequestsReviewsResolved = await Promise.all(promises);
    const pullRequestsReviews = createMapping(pullRequestsReviewsResolved);
    for (const [prNumber, approvals] of Object.entries(pullRequestsReviews)) {
      if (approvals >= +minApprovals) {
        core.info(`Automerging PR #${prNumber} (${minApprovals} approvals)`);
        await mergePullRequest(prNumber, merge_method);
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
