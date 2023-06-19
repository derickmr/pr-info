export interface GithubUser {
    login: string;
}

export interface GithubPullRequest {
    id: number;
    number: number;
    title: string;
    user: GithubUser;
}

export interface GithubCommit {
    //Currently we don't care about any commit information, just their count on a given PR.
    //Fields to be added as the application requires them to avoid early complexity.
}

export interface PullDetails {
    id: number;
    number: number;
    title: string;
    author: string;
    commitCount: number
}