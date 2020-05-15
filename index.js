
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

function deleteRefBranch(branch) {
  return axios({
    method: 'DELETE',
    url: `${GITHUB_ENDPOINT}/git/refs/heads/${branch}`,
    headers: AUTH_HEADER
  });
}

function getPromisesAndRefs(pullRequests) {
  const promises = [];
  const refs = {};
  for (const pr of pullRequests.data) {
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
    core.info('Getting open pull requests...');
    const pullRequests = await getPullRequests();
    core.info(`There are ${pullRequests.data.length} open pull requests`);
    core.info(`Getting reviews for ${pullRequests.data.length} pull requests`);
    const { promises, refs } = getPromisesAndRefs(pullRequests.data);
    const pullRequestsReviewsResolved = await Promise.all(promises);
    const pullRequestsReviews = createMapping(pullRequestsReviewsResolved);
    core.info(`{"PR":approvals,...} -> ${JSON.stringify(pullRequestsReviews)}`);
    for (const [prNumber, approvals] of Object.entries(pullRequestsReviews)) {
      if (approvals >= +minApprovals) {
        core.info(`Automerging PR #${prNumber} (${minApprovals} approvals)`);
        await mergePullRequest(prNumber, merge_method);
        core.info(`Waiting ${WAIT_MS / 1000}s before next merge...`);
        await sleep(WAIT_MS);
        await deleteRefBranch(refs[prNumber]);
      } else {
        core.info(`Skipping PR #${prNumber} (${approvals} approvals)`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
