import { useState, useEffect } from 'react';
import chroma from "chroma-js";
import { format } from 'sql-formatter';
import './App.css';

function App() {
  const [dataset, setDataset] = useState("classic_new");
  const [searchPattern, setSearchPattern] = useState(null);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState([]);
  const [siderVisible, setSiderVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showProbs, setShowProbs] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const getData = async () => {
    const response = await fetch(`/${dataset}.json`);
    let data = await response.json()

    if (searchPattern) {
      data = data.filter((item) => item.question.toLowerCase().includes(searchPattern) || item.generated_query.toLowerCase().includes(searchPattern));
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

  const getBackgroundColor = (prob) => {
    return chroma.scale(['pink', 'yellow', 'lightgreen']).domain([0.15, 0.3, 1])(prob).hex();
  }

  const formatSql = (sql) => {
    if (!sql) {
      return '';
    }

    // remove all curly braces
    sql = sql.replace(/{/g, '');
    sql = sql.replace(/}/g, '');
    
    try {
      return format(sql, { language: 'postgresql' });
    } catch (e) {
      return sql;
    }
  }

  useEffect(() => {
    getData(dataset);
  }, [dataset, searchPattern]);

  return (
    <div className="App">
      <h1>Eval Visualizer</h1>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
      }}>
        <div id="options">
          <h3>Eval Type</h3>
          <select
            style={{ width: 120 }}
            value={dataset}
            onChange={
              (ev) => {
                setDataset(ev.target.value);
              }
            }
          >
            <option value="classic_new">v1</option>
            <option value="basic_new">Basic</option>
            <option value="advanced_new">Advanced</option>
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
              setSearchPattern(ev.target.value);
            }}
          />
        </div>
      </div>
      
      <div id="summary-statistics">
        <h3>Summary Statistics</h3>
        <p>Number of records: {data.length}</p>
        <p>Total Correct: {data.filter((item) => item.correct === 1).length} ({100*(data.filter((item) => item.correct === 1).length/data.length)})%</p>
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
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  width: "100%",
                  maxWidth: 600,
                }}
              >
                {data.filter((item) => item.query_category === category)
                .sort((item) => item.correct === 1 ? -1 : 1)
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
          maxWidth: "100%",
          height: "100%",
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
        
        <p>
          Formatted Query
          <label className="switch" style={{
            marginBottom: -8,
            marginLeft: 5,
            marginRight: 5,
          }}>
            <input
              type="checkbox"
              className="slider"
              id="detail-button"
              checked={showProbs}
              onChange={() => setShowProbs(
                (prev) => !prev
              )} />
            <span className="slider round"></span>
          </label>
          Probabilities
        </p>
        
        <p>Generated Query:</p>
        {
          showProbs ?
          <div>
            <div style={{
              width: "80%",
              paddingBottom: 200
            }}>
            {(selectedItem?.logprobs || []).map(
              (item, idx) => {
                return (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: getBackgroundColor(item?.rank_1_prob),
                      padding: 1,
                      margin: 1,
                      borderRadius: 3,
                      // hover pointer
                      cursor: "pointer",
                    }}
                    // on hover, show the query in a floating div
                    onMouseEnter={(ev) => {
                      setSelectedToken(item);
                      const floatingDiv = document.getElementById("floating-div");
                      floatingDiv.style.visibility = "visible";
                      floatingDiv.style.top = ev.clientY + 10 + "px";
                      floatingDiv.style.left = ev.clientX + "px";
                    }}
                    onMouseLeave={() => {
                      const floatingDiv = document.getElementById("floating-div");
                      floatingDiv.style.visibility = "hidden";
                    }}
                  >
                    {item['rank_1_token']}
                  </span>
                );
              }
            )}
            {/* floating div */}
            <div
              id="floating-div"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: 250,
                height: 250,
                backgroundColor: "white",
                border: "1px solid black",
                zIndex: 1000,
                visibility: "hidden",
              }}
            >
              <div>Top token: <code>{selectedToken?.rank_1_token}</code></div>
              <div>Probability of top token: {selectedToken?.rank_1_prob.toFixed(2)}</div>
              <div>Second token: <code>{selectedToken?.rank_2_token}</code></div>
              <div>Probability of second token: {selectedToken?.rank_2_prob.toFixed(2)}</div>
              <div
                style={{
                  backgroundColor: getBackgroundColor(selectedToken?.rank_1_prob - selectedToken?.rank_2_prob),
                  padding: 1,
                  margin: 1,
                  borderRadius: 3,
                }}
              >Probability difference: {(selectedToken?.rank_1_prob - selectedToken?.rank_2_prob).toFixed(2)}</div>
            </div>
          </div>
          </div> :
          <pre>{formatSql(selectedItem?.generated_query)}</pre>
        }
        {selectedItem?.error_db_exec === 1 ? <p>Error Message: <pre>{selectedItem?.error_msg}</pre></p> : null}
      </div>
    </div>
  );
}

export default App;
