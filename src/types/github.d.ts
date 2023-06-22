/**
 * Represents a Github user
 */
export interface GithubUser {
    login: string;
}

/**
 * Represents a Github PR
 */
export interface GithubPullRequest {
    id: number;
    number: number;
    title: string;
    user: GithubUser;
}

/**
 * Represents a Github commit details
 */
export interface GithubCommit {
    //Currently we don't care about any commit information, just their count on a given PR. Adding just sha for now.
    //Fields to be added as the application requires them to avoid early complexity.
    sha: string;
}

/**
 * Type that wraps both PR and its commit details, returned by the {@link getOpenPullRequestsDetails}
 */
export interface PullDetails {
    id: number;
    number: number;
    title: string;
    author: string;
    commit_count: number
}