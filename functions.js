/**
 * Convert array of reviews to object
 * @param {Array} array Array of reviews
 * @return {Object} Object with PR number as property and reviewers as value
 */
function createMapping(array) {
  return array.map((response) => response.data)
      .flat()
      // Create array of reviews for all PRs
      .map((review) => ({
        number: review.pull_request_url.split('/pulls/')[1],
        user: review.user.login,
        state: review.state,
      }))
      .filter((review) => review.state === 'APPROVED')
      // [ { number: 123, user: 'DavideViolante', state: 'APPROVED' }, ... ]
      // Final result: { '123': 3, '456': 1, ... }
      // eslint-disable-next-line max-len
      .reduce((obj, review) => (obj[review.number] = (obj[review.number] || 0) + 1, obj), {});
}

module.exports = {
  createMapping,
};
