import { useState, useEffect } from 'react'
import LogProbsVisualizer from './LogProbsVisualizer';
import Switch from './Switch';
import AttentionVisualizer from './AttentionVisualizer';

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

  const getData = async () => {
    const response = await fetch(`/${dataset}`);
    let data = await response.json()

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

    if (maxConfidence) {
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
    console.log(files);
    setAvailableFiles(files);
    setDataset(files[0]);
  }

  useEffect(() => {
    getFiles();
  }, []);

  useEffect(() => {
    getData(dataset);
  }, [dataset, searchPattern, maxConfidence]);

  return (
    <div>
      <div className="flex">
        <div id="options">
          <h3>Eval Type</h3>
          <select
            style={{ width: 240 }}
            value={dataset}
            onChange={
              (ev) => {
                setDataset(ev.target.value);
              }
            }
          >
            {availableFiles.map((file) => {
              return (
                <option key={file} value={file}>{file}</option>
              );
            })}
          </select>
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
            <>
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
                      className={item.error_db_exec === 1 ? "cell error-cell" : "cell"}
                      style={{
                        backgroundColor: item.correct === 1 ? "green" : "red",
                      }}
                      onClick={() => {
                        selectedItem?.question === item.question && siderVisible ?
                          setSiderVisible(false) :
                          setSiderVisible(true)
                        setSelectedItem(item);
                      }}
                    >
                      &nbsp;
                    </span>
                  );
                })}
              </div>
            </>
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
        {selectedItem?.instructions ? <p>Instructions: <pre>{selectedItem.instructions}</pre></p> : null}
        
        <div>
          <p>Golden Query: <pre>{formatSql(selectedItem?.query)}</pre></p>
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
          Show Modal
        </button>

        <Switch
          uncheckedLabel={'Show Query'}
          checkedLabel={'Show Logprobs'}
          checked={showProbs}
          setChecked={setShowProbs}
        />
        
        <p>Generated Query:</p>
        {
          showProbs ?
          <LogProbsVisualizer
            selectedItem={selectedItem}
            getBackgroundColor={getBackgroundColor}
          />
          :
          <pre>{formatSql(selectedItem?.generated_query)}</pre>
        }
        {selectedItem?.error_db_exec === 1 ? <p>Error Message: <pre>{selectedItem?.error_msg}</pre></p> : null}

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