import axios, { AxiosError, HttpStatusCode } from 'axios';
import { GitHubService } from '../../../src/services/githubService';
import { GithubPullRequest, GithubCommit } from '../../../src/types/github';
import { ApiError } from '../../../src/error/error';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GitHubService', () => {
    let service: GitHubService;

    beforeEach(() => {
        service = new GitHubService();
        jest.resetAllMocks();
    });

    describe('getOpenPullRequestsDetails', () => {
        it('should return pull request details when no error happens while retrieving data', async () => {
            const pullRequest: GithubPullRequest = {
                id: 1,
                number: 123,
                title: 'Test PR',
                user: { login: 'test-user' },
            };

            const commit: GithubCommit = {
                sha: "28de45b18d12c528af44f4299b5d422892e18ed1"
            };

            jest.spyOn(service, 'getOpenPullRequests').mockResolvedValue([pullRequest]);
            jest.spyOn(service, 'getPullRequestCommits').mockResolvedValue([commit]);

            const owner = 'owner';
            const repo = 'repo';

            const result = await service.getOpenPullRequestsDetails(owner, repo);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: pullRequest.id,
                number: pullRequest.number,
                title: pullRequest.title,
                author: pullRequest.user.login,
                commit_count: 1,
            });
        });

        it('should throw error if getting open pull requests fails', async () => {
            jest.spyOn(service, 'getOpenPullRequests').mockRejectedValue(new Error('Test error'));

            const owner = 'owner';
            const repo = 'repo';

            await expect(service.getOpenPullRequestsDetails(owner, repo)).rejects.toThrow('Test error');
        });

        it('should throw error if getting commits fails', async () => {
            const pullRequest: GithubPullRequest = {
                id: 1,
                number: 123,
                title: 'Test PR',
                user: { login: 'test-user' },
            };

            jest.spyOn(service, 'getOpenPullRequests').mockResolvedValue([pullRequest]);
            jest.spyOn(service, 'getPullRequestCommits').mockRejectedValue(new Error('Test error'));

            const owner = 'owner';
            const repo = 'repo';

            await expect(service.getOpenPullRequestsDetails(owner, repo)).rejects.toThrow('Test error');
        });

        it('should throw error if getting commits for one of many pull requests fails', async () => {
            const pullRequests: GithubPullRequest[] = [
                { id: 1, number: 1, title: 'Test PR 1', user: { login: 'test-user-1' } },
                { id: 2, number: 2, title: 'Test PR 2', user: { login: 'test-user-2' } },
                { id: 3, number: 3, title: 'Test PR 3', user: { login: 'test-user-3' } },
            ];

            const commit: GithubCommit = {
                sha: "28de45b18d12c528af44f4299b5d422892e18ed1"
            };

            const owner = 'owner';
            const repo = 'repo';

            jest.spyOn(service, 'getOpenPullRequests').mockResolvedValue(pullRequests);

            jest.spyOn(service, 'getPullRequestCommits')
                .mockResolvedValueOnce([commit])
                .mockRejectedValueOnce(new Error('Test error')) // simulate a failure when retrieving commits for the second PR
                .mockResolvedValueOnce([commit]);

            await expect(service.getOpenPullRequestsDetails(owner, repo)).rejects.toThrow('Test error');
        });

        describe('getOpenPullRequests', () => {
            it('should return pull requests when no error happens', async () => {
                const pullRequest: GithubPullRequest = {
                    id: 1,
                    number: 123,
                    title: 'Test PR',
                    user: { login: 'test-user' },
                };

                mockedAxios.get.mockResolvedValue({
                    data: [pullRequest],
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {},
                });

                const owner = 'owner';
                const repo = 'repo';

                const result = await service.getOpenPullRequests(owner, repo);

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(pullRequest);
            });

            it('should throw no error when response is a 304 Not Modified', async () => {
                const owner = 'owner';
                const repo = 'repo';
                const data = [
                    {
                        id: 1,
                        number: 123,
                        title: 'Test Pull',
                        user: { login: 'test-owner' },
                    },
                ];
    
                jest.spyOn(axios, 'get').mockImplementationOnce(() => {
                    const response = {
                        status: HttpStatusCode.NotModified,
                        statusText: "Not Modified",
                        data: data,
                        headers: {},
                        config: {},
                    };
    
                    return Promise.resolve(response);
                });
    
                const result = await service.getOpenPullRequests(owner, repo);
                expect(result).toEqual(data);
                expect(axios.get).toHaveBeenCalledTimes(1);
            });

            it('should send request to correct url', async () => {
                const owner = 'test-owner';
                const repo = 'test-repo';
                const expectedUrl = `https://api.github.com/repos/test-owner/test-repo/pulls?state=open`;

                mockedAxios.get.mockResolvedValue({
                    data: [],
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {}
                });

                await service.getOpenPullRequests(owner, repo);

                expect(mockedAxios.get).toHaveBeenCalledWith(expectedUrl, expect.anything());
            });

            it('should pass etag and github token in the request header when they are available', async () => {
                const commit: GithubCommit = {
                    sha: "28de45b18d12c528af44f4299b5d422892e18ed1"
                };

                const etag = "test-etag";
                process.env.GITHUB_TOKEN = "test-token"

                service.etags.set("https://api.github.com/repos/test-owner/test-repo/pulls?state=open", etag);

                mockedAxios.get.mockResolvedValue({
                    data: [commit],
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        "etag": etag
                    },
                    config: {},
                });

                const expectedRequestHeaders = {
                    headers: {
                        'Authorization': `token test-token`,
                        'If-None-Match': etag,
                    }
                };

                const owner = 'test-owner';
                const repo = 'test-repo';

                await service.getOpenPullRequests(owner, repo);

                expect(mockedAxios.get).toHaveBeenCalledWith(expect.anything(), expectedRequestHeaders);
            });

            it('should save the returned etag from API call', async () => {
                const owner = 'test-owner';
                const repo = 'test-repo';
                const expectedUrl = `https://api.github.com/repos/test-owner/test-repo/pulls?state=open`;

                mockedAxios.get.mockResolvedValue({
                    data: [],
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        "etag": "test-etag"
                    },
                    config: {}
                });

                await service.getOpenPullRequests(owner, repo);
                expect(mockedAxios.get).toHaveBeenCalledWith(expectedUrl, expect.anything());
                expect(service.etags.has("https://api.github.com/repos/test-owner/test-repo/pulls?state=open")).toBe(true);
                expect(service.etags.get("https://api.github.com/repos/test-owner/test-repo/pulls?state=open")).toEqual("test-etag");
            });

            it('should throw error if axios get call fails', async () => {
                const owner = 'owner';
                const repo = 'repo';
                const error = new Error('Network error');

                jest.spyOn(axios, 'get').mockRejectedValueOnce(error);

                await expect(service.getOpenPullRequests(owner, repo)).rejects.toThrow(ApiError);
                expect(axios.get).toHaveBeenCalledTimes(1);
            });

            it('should throw error if response status is not ok or not modified', async () => {
                const owner = 'owner';
                const repo = 'repo';

                jest.spyOn(axios, 'get').mockImplementationOnce(() => {
                    const error = {
                        isAxiosError: true,
                        toJSON: () => { },
                        response: {
                            status: HttpStatusCode.BadRequest,
                            statusText: "Bad Request",
                            data: {},
                            headers: {},
                            config: {},
                        },
                        message: "Bad Request",
                    } as AxiosError;
                    return Promise.reject(error);
                });

                await expect(service.getOpenPullRequests(owner, repo)).rejects.toThrow(ApiError);
                expect(axios.get).toHaveBeenCalledTimes(1);
            });

        });

        describe('getPullRequestCommits', () => {
            it('should return pull request commits', async () => {
                const commit: GithubCommit = {
                    sha: "28de45b18d12c528af44f4299b5d422892e18ed1"
                };

                mockedAxios.get.mockResolvedValue({
                    data: [commit],
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {},
                });

                const owner = 'owner';
                const repo = 'repo';
                const pull_number = 123;

                const result = await service.getPullRequestCommits(owner, repo, pull_number);

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(commit);
            });
        });

        it('should throw no error when response is a 304 Not Modified', async () => {
            const owner = 'owner';
            const repo = 'repo';
            const pull_number = 123;
            const data = new Array(5).fill({"sha": "test_sha_1"});

            jest.spyOn(axios, 'get').mockImplementationOnce(() => {
                const response = {
                    status: HttpStatusCode.NotModified,
                    statusText: "Not Modified",
                    data: data,
                    headers: {},
                    config: {},
                };

                return Promise.resolve(response);
            });

            const result = await service.getPullRequestCommits(owner, repo, pull_number);
            expect(result).toEqual(data);
            expect(axios.get).toHaveBeenCalledTimes(1);
        });

        it('should send request to correct url', async () => {
            const commit: GithubCommit = {
                sha: "28de45b18d12c528af44f4299b5d422892e18ed1"
            };

            mockedAxios.get.mockResolvedValue({
                data: [commit],
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {},
            });

            const owner = 'test-owner';
            const repo = 'test-repo';
            const pull_number = 123;
            const expectedUrl = `https://api.github.com/repos/test-owner/test-repo/pulls/123/commits`;

            await service.getPullRequestCommits(owner, repo, pull_number);

            expect(mockedAxios.get).toHaveBeenCalledWith(expectedUrl, expect.anything());
        });

        it('should pass etag and github token in the request header when they are available', async () => {
            const commit: GithubCommit = {
                sha: "28de45b18d12c528af44f4299b5d422892e18ed1"
            };

            const etag = "test-etag";
            process.env.GITHUB_TOKEN = "test-token"

            service.etags.set("https://api.github.com/repos/test-owner/test-repo/pulls/123/commits", etag);

            mockedAxios.get.mockResolvedValue({
                data: [commit],
                status: 200,
                statusText: 'OK',
                headers: {
                    "etag": etag
                },
                config: {},
            });

            const expectedRequestHeaders = {
                headers: {
                    'Authorization': `token test-token`,
                    'If-None-Match': etag,
                }
            };

            const owner = 'test-owner';
            const repo = 'test-repo';
            const pull_number = 123;

            await service.getPullRequestCommits(owner, repo, pull_number);

            expect(mockedAxios.get).toHaveBeenCalledWith(expect.anything(), expectedRequestHeaders);
        });

        it('should save the returned etag from API call', async () => {
            const commit: GithubCommit = {
                sha: "28de45b18d12c528af44f4299b5d422892e18ed1"
            };

            mockedAxios.get.mockResolvedValue({
                data: [commit],
                status: 200,
                statusText: 'OK',
                headers: {
                    "etag": "test-etag"
                },
                config: {},
            });

            const owner = 'test-owner';
            const repo = 'test-repo';
            const pull_number = 123;

            await service.getPullRequestCommits(owner, repo, pull_number);

            expect(service.etags.has("https://api.github.com/repos/test-owner/test-repo/pulls/123/commits")).toBe(true);
            expect(service.etags.get("https://api.github.com/repos/test-owner/test-repo/pulls/123/commits")).toEqual("test-etag");
        });

        it('should throw error if axios get call fails', async () => {
            const owner = 'owner';
            const repo = 'repo';
            const pull_number = 123;
            const error = new Error('Network error');

            jest.spyOn(axios, 'get').mockRejectedValueOnce(error);

            await expect(service.getPullRequestCommits(owner, repo, pull_number)).rejects.toThrow(ApiError);
            expect(axios.get).toHaveBeenCalledTimes(1);
        });

        it('should throw error if response status is not ok or not modified', async () => {
            const owner = 'owner';
            const repo = 'repo';
            const pull_number = 123;

            jest.spyOn(axios, 'get').mockImplementationOnce(() => {
                const error = {
                    isAxiosError: true,
                    toJSON: () => { },
                    response: {
                        status: HttpStatusCode.BadRequest,
                        statusText: "Bad Request",
                        data: {},
                        headers: {},
                        config: {},
                    },
                    message: "Bad Request",
                } as AxiosError;
                return Promise.reject(error);
            });

            await expect(service.getPullRequestCommits(owner, repo, pull_number)).rejects.toThrow(ApiError);
            expect(axios.get).toHaveBeenCalledTimes(1);
        });

    })
});
