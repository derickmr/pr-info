import axios, { AxiosError, AxiosResponse, HttpStatusCode } from 'axios';
import { ApiError } from '../error/error';
import { GithubPullRequest, GithubCommit, PullDetails } from '../types/github';

/**
 * Class that interacts with Github API.
 */
export class GitHubService {

    /**
     * etags for every URL request are stored in this map (URL -> etag) and sent in the request headers.
     * This prevents rate limit consumption in case the data in GH hasn't changed.
     */
    etags: Map<string, string>;

    constructor() {
        this.etags = new Map()
    }

    /**
     * Based on provided owner id and repository id, it retrieves all the open PRs from GH, and for each open PR, also includes commit information.
     * @param owner the repository owner id
     * @param repo the repository id
     * @returns an array of {@link PullDetails}, representing detailed information of each open PR in the repository.
     */
    async getOpenPullRequestsDetails(owner: string, repo: string): Promise<PullDetails[]> {
        const prs = await this.getOpenPullRequests(owner, repo);

        return await Promise.all(prs.map(async pr => {
            const commits = await this.getPullRequestCommits(owner, repo, pr.number)
            const commit_count = commits.length

            return {
                id: pr.id,
                number: pr.number,
                title: pr.title,
                author: pr.user.login,
                commit_count: commit_count
            } as PullDetails
        }))
    }

    /**
     * Gets open PRs for provided owner id and repo id.
     * @param owner the owner id
     * @param repo the repository id
     * @returns an array of {@link GithubPullRequest} representing the open PRs in the repo
     */
    async getOpenPullRequests(owner: string, repo: string): Promise<GithubPullRequest[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`;
        const response = await this.fetch(url);
        return response.data as GithubPullRequest[];
    }

    /**
     * Gets commit details for provided PR
     * @param owner the owner id
     * @param repo the repository id
     * @param pull_number the PR number
     * @returns an array of {@link GithubCommit} representing the commit details for the pull request
     */
    async getPullRequestCommits(owner: string, repo: string, pull_number: number): Promise<GithubCommit[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/commits`;
        const response = await this.fetch(url);
        return response.data as GithubCommit[]
    }

    /**
     * Make a GET request on the provided Github url, passing the GH token and etag for the request in the headers.
     * The GH token is required to make the rate limiting larger, otherwise requests would start failing after a couple of times.
     * @param url the github URL being called
     * @returns a {@link AxiosResponse} promise containing the response details
     * @throws an {@link ApiError} in case the request fails
     */
    private async fetch(url: string): Promise<AxiosResponse<any, any>> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'If-None-Match': this.etags.get(url),
                }
            });

            const etag = response.headers.etag;
            if (etag) {
                this.etags.set(url, etag);
            }

            return response;
        } catch (error) {
            const axiosError = error as AxiosError;

            if (!axiosError.response) {
                const errorMessage = `Error when calling ${url}. Reason: ${axiosError.message}`;
                console.error(errorMessage);
                throw new ApiError('Internal server error', HttpStatusCode.InternalServerError, errorMessage);
            }

            let errorMessage;
            switch (axiosError.response.status) {
                case HttpStatusCode.NotModified:
                    //304 is a valid response from GH, as it indicates the data hasn't changed since last time. Just return the response in this case
                    return axiosError.response;

                case HttpStatusCode.NotFound:
                    errorMessage = `The resource at ${url} was not found.`;
                    console.error(errorMessage);
                    throw new ApiError('Not Found', HttpStatusCode.NotFound, errorMessage);

                case HttpStatusCode.Unauthorized:
                    errorMessage = 'The GitHub token is invalid.';
                    console.error(errorMessage);
                    throw new ApiError('Unauthorized', HttpStatusCode.Unauthorized, errorMessage);

                case HttpStatusCode.Forbidden:
                    errorMessage = 'The GitHub token does not have the necessary permissions.';
                    console.error(errorMessage);
                    throw new ApiError('Forbidden', HttpStatusCode.Forbidden, errorMessage);

                case HttpStatusCode.BadRequest:
                    errorMessage = `Bad request to ${url}.`;
                    console.error(errorMessage);
                    throw new ApiError('Bad Request', HttpStatusCode.BadRequest, errorMessage);

                default:
                    errorMessage = `Unexpected error when calling ${url}. Reason: ${axiosError.message}`;
                    console.error(errorMessage);
                    throw new ApiError('Internal server error', HttpStatusCode.InternalServerError, errorMessage);
            }
        }
    }
}
