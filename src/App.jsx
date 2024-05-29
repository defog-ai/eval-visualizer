import { useState } from 'react';
import chroma from "chroma-js";
import { format } from 'sql-formatter';
import EvalVisualizerSingle from './components/EvalVisualizerSingle';
import FreeForm from './components/FreeForm';
import './App.css';

function App() {

  const getBackgroundColor = (prob) => {
    return chroma.scale(['pink', 'yellow', 'lightgreen']).domain([0.15, 0.3, 1])(prob).hex();
  }

  const formatSql = (sql) => {
    // if sql is empty, undefined, or null, return empty string
    if (!sql) {
      return '';
    }

    // remove all curly braces
    try {
      sql = sql.replace(/{/g, '');
      sql = sql.replace(/}/g, '');
    } catch (e) {
      return sql;
    }
    
    try {
      return format(sql, { language: 'postgresql' });
    } catch (e) {
      return sql;
    }
  }


  const [view, setView] = useState('single');

  return (
    <div className="App">
      <h2>Welcome to eval visualizer. What would you like to do?</h2>
      <select
        value={view}
        onChange={(ev) => {
          setView(ev.target.value);
        }}
      >
        <option value="single">View a standalone eval</option>
        <option value="compare">Compare two evals</option>
        <option value="freeform">Ask a question and see logprobs</option>
      </select>
      {
        view === 'single' ?
        <EvalVisualizerSingle
          getBackgroundColor={getBackgroundColor}
          formatSql={formatSql}
        /> : view === 'compare' ?
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <EvalVisualizerSingle
            getBackgroundColor={getBackgroundColor}
            formatSql={formatSql}
            showMaxConfidenceSlider={false}
          />
          <EvalVisualizerSingle
            getBackgroundColor={getBackgroundColor}
            formatSql={formatSql}
            showMaxConfidenceSlider={false}
          />
        </div> :
        <FreeForm
          getBackgroundColor={getBackgroundColor}
          formatSql={formatSql}
        />
      }
    </div>
  );
}

export default App;
