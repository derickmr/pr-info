import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { GitHubService } from './services/github';
import { ApiError } from './error/error';
import { HttpStatusCode } from 'axios';

dotenv.config();

if (!process.env.GITHUB_TOKEN) {
    console.error('This app requires GitHub token to be set as GITHUB_TOKEN env var. More details in https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting. Exiting...');
    process.exit(1);
}  

const app = express();
const github = new GitHubService();

app.get('/:owner/:repo/pulls', async (req: Request, res: Response) => {
    const owner = req.params.owner;
    const repo = req.params.repo;

    try {
        const data = await github.getOpenPullRequestsDetails(owner, repo);
        res.send(data);
    } catch (error) {
        if (error instanceof ApiError) {
            const apiError = error as ApiError;
            res.status(apiError.httpCode).send(apiError)
        }
        res.status(HttpStatusCode.InternalServerError).send(error)
    }
});

app.listen(3000, () => {
    console.log('App is listening on port 3000!');
});