import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { GitHubService } from './services/github';
import { ApiError } from './error/error';

dotenv.config();
const app = express();
const github = new GitHubService();

app.get('/:owner/:repo/pulls', async (req: Request, res: Response) => {
    const owner = req.params.owner;
    const repo = req.params.repo;

    try {
        const data = await github.getPullRequestsDetails(owner, repo);
        res.send(data);
    } catch (error) {
        const apiError = error as ApiError;
        res.status(apiError.httpCode).send(apiError)
    }
});

app.listen(3000, () => {
    console.log('App is listening on port 3000!');
});