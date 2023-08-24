import fs from "fs";
import { BigQuery } from "@google-cloud/bigquery";
import { isEqual } from "json-assert";

const tables = {
  authorView: "api-project-901373404215.Content.author",
  contentView: "api-project-901373404215.Content.content",
  cordialSupplementViewRealTime: "api-project-901373404215.cordial.supplements_realtime",
  cordialSupplementView: "api-project-901373404215.cordial.supplements",
  dataTableRealTime: "api-project-901373404215.DataMart.DataMart6_RT",
  dataTable: "api-project-901373404215.DataMart.DataMart7_Base",
  dataViewRealTime: "forbes-tamagotchi.Tamagotchi.v_DataMart6_RealTime",
  dataView: "forbes-tamagotchi.Tamagotchi.v_DataMart7",
  mainViewRealTime: "forbes-tamagotchi.Tamagotchi.v_Main6_RealTime",
  mainView: "forbes-tamagotchi.Tamagotchi.v_Main7",
  eventsTable: "api-project-901373404215.DataMart.Events_DataMart2",
  eventsView: "forbes-tamagotchi.Tamagotchi.v_Events_DataMart2",
  gaSessionsTable: "api-project-901373404215.206396628.ga_realtime_sessions_view",
  gscWebQueryTable: "api-project-901373404215.gsc.gsc_web_query",
  visitorInsightsTable: "api-project-901373404215.DataMart.FUSE7",
};

const args = {};

let bigquery = new BigQuery(options);

async function compareQueries() {
  pareArgs();
  if (args.fromDate && args.toDate) {
    const queryBefore = prepQuery("queryBefore", args);
    const queryAfter = prepQuery("queryAfter", args);

    if(queryBefore && queryAfter) {
      const options = {
        keyFilename: "credentials.json",
        projectId: args.projectId,
      };

      bigquery = new BigQuery(options);

      const [resBefore, resAfter] = await Promise.all([
        queryBatch(queryBefore),
        queryBatch(queryAfter),
      ]);

      if (isEqual(resBefore, resAfter, true)) {
        console.log("Results are identical 🔥");
      } else {
        console.log("Results not are identical 👹");
        await Promise.all([
          saveResults(resBefore, "before"),
          saveResults(resAfter, "after"),
        ]);
      }
    } else {
      console.error("queryAfter.txt or queryBefore.txt is empty");
    }
  } else {
    console.error("Please pass from and to date value");
  }
}

function pareArgs() {
  process.argv.slice(2).forEach((arg) => {
    const [k, v] = arg.split("=");
    args[k] = v;
  });
}

function prepQuery(title, args) {
  let query = fs.readFileSync(`${title}.txt`, "utf8");
  if (query) {
    const { fromDate, toDate, sort, limit } = args;

    query = query.replaceAll("@fromDate", `DATE(${fromDate})`);
    query = query.replaceAll("@toDate", `DATE(${toDate})`);
    query = query.replaceAll(/[\$\\\`{}]|configService\.|authorView|contentView|cordialSupplementViewRealTime|cordialSupplementView|dataTableRealTime|dataTable|dataViewRealTime|dataView|mainViewRealTime|mainView|eventsTable|eventsView|gaSessionsTable|visitorInsightsTable|gscWebQueryTable/g,
      (m) => tables[m] || ""
    );
    query = sort ? `${query} ORDER BY ${sort}` : query;
    query = limit ? `${query} LIMIT ${limit}` : query;
  }

  return query;
}

async function queryBatch(query) {
  const queryJobConfig = {
    query,
    useLegacySql: false,
    priority: "BATCH",
    allowLargeResults: true,
  };

  const jobConfig = {
    configuration: {
      query: queryJobConfig,
    },
  };

  const [job] = await bigquery.createJob(jobConfig);

  const jobId = job.metadata.id;
  const state = job.metadata.status.state;
  console.log(`Job ${jobId} is currently in state ${state}`);

  const [rows] = await job.getQueryResults({ autoPaginate: false });

  return rows;
}

async function saveResults(rows, destination) {
  console.log(`Saving results to ${destination}.json`);
  await fs.writeFileSync(`${destination}.json`, JSON.stringify(rows, null, 3));
  console.log(`Done Saving ${rows.length} rows to ${destination}.json`);
}

compareQueries();
