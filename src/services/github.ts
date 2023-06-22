import axios, { AxiosError, HttpStatusCode } from 'axios';
import { ApiError } from '../error/error';
import { GithubPullRequest, GithubCommit, PullDetails } from '../types/github';

export class GitHubService {

    etags: Map<string, string>;

    constructor() {
        this.etags = new Map()
    }

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

    async getOpenPullRequests(owner: string, repo: string): Promise<GithubPullRequest[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`;
        const response = await this.fetch(url);
        return response.data as GithubPullRequest[];
    }

    async getPullRequestCommits(owner: string, repo: string, pull_number: number): Promise<GithubCommit[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/commits`;
        const response = await this.fetch(url);
        return response.data as GithubCommit[]
    }

    private async fetch(url: string) {
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
            //304 is a valid response from GH, as it indicates the data hasn't changed since last time. Just return the response in this case
            const axiosError = error as AxiosError;
            if (axiosError.response && axiosError.response.status === HttpStatusCode.NotModified) {
                return axiosError.response;
            }

            const errorMessage = `Error when calling ${url}. Reason: ${axiosError.message}`;
            console.error(errorMessage);
            throw new ApiError('Internal server error', HttpStatusCode.InternalServerError, errorMessage);
        }
    }
}