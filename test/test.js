const assert = require('assert');

const { createMapping } = require('../functions');

const mockPullRequests = [
  {
    data: [
      {
        pull_request_url: '.../pulls/123',
        user: {
          login: 'User1',
        },
        state: 'APPROVED',
      },
      {
        pull_request_url: '.../pulls/123',
        user: {
          login: 'User2',
        },
        state: 'COMMENTED',
      },
      {
        pull_request_url: '.../pulls/123',
        user: {
          login: 'User3',
        },
        state: 'APPROVED',
      },
    ],
  },
  {
    data: [
      {
        pull_request_url: '.../pulls/456',
        user: {
          login: 'User3',
        },
        state: 'APPROVED',
      },
    ],
  },
  {
    data: [
      {
        pull_request_url: '.../pulls/789',
        user: {
          login: 'User2',
        },
        state: 'COMMENTED',
      },
    ],
  },
];
const mockPullRequestsNoData = [];

describe('Pull Request Reviews Reminder Action tests', () => {
  it('Should create the mapping {"PR":approvals,...}', () => {
    const mapping = createMapping(mockPullRequests);
    assert.strictEqual(mapping['123'], 2);
    assert.strictEqual(mapping['456'], 1);
    assert.strictEqual(mapping['789'], undefined);
  });

  it('Should not create the mapping {"PR":approvals,...}', () => {
    const mapping = createMapping(mockPullRequestsNoData);
    assert.deepEqual(mapping, {});
  });
});
