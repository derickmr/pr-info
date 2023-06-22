import request from 'supertest';
import nock from 'nock';
import { server } from '../../src/app';
import { ApiError } from '../../src/error/error';

describe('GET /:owner/:repo/pulls', () => {
    afterAll(done => {
        server.close(done);
    });

    it('should fetch pull request details successfully', async () => {
        const pulls = [{
            id: 1,
            number: 123,
            title: 'Test Pull',
            commit_count: 5,
            author: 'test-owner'
        }];

        process.env.GITHUB_TOKEN = "test_token";

        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .reply(200, [{
                id: 1,
                number: 123,
                title: 'Test Pull',
                user: { login: 'test-owner' },
            }])
            .get('/repos/test-owner/test-repo/pulls/123/commits')
            .reply(200, new Array(5).fill({ "sha": "test_sha_1" }));

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');

        expect(res.status).toEqual(200);
        expect(res.body).toEqual(pulls);
    });

    it('should fetch pull request details successfully when there are multiple open prs in the repo and multiple commits per pr', async () => {
        const pulls = [{
            id: 1,
            number: 1,
            title: 'Test Pull 1',
            commit_count: 5,
            author: 'test-owner'
        },
        {
            id: 2,
            number: 2,
            title: 'Test Pull 2',
            commit_count: 5,
            author: 'test-owner'
        },
        {
            id: 3,
            number: 3,
            title: 'Test Pull 3',
            commit_count: 5,
            author: 'test-owner'
        },
        {
            id: 4,
            number: 4,
            title: 'Test Pull 4',
            commit_count: 5,
            author: 'test-owner'
        },
        {
            id: 5,
            number: 5,
            title: 'Test Pull 5',
            commit_count: 5,
            author: 'test-owner'
        }];

        process.env.GITHUB_TOKEN = "test_token";

        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .reply(200, [{
                id: 1,
                number: 1,
                title: 'Test Pull 1',
                user: { login: 'test-owner' },
            },
            {
                id: 2,
                number: 2,
                title: 'Test Pull 2',
                user: { login: 'test-owner' },
            },
            {
                id: 3,
                number: 3,
                title: 'Test Pull 3',
                user: { login: 'test-owner' },
            },
            {
                id: 4,
                number: 4,
                title: 'Test Pull 4',
                user: { login: 'test-owner' },
            },
            {
                id: 5,
                number: 5,
                title: 'Test Pull 5',
                user: { login: 'test-owner' },
            }])
            .get('/repos/test-owner/test-repo/pulls/1/commits')
            .reply(200, new Array(5).fill({ "sha": "test_sha_1" }))
            .get('/repos/test-owner/test-repo/pulls/2/commits')
            .reply(200, new Array(5).fill({ "sha": "test_sha_1" }))
            .get('/repos/test-owner/test-repo/pulls/3/commits')
            .reply(200, new Array(5).fill({ "sha": "test_sha_1" }))
            .get('/repos/test-owner/test-repo/pulls/4/commits')
            .reply(200, new Array(5).fill({ "sha": "test_sha_1" }))
            .get('/repos/test-owner/test-repo/pulls/5/commits')
            .reply(200, new Array(5).fill({ "sha": "test_sha_1" }));

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');

        expect(res.status).toEqual(200);
        expect(res.body).toEqual(pulls);
    });

    it('should return 500 and error in the body when call to GH returns an error', async () => {
        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .replyWithError('Failed to fetch pulls');

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');
        const expectedError = new ApiError("Internal server error", 500, "Error when calling https://api.github.com/repos/test-owner/test-repo/pulls?state=open. Reason: Failed to fetch pulls");

        expect(res.status).toEqual(500);
        expect(res.body).toStrictEqual(expectedError.toJSON());
    });

    it('should return 400 status and error in the response body when request to GH is malformed', async () => {
        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .reply(400, [{}]);

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');
        const expectedError = new ApiError("Bad Request", 400, "Bad request to https://api.github.com/repos/test-owner/test-repo/pulls?state=open.");

        expect(res.status).toEqual(400);
        expect(res.body).toStrictEqual(expectedError.toJSON());
    });

    it('should return 401 status and error in the response body when GH token is invalid', async () => {
        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .reply(401, [{}]);

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');
        const expectedError = new ApiError("Unauthorized", 401, "The GitHub token is invalid.");

        expect(res.status).toEqual(401);
        expect(res.body).toStrictEqual(expectedError.toJSON());
    });

    it('should return 403 status and error in the response body when GH token does not have the required permissions', async () => {
        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .reply(403, [{}]);

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');
        const expectedError = new ApiError("Forbidden", 403, "The GitHub token does not have the necessary permissions.");

        expect(res.status).toEqual(403);
        expect(res.body).toStrictEqual(expectedError.toJSON());
    });

    it('should return 404 status and error in the response body when repo is not found', async () => {
        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .reply(404, [{}]);

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');
        const expectedError = new ApiError("Not Found", 404, "The resource at https://api.github.com/repos/test-owner/test-repo/pulls?state=open was not found.");

        expect(res.status).toEqual(404);
        expect(res.body).toStrictEqual(expectedError.toJSON());
    });

    it('should return 500 status and error in the response body when call to GH returns a 500 response', async () => {
        nock('https://api.github.com')
            .get('/repos/test-owner/test-repo/pulls?state=open')
            .reply(500, [{}]);

        const res = await request(server).get('/api/v1/repos/test-owner/test-repo/pulls');
        const expectedError = new ApiError("Internal server error", 500, "Unexpected error when calling https://api.github.com/repos/test-owner/test-repo/pulls?state=open. Reason: Request failed with status code 500");

        expect(res.status).toEqual(500);
        expect(res.body).toStrictEqual(expectedError.toJSON());
    });
});