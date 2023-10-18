import { useState } from "react";

// APP COMPONENT
export default function App() {
  return (
    <div>
      <Table />
    </div>
  );
}

// TABLE COMPONENT
function Table() {
  // STATES

  // MAIN DATA TO RENDER ROW INTO THE TABLE
  const [tableRowData, setTableRowData] = useState(function () {
    const storedData = localStorage.getItem("rowData");
    // console.log(JSON.parse(storedData));
    if (!storedData) return [];
    return JSON.parse(storedData);
  });

  // STORES AVAILABLE DATES BASED ON START AND END DATE
  const [availableDates, setavAilableDates] = useState([]);

  // JSX
  return (
    <table className="table">
      {/* TABLE HEAD */}
      <thead>
        <TableHead />
      </thead>

      <tbody>
        {/* TABLE INPUT COMPONENT */}
        <TableInput
          tableRowData={tableRowData}
          setTableRowData={setTableRowData}
          availableDates={availableDates}
          setavAilableDates={setavAilableDates}
        />
        {/* CONDITIONALLY RENDERING THE TABLE ROW */}
        {tableRowData.length > 0 &&
          tableRowData.map((data, i) => (
            <TableRow data={data} key={i} availableDates={availableDates} />
          ))}
      </tbody>
    </table>
  );
}

// HEADINGS FOR THE TABLE
function TableHead() {
  return (
    <tr>
      <th>Action</th>
      <th>ID</th>
      <th>Start Date</th>
      <th>End Date</th>
      <th>Month</th>
      <th>Dates Excluded</th>
      <th>Number of Days</th>
      <th>Lead Count</th>
      <th>Expected DRR</th>
      <th>Last Updated</th>
    </tr>
  );
}

function TableInput({
  tableRowData,
  setTableRowData,
  availableDates,
  setavAilableDates,
}) {
  // STATES
  const [count, setCount] = useState(1); //ID
  const [startDate, setStartDate] = useState(""); //START DATE
  const [endDate, setEndtDate] = useState(""); //END DATE
  const [leadCount, setLeadCount] = useState(""); // LEAD COUNT

  const [excludedDates, setExcludedDates] = useState([]); // ARRAY TO STORE THE EXCLUDED DATES

  // DERIVED STATES
  const computedStartDate = intoComputableDate(startDate); //REAL DATE VALUES THAT CAN BE USED DIRECTLY IN OTHER FUNCTIONS
  const computedEndDate = intoComputableDate(endDate); //...
  // EXPECTED DRR CALCULATING FROM LEAD COUNT
  const expectedDRR = leadCount / 20;

  // FUNCTION TO CONVERT THE DATE STRING TO DATE OBJECT
  function intoComputableDate(dateStr) {
    const formated = dateStr.split("-");
    const date = new Date();

    date.setFullYear(formated[0], formated[1] - 1, formated[2]);

    return date;
  }

  // FUNCTION TO CHECK THE END DATE IS ALWAYS A FUTURE DATE THAN THE START DATE
  function isValid(date1, date2) {
    // DEFAULT
    let isValidDate = false;

    // CHECKING WHEATHER THE SELECTED END DATE MONTH IS SAME AS START DATE MONTH
    const isSameMonth =
      intoComputableDate(date2).getMonth() - date1.getMonth() === 0;

    // CHECKING THE YEAR AS A LAST HOPE TO SEE IF THE END DATE IS ACTUALLY A FUTURE DATE
    const isValidYear =
      intoComputableDate(date2).getFullYear() - date1.getFullYear() > 0;

    //IF THE END DATE MONTH IS SAME THEN CHECK THE DATE
    if (isSameMonth) {
      isValidDate = (intoComputableDate(date2) - date1) / (86400 * 1000) > 1; // SHOULD BE TRUE OR FALSE BASED ON END DATE
    } else {
      // IF THE END DATE MONTH IS DIFFERENT THE RETURN WITHOUT ANY DUES
      return true;
    }

    // RESULTS (USED FOR CONDITIONAL RENDERS)
    if (isValidDate) return true;
    if (isValidYear) return true;

    return false;
  }

  // HANDLER FUNCTION FOR SAVE BUTTON
  function handleSave() {
    // GUARD FUNCTION (CHECKING ALL THE REQUIRED FIELDS ARE NOT EMPTY)
    if (!startDate || !endDate || !leadCount) return;

    // INCREMENTING THE ID
    setCount((count) => count + 1);

    // INITIALISING A DATA OBJECT FOR EACH ROW IN A TABLE
    const data = {
      count,
      startDate,
      endDate,
      month: computedStartDate.getMonth() + 1,
      excludedDates,
      numDays:
        excludedDates.length === 0
          ? availableDates.length
          : availableDates.length - excludedDates.length,
      leadCount,
      expectedDRR,
      lastUpdatedDate: new Date().toLocaleDateString(),
      lastUpdatedTime: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
    };

    localStorage.setItem("rowData", JSON.stringify([data, ...tableRowData]));

    // RENDERING THE TABLE ROW
    setTableRowData((row) => [data, ...row]);

    //RESETTING AFTER SAVE
    handleCancel();
  }

  // HANDLER FUNCTION FOR CANCEL BUTTON
  function handleCancel() {
    // RESETTING THE REQUIRED STATES
    setStartDate("");
    setEndtDate("");
    setExcludedDates([]);
    setLeadCount("");
  }

  // FUNCTIONTO CHECK THE EXCLUDED DATE IS BETWEEN THE START AND END DATE
  function isOkToExclude(date1, date2, excludeDate) {
    // MILLI SECONDS I A DAY
    const day = 24 * 60 * 60 * 1000;

    let dates = [];

    while (date1 <= date2) {
      dates.push(date1.toLocaleDateString());
      // ADDING A DAY FOR EVERY ITERATION
      date1.setTime(date1.getTime() + day);
    }
    // UPDATING THE AVAILABLE DATES ARRAY
    setavAilableDates(dates);

    return {
      dates: dates,
      result: dates.includes(excludeDate.toLocaleDateString()),
    };
  }

  //JSX
  return (
    <tr>
      <td>Action</td>
      <td>{count}</td>
      <td>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </td>
      <td>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            if (!startDate) return;

            if (isValid(computedStartDate, e.target.value)) {
              setEndtDate(e.target.value);
              isOkToExclude(
                computedStartDate,
                intoComputableDate(e.target.value),
                computedStartDate
              );
            }
          }}
        />
      </td>
      <td>{startDate ? computedStartDate.getMonth() + 1 : "Month"}</td>
      <td>
        <input
          type="date"
          value={excludedDates}
          onChange={(e) => {
            const { dates, result } = isOkToExclude(
              computedStartDate,
              computedEndDate,
              intoComputableDate(e.target.value)
            );
            console.log(dates);

            if (!result) return;
            if (excludedDates.includes(e.target.value)) return;
            setExcludedDates((ed) => [...ed, e.target.value]);
          }}
        />
        <p>
          {/* RENDERING THE EXCLUDED DATES EXERY TIME WHEN A VALID DATE IS ADDED */}
          {excludedDates.length > 0 &&
            excludedDates.map((date) => (
              <span className="block" key={date}>
                {date}
              </span>
            ))}
        </p>
      </td>
      <td>
        {/* CONDITIONALLY RENDERING THE NUMBER OF DAYS WHEN THERE IS A DAY TO EXCLUDE */}
        {excludedDates.length > 0
          ? availableDates.length - excludedDates.length
          : "Days"}
      </td>
      <td>
        <input
          type="number"
          value={leadCount}
          onChange={(e) => setLeadCount(e.target.value)}
        />
      </td>
      <td>
        <input type="number" disabled />
      </td>
      <td>
        {/* SAVE BUTTON */}
        <div className="btns">
          <button onClick={handleSave} className=" btn btn-save">
            Save
          </button>

          {/* CANCEL BUTTON */}
          <button onClick={handleCancel} className="btn btn-cancel">
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// TABLE ROW COMPONENT
function TableRow({ data, availableDates }) {
  // DESTRUCTURING THE DATA OBJECT
  const {
    action,
    count,
    startDate,
    endDate,
    month,
    excludedDates,
    numDays,
    leadCount,
    expectedDRR,
    lastUpdatedDate,
    lastUpdatedTime,
  } = data;

  // RENDERING THE TABLE DATA WITH ITS NECESSARY VALUES
  return (
    <tr>
      <td>{action}</td>
      <td>{count}</td>
      <td>{startDate}</td>
      <td>{endDate}</td>
      <td>{month}</td>
      <td>
        {excludedDates.length > 0
          ? excludedDates.map((date) => <span className="block">{date}</span>)
          : "No Dates"}
      </td>
      {/* I FOUND THIS BUG IN LAST MINUTE, IF THERE IS NO EXCLUDED DATE THE NUMBER OF DAYS SIMPLY BECOMES 0. SO I FOUND THIS QUICK WAY TO PATCH IT UP */}
      <td>{!numDays ? availableDates.length : numDays}</td>
      <td>{leadCount}</td>
      <td>{expectedDRR}</td>
      <td>
        <span className="block">{lastUpdatedDate}</span>
        <span>{lastUpdatedTime}</span>
      </td>
    </tr>
  );
}
