## To test query changes on Tama using this repo:
* Run `npm i`
* Add the original query (from Tama repo main branch) to `queryBefore.txt`.
* Add the query with your changes to `queryAfter.txt`.
* Create `credentials.json` with your GCP credentials.
* In case you want to use the initial query with the result queries, add them to the array on `resultArrays.js`.
* Run `npm start` with the needed args as explained below.
* If the results we're not identical they will be saved in `before.json` and `after.json`, you can use vscode to compare them or any other way.

## Args you can pass to the terminal
* `projectId` Your project id on GCP.
* `fromDate` Starting date to use in the query, its format should be `yyyy-mm-dd`. Default value is the current day.
* `toDate` End date to use in the query, its format should be `yyyy-mm-dd`. Default value is 3 days before `fromDate`.
* `useResult` If it's set to `true` the initial queries will be replace to the queries from the `result` arrays in `resultArrays.js`.
* `saveResults` it can be set to `false` or `true` the results will be saved in `before.json` and `after.json` to override the default behavior. By default the results will be save in case they were not identical only.
* `sort` To pass a value to `ORDER BY` on the final query for the query before and after.
* `limit` To pass a value to `LIMIT` on the final query for the query before and after.

- Example: `npm start sort="authorName desc, authorId, views" limit=1000 fromDate=2023-01-01 toDate=2023-01-30`