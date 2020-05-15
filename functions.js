function createMapping(array) {
  return array.map(response => response.data)
    .flat()
    // Now we have an array of reviews for all PRs
    .map(review => ({
      number: review.pull_request_url.split('/pulls/')[1],
      user: review.user.login,
      state: review.state,
    }))
    .filter(review => review.state === 'APPROVED')
    // Now we have an array like: [ { number: 123, user: 'DavideViolante', state: 'APPROVED' }, ... ]
    .reduce((obj, review) => (obj[review.number] = (obj[review.number] || 0) + 1, obj), {})
    // Now we have an object like: { '123': 3, '456': 1, ... }
}

module.exports = {
  createMapping
};
