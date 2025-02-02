import { useState, useEffect } from 'react'
import LogProbsVisualizer from './LogProbsVisualizer';
import Switch from './Switch';
import AttentionVisualizer from './AttentionVisualizer';
import ResultsTable from './ResultsTable';
const EvalVisualizerSingle = ({
  getBackgroundColor,
  formatSql,
  showMaxConfidenceSlider = true,
}) => {

  const [dataset, setDataset] = useState("");
  const [searchPattern, setSearchPattern] = useState(null);
  const [maxConfidence, setMaxConfidence] = useState(1);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState([]);
  const [siderVisible, setSiderVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showProbs, setShowProbs] = useState(false);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [goldenQueryResult, setGoldenQueryResult] = useState(null); // Store the results of the golden query
  const [generatedQueryResult, setGeneratedQueryResult] = useState(null); // Store the results of the generated query]
  const [errorMessage, setErrorMessage] = useState({"golden": null, "generated": null}); // Store the error message for the golden and generated queries
  const [resultsSource, setResultsSource] = useState(""); // Store the source of the results (postgresgolden or dialct golden)
  const [loading, setLoading] = useState(false);


  const getData = async () => {
    if (!dataset) {
      return;
    }
    setLoading(true);
    // check if dataset is part of availableFiles
    let urlToFetch;
    if (availableFiles.includes(dataset)) {
      urlToFetch = `/${dataset}`;
    } else {
      urlToFetch = `${import.meta.env.VITE_BUCKET_ENDPOINT}/${dataset}.json`;
    }
    const response = await fetch(urlToFetch);
    let data = await response.json();
    setLoading(false);

    // sort by db_name, then question
    data = data.sort((a, b) => {
      if (a.db_name < b.db_name) {
        return -1;
      } else if (a.db_name > b.db_name) {
        return 1;
      } else {
        if (a.question < b.question) {
          return -1;
        } else if (a.question > b.question) {
          return 1;
        } else {
          return 0;
        }
      }
    });

    if (searchPattern) {
      data = data.filter((item) => item.question.toLowerCase().includes(searchPattern) || item.generated_query.toLowerCase().includes(searchPattern));
    }

    if (maxConfidence && data[0]?.logprobs) {
      // check if the min of all rank_1_probs is less than maxConfidence
      data = data.filter((item) => {
        return item?.logprobs.reduce((acc, item) => {
          return Math.min(acc, item.rank_1_prob);
        }, 1) <= maxConfidence;
      });
    }

    const cats = [];
    data.forEach((item) => {
      if (!cats.includes(item.query_category)) {
        cats.push(item.query_category);
      }
    });
    setData(data);
    setCategories(cats);
  }

  const getFiles = async () => {
    const response = await fetch(`/fnames.json`);
    const files = await response.json();
    setAvailableFiles(files);
    setDataset(files[0]);
  }

  useEffect(() => {
    getFiles();
  }, []);

  useEffect(() => {
    getData(dataset);
  }, [dataset, searchPattern, maxConfidence]);

  const runQuery = async (queryType) => {
    if (!selectedItem) {
      return;
    }
  
    const queryToRun = queryType === "golden" ? selectedItem.query : selectedItem.generated_query;
  
    try {
      const response = await fetch('http://localhost:8000/run_query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryToRun, // Run either the golden or generated query
          db_type: selectedItem.db_type.toLowerCase(), // Use the selected db type
          db_name: selectedItem.db_name, // Use the selected db name
        }),
      });
  
      const result = await response.json();
  
      if (queryType === "golden") {
        setGoldenQueryResult(result.result); // Store golden query result
        setResultsSource(""); // Reset results source
        setErrorMessage(prev => ({ ...prev, golden: null })); // Clear golden query error
      } else {
        setGeneratedQueryResult(result.result); // Store generated query result
        setErrorMessage(prev => ({ ...prev, generated: null })); // Clear generated query error
      }
    } catch (error) {
      console.error('Error running query:', error);
      if (queryType === "golden") {
        setErrorMessage(prev => ({ ...prev, golden: 'Failed to execute the golden query' })); // Set error for golden query
      } else {
        setErrorMessage(prev => ({ ...prev, generated: 'Failed to execute the generated query' })); // Set error for generated query
      }
    }
  };  
  
  const runPostgresGoldenQuery = async () => {
    if (!selectedItem) {
      return;
    }
  
    const question = selectedItem.question;
    const datasetName = dataset.toLowerCase();
  
    // Determine which JSON file to use based on the dataset name.
    let jsonFile;
    if (datasetName.includes("advanced")) {
      jsonFile = "api_advanced_cot.json";
    } else if (datasetName.includes("v1")) {
      jsonFile = "api_v1_cot.json";
    } else if (datasetName.includes("basic")) {
      jsonFile = "api_basic_cot.json";
    } else {
      console.error("No matching JSON file found for the dataset.");
      setErrorMessage(prev => ({ ...prev, golden: 'No matching JSON file found for the dataset.' }));
      return;
    }
  
    try {
      // Fetch the JSON file and search for the golden query corresponding to the question.
      const jsonResponse = await fetch(`/${jsonFile}`);
      const jsonData = await jsonResponse.json();
  
      // Find the matching golden query for the selected question.
      const matchedItem = jsonData.find(item => item.question === question);
      if (!matchedItem) {
        console.error('Question not found in the selected JSON file.');
        setErrorMessage(prev => ({ ...prev, golden: 'Question not found in the selected JSON file.' }));
        return;
      }
  
      const queryToRun = matchedItem.query;
  
      // Run the selected query.
      const response = await fetch('http://localhost:8000/run_query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryToRun,
          db_type: 'postgres',
          db_name: selectedItem.db_name,
        }),
      });
  
      const result = await response.json();
      setGoldenQueryResult(result.result);
      setResultsSource("postgresgolden");
      setErrorMessage(prev => ({ ...prev, golden: null }));
    } catch (error) {
      console.error('Error running query:', error);
      setErrorMessage(prev => ({ ...prev, golden: 'Failed to execute the postgres golden query' }));
    }
  };
  
  return (
    <div className={loading ? 'loading': 'not-loading'}>
      <div className="flex">
        <div id="options">
          <h3>Eval Name</h3>
          <input
            type="text"
            list="run-names"
            onKeyDown={
              (ev) => {
                if (ev.key === "Enter") {
                  setDataset(ev.target.value);
                }
              }
            }>
            </input>
          <datalist id="run-names">
            {availableFiles.map((file) => {
              return (
                <option key={file} value={file}>{file}</option>
              );
            })}
          </datalist>
        </div>

        <div id="search">
          <h3>Question or SQL Pattern</h3>
          <input
            type="text"
            placeholder="Pattern..."
            style={{ width: 200 }}
            value={searchPattern}
            onChange={(ev) => {
              setSearchPattern(ev.target.value.toLowerCase());
            }}
          />
        </div>

        {showMaxConfidenceSlider && (<div id="slider-confidence">
          <h3>Min Top Prob Threshold</h3>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={maxConfidence}
            style={{ width: 200 }}
            onChange={(ev) => {
              setMaxConfidence(parseFloat(ev.target.value));
            }}
          />
          <span>{maxConfidence}</span>
        </div>)}
      </div>
      
      <div id="summary-statistics">
        <h3>Summary Statistics</h3>
        <div className="flex">
          <p><b>Number of records</b>: {data.length}</p>
          <p><b>Total Correct</b>: {data.filter((item) => item.correct === 1).length} ({100*(data.filter((item) => item.correct === 1).length/data.length).toFixed(3)})%</p>
          <p><b>Total Incorrect</b>: {data.filter((item) => item.correct === 0).length} ({100*(data.filter((item) => item.correct === 0).length/data.length).toFixed(3)})%</p>
        </div>
        
      </div>
      <div id="charts">
        {categories.map((category) => {
          return (
            <div key={category}>
              <h4>{category} ({
                100*(data.filter((item) => item.query_category == category).reduce(
                  (acc, item) => {
                    return acc + (item.correct === 1 ? 1 : 0);
                  }, 0
                ) / data.filter((item) => item.query_category == category).length).toFixed(2)
              } %)
              </h4>
              <div
                key={category}
                className="flex"
              >
                {data.filter((item) => item.query_category === category)
                // .sort((item) => item.correct === 1 ? -1 : 1)
                .map((item) => {
                  return (
                    // a table of hoverable cells with at most 10 columns
                    // each cell is colored by the correct/incorrect status
                    <span
                      key={item.question}
                      className={(item.error_db_exec === 1 && !(selectedItem?.question === item.question && siderVisible)) ? "cell error-cell" : "cell"}
                      style={{
                        backgroundColor: selectedItem?.question === item.question && siderVisible ? "grey" : item.correct === 1 ? "green" : "red",
                      }}
                      onClick={() => {
                        selectedItem?.question === item.question && siderVisible ?
                          setSiderVisible(false) :
                          setSiderVisible(true)
                        setSelectedItem(item);
                        setGoldenQueryResult(null); // Reset previous golden results
                        setGeneratedQueryResult(null); // Reset previous generated results
                        setErrorMessage({"golden": null, "generated": null}); // Reset previous error messages
                      }}
                    >
                      &nbsp;
                    </span>
                  );
                })}
              </div>
            </div>
          );})}
      </div>
      <div
        id="right-sider"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 600,
          height: "100%",
          maxWidth: "100%",
          backgroundColor: "white",
          padding: 20,
          borderLeft: "1px solid black",
          boxShadow: "-2px 0 5px -1px rgba(0,0,0,0.2)",
          zIndex: 100,
          visibility: siderVisible ? "visible" : "hidden",
          overflowY: "scroll",
        }}
      >
        {/* this is closable sider on the right of the screen */}
        <h3>Details <button onClick={() => {setSiderVisible(false);}}>Close</button></h3>
        <p
          style={{
            backgroundColor: selectedItem?.correct === 1 ? "lightgreen" : "pink"
          }}
        >
          Question: <i>{selectedItem?.question}</i>
        </p>
        <p>Database: <b>{selectedItem?.db_name}</b></p>
        {selectedItem?.instructions ? (
          <div>
            <p>Instructions:</p>
            <pre>{selectedItem.instructions}</pre>
          </div>
        ) : null}
        
        <div>
          {/* copy to clipboard button */}
          <p>Golden Query:</p>
          <pre>{formatSql(selectedItem?.query)}</pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedItem?.query);
              alert("Golden Query Copied to Clipboard!");
            }}
          >
            Copy Golden Query to Clipboard
          </button>
        </div>

        {/* Button for running the Golden Query */}
        <button
          onClick={() => runQuery("golden")}
          style={{
            backgroundColor: "blue",
            color: "white",
            padding: 10,
            borderRadius: 5,
            cursor: "pointer",
            marginBottom: "1em",
            marginTop: "2em",
          }}
        >
          Run Golden Query
        </button>

        {/* Postgres Golden Query button */}
        {selectedItem?.db_type.toLowerCase() !== "postgres" && (
          <button
            onClick={runPostgresGoldenQuery}
            style={{
              backgroundColor: "purple",
              color: "white",
              padding: 10,
              borderRadius: 5,
              cursor: "pointer",
              marginBottom: "1em",
              marginTop: "2em",
              marginLeft: "1em",
            }}
          >
            Run Postgres Golden Query
          </button>
        )}
        {/* Indicator that the results are from postgres golden query */}
        {resultsSource === "postgresgolden" && <p>Results of the reference postgres Golden Query:</p>}
        {/* Display results for Golden Query */}
        {goldenQueryResult && <ResultsTable results={goldenQueryResult} />}


        {errorMessage.golden && (
          <div style={{ color: 'red' }}>
            <h3>Error:</h3>
            <p>{errorMessage.golden}</p>
          </div>
        )}
        
        <Switch
          uncheckedLabel={'Show Query'}
          checkedLabel={'Show Logprobs'}
          checked={showProbs}
          setChecked={setShowProbs}
        />
        
        <div style={{
          paddingBottom: 200
        }}>
          <p>Generated Query:</p>
          {
            showProbs ?
            <LogProbsVisualizer
              selectedItem={selectedItem}
              getBackgroundColor={getBackgroundColor}
            />
            :
            <>
              <pre>{formatSql(selectedItem?.generated_query)}</pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedItem?.generated_query);
                  alert("Generated Query Copied to Clipboard!");
                }}
              >
                Copy Generated Query to Clipboard
              </button>
            </>
          }
          {selectedItem?.error_db_exec === 1 ? <p>Error Message: <pre>{selectedItem?.error_msg}</pre></p> : null}
          {selectedItem?.error_db_exec !== 1 && 
          <div>
            {/* Button for running the Generated Query */}
            <button
              onClick={() => runQuery("generated")}
              style={{
                backgroundColor: "green",
                color: "white",
                padding: 10,
                borderRadius: 5,
                cursor: "pointer",
                marginBottom: "1em",
                marginTop: "2em",
              }}
            >
              Run Generated Query
            </button>
          </div>
          }
          
          {/* Display results for Generated Query */}
          {generatedQueryResult && <ResultsTable results={generatedQueryResult} />}

          {/* Display error messages separately */}
          {errorMessage.generated && (
            <div style={{ color: 'red' }}>
              <h3>Error:</h3>
              <p>{errorMessage.generated}</p>
            </div>
          )}
          </div>

          <button
            onClick={() => {
              setModalVisible(true);
            }}
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: 10,
              borderRadius: 5,
              cursor: "pointer",
              marginBottom: "2em",
            }}
          >
            Show Attention Modal
          </button>
      </div>
      {modalVisible ? <div
        className="modal"
        style={{
          display: modalVisible ? "block" : "none",
          // modal is a full screen overlay with some padding on the sides
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 100,
          padding: 20,
          backgroundColor: "rgb(255, 255, 255)",
          overflowY: "scroll",
        }}
      >
        <AttentionVisualizer
          getBackgroundColor={getBackgroundColor}
          prompt={selectedItem?.prompt || ""}
        />
        <button
          onClick={() => {
            setModalVisible(false);
          }}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: 10,
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Close Modal
        </button>
      </div> : null}
    </div>
  )
}

export default EvalVisualizerSingle